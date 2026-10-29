// bun test: which tiles need the real render (needsRender) and re-making the
// stale ones of saved nodes (server/node/retile.js, tools/retile.js)
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { getNode, insertNode, upsertPhoto } from '../server/db/nodes.js';
import { needsRender } from '../server/media/raster.js';
import { retile } from '../server/node/retile.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const T = 't'.repeat(0) + 'c'.repeat(64);

const photo = (id, hash, extra = {}) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal', ...extra });
const doc = (steps, mode = 'free', more = []) => ({ v: 1, style: {}, mode, pages: [{ id: 'p0', steps }, ...more] });

describe('needsRender', () => {
  test('one plain photo keeps its own thumbnail', () => {
    expect(needsRender(doc([photo('x', A)]))).toBe(false);
  });

  test('drawings, shapes and text need the render', () => {
    expect(needsRender(doc([photo('x', A), { op: 'text', id: 't' }]))).toBe(true);
    expect(needsRender(doc([photo('x', A), { op: 'shape', id: 's', path: 'M0 0Z' }]))).toBe(true);
  });

  test('a collage of photos needs it, with or without blend modes', () => {
    expect(needsRender(doc([photo('x', A), photo('y', B)]))).toBe(true);
    expect(needsRender(doc([photo('x', A, { blend: 'multiply' })]))).toBe(true);
    expect(needsRender(doc([photo('x', A, { opacity: 0.5 })]))).toBe(true);
    expect(needsRender(doc([photo('x', A, { clip: 's' })]))).toBe(true);
  });

  test('a slide show of plain photos does not, a texture is not a layer', () => {
    expect(needsRender(doc([photo('x', A), photo('y', B)], 'slides'))).toBe(false);
    expect(needsRender(doc([photo('x', A), photo('y', B, { role: 'texture' })]))).toBe(false);
  });

  test('a grid of photos does', () => {
    expect(needsRender(doc([photo('x', A), photo('y', B)], 'grid'))).toBe(true);
  });
});

describe('retile', () => {
  let h;
  let calls;
  const render = async () => (calls++, { ok: true, hash: T });
  const add = (title, d, tile) => insertNode(h, { title, doc: d, palette: [], now: 1 }).id;

  beforeEach(async () => {
    calls = 0;
    h = await open(':memory:');
    upsertPhoto(h, { hash: A, ext: 'jpg', width: 400, height: 300, bytes: 10 });
    upsertPhoto(h, { hash: B, ext: 'jpg', width: 400, height: 300, bytes: 10 });
  });

  test('a collage that shows one photo gets the rendered tile; the node itself is not touched', async () => {
    const id = add('collage', doc([photo('x', A), photo('y', B, { blend: 'overlay' })]));

    h.run('UPDATE nodes SET tile = ? WHERE id = ?', A, id);

    const before = getNode(h, id);
    const [r] = await retile(h, { render });
    const after = getNode(h, id);

    expect(r).toMatchObject({ id, status: 'done', tile: T });
    expect(after.tile).toBe(T);
    expect({ ...after, tile: null }).toEqual({ ...before, tile: null });
  });

  test('a plain photo, and a node whose tile is already rendered, are left alone', async () => {
    const plain = add('plain', doc([photo('x', A)]));
    const done = add('done', doc([photo('x', A), photo('y', B)]));

    h.run('UPDATE nodes SET tile = ? WHERE id = ?', A, plain);
    h.run('UPDATE nodes SET tile = ? WHERE id = ?', T, done);

    const report = await retile(h, { render });

    expect(report.map(r => r.status)).toEqual(['plain', 'kept']);
    expect(calls).toBe(0);
    expect(getNode(h, done).tile).toBe(T);
  });

  test('force renders the kept ones again; dry only reports; ids narrow it down', async () => {
    const one = add('one', doc([photo('x', A), photo('y', B)]));
    const two = add('two', doc([photo('x', A), photo('y', B)]));

    h.run('UPDATE nodes SET tile = ? WHERE id IN (?, ?)', T, one, two);

    expect((await retile(h, { render })).map(r => r.status)).toEqual(['kept', 'kept']);
    expect((await retile(h, { render, force: true, dry: true })).map(r => r.status)).toEqual(['would', 'would']);
    expect(calls).toBe(0);
    expect((await retile(h, { render, force: true, ids: [two] })).map(r => [r.id, r.status])).toEqual([[two, 'done']]);
    expect(calls).toBe(1);
  });

  test('a failed render is reported and the tile stays', async () => {
    const id = add('x', doc([photo('x', A), photo('y', B)]));

    h.run('UPDATE nodes SET tile = ? WHERE id = ?', A, id);

    const [r] = await retile(h, { render: async () => ({ error: 'raster: rsvg-convert not installed' }) });

    expect(r).toMatchObject({ status: 'failed', error: 'raster: rsvg-convert not installed' });
    expect(getNode(h, id).tile).toBe(A);
  });
});
