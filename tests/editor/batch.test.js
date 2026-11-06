// bun test: client/editor/core/batch.js
import { describe, expect, test } from 'bun:test';
import { photoRefs, placePhotos, rotatePhotos, setDesc, setOff } from '../../client/editor/core/batch.js';
import { LIMITS, validate, visibleDoc } from '../../client/editor/core/model.js';

const M = [1, 0, 0, 1, 0, 0];
const hash = c => c.repeat(64);
const photo = (id, c, extra = {}) => ({ op: 'photo', id, photo: hash(c), m: M, opacity: 1, blend: 'normal', ...extra });
const doc = (steps, mode = 'slides', more = []) => ({ v: 1, style: {}, mode, pages: [{ id: 'page0001', steps }, ...more] });
const ids = d => d.pages.flatMap(p => p.steps.map(s => s.id));

describe('photoRefs', () => {
  test('picture photos in page and step order, textures left out', () => {
    const d = doc([photo('aaaaaaa1', 'a'), photo('aaaaaaa2', 'b', { role: 'texture' }), photo('aaaaaaa3', 'c', { off: true })], 'free', [{ id: 'page0002', steps: [photo('aaaaaaa4', 'd')] }]);

    expect(photoRefs(d).map(r => [r.id, r.page, r.off])).toEqual([['aaaaaaa1', 'page0001', false], ['aaaaaaa3', 'page0001', true], ['aaaaaaa4', 'page0002', false]]);
  });
});

describe('setOff', () => {
  test('sets and clears the flag, same object when nothing changes', () => {
    const d = doc([photo('aaaaaaa1', 'a'), photo('aaaaaaa2', 'b')]);
    const off = setOff(d, ['aaaaaaa1'], true);

    expect(off.pages[0].steps[0].off).toBe(true);
    expect(off.pages[0].steps[1]).toBe(d.pages[0].steps[1]);
    expect(validate(off)).toEqual([]);
    expect(setOff(off, ['aaaaaaa1'], true)).toBe(off);
    expect('off' in setOff(off, ['aaaaaaa1'], false).pages[0].steps[0]).toBe(false);
  });

  test('visibleDoc drops the photos that are off, with what points at them', () => {
    const d = doc([photo('aaaaaaa1', 'a', { off: true }), { op: 'transform', target: 'aaaaaaa1', m: M }, photo('aaaaaaa2', 'b')]);

    expect(ids(visibleDoc(d))).toEqual(['aaaaaaa2']);
    expect(visibleDoc(doc([photo('aaaaaaa2', 'b')]))).toBeDefined();
  });
});

describe('placePhotos', () => {
  const a = doc([photo('aaaaaaa1', 'a'), photo('aaaaaaa2', 'b'), photo('aaaaaaa3', 'c')]);
  const b = doc([photo('bbbbbbb1', 'd'), photo('bbbbbbb2', 'e')]);

  test('reorders inside a node', () => {
    const r = placePhotos({ 1: a }, [{ node: 1, id: 'aaaaaaa3' }], { node: 1, before: 'aaaaaaa1' });

    expect(ids(r.docs[1])).toEqual(['aaaaaaa3', 'aaaaaaa1', 'aaaaaaa2']);
    expect(r.refused).toEqual([]);
  });

  test('dropping before itself, or at the end', () => {
    expect(ids(placePhotos({ 1: a }, [{ node: 1, id: 'aaaaaaa2' }], { node: 1, before: 'aaaaaaa2' }).docs[1])).toEqual(['aaaaaaa1', 'aaaaaaa2', 'aaaaaaa3']);
    expect(ids(placePhotos({ 1: a }, [{ node: 1, id: 'aaaaaaa1' }], { node: 1, before: null }).docs[1])).toEqual(['aaaaaaa2', 'aaaaaaa3', 'aaaaaaa1']);
  });

  test('several photos keep their order across the node boundary', () => {
    const r = placePhotos({ 1: a, 2: b }, [{ node: 1, id: 'aaaaaaa3' }, { node: 1, id: 'aaaaaaa1' }], { node: 2, before: 'bbbbbbb2' });

    expect(ids(r.docs[1])).toEqual(['aaaaaaa2']);
    expect(ids(r.docs[2])).toEqual(['bbbbbbb1', 'aaaaaaa3', 'aaaaaaa1', 'bbbbbbb2']);
    expect(validate(r.docs[2])).toEqual([]);
  });

  test('steps pointing at a photo travel with it', () => {
    const c = doc([photo('aaaaaaa1', 'a'), { op: 'transform', target: 'aaaaaaa1', m: M }, photo('aaaaaaa2', 'b')]);
    const r = placePhotos({ 1: c, 2: b }, [{ node: 1, id: 'aaaaaaa1' }], { node: 2, before: null });

    expect(r.docs[1].pages[0].steps.map(s => s.id ?? s.target)).toEqual(['aaaaaaa2']);
    expect(r.docs[2].pages[0].steps.map(s => s.op)).toEqual(['photo', 'photo', 'photo', 'transform']);
    expect(validate(r.docs[2])).toEqual([]);
  });

  test('a clashing id is renewed on the way', () => {
    const c = doc([photo('aaaaaaa1', 'f')]);
    const r = placePhotos({ 1: c, 2: doc([photo('aaaaaaa1', '9')]) }, [{ node: 1, id: 'aaaaaaa1' }], { node: 2, before: null });
    const [x, y] = r.docs[2].pages[0].steps;

    expect(x.id).toBe('aaaaaaa1');
    expect(y.id).not.toBe('aaaaaaa1');
    expect(validate(r.docs[2])).toEqual([]);
  });

  test('refusals: locked, clipped, full, missing', () => {
    const clipped = doc([{ op: 'shape', id: 'sssssss1', path: 'M0 0', closed: true, strokeWidth: 1 }, photo('aaaaaaa1', 'a', { clip: 'sssssss1' })]);

    expect(placePhotos({ 1: a, 2: b }, [{ node: 1, id: 'aaaaaaa1' }], { node: 2, before: null }, { editable: n => n === 1 })).toEqual({ docs: {}, refused: [{ id: 'aaaaaaa1', reason: 'locked' }] });
    expect(placePhotos({ 1: clipped, 2: b }, [{ node: 1, id: 'aaaaaaa1' }], { node: 2, before: null }).refused).toEqual([{ id: 'aaaaaaa1', reason: 'clip' }]);
    expect(placePhotos({ 1: clipped }, [{ node: 1, id: 'aaaaaaa1' }], { node: 1, before: null }).refused).toEqual([]);
    expect(placePhotos({ 1: a }, [{ node: 1, id: 'nothing1' }], { node: 1, before: null }).refused).toEqual([{ id: 'nothing1', reason: 'missing' }]);

    const full = doc(Array.from({ length: 1000 }, (_, i) => photo(`f${String(i).padStart(7, '0')}`, '0', { photo: (i.toString(16).padStart(64, '0')) })));
    const r = placePhotos({ 1: a, 2: full }, [{ node: 1, id: 'aaaaaaa1' }], { node: 2, before: null });

    expect(r.refused).toEqual([{ id: 'aaaaaaa1', reason: 'full' }]);
    expect(r.docs).toEqual({});
  });
});

