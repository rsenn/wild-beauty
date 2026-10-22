// Shape tool maths (EDITOR.md S6, E13): vertices with optional bezier
// handles <-> SVG path string, vertex operations, hit-testing. Pure
// functions; every operation returns a new vertex array.
//
// vertex = { x, y, hin?: [dx, dy], hout?: [dx, dy], broken?: true }
// The handles are offsets from the vertex. They mirror each other (the
// symmetric handle of the shape tool) unless `broken` is set.
import { Bezier } from '../../vendor/bezier-js/bezier.js';

const r = v => Math.round(v * 100) / 100;
const has = h => h && (h[0] !== 0 || h[1] !== 0);

// the segment a -> b as a Bezier; a straight one is a cubic with its control
// points on the line
function bezier(a, b) {
  const o = has(a.hout) ? a.hout : null;
  const i = has(b.hin) ? b.hin : null;

  if(!o && !i)
    return new Bezier(a.x, a.y, a.x + (b.x - a.x) / 3, a.y + (b.y - a.y) / 3, a.x + ((b.x - a.x) * 2) / 3, a.y + ((b.y - a.y) * 2) / 3, b.x, b.y);

  return new Bezier(a.x, a.y, a.x + (o ? o[0] : 0), a.y + (o ? o[1] : 0), b.x + (i ? i[0] : 0), b.y + (i ? i[1] : 0), b.x, b.y);
}

const isLine = (a, b) => !has(a.hout) && !has(b.hin);

// number of segments: one between neighbours, plus the closing one
const count = (v, closed) => (v.length < 2 ? 0 : closed ? v.length : v.length - 1);

// the segments as Beziers; segment i runs from vertex i to vertex i + 1
export function segments(v, closed = false) {
  const out = [];

  for(let i = 0, n = count(v, closed); i < n; i++) out.push(bezier(v[i], v[(i + 1) % v.length]));

  return out;
}

// vertices -> 'M..L..C..Z'. A closing segment without handles is left to Z.
export function pathFromVertices(v, closed = false) {
  if(!v.length) return '';

  let d = `M${r(v[0].x)} ${r(v[0].y)}`;

  for(let i = 0, n = count(v, closed); i < n; i++) {
    const a = v[i];
    const b = v[(i + 1) % v.length];

    if(isLine(a, b)) {
      if(!(closed && i == n - 1)) d += `L${r(b.x)} ${r(b.y)}`;
    } else {
      const o = a.hout || [0, 0];
      const h = b.hin || [0, 0];

      d += `C${r(a.x + o[0])} ${r(a.y + o[1])} ${r(b.x + h[0])} ${r(b.y + h[1])} ${r(b.x)} ${r(b.y)}`;
    }
  }

  return closed && v.length > 1 ? d + 'Z' : d;
}

const mirrored = (a, b) => Math.abs(a[0] + b[0]) < 0.011 && Math.abs(a[1] + b[1]) < 0.011;

