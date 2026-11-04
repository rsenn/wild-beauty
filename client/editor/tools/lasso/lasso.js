// The magnetic lasso (WAND.md 0, TODO "Magnetic lasso"): a selection tool next to the magic wand.
// The user clicks anchors, the path between two anchors snaps to the edges of the photo (a live
// wire: the shortest path over a cost that is low on strong edges). This module is the pure part -
// edge cost, snapping, the shortest path, thinning - on a small grey copy of the photo (long side
// LASSO_SIZE); the editor does the pixels, the stage mapping and the server call.

import { stagePolygon } from '../wand/wand.js';

export const LASSO_SIZE = 640; // long side of the working copy
export const MIN_COST = 0.01; // no step is cheaper than this: Dijkstra ends only with positive weights
const cheap = c => (c > MIN_COST ? c : MIN_COST); // also NaN and negative values (a bad map) become MIN_COST

// a point as a pixel of a `w` x `h` image: rounded, inside it, and never NaN
const pixelIn = (p, w, h) => {
  const x = Math.round(+p?.[0]);
  const y = Math.round(+p?.[1]);

  return [Math.min(w - 1, Math.max(0, Number.isFinite(x) ? x : 0)), Math.min(h - 1, Math.max(0, Number.isFinite(y) ? y : 0))];
};

// A cost map of an RGBA image `data` (w x h): the Sobel gradient of the luma, scaled by its 98th
// percentile so one hard edge does not flatten the rest, turned around: edges are cheap, flat areas
// dear. Float32Array of w * h in 0.04..1
export function edgeCost(data, w, h) {
  const grey = new Float32Array(w * h);

  for(let i = 0, j = 0; i < grey.length; i++, j += 4) grey[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];

  const grad = new Float32Array(w * h);
  const at = (x, y) => grey[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);

      grad[y * w + x] = Math.hypot(gx, gy);
    }
  }

  const sorted = Float32Array.from(grad).sort();
  const top = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98))] || 1;
  const cost = new Float32Array(w * h);

  for(let i = 0; i < cost.length; i++) cost[i] = 1.04 - Math.min(1, grad[i] / top);

  return cost;
}

// Is the server's edge map any use? A map with (almost) no edge in it - the tool failed, wrote
// zeros, or the photo is flat - would turn the lasso into straight lines, so it is not taken: the
// local cost stays. `data` is RGBA; at least 0.3 % of the pixels must be a clear edge (red >= 64)
// and not more than 60 % (a map that is all edge says nothing either)
export function edgeMapUsable(data, w, h) {
  let strong = 0;

  for(let i = 0; i < w * h; i++) if(data[i * 4] >= 64) strong++;

  return strong >= w * h * 0.003 && strong <= w * h * 0.6;
}

// The cost map from the edge map the server makes with `opencv-imgproc edgemap` (CLAHE, edge-aware
// smoothing, Sobel and Canny fused; an RGBA image, the red channel holds 255 on the strongest edge):
// strong edges are cheap, flat areas dear, the same range as `edgeCost`
export function costFromEdgeMap(data, w, h) {
  const cost = new Float32Array(w * h);

  for(let i = 0; i < cost.length; i++) cost[i] = 1.04 - Math.min(1, data[i * 4] / 255);

  return cost;
}

// the pixel of lowest cost within `radius` of [x, y] (the click snaps to the nearest strong edge)
export function snap(cost, w, h, [x, y], radius = 6) {
  [x, y] = pixelIn([x, y], w, h);

  let best = [Math.round(x), Math.round(y)];
  let low = Infinity;

  for(let dy = -radius; dy <= radius; dy++) {
    for(let dx = -radius; dx <= radius; dx++) {
      const px = Math.round(x) + dx;
      const py = Math.round(y) + dy;

      if(px < 0 || py < 0 || px >= w || py >= h || dx * dx + dy * dy > radius * radius) continue;

      // a little pull towards the click so two equal edges do not jump
      const c = cost[py * w + px] + 0.002 * Math.hypot(dx, dy);

      if(c < low) {
        low = c;
        best = [px, py];
      }
    }
  }

  return best;
}

// a binary min-heap of [priority, value] kept in two arrays (no allocation per push)
class Heap {
  constructor() {
    this.p = [];
    this.v = [];
  }

  get size() {
    return this.p.length;
  }

  push(p, v) {
    let i = this.p.push(p) - 1;

    this.v.push(v);

    while(i > 0) {
      const up = (i - 1) >> 1;

      if(this.p[up] <= p) break;

      this.p[i] = this.p[up];
      this.v[i] = this.v[up];
      i = up;
    }

    this.p[i] = p;
    this.v[i] = v;
  }

