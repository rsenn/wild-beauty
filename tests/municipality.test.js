// bun test: the municipality lookup (server/api/municipality.js, EDITOR.md E138)
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { getPlaceName } from '../server/db/nodes.js';
import { titleFor } from '../server/api/gazetteer.js';
import { fetchMunicipality, resolveNames } from '../server/api/municipality.js';
import { placesRoute } from '../server/api/places.js';
import { seed } from '../tools/seed.js';

const reply = results => ({ ok: true, json: async () => ({ results }) });
const feature = (gemname, kanton, current = true) => ({ layerBodId: 'ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill', attributes: { gemname, kanton, is_current_jahr: current } });
const zurich = { lat: 47.38, lon: 8.54 };
const saved = process.env.WB_GEO_API;

afterEach(() => (saved === undefined ? delete process.env.WB_GEO_API : (process.env.WB_GEO_API = saved)));

describe('fetchMunicipality', () => {
  test('asks identify for the point, longitude first, and names the current municipality with its canton', async () => {
    const urls = [];
    const found = await fetchMunicipality(zurich, async url => (urls.push(String(url)), reply([feature('Zürich', 'ZH', false), feature('Zürich', 'ZH')])));
    const query = new URL(urls[0]).searchParams;

    expect(found).toEqual({ ok: true, name: 'Zürich (ZH)' });
    expect(new URL(urls[0]).pathname).toBe('/rest/services/all/MapServer/identify');
    expect(query.get('geometry')).toBe('8.54,47.38');
    expect(query.get('sr')).toBe('4326');
    expect(query.get('layers')).toBe('all:ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill');
    expect(query.get('returnGeometry')).toBe('false');
    expect(query.get('mapExtent')).toBeTruthy();
  });

  test('only boundaries of earlier years, or none at all: outside Switzerland, an answer all the same', async () => {
    expect(await fetchMunicipality(zurich, async () => reply([feature('Zürich', 'ZH', false)]))).toEqual({ ok: true, name: null });
    expect(await fetchMunicipality(zurich, async () => reply([]))).toEqual({ ok: true, name: null });
  });

  test('no answer: an error status, a throw, a body that is not the service\'s', async () => {
    expect(await fetchMunicipality(zurich, async () => ({ ok: false, status: 503 }))).toEqual({ ok: false });
    expect(await fetchMunicipality(zurich, async () => { throw new Error('offline'); })).toEqual({ ok: false });
    expect(await fetchMunicipality(zurich, async () => ({ ok: true, json: async () => ({ oops: 1 }) }))).toEqual({ ok: false });
    expect(await fetchMunicipality(zurich, async () => ({ ok: true, json: async () => { throw new Error('html'); } }))).toEqual({ ok: false });
  });

  test('a name that already has its canton ("Buchs (SG)", as the service writes it) does not get it twice', async () => {
    expect((await fetchMunicipality(zurich, async () => reply([feature('Buchs (SG)', 'SG')]))).name).toBe('Buchs (SG)');
    expect((await fetchMunicipality(zurich, async () => reply([feature('Erlenbach (ZH)', 'ZH')]))).name).toBe('Erlenbach (ZH)');
  });

  test('a name from outside is a clean title', async () => {
    expect((await fetchMunicipality(zurich, async () => reply([feature('Bad\u0000\nName', 'ZH')]))).name).toBe('BadName (ZH)');
    expect((await fetchMunicipality(zurich, async () => reply([feature('x'.repeat(500), 'ZH')]))).name.length).toBeLessThanOrEqual(85);
    expect((await fetchMunicipality(zurich, async () => reply([feature('Ort', undefined)]))).name).toBe('Ort');
  });

  test('WB_GEO_API=off asks nobody, and a test run does not reach the network by itself', async () => {
    let calls = 0;
    const fetcher = async () => (calls++, reply([feature('Zürich', 'ZH')]));

    process.env.WB_GEO_API = 'off';
    expect(await fetchMunicipality(zurich, fetcher)).toEqual({ ok: false });
    expect(calls).toBe(0);

    delete process.env.WB_GEO_API;
    expect(await fetchMunicipality(zurich)).toEqual({ ok: false }); // NODE_ENV=test, no fetcher given
  });

  test('another base URL points it at a mirror', async () => {
    const urls = [];

    process.env.WB_GEO_API = 'http://mirror.test';
    await fetchMunicipality(zurich, async url => (urls.push(String(url)), reply([])));
    expect(urls[0].startsWith('http://mirror.test/rest/services/all/MapServer/identify?')).toBe(true);
  });
});

