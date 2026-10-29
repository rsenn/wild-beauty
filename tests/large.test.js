// bun test: GET /api/nodes/:id/large, the sharper picture shown when zoomed in
// on a picture of the 3D gallery (server/api/nodes.js largeRoute)
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { config } from '../server/config.js';
import { open } from '../server/db/db.js';
import { insertNode, upsertPhoto } from '../server/db/nodes.js';
import { largeRoute, putLargeRoute } from '../server/api/nodes.js';
import { servePhoto } from '../server/api/photos.js';
import { detectTools } from '../server/media/tools.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const TILE = 'c'.repeat(64);
const saved = { ...config };
let root;
let h;
let renders;

const photo = (id, hash, extra = {}) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal', ...extra });
const doc = steps => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'p0', steps }] });
// what serverTile does with a `name`: writes that file in the photos folder
const render = async (d, info, { size, name }) => (renders.push({ size, name }), writeFileSync(resolve(config.photosDir, name), 'jpeg'), { ok: true });

beforeAll(() => {
  root = mkdtempSync(resolve(tmpdir(), 'wb-large-'));
  config.photosDir = resolve(root, 'photos');
  mkdirSync(config.photosDir, { recursive: true });
});

afterAll(() => {
  Object.assign(config, saved);
  rmSync(root, { recursive: true, force: true });
});

beforeEach(async () => {
  renders = [];
  h = await open(':memory:');
  upsertPhoto(h, { hash: A, ext: 'jpg', width: 400, height: 300, bytes: 10 });
  upsertPhoto(h, { hash: B, ext: 'png', width: 400, height: 300, bytes: 10 });
});

const node = (steps, tile) => {
  const { id } = insertNode(h, { title: 'n', doc: doc(steps), palette: [] });

  if(tile) h.run('UPDATE nodes SET tile = ? WHERE id = ?', tile, id);

  return String(id);
};

describe('largeRoute', () => {
  test('a collage is rendered large once, kept as <tile>.large.jpg, and the client is sent to it', async () => {
    const id = node([photo('x', A), photo('y', B, { blend: 'multiply' })], TILE);
    const res = await largeRoute(id, h, { render });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(`/files/photos/${TILE}.large.jpg`);
    expect(renders).toEqual([{ size: 1600, name: `${TILE}.large.jpg` }]);
    expect(existsSync(resolve(config.photosDir, `${TILE}.large.jpg`))).toBe(true);

    await largeRoute(id, h, { render });
    expect(renders.length).toBe(1); // asked again: served from the file
  });

  test('a crowd asking at once renders once', async () => {
    const id = node([photo('x', A), photo('y', B)], 'd'.repeat(64));
    const slow = async (...args) => (await Bun.sleep(30), render(...args));
    const all = await Promise.all([1, 2, 3, 4].map(() => largeRoute(id, h, { render: slow })));

    expect(all.map(r => r.status)).toEqual([302, 302, 302, 302]);
    expect(renders.length).toBe(1);
  });

  test('a node of one plain photo is sent to the photo itself, nothing is rendered', async () => {
    const id = node([photo('x', B)], B);
    const res = await largeRoute(id, h, { render });

    expect(res.headers.get('location')).toBe(`/files/photos/${B}.png`);
    expect(renders).toEqual([]);
  });

  test('unknown nodes, a node without a tile, a failed render', async () => {
    expect((await largeRoute('999', h, { render })).status).toBe(404);
    expect((await largeRoute('abc', h, { render })).status).toBe(404);
    expect((await largeRoute(node([photo('x', A), photo('y', B)]), h, { render })).status).toBe(404);

    const id = node([photo('x', A), photo('y', B)], 'e'.repeat(64));

    expect((await largeRoute(id, h, { render: async () => ({ error: 'raster: rsvg-convert not installed' }) })).status).toBe(503);
  });

  test('the large render is served from /files/photos for good', async () => {
    const id = node([photo('x', A), photo('y', B)], TILE);

    await largeRoute(id, h, { render });

    const res = await servePhoto(`${TILE}.large.jpg`, new Request('http://x/'));

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('immutable');
    expect((await servePhoto(`${TILE}.large.png`, new Request('http://x/'))).status).toBe(404);
  });
});

describe('putLargeRoute', () => {
  const put = (id, body, type = 'image/jpeg') => putLargeRoute(new Request('http://x/', { method: 'PUT', headers: { 'content-type': type }, body }), id, h);
  let jpeg;

  beforeAll(async () => {
    await detectTools();

    const file = resolve(root, 'big.jpg');
    const made = Bun.spawnSync(['convert', '-size', '300x300', 'gradient:red-blue', file]);

    if(made.exitCode !== 0) throw new Error('ImageMagick needed for this test');

    jpeg = await Bun.file(file).bytes();
  });

  test('the browser\'s render is kept as <tile>.large.jpg and then served, not rendered', async () => {
    const id = node([photo('x', A), photo('y', B)], TILE);

    expect((await put(id, jpeg)).status).toBe(204);
    expect(existsSync(resolve(config.photosDir, `${TILE}.large.jpg`))).toBe(true);

    const res = await largeRoute(id, h, { render });

    expect(res.status).toBe(302);
    expect(renders).toEqual([]);
  });

  test('refuses what is no sound JPEG, the wrong type, an unknown node, a node needing no render', async () => {
    const id = node([photo('x', A), photo('y', B)], 'f'.repeat(64));

    expect((await put(id, new Uint8Array(500))).status).toBe(400);
    expect((await put(id, jpeg, 'image/png')).status).toBe(415);
    expect((await put('999', jpeg)).status).toBe(404);
    expect((await put(node([photo('x', B)], B), jpeg)).status).toBe(409);
    expect((await put(node([photo('x', A), photo('y', B)]), jpeg)).status).toBe(409);
    expect(existsSync(resolve(config.photosDir, `${'f'.repeat(64)}.large.jpg`))).toBe(false);
  });
});
