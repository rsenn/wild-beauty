// bun test: server/media/thumb.js
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { jpegQuality } from '../server/media/bake.js';
import { identify } from '../server/media/probe.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';
import { firstPhotoStep, thumbnail } from '../server/media/thumb.js';

setDefaultTimeout(30000);

let dir;
let ready = false;
const path = name => resolve(dir, name);
const make = (name, ...args) => run([...imagemagick.convert, ...args, path(name)]);

// "r,g,b" of one pixel, 0..255
async function pixel(file, x, y) {
  const { stdout } = await run([...imagemagick.convert, `${path(file)}[1x1+${x}+${y}]`, '-format', '%[fx:int(255*r)],%[fx:int(255*g)],%[fx:int(255*b)]', 'info:']);

  return stdout.split(',').map(Number);
}

const near = (got, want, tolerance = 24) => got.every((v, i) => Math.abs(v - want[i]) <= tolerance);

beforeAll(async () => {
  await detectTools();
  ready = !!imagemagick.convert;
  dir = mkdtempSync(resolve(tmpdir(), 'wb-thumb-'));

  if(ready) {
    await make('wide.jpg', '-size', '400x200', 'xc:#00ff00', '-quality', '70');
    await make('tall.png', '-size', '200x400', 'xc:#00ff00');
  }
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('thumbnail', () => {
  test('the square window fills the thumbnail, whatever the shape of the photo', async () => {
    if(!ready) return;

    const step = { crop: 0.5, m: [1, 0, 0, 1, 0, 0] };
    const r = await thumbnail(path('wide.jpg'), path('t1.jpg'), { step });
    const info = await identify(path('t1.jpg'));

    expect(r.ok).toBe(true);
    expect([info.width, info.height]).toEqual([512, 512]);
    for(const [x, y] of [[2, 2], [509, 2], [2, 509], [509, 509]]) expect(near(await pixel('t1.jpg', x, y), [0, 255, 0])).toBe(true);

    await thumbnail(path('tall.png'), path('t2.jpg'), { step: { crop: 0, m: [1, 0, 0, 1, 0, 0] } });
    for(const [x, y] of [[2, 2], [509, 509]]) expect(near(await pixel('t2.jpg', x, y), [0, 255, 0])).toBe(true);
  });

  test('free: a matrix with rotation and scale, the document ground behind', async () => {
    if(!ready) return;

    // quarter turn, half size: the square covers x 250..750, y 250..750 of the stage
    const step = { crop: 0.5, m: [0, 0.5, -0.5, 0, 750, 250] };

    await thumbnail(path('wide.jpg'), path('t4.jpg'), { step, bg: '#ffff00' });
    expect(near(await pixel('t4.jpg', 5, 500), [255, 255, 0])).toBe(true);
    expect(near(await pixel('t4.jpg', 256, 256), [0, 255, 0])).toBe(true);
  });

  test('quality: a JPEG source is not exceeded, others get 99', async () => {
    if(!ready) return;

    const step = { crop: 0.5, m: [1, 0, 0, 1, 0, 0] };
    const jpeg = await thumbnail(path('wide.jpg'), path('t5.jpg'), { step });
    const png = await thumbnail(path('tall.png'), path('t6.jpg'), { step });

    expect(jpeg.quality).toBe(await jpegQuality(path('wide.jpg')));
    expect(await jpegQuality(path('t5.jpg'))).toBeLessThanOrEqual(jpeg.quality);
    expect(png.quality).toBe(99);
  });

  test('a custom size and a bad source', async () => {
    if(!ready) return;

    const step = { crop: 0.5, m: [1, 0, 0, 1, 0, 0] };

    await thumbnail(path('wide.jpg'), path('t7.jpg'), { step, size: 128 });
    expect((await identify(path('t7.jpg'))).width).toBe(128);
    expect((await thumbnail(path('missing.jpg'), path('t8.jpg'), { step })).error).toContain('thumb');
  });
});

describe('firstPhotoStep', () => {
  test('page order, null without photos', () => {
    const photo = id => ({ op: 'photo', id });

    expect(firstPhotoStep({ pages: [{ steps: [{ op: 'stroke' }] }, { steps: [photo('a'), photo('b')] }] }).id).toBe('a');
    expect(firstPhotoStep({ pages: [{ steps: [] }] })).toBeNull();
  });
});
