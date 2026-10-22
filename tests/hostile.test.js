// bun test: hostile and over-limit input against the real server over HTTP,
// and a missing external tool in process. Every request must get the
// documented status and code and must leave the disk as it was.
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { config } from '../server/config.js';
import { open } from '../server/db/db.js';
import { getNode } from '../server/db/nodes.js';
import { saveNew } from '../server/api/nodes.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick, tools } from '../server/media/tools.js';
import { bakeImage, bakeJpeg, shrinkJpeg } from '../server/media/bake.js';

setDefaultTimeout(30000);

const PORT = 3700 + Math.floor(Math.random() * 300);
const base = `http://localhost:${PORT}`;
const H = 'a'.repeat(64);
let root;
let server;
let ready = false;
let hash;

// every file below the temporary data and uploads directories, sorted
const tree = dir => (existsSync(dir) ? readdirSync(dir, { recursive: true, withFileTypes: true }).filter(e => e.isFile()).map(e => resolve(e.parentPath, e.name).slice(root.length)).sort() : []);
const disk = () => [...tree(resolve(root, 'uploads')), ...tree(resolve(root, 'data'))].filter(f => !f.includes('wb.sqlite3'));

const send = (method, path, { body, type = 'application/json', headers = {} } = {}) => fetch(base + path, { method, body: typeof body === 'object' && !(body instanceof Uint8Array) && !(body instanceof Blob) ? JSON.stringify(body) : body, headers: { ...(type && { 'content-type': type }), ...headers } });
const photo = (id, h = hash) => ({ op: 'photo', id, photo: h, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal' });
const doc = (steps = [], extra = {}) => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps }], ...extra });
const upload = body => send('POST', '/api/uploads', { body, type: 'application/octet-stream', headers: { 'x-filename': 'x.jpg' } });

// status and error code of a node request
async function expectError(res, status, code) {
  const body = await res.json();

  expect(res.status).toBe(status);
  expect(body.error).toBe(code);
}

beforeAll(async () => {
  await detectTools();
  ready = !!(imagemagick.convert && Bun.which('jpegtran'));

  if(!ready) return;

  root = mkdtempSync(resolve(tmpdir(), 'wb-hostile-'));
  await run([...imagemagick.convert, '-size', '120x80', 'gradient:red-blue', resolve(root, 'in.jpg')]);
  server = Bun.spawn(['bun', 'server.js'], { cwd: resolve(import.meta.dir, '..'), env: { ...process.env, PORT: String(PORT), WB_DATA: resolve(root, 'data'), WB_UPLOADS: resolve(root, 'uploads') }, stdout: 'ignore', stderr: 'ignore' });

  for(let i = 0; i < 100; i++) {
    try {
      if((await fetch(base + '/api/capabilities')).ok) break;
    } catch {}

    await Bun.sleep(100);
  }

  hash = (await (await upload(Bun.file(resolve(root, 'in.jpg')))).json()).hash;
});

afterAll(() => {
  server?.kill();
  if(root) rmSync(root, { recursive: true, force: true });
});

describe('uploads', () => {
  test('zero-byte, wrong type, not an image: 400, 415, 415, nothing written', async () => {
    if(!ready) return;

    const before = disk();

    const empty = await upload(new Uint8Array(0));

    expect(empty.status).toBe(400);
    expect((await empty.json()).error.code).toBe('empty');
    expect((await upload(new TextEncoder().encode('just some text, not an image at all'))).status).toBe(415);
    expect((await upload(new Uint8Array(1000).fill(7))).status).toBe(415);
    expect(disk()).toEqual(before);
  });

  test('bad hashes and traversal in file and delete routes', async () => {
    if(!ready) return;

    const before = disk();

    for(const name of ['..%2f..%2fserver.js', '..', '%2e%2e%2f', `${H}.exe`, `${H.toUpperCase()}.jpg`, `${H}.jpg%00`, 'x.jpg']) {
      expect((await send('GET', `/files/uploads/${name}`, { type: null })).status).toBe(404);
      expect((await send('GET', `/files/photos/${name}`, { type: null })).status).toBe(404);
    }

    for(const bad of ['abc', `${H}x`, 'A'.repeat(64)]) expect((await send('DELETE', `/api/uploads/${bad}`, { type: null })).status).toBe(400);

    expect((await send('DELETE', `/api/uploads/${H}`, { type: null })).status).toBe(404);
    expect(disk()).toEqual(before);
  });
});

