// Wild Beauty server entry (PLAN.md S6, TODO.md M1). Bun only.
import { host, port } from './server/cli.js';
import { resolve, sep } from 'node:path';
import { html } from './client/html.js';
import { App } from './client/components/App.js';
import { renderPage } from './server/ssr.js';
import { DEFAULT_LANG, languageList, loadLocales, negotiate } from './server/i18n.js';
import { config } from './server/config.js';
import { dev, log } from './server/log.js';
import { clearUploads, createUpload, deleteUpload, listUploads, readUploads, serveUpload, sweepOrphans, sweepUploads } from './server/api/uploads.js';
import { lockRoute } from './server/api/locks.js';
import { createNode, deleteNodeRoute, largeRoute, listNodesRoute, listedNodes, putLargeRoute, readNode, updateNodeRoute, visibilityRoute, visibleNodes } from './server/api/nodes.js';
import { manifestResponse, workerResponse } from './server/pwa.js';
import { graphOf, graphRoute } from './server/api/graph.js';
import { placesRoute } from './server/api/places.js';
import { cutoutRoute } from './server/api/cutout.js';
import { segmentRoute } from './server/api/segment.js';
import { servePhoto } from './server/api/photos.js';
import { galleryChild, photoInfos } from './server/node/view.js';
import { nodeItems } from './client/gallery/items.js';
import { canView } from './server/api/nodes.js';
import { getNode, linksFrom } from './server/db/nodes.js';
import { database } from './server/db/db.js';
import { reconcile } from './server/node/reconcile.js';
import { sessionFor } from './server/session.js';
import { guard, mayWrite } from './server/guard.js';
import { loginRoute, logoutRoute, meRoute, registerRoute, viewerOf } from './server/auth.js';
import { siteFor } from './server/sites.js';
import { editLocation, resolve as resolvePage, robotsTxt, sitemap, sitemapXml } from './server/site.js';
import { peer, recordEvents } from './server/events.js';
import { capabilities, detectTools } from './server/media/tools.js';

// directories served as files: /static/ (assets), /app/ (browser modules),
// /vendor/ (libraries); the modules are served as-is, no build step
const ROOTS = {
  '/static/': resolve(import.meta.dir, 'static'),
  '/app/': resolve(import.meta.dir, 'client'),
  '/vendor/': resolve(import.meta.dir, 'vendor'),
};

const locales = loadLocales();
const languages = languageList(locales);

await detectTools();

// finish or undo what a crash during a save left behind (EDITOR.md S4)
{
  const done = await reconcile(await database());

  if(done.uploads.length || done.photos.length || done.files.length) log('reconcile', `${done.uploads.length} uploads, ${done.photos.length} photos, ${done.files.length} files removed`);
}

// uploads past their expiry go, at start and then every ten minutes
const sweep = () => {
  sweepUploads().then(gone => gone.length && log('sweep', `${gone.length} expired uploads removed`), () => {});

  try {
    const orphans = sweepOrphans();

    if(orphans.length) log('sweep', `${orphans.length} orphaned files removed`);
  } catch {}
};

await sweep();
setInterval(sweep, 10 * 60 * 1000).unref();

const text = (body, status) => new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

// map a request path below `prefix` to a file below `root`, or null when it
// would escape
function filePath(pathname, prefix, root) {
  let rel;

  try {
    rel = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }

  if(rel.includes('\0')) return null;

  const file = resolve(root, rel);

  return file.startsWith(root + sep) ? file : null;
}

async function serveFile(pathname, method, prefix, root, since) {
  const path = filePath(pathname, prefix, root);
  const file = path && Bun.file(path);

  if(!file || !(await file.exists())) return text('not found\n', 404);

  // the content type comes from the extension (Bun.file); set it explicitly
  // because Bun leaves it out of a HEAD response
  // The browser keeps its copy but asks again each time (modules are served as
  // they are, with no fingerprint in the name): without this header it reuses a
  // module for an unknown time, and an edited one is not seen. 304 when unchanged.
  const modified = Math.floor(file.lastModified / 1000) * 1000;
  const headers = { 'cache-control': 'no-cache', 'last-modified': new Date(modified).toUTCString() };

  if(since && Date.parse(since) >= modified) return new Response(null, { status: 304, headers });

  headers['content-type'] = file.type;
  headers['content-length'] = String(file.size);

  return new Response(method === 'HEAD' ? null : file, { headers });
}

