// bun test: where the site and the installed app start (server.js route): the
// site on the 3D gallery of all nodes, the app on the editor, in the visitor's language
import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

setDefaultTimeout(30000);

const PORT = 3700 + Math.floor(Math.random() * 200);
const base = `http://localhost:${PORT}`;
let root;
let server;

beforeAll(async () => {
  root = mkdtempSync(resolve(tmpdir(), 'wb-start-'));
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

const where = async (path, language) => {
  const res = await fetch(base + path, { redirect: 'manual', headers: language ? { 'accept-language': language } : {} });

  return [res.status, new URL(res.headers.get('location'), base).pathname];
};

test('the site opens on the gallery, in the visitor\'s language', async () => {
  expect(await where('/', 'de')).toEqual([302, '/de/gallery']);
  expect(await where('/', 'fr')).toEqual([302, '/fr/gallery']);
});

test('the installed app starts on the editor (manifest start_url /new)', async () => {
  expect(await where('/new', 'de')).toEqual([302, '/de/new']);
  expect((await (await fetch(base + '/manifest.webmanifest')).json()).start_url).toBe('/new');
});

test('the gallery page is served and is empty before there is a node', async () => {
  const res = await fetch(base + '/en/gallery');
  const html = await res.text();

  expect(res.status).toBe(200);
  expect(html).toContain('No nodes with a picture yet.');
});
