// bun test: client/editor/gestures.js
import { describe, expect, test } from 'bun:test';
import { solveSimilarity } from '../../client/editor/gestures.js';
import { apply } from '../../client/editor/matrix.js';

const near = (actual, expected) => actual.forEach((v, i) => expect(Math.abs(v - expected[i])).toBeLessThan(1e-9));

describe('solveSimilarity', () => {
  test('maps both start points onto the current ones', () => {
    const cases = [
      [[100, 200], [400, 250], [150, 120], [90, 480]],
      [[0, 0], [10, 0], [500, 500], [500, 520]],
      [[-30, 7], [12, -44], [1000, 3], [-8, 8]],
    ];

    for(const [p0, q0, p1, q1] of cases) {
      const m = solveSimilarity(p0, q0, p1, q1);

      near(apply(m, p0), p1);
      near(apply(m, q0), q1);
      // a similarity: no shear, no mirroring
      expect(m[0]).toBeCloseTo(m[3], 12);
      expect(m[1]).toBeCloseTo(-m[2], 12);
    }
  });

  test('one pointer translates only', () => {
    expect(solveSimilarity([10, 20], null, [15, 5])).toEqual([1, 0, 0, 1, 5, -15]);
  });

  test('coincident start points translate', () => {
    expect(solveSimilarity([10, 20], [10, 20], [11, 22], [50, 60])).toEqual([1, 0, 0, 1, 1, 2]);
  });
});
