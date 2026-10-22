// Wild Beauty server entry (PLAN.md S6, TODO.md M1). Bun only.
import { resolve, sep } from 'node:path';
import { html } from './client/html.js';
import { App } from './client/components/App.js';
import { renderPage } from './server/ssr.js';
import { DEFAULT_LANG, languageList, loadLocales, negotiate } from './server/i18n.js';
import { config } from './server/config.js';
import { dev, log } from './server/log.js';
import { createUpload, deleteUpload, listUploads, readUploads, serveUpload } from './server/api/uploads.js';
import { capabilities, detectTools } from './server/media/tools.js';

const PORT = Number(process.env.PORT ?? 3000);
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
async function bootFor(lang) {
  const fallback = lang === DEFAULT_LANG ? {} : locales.get(DEFAULT_LANG);

  return { lang, messages: locales.get(lang), fallback, languages, limits: { maxBytes: config.maxBytes }, uploads: (await readUploads()).map(listed) };
}

async function page(lang, titleKey) {
  const boot = await bootFor(lang);
  const body = renderPage(html`<${App} boot=${boot} />`, {
    lang,
    dir: boot.messages['meta.dir'],
    title: boot.messages[titleKey],
    boot,
  });

  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'set-cookie': `wb-lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`,
    },
  });
}

function route(req) {
  const { pathname } = new URL(req.url);

  if(pathname === '/api/uploads') {
    if(req.method === 'POST') return createUpload(req);
    if(req.method === 'GET') return listUploads();

    return text('method not allowed\n', 405);
  }

  const upload = /^\/api\/uploads\/([^/]+)$/.exec(pathname);

  if(upload) return req.method === 'DELETE' ? deleteUpload(upload[1]) : text('method not allowed\n', 405);

  if(req.method !== 'GET' && req.method !== 'HEAD') return text('method not allowed\n', 405);

  if(pathname === '/api/capabilities') return Response.json(capabilities({ languages: languages.map(l => l.code), limits: { maxBytes: config.maxBytes } }));

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

const server = Bun.serve({ port: PORT, maxRequestBodySize: config.maxBytes, fetch: dev ? logged : route });

console.log(`wild-beauty listening on ${server.url}${dev ? ' (dev logging on)' : ''}`);
