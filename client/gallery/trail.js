// Footprints (GALLERY.md): the visitor leaves faint prints on the floor, so the
// rooms show where they have been and which pictures they walked past. One
// InstancedMesh used as a ring: the oldest print is overwritten when there are
// too many. A print points the way the visitor moves, except when they walk
// backwards: then it points the way they look, which is a moonwalk.

export const TRAIL = {
  stride: 0.66, // metres between two prints (left, right, left ...)
  gap: 0.12, // metres from the line of walking to a foot
  length: 0.34, // metres, a print
  width: 0.15,
  max: 480, // prints kept
  jump: 3, // metres: a step further than this is a jump (a tour move, a snap), not walking
  backward: -0.35, // dot of the move and the look under which the visitor walks backwards
  eye: 2.5, // metres of the camera over the floor above which nobody leaves prints (the bird's-eye view)
  alpha: 0.34,
  fade: 900, // seconds until a print is at its faintest
  faint: 0.35, // ... a share of its first strength
  colour: 0x2d2118,
};

// a shoe print as alpha data (n wide, 2n long, toe at the top): a sole and a heel
export function printTexture(n = 32) {
  const [w, h] = [n, n * 2];
  const data = new Uint8Array(w * h * 4);
  const blob = (x, y, cx, cy, rx, ry) => 1 - Math.min(1, Math.hypot((x - cx) / rx, (y - cy) / ry));

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const [u, v] = [(x + 0.5) / w, (y + 0.5) / h]; // v 0 at the heel, 1 at the toe
      const sole = blob(u, v, 0.5 + 0.06 * (v - 0.5), 0.7, 0.4, 0.27);
      const heel = blob(u, v, 0.5, 0.2, 0.3, 0.17);
      const a = Math.max(0, Math.max(sole, heel));

      data.set([255, 255, 255, Math.round(255 * Math.min(1, a * 3))], (y * w + x) * 4);
    }
  }

  return { data, width: w, height: h };
}

// -> { mesh, step(position, forward, time), count(), clear(), dispose() }
// `floorAt(x, z)` is the height of the floor under a point of the scene, or null
export function makeTrail(THREE, floorAt, { max = TRAIL.max } = {}) {
  const geometry = new THREE.PlaneGeometry(TRAIL.width, TRAIL.length);
  const { data, width, height } = printTexture();
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);

  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.flipY = false;
  texture.needsUpdate = true;

  const born = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);

  geometry.setAttribute('aBorn', born);

  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uTime: { value: 0 }, uColor: { value: new THREE.Color(TRAIL.colour) }, uAlpha: { value: TRAIL.alpha }, uFade: { value: TRAIL.fade }, uFaint: { value: TRAIL.faint } },
    vertexShader: `
      attribute float aBorn; uniform float uTime; uniform float uFade; uniform float uFaint;
      varying vec2 vUv; varying float vAge;
      void main() {
        vUv = uv;
        vAge = mix(1.0, uFaint, smoothstep(0.0, uFade, uTime - aBorn));
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform vec3 uColor; uniform float uAlpha; varying vec2 vUv; varying float vAge;
      void main() { gl_FragColor = vec4(uColor, texture2D(uMap, vUv).a * uAlpha * vAge); }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide, // the left foot is the right one mirrored
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, max);

  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.name = 'footprints';
  mesh.raycast = () => {};

  let next = 0; // the slot the next print goes to
  let made = 0;
  let side = 1; // 1 right, -1 left
  let last = null; // where the last print was laid: [x, z]

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const turn = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const place = new THREE.Vector3();
  const scale = new THREE.Vector3();

  // lay a print at (x, z) with its toe along (dx, dz), on the floor at height y
  const stamp = (x, y, z, dx, dz, time) => {
    const long = Math.hypot(dx, dz) || 1;
    const [tx, tz] = [dx / long, dz / long];

    // the plane lies flat with its top (the toe) toward -z, turned round y to the toe's direction
    turn.setFromAxisAngle(up, Math.atan2(-tx, -tz));
    quaternion.multiplyQuaternions(turn, flat);
    place.set(x + -tz * side * TRAIL.gap, y + 0.006, z + tx * side * TRAIL.gap);
    scale.set(side, 1, 1); // mirrored for the left foot
    matrix.compose(place, quaternion, scale);
    mesh.setMatrixAt(next, matrix);
    born.setX(next, time);
    born.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;

    next = (next + 1) % max;
    made = Math.min(max, made + 1);
    mesh.count = made;
    side = -side;
  };

  const api = {
    mesh,
    material,
    paused: false, // set while the camera is not a visitor walking

    // `position` the camera, `forward` where it looks (any length); lays a print each stride walked
    step(position, forward, time = 0) {
      material.uniforms.uTime.value = time;

      if(api.paused) {
        last = null;

        return;
      }

      const floor = floorAt(position.x, position.z);

      if(floor === null || position.y - floor > TRAIL.eye) {
        last = null; // in the air over the plan, or out of the gallery: nobody is walking

        return;
      }

      if(!last) {
        last = [position.x, position.z];

        return;
      }

      const [mx, mz] = [position.x - last[0], position.z - last[1]];
      const moved = Math.hypot(mx, mz);

      if(moved > TRAIL.jump) {
        last = [position.x, position.z];

        return;
      }

      if(moved < TRAIL.stride) return;

      const look = Math.hypot(forward.x, forward.z) || 1;
      const ahead = (mx * forward.x + mz * forward.z) / (moved * look);
      const toe = ahead < TRAIL.backward ? [forward.x / look, forward.z / look] : [mx / moved, mz / moved]; // walking backwards: the toes lead the wrong way

      stamp(position.x, floor, position.z, toe[0], toe[1], time);

      // the next stride counts from a stride on the way, so a frame that overshoots does not stretch it
      last = moved < 2 * TRAIL.stride ? [last[0] + (mx / moved) * TRAIL.stride, last[1] + (mz / moved) * TRAIL.stride] : [position.x, position.z];
    },

    count: () => made,

    clear() {
      next = made = 0;
      mesh.count = 0;
      last = null;
    },

    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
      mesh.dispose?.();
    },
  };

  return api;
}
