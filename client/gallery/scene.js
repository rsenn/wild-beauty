// Gallery scene (GALLERY.md S3.4, S3.5, TODO 13.3): the build and the hung
// pictures as a three.js scene with art lighting and a starfield sky, and the
// renderer around it. three.js is imported only when a gallery is entered, so
// nothing else pays for it.
//
// Coordinates: the build is y up, z = -y_plan (north is -z); pictures come from
// hang.js in plan coordinates.

import { GROUPS } from './build.js';

export const LIGHT = {
  ambient: 0.35, // dim: the walls recede, the pictures are lit
  tone: 0xfff1e0, // the ambient light, warm
  spots: 6, // real spot lights, moved to the nearest pictures
  warm: 0xffe2b8, // about 3 300 K
  intensity: 22,
  reach: 9, // metres a spot reaches
  above: 1.4, // spot height over the picture centre
  front: 1.3, // spot distance in front of the picture
  load: 25, // metres within which a picture's tile is fetched
};

// the canvas: how far it stands off the wall (an inch), its shadow, and the name
// plate below it (metres)
export const DEPTH = 0.04;
export const SHADOW = { opacity: 0.5, spread: 1.5, drop: 0.04 };
export const PLATE = { width: 0.6, height: 0.17, below: 0.2 };

export const SKY = { stars: 2000, seed: 17, radius: 500, tint: '#ffffff', ground: 0x05060d };

export const EYE = 1.6;

const DEFAULT_STYLE = { wall: '#f3efe8', floor: '#cabaab', corridor: '#b9a68f' };

