// The drawn plan of a gallery node -> the scene3d document the builder takes
// (EDITOR.md E136, TODO 13.1). The walls are the shape steps flagged `wall`:
// a closed one is a room, an open one a corridor `width` metres wide. Stage
// units become metres (roomaid.js UNITS_PER_METRE), the stage's top is north
// (y flips), moves and turns of a step (transform steps) are applied.
//
// Where a corridor meets a room, the corridor is cut back to the wall of the room
// and the wall gets a doorway as wide as the corridor: a room with doorways is a
// set of open wall polylines, a room without one a closed polygon. Walls are
// handed over clockwise (autoplan.js `clockwise`) so the guided tour goes right.
// Pure, no DOM. -> a scene3d document, or null when the node has no walls.

import { apply } from '../editor/matrix.js';
import { matrixOf } from '../editor/hit.js';
import { UNITS_PER_METRE } from '../editor/roomaid.js';
import { verticesFromPath } from '../editor/shapes.js';
import { CORRIDOR_WIDTH, PARAPET_HEIGHT, WALL_HEIGHT } from '../editor/walls.js';
import { LOOKS, clockwise } from './autoplan.js';
import { contains } from '../editor/polygon.js';
import { clean, signedArea } from './line.js';

const CURVE = 8; // samples per bezier segment
const EPS = 1e-6;

// the vertices of a shape as a polyline in stage units: bezier segments flattened
export function flatten({ vertices, closed }) {
  const out = [];
  const n = closed ? vertices.length : vertices.length - 1;

  for(let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];

    out.push([a.x, a.y]);

    if(a.hout || b.hin) {
      const c1 = [a.x + (a.hout?.[0] ?? 0), a.y + (a.hout?.[1] ?? 0)];
      const c2 = [b.x + (b.hin?.[0] ?? 0), b.y + (b.hin?.[1] ?? 0)];

      for(let k = 1; k < CURVE; k++) {
        const t = k / CURVE;
        const u = 1 - t;
        const f = (p, q, r, s) => u * u * u * p + 3 * u * u * t * q + 3 * u * t * t * r + t * t * t * s;

        out.push([f(a.x, c1[0], c2[0], b.x), f(a.y, c1[1], c2[1], b.y)]);
      }
    }
  }

  if(!closed) out.push([vertices[vertices.length - 1].x, vertices[vertices.length - 1].y]);

  return out;
}

// where segment p->q meets segment r->s: the parameter along p->q, or null
function cross(p, q, r, s) {
  const [dx, dy, ex, ey] = [q[0] - p[0], q[1] - p[1], s[0] - r[0], s[1] - r[1]];
  const den = dx * ey - dy * ex;

  if(Math.abs(den) < 1e-12) return null;

  const t = ((r[0] - p[0]) * ey - (r[1] - p[1]) * ex) / den;
  const u = ((r[0] - p[0]) * dy - (r[1] - p[1]) * dx) / den;

  return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS ? t : null;
}

// The polyline from where it first leaves `poly` (its start is inside) on,
// unchanged when it never does.
function afterExit(line, poly) {
  for(let i = 0; i + 1 < line.length; i++) {
    let best = null;

    for(let j = 0; j < poly.length; j++) {
      const t = cross(line[i], line[i + 1], poly[j], poly[(j + 1) % poly.length]);

      if(t !== null && t > EPS && (best === null || t < best)) best = t;
    }

    if(best !== null) return [[line[i][0] + (line[i + 1][0] - line[i][0]) * best, line[i][1] + (line[i + 1][1] - line[i][1]) * best], ...line.slice(i + 1)];
  }

  return line;
}

// the corridor cut back to the walls of the rooms its ends lie in
export function trimCorridor(line, rooms) {
  let out = line;
  const first = rooms.find(poly => contains(poly, out[0]));

  if(first) out = afterExit(out, first);

  const last = rooms.find(poly => contains(poly, out[out.length - 1]));

  if(last) out = afterExit([...out].reverse(), last).reverse();

  return out;
}

// The part [lo, hi] of segment e0 + t d (t in 0..1) inside the band of a corridor
// segment a->b (half width w/2, extended by w/2 past both ends), or null.
function inBand(e0, d, a, b, half) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);

  if(!len) return null;

  const u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const n = [-u[1], u[0]];
  const rel = [e0[0] - a[0], e0[1] - a[1]];
  const s0 = rel[0] * u[0] + rel[1] * u[1];
  const s1 = d[0] * u[0] + d[1] * u[1];
  const q0 = rel[0] * n[0] + rel[1] * n[1];
  const q1 = d[0] * n[0] + d[1] * n[1];
  let [lo, hi] = [0, 1];

  // g0 + g1 t >= 0 for each of: s >= -half, s <= len + half, q >= -half, q <= half
  for(const [g0, g1] of [[s0 + half, s1], [len + half - s0, -s1], [q0 + half, q1], [half - q0, -q1]]) {
    if(Math.abs(g1) < 1e-12) {
      if(g0 < 0) return null;
    } else if(g1 > 0) lo = Math.max(lo, -g0 / g1);
    else hi = Math.min(hi, -g0 / g1);
  }

  return hi - lo > EPS ? [lo, hi] : null;
}

