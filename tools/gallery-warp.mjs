// Quad -> square warp benchmark (GALLERY.md S3.3): a texture region is an arbitrary
// convex 4-point polygon over the source image, resampled into an N x N tile by a
// projective (homography) inverse map with bilinear sampling. CPU only.
// Run: bun tools/gallery-warp.mjs
// unit square (u,v) -> quad p0..p3 (tl,tr,br,bl): projective map coefficients
function homography(p) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det, h = (dx1 * dy3 - dx3 * dy1) / det;
  return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h };
}
function convex(p) {
  let s = 0;
  for(let i = 0; i < 4; i++) {
    const [ax, ay] = p[i], [bx, by] = p[(i + 1) % 4], [cx, cy] = p[(i + 2) % 4];
    const z = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if(z === 0) return false;
    if(s && Math.sign(z) !== s) return false;
    s = Math.sign(z);
  }
  return true;
}
function warp(src, sw, sh, quad, n) {
  const H = homography(quad.map(([x, y]) => [x * sw, y * sh])), out = new Uint8ClampedArray(n * n * 4);
  for(let j = 0; j < n; j++)
    for(let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, v = (j + 0.5) / n, w = H.g * u + H.h * v + 1;
      const x = (H.a * u + H.b * v + H.c) / w - 0.5, y = (H.d * u + H.e * v + H.f) / w - 0.5;
      const x0 = Math.max(0, Math.min(sw - 2, Math.floor(x))), y0 = Math.max(0, Math.min(sh - 2, Math.floor(y)));
      const fx = Math.min(1, Math.max(0, x - x0)), fy = Math.min(1, Math.max(0, y - y0));
      const o = (j * n + i) * 4;
      for(let c = 0; c < 4; c++) {
        const p = (y0 * sw + x0) * 4 + c;
        out[o + c] = (src[p] * (1 - fx) + src[p + 4] * fx) * (1 - fy) + (src[p + sw * 4] * (1 - fx) + src[p + sw * 4 + 4] * fx) * fy;
      }
    }
  return out;
}
const sw = 2048, sh = 2048, src = new Uint8ClampedArray(sw * sh * 4).map((_, i) => (i * 31) & 255);
const grid = [0, 1, 2, 3, 4, 5].map(k => { const x = (k % 3) / 3, y = Math.floor(k / 3) / 2; return [[x, y], [x + 1 / 3, y], [x + 1 / 3, y + 0.5], [x, y + 0.5]]; });
const skew = grid.map(q => q.map(([x, y], i) => [x + (i % 2 ? -0.01 : 0.01), y + (i < 2 ? 0.01 : -0.01)]));
console.log('convex:', skew.every(convex), 'bowtie rejected:', !convex([[0, 0], [1, 1], [1, 0], [0, 1]]));
for(const n of [256, 512, 1024]) {
  warp(src, sw, sh, skew[0], n); // warm-up
  const t = performance.now(); for(const q of skew) warp(src, sw, sh, q, n);
  console.log(`6 regions -> ${n}x${n}: ${(performance.now() - t).toFixed(0)} ms (CPU, bilinear)`);
}
