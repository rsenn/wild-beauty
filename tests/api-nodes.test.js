// bun test: POST /api/nodes (server/api/nodes.js) against a temporary uploads and data directory
import { afterAll, beforeAll, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { config } from '../server/config.js';
import { open } from '../server/db/db.js';
import { addLink, getNode, getPhoto, nodePhotos } from '../server/db/nodes.js';
import { createNode, deleteNodeRoute, mergePalettes, readNode, saveNew, updateNodeRoute } from '../server/api/nodes.js';
import { servePhoto } from '../server/api/photos.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';

setDefaultTimeout(30000);

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const saved = { ...config };
let root;
let h;
let ready = false;

// an upload as the upload endpoint leaves it: the file and its sidecar
async function upload(hash, ext, ...args) {
  await run([...imagemagick.convert, ...args, resolve(config.uploadsDir, `${hash}.${ext}`)]);
  await Bun.write(resolve(config.uploadsDir, `${hash}.json`), JSON.stringify({ hash, ext, display: `${hash}.${ext}`, name: `${hash}.${ext}`, palette: [{ hex: ext === 'jpg' ? '#ff0000' : '#0000ff', weight: 0.7 }, { hex: '#222222', weight: 0.3 }], padding: ['#ff0000', '#222222'] }));
}

const photo = (id, hash, extra = {}) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal', ...extra });
const doc = (steps, extra = {}) => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps }], ...extra });
const post = (body, type = 'application/json') => createNode(new Request('http://x/api/nodes', { method: 'POST', headers: { 'content-type': type }, body: typeof body === 'string' ? body : JSON.stringify(body) }), h);

beforeAll(async () => {
  await detectTools();
  ready = !!(imagemagick.convert && Bun.which('jpegtran'));
  root = mkdtempSync(resolve(tmpdir(), 'wb-api-'));
  Object.assign(config, { uploadsDir: resolve(root, 'uploads'), tmpDir: resolve(root, 'uploads/.tmp'), photosDir: resolve(root, 'data/photos') });
});

afterAll(() => {
  Object.assign(config, saved);
  rmSync(root, { recursive: true, force: true });
});

beforeEach(async () => {
  h = await open(':memory:');
  rmSync(resolve(root, 'uploads'), { recursive: true, force: true });
  rmSync(resolve(root, 'data'), { recursive: true, force: true });
  mkdirSync(config.tmpDir, { recursive: true });

  if(ready) {
    await upload(A, 'jpg', '-size', '300x200', 'gradient:red-blue');
    await upload(B, 'png', '-size', '100x100', 'xc:blue');
  }
});

