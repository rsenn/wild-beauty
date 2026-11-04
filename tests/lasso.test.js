// bun test: the magnetic lasso's live wire (pure part)
import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { edgeCost, liveWire, outlineOfSegments, snap, thin, workSize } from '../client/editor/tools/lasso/lasso.js';

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

// the shortest-path tree of the live wire (Intelligent Scissors): grown in slices, read for any pixel
import { createWire } from '../client/editor/tools/lasso/lasso.js';

const pathCost = (path, cost, w) => path.slice(1).reduce((sum, [x, y], i) => sum + (path[i][0] !== x && path[i][1] !== y ? Math.SQRT2 : 1) * cost[y * w + x], 0);

test('the tree gives the cheapest path to every pixel once it has grown, with a slice of time at a time', () => {
  let seed = 41;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const n = 30;
  const cost = Float32Array.from({ length: n * n }, () => 0.04 + rnd());
  const from = [3, 4];
  const tree = createWire(cost, n, n, from, 100);
  let slices = 0;

  while(!tree.step(0.05)) slices++;

  expect(tree.finished).toBe(true);
  expect(slices).toBeGreaterThan(0); // it did not need one go: it stops when the slice is used

  for(let k = 0; k < 15; k++) {
    const to = [Math.floor(rnd() * n), Math.floor(rnd() * n)];
    const path = tree.pathTo(to);

    expect(path[0]).toEqual(from);
    expect(path.at(-1)).toEqual(to);
    expect(pathCost(path, cost, n)).toBeCloseTo(cheapest(cost, n, n, from, to), 4);
  }
});

test('before the tree has grown a pixel gets the straight line, a settled one its path; outside the box the path goes on straight', () => {
  const flat = new Float32Array(400 * 400).fill(1);
  const tree = createWire(flat, 400, 400, [200, 200], 100);

  expect(tree.settled([205, 200])).toBe(false);
  expect(tree.pathTo([205, 200])).toEqual([[200, 200], [205, 200]]); // not reached yet: straight

  expect(tree.finishTo([260, 240], 1000)).toBe(true);
  expect(tree.settled([260, 240])).toBe(true);

  const path = tree.pathTo([260, 240]);

  expect(path[0]).toEqual([200, 200]);
  expect(path.at(-1)).toEqual([260, 240]);

  // 150 px to the right is outside the box (radius 100): the tree's path to its edge, then a line on
  tree.finishTo([300, 200], 1000);

  const far = tree.pathTo([350, 200]);

  expect(far.at(-1)).toEqual([350, 200]);
  expect(far.some(([x]) => x === 300)).toBe(true);
});

test('the tree returns on the cost window that made the first version loop for ever, and in time', () => {
  const raw = Bun.gunzipSync(readFileSync(new URL('./fixtures/lasso-hang.f32.gz', import.meta.url)));
  const cost = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const tree = createWire(cost, 118, 200, [50, 149], 300);
  const t = performance.now();

  expect(tree.finishTo([67, 50], 2000)).toBe(true);
  expect(performance.now() - t).toBeLessThan(500);
  expect(tree.pathTo([67, 50]).length).toBeGreaterThan(90);
});

import { costFromEdgeMap, edgeMapUsable } from '../client/editor/tools/lasso/lasso.js';

test('the server edge map becomes a cost map: strong edges cheap, flat areas dear, same range as the local one', () => {
  const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 255, 128, 0, 0, 255]);
  const cost = costFromEdgeMap(data, 3, 1);

  expect(cost[0]).toBeCloseTo(0.04, 6);
  expect(cost[1]).toBeCloseTo(1.04, 6);
  expect(cost[2]).toBeGreaterThan(0.5);
  expect(cost[2]).toBeLessThan(0.6);
});

test('an edge map with no edges, or only edges, is not used', () => {
  const map = (fill, n = 1000) => { const d = new Uint8ClampedArray(n * 4); for(let i = 0; i < n; i++) { d[i * 4] = fill(i); d[i * 4 + 3] = 255; } return d; };

  expect(edgeMapUsable(map(() => 0), 1000, 1)).toBe(false); // all zero: the tool failed
  expect(edgeMapUsable(map(() => 255), 1000, 1)).toBe(false); // all edge
  expect(edgeMapUsable(map(i => (i % 10 === 0 ? 255 : 0)), 1000, 1)).toBe(true); // a tenth is edge
  expect(edgeMapUsable(map(i => (i < 2 ? 255 : 0)), 1000, 1)).toBe(false); // two pixels in a thousand
});

// ---- fail-safe: whatever the cost map or the input, nothing loops, throws or takes long ----
import { MAX_VERTICES, MIN_COST, outlineOfSegments as outline } from '../client/editor/tools/lasso/lasso.js';

