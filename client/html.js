// `html` template tag bound to Preact's `h`; imported by server and browser.
// Relative vendor paths resolve to the same /vendor/ URLs in both.
import { h } from '../vendor/preact.js';
import htm from '../vendor/htm.js';

export const html = htm.bind(h);
export { h };
