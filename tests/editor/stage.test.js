// bun test: client/editor/stage.js
import { describe, expect, test } from 'bun:test';
import { STAGE, pixelsPerUnit, toClient, toUnits } from '../../client/editor/stage.js';

const rect = (left, top, side) => ({ left, top, width: side, height: side });

describe('toUnits', () => {
  test('the corners and the centre at two sizes', () => {
    for(const [box, side] of [[rect(10, 20, 500), 500], [rect(0, 0, 320), 320], [rect(77.5, 3.25, 1234), 1234]]) {
      const at = (fx, fy) => toUnits(box, box.left + fx * side, box.top + fy * side);

      expect(at(0, 0)).toEqual([0, 0]);
      expect(at(1, 1)[0]).toBeCloseTo(STAGE, 9);
      expect(at(1, 1)[1]).toBeCloseTo(STAGE, 9);
      expect(at(0.5, 0.5)[0]).toBeCloseTo(500, 9);
      expect(at(0.25, 0.75)[0]).toBeCloseTo(250, 9);
      expect(at(0.25, 0.75)[1]).toBeCloseTo(750, 9);
    }
  });

  test('the same unit position from boxes of different size', () => {
    const small = rect(100, 100, 250);
    const large = rect(40, 60, 800);

    expect(toUnits(small, 100 + 0.3 * 250, 100 + 0.6 * 250)[0]).toBeCloseTo(toUnits(large, 40 + 0.3 * 800, 60 + 0.6 * 800)[0], 9);
  });

  test('outside the stage is not clamped; a box without size is null', () => {
    expect(toUnits(rect(0, 0, 100), -10, 150)).toEqual([-100, 1500]);
    expect(toUnits(rect(0, 0, 0), 5, 5)).toBeNull();
    expect(toUnits({ left: 0, top: 0, width: 10, height: 0 }, 5, 5)).toBeNull();
  });
});

describe('toClient and pixelsPerUnit', () => {
  test('round trip', () => {
    const box = rect(33, 44, 640);
    const [cx, cy] = toClient(box, 250, 800);

    expect(toUnits(box, cx, cy)).toEqual([250, 800]);
  });

  test('pixels per unit', () => {
    expect(pixelsPerUnit(500)).toBe(0.5);
    expect(pixelsPerUnit(2000)).toBe(2);
    expect(pixelsPerUnit(0)).toBe(1);
  });
});
