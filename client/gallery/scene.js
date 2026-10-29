// Gallery scene (GALLERY.md S3.4, S3.5, TODO 13.3): the build and the hung
// pictures as a three.js scene with art lighting and a starfield sky, and the
// renderer around it. three.js is imported only when a gallery is entered, so
// nothing else pays for it.
//
// Coordinates: the build is y up, z = -y_plan (north is -z); pictures come from
// hang.js in plan coordinates.

import { GROUPS } from './build.js';
import { CONTACT, contactRamp, contactStrips } from './contact.js';
import { makeDust, DUST } from './dust.js';
import { makeClouds, makeMoon } from './horizon.js';
import { makeTrail } from './trail.js';

export const LIGHT = {
  ambient: 0.35, // dim: the walls recede, the pictures are lit
  tone: 0xfff1e0, // the ambient light, warm
  spots: 6, // real spot lights, moved to the nearest pictures
  warm: 0xffe2b8, // about 3 300 K
  intensity: 22,
  reach: 9, // metres a spot reaches
  above: 1.4, // spot height over the picture centre
  front: 1.3, // spot distance in front of the picture
  load: 80, // metres within which a picture's tile is fetched, nearest first
  parallel: 3, // tiles fetched at once: the nearest are not queued behind far ones
};

// the canvas: how far it stands off the wall (an inch), its shadow, and the name
// plate below it (metres)
export const DEPTH = 0.04;
export const SHADOW = { opacity: 0.5, spread: 1.5, drop: 0.04 };
export const PLATE = { width: 0.6, height: 0.17, below: 0.2 };

export const SKY = {
  stars: 2000,
  seed: 17,
  radius: 500,
  tint: '#ffffff',
  ground: 0x05060d,
  band: 0.4, // share of the stars in the Milky Way band
  glow: 50, // big faint points that make the band glow
  twinkle: 0.35, // how much a dim star flickers (atmospheric scintillation)
  zenith: 0x02030a, // the sky overhead, and at the horizon a faint lift
  horizon: 0x161a2c,
};

export const EYE = 1.6;

