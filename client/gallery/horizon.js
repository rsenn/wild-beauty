// The sky beyond the stars (GALLERY.md): a moon, and a sea of clouds far below
// the bridges, so the building stands over something. Shader-only objects, no
// textures; both follow the visitor like the stars do, the clouds keep their
// place in the world (their noise is sampled at world coordinates), so walking
// across a bridge moves them past below.

export const MOON = {
  azimuth: 38, // degrees from north toward east
  elevation: 34, // degrees over the horizon
  radius: 460, // metres from the visitor: inside the stars' sphere
  size: 4.2, // degrees across the disc
  light: 0x9db2ff, // the cool key light it throws, and how strong
  intensity: 0.32,
  tint: 0xf4efe2,
  glow: 0x7f95d8,
  turn: 0.004, // radians a second, as the stars
};

export const CLOUDS = {
  layers: [
    { height: -9, scale: 0.016, wind: [0.0035, 0.0012], cover: 0.46, opacity: 0.92, shade: 1 },
    { height: -17, scale: 0.011, wind: [-0.002, 0.0018], cover: 0.4, opacity: 0.95, shade: 0.7 },
  ],
  size: 1800, // metres across a layer
  near: 120, // metres from the visitor where a layer starts to thin out ...
  far: 420, // ... and where it is gone
  low: 0x172044, // the shaded side
  high: 0xb4c2ea, // the side the moon lights
  octaves: 4,
  coarse: 3,
};

// the direction of the moon as a unit vector (y up, north is -z)
export function moonDirection(THREE, { azimuth = MOON.azimuth, elevation = MOON.elevation } = {}) {
  const [a, e] = [(azimuth * Math.PI) / 180, (elevation * Math.PI) / 180];

  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

// -> { group, light, direction, update(position, time), dispose() }
export function makeMoon(THREE, options = {}) {
  const direction = moonDirection(THREE, options);
  const radius = options.radius ?? MOON.radius;
  const size = options.size ?? MOON.size;
  const half = radius * Math.tan(((size / 2) * Math.PI) / 180);
  const reach = 3.6; // the quad is this many disc radii across (half of it is glow)
  const geometry = new THREE.PlaneGeometry(half * 2 * reach, half * 2 * reach);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTint: { value: new THREE.Color(MOON.tint) }, uGlow: { value: new THREE.Color(MOON.glow) }, uReach: { value: reach } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec3 uTint; uniform vec3 uGlow; uniform float uReach; varying vec2 vUv;
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main() {
        vec2 p = (vUv - 0.5) * uReach; // the disc has radius 1 here
        float r = length(p);
        float disc = 1.0 - smoothstep(0.96, 1.0, r);
        // a sphere lit from the side: a gibbous moon, the dark limb a little lit by the sky
        vec3 n = vec3(p, sqrt(max(0.0, 1.0 - r * r)));
        float lit = clamp(dot(n, normalize(vec3(0.55, 0.25, 0.8))) * 1.5 + 0.2, 0.06, 1.0);
        // the maria and a few craters, from noise
        float maria = noise(p * 2.2 + 3.0) * 0.6 + noise(p * 5.0) * 0.3 + noise(p * 11.0) * 0.1;
        float surface = 0.72 + 0.4 * smoothstep(0.35, 0.7, maria);
        float rim = 1.0 - 0.18 * smoothstep(0.7, 1.0, r);
        vec3 col = uTint * surface * lit * rim;
        // the halo: a bright inner ring and a long faint tail
        float halo = 0.55 * exp(-max(r - 1.0, 0.0) * 2.6) + 0.25 * exp(-max(r - 1.0, 0.0) * 0.7);
        vec3 outer = uGlow * halo * (1.0 - disc);
        gl_FragColor = vec4(col * disc + outer, clamp(disc + halo * 0.8, 0.0, 1.0));
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.copy(direction).multiplyScalar(radius);
  mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(), mesh.position, new THREE.Vector3(0, 1, 0))); // faces the visitor
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.name = 'moon';
  mesh.raycast = () => {};

  const group = new THREE.Group();
  const light = new THREE.DirectionalLight(options.light ?? MOON.light, options.intensity ?? MOON.intensity);

  group.name = 'moonSky';
  group.add(mesh);
  light.name = 'moonlight';
  light.position.copy(direction).multiplyScalar(40);

  return {
    group,
    mesh,
    light,
    direction,

    // follow the visitor, turn with the stars
    update(position, time = 0) {
      group.position.copy(position);
      group.rotation.y = time * (options.turn ?? MOON.turn);
      light.position.copy(direction).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y).multiplyScalar(40);
    },

    dispose() {
      geometry.dispose();
      material.dispose();
      light.dispose?.();
    },
  };
}

