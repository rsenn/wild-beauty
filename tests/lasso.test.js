// bun test: the magnetic lasso's live wire (pure part)
import { expect, test } from 'bun:test';
import { edgeCost, liveWire, outlineOfSegments, snap, thin, workSize } from '../client/editor/lasso.js';

// a w x h RGBA image: white, with a black disc of radius r at the middle
const disc = (w, h, r) => {
  const data = new Uint8ClampedArray(w * h * 4).fill(255);

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      if(Math.hypot(x - w / 2, y - h / 2) < r) {
        const i = (y * w + x) * 4;

        data[i] = data[i + 1] = data[i + 2] = 0;
      }
    }
  }

  return data;
};

test('edges are cheap, flat areas dear', () => {
  const cost = edgeCost(disc(40, 40, 10), 40, 40);

  expect(cost[0]).toBeGreaterThan(0.9); // flat white corner
  expect(cost[20 * 40 + 20]).toBeGreaterThan(0.9); // flat black middle
  expect(Math.min(cost[20 * 40 + 9], cost[20 * 40 + 10], cost[20 * 40 + 11])).toBeLessThan(0.2); // the rim
});

test('a click snaps to the nearest edge', () => {
  const cost = edgeCost(disc(40, 40, 10), 40, 40);
  const [x, y] = snap(cost, 40, 40, [14, 20], 6);

  expect(Math.abs(Math.hypot(x - 20, y - 20) - 10)).toBeLessThan(1.6);
});

test('the live wire follows the rim of a disc instead of cutting across', () => {
  const cost = edgeCost(disc(60, 60, 20), 60, 60);
  // two points on the rim, a quarter turn apart: the straight line dips 6 px inside the circle
  const a = snap(cost, 60, 60, [50, 30], 3);
  const b = snap(cost, 60, 60, [30, 50], 3);
  const path = liveWire(cost, 60, 60, a, b);

  expect(path[0]).toEqual(a);
  expect(path.at(-1)).toEqual(b);
  // every pixel of the path is near the rim
  for(const [x, y] of path) expect(Math.abs(Math.hypot(x - 30, y - 30) - 20)).toBeLessThan(2.5);
});

test('the live wire between equal points is that point, and in a flat image a straight-ish line', () => {
  const flat = new Float32Array(30 * 30).fill(1);

  expect(liveWire(flat, 30, 30, [5, 5], [5, 5])).toEqual([[5, 5]]);

  const path = liveWire(flat, 30, 30, [2, 2], [20, 2]);

  expect(path.length).toBe(19);
  expect(path.every(([, y]) => y === 2)).toBe(true);
});

test('thin drops collinear points and keeps corners', () => {
  const l = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3]];

  expect(thin(l)).toEqual([[0, 0], [3, 0], [3, 3]]);
  expect(thin([[0, 0], [1, 1]])).toEqual([[0, 0], [1, 1]]);
});

test('outlineOfSegments joins segments, closes without repeating, and gives fractions', () => {
  const segs = [[[0, 0], [10, 0]], [[10, 0], [10, 10]], [[10, 10], [0, 10]], [[0, 10], [0, 0]]];
  const poly = outlineOfSegments(segs, 20, 20);

  expect(poly).toEqual([[0.025, 0.025], [0.525, 0.025], [0.525, 0.525], [0.025, 0.525]]);
});

test('workSize shrinks to the long side and never grows', () => {
  expect(workSize(4000, 2000, 640)).toEqual({ w: 640, h: 320 });
  expect(workSize(300, 200, 640)).toEqual({ w: 300, h: 200 });
});
