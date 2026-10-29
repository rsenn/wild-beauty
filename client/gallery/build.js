// Gallery builder (GALLERY.md S3, TODO 13.2): the scene3d document -> flat
// vertex data per material group, wall collision segments, the floor height and
// the start position. No three.js and no DOM here; the scene (13.3) turns the
// typed arrays into BufferGeometry.
//
// Plan coordinates are metres, x east and y north; the output is y up with
// z = -y, so north is -z. Groups:
//   wallN wallE wallS wallW  wall faces by the compass direction they face
//   wallTop                  the top of the walls
//   roomFloor corridorFloor  floors
// Each group is { position, uv, index } (Float32Array, Float32Array, Uint32Array).
// Wall uv: u metres along the wall, v metres above its base. Floor uv: the
// plan position in metres.

import { clean, distances, leftNormal, offsetLine, signedArea } from './line.js';

export const WALL = { height: 3.2, thickness: 0.2 };
export const CORRIDOR = { width: 2 };

// steepest ramp (rise over length) and sharpest corner (turn in degrees)
export const MAX_SLOPE = 1 / 12;
export const MAX_TURN = 90;

export const GROUPS = ['wallN', 'wallE', 'wallS', 'wallW', 'wallTop', 'roomFloor', 'corridorFloor'];

// growing vertex data for one material group
class Group {
  position = [];
  uv = [];
  index = [];

  // four corners counter-clockwise seen from the front: [x, y, z, u, v] each
  quad(a, b, c, d) {
    const first = this.position.length / 3;

    for(const [x, y, z, u, v] of [a, b, c, d]) {
      this.position.push(x, y, z);
      this.uv.push(u, v);
    }

    this.index.push(first, first + 1, first + 2, first, first + 2, first + 3);
  }

  tri(a, b, c) {
    const first = this.position.length / 3;

    for(const [x, y, z, u, v] of [a, b, c]) {
      this.position.push(x, y, z);
      this.uv.push(u, v);
    }

    this.index.push(first, first + 1, first + 2);
  }

  done() {
    return {
      position: new Float32Array(this.position),
      uv: new Float32Array(this.uv),
      index: new Uint32Array(this.index),
    };
  }
}

// the compass face a wall side shows: the side normal (nx, ny) in plan
// coordinates
export function facing(nx, ny) {
  return Math.abs(ny) >= Math.abs(nx) ? (ny > 0 ? 'wallN' : 'wallS') : nx > 0 ? 'wallE' : 'wallW';
}

// a wall along pts: a strip of thickness t from base[i] up by height. Open
// walls get end caps.
function wall(groups, pts, closed, base, height, t) {
  const left = offsetLine(pts, t / 2, closed);
  const right = offsetLine(pts, -t / 2, closed);
  const d = distances(pts, closed);
  const n = closed ? pts.length : pts.length - 1;
  const P = ([x, y], h) => [x, h, -y];

  for(let i = 0; i < n; i++) {
    const j = (i + 1) % pts.length;
    const [u0, u1] = [d[i], d[i + 1]];
    const [b0, b1] = [base[i], base[j]];
    const [nx, ny] = leftNormal(pts[i], pts[j]);
    const vert = (p, b, u, up) => [...P(p, b + (up ? height : 0)), u, up ? height : 0];

    groups[facing(nx, ny)].quad(vert(left[j], b1, u1, 0), vert(left[i], b0, u0, 0), vert(left[i], b0, u0, 1), vert(left[j], b1, u1, 1));
    groups[facing(-nx, -ny)].quad(vert(right[i], b0, u0, 0), vert(right[j], b1, u1, 0), vert(right[j], b1, u1, 1), vert(right[i], b0, u0, 1));
    groups.wallTop.quad(
      [...P(left[i], base[i] + height), u0, 0],
      [...P(right[i], base[i] + height), u0, t],
      [...P(right[j], base[j] + height), u1, t],
      [...P(left[j], base[j] + height), u1, 0],
    );
  }

  if(!closed) {
    const cap = (i, [nx, ny], flip) => {
      const [a, b] = flip ? [right[i], left[i]] : [left[i], right[i]];
      const [x, y] = [base[i], base[i] + height];

      groups[facing(nx, ny)].quad([...P(a, x), 0, 0], [...P(b, x), t, 0], [...P(b, y), t, height], [...P(a, y), 0, height]);
    };
    const [fx, fy] = leftNormal(pts[0], pts[1]);
    const last = pts.length - 1;
    const [lx, ly] = leftNormal(pts[last - 1], pts[last]);

    cap(0, [fy, -fx], false);
    cap(last, [-ly, lx], true);
  }
}

