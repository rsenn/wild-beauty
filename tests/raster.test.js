import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { inkscapeSvg, rasterSvg, rasterise } from '../server/media/raster.js';

const text = { op: 'text', id: 't0000001', text: 'Hi', lines: ['Hi'], m: [1, 0, 0, 1, 10, 10], w: 400, h: 60, font: 'sans', size: 40, color: '#ffffff', align: 'start', padding: 0, radius: 0 };
const doc = { v: 1, mode: 'free', bg: '#223355', pages: [{ steps: [text] }] };

describe('server rasteriser (E82)', () => {
  test('the SVG is sized and photos are bare file names', () => {
    const svg = rasterSvg({ ...doc, pages: [{ steps: [{ op: 'photo', id: 'p0000001', photo: 'abcd', m: [1, 0, 0, 1, 0, 0], opacity: 1, blend: 'normal' }] }] }, { size: 256, photos: () => ({ href: 'abcd.png', width: 4, height: 3 }) });

    expect(svg).toContain('width="256" height="256"');
    expect(svg).toContain('href="abcd.png"');
  });

  test('Inkscape gets the xlink spelling', () => expect(inkscapeSvg('<svg><image href="a.png"/><textPath href="#c">x</textPath></svg>')).toBe('<svg xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="a.png"/><textPath xlink:href="#c">x</textPath></svg>'));

  test('draws a PNG when rsvg-convert is there', async () => {
    if(!Bun.which('rsvg-convert')) return;

    const dir = mkdtempSync(resolve(tmpdir(), 'wb-raster-'));
    const r = await rasterise(doc, resolve(dir, 'o.png'), { size: 128, dir, photoInfo: () => null });

    expect(r.ok).toBe(true);
    expect(existsSync(resolve(dir, 'o.png'))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});