// the part of a sidecar record the cards use (no EXIF, no tool output; `pos` is the rounded place for the editor's chip)
const listed = ({ hash, ext, display, name, size, mime, width, height, padding, pos, uploadedAt, expiresAt }) => ({ hash, ext, display, name, size, mime, width, height, padding, ...(pos && { pos }), uploadedAt, expiresAt });

// what the client needs to translate: this language, plus English as fallback
async function bootFor(lang, extra = {}, owner = null) {
  const fallback = lang === DEFAULT_LANG ? {} : locales.get(DEFAULT_LANG);

  return { lang, messages: locales.get(lang), fallback, languages, limits: { maxBytes: config.maxBytes, uploadDays: Math.max(1, Math.round(config.uploadTtlMs / 86400000)) }, uploads: extra.node || extra.graph || extra.gallery || extra.site ? [] : (await readUploads(owner)).map(listed), ...extra };
}

// `extra` adds to the boot JSON (the node page: `node` and `photos`);
// `title` replaces the translated page title
async function page(lang, titleKey, extra, title, req) {
  const viewer = req ? viewerOf(await database(), req) : null;
  const boot = await bootFor(lang, { ...(viewer && { user: { id: viewer.id, email: viewer.email, name: viewer.name } }), ...extra }, req ? sessionFor(req).owner : null);
  const body = renderPage(html`<${App} boot=${boot} />`, {
    lang,
    dir: boot.messages['meta.dir'],
    title: title ?? boot.messages[titleKey],
    boot,
  });

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'set-cookie': `wb-lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`,
    },
  });
}

// GET /:lang/new: the upload area, the editor and the saved nodes (E68)
// `?site=<id>` (from /edit/ on a site host) and `?edit=<node id>` ask for a login first, when there is
// none; with a login, `?edit=` opens that node in the editor
async function newPage(lang, req) {
  const h = await database();
  const viewer = viewerOf(h, req);
  const params = new URL(req.url).searchParams;
  const edit = /^\d{1,15}$/.test(params.get('edit') ?? '') ? Number(params.get('edit')) : null;
  const wanted = params.has('site') || edit !== null;

  return page(lang, 'page.title.new', { nodes: listedNodes(h, viewer), ...(wanted && !viewer && { loginRequired: true }), ...(edit !== null && viewer && { edit }) }, undefined, req);
}

// GET /:lang/gallery: every saved node as a picture of one 3D gallery ("Show")
async function galleryPage(lang, req) {
  const h = await database();

  return page(lang, 'page.title.gallery', { gallery: { items: nodeItems(visibleNodes(h, viewerOf(h, req)), lang) } }, undefined, req);
}

// GET /:lang/tree: the graph of the nodes (preliminary demo of GRAPH.md)
async function treePage(lang, req) {
  const h = await database();

  return page(lang, 'page.title.tree', { graph: graphOf(h, viewerOf(h, req)) }, undefined, req);
}

// GET /:lang/node/:id: the saved node as a read-only page
async function nodePage(lang, id, req) {
  const h = await database();
  const viewer = viewerOf(h, req);
  const node = getNode(h, id);

  if(!node || !canView(node, viewer)) return text('not found\n', 404);

  // the children as the 3D gallery hangs them (GALLERY.md S5): the visible `child` edges in order
  const children = linksFrom(h, id, 'child').flatMap(({ id: to }) => {
    const child = getNode(h, to);

    return child && canView(child, viewer) ? [galleryChild(h, child)] : [];
  });
  const shown = { id: node.id, title: node.title, kind: node.kind, doc: node.doc, rev: node.rev, mine: mayWrite(node, viewer), children };
  const title = `${locales.get(lang)['page.title.node'] ?? 'Wild Beauty'} - ${node.title || locales.get(lang)['node.untitled'] || ''}`;

  return page(lang, 'page.title.node', { node: shown, photos: photoInfos(h, node.doc) }, title, req);
}

