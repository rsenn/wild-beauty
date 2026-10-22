// bun test: server/media/bake.js on generated fixtures
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { bake, bakeJpeg, bakeJpegFile, bakeUpload, iccProfile, jpegQuality, shrinkJpeg } from '../server/media/bake.js';
import { identify } from '../server/media/probe.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick, tools } from '../server/media/tools.js';

setDefaultTimeout(30000);

let dir;
let ready = false;
const path = name => resolve(dir, name);

// a deterministic picture whose four quadrants differ, so any wrong turn shows
async function fixture(name, size, orientation) {
  const args = [...imagemagick.convert, '-size', size, 'gradient:red-blue', '-rotate', '30', '-crop', size + '+0+0', '+repage', '-sampling-factor', '4:2:0', '-quality', '90'];

  await run([...args, path(name)]);
  await run(['exiftool', '-overwrite_original', `-Orientation#=${orientation}`, '-Make=Testcam', '-Comment=secret', path(name)]);
}

// raw 8-bit RGB of an image after ImageMagick has applied its orientation
const pixels = async file => Buffer.from(await new Response(Bun.spawn([...imagemagick.convert, `${file}[0]`, '-auto-orient', 'rgb:-'], { stdout: 'pipe' }).stdout).arrayBuffer());

beforeAll(async () => {
  await detectTools();
  ready = !!(tools.jpegtran && imagemagick.convert && tools.exiftool);
  dir = mkdtempSync(resolve(tmpdir(), 'wb-bake-'));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('bakeJpeg', () => {
  test('every orientation: the output shows the oriented picture and carries no EXIF', async () => {
    if(!ready) return;

    for(let o = 1; o <= 8; o++) {
      const src = `o${o}.jpg`;

      await fixture(src, '64x48', o);
      expect((await identify(path(src))).orientation).toBe(o);

      const r = await bakeJpeg(path(src), path(`baked${o}.jpg`));
      const want = await pixels(path(src));
      const got = await pixels(path(`baked${o}.jpg`));
      let worst = 0;

      expect(r).toEqual({ ok: true, orientation: o, trimmed: false, icc: false });
      expect(got.length).toBe(want.length);
      for(let i = 0; i < got.length; i++) worst = Math.max(worst, Math.abs(got[i] - want[i]));
      // a lossless turn of the coefficients and a turn of the decoded pixels differ only by chroma upsampling
      expect(worst).toBeLessThanOrEqual(8);

      const info = await identify(path(`baked${o}.jpg`));

      expect(info.orientation).toBe(1);
      expect([info.width, info.height]).toEqual(o >= 5 ? [48, 64] : [64, 48]);

      const dump = (await run(['exiftool', '-s', path(`baked${o}.jpg`)])).stdout;

      expect(dump).not.toMatch(/Orientation|Make|Comment|Testcam|secret/);
    }
  });

  test('an orientation 1 file is not re-encoded: the pixels are identical', async () => {
    if(!ready) return;

    await fixture('plain.jpg', '64x48', 1);
    await bakeJpeg(path('plain.jpg'), path('plain-baked.jpg'));
    expect((await pixels(path('plain-baked.jpg'))).equals(await pixels(path('plain.jpg')))).toBe(true);
  });

  test('a size that is not a block multiple is trimmed', async () => {
    if(!ready) return;

    await fixture('odd.jpg', '67x45', 6);

    const r = await bakeJpeg(path('odd.jpg'), path('odd-baked.jpg'));
    const info = await identify(path('odd-baked.jpg'));

    expect(r.ok).toBe(true);
    expect(r.trimmed).toBe(true);
    expect(info.width).toBeLessThanOrEqual(45);
    expect(info.height).toBeLessThanOrEqual(67);
    expect(info.height).toBeGreaterThan(50);
  });

  test('baking twice gives the same file, a bad source an error and no output', async () => {
    if(!ready) return;

    await bakeJpeg(path('o6.jpg'), path('again1.jpg'));
    await bakeJpeg(path('o6.jpg'), path('again2.jpg'));
    expect(await Bun.file(path('again1.jpg')).bytes()).toEqual(await Bun.file(path('again2.jpg')).bytes());

    await Bun.write(path('bad.jpg'), 'not a jpeg');

    const r = await bakeJpeg(path('bad.jpg'), path('bad-baked.jpg'), { orientation: 1 });

    expect(r.error).toContain('bake');
    expect(existsSync(path('bad-baked.jpg'))).toBe(false);
    expect(existsSync(path('bad-baked.jpg.tmp'))).toBe(false);
  });
});

describe('shrinkJpeg', () => {
  const big = async (name, size, quality) => {
    await run([...imagemagick.convert, '-size', size, 'gradient:red-blue', '-attenuate', '0.3', '+noise', 'Random', '-quality', String(quality), path(name)]);
  };

  test('long edge 2048, quality no higher than the source, no EXIF', async () => {
    if(!ready) return;

    for(const q of [60, 85, 95]) {
      await big(`big${q}.jpg`, '3000x2000', q);
      await run(['exiftool', '-overwrite_original', '-Make=Testcam', '-Orientation#=6', path(`big${q}.jpg`)]);

      const before = await jpegQuality(path(`big${q}.jpg`));
      const r = await shrinkJpeg(path(`big${q}.jpg`), path(`small${q}.jpg`));
      const after = await jpegQuality(path(`small${q}.jpg`));

      expect(r.ok).toBe(true);
      // the file is turned by its orientation: 3000x2000 shown as 2000x3000, long edge 2048
      expect([r.width, r.height]).toEqual([1365, 2048]);
      expect(after).toBeLessThanOrEqual(before);
      expect(r.quality).toBe(before);
      expect((await run(['exiftool', '-s', path(`small${q}.jpg`)])).stdout).not.toMatch(/Make|Testcam|Orientation/);
    }
  });

  test('bakeJpegFile: small passes through, large is shrunk', async () => {
    if(!ready) return;

    const a = await bakeJpegFile(path('o6.jpg'), path('via-tran.jpg'));
    const b = await bakeJpegFile(path('big85.jpg'), path('via-shrink.jpg'));

    expect(a).toMatchObject({ ok: true, orientation: 6 });
    expect(b).toMatchObject({ ok: true, quality: 85 });
    expect((await identify(path('via-shrink.jpg'))).width).toBeLessThanOrEqual(2048);
  });

  test('a smaller limit and an unreadable source', async () => {
    if(!ready) return;

    expect((await shrinkJpeg(path('plain.jpg'), path('tiny.jpg'), { max: 32 })).width).toBe(32);
    expect((await shrinkJpeg(path('bad.jpg'), path('bad2.jpg'))).error).toContain('bake');
    expect(existsSync(path('bad2.jpg'))).toBe(false);
  });
});

describe('bakeImage and bake', () => {
  const make = (name, ...args) => run([...imagemagick.convert, ...args, path(name)]);
  const opaque = async file => (await run([...imagemagick.identify, '-format', '%[opaque]', `${file}[0]`])).stdout.trim();

  test('an opaque PNG becomes a JPEG at quality 99', async () => {
    if(!ready) return;

    await make('opaque.png', '-size', '300x200', 'gradient:red-blue');

    const r = await bake(path('opaque.png'), path('opaque-baked'));

    expect(r).toMatchObject({ ok: true, ext: 'jpg', width: 300, height: 200 });
    expect(await jpegQuality(path('opaque-baked.jpg'))).toBeGreaterThanOrEqual(98);
    expect((await identify(path('opaque-baked.jpg'))).hasAlpha).toBe(false);
  });

  test('a PNG with alpha never becomes a JPEG and keeps its transparency', async () => {
    if(!ready) return;

    await make('alpha.png', '-size', '300x200', 'xc:none', '-fill', 'red', '-draw', 'circle 150,100 150,40');

    const r = await bake(path('alpha.png'), path('alpha-baked'));

    expect(r.ok).toBe(true);
    expect(['webp', 'png']).toContain(r.ext);
    expect(existsSync(path('alpha-baked.jpg'))).toBe(false);
    expect(await opaque(path(`alpha-baked.${r.ext}`))).toBe('false');
  });

  test('an alpha channel with nothing transparent is flattened to a JPEG', async () => {
    if(!ready) return;

    await make('solid-alpha.png', '-size', '64x64', 'xc:blue', '-alpha', 'on');
    expect(await bake(path('solid-alpha.png'), path('solid-baked'))).toMatchObject({ ok: true, ext: 'jpg' });
  });

  test('a large image is shrunk to the long edge, oriented', async () => {
    if(!ready) return;

    await make('wide.tif', '-size', '3000x1000', 'gradient:red-blue');

    const r = await bake(path('wide.tif'), path('wide-baked'));

    expect(r).toMatchObject({ ok: true, ext: 'jpg', width: 2048, height: 683 });
  });

  test('gif and webp sources, the first frame', async () => {
    if(!ready) return;

    await make('anim.gif', '-size', '40x30', 'xc:red', '-size', '40x30', 'xc:blue');
    expect(await bake(path('anim.gif'), path('gif-baked'))).toMatchObject({ ok: true, ext: 'jpg', width: 40, height: 30 });
  });

  test('a JPEG goes to the JPEG rules', async () => {
    if(!ready) return;

    expect(await bake(path('o6.jpg'), path('jpeg-baked'))).toMatchObject({ ok: true, ext: 'jpg', orientation: 6 });
    expect(await bake(path('big85.jpg'), path('jpeg-big'))).toMatchObject({ ok: true, ext: 'jpg', quality: 85 });
  });

  test('not an image is an error and leaves nothing', async () => {
    if(!ready) return;

    const r = await bake(path('bad.jpg'), path('nothing'));

    expect(r.error).toContain('bake');
    expect(existsSync(path('nothing.jpg'))).toBe(false);
  });
});

describe('colour profiles', () => {
  const ICC = '/usr/share/color/icc/colord';
  const haveProfiles = existsSync(`${ICC}/AdobeRGB1998.icc`) && existsSync(`${ICC}/sRGB.icc`);
  const tagged = async (name, profile, ...extra) => {
    await run([...imagemagick.convert, '-size', '64x48', 'gradient:red-blue', '-profile', `${ICC}/sRGB.icc`, '-profile', `${ICC}/${profile}`, ...extra, path(name)]);
  };

  test('JPEG pass-through keeps a non-sRGB profile, drops sRGB', async () => {
    if(!ready || !haveProfiles) return;

    await tagged('adobe.jpg', 'AdobeRGB1998.icc');
    await run([...imagemagick.convert, '-size', '64x48', 'gradient:red-blue', '-profile', `${ICC}/sRGB.icc`, path('srgb.jpg')]);

    const a = await bakeJpeg(path('adobe.jpg'), path('adobe-baked.jpg'));
    const b = await bakeJpeg(path('srgb.jpg'), path('srgb-baked.jpg'));
    const c = await bakeJpeg(path('adobe.jpg'), path('adobe-dropped.jpg'), { keepIcc: false });

    expect(a.icc).toBe(true);
    expect(b.icc).toBe(false);
    expect(c.icc).toBe(false);
    expect((await iccProfile(path('adobe-baked.jpg'))).description).toMatch(/Adobe/);
    expect(await iccProfile(path('srgb-baked.jpg'))).toBeNull();
    expect(await iccProfile(path('adobe-dropped.jpg'))).toBeNull();
  });

  test('shrinking and non-JPEG baking keep it too', async () => {
    if(!ready || !haveProfiles) return;

    await tagged('adobe-big.jpg', 'AdobeRGB1998.icc', '-resize', '3000x2000!');
    await run([...imagemagick.convert, '-size', '64x48', 'gradient:red-blue', '-profile', `${ICC}/AdobeRGB1998.icc`, path('adobe.png')]);

    const a = await bake(path('adobe-big.jpg'), path('adobe-shrunk'));
    const b = await bake(path('adobe.png'), path('adobe-png'));

    expect(a).toMatchObject({ ok: true, icc: true });
    expect(b).toMatchObject({ ok: true, ext: 'jpg', icc: true });
    expect((await iccProfile(path('adobe-shrunk.jpg'))).description).toMatch(/Adobe/);
    expect((await iccProfile(path('adobe-png.jpg'))).description).toMatch(/Adobe/);
    expect(existsSync(path('adobe-big.jpg') + '.icc')).toBe(false);
  });
});

describe('HEIC', () => {
  test('a HEIC upload bakes from its display file to a JPEG', async () => {
    if(!ready || !Bun.which('heif-enc') || !Bun.which('heif-convert')) return;

    const { config } = await import('../server/config.js');
    const { extractDisplay } = await import('../server/media/heif.js');
    const { readdirSync } = await import('node:fs');
    const saved = { ...config };

    config.uploadsDir = path('uploads');
    config.tmpDir = path('uploads/.tmp');
    await run(['mkdir', '-p', config.tmpDir]);

    try {
      await run([...imagemagick.convert, '-size', '320x240', 'gradient:red-blue', path('src.jpg')]);
      await run(['heif-enc', '-q', '90', '-o', path('uploads/h.heic'), path('src.jpg')]);

      const display = await extractDisplay(path('uploads/h.heic'), 'h');
      const r = await bakeUpload({ hash: 'h', ext: 'heic', display }, path('heic-baked'));

      expect(display).toBe('h.display.jpg');
      expect(r).toMatchObject({ ok: true, ext: 'jpg', icc: false });
      expect(readdirSync(dir)).toContain('heic-baked.jpg');
    } finally {
      Object.assign(config, saved);
    }
  });
});
