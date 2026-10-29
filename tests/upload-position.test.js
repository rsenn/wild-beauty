// bun test: the position a browser attaches to a camera photo (EDITOR.md E139)
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { cleanPosition } from '../server/api/uploads.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick, tools } from '../server/media/tools.js';

setDefaultTimeout(30000);

const PORT = 4000 + Math.floor(Math.random() * 300);
const base = `http://localhost:${PORT}`;
let root;
let server;
let ready = false;

const send = (file, headers = {}) => fetch(base + '/api/uploads', { method: 'POST', headers: { 'x-filename': 'in.jpg', 'content-type': 'application/octet-stream', ...headers }, body: Bun.file(file) });

beforeAll(async () => {
  await detectTools();
  ready = !!imagemagick.convert;

  if(!ready) return;

  root = mkdtempSync(resolve(tmpdir(), 'wb-pos-up-'));

  // three different pictures: plain, plain again with another colour, and one with its own GPS
  await run([...imagemagick.convert, '-size', '64x48', 'xc:#aa2200', resolve(root, 'plain.jpg')]);
  await run([...imagemagick.convert, '-size', '64x48', 'xc:#22aa00', resolve(root, 'geo.jpg')]);

  if(tools.exiftool) await run(['exiftool', '-overwrite_original', '-GPSLatitude=46.948', '-GPSLatitudeRef=N', '-GPSLongitude=7.4474', '-GPSLongitudeRef=E', resolve(root, 'geo.jpg')]);

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

describe('X-Position header', () => {
  test('rounded to ~1 km; anything else is no position', () => {
    expect(cleanPosition('47.37689, 8.54169')).toEqual({ lat: 47.38, lon: 8.54 });
    expect(cleanPosition('-33.8688,151.2093')).toEqual({ lat: -33.87, lon: 151.21 });

    for(const bad of [null, '', '0,0', '95,1', '1,200', 'a,b', '1;2', '47.38', '1,2,3', '1e2,3']) expect(cleanPosition(bad)).toBeNull();
  });
});

describe('upload with a tagged position', () => {
  test('the tag becomes the record position, rounded, and no pos without it', async () => {
    if(!ready) return;

    const tagged = await (await send(resolve(root, 'plain.jpg'), { 'x-position': '47.37689,8.54169' })).json();

    expect(tagged.pos).toEqual({ lat: 47.38, lon: 8.54 });
    expect(JSON.stringify(tagged)).not.toContain('47.37689');
  });

  test('a garbage tag is ignored', async () => {
    if(!ready) return;

    // new bytes so it is not the earlier record again
    await run([...imagemagick.convert, '-size', '64x48', 'xc:#0022aa', resolve(root, 'blue.jpg')]);

    expect((await (await send(resolve(root, 'blue.jpg'), { 'x-position': 'nowhere' })).json()).pos).toBeNull();
  });

  test('the photo\'s own EXIF position wins over the tag', async () => {
    if(!ready || !tools.exiftool) return;

    const record = await (await send(resolve(root, 'geo.jpg'), { 'x-position': '47.37689,8.54169' })).json();

    expect(record.pos).toEqual({ lat: 46.95, lon: 7.45 });
  });
});
