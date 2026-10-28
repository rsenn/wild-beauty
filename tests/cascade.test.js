// bun test: the first placement of photos (E112)
import { describe, expect, test } from 'bun:test';
import { cascade, PER_ROUND, photosOnPage } from '../client/editor/cascade.js';
import { addPhoto, emptyNode, validate } from '../client/editor/model.js';
import { apply } from '../client/editor/commands.js';

const near = (a, b) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));

describe('cascade', () => {
  test('photo 0 is a half-stage square at the top left, each next one 10 % further down and right', () => {
    near(cascade(0), [0.5, 0, 0, 0.5, 0, 0]);
    near(cascade(1), [0.5, 0, 0, 0.5, 100, 100]);
    near(cascade(2), [0.5, 0, 0, 0.5, 200, 200]);
  });

  test('six photos reach the bottom right of the stage, the seventh wraps with a 3 % shift', () => {
    expect(PER_ROUND).toBe(6);
    near(cascade(5), [0.5, 0, 0, 0.5, 500, 500]);
    near(cascade(6), [0.5, 0, 0, 0.5, 30, 30]);
    near(cascade(7), [0.5, 0, 0, 0.5, 130, 130]);
    near(cascade(12), [0.5, 0, 0, 0.5, 60, 60]);
  });

  test('every photo of a limit-sized node stays on the stage', () => {
    for(let i = 0; i < 40; i++) {
      const [, , , , x, y] = cascade(i);

      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + 500).toBeLessThanOrEqual(1000);
      expect(y).toBe(x);
    }
  });

  test('a bad index is photo 0', () => {
    near(cascade(-3), cascade(0));
    near(cascade(NaN), cascade(0));
    near(cascade(2.5), cascade(0));
  });
});

describe('addPhoto with a matrix', () => {
  const HASH = 'a'.repeat(64);
  const node = emptyNode();
  const page = node.pages[0].id;

  test('the matrix is used, a bad one falls back to covering the stage', () => {
    const doc = addPhoto(addPhoto(node, page, HASH, {}, 'photo001', undefined, undefined, cascade(1)), page, HASH, {}, 'photo002', undefined, undefined, [1, 2]);

    expect(doc.pages[0].steps[0].m).toEqual(cascade(1));
    expect(doc.pages[0].steps[1].m).toEqual([1, 0, 0, 1, 0, 0]);
    expect(validate(doc)).toEqual([]);
  });

  test('the addPhoto command passes the matrix, and photosOnPage counts pictures only', () => {
    let snap = { doc: node, kind: 'node' };

    snap = apply(snap, { type: 'addPhoto', page, hash: HASH, info: {}, id: 'photo001', m: cascade(0) }).snap;
    snap = apply(snap, { type: 'addPhoto', page, hash: HASH, info: {}, id: 'photo002', role: 'texture' }).snap;

    expect(snap.doc.pages[0].steps[0].m).toEqual(cascade(0));
    expect(photosOnPage(snap.doc.pages[0])).toBe(1);
  });
});
