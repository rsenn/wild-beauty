// bun test: the outline of the visible pixels (client/editor/tools/cutout/alpha.js outlinesFromAlpha, docs/EDITOR.md S2.3)
import { describe, expect, test } from 'bun:test';
import { outlinesFromAlpha } from '../client/editor/tools/cutout/alpha.js';

const W = 128;
// an RGBA image of W x W where `solid(x, y)` says which pixels are visible
const image = solid => {
  const data = new Uint8ClampedArray(W * W * 4);

  for(let y = 0; y < W; y++) for(let x = 0; x < W; x++) data[(y * W + x) * 4 + 3] = solid(x, y) ? 255 : 0;

  return data;
};
const area = poly => Math.abs(poly.reduce((s, [x, y], i) => s + (x * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * y), 0) / 2);
const disc = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const bounds = poly => ({ x0: Math.min(...poly.map(p => p[0])), x1: Math.max(...poly.map(p => p[0])), y0: Math.min(...poly.map(p => p[1])), y1: Math.max(...poly.map(p => p[1])) });

describe('outlinesFromAlpha', () => {
  test('a disc gives one outline of about its area, in units of 0..1000', () => {
    const polys = outlinesFromAlpha(image(disc(64, 64, 30)), W, W);

    expect(polys.length).toBe(1);
    expect(polys[0].length).toBeGreaterThan(8);
    expect(polys[0].length).toBeLessThanOrEqual(160);

    const expected = Math.PI * (30 / W) ** 2 * 1e6;

    expect(area(polys[0]) / expected).toBeGreaterThan(0.9);
    expect(area(polys[0]) / expected).toBeLessThan(1.1);

    const b = bounds(polys[0]);

    expect(b.x0).toBeGreaterThan(250);
    expect(b.x1).toBeLessThan(750);
  });

  test('a rectangle becomes about four corners', () => {
    const polys = outlinesFromAlpha(image((x, y) => x >= 20 && x < 100 && y >= 40 && y < 70), W, W);

    expect(polys[0].length).toBeLessThanOrEqual(6);
    expect(area(polys[0]) / (80 / W) / (30 / W) / 1e6).toBeGreaterThan(0.9);
  });

  test('two separate objects, the larger first; a speck is dropped', () => {
    const polys = outlinesFromAlpha(image((x, y) => disc(35, 64, 22)(x, y) || disc(100, 64, 12)(x, y) || disc(64, 10, 2)(x, y)), W, W);

    expect(polys.length).toBe(2);
    expect(area(polys[0])).toBeGreaterThan(area(polys[1]));
    expect(bounds(polys[0]).x1).toBeLessThan(bounds(polys[1]).x0);
  });

  test('a ring has one outer outline, the hole is ignored', () => {
    const polys = outlinesFromAlpha(image((x, y) => disc(64, 64, 40)(x, y) && !disc(64, 64, 20)(x, y)), W, W);

    expect(polys.length).toBe(1);
    expect(area(polys[0]) / (Math.PI * (40 / W) ** 2 * 1e6)).toBeGreaterThan(0.9);
  });

  test('an L shape keeps its corner', () => {
    const polys = outlinesFromAlpha(image((x, y) => (x >= 20 && x < 50 && y >= 20 && y < 100) || (x >= 20 && x < 100 && y >= 70 && y < 100)), W, W);

    expect(polys[0].length).toBeLessThanOrEqual(10);
    expect(area(polys[0])).toBeGreaterThan(0.9 * ((30 * 80 + 50 * 30) / (W * W)) * 1e6);
  });

  test('nothing visible, and an object that fills the whole window, give null', () => {
    expect(outlinesFromAlpha(image(() => false), W, W)).toBeNull();
    expect(outlinesFromAlpha(image(() => true), W, W)).toBeNull();
  });

  test('semi-transparent pixels count when they are above the threshold', () => {
    const data = image(disc(64, 64, 30));

    for(let i = 0; i < W * W; i++) if(data[i * 4 + 3] === 255 && i % 3 === 0) data[i * 4 + 3] = 100;

    expect(outlinesFromAlpha(data, W, W).length).toBe(1);
  });

  test('a single visible pixel is a speck, not an outline', () => {
    expect(outlinesFromAlpha(image((x, y) => x === 10 && y === 10), W, W)).toBeNull();
  });
});
