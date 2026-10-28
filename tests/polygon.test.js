// bun test: polygon area, point in polygon and the split along a stroke (E121)
import { describe, expect, test } from 'bun:test';
import { area, contains, cutByStroke, extendStroke, splitByLine } from '../client/editor/polygon.js';

const square = [[0, 0], [100, 0], [100, 100], [0, 100]];
const total = pieces => pieces.reduce((sum, p) => sum + Math.abs(area(p)), 0);

describe('area and contains', () => {
  test('signed area follows the winding', () => {
    expect(area(square)).toBe(10000);
    expect(area([...square].reverse())).toBe(-10000);
  });

  test('contains is even-odd', () => {
    expect(contains(square, [50, 50])).toBe(true);
    expect(contains(square, [150, 50])).toBe(false);
  });
});

describe('splitByLine', () => {
  test('a straight stroke across a square gives two halves', () => {
    const [a, b] = splitByLine(square, [[50, -10], [50, 110]]);

    expect(Math.abs(area(a))).toBeCloseTo(5000);
    expect(Math.abs(area(b))).toBeCloseTo(5000);
    expect(contains(a, [25, 50]) !== contains(b, [25, 50])).toBe(true);
    expect(contains(a, [75, 50]) !== contains(b, [75, 50])).toBe(true);
  });

  test('a diagonal cutting a corner gives a triangle and a pentagon', () => {
    const pieces = splitByLine(square, [[-10, 10], [90, 110]]);

    expect(pieces.map(p => p.length).sort()).toEqual([3, 5]);
    expect(total(pieces)).toBeCloseTo(10000);
  });

  test('a bent stroke keeps the whole area and does not tangle', () => {
    const pieces = splitByLine(square, [[30, -10], [30, 40], [70, 60], [70, 110]]);

    expect(pieces).not.toBeNull();
    expect(total(pieces)).toBeCloseTo(10000);
    expect(contains(pieces[0], [10, 50]) !== contains(pieces[1], [10, 50])).toBe(true);
  });

  test('the pieces keep the winding of the polygon', () => {
    const cw = [...square].reverse();
    const pieces = splitByLine(cw, [[50, -10], [50, 110]]);

    for(const p of pieces) expect(Math.sign(area(p))).toBe(Math.sign(area(cw)));
  });

  test('a concave polygon splits into two pieces', () => {
    const ell = [[0, 0], [100, 0], [100, 40], [40, 40], [40, 100], [0, 100]];
    const pieces = splitByLine(ell, [[-10, 20], [110, 20]]);

    expect(pieces).not.toBeNull();
    expect(total(pieces)).toBeCloseTo(area(ell));
  });

  test('fewer or more than two crossings give null', () => {
    expect(splitByLine(square, [[50, -10], [50, 50]])).toBeNull();
    expect(splitByLine(square, [[150, 0], [160, 100]])).toBeNull();

    const u = [[0, 0], [100, 0], [100, 100], [70, 100], [70, 30], [30, 30], [30, 100], [0, 100]];

    expect(splitByLine(u, [[-10, 60], [110, 60]])).toBeNull();
  });

  test('a stroke that starts inside and returns gives null', () => {
    expect(splitByLine(square, [[50, 50], [150, 50], [150, 80], [90, 80]])).toBeNull();
  });

  test('a crossing at a vertex is ambiguous and gives null', () => {
    expect(splitByLine(square, [[-10, 0], [110, 0]])).toBeNull();
    expect(splitByLine(square, [[0, -10], [0, 110]])).toBeNull();
    expect(splitByLine(square, [[-10, -10], [110, 110]])).toBeNull();
  });

  test('a stroke that crosses itself inside gives null', () => {
    expect(splitByLine(square, [[20, -10], [20, 40], [80, 40], [80, 20], [40, 20], [40, 60], [60, 110]])).toBeNull();
  });

  test('a degenerate input gives null', () => {
    expect(splitByLine([[0, 0], [1, 1]], [[0, 0], [1, 1]])).toBeNull();
    expect(splitByLine(square, [[1, 1]])).toBeNull();
    expect(splitByLine(square, null)).toBeNull();
  });
});