// ear clipping of a simple polygon: triangles as index triples
function earcut(poly) {
  const ids = poly.map((_, i) => i);
  const tris = [];

  if(signedArea(poly) < 0) ids.reverse();

  const cross = (a, b, c) => (poly[b][0] - poly[a][0]) * (poly[c][1] - poly[a][1]) - (poly[b][1] - poly[a][1]) * (poly[c][0] - poly[a][0]);
  const inside = (a, b, c, p) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;

  while(ids.length > 3) {
    let cut = -1;

    for(let k = 0; k < ids.length && cut < 0; k++) {
      const [a, b, c] = [ids[(k + ids.length - 1) % ids.length], ids[k], ids[(k + 1) % ids.length]];

      if(cross(a, b, c) <= 0) continue;
      if(ids.some(p => p !== a && p !== b && p !== c && inside(a, b, c, p))) continue;

      cut = k;
    }

    if(cut < 0) cut = 0; // degenerate outline: clip anyway so it terminates

    const [a, b, c] = [ids[(cut + ids.length - 1) % ids.length], ids[cut], ids[(cut + 1) % ids.length]];

    tris.push([a, b, c]);
    ids.splice(cut, 1);
  }

  tris.push([ids[0], ids[1], ids[2]]);

  return tris;
}

// even-odd point in polygon
function contains(poly, [x, y]) {
  let inside = false;

  for(let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];

    if(yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }

  return inside;
}

// where along the polyline the point is nearest: { dist, s } (s metres from the start)
function nearest(pts, d, [x, y]) {
  let best = { dist: Infinity, s: 0 };

  for(let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [dx, dy] = [pts[i + 1][0] - ax, pts[i + 1][1] - ay];
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const dist = Math.hypot(x - ax - t * dx, y - ay - t * dy);

    if(dist < best.dist) best = { dist, s: d[i] + t * (d[i + 1] - d[i]) };
  }

  return best;
}

// the height of a ramp at distance s along it
const rise = (c, s, total) => c.h0 + (c.h1 - c.h0) * (total ? s / total : 0);

