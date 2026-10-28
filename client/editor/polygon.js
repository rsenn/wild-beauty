// Polygon maths for clip paths (EDITOR.md E121, UX-REQUIREMENTS.md I5): the area
// of a polygon, a point in a polygon, and splitting a polygon along a stroke
// that goes from one edge to the other. Pure functions; a polygon is
// [[x, y], ...] (closed implicitly), a stroke is an open [[x, y], ...].

// the vertex-touching tolerance of a crossing along an edge (0..1)
const EDGE = 1e-9;

// the smallest piece of a cut, as a fraction of the polygon's area
export const MIN_PIECE = 0.02;

// signed area (positive for a counter-clockwise polygon in a y-up plane)
export function area(poly) {
  let sum = 0;

  for(let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];

    sum += x1 * y2 - x2 * y1;
  }

  return sum / 2;
}

// even-odd test
export function contains(poly, [x, y]) {
  let inside = false;

  for(let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];

    if(yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }

  return inside;
}

// where segment a->b meets segment c->d: { t, u } along each, or null when they
// are parallel or do not meet (both parameters in [0, 1])
function meet(a, b, c, d) {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const den = rx * sy - ry * sx;

  if(den === 0) return null;

  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, u } : null;
}

// does an open polyline cross itself (neighbouring segments are skipped)
function crossesItself(line) {
  for(let i = 0; i < line.length - 1; i++)
    for(let j = i + 2; j < line.length - 1; j++) if(meet(line[i], line[i + 1], line[j], line[j + 1])) return true;

  return false;
}

// Split `poly` along `stroke`. The stroke may start and end outside the polygon;
// it must cross the boundary exactly twice, and the part between the two
// crossings must lie inside. Returns [a, b] (two polygons with the winding of
// `poly`) or null: fewer or more crossings, a crossing at a vertex (ambiguous),
// a stroke that crosses itself between the crossings, or a piece smaller than
// `minFraction` of the polygon (a sliver is a slip of the finger, not a cut).
export function splitByLine(poly, stroke, minFraction = MIN_PIECE) {
  const n = poly.length;

  if(n < 3 || !Array.isArray(stroke) || stroke.length < 2) return null;

  const hits = [];

  for(let j = 0; j < stroke.length - 1; j++)
    for(let i = 0; i < n; i++) {
      const hit = meet(stroke[j], stroke[j + 1], poly[i], poly[(i + 1) % n]);

      if(!hit) continue;
      if(hit.u < EDGE || hit.u > 1 - EDGE) return null;
      // a crossing at the end of a stroke segment is counted by the next segment
      if(hit.t > 1 - EDGE && j < stroke.length - 2) continue;

      hits.push({ j, i, t: hit.t, u: hit.u });
    }

  if(hits.length !== 2) return null;

  hits.sort((p, q) => p.j + p.t - (q.j + q.t));

  const [p, q] = hits;
  const at = h => [stroke[h.j][0] + (stroke[h.j + 1][0] - stroke[h.j][0]) * h.t, stroke[h.j][1] + (stroke[h.j + 1][1] - stroke[h.j][1]) * h.t];
  const P = at(p);
  const Q = at(q);

  // the stroke between the crossings: its own vertices, strictly between
  const mid = stroke.slice(p.j + 1, q.j + 1);

  // the polygon boundary from one crossing forward to the other
  const walk = (from, to, A, B) => {
    const steps = from.i === to.i ? (from.u < to.u ? 0 : n) : (to.i - from.i + n) % n;
    const out = [A];

    for(let k = 1; k <= steps; k++) out.push(poly[(from.i + k) % n]);

    out.push(B);

    return out;
  };

  const forward = walk(p, q, P, Q);
  const backward = walk(q, p, Q, P);

  // the part between the crossings must be inside the polygon, and not tangle
  const probe = mid.length ? [(P[0] + mid[0][0]) / 2, (P[1] + mid[0][1]) / 2] : [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];

  if(!contains(poly, probe) || crossesItself([P, ...mid, Q])) return null;

  const a = forward.concat([...mid].reverse());
  const b = backward.concat(mid);
  const sign = Math.sign(area(poly));

  const least = Math.max(1e-6, Math.abs(area(poly)) * minFraction);

  for(const piece of [a, b]) if(Math.sign(area(piece)) !== sign || Math.abs(area(piece)) < least) return null;

  return [a, b];
}

// The direction a stroke is heading at its last point: from the point `span`
// units back along the stroke (jitter of the last few pixels is ignored) to the
// end. Null for a stroke that has not moved.
function heading(stroke, span) {
  const end = stroke[stroke.length - 1];
  let walked = 0;

  for(let i = stroke.length - 2; i >= 0; i--) {
    walked += Math.hypot(stroke[i + 1][0] - stroke[i][0], stroke[i + 1][1] - stroke[i][1]);

    if(walked >= span || i === 0) {
      const dx = end[0] - stroke[i][0];
      const dy = end[1] - stroke[i][1];
      const len = Math.hypot(dx, dy);

      return len > 0 ? [dx / len, dy / len] : null;
    }
  }

  return null;
}

// Extend the last point of `stroke` along its heading to the border of `poly`
// when it lies inside and the border is within `reach`; the new point sits a
// little beyond the border so the crossing is a proper one. A stroke end that
// is outside already, heads away from the border or is too far is left alone.
function extendEnd(poly, stroke, reach) {
  const end = stroke[stroke.length - 1];

  if(!contains(poly, end)) return stroke;

  const dir = heading(stroke, reach / 2);

  if(!dir) return stroke;

  const far = [end[0] + dir[0] * reach, end[1] + dir[1] * reach];
  let best = null;

  for(let i = 0; i < poly.length; i++) {
    const hit = meet(end, far, poly[i], poly[(i + 1) % poly.length]);

    if(!hit) continue;
    // a hit at a vertex is ambiguous, as in splitByLine
    if(hit.u < EDGE || hit.u > 1 - EDGE) return stroke;
    if(!best || hit.t < best) best = hit.t;
  }

  if(best === null) return stroke;

  const go = best * reach + reach * 0.05;

  return [...stroke, [end[0] + dir[0] * go, end[1] + dir[1] * go]];
}

// `stroke` with both ends extended to the border where they tend to it
export function extendStroke(poly, stroke, reach) {
  if(!Array.isArray(stroke) || stroke.length < 2 || !(reach > 0)) return stroke;

  const tail = extendEnd(poly, stroke, reach);
  const head = extendEnd(poly, [...tail].reverse(), reach);

  return head.reverse();
}

// Cut `poly` along `stroke` the tolerant way (E121): the stroke may lie wholly
// inside the polygon (a photo that fills the stage) as long as both ends tend to
// the border within `reach` (same units as the polygon); the ends are extended
// smoothly along their heading. A stroke that hits a vertex exactly is nudged by
// a fraction of `reach` to either side, which makes the crossing proper (a stroke
// pointing at a corner is a valid cut). Returns [a, b] or null, as splitByLine.
export function cutByStroke(poly, stroke, reach, minFraction = MIN_PIECE) {
  if(!Array.isArray(stroke) || !(reach > 0)) return null;

  const d = reach * 0.02;

  for(const [dx, dy] of [[0, 0], [d, d * 0.618], [-d, -d * 0.618]]) {
    const moved = dx || dy ? stroke.map(([x, y]) => [x + dx, y + dy]) : stroke;
    const pieces = splitByLine(poly, extendStroke(poly, moved, reach), minFraction);

    if(pieces) return pieces;
  }

  return null;
}
