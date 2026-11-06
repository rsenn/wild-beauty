import { render } from '../vendor/preact-render-to-string.js';

const IMPORT_MAP = {
  imports: {
    preact: '/vendor/preact.js',
    'preact/hooks': '/vendor/hooks.js',
    htm: '/vendor/htm.js',
  },
};

const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s).replace(/[&<>"']/g, c => escapes[c]);

// JSON inside a <script>: no `<` can close the element or open a comment
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

// full HTML document for a page component; `boot` is the state the client
// adopts (read back from <script id=boot>), `theme` the id in static/themes/;
// `site` ({ color, icon, canonical }) is the head of a personal site (server/sites.js)
// instead of the wild-beauty one: its own icon and colour, no pixel fonts
// An installed app that starts again where the user was, in the editor or the viewer (docs/EDITOR.md S2.8b R5b, R7): the page is held behind a plain
// cover in the splash colour until the editor is in place, so the upload area never flashes by. client/editor/core/resume.js lifts it
// (releaseCover); this script lifts it itself after 1.5 s (COVER_MS) in any case. 43200000 ms = RESUME_HOURS.
const RESUME_HEAD = `<style>html[data-wb-resume]{background:#cdbfb0}html[data-wb-resume] body{visibility:hidden}</style>
<script>(function(){try{var r=JSON.parse(localStorage.getItem('wb-resume')||'null');var s=matchMedia('(display-mode: standalone)').matches||navigator.standalone;if(r&&(r.kind==='editor'||r.kind==='view')&&s&&!document.referrer&&Date.now()-r.at<43200000&&/^\\/[a-z]{2}\\/new$/.test(location.pathname)){var d=document.documentElement;d.setAttribute('data-wb-resume','');setTimeout(function(){d.removeAttribute('data-wb-resume')},1500)}}catch(e){}})()</script>
`;

export function renderPage(vnode, { lang, dir = 'ltr', title, theme = 'kraft', boot = {}, site = null, meta = '' }) {
  return `<!doctype html>
<html lang="${esc(lang)}" dir="${esc(dir)}" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>${meta ? `
${meta}` : ''}
${site ? `<link rel="icon" href="${esc(site.icon)}">` : '<link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="/static/img/favicon.png" sizes="32x32" type="image/png">'}
<link rel="manifest" href="/manifest.webmanifest">${site ? `
<link rel="canonical" href="${esc(site.canonical)}">` : `
<link rel="apple-touch-icon" href="/static/img/pwa-apple-180.png">`}
<meta name="theme-color" content="${esc(site ? site.color : '#cdbfb0')}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
${site ? '' : '<link rel="stylesheet" href="/static/fonts/stylesheet.css">\n'}<link rel="stylesheet" href="/static/css/layout.css">${site ? '\n<link rel="stylesheet" href="/static/css/site.css">' : ''}
<link rel="stylesheet" id="theme" href="/static/themes/${esc(theme)}.css">${boot.book ? '\n<link rel="stylesheet" href="/static/css/book.css">' : ''}
${site ? '' : RESUME_HEAD}<script type="importmap">${json(IMPORT_MAP)}</script>
</head>
<body>
<div id="app">${render(vnode)}</div>
<script type="application/json" id="boot">${json(boot)}</script>
<script type="module" src="/app/app.js"></script>
</body>
</html>
`;
}
