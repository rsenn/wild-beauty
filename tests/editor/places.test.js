// bun test: client/editor/places.js (EDITOR.md E137)
import { describe, expect, test } from 'bun:test';
import { answerKey, currentPosition, linkPlace, snapPosition, nearPlace, positionsOf, readAnswered, remember } from '../../client/editor/places.js';

const H = n => String(n).repeat(64);
const doc = (...hashes) => ({ pages: [{ steps: hashes.map(photo => ({ op: 'photo', photo })).concat([{ op: 'text' }]) }] });
const memory = () => {
  const data = new Map();

  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};

describe('positions of a node', () => {
  const photos = { [H(1)]: { pos: { lat: 47.38, lon: 8.54 } }, [H(2)]: { pos: { lat: 47.38, lon: 8.54 } }, [H(3)]: {}, [H(4)]: { pos: { lat: 1.5, lon: 2.5 } } };

  test('unique positions of the photos on the pages, none for photos without one', () => {
    expect(positionsOf(doc(H(1), H(2), H(3)), photos)).toEqual([{ lat: 47.38, lon: 8.54 }]);
    expect(positionsOf(doc(H(3), H(4), H(1)), photos)).toEqual([{ lat: 1.5, lon: 2.5 }, { lat: 47.38, lon: 8.54 }]);
    expect(positionsOf(doc(H(9)), photos)).toEqual([]);
  });

  test('a photo that is not on a page does not suggest', () => {
    expect(positionsOf({ pages: [{ steps: [] }] }, photos)).toEqual([]);
  });
});

describe('answers', () => {
  test('remembered per node and place, a draft apart', () => {
    const storage = memory();

    remember(answerKey(7, 'Zürich'), storage);
    remember(answerKey(null, 'Bern'), storage);

    const all = readAnswered(storage);

    expect(all.has('7:Zürich')).toBe(true);
    expect(all.has('8:Zürich')).toBe(false);
    expect(all.has('draft:Bern')).toBe(true);
  });

  test('no storage, or garbage in it, is an empty set and no error', () => {
    expect(readAnswered(null).size).toBe(0);
    expect(readAnswered({ getItem: () => '{nope' }).size).toBe(0);
    expect(() => remember('a:b', null)).not.toThrow();
  });
});

describe('calls', () => {
  const ok = body => ({ ok: true, json: async () => body });

  test('nearPlace asks without creating and survives a failure', async () => {
    const urls = [];

    expect(await nearPlace({ lat: 47.38, lon: 8.54 }, async url => (urls.push(url), ok({ id: 3, title: 'Zürich' })))).toEqual({ id: 3, title: 'Zürich' });
    expect(urls).toEqual(['/api/places/near?lat=47.38&lon=8.54']);
    expect(await nearPlace({ lat: 1, lon: 1 }, async () => ({ ok: false }))).toBeNull();
    expect(await nearPlace({ lat: 1, lon: 1 }, async () => { throw new Error('offline'); })).toBeNull();
  });

  test('linkPlace finds or creates the place, then sends one `at` link', async () => {
    const calls = [];
    const fetcher = async (url, init) => (calls.push([url, JSON.parse(init.body)]), url === '/api/places' ? ok({ id: 5 }) : ok({}));

    expect(await linkPlace(9, { lat: 47.38, lon: 8.54 }, fetcher)).toBe(true);
    expect(calls).toEqual([['/api/places', { lat: 47.38, lon: 8.54 }], ['/api/graph/ops', { ops: [{ op: 'link', from: 9, to: 5, label: 'at' }] }]]);
  });

  test('linkPlace is false when either call fails, and sends no link without a place', async () => {
    const calls = [];

    expect(await linkPlace(9, { lat: 1, lon: 1 }, async url => (calls.push(url), { ok: false }))).toBe(false);
    expect(calls).toEqual(['/api/places']);
    expect(await linkPlace(9, { lat: 1, lon: 1 }, async url => (url === '/api/places' ? ok({ id: 2 }) : { ok: false }))).toBe(false);
    expect(await linkPlace(9, { lat: 1, lon: 1 }, async () => { throw new Error('offline'); })).toBe(false);
  });
});

describe('current position', () => {
  const geo = (ok, coords) => ({ getCurrentPosition: (yes, no, options) => (ok ? yes({ coords }) : no({ code: 1 }), (geo.options = options)) });

  test('rounded before it leaves the device; low accuracy is enough', async () => {
    expect(await currentPosition(geo(true, { latitude: 47.37689, longitude: 8.54169 }))).toEqual({ lat: 47.38, lon: 8.54 });
    expect(geo.options).toMatchObject({ enableHighAccuracy: false });
  });

  test('denied, missing or nonsense is null, never an error', async () => {
    expect(await currentPosition(geo(false))).toBeNull();
    expect(await currentPosition(null)).toBeNull();
    expect(await currentPosition(geo(true, { latitude: 0, longitude: 0 }))).toBeNull();
    expect(snapPosition(NaN, 1)).toBeNull();
  });
});
