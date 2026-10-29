// bun test: the drawn plan of a gallery node -> the scene3d document (client/gallery/fromdoc.js)
import { describe, expect, test } from 'bun:test';
import node9 from './fixtures/node9.json';
import { buildGallery } from '../client/gallery/build.js';
import { cutRoom, planFromDoc, trimCorridor } from '../client/gallery/fromdoc.js';
import { slots } from '../client/gallery/hang.js';
import { contains } from '../client/editor/polygon.js';

// node 9 ("Sous-soul Vitrines"): two rooms, two corridors drawn with the room aid
describe('planFromDoc', () => {
  const plan = planFromDoc(node9.doc);

  test('two rooms and two corridors; every corridor cuts a doorway in both rooms', () => {
    expect(plan.type).toBe('scene3d');
    expect(plan.plan.floors.length).toBe(2);
    expect(plan.plan.corridors.length).toBe(2);
    expect(plan.plan.walls.length).toBe(4); // each room is two open wall runs between its doorways
    expect(plan.plan.walls.every(w => !w.closed && w.height === 3.2)).toBe(true);
  });

  test('corridor walls are a parapet, room walls keep their height', () => {
    expect(plan.plan.corridors.every(c => c.wallHeight === 1)).toBe(true); // drawn with the old default of 3.2 m
    expect(plan.plan.walls.every(w => w.height === 3.2)).toBe(true);

    const line = { op: 'shape', id: 'l', path: 'M0 0 L100 0', closed: false, wall: { height: 2.4, width: 2 } };
    const doc = JSON.parse(JSON.stringify(node9.doc));

    expect(planFromDoc(doc).plan.corridors.length).toBe(2);
    doc.pages[0].steps.push(line);
    expect(planFromDoc(doc).plan.corridors.at(-1).wallHeight).toBe(2.4); // a height the owner chose
  });

  test('a corridor ends at the wall of the rooms it joins and keeps its width', () => {
    for(const c of plan.plan.corridors) {
      expect(c.width).toBe(2);
      expect(plan.plan.floors.some(f => contains(f.points, c.points[0]) || contains(f.points, [c.points[0][0], c.points[0][1] + 0.01]) || contains(f.points, [c.points[0][0], c.points[0][1] - 0.01]))).toBe(true);
    }

    expect(plan.plan.corridors[0].points[0][1]).toBeCloseTo(-20.3, 1); // the south wall of the upper room
  });

  test('the start is inside a room, the builder has nothing to warn about and pictures hang', () => {
    const built = buildGallery(plan);

    expect(contains(plan.plan.floors[0].points, plan.start.at)).toBe(true);
    expect(built.warnings).toEqual([]);

    const all = slots(plan);

    expect(all.length).toBeGreaterThan(20);

    // every picture faces into a room, never into a doorway or outside
    for(const s of all) expect(plan.plan.floors.some(f => contains(f.points, [s.x + s.nx * 0.5, s.y + s.ny * 0.5]))).toBe(true);
  });

  test('no walls, no plan: the auto plan stays in charge', () => {
    expect(planFromDoc({ v: 1, style: {}, mode: 'free', pages: [{ id: 'p', steps: [] }] })).toBeNull();
    expect(planFromDoc(undefined)).toBeNull();
  });
});

describe('cutRoom and trimCorridor', () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];

  test('a room without a corridor stays one closed wall', () => {
    expect(cutRoom(square, [])).toEqual([{ points: square, closed: true }]);
    expect(cutRoom(square, [{ points: [[20, 20], [30, 30]], width: 2 }]).length).toBe(1);
  });

  test('a corridor through a wall leaves a gap as wide as the corridor', () => {
    const [run] = cutRoom(square, [{ points: [[5, 5], [5, -5]], width: 2 }]);

    expect(run.closed).toBe(false);

    const [a, b] = [run.points[0], run.points[run.points.length - 1]];

    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeCloseTo(2, 6); // the run's ends bound the doorway
  });

  test('a corridor is cut back to the wall of the room it starts in', () => {
    expect(trimCorridor([[5, 5], [5, -5], [5, -20]], [square])).toEqual([[5, 0], [5, -5], [5, -20]]);
    expect(trimCorridor([[5, 5], [5, -5]], [])).toEqual([[5, 5], [5, -5]]);
  });
});

describe('the guided order goes to the right', () => {
  test('neighbouring pictures on a wall follow each other to the right of a visitor facing the wall', async () => {
    const { autoPlan } = await import('../client/gallery/autoplan.js');

    for(const plan of [autoPlan(12), planFromDoc(node9.doc)]) {
      const all = slots(plan);
      let pairs = 0;

      for(let i = 0; i + 1 < all.length; i++) {
        const [a, b] = [all[i], all[i + 1]];

        if(a.nx !== b.nx || a.ny !== b.ny) continue;

        const right = [-a.ny, a.nx]; // right of someone looking along -n (the picture faces +n)

        expect((b.x - a.x) * right[0] + (b.y - a.y) * right[1]).toBeGreaterThan(0);
        pairs++;
      }

      expect(pairs).toBeGreaterThan(5);
    }
  });
});
