// bun test: the pure part of the lasso benchmark (tools/lasso-bench-lib.js) on synthetic shapes
import { expect, test } from 'bun:test';
import { edgeCost } from '../client/editor/tools/lasso/lasso.js';
import { boundaryF, fillPolygon, iou, jitter, largestComponent, resample, score, simulate, summarise, traceContour } from '../tools/lasso-bench-lib.js';

const W = 160;
const H = 120;
const disc = (cx, cy, r) => Uint8Array.from({ length: W * H }, (_, i) => (Math.hypot((i % W) - cx, Math.floor(i / W) - cy) <= r ? 1 : 0));
const rng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

test('largestComponent keeps the biggest blob only', () => {
  const m = disc(40, 60, 20);
  const small = disc(130, 20, 5);

  for(let i = 0; i < m.length; i++) m[i] |= small[i];

  const big = largestComponent(m, W, H);

  expect(big.reduce((a, b) => a + b, 0)).toBe(disc(40, 60, 20).reduce((a, b) => a + b, 0));
  expect(big[20 * W + 130]).toBe(0);
});

test('traceContour walks the outline of a disc once, in order, all on the boundary', () => {
  const m = disc(80, 60, 30);
  const c = traceContour(m, W, H);
  const perimeter = 2 * Math.PI * 30;

  expect(c.length).toBeGreaterThan(perimeter * 0.8);
  expect(c.length).toBeLessThan(perimeter * 1.6);
  expect(new Set(c.map(p => p.join())).size).toBe(c.length); // no pixel twice

  for(const [x, y] of c) {
    expect(m[y * W + x]).toBe(1);
    expect(Math.abs(Math.hypot(x - 80, y - 60) - 30)).toBeLessThan(1.6);
  }

  // consecutive pixels touch
  for(let i = 0; i < c.length; i++) expect(Math.max(Math.abs(c[i][0] - c[(i + 1) % c.length][0]), Math.abs(c[i][1] - c[(i + 1) % c.length][1]))).toBeLessThanOrEqual(1);
});

test('traceContour handles an empty mask, one pixel and a thin line', () => {
  expect(traceContour(new Uint8Array(W * H), W, H)).toEqual([]);

  const one = new Uint8Array(W * H);

  one[5 * W + 5] = 1;
  expect(traceContour(one, W, H)).toEqual([[5, 5]]);

  const line = new Uint8Array(W * H);

  for(let x = 10; x < 20; x++) line[10 * W + x] = 1;

  expect(traceContour(line, W, H).length).toBeGreaterThanOrEqual(10);
});

test('resample gives evenly spaced points along a closed outline', () => {
  const square = [[0, 0], [100, 0], [100, 100], [0, 100]];
  const p = resample(square, 25);

  expect(p.length).toBe(16);
  expect(p[0]).toEqual([0, 0]);
  expect(p[4]).toEqual([100, 0]);
});

test('jitter stays within sigma', () => {
  const r = rng(3);
  const moved = jitter(Array.from({ length: 200 }, () => [50, 50]), 4, r);

  expect(moved.every(([x, y]) => Math.hypot(x - 50, y - 50) <= 4 + 1e-9)).toBe(true);
  expect(Math.max(...moved.map(([x, y]) => Math.hypot(x - 50, y - 50)))).toBeGreaterThan(2);
});

test('fillPolygon matches the disc it was made from, even-odd holes work, iou and boundaryF are 1 for equal masks', () => {
  const m = disc(80, 60, 30);
  const poly = Array.from({ length: 180 }, (_, i) => [80 + 30.5 * Math.cos((i / 180) * Math.PI * 2), 60 + 30.5 * Math.sin((i / 180) * Math.PI * 2)]);

  expect(iou(fillPolygon(poly, W, H), m)).toBeGreaterThan(0.95);
  expect(iou(m, m)).toBe(1);
  expect(boundaryF(m, m, W, H).f).toBe(1);
  expect(boundaryF(m, disc(80, 60, 40), W, H).f).toBeLessThan(0.2);

  const ring = [...poly, ...poly.map(([x, y]) => [80 + (x - 80) / 2, 60 + (y - 60) / 2])]; // two outlines in one list wind the same way: not a hole
  const hole = fillPolygon([poly, poly.map(([x, y]) => [80 + (x - 80) / 2, 60 + (y - 60) / 2])].flat(), W, H);

  expect(ring.length).toBe(360);
  expect(hole.length).toBe(W * H);
});

// a photo: a bright disc on a darker noisy ground; the lasso should snap to its rim
function photo(seed = 5) {
  const r = rng(seed);
  const data = new Uint8ClampedArray(W * H * 4);

  for(let i = 0; i < W * H; i++) {
    const inside = Math.hypot((i % W) - 80, Math.floor(i / W) - 60) <= 35;
    const v = (inside ? 200 : 70) + (r() - 0.5) * 30;

    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }

  return data;
}

test('a simulated lasso with sparse noisy clicks beats the plain polygon through the same clicks', () => {
  const gt = disc(80, 60, 35);
  const cost = edgeCost(photo(), W, H);
  const contour = traceContour(largestComponent(gt, W, H), W, H);
  const r = rng(9);
  const sim = simulate({ cost, gt, w: W, h: H, spacing: 40, sigma: 4, rnd: r, contour });
  const s = score(sim, W, H);

  expect(s.clicks).toBeGreaterThanOrEqual(5);
  expect(s.iou).toBeGreaterThan(0.93);
  expect(s.f).toBeGreaterThan(0.8);
  expect(s.iou).toBeGreaterThanOrEqual(s.plainIou);
  expect(s.f).toBeGreaterThan(s.plainF);
  expect(s.ms).toBeLessThan(2000);
});

test('summarise: mean, median and the share at or above a limit; NaN is ignored', () => {
  const s = summarise([0.5, 0.9, 1, NaN, 0.95]);

  expect(s.n).toBe(4);
  expect(s.mean).toBeCloseTo(0.8375, 4);
  expect(s.share).toBe(0.75);
  expect(summarise([]).n).toBe(0);
});
