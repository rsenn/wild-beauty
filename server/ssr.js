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
export function renderPage(vnode, { lang, dir = 'ltr', title, theme = 'kraft', boot = {}, site = null }) {
  return `<!doctype html>
<html lang="${esc(lang)}" dir="${esc(dir)}" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="${esc(site ? site.icon : '/static/img/favicon.png')}">
<link rel="manifest" href="/manifest.webmanifest">${site ? `
<link rel="canonical" href="${esc(site.canonical)}">` : `
<link rel="apple-touch-icon" href="/static/img/pwa-apple-180.png">`}
<meta name="theme-color" content="${esc(site ? site.color : '#cdbfb0')}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
${site ? '' : '<link rel="stylesheet" href="/static/fonts/stylesheet.css">\n'}<link rel="stylesheet" href="/static/css/layout.css">${site ? '\n<link rel="stylesheet" href="/static/css/site.css">' : ''}
<link rel="stylesheet" id="theme" href="/static/themes/${esc(theme)}.css">
<script type="importmap">${json(IMPORT_MAP)}</script>
</head>
<body>
<div id="app">${render(vnode)}</div>
<script type="application/json" id="boot">${json(boot)}</script>
<script type="module" src="/app/app.js"></script>
</body>
</html>
`;
}