describe('node documents', () => {
  const rejected = async (body, status, code) => {
    const before = disk();

    await expectError(await send('POST', '/api/nodes', { body }), status, code);
    expect(disk()).toEqual(before);
  };

  test('unknown op, dangling ids, bad structure: 400 invalid', async () => {
    if(!ready) return;

    await rejected({ doc: doc([{ op: 'future', id: 'futur001' }]) }, 400, 'invalid');
    await rejected({ doc: doc([{ op: 'clip', target: 'nothing1', shape: 'nothing2' }]) }, 400, 'invalid');
    await rejected({ doc: doc([photo('photo001'), photo('photo001')]) }, 400, 'invalid');
    await rejected({ doc: doc([photo('bad id!')]) }, 400, 'invalid');
    await rejected({ doc: doc([{ ...photo('photo001'), m: [1, 0, 0, 1, 0, 1e9] }]) }, 400, 'invalid');
    await rejected({ doc: doc([{ ...photo('photo001'), opacity: 'x' }]) }, 400, 'invalid');
    await rejected({ doc: doc([{ op: 'shape', id: 'shape001', path: 'M0 0'.padEnd(20001, 'L'), closed: false, strokeWidth: 1 }]) }, 400, 'invalid');
    await rejected({ doc: { ...doc(), pages: [] } }, 400, 'invalid');
    await rejected({ doc: doc([], { title: 'x'.repeat(201) }) }, 400, 'invalid');
    await rejected({ doc: doc(), kind: 'blog' }, 400, 'invalid');
    await rejected([], 400, 'invalid');
    await rejected({}, 400, 'invalid');
  });

  test('photo hashes that are not hashes: 400, a hash that is not stored: 422', async () => {
    if(!ready) return;

    for(const bad of ['../../etc/passwd', 'abc', `${H}.jpg`, 'A'.repeat(64)]) await rejected({ doc: doc([photo('photo001', bad)]) }, 400, 'invalid');

    await rejected({ doc: doc([photo('photo001', 'c'.repeat(64))]) }, 422, 'missing_photo');
  });

  test('too large: a body over 1.2 MB and a document over 1 MB are 413', async () => {
    if(!ready) return;

    // 55 shapes of 19 900 characters: about 1.09 MB of document, inside the body cap
    const shape = i => ({ op: 'shape', id: `shape${String(i).padStart(3, '0')}`, path: 'M0 0' + 'L1 1'.repeat(4975), closed: false, strokeWidth: 1 });

    await rejected({ doc: doc([], { title: 'ok', pad: 'x'.repeat(1.3 * 1024 * 1024) }) }, 413, 'too_large');
    await rejected({ doc: doc([...Array(55)].map((_, i) => shape(i))) }, 413, 'too_large');
  });

  test('over the structural limits: 400', async () => {
    if(!ready) return;

    const stroke = i => ({ op: 'stroke', id: `strok${String(i).padStart(3, '0')}`, pts: [[1, 1, 1]], color: '#000000' });

    await rejected({ doc: doc([...Array(501)].map((_, i) => stroke(i))) }, 400, 'invalid');
    await rejected({ doc: doc([{ ...stroke(1), pts: [...Array(2001)].map(() => [1, 1, 1]) }]) }, 400, 'invalid');
    await rejected({ doc: { ...doc(), pages: [...Array(51)].map((_, i) => ({ id: `page${String(i).padStart(4, '0')}`, steps: [] })) } }, 400, 'invalid');
  });

  test('wrong content type, broken JSON, wrong methods', async () => {
    if(!ready) return;

    const before = disk();

    expect((await send('POST', '/api/nodes', { body: '{"doc":1}', type: 'text/plain' })).status).toBe(415);
    expect((await send('POST', '/api/nodes', { body: '{nope', type: 'application/json' })).status).toBe(400);
    expect((await send('POST', '/api/nodes', { body: '', type: 'application/json' })).status).toBe(400);
    expect((await send('PATCH', '/api/nodes/1', { body: '{}' })).status).toBe(405);
    expect((await send('PUT', '/api/nodes', { body: '{}' })).status).toBe(405);
    expect((await send('GET', '/api/nodes', { type: null })).status).toBe(200); // the list of saved nodes (E68)
    expect((await send('GET', '/api/nodes/1e3', { type: null })).status).toBe(404);
    expect((await send('GET', '/api/nodes/-1', { type: null })).status).toBe(404);
    expect((await send('PUT', '/api/nodes/99', { body: { rev: 1, doc: doc() } })).status).toBe(404);
    expect((await send('DELETE', '/api/nodes/99', { type: null })).status).toBe(404);
    expect((await send('POST', '/api/nodes/99/lock', { type: null })).status).toBe(404);
    expect(disk()).toEqual(before);
  });

  test('theme injection is stored sanitised and never reaches the page', async () => {
    if(!ready) return;

    const style = { theme: '"><script>alert(1)</script>', vars: { '--wb-accent': 'red;background:url(javascript:alert(1))', '--wb-ink': '#fff}body{display:none', '--wb-icon-new': 'url(https://evil.example/x.png)', '--wb-danger': '#f30208' } };
    const res = await send('POST', '/api/nodes', { body: { doc: doc([], { style }) } });
    const { id } = await res.json();

    expect(res.status).toBe(201);
    expect((await (await send('GET', `/api/nodes/${id}`, { type: null })).json()).node.doc.style).toEqual({ vars: { '--wb-danger': '#f30208' } });

    const page = await (await send('GET', `/en/node/${id}`, { type: null })).text();

    expect(page).toContain('style="--wb-danger:#f30208"');
    expect(page).not.toMatch(/javascript:|evil\.example|<script>alert/);
  });

  test('a stale or garbage rev: 400, 409', async () => {
    if(!ready) return;

    const { id } = await (await send('POST', '/api/nodes', { body: { doc: doc() } })).json();

    for(const rev of [undefined, 0, -1, 1.5, '1', null]) await expectError(await send('PUT', `/api/nodes/${id}`, { body: { rev, doc: doc() } }), 400, 'invalid');

    await expectError(await send('PUT', `/api/nodes/${id}`, { body: { rev: 7, doc: doc() } }), 409, 'conflict');
  });
});

