// bun test: the real server on temporary directories, over HTTP. Uploads a
// photo, saves a node, reads it back as an API and as a page, changes and
// deletes it.
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';

setDefaultTimeout(30000);

const PORT = 3200 + Math.floor(Math.random() * 500);
const base = `http://localhost:${PORT}`;
let root;
let server;
let ready = false;
let cookie = '';

const call = async (path, init = {}) => {
  const res = await fetch(base + path, { ...init, headers: { ...(cookie && { cookie }), ...init.headers }, redirect: 'manual' });
  const set = res.headers.get('set-cookie');

  if(set) cookie = set.split(';')[0];

  return res;
};
const json = (method, path, body) => call(path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

const photo = (id, hash) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal' });
const doc = (steps, extra = {}) => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps }], ...extra });

beforeAll(async () => {
  await detectTools();
  ready = !!(imagemagick.convert && Bun.which('jpegtran'));

  if(!ready) return;

  root = mkdtempSync(resolve(tmpdir(), 'wb-e2e-'));
  await run([...imagemagick.convert, '-size', '240x160', 'gradient:red-blue', resolve(root, 'in.jpg')]);

  server = Bun.spawn(['bun', 'server.js'], { cwd: resolve(import.meta.dir, '..'), env: { ...process.env, PORT: String(PORT), WB_DATA: resolve(root, 'data'), WB_UPLOADS: resolve(root, 'uploads') }, stdout: 'ignore', stderr: 'ignore' });

  for(let i = 0; i < 100; i++) {
    try {
      if((await fetch(base + '/api/capabilities')).ok) return;
    } catch {}

    await Bun.sleep(100);
  }

  throw new Error('server did not start');
});

afterAll(() => {
  server?.kill();
  if(root) rmSync(root, { recursive: true, force: true });
});

describe('the whole path over HTTP', () => {
  let hash;
  let id;

  test('upload a photo', async () => {
    if(!ready) return;

    const res = await call('/api/uploads', { method: 'POST', headers: { 'x-filename': 'in.jpg', 'content-type': 'application/octet-stream' }, body: Bun.file(resolve(root, 'in.jpg')) });
    const record = await res.json();

    expect(res.status).toBe(201);
    hash = record.hash;
  });

  test('save a node with it; the upload is gone, the baked photo is served', async () => {
    if(!ready) return;

    const res = await json('POST', '/api/nodes', { doc: doc([photo('photo001', hash)], { title: 'Sunset <b>' }) });

    expect(res.status).toBe(201);
    id = (await res.json()).id;
    expect(existsSync(resolve(root, 'uploads', `${hash}.json`))).toBe(false);

    const baked = await call(`/files/photos/${hash}.jpg`);

    expect(baked.status).toBe(200);
    expect(baked.headers.get('content-type')).toBe('image/jpeg');
    expect((await call(`/files/photos/${hash}.thumb.jpg`)).status).toBe(200);
  });

  test('GET /api/nodes/:id returns the document, with an ETag', async () => {
    if(!ready) return;

    const res = await call(`/api/nodes/${id}`);
    const body = await res.json();

    expect(body).toMatchObject({ rev: 1, node: { id, title: 'Sunset <b>', tile: hash } });
    expect((await call(`/api/nodes/${id}`, { headers: { 'if-none-match': res.headers.get('etag') } })).status).toBe(304);
  });

  test('the node page shows the node in the HTML itself', async () => {
    if(!ready) return;

    const res = await call(`/en/node/${id}`);
    const page = await res.text();

    expect(res.status).toBe(200);
    expect(page).toContain('<h1 class="wb-node-title">Sunset &lt;b></h1>');
    expect(page).toContain(`<image href="/files/photos/${hash}.jpg"`);
    expect(page).toContain('<linearGradient');
    expect(page).toContain('<title>Wild Beauty - Sunset &lt;b&gt;</title>');
    expect(page).not.toContain('<b>');
    // the language links point at the same node
    expect(page).toContain(`href="/de/node/${id}"`);
    // the browser adopts it from the boot JSON
    expect(page).toContain('id="boot"');
  });

  test('the page in other languages, and nodes that do not exist', async () => {
    if(!ready) return;

    await json('POST', '/api/nodes', { doc: doc([]) }).then(async r => {
      const other = (await r.json()).id;

      expect(await (await call(`/fr/node/${other}`)).text()).toContain('Sans titre');
      expect(await (await call(`/de/node/${other}`)).text()).toContain('Ohne Titel');
    });

    expect((await call('/en/node/9999')).status).toBe(404);
    expect((await call('/xx/node/1')).status).toBe(404);
    expect((await call('/en/node/abc')).status).toBe(404);
  });

  test('lock, a stale update, an update, delete', async () => {
    if(!ready) return;

    expect((await json('POST', `/api/nodes/${id}/lock`)).status).toBe(200);
    expect((await json('PUT', `/api/nodes/${id}`, { rev: 1, doc: doc([photo('photo001', hash)], { title: 'Dawn' }) })).status).toBe(200);
    expect((await json('PUT', `/api/nodes/${id}`, { rev: 1, doc: doc([]) })).status).toBe(409);
    expect(await (await call(`/en/node/${id}`)).text()).toContain('Dawn');

    // another browser: no cookie, so another session; the lock is gone after the save
    expect((await fetch(base + `/api/nodes/${id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await call(`/api/nodes/${id}`)).status).toBe(404);
    expect(readdirSync(resolve(root, 'data', 'photos')).filter(n => n.startsWith(hash))).toEqual([]);
  });
});
