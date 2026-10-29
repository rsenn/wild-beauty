// Polyline maths for the 3D gallery builder (GALLERY.md S3). Plan coordinates
// are metres, x east and y north; a polyline is [[x, y], ...]. Pure functions.

// signed area (positive for a counter-clockwise polygon)
export function signedArea(pts) {
  let sum = 0;

  for(let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];

    sum += x1 * y2 - x2 * y1;
  }

  return sum / 2;
}

// the points without consecutive duplicates (and, when closed, without a
// repeated first point at the end)
export function clean(pts, closed = false) {
  const out = [];

  for(const p of pts) {
    const last = out[out.length - 1];

    if(!last || last[0] !== p[0] || last[1] !== p[1]) out.push([p[0], p[1]]);
  }

  if(closed && out.length > 1) {
    const [a, b] = [out[0], out[out.length - 1]];

    if(a[0] === b[0] && a[1] === b[1]) out.pop();
  }

  return out;
}

// the unit vector pointing left of the direction a -> b
export function leftNormal(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;

  return [-dy / len, dx / len];
}

// cumulative distance along the polyline, one entry per point; for a closed
// polyline one more entry for the closing segment
export function distances(pts, closed = false) {
  const out = [0];
  const n = closed ? pts.length : pts.length - 1;

  for(let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];

    out.push(out[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }

  return out;
}

// the shortest a mitre may shrink: 1 + cos of the turn; 0.25 caps the tip of a
// joint at four half-widths (a 90 degree corner needs 0.71)
const MITRE_MIN = 0.25;

// the polyline moved sideways by d (positive to the left), joints mitred
export function offsetLine(pts, d, closed = false) {
  const n = pts.length;

  return pts.map((p, i) => {
    const prev = closed ? pts[(i + n - 1) % n] : pts[i - 1];
    const next = closed ? pts[(i + 1) % n] : pts[i + 1];

    if(!prev) {
      const [x, y] = leftNormal(p, next);

      return [p[0] + d * x, p[1] + d * y];
    }

    if(!next) {
      const [x, y] = leftNormal(prev, p);

      return [p[0] + d * x, p[1] + d * y];
    }

    const a = leftNormal(prev, p);
    const b = leftNormal(p, next);
    const k = Math.max(1 + a[0] * b[0] + a[1] * b[1], MITRE_MIN);

    return [p[0] + (d * (a[0] + b[0])) / k, p[1] + (d * (a[1] + b[1])) / k];
  });
}