// a room (counter-clockwise polygon) with doorways where the corridors cross it:
// [{ points, closed }] (one closed wall when there is no doorway)
export function cutRoom(poly, corridors) {
  const pieces = [];
  let cur = null;
  let cut = false;

  for(let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    const d = [b[0] - a[0], b[1] - a[1]];
    const gaps = corridors
      .flatMap(c => c.points.slice(1).map((p, k) => inBand(a, d, c.points[k], p, c.width / 2)))
      .filter(Boolean)
      .sort((x, y) => x[0] - y[0]);
    let at = 0;
    const solid = [];

    for(const [lo, hi] of gaps) {
      if(lo > at + EPS) solid.push([at, lo]);

      at = Math.max(at, hi);
    }

    if(at < 1 - EPS) solid.push([at, 1]);

    if(solid.length !== 1 || solid[0][0] > EPS || solid[0][1] < 1 - EPS) cut = true;

    for(const [lo, hi] of solid) {
      const p = [a[0] + d[0] * lo, a[1] + d[1] * lo];
      const q = [a[0] + d[0] * hi, a[1] + d[1] * hi];

      if(cur && Math.hypot(cur[cur.length - 1][0] - p[0], cur[cur.length - 1][1] - p[1]) < 1e-4) cur.push(q);
      else {
        if(cur) pieces.push(cur);

        cur = [p, q];
      }
    }
  }

  if(cur) pieces.push(cur);

  if(!cut) return [{ points: poly, closed: true }];

  // the boundary wraps round: the last piece goes on into the first
  if(pieces.length > 1) {
    const [head, tail] = [pieces[0], pieces[pieces.length - 1]];

    if(Math.hypot(head[0][0] - tail[tail.length - 1][0], head[0][1] - tail[tail.length - 1][1]) < 1e-4) {
      pieces.splice(0, 1);
      tail.push(...head.slice(1));
    }
  }

  return pieces.map(points => ({ points: clean(points), closed: false })).filter(w => w.points.length >= 2);
}

// a point well inside a room: the middle of the longest horizontal chord through
// its bounding box centre, falling back to the first corner moved inward
function insidePoint(poly) {
  const ys = poly.map(p => p[1]);
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  const xs = [];

  for(let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];

    if(a[1] > y !== b[1] > y) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
  }

  xs.sort((p, q) => p - q);

  let best = [0, 0];

  for(let i = 0; i + 1 < xs.length; i += 2) if(xs[i + 1] - xs[i] > best[1] - best[0] || i === 0) best = [xs[i], xs[i + 1]];

  return [(best[0] + best[1]) / 2, y];
}

// the wall height of a corridor: low, like a bridge. Corridors drawn before
// the parapet was the default carry the room height (WALL_HEIGHT) as their
// own, so that value counts as "not chosen"
const parapet = h => (h === undefined || h === WALL_HEIGHT ? PARAPET_HEIGHT : h);

export function planFromDoc(doc) {
  const metres = ([x, y]) => [x / UNITS_PER_METRE, -y / UNITS_PER_METRE];
  const rooms = [];
  const lines = [];

  (doc?.pages ?? []).forEach((page, p) => {
    for(const step of page.steps) {
      if(step.op !== 'shape' || !step.wall) continue;

      const parsed = verticesFromPath(step.path);

      if(!parsed) continue;

      const m = matrixOf(doc, step.id, { page: p });
      const pts = clean(flatten(parsed).map(pt => metres(m ? apply(m, pt) : pt)), parsed.closed);

      if(parsed.closed && pts.length >= 3) rooms.push({ pts: signedArea(pts) < 0 ? [...pts].reverse() : pts, height: step.wall.height ?? WALL_HEIGHT });
      else if(!parsed.closed && pts.length >= 2) lines.push({ pts, width: step.wall.width ?? CORRIDOR_WIDTH, height: parapet(step.wall.height) });
    }
  });

  if(!rooms.length) return null;

  const polys = rooms.map(r => r.pts);
  const corridors = lines.map(l => ({ ...l, pts: trimCorridor(l.pts, polys) })).filter(c => c.pts.length >= 2);
  const walls = rooms.flatMap(room => clockwise(cutRoom(room.pts, corridors.map(c => ({ points: c.pts, width: c.width })))).map(w => ({ ...w, height: room.height })));
  const scene = doc.scene ?? {};

  return {
    type: 'scene3d',
    kind: 'gallery',
    plan: {
      walls,
      corridors: corridors.map(c => ({ points: c.pts, width: c.width, h0: 0, h1: 0, walls: true, wallHeight: c.height })),
      floors: rooms.map(r => ({ type: 'room', points: r.pts })),
    },
    thickness: scene.thickness ?? 0.2,
    style: scene.style ?? LOOKS.warm,
    start: scene.start ?? { at: insidePoint(polys[0]), look: 0 },
  };
}
