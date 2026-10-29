// bun test: the guided walk without a GPU: stations, routes, the tour (TODO 13.11)
import { describe, expect, test } from 'bun:test';
import { autoPlan } from '../client/gallery/autoplan.js';
import { buildGallery } from '../client/gallery/build.js';
import { hang } from '../client/gallery/hang.js';
import { clearance, route, visible, walkable } from '../client/gallery/route.js';
import { fitZoom, nearest, STATION, stations } from '../client/gallery/stations.js';
import { createTour } from '../client/gallery/tour.js';
import { createWalker } from '../client/gallery/walk.js';

const make = n => {
  const plan = autoPlan(n);
  const built = buildGallery(plan);
  const hung = hang(plan, Array.from({ length: n }, (_, i) => ({ id: 'c' + i }))).hung;
  const list = stations(built, hung);

  return { plan, built, hung, list };
};
// seconds of animation until the tour stops, with the walker following
const run = (tour, limit = 20) => {
  const samples = [];

  for(let t = 0; t < limit && (tour.moving || t === 0); t += 1 / 60) {
    tour.step(1 / 60);
    samples.push([tour.walker?.x, tour.walker?.y]);
  }
};

describe('stations', () => {
  const { built, hung, list } = make(40);

  test('one per picture, in order, each on the floor and clear of the walls', () => {
    expect(list.length).toBe(hung.length);
    expect(list.map(s => s.index)).toEqual(list.map((_, i) => i));

    for(const s of list) {
      expect(built.floorHeightAt(s.x, s.y)).not.toBeNull();
      expect(clearance(built, s.x, s.y)).toBeGreaterThanOrEqual(STATION.radius);
    }
  });

  test('a station is in front of its picture and faces it', () => {
    for(const s of list) {
      const [lx, ly] = [Math.sin(s.yaw), Math.cos(s.yaw)]; // the look direction
      const [dx, dy] = [s.picture.x - s.x, s.picture.y - s.y];

      expect(Math.hypot(dx, dy)).toBeCloseTo(s.distance);
      expect((dx * lx + dy * ly) / Math.hypot(dx, dy)).toBeCloseTo(1);
    }
  });

  test('nearest and the fit zoom: bigger for a wider stage, never below 1', () => {
    expect(nearest(list, list[7].x + 0.1, list[7].y)).toBe(7);
    expect(fitZoom(list[0], 1)).toBeGreaterThan(2);
    expect(fitZoom(list[0], 1)).toBeGreaterThan(fitZoom(list[0], 0.5));
    expect(fitZoom({ ...list[0], distance: 0.2 }, 1)).toBe(1);
  });
});

describe('route', () => {
  const { built, list } = make(40);
  const roomOf = s => Math.floor(s.x / 22); // rooms are 16 m wide, 6 m of corridor between

  test('a clear line is the route', () => {
    const r = route(built, [list[0].x, list[0].y], [list[1].x, list[1].y]);

    expect(r.points.length).toBe(2);
    expect(r.ok).toBe(true);
  });

  test('a wall in the way: the route goes through the door and the corridor, clear of the walls', () => {
    const a = list.find(s => roomOf(s) === 0 && s.picture.nx < -0.5); // a picture on the east wall: faces west
    const b = list.find(s => roomOf(s) === 1);
    const r = route(built, [a.x, a.y], [b.x, b.y]);

    expect(visible(built, [a.x, a.y], [b.x, b.y])).toBe(false);
    expect(r.ok).toBe(true);
    expect(r.points.length).toBeGreaterThan(2);

    for(let i = 0; i + 1 < r.points.length; i++) expect(visible(built, r.points[i], r.points[i + 1], STATION.radius - 0.06)).toBe(true);

    expect(r.length).toBeGreaterThan(Math.hypot(b.x - a.x, b.y - a.y));
  });

  test('a point outside every floor cannot be walked to', () => {
    expect(walkable(built, -50, -50)).toBe(false);
    expect(route(built, [list[0].x, list[0].y], [-50, -50]).ok).toBe(false);
  });
});

