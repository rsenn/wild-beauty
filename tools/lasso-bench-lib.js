// The pure part of the lasso benchmark (tools/lasso-bench.js): ground-truth outline of a matte, a
// simulated user who clicks along it, the lasso's own code (snap, createWire) turning the clicks into
// an outline, and the scores. No file, no process: tests/lasso-bench.test.js runs it on synthetic shapes.
//
// What is measured follows WAND.md Part D: the mask of the result against the matte, as IoU and as
// boundary F (precision and recall of the outline within `tol` pixels), for several click spacings, so
// "clicks to reach IoU 0.9" can be read off. The same simulated clicks with NO snapping (a polygon
// through the clicks) are scored too: the difference is what the edge map buys.

import { createWire, outlineOfSegments, snap } from '../client/editor/lasso.js';

// the largest 4-connected foreground component of `mask` (w x h, 0 / 1), as a new mask
export function largestComponent(mask, w, h) {
  const seen = new Uint8Array(w * h);
  let best = null;
  const stack = [];

  for(let i = 0; i < mask.length; i++) {
    if(!mask[i] || seen[i]) continue;

    const part = [];

    stack.push(i);
    seen[i] = 1;

    while(stack.length) {
      const at = stack.pop();
      const x = at % w;
      const y = (at - x) / w;

      part.push(at);

      for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;

        if(nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

        const next = ny * w + nx;

        if(mask[next] && !seen[next]) {
          seen[next] = 1;
          stack.push(next);
        }
      }
    }

    if(!best || part.length > best.length) best = part;
  }

  const out = new Uint8Array(w * h);

  for(const i of best ?? []) out[i] = 1;

  return out;
}

// the outer boundary of a mask with one component, as an ordered list of [x, y] pixels (Moore-neighbour
// tracing, 8-connected, Jacob's stopping rule); [] for an empty mask
export function traceContour(mask, w, h) {
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  let sx = -1;
  let sy = -1;

  for(let i = 0; i < mask.length && sx < 0; i++) if(mask[i]) [sx, sy] = [i % w, Math.floor(i / w)];

  if(sx < 0) return [];

  // clockwise from West
  const ring = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const out = [[sx, sy]];
  let [cx, cy] = [sx, sy];
  let from = 0; // the direction (in `ring`) of the background pixel we came from: West of the start
  let first = null;

  for(let guard = 0; guard < w * h * 4; guard++) {
    let found = -1;

    for(let k = 1; k <= 8; k++) {
      const d = (from + k) % 8;

      if(at(cx + ring[d][0], cy + ring[d][1])) {
        found = d;
        break;
      }
    }

    if(found < 0) break; // a single pixel

    // the background pixel scanned just before the hit is where the next scan starts
    const prev = (found + 7) % 8;
    const bx = cx + ring[prev][0];
    const by = cy + ring[prev][1];

    cx += ring[found][0];
    cy += ring[found][1];

    const nextFrom = ring.findIndex(([dx, dy]) => cx + dx === bx && cy + dy === by);

    from = nextFrom < 0 ? (found + 4) % 8 : nextFrom;

    if(first === null) first = [cx, cy, from];
    else if(cx === first[0] && cy === first[1] && from === first[2]) break; // Jacob's criterion

    if(cx === sx && cy === sy && first && out.length > 2 && first[0] === sx && first[1] === sy) break;

    out.push([cx, cy]);
  }

  // the loop ends on the pixel it started with: do not repeat it
  while(out.length > 1 && out.at(-1)[0] === sx && out.at(-1)[1] === sy) out.pop();

  return out;
}

