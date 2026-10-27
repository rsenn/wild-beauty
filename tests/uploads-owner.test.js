// bun test: uploads belong to the cookie that sent them and expire with it.
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';

setDefaultTimeout(30000);

const PORT = 3700 + Math.floor(Math.random() * 300);
const base = `http://localhost:${PORT}`;
let root;
let server;
let ready = false;

// a browser: its own cookie
const browser = () => {
  let cookie = '';

  return async (path, init = {}) => {
    const res = await fetch(base + path, { ...init, headers: { ...(cookie && { cookie }), ...init.headers } });
    const set = res.headers.get('set-cookie');

    if(set) cookie = set.split(';')[0];

    return res;
  };
};

const send = (call, file) => call('/api/uploads', { method: 'POST', headers: { 'x-filename': 'in.jpg', 'content-type': 'application/octet-stream' }, body: Bun.file(file) });

beforeAll(async () => {
  await detectTools();
  ready = !!imagemagick.convert;

  if(!ready) return;

  root = mkdtempSync(resolve(tmpdir(), 'wb-owner-'));
  await run([...imagemagick.convert, '-size', '64x48', 'gradient:red-blue', resolve(root, 'in.jpg')]);

  server = Bun.spawn(['bun', 'server.js'], { cwd: resolve(import.meta.dir, '..'), env: { ...process.env, PORT: String(PORT), WB_UPLOAD_TTL_MS: '3000', WB_DATA: resolve(root, 'data'), WB_UPLOADS: resolve(root, 'uploads') }, stdout: 'ignore', stderr: 'ignore' });

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

describe('upload ownership', () => {
  test('a browser sees its own uploads only, the cookie has the upload lifetime', async () => {
    if(!ready) return;

    const a = browser();
    const b = browser();
    const res = await send(a, resolve(root, 'in.jpg'));

    expect(res.status).toBe(201);
    expect(res.headers.get('set-cookie')).toMatch(/Max-Age=3;/);
    expect((await res.json()).owners).toBeUndefined();

    expect((await (await a('/api/uploads')).json()).length).toBe(1);
    expect(await (await b('/api/uploads')).json()).toEqual([]);

    const hash = (await (await a('/api/uploads')).json())[0].hash;

    // another browser cannot delete it, the owner can
    expect((await b(`/api/uploads/${hash}`, { method: 'DELETE' })).status).toBe(404);
    expect((await a(`/api/uploads/${hash}`, { method: 'DELETE' })).status).toBe(204);
    expect(await (await a('/api/uploads')).json()).toEqual([]);
  });

  test('the same bytes from two browsers: both see it, one leaving keeps it for the other', async () => {
    if(!ready) return;

    const a = browser();
    const b = browser();

    await send(a, resolve(root, 'in.jpg'));
    await send(b, resolve(root, 'in.jpg'));

    const [{ hash }] = await (await a('/api/uploads')).json();

    expect((await (await b('/api/uploads')).json()).length).toBe(1);
    await a(`/api/uploads/${hash}`, { method: 'DELETE' });
    expect((await (await b('/api/uploads')).json()).length).toBe(1);
  });

  test('past the expiry the upload is gone from the list', async () => {
    if(!ready) return;

    const a = browser();

    await send(a, resolve(root, 'in.jpg'));
    expect((await (await a('/api/uploads')).json()).length).toBe(1);
    await Bun.sleep(3200);
    expect(await (await a('/api/uploads')).json()).toEqual([]);
  });
});
