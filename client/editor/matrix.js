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
