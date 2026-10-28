// Installable web app: the manifest and a service worker that only exists so
// browsers offer "install" (everything still comes from the network, so the
// session cookie and the uploads of a returning visitor work as in a tab).
export const COLOR = '#cdbfb0';

const manifest = {
  id: '/',
  name: 'Wild Beauty',
  short_name: 'Wild Beauty',
  start_url: '/new',
  scope: '/',
  display: 'standalone',
  background_color: COLOR,
  theme_color: COLOR,
  icons: [
    { src: '/static/img/pwa-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/static/img/pwa-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/static/img/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const worker = `// Wild Beauty service worker: no caching, requests go to the network as usual
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
`;

export const manifestResponse = () => new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'no-cache' } });

// served from the root so its scope is the whole site
export const workerResponse = () => new Response(worker, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache', 'service-worker-allowed': '/' } });
