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

  test('the list says when each upload expires', async () => {
    if(!ready) return;

    const a = browser();
    const record = await (await send(a, resolve(root, 'in.jpg'))).json();

    expect(record.expiresAt).toBeGreaterThan(Date.now());
    expect((await (await a('/api/uploads')).json())[0].expiresAt).toBe(record.expiresAt);
  });

  test('clearing lets go of everything but what is kept, for this browser only', async () => {
    if(!ready) return;

    const a = browser();
    const b = browser();

    await send(a, resolve(root, 'in.jpg'));
    await run([...imagemagick.convert, '-size', '40x40', 'xc:green', resolve(root, 'two.jpg')]);
    await send(a, resolve(root, 'two.jpg'));
    await send(b, resolve(root, 'in.jpg'));

    const mine = await (await a('/api/uploads')).json();

    expect(mine.length).toBe(2);

    const keep = mine[0].hash;
    const res = await a('/api/uploads', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keep: [keep] }) });
    const { removed } = await res.json();

    expect(removed).toEqual(mine.filter(r => r.hash !== keep).map(r => r.hash));
    expect((await (await a('/api/uploads')).json()).map(r => r.hash)).toEqual([keep]);
    expect((await (await b('/api/uploads')).json()).length).toBe(1);
  });
});

describe('orphans', () => {
  test('an upload file without a record and old job leftovers go, young ones stay', async () => {
    const { config } = await import('../server/config.js');
    const { sweepOrphans } = await import('../server/api/uploads.js');
    const { mkdirSync, utimesSync, writeFileSync, existsSync } = await import('node:fs');
    const dir = mkdtempSync(resolve(tmpdir(), 'wb-orphan-'));
    const saved = { ...config };

    Object.assign(config, { uploadsDir: resolve(dir, 'uploads'), tmpDir: resolve(dir, 'uploads/.tmp') });
    mkdirSync(config.tmpDir, { recursive: true });

    const hash = 'c'.repeat(64);
    const old = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const put = (path, date) => (writeFileSync(path, 'x'), date && utimesSync(path, date, date));

    put(resolve(config.uploadsDir, `${hash}.jpg`), old);
    put(resolve(config.uploadsDir, `${'d'.repeat(64)}.jpg`)); // young: a write in progress
    put(resolve(config.tmpDir, 'job-old'), old);
    put(resolve(config.tmpDir, 'job-new'));
    mkdirSync(resolve(config.tmpDir, 'segment-cache'));
    utimesSync(resolve(config.tmpDir, 'segment-cache'), old, old);

    const gone = sweepOrphans();

    expect(gone.sort()).toEqual([`${hash}.jpg`, 'job-old']);
    expect(existsSync(resolve(config.tmpDir, 'job-new'))).toBe(true);
    expect(existsSync(resolve(config.tmpDir, 'segment-cache'))).toBe(true);
    expect(existsSync(resolve(config.uploadsDir, `${'d'.repeat(64)}.jpg`))).toBe(true);

    Object.assign(config, saved);
    rmSync(dir, { recursive: true, force: true });
  });
});
