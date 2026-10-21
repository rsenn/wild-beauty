// Wild Beauty server entry (PLAN.md S6, TODO.md M1). Bun only.
import { resolve, sep } from 'node:path';
import { html } from './client/html.js';
import { App } from './client/components/App.js';
import { renderPage } from './server/ssr.js';
import { DEFAULT_LANG, languageList, loadLocales, negotiate } from './server/i18n.js';

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

// what the client needs to translate: this language, plus English as fallback
function bootFor(lang) {
  const fallback = lang === DEFAULT_LANG ? {} : locales.get(DEFAULT_LANG);

  return { lang, messages: locales.get(lang), fallback, languages };
}

function page(lang, titleKey) {
  const boot = bootFor(lang);
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

  if(req.method !== 'GET' && req.method !== 'HEAD') return text('method not allowed\n', 405);

  if(pathname === '/') {
    const location = new URL(`/${negotiate(locales, { req })}/new`, req.url).href;

    return new Response(null, { status: 302, headers: { location, vary: 'Cookie, Accept-Language' } });
  }

  for(const [prefix, root] of Object.entries(ROOTS)) if(pathname.startsWith(prefix)) return serveFile(pathname, req.method, prefix, root);

  const m = /^\/([a-z]{2,3})\/new$/.exec(pathname);

  if(m && locales.has(m[1])) return page(m[1], 'page.title.new');

  return text('not found\n', 404);
}

const server = Bun.serve({ port: PORT, fetch: route });

console.log(`wild-beauty listening on ${server.url}`);
