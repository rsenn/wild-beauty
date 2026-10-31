// bun test: client/editor/hit.js
import { describe, expect, test } from 'bun:test';
import { hitTest, outlineOf } from '../../client/editor/hit.js';
import { emptyNode } from '../../client/editor/model.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const photos = hash => ({ [A]: { width: 400, height: 400 }, [B]: { width: 400, height: 400 } })[hash] ?? null;
const photo = (id, hash, m, extra = {}) => ({ op: 'photo', id, photo: hash, m, fit: 'free', opacity: 1, blend: 'normal', ...extra });
const doc = (...steps) => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
const at = (d, x, y, options = {}) => hitTest(d, [x, y], { photos, ...options });

describe('photos', () => {
  // two 400x400 photos (1000 x 1000 local) scaled by 0.5: A covers 0..500, B covers 250..750
  const two = doc(photo('photoaaa', A, [0.5, 0, 0, 0.5, 0, 0]), photo('photobbb', B, [0.5, 0, 0, 0.5, 250, 250]));

  test('tapping two overlapping photos selects the upper one', () => {
    expect(at(two, 400, 400)).toBe('photobbb');
    expect(at(two, 100, 100)).toBe('photoaaa');
    expect(at(two, 600, 600)).toBe('photobbb');
    expect(at(two, 900, 900)).toBeNull();
  });

  test('order decides: the same photos the other way round', () => {
    const swapped = doc(...two.pages[0].steps.slice().reverse());

    expect(at(swapped, 400, 400)).toBe('photoaaa');
  });

  test('a turned photo is hit where it is, not where its box was', () => {
    // 1000x1000 local rotated 45 degrees about the stage centre: a diamond
    const c = Math.SQRT1_2 * 0.5;
    const d = doc(photo('photoaaa', A, [c, c, -c, c, 500, 0]));

    expect(at(d, 500, 250)).toBe('photoaaa');
    expect(at(d, 30, 30)).toBeNull();
    expect(at(d, 500, 30)).toBe('photoaaa');
    expect(at(d, 600, 30)).toBeNull();
  });

  test('a photo without size information cannot be hit', () => {
    expect(hitTest(two, [100, 100], { photos: () => null })).toBeNull();
  });

  test('a clipped photo is only hit inside its clip shape, and the shape itself is not hit', () => {
    const shape = { op: 'shape', id: 'shape001', path: 'M0 0L200 0L200 200L0 200Z', closed: true, fill: '#ff0000', strokeWidth: 1 };
    const d = doc(shape, photo('photoaaa', A, [1, 0, 0, 1, 0, 0], { clip: 'shape001' }));

    expect(at(d, 100, 100)).toBe('photoaaa');
    expect(at(d, 500, 500)).toBeNull();
    expect(doc(shape) && at(doc(shape), 100, 100)).toBe('shape001');
  });

  test('transform ops move the hit area', () => {
    const d = doc(photo('photoaaa', A, [0.2, 0, 0, 0.2, 0, 0]), { op: 'transform', target: 'photoaaa', m: [0.2, 0, 0, 0.2, 600, 600] });

    expect(at(d, 100, 100)).toBeNull();
    expect(at(d, 700, 700)).toBe('photoaaa');
  });
});

describe('strokes and shapes', () => {
  const stroke = { op: 'stroke', id: 'strok001', pts: [[100, 100, 10], [300, 100, 10], [300, 300, 10]], color: '#000000' };

  test('a stroke is hit near its line, widened by the tolerance', () => {
    const d = doc(stroke);

    expect(at(d, 200, 103)).toBe('strok001');
    expect(at(d, 300, 200)).toBe('strok001');
    expect(at(d, 200, 120, { tolerance: 8 })).toBeNull();
    expect(at(d, 200, 120, { tolerance: 25 })).toBe('strok001');
    expect(at(d, 100, 300)).toBeNull();
  });

  test('a stroke above a photo wins; beside it the photo is hit', () => {
    const d = doc(photo('photoaaa', A, [1, 0, 0, 1, 0, 0]), stroke);

    expect(at(d, 200, 100)).toBe('strok001');
    expect(at(d, 200, 250)).toBe('photoaaa');
  });

  test('a filled shape is hit inside, an unfilled one only on its stroke, an invisible one never', () => {
    const path = 'M100 100L500 100L500 500L100 500Z';
    const filled = { op: 'shape', id: 'shape001', path, closed: true, fill: '#00ff00', strokeWidth: 1 };
    const outlined = { op: 'shape', id: 'shape002', path, closed: true, stroke: '#000000', strokeWidth: 6 };
    const invisible = { op: 'shape', id: 'shape003', path, closed: true, strokeWidth: 1 };

    expect(at(doc(filled), 300, 300)).toBe('shape001');
    expect(at(doc(filled), 50, 50)).toBeNull();
    expect(at(doc(outlined), 300, 300)).toBeNull();
    expect(at(doc(outlined), 300, 102)).toBe('shape002');
    expect(at(doc(invisible), 300, 300)).toBeNull();
    expect(at(doc(invisible), 300, 100)).toBeNull();
  });

  test('a curved shape is hit on the curve', () => {
    const d = doc({ op: 'shape', id: 'shape001', path: 'M0 500C0 0 1000 0 1000 500', closed: false, stroke: '#000000', strokeWidth: 4 });

    expect(at(d, 500, 125, { tolerance: 6 })).toBe('shape001');
    expect(at(d, 500, 400)).toBeNull();
  });
});

describe('outlineOf', () => {
  test('a photo: its turned rectangle', () => {
    const d = doc(photo('photoaaa', A, [0.5, 0, 0, 0.5, 100, 200]));

    expect(outlineOf(d, 'photoaaa', { photos })).toEqual([[100, 200], [600, 200], [600, 700], [100, 700]]);
  });

  test('a stroke and a shape: their bounding box with the line width', () => {
    const d = doc({ op: 'stroke', id: 'strok001', pts: [[100, 100, 10], [300, 200, 10]], color: '#000000' }, { op: 'shape', id: 'shape001', path: 'M0 0L100 0L100 50Z', closed: true, stroke: '#000000', strokeWidth: 4 });

    expect(outlineOf(d, 'strok001')).toEqual([[95, 95], [305, 95], [305, 205], [95, 205]]);
    expect(outlineOf(d, 'shape001')).toEqual([[-2, -2], [102, -2], [102, 52], [-2, 52]]);
  });

  test('a turned stroke keeps its box and turns it: the corners are the box carried by the matrix', () => {
    // a quarter turn about the origin: (x, y) -> (-y, x)
    const d = doc({ op: 'stroke', id: 'strok001', pts: [[100, 100, 10], [300, 200, 10]], color: '#000000' }, { op: 'transform', target: 'strok001', m: [0, 1, -1, 0, 0, 0] });
    const o = outlineOf(d, 'strok001');

    expect(o.map(p => p.map(Math.round))).toEqual([[-95, 95], [-95, 305], [-205, 305], [-205, 95]]);
  });

  test('unknown ids, clip shapes and photos without size have none', () => {
    const shape = { op: 'shape', id: 'shape001', path: 'M0 0L9 9', closed: false, stroke: '#000000', strokeWidth: 1 };
    const d = doc(shape, photo('photoaaa', A, [1, 0, 0, 1, 0, 0], { clip: 'shape001' }));

    expect(outlineOf(d, 'nothing1')).toBeNull();
    expect(outlineOf(d, 'shape001', { photos })).toBeNull();
    expect(outlineOf(d, 'photoaaa')).toBeNull();
  });
});
