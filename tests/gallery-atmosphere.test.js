// bun test: contact shadows, dust in the spots, moon and clouds, footprints; no GPU (GALLERY.md)
import { describe, expect, test } from 'bun:test';
import * as THREE from '../vendor/three/three.module.js';
import { autoPlan } from '../client/gallery/autoplan.js';
import { buildGallery } from '../client/gallery/build.js';
import { contactRamp, contactStrips } from '../client/gallery/contact.js';
import { makeDust } from '../client/gallery/dust.js';
import { hang } from '../client/gallery/hang.js';
import { makeClouds, makeMoon, moonDirection } from '../client/gallery/horizon.js';
import { makeWorld } from '../client/gallery/scene.js';
import { TRAIL, makeTrail, printTexture } from '../client/gallery/trail.js';

const kids = n => Array.from({ length: n }, (_, i) => ({ id: 'c' + i }));
const world = (n, options) => {
  const plan = autoPlan(n);
  const built = buildGallery(plan);

  return { plan, built, w: makeWorld(THREE, built, hang(plan, kids(n)).hung, options) };
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

describe('contact shadows', () => {
  const { built } = world(30);
  const strips = contactStrips(built);

  test('strips lie on the floor beside the walls, facing up', () => {
    expect(strips.index.length).toBeGreaterThan(0);

    for(let i = 0; i < strips.index.length; i += 3) {
      const [a, b, c] = [0, 1, 2].map(k => strips.index[i + k] * 3).map(j => V(strips.position[j], strips.position[j + 1], strips.position[j + 2]));
      const normal = b.clone().sub(a).cross(c.clone().sub(a));

      expect(normal.y).toBeGreaterThan(0);
    }
  });

  test('none looks into the void: every strip starts on a floor', () => {
    // the near edge of each strip (uv.y 0) is at the wall; the point 12 cm out has floor
    for(let q = 0; q < strips.position.length / 12; q++) {
      const p = k => V(strips.position[(q * 4 + k) * 3], strips.position[(q * 4 + k) * 3 + 1], strips.position[(q * 4 + k) * 3 + 2]);
      const mid = p(0).add(p(1)).multiplyScalar(0.5);
      const out = p(3).add(p(2)).multiplyScalar(0.5).sub(mid).normalize().multiplyScalar(0.12);

      expect(built.floorHeightAt(mid.x + out.x, -(mid.z + out.z))).not.toBeNull();
    }
  });

  test('fewer strips than wall faces: the outer faces and the tops get none', () => {
    const faces = ['wallN', 'wallE', 'wallS', 'wallW'].reduce((n, g) => n + built.groups[g].position.length / 12, 0);

    expect(strips.position.length / 12).toBeLessThan(faces);
  });

  test('the ramp is dark at the wall and clear at the far edge', () => {
    const { data, height } = contactRamp(16);

    expect(height).toBe(16);
    expect(data[3]).toBeGreaterThan(200);
    expect(data[(height - 1) * 4 + 3]).toBeLessThan(10);
  });

  test('the wall faces share a material that is darker at the foot; the top does not', () => {
    const { w } = world(30);
    const face = w.root.getObjectByName('wallN').material;
    const shader = { vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <map_fragment>' };

    face.onBeforeCompile(shader);
    expect(shader.fragmentShader).toContain('vFoot');
    expect(shader.vertexShader).toContain('vFoot = uv.y');
    expect(w.root.getObjectByName('wallTop').material.onBeforeCompile.toString()).not.toContain('vFoot');
    expect(w.root.getObjectByName('contact')).toBeTruthy();
  });

  test('can be left out', () => {
    expect(world(30, { style: { contact: false } }).w.root.getObjectByName('contact')).toBeUndefined();
  });
});

describe('dust in the spot lights', () => {
  test('a mote belongs to a spot; placing a spot sets where it is and fades the dust in when it moved', () => {
    const dust = makeDust(THREE, { spots: 3, count: 30 });

    expect(dust.points.geometry.attributes.aSpot.array.slice(0, 4)).toEqual(new Float32Array([0, 1, 2, 0]));
    expect(dust.uniforms.uOn.value).toEqual([0, 0, 0]);

    dust.place(1, V(0, 3, 0), V(0, 1.5, -1.4), 5);
    expect(dust.uniforms.uOn.value[1]).toBe(1);
    expect(dust.uniforms.uAxis.value[1].toArray()).toEqual([0, -1.5, -1.4]);
    expect(dust.uniforms.uBorn.value[1]).toBe(5);

    dust.place(1, V(0, 3, 0), V(0, 1.5, -1.4), 9); // the same picture: no new fade
    expect(dust.uniforms.uBorn.value[1]).toBe(5);

    dust.place(1, V(4, 3, 0), V(4, 1.5, -1.4), 12); // another picture
    expect(dust.uniforms.uBorn.value[1]).toBe(12);
    dust.clear(1);
    expect(dust.uniforms.uOn.value[1]).toBe(0);
  });

  test('no spots, no dust', () => {
    expect(makeDust(THREE, { spots: 0 })).toBeNull();
    expect(makeDust(THREE, { count: 0 })).toBeNull();
  });

  test('the world has dust that follows the spots, fewer motes on a phone, none on request', () => {
    const { w } = world(30);
    const before = w.dust.uniforms.uOn.value.slice();

    w.update(V(8, 1.6, -5), 3);
    expect(before.every(v => v === 0)).toBe(true);
    expect(w.dust.uniforms.uOn.value.every(v => v === 1)).toBe(true);
    expect(w.dust.uniforms.uTime.value).toBe(3);
    expect(w.dust.points.geometry.attributes.aSeed.count).toBe(420);
    expect(world(30, { coarse: true }).w.dust.points.geometry.attributes.aSeed.count).toBe(140);
    expect(world(30, { style: { light: { dust: 0 } } }).w.dust).toBeNull();
  });
});

describe('moon and clouds', () => {
  test('the moon stands in the east-north-east, over the horizon, and throws a cool light', () => {
    const d = moonDirection(THREE);

    expect(d.length()).toBeCloseTo(1);
    expect(d.y).toBeGreaterThan(0.4);
    expect(d.x).toBeGreaterThan(0);
    expect(d.z).toBeLessThan(0);
    expect(makeMoon(THREE).light.isDirectionalLight).toBe(true);
  });

  test('the moon follows the visitor and turns with the stars', () => {
    const moon = makeMoon(THREE);

    moon.update(V(10, 1.6, -4), 100);
    expect(moon.group.position.toArray()).toEqual([10, 1.6, -4]);
    expect(moon.group.rotation.y).toBeCloseTo(0.4);
  });

  test('the cloud layers lie far below, follow the visitor over the plan and keep their height', () => {
    const clouds = makeClouds(THREE);

    expect(clouds.layers.length).toBe(2);
    expect(clouds.layers.every(l => l.position.y < -5)).toBe(true);
    expect(clouds.layers[1].position.y).toBeLessThan(clouds.layers[0].position.y);

    clouds.update(V(30, 1.6, -8), 7);
    expect(clouds.layers[0].position.x).toBe(30);
    expect(clouds.layers[0].position.z).toBe(-8);
    expect(clouds.layers[0].position.y).toBeLessThan(-5);
    expect(clouds.layers[0].material.uniforms.uTime.value).toBe(7);
    expect(clouds.layers[0].material.defines.OCTAVES).toBe(4);
    expect(makeClouds(THREE, { coarse: true }).layers[0].material.defines.OCTAVES).toBe(3);
  });

  test('the world has both, and either can be left out', () => {
    const { w } = world(30);

    expect(w.moon).toBeTruthy();
    expect(w.clouds.layers.length).toBe(2);
    expect(w.root.getObjectByName('moon')).toBeTruthy();
    expect(w.root.getObjectByName('clouds0')).toBeTruthy();
    w.update(V(5, 1.6, -3), 2);
    expect(w.root.getObjectByName('clouds0').position.x).toBe(5);

    const bare = world(30, { style: { sky: { moon: false, clouds: false } } }).w;

    expect(bare.moon).toBeNull();
    expect(bare.clouds).toBeNull();
  });
});

describe('footprints', () => {
  const flat = () => 0; // a floor at height 0 everywhere
  const walk = (trail, from, to, n, forward, t0 = 0) => {
    for(let i = 0; i <= n; i++) trail.step(V(from[0] + ((to[0] - from[0]) * i) / n, 1.6, from[1] + ((to[1] - from[1]) * i) / n), forward, t0 + i * 0.05);
  };
  const toe = (trail, i) => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();

    trail.mesh.getMatrixAt(i, m);
    m.decompose(new THREE.Vector3(), q, new THREE.Vector3());

    return V(0, 1, 0).applyQuaternion(q); // the toe end of the print
  };

  test('a print each stride walked, none while standing', () => {
    const trail = makeTrail(THREE, flat);

    trail.step(V(0, 1.6, 0), V(0, 0, -1), 0);
    trail.step(V(0.1, 1.6, 0), V(0, 0, -1), 0.1);
    expect(trail.count()).toBe(0);
    walk(trail, [0, 0], [0, -10], 100, V(0, 0, -1));
    expect(Math.abs(trail.count() - 10 / TRAIL.stride)).toBeLessThanOrEqual(1);
  });

  test('left and right feet alternate, mirrored, either side of the line of walking', () => {
    const trail = makeTrail(THREE, flat);

    walk(trail, [0, 0], [0, -6], 60, V(0, 0, -1));

    const at = i => {
      const m = new THREE.Matrix4();
      const [p, s] = [new THREE.Vector3(), new THREE.Vector3()];

      trail.mesh.getMatrixAt(i, m);
      m.decompose(p, new THREE.Quaternion(), s);

      return { p, s };
    };

    expect(Math.sign(at(0).s.x)).toBe(-Math.sign(at(1).s.x));
    expect(Math.sign(at(0).p.x)).toBe(-Math.sign(at(1).p.x));
    expect(Math.abs(at(0).p.x)).toBeCloseTo(TRAIL.gap);
    expect(at(0).p.y).toBeGreaterThan(0); // just over the floor
  });

  test('walking forward the toes lead, walking backwards (a moonwalk) they point the way you look', () => {
    const forward = makeTrail(THREE, flat);

    walk(forward, [0, 0], [0, -5], 50, V(0, 0, -1));
    expect(toe(forward, 2).z).toBeLessThan(-0.9); // along the way: north

    const back = makeTrail(THREE, flat);

    walk(back, [0, 0], [0, 5], 50, V(0, 0, -1)); // moves south, looks north
    expect(toe(back, 2).z).toBeLessThan(-0.9); // the print points north: it looks like walking north

    const side = makeTrail(THREE, flat);

    walk(side, [0, 0], [5, 0], 50, V(0, 0, -1)); // a glide along a wall, looking at it
    expect(toe(side, 2).x).toBeGreaterThan(0.9); // not a moonwalk: it follows the move
  });

  test('a jump, the bird\'s-eye view and a place without floor leave nothing', () => {
    const trail = makeTrail(THREE, flat);

    trail.step(V(0, 1.6, 0), V(0, 0, -1), 0);
    trail.step(V(20, 1.6, 0), V(0, 0, -1), 1); // a tour move cut short: a jump
    trail.step(V(21, 1.6, 0), V(0, 0, -1), 2);
    expect(trail.count()).toBe(1);

    const air = makeTrail(THREE, flat);

    air.step(V(0, 40, 0), V(0, -1, 0), 0);
    air.step(V(2, 40, 0), V(0, -1, 0), 1);
    expect(air.count()).toBe(0);

    const none = makeTrail(THREE, () => null);

    none.step(V(0, 1.6, 0), V(0, 0, -1), 0);
    none.step(V(1, 1.6, 0), V(0, 0, -1), 1);
    expect(none.count()).toBe(0);
  });

  test('the oldest print is overwritten when there are too many', () => {
    const trail = makeTrail(THREE, flat, { max: 10 });

    walk(trail, [0, 0], [0, -30], 300, V(0, 0, -1));
    expect(trail.count()).toBe(10);
    expect(trail.mesh.count).toBe(10);
    trail.clear();
    expect(trail.count()).toBe(0);
  });

  test('the print is a sole and a heel, toe at the top', () => {
    const { data, width, height } = printTexture(16);
    const alpha = (u, v) => data[(Math.floor(v * height) * width + Math.floor(u * width)) * 4 + 3];

    expect(alpha(0.5, 0.7)).toBeGreaterThan(150); // the sole
    expect(alpha(0.5, 0.2)).toBeGreaterThan(100); // the heel
    expect(alpha(0.5, 0.45)).toBeLessThan(alpha(0.5, 0.7)); // the gap of the arch
    expect(alpha(0.02, 0.02)).toBe(0);
  });

  test('the world lays them as the camera walks', () => {
    const { w } = world(5);

    for(let i = 0; i < 40; i++) w.footsteps(V(3 + i * 0.2, 1.6, -3), V(1, 0, 0), i * 0.1);
    expect(w.trail.count()).toBeGreaterThan(5);
    expect(world(5, { style: { trail: false } }).w.trail).toBeNull();
  });
});
