// bun test: browser modules are revalidated, not reused for an unknown time (found in the browser:
// an edited files.js was not seen). The server runs on temporary directories.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const PORT = 4400 + Math.floor(Math.random() * 300);
const base = `http://localhost:${PORT}`;
let root;
let server;

beforeAll(async () => {
  root = mkdtempSync(resolve(tmpdir(), 'wb-cache-'));
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
  rmSync(root, { recursive: true, force: true });
});

describe('static files', () => {
  test('modules and assets say no-cache and when they changed', async () => {
    for(const path of ['/app/files.js', '/static/css/layout.css', '/vendor/preact.js']) {
      const res = await fetch(base + path);

      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('no-cache');
      expect(Date.parse(res.headers.get('last-modified'))).toBeGreaterThan(0);
      expect(res.headers.get('content-type')).toBeTruthy();
    }
  });

  test('an unchanged file answers 304 without a body, a changed one 200', async () => {
    const first = await fetch(base + '/app/files.js');
    const stamp = first.headers.get('last-modified');
    const same = await fetch(base + '/app/files.js', { headers: { 'if-modified-since': stamp } });

    expect(same.status).toBe(304);
    expect(await same.text()).toBe('');
    expect(same.headers.get('cache-control')).toBe('no-cache');
    expect((await fetch(base + '/app/files.js', { headers: { 'if-modified-since': new Date(Date.parse(stamp) - 5000).toUTCString() } })).status).toBe(200);
    expect((await fetch(base + '/app/files.js', { headers: { 'if-modified-since': 'garbage' } })).status).toBe(200);
  });

  test('HEAD and a missing file still work', async () => {
    expect((await fetch(base + '/app/files.js', { method: 'HEAD' })).status).toBe(200);
    expect((await fetch(base + '/app/nope.js')).status).toBe(404);
  });
});
