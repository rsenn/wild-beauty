// bun test: client/components/GalleryPane.js renders (server side) for an empty, a drawn and a furnished gallery
import { describe, expect, test } from 'bun:test';
import { renderToString } from '../vendor/preact-render-to-string.js';
import { html } from '../client/html.js';
import { I18n, makeI18n } from '../client/i18n.js';
import { GalleryPane } from '../client/components/GalleryPane.js';
import { loadLocales } from '../server/i18n.js';

const messages = loadLocales().get('de');
const H = n => String(n).repeat(64);
const room = { op: 'shape', id: 'room0001', path: 'M 100 100 L 1100 100 L 1100 900 L 100 900 Z', closed: true, fill: '#cccccc', strokeWidth: 0, wall: { height: 3.2 } };
const doc = steps => ({ v: 1, mode: 'free', style: {}, pages: [{ id: 'page0001', steps }] });

const show = (d, extra = {}) => renderToString(html`<${I18n.Provider} value=${makeI18n({ lang: 'de', messages, fallback: {} })}><${GalleryPane} doc=${d} onScene=${() => {}} ...${extra} /><//>`);

describe('GalleryPane', () => {
  test('an empty gallery explains how to set it up', () => {
    const out = show(doc([]));

    expect(out).toContain('So wird eine Galerie eingerichtet');
    expect(out).toContain('Noch kein Raum');
    expect(out).toContain('<details class="wb-gal-help" open');
    expect(out).not.toContain('<svg');
  });

  test('a drawn room shows the plan, the capacity and the looks', () => {
    const out = show(doc([room]));

    expect(out).toContain('Räume gefunden: 1');
    expect(out).toContain('<svg class="wb-gal-plan"');
    expect(out).toMatch(/Platz für \d+ Bilder/);
    expect(out).toContain('Warmton');
    expect(out).toContain('Nussbaum');
    expect(out).not.toContain('<details class="wb-gal-help" open');
  });

  test('children, texture photos and the budget', () => {
    const d = { ...doc([room, { op: 'photo', id: 'tex00001', photo: H(1), m: [1, 0, 0, 1, 0, 0], crop: 0.5, opacity: 1, blend: 'normal', role: 'texture' }]), scene: { look: 'stone', style: { texture: { images: [H(1)], walls: 'single' } } } };
    const out = show(d, { photos: { [H(1)]: { href: '/files/photos/t.jpg' } }, children: [{ id: 7, title: 'Blume', kind: 'node', tile: H(2) }, { id: 8, title: 'Leer', kind: 'node', tile: null }] });

    expect(out).toContain('1 verknüpfte Bilder');
    expect(out).toContain('Blume');
    expect(out).toContain('Einige verknüpfte Nodes haben noch kein Bild');
    expect(out).toContain('Dieser Node enthält 1 von 40 Fotos');
    expect(out).toContain('/files/photos/t.jpg');
    expect(out).toMatch(/aria-pressed="true"[^>]*><span class="wb-gal-swatch"/);
  });
});
