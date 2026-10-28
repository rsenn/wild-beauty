// bun test: a cutout replaces a photo's image and keeps the original (E127)
import { expect, test } from 'bun:test';
import { addPhoto, emptyNode, findStep } from '../client/editor/model.js';
import { replacePhoto } from '../client/editor/model.js';
import { photosOf } from '../server/node/validate.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const C = 'c'.repeat(64);
const start = () => {
  const doc = emptyNode();

  return addPhoto(doc, doc.pages[0].id, A, {}, 'p1');
};

test('the first replacement keeps the original, later ones keep that same original', () => {
  const once = replacePhoto(start(), 'p1', B);
  const twice = replacePhoto(once, 'p1', C);

  expect(findStep(once, 'p1').step).toMatchObject({ photo: B, orig: A });
  expect(findStep(twice, 'p1').step).toMatchObject({ photo: C, orig: A });
});

test('replacing with the original restores it and drops orig', () => {
  const step = findStep(replacePhoto(replacePhoto(start(), 'p1', B), 'p1', A), 'p1').step;

  expect(step.photo).toBe(A);
  expect(step.orig).toBeUndefined();
});

test('unknown steps and the same image change nothing', () => {
  const doc = start();

  expect(replacePhoto(doc, 'nope', B)).toBe(doc);
  expect(replacePhoto(doc, 'p1', A)).toBe(doc);
});

test('the node keeps the original photo too', () => {
  const doc = replacePhoto(start(), 'p1', B);

  expect(photosOf(doc).map(p => p.hash)).toEqual([B, A]);
});
