// bun test: the flyby of a gallery before anyone walks in (client/gallery/flyby.js)
import { describe, expect, test } from 'bun:test';
import { autoPlan } from '../client/gallery/autoplan.js';
import { buildGallery } from '../client/gallery/build.js';
import { FLYBY, makeFlyby, runs } from '../client/gallery/flyby.js';
import { hang } from '../client/gallery/hang.js';
import { overviewPose, planBounds } from '../client/gallery/overview.js';
import { clearance } from '../client/gallery/route.js';
import { stations } from '../client/gallery/stations.js';

const make = n => {
  const plan = autoPlan(n);
  const built = buildGallery(plan);
  const hung = hang(plan, Array.from({ length: n }, (_, i) => ({ id: 'c' + i }))).hung;
  const list = stations(built, hung);
  const bird = { ...overviewPose(planBounds(built.collision), 16 / 9), fov: 42 };

  return { built, list, bird, fly: makeFlyby(built, list, bird) };
};
const wrap = a => ((((a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;

describe('runs', () => {
  const { list } = make(30);

  test('the pictures of one wall, one after the other, along it', () => {
    const r = runs(list);

    expect(r.length).toBeGreaterThan(3);
    expect(r.every(x => x.stations.length >= 2)).toBe(true);

    for(const x of r) {
      const along = s => s.picture.x * x.tangent[0] + s.picture.y * x.tangent[1];

      expect(x.stations.every((s, i) => i === 0 || along(s) >= along(x.stations[i - 1]))).toBe(true);
      expect(x.stations.every(s => Math.abs(s.picture.nx - x.normal[0]) < 0.01 && Math.abs(s.picture.ny - x.normal[1]) < 0.01)).toBe(true);
    }
  });
});

describe('makeFlyby', () => {
  const { built, list, bird, fly } = make(30);
  const poses = (step = 1 / 20) => Array.from({ length: Math.floor(fly.duration / step) }, (_, i) => fly.pose(i * step));

  test('starts and ends at the bird\'s-eye view, so it repeats without a jump', () => {
    const [a, b] = [fly.pose(0), fly.pose(fly.duration - 1e-6)];

    expect([a.x, a.y, a.z]).toEqual([bird.x, bird.y, bird.z]);
    expect(Math.abs(a.pitch - bird.pitch)).toBeLessThan(0.2); // the gaze is smoothed: a few degrees off at most
    expect(Math.abs(a.yaw)).toBeLessThan(0.12);
    expect(a.fov).toBeCloseTo(42);
    expect(b.x).toBeCloseTo(a.x, 1);
    expect(b.y).toBeCloseTo(a.y, 1);
    expect(Math.abs(wrap(b.yaw - a.yaw))).toBeLessThan(0.02);
    expect(Math.abs(b.pitch - a.pitch)).toBeLessThan(0.02);
    expect(Math.abs(b.roll - a.roll)).toBeLessThan(0.03);
    expect(fly.pose(fly.duration + 3).x).toBeCloseTo(fly.pose(3).x); // the flight repeats
  });

  test('every pose is a number, and the camera never jumps', () => {
    const all = poses();

    expect(all.every(p => Object.values(p).every(Number.isFinite))).toBe(true);

    for(let i = 1; i < all.length; i++) expect(Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y, all[i].z - all[i - 1].z)).toBeLessThan(1.5); // at 20 poses a second
  });

  test('lower than a wall, the camera is over a floor and clear of the walls', () => {
    for(const p of poses()) {
      if(p.y > FLYBY.wall) continue;

      expect(built.floorHeightAt(p.x, -p.z)).not.toBeNull();
      expect(clearance(built, p.x, -p.z)).toBeGreaterThan(0.3);
    }
  });

  test('it dives to the height of a visitor and flies past the pictures at their distance', () => {
    const all = poses();
    const low = all.filter(p => p.y < 2);

    expect(low.length).toBeGreaterThan(40);
    expect(Math.max(...all.map(p => p.y))).toBeGreaterThan(FLYBY.altitude * 0.9);

    // while low it is near some station of the list
    const near = p => Math.min(...list.map(s => Math.hypot(s.x - p.x, s.y + p.z)));

    expect(low.filter(p => near(p) < 3.5).length / low.length).toBeGreaterThan(0.8);
  });

  test('it banks in the figure eight, both ways', () => {
    const rolls = poses().map(p => p.roll);

    expect(Math.max(...rolls)).toBeGreaterThan(0.2);
    expect(Math.min(...rolls)).toBeLessThan(-0.2);
    expect(Math.max(...rolls.map(Math.abs))).toBeLessThanOrEqual(FLYBY.bank * 1.2);
  });

  test('the field of view stays in range, wider near the pictures than above', () => {
    const all = poses();

    expect(Math.min(...all.map(p => p.fov))).toBeGreaterThanOrEqual(30);
    expect(Math.max(...all.map(p => p.fov))).toBeLessThanOrEqual(80);
    expect(all.filter(p => p.y < 2).every(p => p.fov > 55)).toBe(true);
  });

  test('it turns its head smoothly: no snap of the gaze, the roll or the speed', () => {
    const dt = 1 / 60;
    const all = Array.from({ length: Math.floor(fly.duration / dt) }, (_, i) => fly.pose(i * dt));
    const rate = (key, wrapped) => all.slice(1).map((p, i) => Math.abs(wrapped ? wrap(p[key] - all[i][key]) : p[key] - all[i][key]) / dt);
    const speed = all.slice(1).map((p, i) => Math.hypot(p.x - all[i].x, p.y - all[i].y, p.z - all[i].z) / dt);
    const accel = v => v.slice(1).map((x, i) => Math.abs(x - v[i]) / dt);

    expect(Math.max(...rate('yaw', true))).toBeLessThan(2.2); // radians a second
    expect(Math.max(...rate('pitch'))).toBeLessThan(1.6);
    expect(Math.max(...rate('roll'))).toBeLessThan(1.6);
    expect(Math.max(...accel(rate('yaw', true)))).toBeLessThan(14); // the gaze does not jerk
    expect(Math.min(...speed)).toBeGreaterThan(0.5); // never hangs in the air
    expect(Math.max(...speed)).toBeLessThan(14);
    expect(Math.max(...accel(speed))).toBeLessThan(20); // metres a second squared: the speed is eased (the 0.25 m table adds a little jitter)
  });

  test('flies along more than one wall, a later wall on another side', () => {
    expect(fly.runs).toBe(FLYBY.walls);

    const at = [0.25, 0.5, 0.75].map(f => fly.pose(fly.duration * f));

    expect(new Set(at.map(p => Math.round(p.x / 5))).size).toBeGreaterThan(1);
  });

  test('a plan without a wall of two pictures has no flyby', () => {
    expect(makeFlyby(built, [], bird)).toBeNull();
    expect(makeFlyby(built, list.slice(0, 1), bird)).toBeNull();
  });
});
