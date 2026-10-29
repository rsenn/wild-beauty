// Contact shadows (GALLERY.md): the dark that gathers where a wall meets the
// floor. A strip of soft shadow is laid on the floor along the foot of every
// wall face that has floor in front of it; the wall itself darkens toward its
// base in the material (scene.js `grounded`). No three.js and no DOM here: the
// strips are flat typed arrays like the groups of build.js.

export const CONTACT = {
  reach: 0.7, // metres the shadow reaches onto the floor
  lift: 0.004, // metres above the floor, so it does not fight with it
  probe: 0.12, // metres in front of the wall where there has to be floor
  step: 0.45, // tolerance when the floor there is not the floor at the wall (a drop, a ramp)
  strength: 0.42, // how dark the wall is at its foot (0..1)
  height: 0.5, // metres of wall the darkening goes up, about
};

const WALLS = ['wallN', 'wallE', 'wallS', 'wallW', 'corridorWall'];

// The strips for a build (build.js): { position, uv, index } for the floor
// strips, uv.y going 0 at the wall to 1 at the far edge. A wall face is 4
// vertices, the first two along its foot (build.js `wall`, `cap`).
export function contactStrips(built, { reach = CONTACT.reach, lift = CONTACT.lift, probe = CONTACT.probe, step = CONTACT.step } = {}) {
  const position = [];
  const uv = [];
  const index = [];

  for(const name of WALLS) {
    const { position: p } = built.groups[name];

    for(let q = 0; q + 3 < p.length / 3; q += 4) {
      const [a, b, c] = [0, 1, 2].map(k => [p[(q + k) * 3], p[(q + k) * 3 + 1], p[(q + k) * 3 + 2]]);
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const e = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [d[1] * e[2] - d[2] * e[1], d[2] * e[0] - d[0] * e[2], d[0] * e[1] - d[1] * e[0]]; // faces the viewer
      const flat = Math.hypot(n[0], n[2]);
      const long = Math.hypot(d[0], d[2]);

      if(flat < 1e-9 || long < 0.05 || Math.abs(n[1]) > flat) continue; // a roof or a sliver

      const [nx, nz] = [n[0] / flat, n[2] / flat];
      const foot = (a[1] + b[1]) / 2;
      const at = [(a[0] + b[0]) / 2 + nx * probe, (a[2] + b[2]) / 2 + nz * probe];
      const floor = built.floorHeightAt(at[0], -at[1]);

      if(floor === null || Math.abs(floor - foot) > step) continue; // the face looks into the void

      const first = position.length / 3;
      const out = [nx * reach, nz * reach];

      position.push(a[0], a[1] + lift, a[2], b[0], b[1] + lift, b[2], b[0] + out[0], b[1] + lift, b[2] + out[1], a[0] + out[0], a[1] + lift, a[2] + out[1]);
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      index.push(first, first + 3, first + 2, first, first + 2, first + 1); // faces up
    }
  }

  return { position: new Float32Array(position), uv: new Float32Array(uv), index: new Uint32Array(index) };
}

// the falloff across a strip as alpha data (1 x n, white): dark at the wall, clear at the far edge
export function contactRamp(n = 32) {
  const data = new Uint8Array(n * 4);

  for(let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;

    data.set([255, 255, 255, Math.round(255 * (1 - t) ** 2.2)], i * 4);
  }

  return { data, width: 1, height: n };
}