// seeded 0..1 numbers (same sky every time)
function random(seed) {
  let s = seed % 2147483647 || 1;

  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// the soft shadow of a canvas: a white-to-clear falloff (alpha), as data so no
// DOM is needed; coloured black by its material
function shadowTexture(THREE) {
  const n = 32;
  const data = new Uint8Array(n * n * 4);

  for(let y = 0; y < n; y++) {
    for(let x = 0; x < n; x++) {
      const d = Math.max(Math.abs((x + 0.5) / n - 0.5), Math.abs((y + 0.5) / n - 0.5)) * 2; // 0 centre, 1 edge
      const t = Math.min(1, Math.max(0, (d - 0.6) / 0.4));
      const i = (y * n + x) * 4;

      data.set([255, 255, 255, Math.round(255 * (1 - t) ** 2)], i);
    }
  }

  const texture = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);

  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

// the lettering of a name plate on a canvas (browser only): the title in a serif,
// shrunk to fit the plate, then cut with an ellipsis
function drawLabel(text) {
  if(typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const g = canvas.getContext('2d');
  const [w, h] = [512, Math.round((512 * PLATE.height) / PLATE.width)];
  let size = 56;
  let line = text;

  canvas.width = w;
  canvas.height = h;
  g.fillStyle = '#f7f3ea';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#bdb3a3';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, w - 3, h - 3);
  g.fillStyle = '#14110e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  const set = () => (g.font = `bold ${size}px Georgia, 'Times New Roman', serif`);

  for(set(); g.measureText(line).width > w - 40 && size > 28; set()) size -= 2;
  if(g.measureText(line).width > w - 40) {
    while(g.measureText(line + '…').width > w - 40 && line.length > 1) line = line.slice(0, -1);

    line += '…';
  }

  g.fillText(line, w / 2, h / 2 + 2);

  return canvas;
}

// the hue (0..1) of a picture without a tile yet, from its id
function placeholder(id = '') {
  let h = 0;

  for(const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;

  return (h % 360) / 360;
}

// the walls, floors, pictures, lights and stars. `hung` is hang()'s `hung`:
// [{ child: { id }, x, y, nx, ny, h, size }]. Options: `tileUrl(child)` -> url
// or null, `style` (scene3d style). Returns { root, update(position), dispose() }.
export function makeWorld(THREE, built, hung, { tileUrl = () => null, style = {}, anisotropy = 1, loadTexture, label } = {}) {
  const root = new THREE.Group();
  const owned = []; // everything with a dispose()
  const own = x => (owned.push(x), x);
  const colour = (c, fallback) => new THREE.Color(c ?? fallback);
  const load = loadTexture ?? (url => new THREE.TextureLoader().load(url));

  // a surface: its colour, and when the style has a `texture` ({ color, roughness?,
  // tile }, urls and metres per repeat) the maps; uv is in metres, so the repeat
  // is 1 / tile and a longer wall or floor never stretches the texture
  const material = (c, texture) => {
    const m = own(new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 }));

    if(!texture?.color) return m;

    const map = (url, srgb) => {
      const t = own(load(url));
      const tile = texture.tile > 0 ? texture.tile : 1;

      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1 / tile, 1 / tile);
      t.anisotropy = anisotropy;
      if(srgb) t.colorSpace = THREE.SRGBColorSpace;

      return t;
    };

    m.color.set(texture.tint ?? 0xffffff); // a tint multiplies the map
    m.map = map(texture.color, true);

    if(texture.roughness) {
      m.roughnessMap = map(texture.roughness, false);
      m.roughness = 1;
    }

    return m;
  };
  const wall = material(colour(style.wall?.color, DEFAULT_STYLE.wall), style.wall?.texture);
  const room = material(colour(style.floor?.color, DEFAULT_STYLE.floor), style.floor?.texture);
  const materials = {
    wallTop: wall,
    roomFloor: room,
    // a corridor without a texture of its own is floored like the rooms
    corridorFloor: style.corridor?.texture || style.corridor?.color ? material(colour(style.corridor?.color, DEFAULT_STYLE.corridor), style.corridor?.texture) : room,
  };

  for(const g of ['wallN', 'wallE', 'wallS', 'wallW']) materials[g] = wall;

  for(const name of GROUPS) {
    const d = built.groups[name];

    if(!d.index.length) continue;

    const geometry = own(new THREE.BufferGeometry());

    geometry.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
    geometry.setIndex(new THREE.BufferAttribute(d.index, 1));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, materials[name]);

    mesh.name = name;
    root.add(mesh);
  }

  // pictures: a frameless canvas an inch off the wall (a shallow box, the photo
  // on its front, canvas-white sides) with a soft shadow on the wall, and a name
  // plate below when the item has a title. The face is lit by itself so it
  // always reads; the spots add the pools of light on the wall around it.
  const side = own(new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 }));
  const box = own(new THREE.BoxGeometry(1, 1, 1));
  const plane = own(new THREE.PlaneGeometry(1, 1));
  const shadow = own(
    new THREE.MeshBasicMaterial({ map: own(shadowTexture(THREE)), color: 0x000000, opacity: SHADOW.opacity, transparent: true, depthWrite: false }),
  );
  const plateBlank = own(new THREE.MeshBasicMaterial({ color: 0xe9e3d8 }));
  const loader = new THREE.TextureLoader();
  const draw = label ?? drawLabel;
  const pictures = hung.map(p => {
    const group = new THREE.Group();
    const mat = own(new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(placeholder(p.child?.id), 0.3, 0.55) }));
    const face = new THREE.Mesh(box, [side, side, side, side, mat, side]);
    const cast = new THREE.Mesh(plane, shadow);
    const title = p.child?.title;
    const plate = title ? new THREE.Mesh(plane, own(plateBlank.clone())) : null;

    face.scale.set(p.size, p.size, DEPTH);
    face.position.z = DEPTH / 2;
    cast.scale.set(p.size * SHADOW.spread, p.size * SHADOW.spread, 1);
    cast.position.set(0, -SHADOW.drop, 0.002);
    cast.raycast = () => {};
    group.add(cast, face);

    if(plate) {
      plate.scale.set(PLATE.width, PLATE.height, 1);
      plate.position.set(0, -p.size / 2 - PLATE.below, 0.01);
      group.add(plate);
    }

    group.position.set(p.x, p.h, -p.y);
    group.rotation.y = Math.atan2(p.nx, -p.ny);
    group.name = `picture:${p.child?.id ?? ''}`;
    group.userData = { child: p.child, material: mat, face, cast, plate, title, size: p.size, state: 'idle' };
    root.add(group);

    return group;
  });

  // the plate's lettering is drawn when the visitor comes near
  const letter = picture => {
    const { plate, title } = picture.userData;

    if(!plate || !title || picture.userData.lettered) return;

    picture.userData.lettered = true;

    const image = draw(title);

    if(!image) return;

    const texture = own(new THREE.CanvasTexture(image));

    texture.colorSpace = THREE.SRGBColorSpace;
    plate.material.map = texture;
    plate.material.color.set(0xffffff);
    plate.material.needsUpdate = true;
  };

  // a tile is fetched when the visitor comes near (low cost far away)
  const fetch = picture => {
    const url = tileUrl(picture.userData.child);

    picture.userData.state = 'loading';

    if(!url) return;

    loader.load(url, texture => {
      if(picture.userData.state === 'disposed') return texture.dispose();

      texture.colorSpace = THREE.SRGBColorSpace;

      // a photo keeps its proportions inside the square it hangs in; the
      // shadow and the plate follow its edges
      const { width, height } = texture.image ?? {};

      if(width && height) {
        const a = width / height;
        const { size, face, cast, plate } = picture.userData;
        const [w, h] = [size * Math.min(1, a), size * Math.min(1, 1 / a)];

        face.scale.set(w, h, DEPTH);
        cast.scale.set(w * SHADOW.spread, h * SHADOW.spread, 1);
        plate?.position.setY(-h / 2 - PLATE.below);
      }

      picture.userData.material.map = own(texture);
      picture.userData.material.color.set(0xffffff);
      picture.userData.material.needsUpdate = true;
      picture.userData.state = 'loaded';
    });
  };

  // art lighting: a warm spot on each of the nearest pictures, a dim ambient
  const ambient = new THREE.AmbientLight(style.light?.tone ?? LIGHT.tone, style.light?.ambient ?? LIGHT.ambient);
  const spots = Array.from({ length: Math.min(LIGHT.spots, pictures.length) }, () => {
    const spot = new THREE.SpotLight(LIGHT.warm, LIGHT.intensity, LIGHT.reach, 0.6, 0.8, 2);

    root.add(spot, spot.target);

    return spot;
  });

  root.add(ambient);

  // the starfield: points on a sphere that follows the visitor
  const stars = (() => {
    const rnd = random(style.sky?.seed ?? SKY.seed);
    const n = style.sky?.stars ?? SKY.stars;
    const position = new Float32Array(n * 3);

    for(let i = 0; i < n; i++) {
      const z = rnd() * 2 - 1;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);

      position.set([r * Math.cos(a) * SKY.radius, z * SKY.radius, r * Math.sin(a) * SKY.radius], i * 3);
    }

    const geometry = own(new THREE.BufferGeometry());

    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

    const points = new THREE.Points(geometry, own(new THREE.PointsMaterial({ color: style.sky?.tint ?? SKY.tint, size: 1.6, sizeAttenuation: false, fog: false, depthWrite: false })));

    points.frustumCulled = false;
    points.name = 'stars';
    root.add(points);

    return points;
  })();

  const last = new THREE.Vector3(Infinity, 0, 0);
  const lit = new Set(); // spots follow the visitor when they have moved this far
  const MOVED = 0.5;

  // call every frame with the camera position
  function update(position) {
    stars.position.copy(position);

    if(position.distanceTo(last) < MOVED) return;

    last.copy(position);

    const near = pictures.map(p => [p.position.distanceToSquared(position), p]).sort((a, b) => a[0] - b[0]);

    near.slice(0, spots.length).forEach(([, p], i) => {
      const spot = spots[i];
      const n = new THREE.Vector3(0, 0, 1).applyEuler(p.rotation);

      spot.position.copy(p.position).addScaledVector(n, LIGHT.front);
      spot.position.y += LIGHT.above;
      spot.target.position.copy(p.position);
    });

    for(const [d, p] of near) {
      if(d > LIGHT.load * LIGHT.load) break;
      letter(p);
      if(p.userData.state === 'idle') fetch(p);
    }

    lit.clear();
  }

  function dispose() {
    for(const p of pictures) p.userData.state = 'disposed';
    for(const x of owned) x.dispose?.();
    for(const s of spots) s.dispose?.();
  }

  return { root, pictures, spots, stars, update, dispose };
}

