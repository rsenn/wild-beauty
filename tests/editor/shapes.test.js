// bun test: client/editor/shapes.js
import { describe, expect, test } from 'bun:test';
import { bounds, breakSymmetry, deleteVertex, hitTest, insertVertex, joinSymmetry, moveHandle, moveVertex, nearest, pathFromVertices, segments, verticesFromPath } from '../../client/editor/shapes.js';

const line = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
const curve = [{ x: 0, y: 0, hout: [10, 0] }, { x: 20, y: 20, hin: [-10, 0], hout: [10, 0] }, { x: 40, y: 0, hin: [-10, 0] }];

describe('pathFromVertices', () => {
  test('lines', () => {
    expect(pathFromVertices(line)).toBe('M0 0L10 0L10 10');
    expect(pathFromVertices(line, true)).toBe('M0 0L10 0L10 10Z');
    expect(pathFromVertices([])).toBe('');
  });

  test('curves use C with absolute control points', () => {
    expect(pathFromVertices(curve)).toBe('M0 0C10 0 10 20 20 20C30 20 30 0 40 0');
  });

  test('a closing curve is written out before Z', () => {
    const d = pathFromVertices([{ x: 0, y: 0, hin: [-5, 5] }, { x: 10, y: 0, hout: [5, 5] }], true);

    expect(d).toBe('M0 0L10 0C15 5 -5 5 0 0Z');
  });
});

describe('verticesFromPath', () => {
  test('round trip is stable for lines and curves, open and closed', () => {
    const shapes = [[line, false], [line, true], [curve, false], [curve, true],
      [[{ x: 0.37, y: 1.5, hin: [-2.25, 1] }, { x: 9, y: 3, hout: [2.25, -1] }, { x: 4, y: 8 }], true]];

    for(const [v, closed] of shapes) {
      const d = pathFromVertices(v, closed);
      const back = verticesFromPath(d);

      expect(back.closed).toBe(closed);
      expect(pathFromVertices(back.vertices, back.closed)).toBe(d);
    }
  });

  test('symmetric handles are not broken, asymmetric ones are', () => {
    const { vertices } = verticesFromPath('M0 0C10 0 10 20 20 20C35 20 30 0 40 0');

    expect(vertices[1].broken).toBe(true);
    expect(vertices[0].broken).toBeUndefined();
  });

  test('rejects what it does not write', () => {
    expect(verticesFromPath('')).toBeNull();
    expect(verticesFromPath('L1 1')).toBeNull();
    expect(verticesFromPath('M0 0Q1 1 2 2')).toBeNull();
    expect(verticesFromPath('M0 0L1')).toBeNull();
    expect(verticesFromPath('M0 0ZL1 1')).toBeNull();
  });
});

describe('vertex operations', () => {
  test('insert on a line splits it', () => {
    const v = insertVertex(line, 0, 0.5);

    expect(v.map(q => [q.x, q.y])).toEqual([[0, 0], [5, 0], [10, 0], [10, 10]]);
    expect(line.length).toBe(3);
  });

  test('insert on a curve keeps the curve', () => {
    const v = insertVertex(curve, 0, 0.5);
    const before = segments(curve)[0];
    const after = segments(v);

    expect(v.length).toBe(4);
    for(const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const p = t < 0.5 ? after[0].get(t * 2) : after[1].get((t - 0.5) * 2);
      const q = before.get(t);

      expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThan(0.1);
    }
  });

  test('insert on the closing segment appends', () => {
    const v = insertVertex(line, 2, 0.5, true);

    expect(v.length).toBe(4);
    expect([v[3].x, v[3].y]).toEqual([5, 5]);
  });

  test('insert ignores a bad segment or t', () => {
    expect(insertVertex(line, 5, 0.5)).toEqual(line);
    expect(insertVertex(line, 0, 0)).toEqual(line);
  });

  test('move keeps the handles', () => {
    const v = moveVertex(curve, 1, 25, 5);

    expect([v[1].x, v[1].y, v[1].hin]).toEqual([25, 5, [-10, 0]]);
  });

  test('delete', () => {
    expect(deleteVertex(line, 1).map(q => q.x)).toEqual([0, 10]);
  });

  test('moveHandle mirrors until the symmetry is broken', () => {
    let v = moveHandle(curve, 1, 'hout', 5, 5);

    expect(v[1].hin).toEqual([-5, -5]);

    v = moveHandle(breakSymmetry(curve, 1), 1, 'hout', 5, 5);
    expect(v[1].hin).toEqual([-10, 0]);
    expect(v[1].hout).toEqual([5, 5]);

    v = joinSymmetry(v, 1);
    expect(v[1].broken).toBeUndefined();
    expect(v[1].hout).toEqual([10, 0]);
  });
});

describe('hit-testing', () => {
  test('a point near a curve is hit, a far one not', () => {
    const n = nearest(curve, false, { x: 20, y: 22 });

    expect(n.d).toBeCloseTo(2, 0);
    expect(hitTest(curve, false, { x: 20, y: 22 }, 3)).not.toBeNull();
    expect(hitTest(curve, false, { x: 20, y: 30 }, 3)).toBeNull();
  });

  test('reports the segment', () => {
    expect(hitTest(line, false, { x: 11, y: 7 }, 2).seg).toBe(1);
    expect(hitTest(line, true, { x: 4, y: 6 }, 1.5).seg).toBe(2);
  });

  test('no segments, no hit', () => {
    expect(nearest([{ x: 0, y: 0 }], false, { x: 0, y: 0 })).toBeNull();
  });
});

describe('bounds', () => {
  test('the curve, not the handles', () => {
    const b = bounds(curve);

    expect(b.x).toBe(0);
    expect(b.w).toBe(40);
    expect(b.y).toBeLessThan(0.01);
    expect(b.h).toBeLessThanOrEqual(20);
  });

  test('empty', () => {
    expect(bounds([])).toBeNull();
  });
});
