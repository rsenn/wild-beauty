// Wild Beauty server entry (PLAN.md S6, TODO.md M1). Bun only.
import { host, port } from './server/cli.js';
import { resolve, sep } from 'node:path';
import { html } from './client/html.js';
import { App } from './client/components/App.js';
import { renderPage } from './server/ssr.js';
import { DEFAULT_LANG, languageList, loadLocales, negotiate } from './server/i18n.js';
import { config } from './server/config.js';
import { dev, log } from './server/log.js';
import { createUpload, deleteUpload, listUploads, readUploads, serveUpload } from './server/api/uploads.js';
import { lockRoute } from './server/api/locks.js';
import { createNode, deleteNodeRoute, readNode, updateNodeRoute } from './server/api/nodes.js';
import { servePhoto } from './server/api/photos.js';
import { photoInfos } from './server/node/view.js';
import { canView } from './server/api/nodes.js';
import { getNode } from './server/db/nodes.js';
import { database } from './server/db/db.js';
import { reconcile } from './server/node/reconcile.js';
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

async function serveFile(pathname, method, prefix, root) {
  const path = filePath(pathname, prefix, root);
  const file = path && Bun.file(path);

  if(!file || !(await file.exists())) return text('not found\n', 404);

  // the content type comes from the extension (Bun.file); set it explicitly
  // because Bun leaves it out of a HEAD response
  const headers = { 'content-type': file.type, 'content-length': String(file.size) };

  return new Response(method === 'HEAD' ? null : file, { headers });
}

// the part of a sidecar record the cards use (no EXIF, no tool output)
const listed = ({ hash, ext, display, name, size, mime, width, height, padding, uploadedAt }) => ({ hash, ext, display, name, size, mime, width, height, padding, uploadedAt });

// what the client needs to translate: this language, plus English as fallback
async function bootFor(lang, extra = {}) {
  const fallback = lang === DEFAULT_LANG ? {} : locales.get(DEFAULT_LANG);

  return { lang, messages: locales.get(lang), fallback, languages, limits: { maxBytes: config.maxBytes }, uploads: extra.node ? [] : (await readUploads()).map(listed), ...extra };
}

// `extra` adds to the boot JSON (the node page: `node` and `photos`);
// `title` replaces the translated page title
async function page(lang, titleKey, extra, title) {
  const boot = await bootFor(lang, extra);
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

// GET /:lang/node/:id: the saved node as a read-only page
async function nodePage(lang, id) {
  const h = await database();
  const node = getNode(h, id);

  if(!node) return text('not found\n', 404);
  if(!canView(node, null)) return text('forbidden\n', 403);

  const shown = { id: node.id, title: node.title, kind: node.kind, doc: node.doc, rev: node.rev };
  const title = `${locales.get(lang)['page.title.node'] ?? 'Wild Beauty'} - ${node.title || locales.get(lang)['node.untitled'] || ''}`;

  return page(lang, 'page.title.node', { node: shown, photos: photoInfos(h, node.doc) }, title);
}

function route(req) {
  const { pathname } = new URL(req.url);

  if(pathname === '/api/uploads') {
    if(req.method === 'POST') return createUpload(req);
    if(req.method === 'GET') return listUploads();

    return text('method not allowed\n', 405);
  }

  const lock = /^\/api\/nodes\/([^/]+)\/lock$/.exec(pathname);

  if(lock) return lockRoute(req, lock[1]);

  if(pathname === '/api/nodes') return req.method === 'POST' ? createNode(req) : text('method not allowed\n', 405);

  const node = /^\/api\/nodes\/([^/]+)$/.exec(pathname);

  if(node && (req.method === 'GET' || req.method === 'HEAD')) return readNode(req, node[1]);
  if(node && req.method === 'PUT') return updateNodeRoute(req, node[1]);
  if(node && req.method === 'DELETE') return deleteNodeRoute(node[1], undefined, req);

  const upload = /^\/api\/uploads\/([^/]+)$/.exec(pathname);

  if(upload) return req.method === 'DELETE' ? deleteUpload(upload[1]) : text('method not allowed\n', 405);

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

  if(pathname === '/') {
    const location = new URL(`/${negotiate(locales, { req })}/new`, req.url).href;

    return new Response(null, { status: 302, headers: { location, vary: 'Cookie, Accept-Language' } });
  }

  for(const [prefix, root] of Object.entries(ROOTS)) if(pathname.startsWith(prefix)) return serveFile(pathname, req.method, prefix, root);

  const viewed = /^\/([a-z]{2,3})\/node\/(\d{1,15})$/.exec(pathname);

  if(viewed && locales.has(viewed[1])) return nodePage(viewed[1], Number(viewed[2]));

  const m = /^\/([a-z]{2,3})\/new$/.exec(pathname);

  if(m && locales.has(m[1])) return page(m[1], 'page.title.new');

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

const server = Bun.serve({ port, hostname: host, maxRequestBodySize: config.maxBytes, fetch: dev ? logged : route });

console.log(`wild-beauty listening on ${server.url}${dev ? ' (dev logging on)' : ''}`);
