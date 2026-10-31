// browser entry: adopt the server-rendered page
import { hydrate } from '../vendor/preact.js';
import { html } from './html.js';
import { App } from './components/App.js';
import { startTracking } from './events.js';
import { startReplay } from './replay.js';

const boot = JSON.parse(document.getElementById('boot').textContent);

hydrate(html`<${App} boot=${boot} />`, document.getElementById('app'));

startTracking();
startReplay(boot);

// installable app: a service worker that does not cache anything
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
