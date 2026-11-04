// Pointer gestures as matrices (EDITOR.md S9, E2). The result is composed
// onto the matrix the selection had when the gesture began, so it does not
// drift: multiply(solveSimilarity(...), startMatrix).
// the similarity (scale, rotation, translation) that maps the start points
// p0 and q0 onto the current points p1 and q1. With a single pointer (q0 or
// q1 missing) or two coincident start points it is a pure translation of p0
// to p1.
export function solveSimilarity(p0, q0, p1, q1) {
  const dx0 = q0 && q1 ? q0[0] - p0[0] : 0;
  const dy0 = q0 && q1 ? q0[1] - p0[1] : 0;
  const len = dx0 * dx0 + dy0 * dy0;

  if(!len) return [1, 0, 0, 1, p1[0] - p0[0], p1[1] - p0[1]];

  // complex division (q1 - p1) / (q0 - p0) gives scale and rotation as a, b
  const dx1 = q1[0] - p1[0];
  const dy1 = q1[1] - p1[1];
  const a = (dx1 * dx0 + dy1 * dy0) / len;
  const b = (dy1 * dx0 - dx1 * dy0) / len;

  return [a, b, -b, a, p1[0] - (a * p0[0] - b * p0[1]), p1[1] - (b * p0[0] + a * p0[1])];
}

// scale by `scale` and turn by `rotation` (radians) about the point p: the
// similarity for a wheel turn or a key press
export function aboutPoint(scale, rotation, p) {
  const a = scale * Math.cos(rotation);
  const b = scale * Math.sin(rotation);

  return [a, b, -b, a, p[0] - (a * p[0] - b * p[1]), p[1] - (b * p[0] + a * p[1])];
}