// A page of a site: the node in a centred stage, the navigation of the sitemap above it
async function sitePage(site, map, page, h) {
  const { node } = page;
  const nav = map.pages.map(p => ({ title: p.node.title, href: p.path, current: p === page }));
  const boot = await bootFor(site.lang, { site: { id: site.id, title: site.title, nav, node: { id: node.id, title: node.title, doc: node.doc } }, photos: photoInfos(h, node.doc) });
  const title = page === map.pages[0] ? site.title : `${node.title} - ${site.title}`;
  const body = renderPage(html`<${App} boot=${boot} />`, { lang: site.lang, dir: boot.messages['meta.dir'], title, theme: site.theme, boot, site: { color: site.color, icon: site.icon, canonical: `${site.url}${page.path}` } });

  return new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}

// What a site host answers (SITES.md): its pages, /edit/, the files the pages need.
// null lets the generic routes serve /static/, /vendor/, /app/, photos and the service worker.
async function siteRoute(req, site, pathname, h) {
  if(req.method !== 'GET' && req.method !== 'HEAD') return text('method not allowed\n', 405);

  if(/^\/(static|vendor|app)\//.test(pathname) || pathname.startsWith('/files/photos/') || pathname === '/sw.js') return null;

  if(pathname === '/manifest.webmanifest') return manifestResponse(site);
  const edit = editLocation(h, site, pathname);

  if(edit) return new Response(null, { status: 302, headers: { location: edit, 'cache-control': 'no-store' } });

  const map = sitemap(h, site);

  if(pathname === '/robots.txt') return new Response(robotsTxt(site), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  if(pathname === '/sitemap.xml') return new Response(sitemapXml(site, map), { headers: { 'content-type': 'application/xml; charset=utf-8' } });

  const found = resolvePage(map, pathname);

  if(found?.redirect) return new Response(null, { status: 301, headers: { location: found.redirect } });
  if(found?.page) return sitePage(site, map, found.page, h);

  return text('not found\n', 404);
}

async function route(req) {
  const { pathname } = new URL(req.url);

  const h = await database();
  const site = siteFor(req);

  if(site) {
    const answer = await siteRoute(req, site, pathname, h);

    if(answer) return answer;
  } else {
    if(pathname === '/api/login' && req.method === 'POST') return loginRoute(req, h);
    if(pathname === '/api/register' && req.method === 'POST') return registerRoute(req, h);
    if(pathname === '/api/logout' && req.method === 'POST') return logoutRoute(req, h);
    if(pathname === '/api/me' && req.method === 'GET') return meRoute(req, h);
  }

  const denied = await guard(req, pathname, h);

  if(denied) return denied;

  if(pathname === '/api/uploads') {
    if(req.method === 'POST') return createUpload(req);
    if(req.method === 'GET') return listUploads(req);
    if(req.method === 'DELETE') return clearUploads(req);

    return text('method not allowed\n', 405);
  }

  if(pathname === '/api/graph' || pathname === '/api/graph/ops') return graphRoute(req);

  if(pathname === '/api/places' || pathname === '/api/places/near' || pathname === '/api/places/suggestions') return placesRoute(req);

  if(pathname === '/api/segment') return req.method === 'POST' ? segmentRoute(req) : text('method not allowed\n', 405);

  if(pathname === '/api/cutout') return req.method === 'POST' ? cutoutRoute(req) : text('method not allowed\n', 405);

  if(pathname === '/api/events') return req.method === 'POST' ? recordEvents(req) : text('method not allowed\n', 405);

  const lock = /^\/api\/nodes\/([^/]+)\/lock$/.exec(pathname);

  if(lock) return lockRoute(req, lock[1]);

  if(pathname === '/api/nodes') return req.method === 'POST' ? createNode(req) : req.method === 'GET' ? listNodesRoute(undefined, req) : text('method not allowed\n', 405);

  const visibility = /^\/api\/nodes\/([^/]+)\/visibility$/.exec(pathname);

  if(visibility) return visibilityRoute(req, visibility[1]);

  const large = /^\/api\/nodes\/([^/]+)\/large$/.exec(pathname);

  if(large) return req.method === 'GET' || req.method === 'HEAD' ? largeRoute(large[1], undefined, { viewer: viewerOf(await database(), req) }) : req.method === 'PUT' ? putLargeRoute(req, large[1]) : text('method not allowed\n', 405);

  const node = /^\/api\/nodes\/([^/]+)$/.exec(pathname);

  if(node && (req.method === 'GET' || req.method === 'HEAD')) return readNode(req, node[1]);
  if(node && req.method === 'PUT') return updateNodeRoute(req, node[1]);
  if(node && req.method === 'DELETE') return deleteNodeRoute(node[1], undefined, req);

  const upload = /^\/api\/uploads\/([^/]+)$/.exec(pathname);

  if(upload) return req.method === 'DELETE' ? deleteUpload(upload[1], req) : text('method not allowed\n', 405);

  if(req.method !== 'GET' && req.method !== 'HEAD') return text('method not allowed\n', 405);

  if(pathname === '/api/capabilities') return Response.json(capabilities({ languages: languages.map(l => l.code), limits: { maxBytes: config.maxBytes } }));

  if(pathname.startsWith('/files/photos/')) {
    let name;

    try {
      name = decodeURIComponent(pathname.slice('/files/photos/'.length));
    } catch {
      return text('not found\n', 404);
    }

    return servePhoto(name, req);
  }

  if(pathname.startsWith('/files/uploads/')) {
    let name;

    try {
      name = decodeURIComponent(pathname.slice('/files/uploads/'.length));
    } catch {
      return text('not found\n', 404);
    }

    return serveUpload(name, req.method);
  }

  if(pathname === '/manifest.webmanifest') return manifestResponse();
  if(pathname === '/sw.js') return workerResponse();

  // the site opens on the 3D gallery of all nodes; the installed app starts at
  // /new (the manifest's start_url): the upload area and the editor. Both in the
  // visitor's language.
  if(pathname === '/' || pathname === '/new') {
    const location = new URL(`/${negotiate(locales, { req })}/${pathname === '/' ? 'gallery' : 'new'}`, req.url).href;

    return new Response(null, { status: 302, headers: { location, vary: 'Cookie, Accept-Language' } });
  }

  for(const [prefix, root] of Object.entries(ROOTS)) if(pathname.startsWith(prefix)) return serveFile(pathname, req.method, prefix, root, req.headers.get('if-modified-since'));

  const viewed = /^\/([a-z]{2,3})\/node\/(\d{1,15})$/.exec(pathname);

  if(viewed && locales.has(viewed[1])) return nodePage(viewed[1], Number(viewed[2]), req);

  const shown = /^\/([a-z]{2,3})\/gallery$/.exec(pathname);

  if(shown && locales.has(shown[1])) return galleryPage(shown[1], req);

  const tree = /^\/([a-z]{2,3})\/tree$/.exec(pathname);

  if(tree && locales.has(tree[1])) return treePage(tree[1], req);

  const m = /^\/([a-z]{2,3})\/new$/.exec(pathname);

  if(m && locales.has(m[1])) return newPage(m[1], req);

  return text('not found\n', 404);
}

// --dev or WB_DEV: one line per request and response (server/log.js)
async function logged(req) {
  const { pathname, search } = new URL(req.url);
  const started = performance.now();

  log('req', req.method, pathname + search, `content-length: ${req.headers.get('content-length') ?? '-'}`);

  let res;

  try {
    res = await route(req);
  } catch(e) {
    log('error', req.method, pathname, e?.stack ?? e);
    throw e;
  }

  log('res', res.status, req.method, pathname, `${Math.round(performance.now() - started)} ms`, `${res.headers.get('content-type') ?? '-'}`, `content-length: ${res.headers.get('content-length') ?? '-'}`);

  return res;
}

const server = Bun.serve({ port, hostname: host, maxRequestBodySize: config.maxBytes, idleTimeout: 180, fetch: dev ? logged : route });

peer.server = server;

console.log(`wild-beauty listening on ${server.url}${dev ? ' (dev logging on)' : ''}`);
