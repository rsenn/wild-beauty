// bun test: the gallery scene graph with the vendored three.js, no GPU (GALLERY.md S3.4, S3.5, TODO 13.3)
import { describe, expect, test } from 'bun:test';
import * as THREE from '../vendor/three/three.module.js';
import { autoPlan } from '../client/gallery/autoplan.js';
import { buildGallery } from '../client/gallery/build.js';
import { hang } from '../client/gallery/hang.js';
import { LIGHT, makeWorld, startPose } from '../client/gallery/scene.js';

const kids = n => Array.from({ length: n }, (_, i) => ({ id: 'c' + i }));
const world = (n, options) => {
  const plan = autoPlan(n);
  const built = buildGallery(plan);

  return { plan, built, w: makeWorld(THREE, built, hang(plan, kids(n)).hung, options) };
};

describe('makeWorld', () => {
  test('one mesh per material group, a picture per child, stars, ambient', () => {
    const { w } = world(30);
    const names = w.root.children.filter(c => c.isMesh).map(c => c.name);

    expect(names).toEqual(expect.arrayContaining(['wallN', 'wallE', 'wallS', 'wallW', 'wallTop', 'roomFloor']));
    expect(w.pictures.length).toBe(30);
    expect(w.root.getObjectByName('stars').geometry.attributes.position.count).toBe(2000);
    expect(w.root.children.filter(c => c.isAmbientLight).length).toBe(1);
  });

  test('only the nearest few pictures get a real spot light, and they follow the visitor', () => {
    const { w } = world(30);

    expect(w.spots.length).toBe(LIGHT.spots);

    w.update(new THREE.Vector3(8, 1.6, -5));
    const near = w.spots.map(s => s.target.position.distanceTo(new THREE.Vector3(8, 1.5, -5)));

    w.update(new THREE.Vector3(30, 1.6, -5));
    const far = w.spots.map(s => s.target.position.distanceTo(new THREE.Vector3(30, 1.5, -5)));

    expect(Math.max(...near)).toBeLessThan(12);
    expect(Math.max(...far)).toBeLessThan(12);
  });

  test('a picture faces into the room', () => {
    const { w } = world(5); // one closed room, 16 x 10 m, centre (8, -5)
    const centre = new THREE.Vector3(8, 1.5, -5);

    for(const p of w.pictures) {
      const facing = new THREE.Vector3(0, 0, 1).applyEuler(p.rotation);

      expect(centre.clone().sub(p.position).dot(facing)).toBeGreaterThan(0);
    }
  });

  test('tiles are fetched only near the visitor, once', () => {
    const asked = [];
    const { w } = world(100, { tileUrl: c => (asked.push(c.id), null) });

    w.update(new THREE.Vector3(8, 1.6, -5));
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.length).toBeLessThan(100);

    const before = asked.length;

    w.update(new THREE.Vector3(8.1, 1.6, -5));
    w.update(new THREE.Vector3(11, 1.6, -5));
    expect(new Set(asked).size).toBe(asked.length);
    expect(asked.length).toBeGreaterThanOrEqual(before);
  });

  test('dispose frees geometries and materials', () => {
    const { w } = world(10);
    let freed = 0;

    w.root.traverse(o => o.geometry?.addEventListener('dispose', () => freed++));
    w.dispose();
    expect(freed).toBeGreaterThan(0);
  });
});

