// What a stroke drawn with the clip tool means (EDITOR.md E114, E121,
// UX-REQUIREMENTS.md I5): a tap, a closing outline (a new clip), a cut across
// the photo (two photo copies), or nothing the editor can use. Pure functions on
// points in stage units; the distances come from the caller in the same units.
import { area, cutByStroke } from './polygon.js';

// at most this many corners in a polygon that is stored (LIMITS.pathChars)
const MAX_CORNERS = 300;

// the corners of `points` that matter (Douglas-Peucker): every point stays
// within `eps` of the simplified line
export function simplify(points, eps) {
  if(points.length < 3) return points.slice();

  const keep = new Uint8Array(points.length);
  const todo = [[0, points.length - 1]];

  keep[0] = keep[points.length - 1] = 1;

  while(todo.length) {
    const [a, b] = todo.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let most = eps;

    for(let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = len ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len : Math.hypot(px - ax, py - ay);

      if(d > most) [far, most] = [i, d];
    }

    if(far >= 0) {
      keep[far] = 1;
      todo.push([a, far], [far, b]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

// simplify until at most `max` corners remain
function fewer(points, eps, max = MAX_CORNERS) {
  let out = simplify(points, eps);

  while(out.length > max) out = simplify(points, (eps *= 1.5));

  return out;
}

// the total turning along a polyline, in degrees (a full loop is about 360)
export function turning(points) {
  let sum = 0;

  for(let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = [points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]];
    const [bx, by] = [points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]];

    if((ax || ay) && (bx || by)) sum += Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  }

  return (sum * 180) / Math.PI;
}

const extentOf = points => {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);

  return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};

// Classify a stroke made with the clip tool on a photo whose visible outline is
// `outline` (a polygon, or null when it is not known).
//   tap     the stroke barely moved
//   closed  it turns about a full circle and comes back to its start: `polygon`
//   cut     it tends to the outline at both ends: `pieces` (two polygons)
//   none    anything else (the editor shows a hint)
// `tap`, `reach` and `close` are distances in stage units: the tap size, how far
// a stroke end may be from the border and still be extended to it, and how near
// the start the end must come to close the outline.
export function clipFromStroke(points, outline, { tap, reach, close }) {
  if(!Array.isArray(points) || points.length < 2) return { kind: 'tap' };

  const extent = extentOf(points);

  if(extent < tap) return { kind: 'tap' };

  const line = fewer(points, tap * 0.3);
  const [first] = line;
  const last = line[line.length - 1];
  const gap = Math.hypot(last[0] - first[0], last[1] - first[1]);

  if(line.length >= 4 && Math.abs(turning(line)) >= 300 && gap <= Math.max(close, extent * 0.2)) {
    const polygon = line.slice(0, -1);

    if(polygon.length >= 3 && Math.abs(area(polygon)) > tap * tap) return { kind: 'closed', polygon };
  }

  if(outline) {
    const pieces = cutByStroke(outline, line, reach);

    // the pieces share the cut line exactly (it was simplified once, above): simplifying each piece again would leave a hairline gap between them
    if(pieces) return { kind: 'cut', pieces };
  }

  return { kind: 'none' };
}
