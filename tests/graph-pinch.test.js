// bun test: the graph view's pinch (client/graph/pinch.js) when fingers come and go
import { describe, expect, test } from 'bun:test';
import { afterLift, fingers, pinchZoom } from '../client/graph/pinch.js';

const down = (...points) => new Map(points.map((p, i) => [i + 1, p]));

describe('pinch', () => {
  test('two fingers zoom by the change of their distance, within the limits', () => {
    const g = { pinch: true, d: 100, k: 1 };

    expect(pinchZoom(g, down({ x: 0, y: 0 }, { x: 200, y: 0 }))).toBe(2);
    expect(pinchZoom(g, down({ x: 0, y: 0 }, { x: 900, y: 0 }))).toBe(4);
    expect(pinchZoom(g, down({ x: 0, y: 0 }, { x: 10, y: 0 }), { min: 0.5 })).toBe(0.5);
  });

  test('with one finger there is nothing to zoom by, and no error (it read undefined.x on every move)', () => {
    expect(fingers(down({ x: 5, y: 5 }))).toBeNull();
    expect(pinchZoom({ pinch: true, d: 100, k: 1 }, down({ x: 5, y: 5 }))).toBeNull();
    expect(pinchZoom({ pinch: true, d: 100, k: 1 }, down())).toBeNull();
    expect(pinchZoom({ pinch: true, d: 0, k: 1 }, down({ x: 0, y: 0 }, { x: 1, y: 1 }))).toBeNull();
  });

  test('a finger lifts: the other carries on as a pan from where it is, not as a tap', () => {
    const g = { pinch: true, d: 100, k: 1 };
    const next = afterLift(g, down({ x: 40, y: 60 }), { x: 10, y: 20 });

    expect(next).toEqual({ pan: true, x: 30, y: 40, moved: true, start: { x: 40, y: 60 } });
  });

  test('the last finger lifts: the gesture ends; a third finger keeps the pinch; a stray lift does not invent one', () => {
    const g = { pinch: true, d: 100, k: 1 };

    expect(afterLift(g, down(), { x: 0, y: 0 })).toBeNull();
    expect(afterLift(g, down({ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }), { x: 0, y: 0 })).toBe(g);
    expect(afterLift(null, down({ x: 1, y: 1 }), { x: 0, y: 0 })).toBeNull();
    expect(afterLift({ node: 'a' }, down({ x: 1, y: 1 }), { x: 0, y: 0 })).toBeNull();
  });
});
