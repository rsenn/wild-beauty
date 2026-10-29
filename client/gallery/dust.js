// Dust in the spot lights (GALLERY.md): a few hundred motes that drift in the
// cone of each spot and catch the light now and then. One Points object, the
// motes placed by the vertex shader from the spots' positions, so a spot that
// moves to another picture costs a few uniforms and no new geometry.

export const DUST = {
  count: 420, // motes in all, shared out between the spots
  coarse: 140, // on a phone
  size: 3.4, // pixels at 4 m
  angle: 0.6, // the half angle of the cone (as the spot light's)
  sway: 0.14, // metres the motes wander
  fade: 0.9, // seconds a spot's dust takes to appear once it has moved to a new picture
  glow: 0xffe2b8,
  alpha: 0.85,
};

// seeded 0..1 numbers, so the motes lie the same every time
function random(seed) {
  let s = seed % 2147483647 || 1;

  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// -> { points, place(i, from, to, time), tick(time), dispose() } or null without spots
export function makeDust(THREE, { spots = 6, count = DUST.count, pixelRatio = 1, seed = 31 } = {}) {
  if(spots < 1 || count < 1) return null;

  const rnd = random(seed);
  const seeds = new Float32Array(count * 4);
  const which = new Float32Array(count);

  for(let i = 0; i < count; i++) {
    // x: the turn round the beam, y: the radius (sqrt, even over the disc), z: how far along, w: its own rhythm
    seeds.set([rnd(), rnd(), 0.05 + 0.92 * rnd(), rnd()], i * 4);
    which[i] = i % spots;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); // unused: the shader places them
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  geometry.setAttribute('aSpot', new THREE.BufferAttribute(which, 1));

  const vectors = () => Array.from({ length: spots }, () => new THREE.Vector3());
  const uniforms = {
    uTime: { value: 0 },
    uScale: { value: pixelRatio },
    uSize: { value: DUST.size },
    uTan: { value: Math.tan(DUST.angle) },
    uSway: { value: DUST.sway },
    uFade: { value: DUST.fade },
    uAlpha: { value: DUST.alpha },
    uColor: { value: new THREE.Color(DUST.glow) },
    uPos: { value: vectors() },
    uAxis: { value: vectors() }, // from the spot to what it lights
    uBorn: { value: new Array(spots).fill(-1e3) },
    uOn: { value: new Array(spots).fill(0) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    defines: { SPOTS: spots },
    vertexShader: `
      uniform float uTime; uniform float uScale; uniform float uSize; uniform float uTan; uniform float uSway; uniform float uFade; uniform float uAlpha;
      uniform vec3 uPos[SPOTS]; uniform vec3 uAxis[SPOTS]; uniform float uBorn[SPOTS]; uniform float uOn[SPOTS];
      attribute vec4 aSeed; attribute float aSpot;
      varying float vAlpha;
      void main() {
        int k = int(aSpot + 0.5);
        vec3 axis = uAxis[k];
        float len = max(length(axis), 0.001);
        vec3 dir = axis / len;
        vec3 helper = abs(dir.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 s = normalize(cross(dir, helper));
        vec3 u = cross(s, dir);
        float along = aSeed.z * len;
        float turn = aSeed.x * 6.2831853;
        float r = sqrt(aSeed.y) * uTan * along * 0.92;
        // slow wandering, each mote at its own rate; a little more up than down
        float t = uTime;
        vec3 sway = vec3(sin(t * 0.31 + aSeed.x * 40.0), 0.7 * sin(t * 0.23 + aSeed.y * 37.0) + 0.15, cos(t * 0.27 + aSeed.w * 29.0)) * uSway;
        vec3 p = uPos[k] + dir * along + (s * cos(turn) + u * sin(turn)) * r + sway;
        // inside the cone when it has wandered? the edge fades
        vec3 v = p - uPos[k];
        float a = dot(v, dir);
        float rad = length(v - dir * a) / max(a * uTan, 0.001);
        float inside = 1.0 - smoothstep(0.75, 1.0, rad);
        // catches the light now and then, a mote turning in the beam
        float glint = pow(0.5 + 0.5 * sin(t * (0.9 + aSeed.w * 1.8) + aSeed.w * 60.0), 3.0);
        float born = smoothstep(0.0, uFade, t - uBorn[k]);
        float ends = smoothstep(0.0, 0.18, a / len) * (1.0 - smoothstep(0.88, 1.0, a / len));
        vAlpha = uAlpha * uOn[k] * born * inside * ends * (0.18 + 0.82 * glint);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uScale * clamp(4.0 / max(-mv.z, 0.1), 0.4, 3.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = 1.0 - smoothstep(0.0, 1.0, d);
        gl_FragColor = vec4(uColor, a * a * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);

  points.frustumCulled = false;
  points.name = 'dust';
  points.raycast = () => {};

  const target = Array.from({ length: spots }, () => new THREE.Vector3(Infinity, 0, 0));

  return {
    points,
    material,
    uniforms,

    // spot i now stands at `from` and lights `to`; its dust fades in when it moved to another picture
    place(i, from, to, time = 0) {
      if(i < 0 || i >= spots) return;

      uniforms.uPos.value[i].copy(from);
      uniforms.uAxis.value[i].copy(to).sub(from);
      uniforms.uOn.value[i] = 1;

      if(target[i].distanceToSquared(to) > 1e-4) uniforms.uBorn.value[i] = time;

      target[i].copy(to);
    },

    // spot i is not used
    clear(i) {
      if(i >= 0 && i < spots) uniforms.uOn.value[i] = 0;
    },

    tick(time) {
      uniforms.uTime.value = time;
    },

    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
