// bun test: client/editor/gesture.js, setMatrix and the wheel/key similarity
import { describe, expect, test } from 'bun:test';
import { createGesture } from '../../client/editor/gesture.js';
import { aboutPoint } from '../../client/editor/gestures.js';
import { apply as applyMatrix, decompose, multiply } from '../../client/editor/matrix.js';
import { emptyNode, findStep, setMatrix, validate } from '../../client/editor/model.js';

const I = [1, 0, 0, 1, 0, 0];
const close = (a, b, d = 1e-9) => a.every((v, i) => Math.abs(v - b[i]) < d);

describe('one pointer', () => {
  test('moves the step by the distance travelled, and a tap does not move it', () => {
    const g = createGesture(I);

    g.down(1, [100, 100]);
    expect(g.move(1, [102, 101])).toBeNull(); // inside the slop
    expect(g.moved).toBe(false);
    expect(close(g.move(1, [150, 130]), [1, 0, 0, 1, 50, 30])).toBe(true);
    expect(g.up(1)).toBe(0);
  });

  test('composes onto the start matrix', () => {
    const g = createGesture([2, 0, 0, 2, 10, 10]);

    g.down(1, [0, 0]);
    expect(close(g.move(1, [20, 0]), [2, 0, 0, 2, 30, 10])).toBe(true);
  });
});

describe('two pointers', () => {
  test('pinch out doubles the scale about the fingers, rotating turns the step', () => {
    const g = createGesture(I);

    g.down(1, [400, 500]);
    g.down(2, [600, 500]);
    g.move(1, [300, 500]);

    const m = g.move(2, [700, 500]);

    expect(decompose(m).scale).toBeCloseTo(2, 9);
    expect(applyMatrix(m, [400, 500])[0]).toBeCloseTo(300, 9);

    const h = createGesture(I);

    h.down(1, [400, 500]);
    h.down(2, [600, 500]);
    h.move(1, [500, 400]);

    const r = h.move(2, [500, 600]);

    expect(decompose(r).rotation).toBeCloseTo(Math.PI / 2, 9);
    expect(decompose(r).scale).toBeCloseTo(1, 9);
  });

  test('stable without drift: a long wobble that ends where it began gives the start matrix back', () => {
    const start = [1.3, 0.2, -0.2, 1.3, 40, -25];
    const g = createGesture(start);
    let seed = 7;
    const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5) * 60;

    g.down(1, [300, 400]);
    g.down(2, [650, 550]);

    for(let i = 0; i < 5000; i++) {
      g.move(1, [300 + noise(), 400 + noise()]);
      g.move(2, [650 + noise(), 550 + noise()]);
    }

    g.move(1, [300, 400]);

    expect(close(g.move(2, [650, 550]), start, 1e-9)).toBe(true);
  });

  test('a second finger or a lifted one does not make the step jump', () => {
    const g = createGesture(I);

    g.down(1, [100, 100]);

    const before = g.move(1, [200, 100]);

    g.down(2, [500, 500]); // the second finger lands: no change yet
    expect(close(g.matrix, before)).toBe(true);
    g.move(2, [500, 500]);
    expect(close(g.matrix, before)).toBe(true);
    expect(g.up(2)).toBe(1); // lifted: still no change
    expect(close(g.matrix, before)).toBe(true);
    expect(close(g.move(1, [210, 100]), [1, 0, 0, 1, 110, 0])).toBe(true);
  });
});

describe('Alt: a single pointer turns and scales about a pivot', () => {
  test('the pivot stays put', () => {
    const g = createGesture(I);
    const pivot = [500, 500];

    g.down(1, [700, 500], { alt: true, centre: pivot });

    const m = g.move(1, [500, 800]);

    expect(applyMatrix(m, pivot)[0]).toBeCloseTo(500, 9);
    expect(applyMatrix(m, pivot)[1]).toBeCloseTo(500, 9);
    expect(decompose(m).scale).toBeCloseTo(1.5, 9);
    expect(decompose(m).rotation).toBeCloseTo(Math.PI / 2, 9);
  });
});

describe('aboutPoint', () => {
  test('keeps the point fixed', () => {
    const m = aboutPoint(1.5, 0.7, [300, 200]);

    expect(applyMatrix(m, [300, 200])[0]).toBeCloseTo(300, 9);
    expect(applyMatrix(m, [300, 200])[1]).toBeCloseTo(200, 9);
    expect(decompose(m).scale).toBeCloseTo(1.5, 9);
    expect(close(multiply(aboutPoint(2, 0, [5, 5]), I), aboutPoint(2, 0, [5, 5]))).toBe(true);
  });
});

describe('setMatrix', () => {
  const doc = (...steps) => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
  const photo = { op: 'photo', id: 'photo001', photo: 'a'.repeat(64), m: I, crop: 0.5, opacity: 1, blend: 'normal' };
  const stroke = { op: 'stroke', id: 'strok001', pts: [[1, 1, 2]], color: '#000000' };
  const m = [2, 0, 0, 2, 5, 6];

  test('a photo takes it in its own matrix', () => {
    expect(findStep(setMatrix(doc(photo), 'photo001', m), 'photo001').step).toMatchObject({ m });
  });

  test('a stroke gets one transform step, later calls update it', () => {
    const once = setMatrix(doc(stroke), 'strok001', m);
    const twice = setMatrix(once, 'strok001', [1, 0, 0, 1, 9, 9]);

    expect(once.pages[0].steps.at(-1)).toEqual({ op: 'transform', target: 'strok001', m });
    expect(twice.pages[0].steps.filter(s => s.op === 'transform')).toEqual([{ op: 'transform', target: 'strok001', m: [1, 0, 0, 1, 9, 9] }]);
    expect(validate(twice)).toEqual([]);
  });

  test('an existing transform step wins over the photo\'s own matrix', () => {
    const d = doc(photo, { op: 'transform', target: 'photo001', m: [3, 0, 0, 3, 0, 0] });
    const next = setMatrix(d, 'photo001', m);

    expect(next.pages[0].steps[1].m).toEqual(m);
    expect(next.pages[0].steps[0].m).toEqual(I);
  });

  test('bad matrices and unknown steps change nothing', () => {
    const d = doc(photo);

    for(const bad of [[1, 0, 0, 1, 0], [NaN, 0, 0, 1, 0, 0], [1, 0, 0, 1, 1e9, 0], null, 'x']) expect(setMatrix(d, 'photo001', bad)).toBe(d);
    expect(setMatrix(d, 'nothing1', m)).toBe(d);
  });
});
