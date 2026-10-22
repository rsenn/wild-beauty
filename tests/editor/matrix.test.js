// bun test: client/editor/matrix.js
import { describe, expect, test } from 'bun:test';
import { apply, decompose, fromSimilarity, identity, invert, multiply } from '../../client/editor/matrix.js';

const close = (actual, expected) => actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9));

describe('matrix', () => {
  test('identity leaves points and matrices alone', () => {
    const m = [2, 1, -1, 3, 5, 7];

    expect(apply(identity(), [3, 4])).toEqual([3, 4]);
    expect(multiply(identity(), m)).toEqual(m);
    expect(multiply(m, identity())).toEqual(m);
  });

  test('inverse undoes the matrix', () => {
    const m = [2, 1, -1, 3, 5, 7];

    close(multiply(m, invert(m)), identity());
    close(multiply(invert(m), m), identity());
    close(apply(invert(m), apply(m, [10, -4])), [10, -4]);
    expect(invert([1, 2, 2, 4, 0, 0])).toBeNull();
  });

  test('multiply applies the right matrix first', () => {
    const move = fromSimilarity({ tx: 10, ty: 0 });
    const scale = fromSimilarity({ scale: 2 });

    expect(apply(multiply(move, scale), [1, 1])).toEqual([12, 2]);
    expect(apply(multiply(scale, move), [1, 1])).toEqual([22, 2]);
  });

  test('rotation by 90 degrees', () => {
    const m = fromSimilarity({ rotation: Math.PI / 2 });

    close(apply(m, [1, 0]), [0, 1]);
    close(apply(m, [0, 1]), [-1, 0]);
  });

  test('decompose reads back fromSimilarity', () => {
    const s = { scale: 1.5, rotation: -0.7, tx: 12, ty: -3 };
    const d = decompose(fromSimilarity(s));

    for(const key of Object.keys(s)) expect(d[key]).toBeCloseTo(s[key], 9);
  });
});