// polyline turns (degrees, signed, counter-clockwise positive) at its inner points
function turns(pts, closed) {
  const out = [];

  for(let i = 0; i < pts.length; i++) {
    const prev = pts[(i + pts.length - 1) % pts.length];
    const next = pts[(i + 1) % pts.length];

    if(!closed && (i === 0 || i === pts.length - 1)) continue;

    const a = Math.atan2(pts[i][1] - prev[1], pts[i][0] - prev[0]);
    const b = Math.atan2(next[1] - pts[i][1], next[0] - pts[i][0]);

    out.push([i, (((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * (180 / Math.PI)]);
  }

  return out;
}

// the scene3d document -> the build. `warnings` lists what the owner should fix:
// { code: 'corner' | 'slope', wall | corridor, ... }
export function buildGallery(scene) {
  const plan = scene.plan ?? {};
  const t = scene.thickness ?? WALL.thickness;
  const groups = Object.fromEntries(GROUPS.map(g => [g, new Group()]));
  const collision = [];
  const warnings = [];
  const walls = [];
  const corridors = [];
  const rooms = [];
  const seg = (pts, closed, half) => {
    for(let i = 0; i + (closed ? 0 : 1) < pts.length; i++) {
      const [a, b] = [pts[i], pts[(i + 1) % pts.length]];

      collision.push([a[0], -a[1], b[0], -b[1], half]);
    }
  };

  (plan.walls ?? []).forEach((w, k) => {
    const closed = !!w.closed;
    const pts = clean(w.points ?? [], closed);

    if(pts.length < (closed ? 3 : 2)) return;

    const height = w.height ?? WALL.height;
    const base = pts.map(() => w.base ?? 0);

    for(const [, turn] of turns(pts, closed)) {
      if(closed && Math.abs(turn) > MAX_TURN + 1e-6) warnings.push({ code: 'corner', wall: k, turn: Math.abs(turn) });
    }

    wall(groups, pts, closed, base, height, t);
    seg(pts, closed, t / 2);
    walls.push({ pts, closed, height });

    if(closed) rooms.push({ type: 'room', points: pts, h: w.base ?? 0 });
  });

  (plan.corridors ?? []).forEach((c, k) => {
    const pts = clean(c.points ?? []);

    if(pts.length < 2) return;

    const width = c.width ?? CORRIDOR.width;
    const d = distances(pts);
    const total = d[d.length - 1];
    const h = d.map(s => rise({ h0: c.h0 ?? 0, h1: c.h1 ?? c.h0 ?? 0 }, s, total));
    const left = offsetLine(pts, width / 2);
    const right = offsetLine(pts, -width / 2);
    const floor = groups.corridorFloor;
    const P = ([x, y], v) => [x, v, -y];

    if(total && Math.abs((c.h1 ?? c.h0 ?? 0) - (c.h0 ?? 0)) / total > MAX_SLOPE + 1e-9) {
      warnings.push({ code: 'slope', corridor: k, slope: Math.abs(c.h1 - c.h0) / total });
    }

    for(let i = 0; i + 1 < pts.length; i++) {
      floor.quad([...P(left[i], h[i]), left[i][0], left[i][1]], [...P(right[i], h[i]), right[i][0], right[i][1]], [...P(right[i + 1], h[i + 1]), right[i + 1][0], right[i + 1][1]], [...P(left[i + 1], h[i + 1]), left[i + 1][0], left[i + 1][1]]);
    }

    if(c.walls !== false) {
      wall(groups, left, false, h, c.wallHeight ?? WALL.height, t);
      wall(groups, right, false, h, c.wallHeight ?? WALL.height, t);
      seg(left, false, t / 2);
      seg(right, false, t / 2);
    }

    corridors.push({ pts, d, width, h0: c.h0 ?? 0, h1: c.h1 ?? c.h0 ?? 0, total });
  });

  const floors = (plan.floors?.length ? plan.floors : rooms).map(f => ({ ...f, points: clean(f.points ?? [], true) }));

  for(const f of floors) {
    if(f.points.length < 3) continue;

    const target = f.type === 'corridor' ? groups.corridorFloor : groups.roomFloor;
    const v = ([x, y]) => [x, f.h ?? 0, -y, x, y];

    for(const [a, b, c] of earcut(f.points)) target.tri(v(f.points[a]), v(f.points[b]), v(f.points[c]));
  }

  // the floor under a plan position: later corridors, then later floors, win
  const floorHeightAt = (x, y) => {
    for(let i = corridors.length - 1; i >= 0; i--) {
      const c = corridors[i];
      const n = nearest(c.pts, c.d, [x, y]);

      if(n.dist <= c.width / 2) return rise(c, n.s, c.total);
    }

    for(let i = floors.length - 1; i >= 0; i--) {
      if(floors[i].points.length >= 3 && contains(floors[i].points, [x, y])) return floors[i].h ?? 0;
    }

    return null;
  };

  const at = scene.start?.at ?? [0, 0];
  const start = { x: at[0], y: at[1], look: scene.start?.look ?? 0, h: floorHeightAt(at[0], at[1]) ?? 0 };

  return {
    groups: Object.fromEntries(GROUPS.map(g => [g, groups[g].done()])),
    collision,
    floorHeightAt,
    start,
    warnings,
  };
}