describe('tour', () => {
  const setup = (n = 40) => {
    const w = make(n);
    const walker = createWalker(w.built);
    const tour = createTour(w.built, w.list, walker);

    tour.walker = walker;
    tour.snap(0);

    return { ...w, walker, tour };
  };
  const settle = (tour, seconds = 20) => {
    for(let t = 0; t < seconds && tour.moving; t += 1 / 60) tour.step(1 / 60);
  };

  test('starts at the first station, zoomed out', () => {
    const { tour, walker, list } = setup();

    expect([walker.x, walker.y]).toEqual([list[0].x, list[0].y]);
    expect(tour.zoom).toBe(1);
  });

  test('next glides sideways along the wall, facing it, and arrives exactly', () => {
    const { tour, walker, list } = setup();
    const i = list.findIndex((s, k) => list[k + 1] && Math.abs(list[k + 1].yaw - s.yaw) < 1e-9 && list[k + 1].wall === s.wall); // two on one wall

    expect(i).toBeGreaterThanOrEqual(0);
    tour.snap(i);
    tour.next();
    expect(tour.moving).toBe(true);

    const yaws = [];

    for(let t = 0; t < 10 && tour.moving; t += 1 / 60) {
      tour.step(1 / 60);
      yaws.push(walker.yaw);
    }

    expect(tour.moving).toBe(false);
    expect([walker.x, walker.y, walker.yaw]).toEqual([list[i + 1].x, list[i + 1].y, list[i + 1].yaw]);
    expect(Math.max(...yaws) - Math.min(...yaws)).toBeLessThan(1e-9); // stayed facing the wall
  });

  test('across a room: walks the route, stays on the floor and off the walls, ends facing the picture', () => {
    const { tour, walker, built, list } = setup();
    const far = list.find(s => Math.floor(s.x / 22) === 1);

    tour.goto(far.index);

    for(let t = 0; t < 20 && tour.moving; t += 1 / 60) {
      tour.step(1 / 60);
      expect(built.floorHeightAt(walker.x, walker.y)).not.toBeNull();
      expect(clearance(built, walker.x, walker.y)).toBeGreaterThan(0.3);
    }

    expect(tour.moving).toBe(false);
    expect([walker.x, walker.y, walker.yaw]).toEqual([far.x, far.y, far.yaw]);
    expect(tour.index).toBe(far.index);
  });

  test('across a corner of a room it turns, to face the next wall', () => {
    const { tour, walker, list } = setup();
    const i = list.findIndex((s, k) => list[k + 1] && Math.abs(list[k + 1].yaw - s.yaw) > 1); // a corner

    tour.snap(i);
    tour.next();
    settle(tour);
    expect(walker.yaw).toBe(list[i + 1].yaw);
  });

  test('round a corner it turns the short way, a quarter turn is not a 200 degree swing', () => {
    const { tour, walker, list } = setup();
    const wrap = d => ((((d % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    let corners = 0;

    for(let i = 0; i < list.length - 1; i++) {
      const direct = Math.abs(wrap(list[i + 1].yaw - list[i].yaw));
      const near = Math.hypot(list[i + 1].x - list[i].x, list[i + 1].y - list[i].y) < 3;

      if(!near || direct < 1) continue;

      tour.snap(i);
      tour.next();

      let turned = 0;
      let prev = walker.yaw;

      for(let t = 0; t < 10 && tour.moving; t += 1 / 60) {
        tour.step(1 / 60);
        turned += Math.abs(wrap(walker.yaw - prev));
        prev = walker.yaw;
      }

      expect(turned).toBeLessThan(direct + 0.05);
      corners++;
    }

    expect(corners).toBeGreaterThan(0);
  });

  test('a move takes between 0.8 and 6 seconds', () => {
    const { tour, list } = setup();
    const time = to => {
      tour.snap(0);
      tour.goto(to);

      let t = 0;

      while(tour.moving && t < 30) (tour.step(1 / 60), (t += 1 / 60));

      return t;
    };

    expect(time(1)).toBeGreaterThan(0.75);
    expect(time(list.length - 1)).toBeLessThanOrEqual(6.05);
  });

  test('next at the end and prev at the start stay put; first and last jump along', () => {
    const { tour, list } = setup(10);

    tour.prev();
    expect(tour.index).toBe(0);
    tour.last();
    expect(tour.index).toBe(list.length - 1);
    tour.next();
    expect(tour.index).toBe(list.length - 1);
    tour.first();
    expect(tour.index).toBe(0);
  });

  test('retargeting mid-move walks on from where it is', () => {
    const { tour, walker, list } = setup();

    tour.goto(5);
    for(let i = 0; i < 40; i++) tour.step(1 / 60);

    const [x, y] = [walker.x, walker.y];

    tour.goto(2);
    settle(tour);
    expect([walker.x, walker.y]).toEqual([list[2].x, list[2].y]);
    expect(Math.hypot(x - list[2].x, y - list[2].y)).toBeGreaterThan(0);
  });

  test('release stops where it is; finish jumps to the station', () => {
    const { tour, walker, list } = setup();

    tour.goto(3);
    for(let i = 0; i < 30; i++) tour.step(1 / 60);

    const at = [walker.x, walker.y];

    tour.release();
    tour.step(1);
    expect([walker.x, walker.y]).toEqual(at);
    expect(tour.moving).toBe(false);

    tour.goto(3);
    tour.finish();
    expect([walker.x, walker.y]).toEqual([list[3].x, list[3].y]);
  });

  test('zoom: toggle to fit and back, clamped, field of view narrows, a move zooms out', () => {
    const { tour } = setup();

    tour.toggleFit(1);
    settle(tour);
    for(let i = 0; i < 120; i++) tour.step(1 / 60);
    expect(tour.zoom).toBeGreaterThan(2);
    expect(tour.fov()).toBeLessThan(35);

    tour.zoomBy(100);
    expect(tour.zoomTarget).toBe(STATION.zoomMax);
    tour.zoomBy(0.0001);
    expect(tour.zoomTarget).toBe(1);

    tour.toggleFit(1);
    tour.next();
    expect(tour.zoomTarget).toBe(1);
    tour.toggleFit(1);
    tour.toggleFit(1);
    expect(tour.zoomTarget).toBe(1);
  });
});
