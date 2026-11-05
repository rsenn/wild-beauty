// bun test: the gallery's presentations (docs/GALLERY.md S5a): the helpers, and the carousel,
// the masonry album and the switch rendered on the server
import { describe, expect, test } from 'bun:test';
import { renderToString } from '../vendor/preact-render-to-string.js';
import { html } from '../client/html.js';
import { I18n, makeI18n } from '../client/i18n.js';
import { GalleryCarousel, GalleryMasonry, ViewSwitch } from '../client/components/GalleryViews.js';
import { PAGE_SIZE, atOf, indexOf, pageCount, pageItems, pageOf, presentationQuery, startIndex, stationOf, viewOf } from '../client/gallery/presentation.js';
import { loadLocales } from '../server/i18n.js';

const items = Array.from({ length: 130 }, (_, i) => ({ id: i % 2 ? `n${i}:${String(i).padStart(64, '0')}` : `n${i}`, title: `Bild ${i + 1}`, url: `/files/photos/${i}.thumb.jpg`, href: `/en/node/${i}` }));
const show = (messages, vnode) => renderToString(html`<${I18n.Provider} value=${makeI18n({ lang: 'de', messages, fallback: {} })}>${vnode}<//>`);
const de = loadLocales().get('de');

describe('presentation helpers', () => {
  test('a view is one of three, else 3d; an item id is a plain token or nothing', () => {
    expect(['3d', 'carousel', 'masonry', 'x', null].map(viewOf)).toEqual(['3d', 'carousel', 'masonry', '3d', '3d']);
    expect(atOf('n12')).toBe('n12');
    expect(atOf(`n12:${'a'.repeat(64)}`)).toBe(`n12:${'a'.repeat(64)}`);

    for(const bad of [null, '', 'a b', '<x>', '../x', 'a'.repeat(101), 3]) expect(atOf(bad)).toBeNull();
  });

  test('finding an item: by id, else the first', () => {
    expect(indexOf(items, 'n10')).toBe(10);
    expect(indexOf(items, 'nope')).toBe(-1);
    expect(indexOf(items, null)).toBe(-1);
    expect(startIndex(items, 'n10')).toBe(10);
    expect(startIndex(items, 'nope')).toBe(0);
    expect(startIndex([], 'n1')).toBe(0);
  });

  test('pages of the album: the page that holds an item, and its tiles', () => {
    expect(pageCount(130)).toBe(3);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(PAGE_SIZE)).toBe(1);
    expect(pageCount(PAGE_SIZE + 1)).toBe(2);
    expect([0, 47, 48, 95, 96, 129].map(i => pageOf(i))).toEqual([0, 0, 1, 1, 2, 2]);
    expect(pageItems(items, 2).map(i => i.id)).toEqual(items.slice(96).map(i => i.id));
    expect(pageItems(items, 0)).toHaveLength(PAGE_SIZE);
  });

  test('the 3D station of an item, 0 when it is not hung', () => {
    const stations = [{ child: { id: 'n3' } }, { child: { id: 'n9' } }, { child: { id: 'n5' } }];

    expect(stationOf(stations, 'n5')).toBe(2);
    expect(stationOf(stations, 'n8')).toBe(0);
    expect(stationOf(stations, null)).toBe(0);
  });

  test('the query that keeps the place: nothing for the default view on nothing', () => {
    expect(presentationQuery()).toBe('');
    expect(presentationQuery({ view: '3d', at: null })).toBe('');
    expect(presentationQuery({ view: 'carousel', at: 'n12' })).toBe('?view=carousel&at=n12');
    expect(presentationQuery({ view: 'masonry' })).toBe('?view=masonry');
    expect(presentationQuery({ view: '3d', at: 'n12' })).toBe('?at=n12');
    expect(presentationQuery({ view: 'x', at: '<bad>' })).toBe('');
  });
});

describe('the views on the server', () => {
  test('the switch names the three views and marks the current one', () => {
    const out = show(de, html`<${ViewSwitch} view="carousel" onView=${() => {}} />`);

    expect(out).toContain('Ansicht');
    expect(out).toContain('Karussell');
    expect(out).toContain('Album');
    expect(out.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(out).toMatch(/aria-pressed="true"[^>]*>Karussell/);
  });

  test('the carousel has a slide for every item, in order, with the way to its page', () => {
    const out = show(de, html`<${GalleryCarousel} items=${items.slice(0, 5)} at=${items[2].id} label="Garten" />`);

    expect((out.match(/wb-flow-item/g) ?? []).length).toBe(5);
    expect(out.indexOf('Bild 1')).toBeLessThan(out.indexOf('Bild 5'));
    expect(out).toContain('href="/en/node/3"');
    expect(out).toContain('3 / 5');
  });

  test('the album shows one page of square tiles and marks the current picture', () => {
    const out = show(de, html`<${GalleryMasonry} items=${items} at=${items[60].id} label="Album" />`);

    expect((out.match(/wb-masonry-tile/g) ?? []).length).toBeGreaterThan(PAGE_SIZE - 1);
    expect(out).toContain('Seite 2 von 3');
    expect(out).toContain('Bild 61');
    expect(out).not.toContain('Bild 1"');
    expect(out.match(/wb-masonry-current/g)).toHaveLength(1);
    expect(out).toMatch(/wb-masonry-current[^>]*>\s*<button[^>]*aria-pressed="true"[^>]*aria-label="Bild 61"/);
  });

  test('a short gallery has no page control', () => {
    const out = show(de, html`<${GalleryMasonry} items=${items.slice(0, 10)} at=${null} label="Album" />`);

    expect(out).not.toContain('Seite');
    expect((out.match(/wb-masonry-tile/g) ?? []).length).toBe(10);
  });
});
