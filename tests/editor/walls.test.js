// bun test: client/editor/walls.js and the wall commands (E75)
import { describe, expect, test } from 'bun:test';
import { acuteCorner, cornerAngle, isWall, wallProblem } from '../../client/editor/walls.js';
import { apply } from '../../client/editor/commands.js';
import { emptyNode, findStep, validate } from '../../client/editor/model.js';
import { pathFromVertices } from '../../client/editor/shapes.js';

const pts = (...p) => p.map(([x, y]) => ({ x, y }));
const square = pts([0, 0], [100, 0], [100, 100], [0, 100]);

describe('corners', () => {
  test('cornerAngle: straight, right angle, folded back', () => {
    expect(cornerAngle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 })).toBeCloseTo(180, 9);
    expect(cornerAngle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 })).toBeCloseTo(90, 9);
    expect(cornerAngle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 1 })).toBeLessThan(10);
    expect(cornerAngle({ x: 5, y: 5 }, { x: 5, y: 5 }, { x: 0, y: 1 })).toBeNull();
  });

  test('a rectangle and an L shape are fine, a sharp wedge is refused', () => {
    expect(acuteCorner(square, true)).toBeNull();
    expect(acuteCorner(pts([0, 0], [100, 0], [100, 50], [50, 50], [50, 100], [0, 100]), true)).toBeNull(); // reflex corner, 270 inside
    expect(acuteCorner(pts([0, 0], [100, 0], [20, 10]), true)).toMatchObject({ vertex: 0 });
  });

  test('a line: its ends are no corners', () => {
    expect(acuteCorner(pts([0, 0], [100, 0], [100, 100]), false)).toBeNull();
    expect(acuteCorner(pts([0, 0], [100, 0], [10, 20]), false)).toMatchObject({ vertex: 1 });
  });

  test('exactly 90 degrees passes', () => {
    expect(acuteCorner(pts([0, 0], [100, 0], [100, 100]), false)).toBeNull();
  });
});

describe('wall property', () => {
  test('isWall: height 0.5..10, width optional 0.5..10, nothing else', () => {
    expect(isWall({ height: 3.2 })).toBe(true);
    expect(isWall({ height: 3.2, width: 2 })).toBe(true);
    for(const bad of [null, {}, { height: 0.1 }, { height: 11 }, { height: 3, width: 0 }, { height: 3, depth: 1 }, { height: '3' }, [3]]) expect(isWall(bad)).toBe(false);
  });
});

describe('the setWall command', () => {
  const shape = (id, vertices, closed) => ({ op: 'shape', id, path: pathFromVertices(vertices, closed), closed, fill: '#808080', strokeWidth: 0 });
  const gallery = (...steps) => ({ doc: { ...emptyNode(), pages: [{ id: 'page0001', steps }] }, kind: 'gallery' });
  const wallOf = (snap, id) => findStep(snap.doc, id).step.wall;

  test('a room gets a height, a line a width as well', () => {
    let snap = gallery(shape('room0001', square, true), shape('line0001', pts([0, 0], [100, 0], [100, 100]), false));

    snap = apply(snap, { type: 'setWall', id: 'room0001', wall: {} }).snap;
    snap = apply(snap, { type: 'setWall', id: 'line0001', wall: { height: 4 } }).snap;

    expect(wallOf(snap, 'room0001')).toEqual({ height: 3.2 });
    expect(wallOf(snap, 'line0001')).toEqual({ height: 4, width: 2 });
    expect(validate(snap.doc)).toEqual([]);
  });

  test('an acute corner is refused, for the flag, for a vertex move and for opening or closing', () => {
    const wedge = gallery(shape('wedge001', pts([0, 0], [100, 0], [20, 10]), true));

    expect(apply(wedge, { type: 'setWall', id: 'wedge001', wall: {} }).snap).toBe(wedge);

    let snap = apply(gallery(shape('room0001', square, true)), { type: 'setWall', id: 'room0001', wall: {} }).snap;
    const squashed = pts([0, 0], [100, 0], [100, 100], [95, 5]);

    expect(apply(snap, { type: 'setVertices', id: 'room0001', vertices: squashed }).snap).toBe(snap);
    expect(apply(snap, { type: 'setVertices', id: 'room0001', vertices: pts([0, 0], [120, 0], [120, 100], [0, 100]) }).snap).not.toBe(snap);

    snap = apply(snap, { type: 'updateShape', id: 'room0001', changes: { closed: false } }).snap;
    expect(wallOf(snap, 'room0001')).toEqual({ height: 3.2, width: 2 }); // a line now
  });

  test('only in a gallery; a shape that is not a wall can still have any corner', () => {
    const plain = { ...gallery(shape('room0001', square, true)), kind: 'node' };

    expect(apply(plain, { type: 'setWall', id: 'room0001', wall: {} }).snap).toBe(plain);
    expect(apply(plain, { type: 'setVertices', id: 'room0001', vertices: pts([0, 0], [100, 0], [20, 30]) }).snap).not.toBe(plain);
  });

  test('bad height, unknown step and removing the flag', () => {
    const snap = apply(gallery(shape('room0001', square, true)), { type: 'setWall', id: 'room0001', wall: { height: 3 } }).snap;

    expect(apply(snap, { type: 'setWall', id: 'room0001', wall: { height: 99 } }).snap).toBe(snap);
    expect(apply(snap, { type: 'setWall', id: 'nothing1', wall: { height: 3 } }).snap).toBe(snap);
    expect(wallOf(apply(snap, { type: 'setWall', id: 'room0001', wall: null }).snap, 'room0001')).toBeUndefined();
    expect(wallProblem(findStep(snap.doc, 'room0001').step)).toBeNull();
  });
});
