// bun test: sniffing, colours, probe and palette of generated fixtures
import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { sniff } from '../server/media/sniff.js';
import { choosePadding, distance } from '../server/media/color.js';
import { detectTools, imagemagick, tools } from '../server/media/tools.js';
import { identify } from '../server/media/probe.js';
import { palette } from '../server/media/palette.js';
import { run } from '../server/media/run.js';

const bytes = (...list) => Uint8Array.from([...list, ...new Array(Math.max(0, 32 - list.length)).fill(0)]);
const ascii = text => [...text].map(c => c.charCodeAt(0));

describe('sniff', () => {
  test('known signatures', () => {
    expect(sniff(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe('jpg');
    expect(sniff(bytes(0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe('png');
    expect(sniff(bytes(...ascii('GIF89a')))?.ext).toBe('gif');
    expect(sniff(bytes(...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')))?.ext).toBe('webp');
    expect(sniff(bytes(0x49, 0x49, 0x2a, 0x00))?.ext).toBe('tiff');
  });

  test('ISO base media brands', () => {
    const ftyp = (major, ...compatible) => bytes(0, 0, 0, 16 + 4 * compatible.length, ...ascii('ftyp'), ...ascii(major), 0, 0, 0, 0, ...compatible.flatMap(ascii));

    expect(sniff(ftyp('heic', 'mif1'))?.ext).toBe('heic');
    expect(sniff(ftyp('mif1', 'avif'))?.ext).toBe('avif');
    expect(sniff(ftyp('mif1'))?.ext).toBe('heif');
    expect(sniff(ftyp('isom', 'mp41'))).toBeNull();
  });

  test('text, video and short input are rejected', () => {
    expect(sniff(bytes(...ascii('just some text here'))) ).toBeNull();
    expect(sniff(new Uint8Array(5))).toBeNull();
  });
});

describe('colour', () => {
  test('padding is the dominant colour and a clearly different one', () => {
    const colors = [{ hex: '#ff0000' }, { hex: '#fe0101' }, { hex: '#0000ff' }];

    expect(choosePadding(colors)).toEqual(['#ff0000', '#0000ff']);
    expect(choosePadding([{ hex: '#123456' }])).toEqual(['#123456', '#123456']);
    expect(choosePadding([])).toBeNull();
    expect(distance('#000000', '#ffffff')).toBeGreaterThan(0.9);
  });
});

describe('probe and palette (needs ImageMagick)', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'wb-test-'));
  const path = name => resolve(dir, name);

  beforeAll(async () => {
    await detectTools();

    const im = imagemagick.convert;

    await run([...im, '-size', '100x100', 'xc:#ff0000', '-fill', '#0000ff', '-draw', 'rectangle 0,0 99,29', path('two.png')]);
    await run([...im, '-size', '60x60', 'xc:none', '-fill', '#00aa00', '-draw', 'circle 30,30 30,5', path('alpha.png')]);
    await run([...im, '-size', '200x100', 'gradient:red-blue', path('wide.jpg')]);

    if(tools.exiftool) await run(['exiftool', '-overwrite_original', '-Orientation#=6', path('wide.jpg')]);
  });

  test('two-colour png: both colours, weighted', async () => {
    const { value } = await palette(path('two.png'));

    expect(value[0]).toEqual({ hex: '#ff0000', weight: expect.closeTo(0.7, 1) });
    expect(value[1]).toEqual({ hex: '#0000ff', weight: expect.closeTo(0.3, 1) });
    expect(value.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(1, 1);
    expect(choosePadding(value)).toEqual(['#ff0000', '#0000ff']);
  });

  test('transparent pixels are not a colour', async () => {
    const { value } = await palette(path('alpha.png'));

    expect(value.map(c => c.hex)).toEqual(['#00aa00']);
  });

  test('identify reports size, alpha and EXIF orientation as displayed', async () => {
    expect(await identify(path('two.png'))).toEqual({ width: 100, height: 100, hasAlpha: false, orientation: 1 });
    expect((await identify(path('alpha.png'))).hasAlpha).toBe(true);

    if(tools.exiftool) expect(await identify(path('wide.jpg'))).toEqual({ width: 100, height: 200, hasAlpha: false, orientation: 6 });
  });

  test('a corrupt image degrades to an error without server paths', async () => {
    await Bun.write(path('bad.png'), new Uint8Array([0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(40).fill(7)]));

    const result = await identify(path('bad.png'));

    expect(result.error).toStartWith('identify:');
    expect(result.error).not.toContain(dir);
  });
});