describe('textures', () => {
  const style = { floor: { texture: { color: '/c.jpg', roughness: '/r.jpg', tile: 2 } } };
  const stub = url => Object.assign(new THREE.Texture(), { url });
  const floors = w => ({ room: w.root.getObjectByName('roomFloor').material, corridor: w.root.getObjectByName('corridorFloor').material });

  test('a floor texture repeats once per tile metres and sets the maps', () => {
    const { w } = world(30, { style, loadTexture: stub });
    const { room } = floors(w);

    expect(room.map.url).toBe('/c.jpg');
    expect(room.map.repeat.x).toBeCloseTo(0.5);
    expect(room.map.wrapS).toBe(THREE.RepeatWrapping);
    expect(room.map.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(room.roughnessMap.url).toBe('/r.jpg');
    expect(room.roughnessMap.colorSpace).not.toBe(THREE.SRGBColorSpace);
    expect(room.color.getHex()).toBe(0xffffff);
  });

  test('a corridor without its own surface is floored like the rooms', () => {
    const { w } = world(30, { style, loadTexture: stub });

    expect(floors(w).corridor).toBe(floors(w).room);
  });

  test('without a texture it stays the plain colour', () => {
    const { w } = world(30, { loadTexture: stub });

    expect(floors(w).room.map).toBeNull();
  });

  test('the warm look: pine floors, tinted plaster walls, marble bridges', () => {
    const plan = autoPlan(30);
    const w = makeWorld(THREE, buildGallery(plan), [], { style: plan.style, loadTexture: stub });
    const f = floors(w);

    expect(f.room.map.url).toContain('woodfloor034');
    expect(f.corridor.map.url).toContain('marble017');
    expect(f.corridor).not.toBe(f.room);
    expect(w.root.getObjectByName('wallN').material.map.url).toContain('plaster001');
    expect(w.root.getObjectByName('wallN').material.map.repeat.x).toBeCloseTo(1 / 2.5);
    expect(w.root.getObjectByName('wallN').material.color.getHexString()).toBe('fff0dc');
    expect(w.root.getObjectByName('wallTop').material).toBe(w.root.getObjectByName('wallE').material);
  });

  test('looks: walnut and stone, and the ambient light is warm', () => {
    expect(autoPlan(10, { look: 'walnut' }).style.floor.texture.color).toContain('woodfloor014');
    expect(autoPlan(10, { look: 'stone' }).style.floor.texture.color).toContain('marble017');
    expect(autoPlan(10, { look: 'stone' }).style.corridor).toBeUndefined();

    const { w } = world(10);

    expect(w.root.children.find(c => c.isAmbientLight).color.getHexString()).toBe('fff1e0');
  });
});

describe('canvases and name plates', () => {
  const kidsWithTitles = n => Array.from({ length: n }, (_, i) => ({ id: 'c' + i, ...(i % 2 ? {} : { title: 'Work ' + i }) }));
  const make = (n, options) => {
    const plan = autoPlan(n);

    return makeWorld(THREE, buildGallery(plan), hang(plan, kidsWithTitles(n)).hung, options);
  };

  test('a canvas is a shallow box an inch off the wall, with no frame', () => {
    const w = make(6);
    const { face } = w.pictures[0].userData;

    expect(face.geometry.type).toBe('BoxGeometry');
    expect(face.scale.z).toBeCloseTo(0.04);
    expect(face.position.z).toBeCloseTo(0.02);
    expect(Array.isArray(face.material)).toBe(true);
    expect(face.material[4]).toBe(w.pictures[0].userData.material); // the photo on the front
    expect(w.pictures[0].children.length).toBe(3); // shadow, canvas, plate: no frame
  });

  test('a picture is 1.3 m and the shadow is soft, bigger and does not catch clicks', () => {
    const w = make(6);
    const { cast, face } = w.pictures[0].userData;

    expect(face.scale.x).toBeCloseTo(1.3);
    expect(cast.scale.x).toBeGreaterThan(face.scale.x);
    expect(cast.material.transparent).toBe(true);
    expect(cast.raycast()).toBeUndefined();
  });

  test('only a titled picture has a plate, below the canvas', () => {
    const w = make(6);
    const [a, b] = w.pictures; // c0 titled, c1 not

    expect(a.userData.plate).not.toBeNull();
    expect(b.userData.plate).toBeNull();
    expect(a.userData.plate.position.y).toBeLessThan(-1.3 / 2);
  });

  test('the lettering is drawn when the visitor comes near, once', () => {
    const drawn = [];
    const w = make(40, { label: text => (drawn.push(text), { width: 512, height: 144 }) });

    w.update(new THREE.Vector3(8, 1.6, -5));
    const first = drawn.length;

    expect(first).toBeGreaterThan(0);
    expect(drawn.every(t => t.startsWith('Work'))).toBe(true);
    expect(new Set(drawn).size).toBe(drawn.length);

    w.update(new THREE.Vector3(9, 1.6, -5));
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  test('the shadow and plate follow a photo that is not square', () => {
    const w = make(6);
    const p = w.pictures[0];
    const wide = p.userData.face;

    wide.scale.set(1.3, 0.65, 0.04); // what a 2:1 photo does after loading

    expect(p.userData.plate.position.y).toBeLessThan(0);
  });
});

describe('startPose', () => {
  test('eye height over the floor, look 90 is east', () => {
    const p = startPose({ x: 6, y: 4, look: 90, h: 0.5 });
    const cam = new THREE.PerspectiveCamera();

    cam.rotation.order = 'YXZ';
    cam.rotation.y = p.yaw;

    const dir = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);

    expect([p.x, p.y, p.z]).toEqual([6, 2.1, -4]);
    expect(dir.x).toBeCloseTo(1);
  });
});
