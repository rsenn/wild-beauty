// bun test: client/editor/playback.js
import { describe, expect, test } from 'bun:test';
import { MAX_SECONDS, STEP_SECONDS, clampK, durationOf, stepAt } from '../../client/editor/playback.js';

describe('playback', () => {
  test('duration: the page\'s own, else half a second per step, never zero', () => {
    expect(durationOf({ duration: 4, steps: [] })).toBe(4);
    expect(durationOf({ steps: [1, 2, 3, 4] })).toBe(4 * STEP_SECONDS);
    expect(durationOf({ steps: [] })).toBe(STEP_SECONDS);
    expect(durationOf({ duration: 1e9, steps: [] })).toBe(MAX_SECONDS);
    expect(durationOf({ duration: -3, steps: [1] })).toBe(STEP_SECONDS);
  });

  test('k runs from 0 to the step count over the duration', () => {
    expect(stepAt(0, 4, 2)).toBe(0);
    expect(stepAt(1, 4, 2)).toBe(2);
    expect(stepAt(1.99, 4, 2)).toBe(4);
    expect(stepAt(99, 4, 2)).toBe(4);
    expect(stepAt(-1, 4, 2)).toBe(0);
    const seen = [0.2, 0.6, 1, 1.4, 1.8].map(e => stepAt(e, 4, 2));

    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  test('clampK: missing or at the end is the whole page', () => {
    expect(clampK(null, 5)).toBe(5);
    expect(clampK(undefined, 5)).toBe(5);
    expect(clampK(5, 5)).toBe(5);
    expect(clampK(9, 5)).toBe(5);
    expect(clampK(2, 5)).toBe(2);
    expect(clampK(-2, 5)).toBe(0);
    expect(clampK(NaN, 5)).toBe(5);
  });
});

import { EASES, ease, positionAt } from '../../client/editor/playback.js';
import { lerpMatrix } from '../../client/editor/matrix.js';
import { effective, renderStage } from '../../client/editor/render.js';
import { emptyNode, recordMove, validate } from '../../client/editor/model.js';
import { hitTest, matrixOf } from '../../client/editor/hit.js';

describe('easing and position', () => {
  test('every ease runs 0 -> 1 and stays in range', () => {
    for(const f of Object.values(EASES)) {
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
    }

    expect(ease('inOut', 0.5)).toBe(0.5);
    expect(ease('in', 0.5)).toBeLessThan(0.5);
    expect(ease('out', 0.5)).toBeGreaterThan(0.5);
    expect(ease('nonsense', 0.25)).toBe(ease('inOut', 0.25));
    expect(ease('linear', 7)).toBe(1);
  });

  test('positionAt is fractional and ends at the count', () => {
    expect(positionAt(0, 4, 2)).toBe(0);
    expect(positionAt(0.5, 4, 2)).toBe(1);
    expect(positionAt(0.75, 4, 2)).toBeCloseTo(1.5);
    expect(positionAt(9, 4, 2)).toBe(4);
  });
});

describe('lerpMatrix', () => {
  test('ends and middle of a similarity', () => {
    const a = [1, 0, 0, 1, 0, 0];
    const b = [2, 0, 0, 2, 100, 50];

    expect(lerpMatrix(a, b, 0)).toEqual(a);
    expect(lerpMatrix(a, b, 1).map(v => Math.round(v * 1e6) / 1e6)).toEqual(b);
    expect(lerpMatrix(a, b, 0.5).map(v => Math.round(v * 1e6) / 1e6)).toEqual([1.5, 0, 0, 1.5, 50, 25]);
  });

  test('rotation takes the short way round', () => {
    const turn = r => [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
    const mid = lerpMatrix(turn(3.0), turn(-3.0), 0.5);

    expect(Math.abs(Math.atan2(mid[1], mid[0]))).toBeGreaterThan(3.0);
  });

  test('a non-similarity is blended component by component', () => {
    expect(lerpMatrix([1, 0, 0, 1, 0, 0], [2, 0, 0, 1, 0, 0], 0.5)[0]).toBe(1.5);
  });
});

describe('recorded moves', () => {
  const photo = { op: 'photo', id: 'photo001', photo: 'a'.repeat(64), m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal' };
  const stroke = { op: 'stroke', id: 'strok001', pts: [[10, 10, 5], [50, 50, 5]], color: '#112233' };
  const doc = { ...emptyNode(), pages: [{ id: 'page0001', steps: [photo, stroke, { ...stroke, id: 'strok002' }] }] };
  const M = [1, 0, 0, 1, 100, 0];
  const info = { href: '/x.jpg', width: 100, height: 100 };

  test('recordMove inserts a transform after the first k steps, and a repeat only changes it', () => {
    const one = recordMove(doc, 'photo001', M, 1);

    expect(one.pages[0].steps.map(s => s.id ?? s.op)).toEqual(['photo001', 'transform', 'strok001', 'strok002']);
    expect(validate(one)).toEqual([]);

    const again = recordMove(one, 'photo001', [1, 0, 0, 1, 200, 0], 2);

    expect(again.pages[0].steps.length).toBe(4);
    expect(again.pages[0].steps[1].m[4]).toBe(200);
    expect(recordMove(doc, 'strok002', M, 1).pages[0].steps.map(s => s.op)).toEqual(['photo', 'stroke', 'stroke', 'transform']); // never before the step itself
    expect(recordMove(doc, 'nothing1', M, 1)).toBe(doc);
    expect(recordMove(doc, 'photo001', [1, 2], 1)).toBe(doc);
  });

  test('a recorded move replays: the photo is where it was, part way, then there', () => {
    const rec = recordMove(doc, 'photo001', M, 1);
    const at = upTo => effective(rec.pages[0].steps.slice(0, Math.floor(upTo))).by.get('photo001').m[4];

    expect(at(1)).toBe(0);
    expect(at(2)).toBe(100);

    const x = u => {
      const svg = JSON.stringify(renderStage(rec, { photos: () => info, upTo: u }));
      const m = svg.match(/matrix\(([^)]+)\)/);

      return m ? Number(m[1].split(' ')[4]) : null;
    };

    expect(x(1)).toBe(0);
    expect(x(1.5)).toBeGreaterThan(0);
    expect(x(1.5)).toBeLessThan(100);
    expect(x(1.9)).toBeGreaterThan(x(1.5));
    expect(x(2)).toBe(100);
  });

  test('hit test and matrix look at the first k steps only', () => {
    const rec = recordMove(doc, 'photo001', M, 1);

    expect(matrixOf(rec, 'photo001', { upTo: 1 })[4]).toBe(0);
    expect(matrixOf(rec, 'photo001')[4]).toBe(100);
    expect(hitTest(rec, [50, 50], { photos: () => info, upTo: 1 })).toBe('photo001');
    expect(hitTest(rec, [50, 50], { photos: () => info })).toBe('strok002');
    expect(hitTest(rec, [50, 50], { photos: () => info, upTo: 0 })).toBe(null);
  });
});