describe('cutByStroke', () => {
  test('a stroke wholly inside, ending near the border, is extended and cuts', () => {
    const pieces = cutByStroke(square, [[50, 15], [50, 50], [50, 85]], 30);

    expect(pieces).not.toBeNull();
    expect(Math.abs(area(pieces[0]))).toBeCloseTo(5000);
    expect(Math.abs(area(pieces[1]))).toBeCloseTo(5000);
  });

  test('the extension follows the heading of the end, not the nearest edge', () => {
    const out = extendStroke(square, [[20, 10], [50, 40], [80, 70]], 50);
    const last = out[out.length - 1];
    const first = out[0];

    // heading down-right it leaves through the right edge, up-left through the top
    expect(last[0]).toBeGreaterThan(100);
    expect(last[1]).toBeLessThan(100);
    expect(first[1]).toBeLessThan(0);
    expect(first[0]).toBeGreaterThan(0);
  });

  test('an end heading at a corner is ambiguous and is not extended', () => {
    expect(extendStroke(square, [[20, 20], [50, 50], [80, 80]], 50)).toHaveLength(3);
  });

  test('an end too far from the border is not extended, so there is no cut', () => {
    expect(cutByStroke(square, [[50, 40], [50, 50], [50, 60]], 30)).toBeNull();
  });

  test('a stroke along the border cuts off a thin sliver', () => {
    const pieces = cutByStroke(square, [[10, 5], [50, 5], [90, 5]], 30);

    expect(pieces).not.toBeNull();
    expect(pieces.map(p => Math.round(Math.abs(area(p)))).sort((a, b) => a - b)).toEqual([500, 9500]);
  });

  test('one end already outside, the other near the border', () => {
    const pieces = cutByStroke(square, [[50, -20], [50, 40], [50, 80]], 30);

    expect(pieces).not.toBeNull();
    expect(total(pieces)).toBeCloseTo(10000);
  });

  test('a curved stroke keeps the whole area', () => {
    const pieces = cutByStroke(square, [[20, 12], [35, 30], [50, 45], [65, 62], [80, 88]], 30);

    expect(pieces).not.toBeNull();
    expect(total(pieces)).toBeCloseTo(10000);
  });

  test('a stroke that has not moved or a missing reach changes nothing', () => {
    expect(cutByStroke(square, [[50, 50], [50, 50]], 30)).toBeNull();
    expect(cutByStroke(square, [[50, 15], [50, 85]], 0)).toBeNull();
  });

  test('a stroke pointing at a corner is a valid cut', () => {
    const pieces = cutByStroke(square, [[20, 20], [50, 50], [80, 80]], 50);

    expect(pieces).not.toBeNull();
    expect(total(pieces)).toBeCloseTo(10000);

    for(const p of pieces) expect(Math.abs(Math.abs(area(p)) - 5000)).toBeLessThan(200);
  });

  test('a stroke starting at a corner and ending at the bottom gives two big pieces', () => {
    const pieces = cutByStroke(square, [[4, 3], [30, 40], [48, 80], [55, 97]], 30);

    expect(pieces).not.toBeNull();
    expect(total(pieces)).toBeCloseTo(10000);

    for(const p of pieces) expect(Math.abs(area(p))).toBeGreaterThan(2000);
  });

  test('a stroke along an edge is a sliver and gives null', () => {
    expect(cutByStroke(square, [[-10, 0], [110, 0]], 30)).toBeNull();
    expect(cutByStroke(square, [[0, -10], [0, 110]], 30)).toBeNull();
  });

  test('a piece under the minimum is refused, over it is accepted', () => {
    const stroke = [[10, 1], [50, 1], [90, 1]];

    expect(cutByStroke(square, stroke, 30)).toBeNull();
    expect(cutByStroke(square, stroke, 30, 0.005)).not.toBeNull();
  });
});
