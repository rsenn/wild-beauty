// 2D affine matrices as [a, b, c, d, e, f], the layout of SVG
// matrix(a b c d e f): x' = a*x + c*y + e, y' = b*x + d*y + f.
export const identity = () => [1, 0, 0, 1, 0, 0];

// the matrix that applies `n` first, then `m`
export const multiply = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

// null when the matrix is singular
export function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2];

  if(!det || !Number.isFinite(det)) return null;

  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}

// the point [x, y] mapped by `m`
export const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// scale and rotation (radians) about the origin, then translation
export function fromSimilarity({ scale = 1, rotation = 0, tx = 0, ty = 0 }) {
  const a = scale * Math.cos(rotation);
  const b = scale * Math.sin(rotation);

  return [a, b, -b, a, tx, ty];
}

// the inverse of fromSimilarity for a matrix without shear or mirroring
export const decompose = m => ({ scale: Math.hypot(m[0], m[1]), rotation: Math.atan2(m[1], m[0]), tx: m[4], ty: m[5] });

// the matrix a fraction `t` of the way from `a` to `b`. Two similarities (what
// gestures make) move smoothly: scale and translation linearly, rotation along
// the shorter arc. Anything else is blended component by component.
export function lerpMatrix(a, b, t) {
  const similar = m => Math.abs(m[0] - m[3]) < 1e-9 && Math.abs(m[1] + m[2]) < 1e-9;

  if(!similar(a) || !similar(b)) return a.map((v, i) => v + (b[i] - v) * t);

  const [p, q] = [decompose(a), decompose(b)];
  let turn = q.rotation - p.rotation;

  turn -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI;

  return fromSimilarity({ scale: p.scale + (q.scale - p.scale) * t, rotation: p.rotation + turn * t, tx: p.tx + (q.tx - p.tx) * t, ty: p.ty + (q.ty - p.ty) * t }).map(v => v + 0); // no -0
}