describe('POST /api/nodes', () => {
  test('a node with two uploads is in the database, baked, and the uploads are gone', async () => {
    if(!ready) return;

    const res = await post({ doc: doc([photo('photo001', A), photo('photo002', B, { role: 'texture' })], { title: 'Two' }), kind: 'album' });
    const { id, rev } = await res.json();

    expect(res.status).toBe(201);
    expect(rev).toBe(1);

    const node = getNode(h, id);

    expect(node).toMatchObject({ title: 'Two', kind: 'album', rev: 1, tile: A });
    expect(node.palette[0]).toMatchObject({ hex: expect.stringMatching(/^#/) });
    expect(nodePhotos(h, id)).toEqual([{ hash: A, sort: 0, role: 'picture' }, { hash: B, sort: 1, role: 'texture' }]);
    expect(getPhoto(h, A)).toMatchObject({ ext: 'jpg', width: 300, height: 200 });
    expect(getPhoto(h, B)).toMatchObject({ ext: 'jpg', width: 100, height: 100 });

    expect(readdirSync(config.photosDir).sort()).toEqual([`${A}.jpg`, `${A}.thumb.jpg`, `${B}.jpg`]);
    expect(readdirSync(config.uploadsDir).filter(n => n !== '.tmp')).toEqual([]);
  });

  test('a second node using a baked photo needs no upload', async () => {
    if(!ready) return;

    await post({ doc: doc([photo('photo001', A)]) });

    const res = await post({ doc: doc([photo('photo001', A)]) });

    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe(2);
    expect(h.get('SELECT count(*) AS n FROM photos').n).toBe(1);
  });

  test('a missing photo is 422 and nothing is written', async () => {
    if(!ready) return;

    const res = await post({ doc: doc([photo('photo001', A), photo('photo002', 'c'.repeat(64))]) });

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe('missing_photo');
    expect(h.get('SELECT count(*) AS n FROM nodes').n).toBe(0);
    expect(existsSync(resolve(config.uploadsDir, `${A}.json`))).toBe(true);
  });

  test('an unreadable photo is 500 bake_failed, the uploads stay, no node', async () => {
    if(!ready) return;

    await Bun.write(resolve(config.uploadsDir, `${B}.png`), 'not an image');

    const res = await post({ doc: doc([photo('photo001', B)]) });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('bake_failed');
    expect(h.get('SELECT count(*) AS n FROM nodes').n).toBe(0);
    expect(existsSync(resolve(config.uploadsDir, `${B}.json`))).toBe(true);
  });

  test('error mapping: bad json, wrong type, invalid doc, too large', async () => {
    expect((await post('{nope')).status).toBe(400);
    expect((await post({ doc: doc([]) }, 'text/plain')).status).toBe(415);
    expect((await post({ doc: { v: 9 } })).status).toBe(400);
    expect((await post({ doc: doc([]), kind: 'blog' })).status).toBe(400);

    const huge = await post(JSON.stringify({ doc: doc([]), pad: 'x'.repeat(1.3 * 1024 * 1024) }));

    expect(huge.status).toBe(413);
    expect((await huge.json()).error).toBe('too_large');
  });

  test('a photo-less node is fine and has no tile', async () => {
    const res = await post({ doc: doc([{ op: 'stroke', id: 'strok001', pts: [[1, 1, 2]], color: '#000000' }], { title: 'Ink' }) });

    expect(res.status).toBe(201);
    expect(getNode(h, (await res.json()).id)).toMatchObject({ title: 'Ink', tile: null });
  });
});

describe('saveNew', () => {
  test('the style is stored sanitised', async () => {
    const r = await saveNew(h, { doc: doc([], { style: { vars: { '--wb-accent': '#2a6', '--wb-ink': 'red;x:y' } } }) });

    expect(getNode(h, r.body.id).doc.style).toEqual({ vars: { '--wb-accent': '#2a6' } });
  });
});

describe('mergePalettes', () => {
  test('weights add up by colour, heaviest first, at most 8', () => {
    const m = mergePalettes([[{ hex: '#111111', weight: 0.5 }, { hex: '#222222', weight: 0.5 }], [{ hex: '#222222', weight: 0.25 }], null]);

    expect(m).toEqual([{ hex: '#222222', weight: 0.75 }, { hex: '#111111', weight: 0.5 }]);
    expect(mergePalettes([Array.from({ length: 12 }, (_, i) => ({ hex: `#0000${i.toString(16).padStart(2, '0')}`, weight: 1 }))]).length).toBe(8);
  });
});

describe('GET /api/nodes/:id and /files/photos', () => {
  const get = (url, headers = {}, method = 'GET') => new Request(`http://x${url}`, { method, headers });

  test('returns the node and its document; the ETag is the rev, 304 on a match', async () => {
    if(!ready) return;

    const { id } = await (await post({ doc: doc([photo('photo001', A)], { title: 'Hi' }) })).json();
    const res = await readNode(get(`/api/nodes/${id}`), String(id), h);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rev).toBe(1);
    expect(body.node).toMatchObject({ id, title: 'Hi', kind: 'node', tile: A, visibility: 'public', doc: { v: 1, pages: [{ steps: [{ op: 'photo', photo: A }] }] } });
    expect(body.node.rev).toBeUndefined();
    expect(res.headers.get('etag')).toBe(`"${id}-1"`);

    const again = await readNode(get(`/api/nodes/${id}`, { 'if-none-match': res.headers.get('etag') }), String(id), h);

    expect(again.status).toBe(304);
    expect(await again.text()).toBe('');
  });

  test('unknown or malformed ids are 404', async () => {
    for(const id of ['999', '0', 'abc', '-1', '1e3', '../x', '']) expect((await readNode(get('/'), id, h)).status).toBe(404);
  });

  test('the baked photo and the thumbnail are served with cache headers by hash', async () => {
    if(!ready) return;

    await post({ doc: doc([photo('photo001', A)]) });

    const photoRes = await servePhoto(`${A}.jpg`, get('/'));
    const thumb = await servePhoto(`${A}.thumb.jpg`, get('/'));

    expect(photoRes.status).toBe(200);
    expect(photoRes.headers.get('content-type')).toBe('image/jpeg');
    expect(photoRes.headers.get('cache-control')).toContain('immutable');
    expect((await photoRes.arrayBuffer()).byteLength).toBe(Bun.file(resolve(config.photosDir, `${A}.jpg`)).size);

    expect(thumb.status).toBe(200);
    expect(thumb.headers.get('cache-control')).not.toContain('immutable');
    expect((await servePhoto(`${A}.thumb.jpg`, get('/', { 'if-none-match': thumb.headers.get('etag') }))).status).toBe(304);
    expect((await servePhoto(`${A}.jpg`, get('/', {}, 'HEAD'))).headers.get('content-length')).toBeTruthy();
  });

  test('only well-formed names of existing files', async () => {
    if(!ready) return;

    for(const name of [`${A}.jpg`, `${B}.png`, '../../etc/passwd', `${A}.json`, `${A}.thumb.png.x`, 'x.jpg', `${A.toUpperCase()}.jpg`, `${A}.heic`]) expect((await servePhoto(name, get('/'))).status).toBe(404);
  });
});

describe('PUT /api/nodes/:id', () => {
  const put = (id, body) => updateNodeRoute(new Request(`http://x/api/nodes/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), String(id), h);
  const create = async steps => (await (await post({ doc: doc(steps) })).json()).id;

  test('saves a new version: rev bumps, document and photos replaced', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A)]);
    const res = await put(id, { rev: 1, doc: doc([photo('photo001', A), photo('photo002', B)], { title: 'v2' }), kind: 'list' });

    expect(res.status).toBe(200);
    const saved = await res.json();

    expect(saved.rev).toBe(2);
    expect(Object.keys(saved.photos).sort()).toEqual([A, B].sort());
    expect(saved.photos[A].href).toMatch(/^\/files\/photos\/[0-9a-f]{64}\.(jpg|png|webp)$/);
    expect(getNode(h, id)).toMatchObject({ rev: 2, title: 'v2', kind: 'list', tile: A });
    expect(nodePhotos(h, id).map(p => p.hash)).toEqual([A, B]);
  });

  test('only new uploads are baked, a kept photo is left alone', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A)]);
    const file = resolve(config.photosDir, `${A}.jpg`);
    const before = Bun.file(file).lastModified;

    await Bun.sleep(20);
    await put(id, { rev: 1, doc: doc([photo('photo001', A), photo('photo002', B)]) });
    expect(Bun.file(file).lastModified).toBe(before);
    expect(existsSync(resolve(config.photosDir, `${B}.jpg`))).toBe(true);
    expect(readdirSync(config.uploadsDir).filter(n => n !== '.tmp')).toEqual([]);
  });

  test('a photo no longer used is removed, one another node uses is kept', async () => {
    if(!ready) return;

    const shared = await create([photo('photo001', A), photo('photo002', B)]);
    const other = await create([photo('photo001', B)]);

    const res = await put(shared, { rev: 1, doc: doc([]) });

    expect(res.status).toBe(200);
    expect(getPhoto(h, A)).toBeNull();
    expect(existsSync(resolve(config.photosDir, `${A}.jpg`))).toBe(false);
    expect(existsSync(resolve(config.photosDir, `${A}.thumb.jpg`))).toBe(false);
    expect(getPhoto(h, B)).not.toBeNull();
    expect(existsSync(resolve(config.photosDir, `${B}.jpg`))).toBe(true);
    expect(getNode(h, shared)).toMatchObject({ tile: null, rev: 2 });
    expect(nodePhotos(h, other).length).toBe(1);
  });

  test('two stale puts yield exactly one 409', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A)]);
    const first = await put(id, { rev: 1, doc: doc([], { title: 'mine' }) });
    const stale = await put(id, { rev: 1, doc: doc([], { title: 'theirs' }) });

    expect(first.status).toBe(200);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: 'conflict', rev: 2 });
    expect(getNode(h, id)).toMatchObject({ title: 'mine', rev: 2 });
  });

  test('the same two stale puts at once: one wins, one conflicts, nothing is left over', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A)]);
    const results = await Promise.all([
      put(id, { rev: 1, doc: doc([photo('photo001', A)], { title: 'one' }) }),
      put(id, { rev: 1, doc: doc([photo('photo001', A)], { title: 'two' }) }),
    ]);

    expect(results.map(r => r.status).sort()).toEqual([200, 409]);
    expect(getNode(h, id).rev).toBe(2);
  });

  test('a conflicting put with a new upload leaves no orphan photo and keeps the upload', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A)]);

    await put(id, { rev: 1, doc: doc([]) });

    const res = await put(id, { rev: 1, doc: doc([photo('photo001', B)]) });

    expect(res.status).toBe(409);
    expect(getPhoto(h, B)).toBeNull();
    expect(existsSync(resolve(config.uploadsDir, `${B}.json`))).toBe(true);
  });

  test('errors: unknown node, bad rev, invalid doc, missing photo, bad id', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A)]);

    expect((await put(999, { rev: 1, doc: doc([]) })).status).toBe(404);
    expect((await put('abc', { rev: 1, doc: doc([]) })).status).toBe(404);
    expect((await put(id, { doc: doc([]) })).status).toBe(400);
    expect((await put(id, { rev: 'x', doc: doc([]) })).status).toBe(400);
    expect((await put(id, { rev: 1, doc: { v: 9 } })).status).toBe(400);
    expect((await put(id, { rev: 1, doc: doc([photo('photo001', 'c'.repeat(64))]) })).status).toBe(422);
    expect(getNode(h, id).rev).toBe(1);
  });
});

describe('DELETE /api/nodes/:id', () => {
  const del = id => deleteNodeRoute(String(id), h);
  const create = async steps => (await (await post({ doc: doc(steps) })).json()).id;

  test('no orphan is left: row, photo rows, edges, photos and their files are gone', async () => {
    if(!ready) return;

    const id = await create([photo('photo001', A), photo('photo002', B)]);
    const other = await create([]);

    addLink(h, id, other, 'child');
    addLink(h, other, id, 'ref');

    const res = await del(id);

    expect(res.status).toBe(204);
    expect(getNode(h, id)).toBeNull();
    expect(getNode(h, other)).not.toBeNull();
    expect(h.get('SELECT count(*) AS n FROM node_photos').n).toBe(0);
    expect(h.get('SELECT count(*) AS n FROM node_links').n).toBe(0);
    expect(h.get('SELECT count(*) AS n FROM photos').n).toBe(0);
    expect(readdirSync(config.photosDir)).toEqual([]);
  });

  test('a photo another node uses stays, with its file', async () => {
    if(!ready) return;

    const a = await create([photo('photo001', A), photo('photo002', B)]);

    await create([photo('photo001', B)]);
    await del(a);
    expect(getPhoto(h, A)).toBeNull();
    expect(getPhoto(h, B)).not.toBeNull();
    expect(readdirSync(config.photosDir).filter(n => n.startsWith(A))).toEqual([]);
    expect(existsSync(resolve(config.photosDir, `${B}.jpg`))).toBe(true);
  });

  test('a node without photos, an unknown or malformed id, and deleting twice', async () => {
    const id = await create([]);

    expect((await del(id)).status).toBe(204);
    expect((await del(id)).status).toBe(404);
    expect((await del(999)).status).toBe(404);
    expect((await deleteNodeRoute('abc', h)).status).toBe(404);
  });

  test('a lock on the node goes with it', async () => {
    const id = await create([]);

    h.run("INSERT INTO node_locks VALUES (?, 'me', NULL, 1, 2)", id);
    await del(id);
    expect(h.get('SELECT count(*) AS n FROM node_locks').n).toBe(0);
  });
});
