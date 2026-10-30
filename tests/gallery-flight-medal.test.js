import { expect, test } from 'bun:test';
import renderToString from '../vendor/preact-render-to-string.js';
import { html } from '../client/html.js';
import { Medal } from '../client/gallery/flight/Medal.js';

test('the medal is an svg with the words, and a tap closes it', () => {
  const out = renderToString(html`<${Medal} label="Perfect landing" onClose=${() => {}} />`);

  expect(out).toContain('<svg');
  expect(out).toContain('wb-medal-graphic');
  expect(out).toContain('Perfect landing');
  expect(out).toContain('role="status"');
});