// a phone or a tablet: fewer motes, simpler clouds
const isCoarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

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
export function makeWorld(THREE, built, hung, { tileUrl = () => null, style = {}, anisotropy = 1, loadTexture, loadImage, label, pixelRatio = 1, coarse = isCoarse() } = {}) {
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

  // the faces of the walls darken toward their foot (uv.y is the height over the base in
  // metres); the top of a wall keeps the plain material
  const foot = style.contact === false ? 0 : CONTACT.strength;
  const grounded = m => {
    if(!foot) return m;

    m.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vFoot;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFoot = uv.y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vFoot;')
        .replace('#include <map_fragment>', `#include <map_fragment>\ndiffuseColor.rgb *= 1.0 - ${foot.toFixed(3)} * exp(-vFoot / ${(CONTACT.height / 2).toFixed(3)});`);
    };
    m.customProgramCacheKey = () => 'wb-foot';

    return m;
  };
  const faces = grounded(own(wall.clone()));

  for(const g of ['wallN', 'wallE', 'wallS', 'wallW']) materials[g] = faces;

  // a corridor without a surface for its walls has the walls of the rooms
  const rough = style.corridorWall?.texture || style.corridorWall?.color ? material(colour(style.corridorWall?.color, DEFAULT_STYLE.wall), style.corridorWall?.texture) : null;

  materials.corridorWall = rough ? grounded(own(rough.clone())) : faces;
  materials.corridorTop = rough ?? wall;

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
  const image = loadImage ?? ((url, ok, bad) => loader.load(url, ok, undefined, bad)); // a picture's file, as a texture
  const draw = label ?? drawLabel;
  const pictures = hung.map((p, index) => {
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
    group.userData = { index, child: p.child, material: mat, face, cast, plate, title, size: p.size, state: 'idle' };
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

  // a photo keeps its proportions inside the square it hangs in; the shadow and
  // the plate follow its edges
  const fit = (picture, texture) => {
    const { width, height } = texture.image ?? {};

    if(!width || !height) return;

    const a = width / height;
    const { size, face, cast, plate } = picture.userData;
    const [w, h] = [size * Math.min(1, a), size * Math.min(1, 1 / a)];

    face.scale.set(w, h, DEPTH);
    cast.scale.set(w * SHADOW.spread, h * SHADOW.spread, 1);
    plate?.position.setY(-h / 2 - PLATE.below);
  };

  const last = new THREE.Vector3(Infinity, 0, 0); // where the visitor was when the nearest pictures were last chosen

  // a tile is fetched when the visitor comes near (low cost far away)
  let inflight = 0;

  const fetch = picture => {
    const url = tileUrl(picture.userData.child);

    picture.userData.state = 'loading';

    if(!url) return;

    inflight++;

    image(url, texture => {
      inflight--;
      last.set(Infinity, 0, 0); // a standing visitor still gets the next tile

      if(picture.userData.state === 'disposed') return texture.dispose();

      texture.colorSpace = THREE.SRGBColorSpace;
      fit(picture, texture);

      picture.userData.material.map = own(texture);
      picture.userData.material.color.set(0xffffff);
      picture.userData.material.needsUpdate = true;
      picture.userData.state = 'loaded';
    }, () => {
      inflight--;
      last.set(Infinity, 0, 0);
      picture.userData.state = 'failed'; // keeps its colour; the visitor can reload
    });
  };

  // the sharper image of a picture (its `child.full`), loaded when the visitor
  // zooms in on it; `downgrade` gives the memory back and shows the tile again
  const upgrade = index => {
    const u = pictures[index]?.userData;
    const url = u?.child?.full;

    if(!url || u.big || u.state === 'disposed') return;

    u.big = 'loading';

    image(
      url,
      texture => {
        if(u.state === 'disposed' || u.big !== 'loading') return texture.dispose();

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = anisotropy;
        fit(pictures[index], texture);

        u.thumb = u.material.map;
        u.big = own(texture);
        u.material.map = texture;
        u.material.color.set(0xffffff);
        u.material.needsUpdate = true;
      },
      () => u.big === 'loading' && (u.big = null),
    );
  };
  const downgrade = index => {
    const u = pictures[index]?.userData;

    if(!u?.big) return;

    if(u.big !== 'loading') {
      u.material.map = u.thumb ?? null;
      u.material.needsUpdate = true;
      u.big.dispose();
    }

    u.big = null;
  };

  // art lighting: a warm spot on each of the nearest pictures, a dim ambient
  const ambient = new THREE.AmbientLight(style.light?.tone ?? LIGHT.tone, style.light?.ambient ?? LIGHT.ambient);
  const spots = Array.from({ length: Math.min(LIGHT.spots, pictures.length) }, () => {
    const spot = new THREE.SpotLight(LIGHT.warm, LIGHT.intensity, LIGHT.reach, 0.6, 0.8, 2);

    root.add(spot, spot.target);

    return spot;
  });

  root.add(ambient);

  // the sky: a dome with a faint glow at the horizon, and the starfield on it, both
  // following the visitor. Stars are soft discs of varied brightness, size and
  // colour temperature (few bright ones), a part of them in a Milky Way band, and
  // each one flickers a little (scintillation, stronger for the dim ones).
  const sky = (() => {
    const rnd = random(style.sky?.seed ?? SKY.seed);
    const n = style.sky?.stars ?? SKY.stars;
    const bandN = Math.round(n * SKY.band);
    const glowN = Math.min(SKY.glow, bandN);
    const position = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const bright = new Float32Array(n);
    const phase = new Float32Array(n);
    const tint = new Float32Array(n * 3);
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(rnd() * Math.PI * 2);
    // the band: a great circle around a tilted axis
    const axis = new THREE.Vector3(0.35, 0.8, 0.5).normalize();
    const u = new THREE.Vector3(1, 0, 0).cross(axis).normalize();
    const v = axis.clone().cross(u);
    const base = new THREE.Color(style.sky?.tint ?? SKY.tint);
    const temperature = () => {
      const r = rnd();

      return r < 0.25 ? [0.72, 0.82, 1] : r < 0.78 ? [1, 1, 1] : r < 0.93 ? [1, 0.92, 0.78] : [1, 0.78, 0.62]; // blue, white, yellow, orange
    };

    for(let i = 0; i < n; i++) {
      const inBand = i < bandN;
      let d;

      if(inBand) {
        const a = rnd() * Math.PI * 2;
        const lat = gauss() * 0.16;

        d = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)).addScaledVector(axis, lat).normalize();
      } else {
        const z = rnd() * 2 - 1;
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(1 - z * z);

        d = new THREE.Vector3(r * Math.cos(a), z, r * Math.sin(a));
      }

      const glow = inBand && i < glowN;
      const b = glow ? 0.09 : inBand ? 0.25 + 0.4 * rnd() ** 2 : 0.4 + 0.6 * rnd() ** 4;

      position.set([d.x * SKY.radius, d.y * SKY.radius, d.z * SKY.radius], i * 3);
      bright[i] = b;
      size[i] = glow ? 70 + 70 * rnd() : (inBand ? 1.6 : 2.2) + 3.4 * b;
      phase[i] = rnd();
      tint.set(temperature().map((c, k) => c * [base.r, base.g, base.b][k]), i * 3);
    }

    const geometry = own(new THREE.BufferGeometry());

    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geometry.setAttribute('aBright', new THREE.BufferAttribute(bright, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));

    const material = own(
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uScale: { value: pixelRatio }, uTwinkle: { value: SKY.twinkle } },
        vertexShader: `
          uniform float uTime; uniform float uScale; uniform float uTwinkle;
          attribute float aSize; attribute float aBright; attribute float aPhase; attribute vec3 aTint;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            // two sines at unrelated rates per star: an irregular flicker, small for bright stars
            float tw = 0.5 * sin(uTime * (2.1 + aPhase * 1.3) + aPhase * 40.0) + 0.5 * sin(uTime * (4.3 + aPhase * 2.1) + aPhase * 17.0);
            float k = 1.0 + uTwinkle * (1.15 - aBright) * tw;
            vColor = aTint;
            vAlpha = aBright * k;
            gl_PointSize = aSize * (0.88 + 0.24 * k) * uScale;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float a = 1.0 - smoothstep(0.15, 1.0, d); // a bright core, a soft edge
            gl_FragColor = vec4(vColor, min(1.0, a * vAlpha * 1.6));
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const points = new THREE.Points(geometry, material);

    points.frustumCulled = false;
    points.renderOrder = -1;
    points.name = 'stars';
    root.add(points);

    // the dome behind the stars: near black overhead, a faint lift toward the horizon
    const dome = new THREE.Mesh(
      own(new THREE.SphereGeometry(SKY.radius * 1.1, 24, 12)),
      own(
        new THREE.ShaderMaterial({
          uniforms: { uZenith: { value: new THREE.Color(SKY.zenith) }, uHorizon: { value: new THREE.Color(SKY.horizon) } },
          vertexShader: 'varying float vY; void main() { vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'uniform vec3 uZenith; uniform vec3 uHorizon; varying float vY; void main() { gl_FragColor = vec4(mix(uHorizon, uZenith, pow(clamp(abs(vY) * 1.6, 0.0, 1.0), 0.6)), 1.0); }',
          side: THREE.BackSide,
          depthWrite: false,
          depthTest: false,
        }),
      ),
    );

    dome.frustumCulled = false;
    dome.renderOrder = -2;
    dome.name = 'dome';
    root.add(dome);

    return { stars: points, dome, material };
  })();
  const { stars } = sky;

  // contact shadows: a soft strip on the floor along the foot of every wall that has floor in front of it
  if(style.contact !== false) {
    const strips = contactStrips(built);

    if(strips.index.length) {
      const geometry = own(new THREE.BufferGeometry());
      const ramp = contactRamp();
      const map = own(new THREE.DataTexture(ramp.data, ramp.width, ramp.height, THREE.RGBAFormat));

      map.magFilter = map.minFilter = THREE.LinearFilter;
      map.flipY = false;
      map.needsUpdate = true;
      geometry.setAttribute('position', new THREE.BufferAttribute(strips.position, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(strips.uv, 2));
      geometry.setIndex(new THREE.BufferAttribute(strips.index, 1));

      const material = own(new THREE.MeshBasicMaterial({ color: 0x000000, map, opacity: CONTACT.strength * 1.3, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      const mesh = new THREE.Mesh(geometry, material);

      mesh.name = 'contact';
      mesh.raycast = () => {};
      root.add(mesh);
    }
  }

  // dust in the spot lights
  const dust = style.light?.dust === 0 ? null : makeDust(THREE, { spots: spots.length, count: style.light?.dust ?? (coarse ? DUST.coarse : DUST.count), pixelRatio });

  if(dust) root.add(own(dust).points);

  // the moon, and the clouds far below the bridges
  const moon = style.sky?.moon === false ? null : makeMoon(THREE);
  const clouds = style.sky?.clouds === false ? null : makeClouds(THREE, { coarse, direction: moon?.direction });

  if(moon) root.add(own(moon).group, moon.light);
  if(clouds) root.add(...own(clouds).layers);

  // the footprints of the visitor
  const trail = style.trail === false ? null : makeTrail(THREE, (x, z) => built.floorHeightAt(x, -z));

  if(trail) root.add(own(trail).mesh);

  const lit = new Set(); // spots follow the visitor when they have moved this far
  const MOVED = 0.5;

  // call every frame with the camera position and the time in seconds (the
  // twinkle and the turn of the sky)
  function update(position, time) {
    stars.position.copy(position);
    sky.dome.position.copy(position);

    if(time !== undefined) {
      sky.material.uniforms.uTime.value = time;
      stars.rotation.y = time * 0.004; // the sky turns, very slowly
    }

    moon?.update(position, time);
    clouds?.update(position, time);
    dust?.tick(time ?? 0);

    if(position.distanceTo(last) < MOVED) return;

    last.copy(position);

    const near = pictures.map(p => [p.position.distanceToSquared(position), p]).sort((a, b) => a[0] - b[0]);

    near.slice(0, spots.length).forEach(([, p], i) => {
      const spot = spots[i];
      const n = new THREE.Vector3(0, 0, 1).applyEuler(p.rotation);

      spot.position.copy(p.position).addScaledVector(n, LIGHT.front);
      spot.position.y += LIGHT.above;
      spot.target.position.copy(p.position);
      dust?.place(i, spot.position, spot.target.position, time ?? 0);
    });

    for(const [d, p] of near) {
      if(d > LIGHT.load * LIGHT.load) break;
      letter(p);
      if(p.userData.state === 'idle' && inflight < LIGHT.parallel) fetch(p);
    }

    lit.clear();
  }

  // call every frame with the camera position and where it looks: lays the footprints
  const footsteps = (position, forward, time) => trail?.step(position, forward, time);

  function dispose() {
    for(const p of pictures) p.userData.state = 'disposed';
    for(const x of owned) x.dispose?.();
    for(const s of spots) s.dispose?.();
  }

  return { root, pictures, spots, stars, dust, moon, clouds, trail, footsteps, update, upgrade, downgrade, dispose };
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
  const world = makeWorld(THREE, built, hung, { anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()), pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2), ...options });
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
  const look = new THREE.Vector3();
  let before = null;
  const tick = time => {
    const dt = before === null ? 0 : (time - before) / 1000;

    before = time;
    options.onFrame?.(time, dt, camera, THREE);
    world.update(options.focus?.() ?? camera.position, time / 1000); // `focus`: where the pictures to load are, when it is not where the camera is
    world.footsteps(camera.position, camera.getWorldDirection(look), time / 1000);
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