// -> { layers: [Mesh], update(position, time), dispose() }
export function makeClouds(THREE, { layers = CLOUDS.layers, coarse = false, direction = moonDirection(THREE) } = {}) {
  const geometry = new THREE.PlaneGeometry(CLOUDS.size, CLOUDS.size);
  const octaves = coarse ? CLOUDS.coarse : CLOUDS.octaves;
  const materials = [];

  geometry.rotateX(-Math.PI / 2);

  const meshes = layers.map((l, k) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCamera: { value: new THREE.Vector2() },
        uScale: { value: l.scale },
        uWind: { value: new THREE.Vector2(...l.wind) },
        uCover: { value: l.cover },
        uOpacity: { value: l.opacity },
        uShade: { value: l.shade },
        uOffset: { value: new THREE.Vector2(k * 311.7, k * 97.3) },
        uMoon: { value: new THREE.Vector2(direction.x, direction.z).normalize() },
        uLow: { value: new THREE.Color(CLOUDS.low) },
        uHigh: { value: new THREE.Color(CLOUDS.high) },
        uNear: { value: CLOUDS.near },
        uFar: { value: CLOUDS.far },
      },
      defines: { OCTAVES: octaves },
      vertexShader: 'varying vec2 vWorld; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `
        uniform float uTime; uniform vec2 uCamera; uniform float uScale; uniform vec2 uWind; uniform float uCover; uniform float uOpacity; uniform float uShade;
        uniform vec2 uOffset; uniform vec2 uMoon; uniform vec3 uLow; uniform vec3 uHigh; uniform float uNear; uniform float uFar;
        varying vec2 vWorld;
        float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
        float fbm(vec2 p) { float s = 0.0; float a = 0.5; for(int i = 0; i < OCTAVES; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
        void main() {
          vec2 p = vWorld * uScale + uOffset + uWind * uTime;
          float d = fbm(p);
          float body = smoothstep(uCover, uCover + 0.26, d);
          // lit from the moon's side: thicker toward the moon is the shaded side, thinner the lit edge
          float toward = fbm(p + uMoon * 0.12);
          float lit = clamp(0.55 + (d - toward) * 4.5, 0.0, 1.0);
          vec3 col = mix(uLow, uHigh, lit * (0.45 + 0.55 * body)) * uShade;
          float far = 1.0 - smoothstep(uNear, uFar, distance(vWorld, uCamera));
          gl_FragColor = vec4(col, body * far * uOpacity);
        }`,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.y = l.height;
    mesh.frustumCulled = false;
    mesh.name = `clouds${k}`;
    mesh.raycast = () => {};
    materials.push(material);

    return mesh;
  });

  return {
    layers: meshes,
    materials,

    // the layers follow the visitor over the plan, their noise stays in the world
    update(position, time = 0) {
      for(const m of meshes) {
        m.position.x = position.x;
        m.position.z = position.z;
        m.material.uniforms.uTime.value = time;
        m.material.uniforms.uCamera.value.set(position.x, position.z);
      }
    },

    dispose() {
      geometry.dispose();
      for(const m of materials) m.dispose();
    },
  };
}
