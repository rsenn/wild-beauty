// bun test: the 3D gallery builder, auto-hang and auto plan (GALLERY.md S3, S5.1, TODO 13.2 13.5 13.8)
import { describe, expect, test } from 'bun:test';
import { autoPlan } from '../client/gallery/autoplan.js';
import { buildGallery } from '../client/gallery/build.js';
import { hang, slots } from '../client/gallery/hang.js';
import { offsetLine } from '../client/gallery/line.js';

const square = (s = 10) => [[0, 0], [s, 0], [s, s], [0, s]];
const room = (extra = {}) => ({ type: 'scene3d', kind: 'gallery', plan: { walls: [{ points: square(), closed: true }], ...extra } });

// the face normals of a group's triangles: [[cx, cz, nx, ny, nz], ...]
function normals({ position: p, index: ix }) {
  const out = [];

  for(let i = 0; i < ix.length; i += 3) {
    const v = [0, 1, 2].map(k => [p[ix[i + k] * 3], p[ix[i + k] * 3 + 1], p[ix[i + k] * 3 + 2]]);
    const e1 = v[1].map((c, k) => c - v[0][k]);
    const e2 = v[2].map((c, k) => c - v[0][k]);
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];

    out.push([(v[0][0] + v[1][0] + v[2][0]) / 3, (v[0][2] + v[1][2] + v[2][2]) / 3, ...n]);
  }

  return out;
}

describe('offsetLine', () => {
  test('a 90 degree corner is mitred', () => {
    const [a, b, c] = offsetLine([[0, 0], [10, 0], [10, 10]], 1);

    expect(a).toEqual([0, 1]);
    expect(b[0]).toBeCloseTo(9);
    expect(b[1]).toBeCloseTo(1);
    expect(c[0]).toBeCloseTo(9);
  });
});

describe('slots and hang', () => {
  test('pictures hang on the inside of a closed room, wall by wall', () => {
    const s = slots(room());

    expect(s.length).toBe(12); // 3 per wall of 10 m
    for(const p of s) {
      expect(p.h).toBe(1.5);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(10);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(10);
    }
    expect(s[0].nx).toBeCloseTo(0);
    expect(s[0].ny).toBe(1); // the south wall faces north
  });

  test('the winding of a closed wall does not change the side', () => {
    const cw = { plan: { walls: [{ points: [...square()].reverse(), closed: true }] } };

    expect(slots(cw).length).toBe(12);
    for(const p of slots(cw)) expect(p.x > 0 && p.x < 10 && p.y > 0 && p.y < 10).toBe(true);
  });

  test('an open wall hangs on its left, side none hangs nothing', () => {
    const open = side => ({ plan: { walls: [{ points: [[0, 0], [10, 0]], side }] } });

    expect(slots(open())[0].ny).toBe(1);
    expect(slots(open('right'))[0].ny).toBe(-1);
    expect(slots(open('none'))).toEqual([]);
  });

  test('a run needs 3.2 m for one picture and 6.1 m for two (1.3 m pictures, 1.6 m apart)', () => {
    const run = L => slots({ plan: { walls: [{ points: [[0, 0], [L, 0]] }] } }).length;

    expect([run(3.1), run(3.3), run(6), run(6.2)]).toEqual([0, 1, 1, 2]);
  });

  test('what does not fit stays unhung, in edge order', () => {
    const r = hang(room(), Array.from({ length: 25 }, (_, i) => 'c' + i));

    expect(r.total).toBe(12);
    expect(r.hung.length).toBe(12);
    expect(r.hung[0].child).toBe('c0');
  });

  test('a gentle bend stays one run, a corner ends it', () => {
    const bend = { plan: { walls: [{ points: [[0, 0], [5, 0], [10, 1]] }] } };
    const corner = { plan: { walls: [{ points: [[0, 0], [5, 0], [5, 5]] }] } };

    expect(slots(bend).length).toBe(3);
    expect(slots(corner).length).toBe(2); // 1 on each of two 5 m runs
  });
});

