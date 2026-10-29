// bun test: the room aid of a gallery node (client/editor/roomaid.js)
import { describe, expect, test } from 'bun:test';
import { STEP, canClose, corridorOf, corridorStep, roomsOf, snapVertex, wallOf } from '../../client/editor/roomaid.js';
import { pathFromVertices } from '../../client/editor/shapes.js';
import { acuteCorner, isWall } from '../../client/editor/walls.js';

const v = (...pts) => pts.map(([x, y]) => ({ x, y }));
const near = (a, b) => expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(0.02);

describe('snapVertex', () => {
  test('the first vertex goes on the grid', () => {
    expect(snapVertex([], [123, 77])).toEqual([120, 80]);
  });

  test('the first edge goes in one of 8 directions, whole steps long', () => {
    expect(snapVertex(v([0, 0]), [205, 17])).toEqual([200, 0]);
    near(snapVertex(v([0, 0]), [95, 100]), [3 * STEP * Math.SQRT1_2, 3 * STEP * Math.SQRT1_2]);
    expect(snapVertex(v([0, 0]), [30, 2])).toEqual([STEP, 0]); // at least one step
  });

  test('later edges turn by 0, 45, 90 or 135 degrees only', () => {
    const base = v([0, 0], [120, 0]);

    expect(snapVertex(base, [300, 4])).toEqual([320, 0]); // straight on, 5 steps
    expect(snapVertex(base, [122, 130])).toEqual([120, 120]); // 90 degrees
    near(snapVertex(base, [200, 80]), [120 + 3 * STEP * Math.SQRT1_2, 3 * STEP * Math.SQRT1_2]); // 45 degrees

    const back = snapVertex(base, [0, 2]); // wants a 180 degree turn: held to 135

    expect(back[1]).not.toBe(0);
    expect(back[0]).toBeGreaterThan(120 - 1e-9 - STEP * 3);
  });

  test('every corner of a drawn room is at least 45 degrees', () => {
    let room = [];

    for(const p of [[100, 100], [500, 120], [900, 400], [300, 700], [50, 40], [10, 10]]) room = [...room, ...v(snapVertex(room, p))];

    expect(acuteCorner(room, false)).toBeNull();
  });
});

describe('canClose', () => {
  test('a rectangle closes, a wedge and an off-grid closing edge do not', () => {
    expect(canClose(v([0, 0], [120, 0], [120, 80], [0, 80]))).toBe(true);
    expect(canClose(v([0, 0], [120, 0], [120, 120]))).toBe(true); // a 45 degree triangle
    expect(canClose(v([0, 0], [120, 0], [120, 80]))).toBe(false); // the closing edge is off the 8 directions
    expect(canClose(v([0, 0], [120, 0], [0, 40]))).toBe(false);
    expect(canClose(v([0, 0], [120, 0]))).toBe(false);
    expect(canClose(v([0, 0], [120, 0], [120, 80], [30, 80]))).toBe(false); // closing edge not at a multiple of 45
  });
});

const room = (id, x, y) => wallOf({ op: 'shape', id, closed: true, path: pathFromVertices(v([x, y], [x + 200, y], [x + 200, y + 200], [x, y + 200]), true), fill: '#000' });

describe('corridors', () => {
  const steps = [room('a', 0, 0), room('b', 500, 0), { op: 'shape', id: 'x', closed: true, path: pathFromVertices(v([0, 600], [100, 600], [100, 700]), true) }];
  const rooms = roomsOf(steps);

  test('rooms are the closed wall shapes only', () => {
    expect(rooms.map(r => r.id)).toEqual(['a', 'b']);
  });

  test('a stroke from one room into another becomes a snapped corridor', () => {
    const stroke = Array.from({ length: 30 }, (_, i) => [100 + (i * 500) / 29, 103 + Math.sin(i) * 3]);
    const line = corridorOf(stroke, rooms);

    expect(line).not.toBeNull();
    expect(line.length).toBeGreaterThanOrEqual(2);
    expect(line[0].x).toBe(120);
    expect(line.at(-1).x).toBeGreaterThan(500);
    expect(acuteCorner(line, false)).toBeNull();

    const step = corridorStep(line, 'c', '#fff');

    expect(step).toMatchObject({ op: 'shape', closed: false });
    expect(isWall(step.wall)).toBe(true);
    expect(step.wall.width).toBe(2);
  });

  test('not from a room to itself, not from outside, not into the open', () => {
    expect(corridorOf([[50, 50], [150, 150]], rooms)).toBeNull();
    expect(corridorOf([[300, 100], [600, 100]], rooms)).toBeNull();
    expect(corridorOf([[100, 100], [350, 100]], rooms)).toBeNull();
    expect(corridorOf([[100, 100]], rooms)).toBeNull();
  });
});
