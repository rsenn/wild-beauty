// The magnetic lasso (WAND.md 0, TODO "Magnetic lasso"): a selection tool next to the magic wand.
// The user clicks anchors, the path between two anchors snaps to the edges of the photo (a live
// wire: the shortest path over a cost that is low on strong edges). This module is the pure part -
// edge cost, snapping, the shortest path, thinning - on a small grey copy of the photo (long side
// LASSO_SIZE); the editor does the pixels, the stage mapping and the server call.

import { stagePolygon } from './wand.js';

export const LASSO_SIZE = 640; // long side of the working copy

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

// the pixel of lowest cost within `radius` of [x, y] (the click snaps to the nearest strong edge)
export function snap(cost, w, h, [x, y], radius = 6) {
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

  pop() {
    const v = this.v[0];
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
// and not to the photo. Never fails: when the box holds no path (it always does) the straight line
export function liveWire(cost, w, h, a, b, margin = 24) {
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

  const dist = new Float32Array(bw * bh).fill(Infinity);
  const back = new Int32Array(bw * bh).fill(-1);
  const heap = new Heap();

  dist[from] = 0;
  heap.push(0, from);

  while(heap.size) {
    const here = heap.pop();

    if(here === to) break;

    const hx = here % bw;
    const hy = (here - hx) / bw;
    const d = dist[here];

    for(const [dx, dy, step] of NEIGHBOURS) {
      const nx = hx + dx;
      const ny = hy + dy;

      if(nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;

      const next = ny * bw + nx;
      const total = d + step * cost[(ny + y0) * w + nx + x0];

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
export function outlineOfSegments(segments, w, h, tolerance = 0.8) {
  const joined = segments.flatMap((seg, i) => (i ? seg.slice(1) : seg));
  const poly = thin(joined, tolerance);

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
  const pixels = [...segments, ...(live ? [live] : [])].flatMap((seg, i) => (i ? seg.slice(1) : seg));

  if(pixels.length < 2 || !corners) return null;

  const r = v => Math.round(v * 100) / 100;
  const stage = stagePolygon(pixels.map(([x, y]) => [x + 0.5, y + 0.5]), { width: size.w, height: size.h }, corners, crop);

  return 'M' + stage.map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + (closed ? 'Z' : '');
}
