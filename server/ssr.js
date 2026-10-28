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
// adopts (read back from <script id=boot>), `theme` the id in static/themes/
export function renderPage(vnode, { lang, dir = 'ltr', title, theme = 'kraft', boot = {} }) {
  return `<!doctype html>
<html lang="${esc(lang)}" dir="${esc(dir)}" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="/static/img/favicon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/static/img/pwa-apple-180.png">
<meta name="theme-color" content="#cdbfb0">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="stylesheet" href="/static/fonts/stylesheet.css">
<link rel="stylesheet" href="/static/css/layout.css">
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