describe('buildGallery', () => {
  test('wall faces of a room point out of the wall, interior faces into the room', () => {
    const { groups } = buildGallery(room());
    const south = normals(groups.wallN).filter(([, z]) => Math.abs(z) < 0.2 + 1e-9); // plan y = 0, z = 0

    expect(south.length).toBeGreaterThan(0);
    for(const [, , nx, ny, nz] of south) {
      expect(ny).toBeCloseTo(0);
      expect(nz).toBeLessThan(0); // faces north = -z
    }
    for(const g of ['wallN', 'wallE', 'wallS', 'wallW']) expect(groups[g].index.length).toBeGreaterThan(0);
  });

  test('wall tops and floors face up', () => {
    const { groups } = buildGallery(room());

    for(const g of ['wallTop', 'roomFloor']) {
      expect(groups[g].index.length).toBeGreaterThan(0);
      for(const [, , , ny] of normals(groups[g])) expect(ny).toBeGreaterThan(0);
    }
  });

  test('the room floor covers the room (2 triangles for a square, an L-shape too)', () => {
    expect(buildGallery(room()).groups.roomFloor.index.length).toBe(6);

    const l = { plan: { walls: [{ points: [[0, 0], [10, 0], [10, 5], [5, 5], [5, 10], [0, 10]], closed: true }] } };
    const f = buildGallery(l).groups.roomFloor;
    const area = normals(f).reduce((sum, n) => sum + n[3] / 2, 0);

    expect(f.index.length / 3).toBe(4);
    expect(area).toBeCloseTo(75);
  });

  test('uv runs in metres along the wall', () => {
    const { groups } = buildGallery({ plan: { walls: [{ points: [[0, 0], [7, 0]] }] } });
    const us = Array.from(groups.wallN.uv).filter((_, i) => i % 2 === 0);

    expect(Math.max(...us)).toBeCloseTo(7);
  });

  test('collision segments carry the half thickness, z = -y', () => {
    const { collision } = buildGallery({ plan: { walls: [{ points: [[0, 0], [7, 2]] }] }, thickness: 0.4 });

    expect(collision).toEqual([[0, -0, 7, -2, 0.2]]);
  });

  test('a ramp rises along its corridor and the wall base follows', () => {
    const scene = { plan: { walls: [], corridors: [{ points: [[0, 0], [24, 0]], width: 2, h0: 0, h1: 1 }], floors: [] } };
    const b = buildGallery(scene);

    expect(b.floorHeightAt(12, 0)).toBeCloseTo(0.5);
    expect(b.floorHeightAt(24, 0.9)).toBeCloseTo(1);
    expect(b.floorHeightAt(12, 2)).toBeNull();
    expect(b.warnings).toEqual([]);
    expect(Math.max(...b.groups.wallTop.position.filter((_, i) => i % 3 === 1))).toBeCloseTo(4.2);
  });

  test('a ramp steeper than 1:12 and a corner sharper than 90 degrees warn', () => {
    const steep = buildGallery({ plan: { corridors: [{ points: [[0, 0], [10, 0]], h0: 0, h1: 1 }] } });
    const sharp = buildGallery({ plan: { walls: [{ points: [[0, 0], [10, 0], [1, 2]], closed: true }] } });

    expect(steep.warnings.map(w => w.code)).toEqual(['slope']);
    expect(sharp.warnings.map(w => w.code)).toContain('corner');
    expect(buildGallery(room()).warnings).toEqual([]);
  });

  test('later floors win, outside every floor is void, start gets the floor height', () => {
    const scene = { plan: { walls: [], floors: [{ type: 'room', points: square(), h: 0 }, { type: 'room', points: [[2, 2], [6, 2], [6, 6], [2, 6]], h: 0.5 }] }, start: { at: [3, 3], look: 90 } };
    const b = buildGallery(scene);

    expect(b.floorHeightAt(1, 1)).toBe(0);
    expect(b.floorHeightAt(3, 3)).toBe(0.5);
    expect(b.floorHeightAt(20, 20)).toBeNull();
    expect(b.start).toEqual({ x: 3, y: 3, look: 90, h: 0.5 });
  });

  test('200 polylines x 50 points build fast (design target 100 ms, bound loose for a busy machine)', () => {
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const walls = Array.from({ length: 200 }, () => {
      let [x, y] = [rnd() * 100, rnd() * 100];

      return { points: Array.from({ length: 50 }, () => [(x += rnd() * 6 - 3), (y += rnd() * 6 - 3)]) };
    });
    const t = performance.now();

    buildGallery({ plan: { walls } });
    expect(performance.now() - t).toBeLessThan(300);
  });
});

describe('corridor wall height', () => {
  const top = c => Math.max(...buildGallery({ plan: { corridors: [{ points: [[0, 0], [8, 0]], ...c }] } }).groups.wallTop.position.filter((_, i) => i % 3 === 1));

  test('a corridor wall is as high as given, else full height', () => {
    expect(top({})).toBeCloseTo(3.2);
    expect(top({ wallHeight: 0.9 })).toBeCloseTo(0.9);
  });

  test('the auto plan joins its rooms by low bridges, and can be told otherwise', () => {
    expect(autoPlan(40).plan.corridors[0].wallHeight).toBe(1);
    expect(autoPlan(40, { parapet: null }).plan.corridors[0].wallHeight).toBeUndefined();
  });
});

describe('autoPlan', () => {
  test('a few children get one closed room', () => {
    const p = autoPlan(5);

    expect(p.plan.walls.length).toBe(1);
    expect(p.plan.walls[0].closed).toBe(true);
    expect(p.plan.corridors).toEqual([]);
  });

  test('every child gets a slot and the rooms are joined by corridors', () => {
    for(const n of [0, 1, 30, 31, 100]) {
      const p = autoPlan(n);

      expect(slots(p).length).toBeGreaterThanOrEqual(n);
      expect(p.plan.corridors.length).toBe(p.plan.floors.length - 1);
      expect(buildGallery(p).warnings).toEqual([]);
    }
    expect(autoPlan(100).plan.floors.length).toBeGreaterThan(autoPlan(30).plan.floors.length);
  });

  test('the start is on a floor and each corridor joins two room floors', () => {
    const p = autoPlan(60);
    const b = buildGallery(p);

    expect(b.floorHeightAt(b.start.x, b.start.y)).toBe(0);
    for(const c of p.plan.corridors) {
      expect(b.floorHeightAt(c.points[0][0] - 0.5, c.points[0][1])).toBe(0);
      expect(b.floorHeightAt(c.points[1][0] + 0.5, c.points[1][1])).toBe(0);
    }
  });

  test('walls hang only inside: every slot is on a floor', () => {
    const p = autoPlan(60);
    const b = buildGallery(p);

    for(const s of slots(p)) expect(b.floorHeightAt(s.x, s.y)).toBe(0);
  });
});