// the picture under a point of the view (x, y in -1..1, up positive), or null:
// { child, picture, distance }
export function pick(THREE, camera, world, x = 0, y = 0) {
  const ray = new THREE.Raycaster();

  ray.setFromCamera(new THREE.Vector2(x, y), camera);

  const [hit] = ray.intersectObjects(world.pictures, true);

  if(!hit) return null;

  let o = hit.object;

  while(o && !o.userData.child) o = o.parent;

  return o ? { child: o.userData.child, picture: o, distance: hit.distance } : null;
}

// the camera pose of a start { x, y, look, h }: eye height over the floor, look
// in degrees (0 north, 90 east)
export function startPose(start) {
  return { x: start.x, y: start.h + EYE, z: -start.y, yaw: (-start.look * Math.PI) / 180 };
}

// the live canvas: renders a world on `canvas` until disposed. three.js is
// imported here, on demand. Returns { world, camera, renderer, resize, dispose }.
export async function enterScene(canvas, built, hung, options = {}) {
  const THREE = await import('../../vendor/three/three.module.js');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 1000);
  const world = makeWorld(THREE, built, hung, { anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()), ...options });
  const pose = startPose(built.start);

  scene.background = new THREE.Color(SKY.ground);
  scene.add(world.root);
  camera.position.set(pose.x, pose.y, pose.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = pose.yaw;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  let before = null;
  const tick = time => {
    const dt = before === null ? 0 : (time - before) / 1000;

    before = time;
    options.onFrame?.(time, dt, camera);
    world.update(camera.position);
    renderer.render(scene, camera);
  };

  observer?.observe(canvas);
  resize();
  renderer.setAnimationLoop(tick);

  const lost = e => e.preventDefault();

  canvas.addEventListener('webglcontextlost', lost);

  return {
    THREE,
    world,
    camera,
    renderer,
    resize,
    pick: (x, y) => pick(THREE, camera, world, x, y),
    dispose() {
      renderer.setAnimationLoop(null);
      observer?.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      world.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