describe('resolveNames and the cache', () => {
  let h;

  beforeEach(async () => {
    h = await open(':memory:');
  });

  test('each cell is asked once; outside Switzerland is remembered too', async () => {
    const asked = [];
    const fetcher = async url => (asked.push(new URL(url).searchParams.get('geometry')), reply(asked.length === 1 ? [feature('Zürich', 'ZH')] : []));
    const sea = { lat: 10.5, lon: 20.5 };

    await resolveNames(h, [zurich, zurich, sea], { fetcher });
    await resolveNames(h, [zurich, sea], { fetcher });

    expect(asked).toEqual(['8.54,47.38', '20.5,10.5']);
    expect(getPlaceName(h, zurich)).toBe('Zürich (ZH)');
    expect(getPlaceName(h, sea)).toBeNull();
    expect(getPlaceName(h, { lat: 1.5, lon: 1.5 })).toBeUndefined();
  });

  test('no answer is not remembered, and stops the rest of the round', async () => {
    let calls = 0;

    await resolveNames(h, [zurich, { lat: 46.95, lon: 7.45 }], { fetcher: async () => (calls++, { ok: false }) });
    expect(calls).toBe(1);
    expect(getPlaceName(h, zurich)).toBeUndefined();
  });

  test('at most `limit` cells per call', async () => {
    const fetcher = async () => reply([feature('Ort', 'ZH')]);
    const cells = [1, 2, 3, 4, 5].map(n => ({ lat: 40 + n, lon: 8 }));

    await resolveNames(h, cells, { fetcher, limit: 2 });
    expect(cells.map(c => getPlaceName(h, c))).toEqual(['Ort (ZH)', 'Ort (ZH)', undefined, undefined, undefined]);
  });

  test('titleFor: the cached municipality, else the gazetteer, else the cell', async () => {
    await resolveNames(h, [{ lat: 47.3, lon: 8.6 }], { fetcher: async () => reply([feature('Küsnacht', 'ZH')]) });

    expect(titleFor(h, { lat: 47.3, lon: 8.6 })).toBe('Küsnacht (ZH)');
    expect(titleFor(h, zurich)).toBe('Zürich (ZH)'); // the gazetteer, not asked
    expect(titleFor(h, { lat: 10.5, lon: 20.5 })).toBe('10.50, 20.50');

    await resolveNames(h, [{ lat: 10.5, lon: 20.5 }], { fetcher: async () => reply([]) });
    expect(titleFor(h, { lat: 10.5, lon: 20.5 })).toBe('10.50, 20.50'); // outside: still the cell
  });
});

describe('the routes use it', () => {
  let h;

  beforeEach(async () => {
    h = await open(':memory:');
    seed(h);
  });

  test('a municipality the gazetteer does not know names the place; asked once', async () => {
    let calls = 0;
    const fetcher = async () => (calls++, reply([feature('Küsnacht', 'ZH')]));
    const near = () => placesRoute(new Request('http://x/api/places/near?lat=47.3&lon=8.6'), h, undefined, fetcher);
    const post = () => placesRoute(new Request('http://x/api/places', { method: 'POST', body: JSON.stringify({ lat: 47.3, lon: 8.6 }) }), h, undefined, fetcher);

    expect(await (await near()).json()).toEqual({ id: null, title: 'Küsnacht (ZH)' });

    const created = await (await post()).json();

    expect(created).toMatchObject({ title: 'Küsnacht (ZH)', created: true });
    expect(await (await near()).json()).toEqual({ id: created.id, title: 'Küsnacht (ZH)' });
    expect(calls).toBe(1);
  });

  test('two municipalities of one name stay two places', async () => {
    const buchs = canton => async () => reply([feature('Buchs', canton)]);
    const post = (lat, canton) => placesRoute(new Request('http://x/api/places', { method: 'POST', body: JSON.stringify({ lat, lon: 9.1 }) }), h, undefined, buchs(canton)).then(r => r.json());
    const a = await post(47.17, 'SG');
    const b = await post(47.38, 'AG');

    expect([a.title, b.title]).toEqual(['Buchs (SG)', 'Buchs (AG)']);
    expect(a.id).not.toBe(b.id);
  });

  test('when the service is down the gazetteer and the cells still name places', async () => {
    const down = async () => ({ ok: false });
    const res = await placesRoute(new Request('http://x/api/places', { method: 'POST', body: JSON.stringify({ lat: 47.38, lon: 8.54 }) }), h, undefined, down);

    expect(await res.json()).toMatchObject({ title: 'Zürich (ZH)', created: false });
  });
});