// points every `spacing` pixels along a closed outline, starting at `offset` pixels of arc length
export function resample(points, spacing, offset = 0) {
  const n = points.length;

  if(n < 2) return points.slice();

  const lens = points.map((p, i) => Math.hypot(points[(i + 1) % n][0] - p[0], points[(i + 1) % n][1] - p[1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const count = Math.max(3, Math.round(total / Math.max(1, spacing)));
  const step = total / count;
  const out = [];
  let i = 0;
  let acc = 0;

  for(let k = 0; k < count; k++) {
    const target = (offset + k * step) % total;

    while(acc + lens[i] < target) {
      acc += lens[i];
      i = (i + 1) % n;

      if(i === 0) acc = 0;
    }

    const t = lens[i] ? (target - acc) / lens[i] : 0;
    const q = points[(i + 1) % n];

    out.push([points[i][0] + (q[0] - points[i][0]) * t, points[i][1] + (q[1] - points[i][1]) * t]);
  }

  return out;
}

// a user's aim is not perfect: every point moved by a random vector of at most `sigma` px (uniform in a disc)
export function jitter(points, sigma, rnd) {
  return points.map(([x, y]) => {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * sigma;

    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
}

// the mask of a polygon [[x, y], ...] in pixels of a w x h grid, even-odd, pixel centres
export function fillPolygon(poly, w, h) {
  const out = new Uint8Array(w * h);
  const n = poly.length;

  for(let y = 0; y < h; y++) {
    const xs = [];
    const yc = y + 0.5;

    for(let i = 0; i < n; i++) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % n];

      if((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + ((yc - y0) / (y1 - y0)) * (x1 - x0));
    }

    xs.sort((a, b) => a - b);

    for(let k = 0; k + 1 < xs.length; k += 2) {
      for(let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(w - 1, Math.ceil(xs[k + 1] - 0.5) - 1); x++) out[y * w + x] = 1;
    }
  }

  return out;
}

export function iou(a, b) {
  let both = 0;
  let any = 0;

  for(let i = 0; i < a.length; i++) {
    if(a[i] && b[i]) both++;
    if(a[i] || b[i]) any++;
  }

  return any ? both / any : 1;
}

// the foreground pixels with a 4-neighbour that is background (or the border of the image)
function boundary(mask, w, h) {
  const out = new Uint8Array(w * h);

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      if(!mask[y * w + x]) continue;
      if(x === 0 || y === 0 || x === w - 1 || y === h - 1 || !mask[y * w + x - 1] || !mask[y * w + x + 1] || !mask[(y - 1) * w + x] || !mask[(y + 1) * w + x]) out[y * w + x] = 1;
    }
  }

  return out;
}

// `mask` grown by `r` pixels (a square: cheap, and r is small)
function grow(mask, w, h, r) {
  const out = new Uint8Array(w * h);

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      if(!mask[y * w + x]) continue;

      for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++) if(x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) out[(y + dy) * w + x + dx] = 1;
    }
  }

  return out;
}

// boundary F: the share of the predicted outline within `tol` px of the true one (precision), of the true one
// within `tol` of the predicted (recall), and their harmonic mean
export function boundaryF(pred, gt, w, h, tol = 2) {
  const bp = boundary(pred, w, h);
  const bg = boundary(gt, w, h);
  const near = (from, to) => {
    const reach = grow(to, w, h, tol);
    let hit = 0;
    let all = 0;

    for(let i = 0; i < from.length; i++) {
      if(!from[i]) continue;

      all++;
      if(reach[i]) hit++;
    }

    return all ? hit / all : 1;
  };
  const precision = near(bp, bg);
  const recall = near(bg, bp);

  return { precision, recall, f: precision + recall ? (2 * precision * recall) / (precision + recall) : 0 };
}

// One simulated lasso on a matte: a user clicks about every `spacing` px along its outline, each click
// off by up to `sigma` px; the lasso's own code turns the clicks into an outline. `cost` is the edge cost
// of the photo (the same grid as the matte). Returns the mask of the lasso, the mask of a plain polygon
// through the same clicks, the number of clicks and the time the lasso took
export function simulate({ cost, gt, w, h, spacing, sigma, rnd, contour, snapRadius = 6, radius = 220 }) {
  const aim = jitter(resample(contour, spacing, rnd() * spacing), sigma, rnd).map(([x, y]) => [Math.min(w - 1, Math.max(0, Math.round(x))), Math.min(h - 1, Math.max(0, Math.round(y)))]);
  const t0 = performance.now();
  const anchors = aim.map(p => snap(cost, w, h, p, snapRadius));
  const segments = [];

  for(let i = 0; i < anchors.length; i++) {
    const tree = createWire(cost, w, h, anchors[i], radius);
    const to = anchors[(i + 1) % anchors.length];

    tree.finishTo(to, 1000);
    segments.push(tree.pathTo(to));
  }

  const polygon = outlineOfSegments(segments, w, h, 0.8).map(([x, y]) => [x * w - 0.5, y * h - 0.5]);
  const ms = performance.now() - t0;

  return { clicks: anchors.length, ms, lasso: fillPolygon(polygon, w, h), plain: fillPolygon(aim, w, h), gt };
}

// the numbers of one simulation
export function score(sim, w, h, tol = 2) {
  const l = boundaryF(sim.lasso, sim.gt, w, h, tol);
  const p = boundaryF(sim.plain, sim.gt, w, h, tol);

  return { clicks: sim.clicks, ms: sim.ms, iou: iou(sim.lasso, sim.gt), f: l.f, plainIou: iou(sim.plain, sim.gt), plainF: p.f };
}

// mean, median and the share at or above `at` of a list
export function summarise(values, at = 0.9) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);

  if(!v.length) return { mean: NaN, median: NaN, share: NaN, n: 0 };

  return { mean: v.reduce((a, b) => a + b, 0) / v.length, median: v[Math.floor(v.length / 2)], share: v.filter(x => x >= at).length / v.length, n: v.length };
}