describe('setDesc', () => {
  test('sets, clears and trims a description; same object when unchanged', () => {
    const d = doc([photo('aaaaaaa1', 'a'), photo('aaaaaaa2', 'b')]);
    const w = setDesc(d, ['aaaaaaa1', 'aaaaaaa2'], 'Plettenberg Bay, 15 April 2026');

    expect(w.pages[0].steps.map(s => s.desc)).toEqual(['Plettenberg Bay, 15 April 2026', 'Plettenberg Bay, 15 April 2026']);
    expect(validate(w)).toEqual([]);
    expect(photoRefs(w)[0].desc).toBe('Plettenberg Bay, 15 April 2026');
    expect(setDesc(w, ['aaaaaaa1'], 'Plettenberg Bay, 15 April 2026')).toBe(w);
    expect('desc' in setDesc(w, ['aaaaaaa1'], '').pages[0].steps[0]).toBe(false);
    expect(setDesc(d, ['aaaaaaa1'], 'x'.repeat(LIMITS.desc + 100)).pages[0].steps[0].desc.length).toBe(LIMITS.desc);
    expect(LIMITS.desc).toBe(5000);
  });
});

describe('rotatePhotos', () => {
  test('a quarter turn clockwise about the photo centre, four of them are the start, photoRefs says how far', () => {
    const d = doc([photo('aaaaaaa1', 'a', { m: [0.5, 0, 0, 0.5, 100, 200] }), photo('aaaaaaa2', 'b')]);
    const r = rotatePhotos(d, ['aaaaaaa1'], 1);
    const [m] = r.pages[0].steps.map(s => s.m);

    expect(photoRefs(r).map(p => p.rot)).toEqual([90, 0]);
    expect(m.slice(0, 4)).toEqual([0, 0.5, -0.5, 0]);
    expect([m[0] * 500 + m[2] * 500 + m[4], m[1] * 500 + m[3] * 500 + m[5]]).toEqual([350, 450]); // the centre stays: 100+250, 200+250
    expect(validate(r)).toEqual([]);
    expect(photoRefs(rotatePhotos(r, ['aaaaaaa1'], -1))[0].rot).toBe(0);
    expect(rotatePhotos(rotatePhotos(rotatePhotos(r, ['aaaaaaa1'], 1), ['aaaaaaa1'], 1), ['aaaaaaa1'], 1).pages[0].steps[0].m).toEqual(d.pages[0].steps[0].m);
    expect(rotatePhotos(d, ['aaaaaaa1'], 4)).toBe(d);
    expect(r.pages[0].steps[1]).toBe(d.pages[0].steps[1]);
  });
});