// 'M..L..C..Z' (absolute commands only, what pathFromVertices writes) ->
// { vertices, closed }, or null when the string is anything else
export function verticesFromPath(d) {
  const tokens = String(d).match(/[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);

  if(!tokens || tokens.join('').length < String(d).replace(/[\s,]/g, '').length) return null;

  const v = [];
  const need = { M: 2, L: 2, C: 6, Z: 0 };
  let closed = false;
  let pending; // outgoing handle of the last vertex, set by a C

  for(let i = 0; i < tokens.length; ) {
    const c = tokens[i++].toUpperCase();
    const n = need[c];

    if(n === undefined || closed || (c == 'M') != (v.length == 0)) return null;

    const a = tokens.slice(i, i + n).map(Number);

    if(a.length < n || a.some(x => !Number.isFinite(x))) return null;
    i += n;

    if(c == 'Z') {
      closed = true;
      continue;
    }

    const p = a.slice(n - 2);
    const last = v[v.length - 1];

    if(c == 'C') {
      last.hout = [a[0] - last.x, a[1] - last.y];
      v.push({ x: p[0], y: p[1], hin: [a[2] - p[0], a[3] - p[1]] });
    } else {
      v.push({ x: p[0], y: p[1] });
    }
  }

  if(!v.length) return null;

  // a final segment that returns to the start is the closing one
  if(closed && v.length > 1) {
    const f = v[0];
    const l = v[v.length - 1];

    if(r(l.x) == r(f.x) && r(l.y) == r(f.y)) {
      v.pop();
      if(l.hin) f.hin = l.hin;
    }
  }

  for(const q of v) {
    for(const k of ['hin', 'hout']) if(q[k]) q[k] = q[k].map(r);
    for(const k of ['hin', 'hout']) if(q[k] && !has(q[k])) delete q[k];
    if(q.hin && q.hout && !mirrored(q.hin, q.hout)) q.broken = true;
  }

  return { vertices: v, closed: closed && v.length > 1 };
}

// insert a vertex on segment `seg` at parameter `t` without changing the
// curve (de Casteljau split)
export function insertVertex(v, seg, t, closed = false) {
  const n = count(v, closed);

  if(!(seg >= 0 && seg < n) || !(t > 0 && t < 1)) return v.map(q => ({ ...q }));

  const j = (seg + 1) % v.length;
  const a = v[seg];
  const b = v[j];
  const out = v.map(q => ({ ...q }));

  if(isLine(a, b)) {
    out.splice(seg + 1, 0, { x: r(a.x + (b.x - a.x) * t), y: r(a.y + (b.y - a.y) * t) });

    return out;
  }

  const { left, right } = bezier(a, b).split(t);
  const [p0, c1, c2, m] = left.points;
  const [, d1, d2, p1] = right.points;
  const ins = { x: r(m.x), y: r(m.y), hin: [r(c2.x - m.x), r(c2.y - m.y)], hout: [r(d1.x - m.x), r(d1.y - m.y)] };

  if(!mirrored(ins.hin, ins.hout)) ins.broken = true;

  out[seg].hout = [r(c1.x - p0.x), r(c1.y - p0.y)];
  out[j].hin = [r(d2.x - p1.x), r(d2.y - p1.y)];
  out.splice(seg + 1, 0, ins);

  return out;
}

// move a vertex; its handles are offsets and travel with it
export function moveVertex(v, i, x, y) {
  return v.map((q, k) => (k == i ? { ...q, x: r(x), y: r(y) } : { ...q }));
}

export function deleteVertex(v, i) {
  return v.filter((_, k) => k != i).map(q => ({ ...q }));
}

// set a handle ('hin' | 'hout') to the offset (dx, dy); the other mirrors it
// unless the vertex is broken
export function moveHandle(v, i, which, dx, dy) {
  const other = which == 'hin' ? 'hout' : 'hin';

  return v.map((q, k) => {
    if(k != i) return { ...q };

    const o = { ...q, [which]: [r(dx), r(dy)] };

    if(!q.broken) o[other] = [r(-dx) + 0, r(-dy) + 0];

    return o;
  });
}

// give vertex i independent handles (moveHandle stops mirroring)
export function breakSymmetry(v, i) {
  return v.map((q, k) => (k == i ? { ...q, broken: true } : { ...q }));
}

// restore the mirror: the incoming handle wins
export function joinSymmetry(v, i) {
  return v.map((q, k) => {
    if(k != i) return { ...q };

    const { broken, ...o } = q;
    const h = q.hin || (q.hout && [-q.hout[0] + 0, -q.hout[1] + 0]);

    if(h) {
      o.hin = h;
      o.hout = [-h[0] + 0, -h[1] + 0];
    }

    return o;
  });
}

// the point of the path nearest to `point`: { seg, t, x, y, d }, or null for
// a path without segments
export function nearest(v, closed, point) {
  let best = null;

  segments(v, closed).forEach((s, seg) => {
    const p = s.project({ x: point.x, y: point.y });
    const d = Math.hypot(p.x - point.x, p.y - point.y);

    if(!best || d < best.d) best = { seg, t: p.t, x: p.x, y: p.y, d };
  });

  return best;
}

// the nearest point of the path when it is within `tolerance`, else null
export function hitTest(v, closed, point, tolerance) {
  const n = nearest(v, closed, point);

  return n && n.d <= tolerance ? n : null;
}

// bounding box of the curve (not of the handles): { x, y, w, h }
export function bounds(v, closed = false) {
  if(!v.length) return null;

  const s = segments(v, closed);
  let x0 = v[0].x, y0 = v[0].y, x1 = x0, y1 = y0;

  for(const b of s) {
    const bb = b.bbox();

    x0 = Math.min(x0, bb.x.min);
    y0 = Math.min(y0, bb.y.min);
    x1 = Math.max(x1, bb.x.max);
    y1 = Math.max(y1, bb.y.max);
  }

  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
