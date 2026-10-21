// browser entry: adopt the server-rendered page
import { hydrate } from '../vendor/preact.js';
import { html } from './html.js';
import { App } from './components/App.js';

const boot = JSON.parse(document.getElementById('boot').textContent);

hydrate(html`<${App} boot=${boot} />`, document.getElementById('app'));
