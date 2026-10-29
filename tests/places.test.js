// bun test: server/api/places.js (EDITOR.md E138)
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { linksFrom } from '../server/db/nodes.js';
import { ensurePlace, findPlace, placeTitle, placesRoute } from '../server/api/places.js';
import { roundPosition } from '../server/media/probe.js';
import { seed } from '../tools/seed.js';

const at = (lat, lon) => roundPosition(lat, lon);
let h;
let root;

beforeEach(async () => {
  h = await open(':memory:');
  seed(h);
  root = h.get("SELECT id FROM nodes WHERE title = 'places'").id;
});

describe('place titles', () => {
  test('the gazetteer within 5 km, else the cell coordinates', () => {
    expect(placeTitle(at(47.3769, 8.5417))).toBe('Zürich');
    expect(placeTitle(at(47.4, 8.57))).toBe('Zürich');
    expect(placeTitle(at(47.2, 8.0), [])).toBe('47.20, 8.00');
    expect(placeTitle(at(47.2, 8.0))).toBe('47.20, 8.00');
  });
});

describe('ensurePlace', () => {
  test('positions 300 m apart are one place, 5 km apart two', () => {
    const a = ensurePlace(h, at(47.2701, 8.0101), []);
    const b = ensurePlace(h, at(47.2728, 8.0129), []);
    const c = ensurePlace(h, at(47.3201, 8.0101), []);

    expect(b).toEqual({ id: a.id, title: a.title, created: false });
    expect(c.id).not.toBe(a.id);
    expect(a.created && c.created).toBe(true);
  });

  test('a seeded place is reused, a new one goes below places in order', () => {
    const before = linksFrom(h, root, 'child').length;
    const zurich = ensurePlace(h, at(47.38, 8.54));

    expect(zurich).toMatchObject({ title: 'Zürich', created: false });
    expect(linksFrom(h, root, 'child').length).toBe(before);

    const fresh = ensurePlace(h, at(10.5, 20.5));

    expect(fresh.created).toBe(true);
    expect(linksFrom(h, root, 'child').at(-1)).toMatchObject({ id: fresh.id, sort: before });
  });

  test('the place node carries only its title (the rounded cell), never the exact position', () => {
    const { id } = ensurePlace(h, at(47.2701, 8.0101), []);

    expect(h.get('SELECT doc, x, y FROM nodes WHERE id = ?', id)).toMatchObject({ x: null, y: null });
    expect(h.get('SELECT doc FROM nodes WHERE id = ?', id).doc).not.toContain('47.2701');
  });

  test('without a places node nothing is created', async () => {
    const empty = await open(':memory:');

    expect(ensurePlace(empty, at(1, 1))).toBeNull();
    expect(findPlace(empty, at(1, 1))).toBeNull();
  });
});

describe('routes', () => {
  const get = q => placesRoute(new Request(`http://x/api/places/near?${q}`), h);
  const post = body => placesRoute(new Request('http://x/api/places', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }), h);

  test('near finds without creating', async () => {
    const count = () => h.get('SELECT COUNT(*) AS n FROM nodes').n;
    const n = count();

    expect(await (await get('lat=47.3769&lon=8.5417')).json()).toMatchObject({ title: 'Zürich', id: expect.any(Number) });
    expect(await (await get('lat=10.5&lon=20.5')).json()).toEqual({ id: null, title: '10.50, 20.50' });
    expect(count()).toBe(n);
  });

  test('post creates (201) and then finds (200)', async () => {
    const first = await post({ lat: 10.5, lon: 20.5 });
    const second = await post({ lat: 10.5004, lon: 20.5004 });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect((await second.json()).id).toBe((await first.json()).id);
  });

  test('bad input is a 400, the wrong method a 405', async () => {
    expect((await get('lat=abc&lon=1')).status).toBe(400);
    expect((await get('lat=0&lon=0')).status).toBe(400);
    expect((await get('')).status).toBe(400);
    expect((await post('{nope')).status).toBe(400);
    expect((await post({ lat: 95, lon: 1 })).status).toBe(400);
    expect((await post(null)).status).toBe(400);
    expect((await placesRoute(new Request('http://x/api/places', { method: 'DELETE' }), h)).status).toBe(405);
  });
});