const fields = {
  flat: n => new Float32Array(n).fill(1.04),
  free: n => new Float32Array(n).fill(0.04),
  zero: n => new Float32Array(n).fill(0),
  negative: n => new Float32Array(n).fill(-3),
  nan: n => Float32Array.from({ length: n }, (_, i) => (i % 7 === 0 ? NaN : 0.5)),
  infinite: n => Float32Array.from({ length: n }, (_, i) => (i % 5 === 0 ? Infinity : 0.3)),
  mixed: n => Float32Array.from({ length: n }, (_, i) => [-1, 0, 0.04, 1.04, NaN, Infinity, 1e30, 0.5][i % 8]),
  wall: n => Float32Array.from({ length: n }, (_, i) => ((i % 120) === 60 ? Infinity : 0.2)), // a column nothing may cross
};

test('every kind of cost map: the tree and the live wire end, quickly, with a path or the straight line', () => {
  const w = 120;
  const h = 90;
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  for(const [name, make] of Object.entries(fields)) {
    const cost = make(w * h);
    const a = [Math.floor(rnd() * w), Math.floor(rnd() * h)];
    const tree = createWire(cost, w, h, a, 300);
    const t0 = performance.now();

    tree.finishTo([w - 1, h - 1], 3000);

    for(let i = 0; i < 40; i++) {
      const b = [Math.floor(rnd() * w), Math.floor(rnd() * h)];
      const path = tree.pathTo(b);
      const line = liveWire(cost, w, h, a, b);

      for(const p of [path, line]) {
        expect(p.length).toBeGreaterThanOrEqual(1);
        expect(p.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
      }

      expect(path.at(-1)).toEqual(b);
      expect(line.at(-1)).toEqual(b);
    }

    expect(performance.now() - t0).toBeLessThan(3000); // a very loose bound: a hang would never return at all
    expect(name).toBeTruthy();
  }
});

test('bad input: NaN, out of range, strings and nothing at all give a pixel and no exception', () => {
  const cost = new Float32Array(50 * 40).fill(0.5);

  for(const bad of [[NaN, NaN], [-100, 1e9], [Infinity, -Infinity], ['x', undefined], [0.4, 39.9], [null, null]]) {
    expect(() => snap(cost, 50, 40, bad)).not.toThrow();
    expect(() => liveWire(cost, 50, 40, bad, [10, 10])).not.toThrow();
    expect(() => liveWire(cost, 50, 40, [10, 10], bad)).not.toThrow();

    const tree = createWire(cost, 50, 40, bad);

    expect(() => tree.step(1)).not.toThrow();
    expect(() => tree.pathTo(bad)).not.toThrow();
  }

  const [x, y] = snap(cost, 50, 40, [NaN, 1e9]);

  expect(x >= 0 && x < 50 && y >= 0 && y < 40).toBe(true);
});

test('a floor under the costs keeps the search finite even with negative weights', () => {
  const negative = new Float32Array(60 * 60).fill(-5);
  const t = performance.now();
  const path = liveWire(negative, 60, 60, [2, 2], [57, 57]);

  expect(performance.now() - t).toBeLessThan(1000);
  expect(path.at(-1)).toEqual([57, 57]);
  expect(MIN_COST).toBeGreaterThan(0);
});

test('a very long outline is thinned until the server takes it', () => {
  // 30 000 points of a wiggly circle, a pixel apart in places: far more vertices than the server's 2000
  const pts = Array.from({ length: 30000 }, (_, i) => {
    const a = (i / 30000) * Math.PI * 2;
    const r = 200 + 6 * Math.sin(i / 3);

    return [Math.round(320 + r * Math.cos(a)), Math.round(240 + r * Math.sin(a))];
  });
  const poly = outline([pts], 640, 480);

  expect(poly.length).toBeLessThanOrEqual(MAX_VERTICES);
  expect(poly.length).toBeGreaterThan(50);
  expect(poly.every(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1)).toBe(true);
});

test('a random session of anchors and pointer moves: every step stays within a few milliseconds', () => {
  const w = 200;
  const h = 150;
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cost = Float32Array.from({ length: w * h }, () => 0.04 + rnd());
  let tree = createWire(cost, w, h, [100, 75]);
  let worst = 0;

  for(let i = 0; i < 400; i++) {
    const t = performance.now();
    const p = [Math.floor(rnd() * w), Math.floor(rnd() * h)];

    if(rnd() < 0.3) tree = createWire(cost, w, h, p); // a click: the next tree
    else if(rnd() < 0.5) tree.step(2);
    else tree.pathTo(p);

    worst = Math.max(worst, performance.now() - t);
  }

  expect(worst).toBeLessThan(60);
});
