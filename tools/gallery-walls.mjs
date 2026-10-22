// Gallery geometry benchmark (GALLERY.md S3.2): polylines -> wall mesh, floor,
// circle-vs-segments collision. CPU only, no GPU.
// Run: bun tools/gallery-walls.mjs   (needs three@0.186.1; not vendored, Bun
// auto-installs it when the project has no node_modules)

import * as THREE from 'three@0.186.1';
// polyline -> wall ribbon (thickness t, height h): quad strip per segment, mitre-free (overlap at joints)
function wallGeometry(polys, t = 0.2, h = 3) {
  const pos = [], uv = [], idx = [];
  let v = 0;
  for(const pl of polys) {
    let u = 0;
    for(let i = 0; i + 1 < pl.length; i++) {
      const [x0, z0] = pl[i], [x1, z1] = pl[i + 1];
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) || 1;
      const nx = (-dz / len) * t / 2, nz = (dx / len) * t / 2;
      // 4 side faces + top of a box along the segment
      const c = [[x0 + nx, z0 + nz], [x1 + nx, z1 + nz], [x1 - nx, z1 - nz], [x0 - nx, z0 - nz]];
      for(let k = 0; k < 4; k++) {
        const a = c[k], b = c[(k + 1) % 4];
        pos.push(a[0], 0, a[1], b[0], 0, b[1], b[0], h, b[1], a[0], h, a[1]);
        uv.push(u, 0, u + len, 0, u + len, h, u, h);
        idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
      }
      u += len;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// floor from a closed outline with ShapeGeometry (earcut)
function floorGeometry(outline) {
  const s = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); return g;
}
// 2D circle vs segments collision (the player), push-out
function collide(px, pz, r, segs) {
  for(const [x0, z0, x1, z1, half] of segs) {
    const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1;
    let t = ((px - x0) * dx + (pz - z0) * dz) / l2; t = Math.max(0, Math.min(1, t));
    const cx = x0 + t * dx, cz = z0 + t * dz, ex = px - cx, ez = pz - cz, d = Math.hypot(ex, ez), m = r + half;
    if(d < m && d > 0) { px = cx + ex / d * m; pz = cz + ez / d * m; }
  }
  return [px, pz];
}
const R = (n) => { let s = n; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const rnd = R(7);
function make(nPoly, nPts) {
  const polys = [];
  for(let i = 0; i < nPoly; i++) { let x = rnd() * 100, z = rnd() * 100; const p = [[x, z]]; for(let k = 1; k < nPts; k++) { x += rnd() * 6 - 3; z += rnd() * 6 - 3; p.push([x, z]); } polys.push(p); }
  return polys;
}
const T = (f) => { const a = performance.now(); const r = f(); return [performance.now() - a, r]; };
for(const [np, nk] of [[10, 10], [50, 20], [200, 50]]) {
  const polys = make(np, nk);
  const [ms, g] = T(() => wallGeometry(polys));
  const segs = polys.flatMap(p => p.slice(1).map((q, i) => [p[i][0], p[i][1], q[0], q[1], 0.1]));
  const [mc] = T(() => { let x = 50, z = 50; for(let i = 0; i < 1000; i++) [x, z] = collide(x + 0.01, z, 0.3, segs); });
  console.log(`${np} polylines x ${nk} pts: ${segs.length} segments, walls ${ms.toFixed(1)} ms, ${g.index.count / 3} tris, ${(g.attributes.position.array.byteLength + g.attributes.uv.array.byteLength + g.index.array.byteLength) / 1024 | 0} KB; collision ${(mc / 1000).toFixed(4)} ms/frame (all ${segs.length} segs, no grid)`);
}
const [mf, fg] = T(() => floorGeometry(Array.from({ length: 200 }, (_, i) => [50 + 40 * Math.cos(i / 200 * 6.283) * (1 + 0.3 * Math.sin(i / 7)), 50 + 40 * Math.sin(i / 200 * 6.283)])));
console.log(`floor from 200-point outline: ${mf.toFixed(1)} ms, ${fg.index.count / 3} tris`);
