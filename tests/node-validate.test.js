// bun test: server/node/validate.js
import { describe, expect, test } from 'bun:test';
import { photosOf, validateNode } from '../server/node/validate.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const photo = (id, hash, extra = {}) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal', ...extra });
const doc = (steps = [], extra = {}) => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps }], ...extra });
const has = known => hash => known.includes(hash);

describe('validateNode', () => {
  test('a good node: doc, title, kind and photos', () => {
    const r = validateNode({ doc: doc([photo('photo001', A), photo('photo002', B, { role: 'texture' })], { title: 'Hi' }), kind: 'album' }, { hasPhoto: has([A, B]) });

    expect(r).toMatchObject({ ok: true, title: 'Hi', kind: 'album', photos: [{ hash: A, role: 'picture' }, { hash: B, role: 'texture' }] });
  });

  test('a document naming a missing hash is missing_photo (422)', () => {
    const r = validateNode({ doc: doc([photo('photo001', A), photo('photo002', B)]) }, { hasPhoto: has([A]) });

    expect(r).toMatchObject({ ok: false, code: 'missing_photo', status: 422, errors: [{ code: 'missing_photo', path: B }] });
  });

  test('structure and reference errors are invalid (400)', () => {
    expect(validateNode({ doc: { v: 2 } })).toMatchObject({ ok: false, code: 'invalid', status: 400 });
    expect(validateNode({ doc: doc([{ op: 'future', id: 'futur001' }]) })).toMatchObject({ code: 'invalid' });
    expect(validateNode({ doc: doc([{ op: 'blend', target: 'nothing1', mode: 'screen' }]) })).toMatchObject({ code: 'invalid' });
    expect(validateNode(null)).toMatchObject({ code: 'invalid' });
    expect(validateNode({})).toMatchObject({ code: 'invalid' });
    expect(validateNode([])).toMatchObject({ code: 'invalid' });
  });

  test('too big is too_large (413), a long title invalid', () => {
    const big = doc([{ op: 'shape', id: 'shape001', path: 'M0 0', closed: false, strokeWidth: 1 }], { title: 'x' });

    big.pages[0].steps[0].path = 'M0 0' + 'L1 1'.repeat(5e5);
    expect(validateNode({ doc: big })).toMatchObject({ ok: false, code: 'too_large', status: 413 });
    expect(validateNode({ doc: doc([], { title: 'x'.repeat(201) }) })).toMatchObject({ code: 'invalid', errors: [{ code: 'title_too_long' }] });
  });

  test('an unknown kind is invalid', () => {
    expect(validateNode({ doc: doc(), kind: 'blog' })).toMatchObject({ code: 'invalid', errors: [{ code: 'bad_kind' }] });
  });

  test('the style is sanitised before storage', () => {
    const style = { theme: 'blueprint', vars: { '--wb-accent': '#2a6', '--wb-ink': 'red;x:y', '--bogus': '1' } };

    expect(validateNode({ doc: doc([], { style }) }).doc.style).toEqual({ theme: 'blueprint', vars: { '--wb-accent': '#2a6' } });
    expect(validateNode({ doc: doc([], { style }) }, { themes: new Set(['kraft']) }).doc.style).toEqual({ vars: { '--wb-accent': '#2a6' } });
  });

  test('without a lookup photos are not checked', () => {
    expect(validateNode({ doc: doc([photo('photo001', A)]) }).ok).toBe(true);
  });
});

describe('photosOf', () => {
  test('first-use order; texture only when every use says so', () => {
    const d = doc([photo('photo001', B, { role: 'texture' }), photo('photo002', A), photo('photo003', B, { role: 'texture' }), photo('photo004', A, { role: 'texture' })]);

    expect(photosOf(d)).toEqual([{ hash: B, role: 'texture' }, { hash: A, role: 'picture' }]);
  });
});

describe('photoLookup', () => {
  test('a baked photo row counts, an unknown or malformed hash does not', async () => {
    const { open } = await import('../server/db/db.js');
    const { upsertPhoto } = await import('../server/db/nodes.js');
    const { photoLookup } = await import('../server/node/validate.js');
    const h = await open(':memory:');

    upsertPhoto(h, { hash: A, ext: 'jpg' });

    const has = photoLookup(h);

    expect(has(A)).toBe(true);
    expect(has(B)).toBe(false);
    expect(has('../etc/passwd')).toBe(false);
  });
});