describe('a missing external tool', () => {
  // in process, on temporary directories: baking reports an error, saving gives
  // 500 bake_failed, and the disk and the database stay as they were
  const saved = { ...config };
  const tool = { jpegtran: tools.jpegtran, convert: imagemagick.convert, identify: imagemagick.identify };
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(resolve(tmpdir(), 'wb-notool-'));
    Object.assign(config, { uploadsDir: resolve(dir, 'uploads'), tmpDir: resolve(dir, 'uploads/.tmp'), photosDir: resolve(dir, 'data/photos') });
    mkdirSync(config.tmpDir, { recursive: true });
  });

  afterAll(() => {
    Object.assign(config, saved);
    Object.assign(tools, { jpegtran: tool.jpegtran });
    Object.assign(imagemagick, { convert: tool.convert, identify: tool.identify });
    rmSync(dir, { recursive: true, force: true });
  });

  const withoutTools = async fn => {
    tools.jpegtran = null;
    imagemagick.convert = null;
    imagemagick.identify = null;

    try {
      return await fn();
    } finally {
      Object.assign(tools, { jpegtran: tool.jpegtran });
      Object.assign(imagemagick, { convert: tool.convert, identify: tool.identify });
    }
  };

  test('the bake functions return an error and write nothing', async () => {
    if(!ready) return;

    const src = resolve(root, 'in.jpg');

    await withoutTools(async () => {
      expect((await bakeJpeg(src, resolve(dir, 'a.jpg'), { orientation: 1 })).error).toContain('jpegtran');
      expect((await shrinkJpeg(src, resolve(dir, 'b.jpg'))).error).toContain('ImageMagick');
      expect((await bakeImage(src, resolve(dir, 'c'))).error).toContain('ImageMagick');
    });

    expect(readdirSync(dir).filter(n => /^[abc]/.test(n))).toEqual([]);
  });

  test('saving a node reports bake_failed and keeps the upload', async () => {
    if(!ready) return;

    const h = await open(':memory:');
    const hash = 'd'.repeat(64);

    writeFileSync(resolve(config.uploadsDir, `${hash}.jpg`), Buffer.from(await Bun.file(resolve(root, 'in.jpg')).arrayBuffer()));
    writeFileSync(resolve(config.uploadsDir, `${hash}.json`), JSON.stringify({ hash, ext: 'jpg', display: `${hash}.jpg` }));

    const before = tree(dir);
    const r = await withoutTools(() => saveNew(h, { doc: doc([photo('photo001', hash)]) }));

    expect(r).toMatchObject({ status: 500, body: { error: 'bake_failed' } });
    expect(h.get('SELECT count(*) AS n FROM nodes').n).toBe(0);
    expect(h.get('SELECT count(*) AS n FROM photos').n).toBe(0);
    expect(tree(dir)).toEqual(before);
    expect(getNode(h, 1)).toBeNull();
  });
});