  // the value of the smallest entry; `top` is left as its priority
  pop() {
    const v = this.v[0];

    this.top = this.p[0];

    const p = this.p.pop();
    const last = this.v.pop();
    const n = this.p.length;

    if(n) {
      let i = 0;

      for(;;) {
        let c = 2 * i + 1;

        if(c >= n) break;
        if(c + 1 < n && this.p[c + 1] < this.p[c]) c++;
        if(this.p[c] >= p) break;

        this.p[i] = this.p[c];
        this.v[i] = this.v[c];
        i = c;
      }

      this.p[i] = p;
      this.v[i] = last;
    }

    return v;
  }
}

const NEIGHBOURS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2]];

// The live wire: the cheapest 8-connected path from pixel `a` to pixel `b` as a list of [x, y]
// pixels, both ends included. The search stays inside the box of the two ends grown by `margin`
// pixels (or by half their distance, if more), so a click costs time in proportion to the segment
// and not to the photo. It always ends, and fast: the search has a budget (`maxMs`, and a count of
// steps in proportion to the box), and when it runs out, or the box holds no path, the answer is the
// straight line. An editor must never hang on a photo it does not like (2026-11-01: distances kept
// in 32 bits made a node look improved by every re-visit, and the search never ended).
export function liveWire(cost, w, h, a, b, margin = 24, maxMs = 40) {
  a = pixelIn(a, w, h);
  b = pixelIn(b, w, h);

  const grow = Math.max(margin, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
  const x0 = Math.max(0, Math.min(a[0], b[0]) - grow);
  const y0 = Math.max(0, Math.min(a[1], b[1]) - grow);
  const x1 = Math.min(w - 1, Math.max(a[0], b[0]) + grow);
  const y1 = Math.min(h - 1, Math.max(a[1], b[1]) + grow);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const local = ([x, y]) => (y - y0) * bw + (x - x0);
  const from = local(a);
  const to = local(b);

  if(a[0] === b[0] && a[1] === b[1]) return [[a[0], a[1]]];

  // 64 bits, not 32: a stored distance must equal the sum it was computed from, or the same parent
  // "improves" the same node every time it is looked at
  const dist = new Float64Array(bw * bh).fill(Infinity);
  const back = new Int32Array(bw * bh).fill(-1);
  const heap = new Heap();

  const limit = 12 * bw * bh + 1000; // every node is settled once; this is far more than a search needs
  const t0 = typeof performance === 'object' ? performance.now() : 0;
  let steps = 0;

  dist[from] = 0;
  heap.push(0, from);

  while(heap.size) {
    const here = heap.pop();

    // an entry that a better one has replaced
    if(heap.top > dist[here]) continue;
    if(here === to) break;

    if(++steps > limit || ((steps & 511) === 0 && t0 && performance.now() - t0 > maxMs)) return [[a[0], a[1]], [b[0], b[1]]];

    const hx = here % bw;
    const hy = (here - hx) / bw;
    const d = dist[here];

    for(const [dx, dy, step] of NEIGHBOURS) {
      const nx = hx + dx;
      const ny = hy + dy;

      if(nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;

      const next = ny * bw + nx;
      const total = d + step * cheap(cost[(ny + y0) * w + nx + x0]);

      if(total < dist[next]) {
        dist[next] = total;
        back[next] = here;
        heap.push(total, next);
      }
    }
  }

  if(back[to] < 0) return [[a[0], a[1]], [b[0], b[1]]];

  const path = [];

  for(let at = to; at >= 0; at = back[at]) path.push([(at % bw) + x0, Math.floor(at / bw) + y0]);

  return path.reverse();
}

// The live wire as Intelligent Scissors does it: ONE shortest-path tree grows from the anchor,
// a little at a time, and the line to the pointer is a look-up in it - no new search per move, no
// limit on how far the pointer may go (within `radius` pixels of the anchor), and no step that can
// hold the editor for more than the slice it is given. `step(ms)` expands for at most `ms`; the path
// to a node that is not settled yet is the one found so far (a valid path, nearly as good), and to
// one not reached at all the straight line.
export function createWire(cost, w, h, seed, radius = 220) {
  seed = pixelIn(seed, w, h);

  const x0 = Math.max(0, seed[0] - radius);
  const y0 = Math.max(0, seed[1] - radius);
  const x1 = Math.min(w - 1, seed[0] + radius);
  const y1 = Math.min(h - 1, seed[1] + radius);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const dist = new Float64Array(bw * bh).fill(Infinity); // 64 bits, see liveWire
  const back = new Int32Array(bw * bh).fill(-1);
  const done = new Uint8Array(bw * bh);
  const heap = new Heap();
  const now = () => (typeof performance === 'object' ? performance.now() : Date.now());
  const clamp = ([x, y]) => [Math.min(x1, Math.max(x0, Math.round(x))), Math.min(y1, Math.max(y0, Math.round(y)))];
  const index = ([x, y]) => (y - y0) * bw + (x - x0);
  const start = index(clamp(seed));

  dist[start] = 0;
  heap.push(0, start);

  const tree = {
    seed,
    get finished() {
      return heap.size === 0;
    },
    // expand for at most `ms`; true when the whole box is done
    step(ms = 6) {
      const t0 = now();

      for(let n = 1; heap.size; n++) {
        const here = heap.pop();

        if(heap.top > dist[here] || done[here]) continue;

        done[here] = 1;

        const hx = here % bw;
        const hy = (here - hx) / bw;
        const d = dist[here];

        for(const [dx, dy, len] of NEIGHBOURS) {
          const nx = hx + dx;
          const ny = hy + dy;

          if(nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;

          const next = ny * bw + nx;
          const total = d + len * cheap(cost[(ny + y0) * w + nx + x0]);

          if(total < dist[next]) {
            dist[next] = total;
            back[next] = here;
            heap.push(total, next);
          }
        }

        if((n & 127) === 0 && now() - t0 > ms) break;
      }

      return heap.size === 0;
    },
    // is the pixel settled (its path is the cheapest)?
    settled: p => !!done[index(clamp(p))],
    // expand until the pixel is settled, for at most `ms`
    finishTo(p, ms = 120) {
      const t0 = now();

      while(!tree.settled(p) && heap.size && now() - t0 < ms) tree.step(Math.min(ms, 20));

      return tree.settled(p);
    },
    // the path from the seed to the pixel: [[x, y], ...]
    pathTo(p) {
      const q = clamp(p);
      let at = index(q);

      if(!(dist[at] < Infinity)) return [[seed[0], seed[1]], [Math.round(p[0]), Math.round(p[1])]];

      const path = [];

      for(let guard = bw * bh; at >= 0 && guard-- > 0; at = back[at]) path.push([(at % bw) + x0, Math.floor(at / bw) + y0]);

      path.reverse();

      // beyond the box: on in a straight line
      if(q[0] !== Math.round(p[0]) || q[1] !== Math.round(p[1])) path.push([Math.round(p[0]), Math.round(p[1])]);

      return path;
    },
  };

  return tree;
}

// Douglas-Peucker: the path with the points that deviate less than `tolerance` pixels dropped
export function thin(path, tolerance = 0.8) {
  if(path.length < 3) return path.slice();

  const keep = new Uint8Array(path.length);
  const stack = [[0, path.length - 1]];

  keep[0] = keep[path.length - 1] = 1;

  while(stack.length) {
    const [i, j] = stack.pop();
    const [ax, ay] = path[i];
    const [bx, by] = path[j];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let most = tolerance;

    for(let k = i + 1; k < j; k++) {
      const [px, py] = path[k];
      const d = len ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len : Math.hypot(px - ax, py - ay);

      if(d > most) {
        most = d;
        far = k;
      }
    }

    if(far >= 0) {
      keep[far] = 1;
      stack.push([i, far], [far, j]);
    }
  }

  return path.filter((_, i) => keep[i]);
}

// the outline of a lasso: the segments (each a list of pixels from one anchor to the next) joined
// without repeating the shared anchors, thinned, as [x, y] in 0..1 of the working copy
export const MAX_VERTICES = 1800; // the server takes 2000 (cleanPolygon); a long outline is thinned more until it fits

export function outlineOfSegments(segments, w, h, tolerance = 0.8, maxVertices = MAX_VERTICES) {
  const joined = segments.flatMap((seg, i) => (i ? seg.slice(1) : seg));
  let poly = thin(joined, tolerance);

  for(let t = tolerance, n = 0; poly.length > maxVertices && n < 12; n++) poly = thin(joined, (t *= 1.5));

  // the last point may sit on the first: a closed outline repeats nothing
  if(poly.length > 1 && poly[0][0] === poly.at(-1)[0] && poly[0][1] === poly.at(-1)[1]) poly.pop();

  return poly.map(([x, y]) => [Math.round(((x + 0.5) / w) * 1e5) / 1e5, Math.round(((y + 0.5) / h) * 1e5) / 1e5]);
}

// the size of the working copy of a `width` x `height` image
export function workSize(width, height, size = LASSO_SIZE) {
  const k = Math.min(1, size / Math.max(width, height));

  return { w: Math.max(1, Math.round(width * k)), h: Math.max(1, Math.round(height * k)) };
}

// the lasso as one SVG path in stage units: the `segments` (and the `live` one still following the
// pointer) are pixels of the working copy `size` { w, h } of the photo, `corners` its stage outline,
// `crop` the photo's crop; closed with Z when `closed`. Null when there is nothing to draw
export function lassoPath(segments, live, size, corners, crop, closed = false) {
  const pixels = [...segments, ...(live ? [live] : [])].flatMap((seg, i) => (i ? seg.slice(1) : seg)).filter(q => Number.isFinite(q?.[0]) && Number.isFinite(q?.[1]));

  if(pixels.length < 2 || !corners) return null;

  const r = v => Math.round(v * 100) / 100;
  const stage = stagePolygon(pixels.map(([x, y]) => [x + 0.5, y + 0.5]), { width: size.w, height: size.h }, corners, crop);

  return 'M' + stage.map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + (closed ? 'Z' : '');
}
