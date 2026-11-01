// bun test: the magnetic lasso's live wire (pure part)
import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
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

// the cost window (118 x 200) of a real photo on which the first version never returned: distances were
// kept in 32 bits, the same parent then "improved" the same node every time it was visited
test('the live wire returns on the cost window that made the first version loop for ever', () => {
  const raw = Bun.gunzipSync(readFileSync(new URL('./fixtures/lasso-hang.f32.gz', import.meta.url)));
  const cost = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const t = performance.now();
  const path = liveWire(cost, 118, 200, [50, 149], [67, 50]);

  expect(performance.now() - t).toBeLessThan(500);
  expect(path[0]).toEqual([50, 149]);
  expect(path.at(-1)).toEqual([67, 50]);
  expect(path.length).toBeGreaterThan(90); // a real path, not the two-point fallback
});

test('the live wire has a budget: when it runs out the answer is the straight line, at once', () => {
  const flat = new Float32Array(300 * 300).fill(1);
  const t = performance.now();
  const path = liveWire(flat, 300, 300, [2, 2], [297, 297], 24, 0);

  expect(path).toEqual([[2, 2], [297, 297]]);
  expect(performance.now() - t).toBeLessThan(50);
});

// a plain Dijkstra over the whole grid: the cost of the cheapest path, to compare with the live wire's
const cheapest = (cost, w, h, a, b) => {
  const dist = new Float64Array(w * h).fill(Infinity);
  const done = new Uint8Array(w * h);

  dist[a[1] * w + a[0]] = 0;

  for(;;) {
    let best = -1;

    for(let i = 0; i < dist.length; i++) if(!done[i] && (best < 0 || dist[i] < dist[best])) best = i;

    if(best < 0 || dist[best] === Infinity || best === b[1] * w + b[0]) return dist[b[1] * w + b[0]];

    done[best] = 1;

    const x = best % w;
    const y = (best - x) / w;

    for(const [dx, dy, step] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2]]) {
      const nx = x + dx;
      const ny = y + dy;

      if(nx >= 0 && ny >= 0 && nx < w && ny < h) dist[ny * w + nx] = Math.min(dist[ny * w + nx], dist[best] + step * cost[ny * w + nx]);
    }
  }
};

test('the live wire finds the cheapest path (compared with a plain Dijkstra on random costs)', () => {
  let seed = 99;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const n = 22;

  for(let round = 0; round < 12; round++) {
    const cost = Float32Array.from({ length: n * n }, () => 0.04 + rnd());
    const a = [Math.floor(rnd() * n), Math.floor(rnd() * n)];
    const b = [Math.floor(rnd() * n), Math.floor(rnd() * n)];
    const path = liveWire(cost, n, n, a, b, n);
    const paid = path.slice(1).reduce((sum, [x, y], i) => sum + (path[i][0] !== x && path[i][1] !== y ? Math.SQRT2 : 1) * cost[y * n + x], 0);

    expect(path[0]).toEqual(a);
    expect(path.at(-1)).toEqual(b);
    expect(paid).toBeCloseTo(cheapest(cost, n, n, a, b), 4);
  }
});
