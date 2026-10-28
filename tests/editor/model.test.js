// bun test: client/editor/model.js
import { describe, expect, test } from 'bun:test';
import { LIMITS, addPhoto, cropWindow, migrateDoc, setCrop, setLayout, setBlend, setClip, setOpacity, unclip, MODES, VERSION, addPage, addStep, allIds, emptyNode, findStep, movePage, moveStep, newId, removePage, removeStep, setMode, setTitle, unique, updateStep, validate } from '../../client/editor/model.js';

describe('ids', () => {
  test('8 base-36 characters, two thousand are distinct', () => {
    const ids = new Set(Array.from({ length: 2000 }, newId));

    expect(ids.size).toBe(2000);

    for(const id of ids) expect(id).toMatch(/^[0-9a-z]{8}$/);
  });

  test('unique avoids taken ids', () => {
    const taken = new Set(Array.from({ length: 100 }, newId));

    expect(taken.has(unique(taken))).toBe(false);
    expect(unique([])).toMatch(/^[0-9a-z]{8}$/);
  });
});

describe('emptyNode', () => {
  test('version 1, free mode, one empty page', () => {
    const node = emptyNode();

    expect(node.v).toBe(VERSION);
    expect(MODES).toContain(node.mode);
    expect(node.pages).toHaveLength(1);
    expect(node.pages[0].steps).toEqual([]);
    expect(node.pages[0].id).toMatch(/^[0-9a-z]{8}$/);
    expect(new TextEncoder().encode(JSON.stringify(node)).length).toBeLessThan(LIMITS.docBytes);
  });

  test('each call returns a separate document', () => {
    const a = emptyNode();
    const b = emptyNode();

    a.pages[0].steps.push({});
    expect(b.pages[0].steps).toEqual([]);
    expect(a.pages[0].id).not.toBe(b.pages[0].id);
  });
});

const HASH = 'a'.repeat(64);
const photo = (over = {}) => ({ op: 'photo', id: 'abcd1234', photo: HASH, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal', ...over });
const withSteps = (...steps) => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
const codes = doc => validate(doc).map(e => e.code);

describe('validate, structure', () => {
  test('the empty node validates', () => {
    expect(validate(emptyNode())).toEqual([]);
  });

  test('one valid step of every op', () => {
    const steps = [
      photo(),
      { op: 'stroke', id: 'stroke01', pts: [[1, 2, 3]], color: '#ff0000', smooth: true },
      { op: 'shape', id: 'shape001', path: 'M0 0L1 1Z', closed: true, fill: { type: 'linear', stops: [{ c: '#000000', at: 0 }, { c: 'rgb(1,2,3)', at: 1 }] }, strokeWidth: 2 },
      { op: 'clip', target: 'abcd1234', shape: 'shape001' },
      { op: 'unclip', target: 'abcd1234' },
      { op: 'blend', target: 'abcd1234', mode: 'multiply' },
      { op: 'transform', target: 'abcd1234', m: [1, 0, 0, 1, 5, 5], ease: 'linear' },
      { op: 'text', id: 'text0001', text: 'hi', lines: ['hi'], m: [1, 0, 0, 1, 0, 0], w: 10, h: 5, font: 'fixed', size: 12, color: '#000000', align: 'start', padding: 1, radius: 0 },
    ];

    expect(validate(withSteps(...steps))).toEqual([]);
  });

  test('each malformed fixture has its own code', () => {
    const fixtures = [
      [null, 'not_object'],
      [[], 'not_object'],
      [{ ...emptyNode(), v: 2 }, 'bad_version'],
      [{ ...emptyNode(), style: [] }, 'bad_style'],
      [{ ...emptyNode(), mode: 'wall' }, 'bad_mode'],
      [{ ...emptyNode(), bg: 'red' }, 'bad_bg'],
      [{ ...emptyNode(), pages: {} }, 'bad_pages'],
      [{ ...emptyNode(), pages: [7] }, 'bad_page'],
      [{ ...emptyNode(), pages: [{ id: 'page0001', steps: 1 }] }, 'bad_steps'],
      [{ ...emptyNode(), pages: [{ id: 'x', steps: [] }] }, 'bad_id'],
      [withSteps(5), 'bad_step'],
      [withSteps({ op: 'sparkle' }), 'unknown_op'],
      [withSteps(photo({ id: 'no' })), 'bad_id'],
      [withSteps(photo({ m: [1, 2, 3] })), 'bad_field'],
      [withSteps(photo({ fit: 'zoom' })), 'bad_field'],
      [withSteps(photo({ extra: 1 })), 'bad_field'],
      [withSteps({ op: 'clip', target: 'abcd1234' }), 'bad_field'],
    ];

    for(const [doc, code] of fixtures) expect(codes(doc)).toContain(code);
  });

  test('errors carry the path', () => {
    expect(validate(withSteps(photo({ fit: 'zoom' })))[0]).toEqual({ code: 'bad_field', path: 'pages[0].steps[0].fit' });
  });
});

describe('validate, references and limits', () => {
  const shape = (id = 'shape001', over = {}) => ({ op: 'shape', id, path: 'M0 0Z', closed: true, strokeWidth: 1, ...over });
  const stroke = (id, pts) => ({ op: 'stroke', id, pts, color: '#000000' });
  const text = (id, over = {}) => ({ op: 'text', id, text: 'x', lines: ['x'], m: [1, 0, 0, 1, 0, 0], w: 1, h: 1, font: 'fixed', size: 12, color: '#000000', align: 'start', padding: 0, radius: 0, ...over });
  const id = n => n.toString(36).padStart(8, '0');

  test('references that resolve are fine', () => {
    const doc = withSteps(photo({ clip: 'shape001' }), shape(), { op: 'clip', target: 'abcd1234', shape: 'shape001' }, { op: 'blend', target: 'abcd1234', mode: 'screen' });

    expect(validate(doc)).toEqual([]);
  });

  test('dangling clip, target and shape', () => {
    expect(validate(withSteps(photo({ clip: 'nothing1' })))[0]).toEqual({ code: 'dangling_ref', path: 'pages[0].steps[0].clip' });
    expect(codes(withSteps(photo(), { op: 'clip', target: 'abcd1234', shape: 'nothing1' }))).toEqual(['dangling_ref']);
    expect(codes(withSteps({ op: 'unclip', target: 'nothing1' }))).toEqual(['dangling_ref']);
    expect(codes(withSteps({ op: 'transform', target: 'nothing1', m: [1, 0, 0, 1, 0, 0] }))).toEqual(['dangling_ref']);
    // right id, wrong kind of step
    expect(codes(withSteps(shape(), { op: 'unclip', target: 'shape001' }))).toEqual(['dangling_ref']);
  });

  test('references do not cross pages', () => {
    const doc = withSteps(photo());

    doc.pages.push({ id: 'page0002', steps: [{ op: 'unclip', target: 'abcd1234' }] });
    expect(codes(doc)).toEqual(['dangling_ref']);
  });

  test('duplicate ids', () => {
    expect(codes(withSteps(shape('same0001'), shape('same0001')))).toEqual(['duplicate_id']);
  });

  test('step, point, path and text limits', () => {
    expect(codes(withSteps(...Array.from({ length: LIMITS.steps + 1 }, (_, i) => shape(id(i)))))).toEqual(['too_many_steps']);
    expect(validate(withSteps(...Array.from({ length: LIMITS.steps }, (_, i) => shape(id(i)))))).toEqual([]);
    expect(codes(withSteps(stroke('stroke01', Array.from({ length: LIMITS.points + 1 }, () => [0, 0, 1]))))).toEqual(['too_many_points']);
    expect(codes(withSteps(shape('shape001', { path: 'M'.repeat(LIMITS.pathChars + 1) })))).toEqual(['path_too_long']);
    expect(codes(withSteps(text('text0001', { text: 'x'.repeat(LIMITS.textChars + 1) })))).toEqual(['text_too_long']);
  });

  test('page, photo and text box limits', () => {
    const doc = emptyNode();

    doc.pages = [];
    expect(codes(doc)).toEqual(['no_pages']);
    doc.pages = Array.from({ length: LIMITS.pages + 1 }, (_, i) => ({ id: id(i), steps: [] }));
    expect(codes(doc)).toEqual(['too_many_pages']);
    expect(codes(withSteps(...Array.from({ length: LIMITS.photos + 1 }, (_, i) => photo({ id: id(i), photo: i.toString(16).padStart(64, '0') }))))).toEqual(['too_many_photos']);
    // the same photo twice counts once
    expect(validate(withSteps(photo({ id: id(1) }), photo({ id: id(2) })))).toEqual([]);
    expect(codes(withSteps(...Array.from({ length: LIMITS.textBoxes + 1 }, (_, i) => text(id(i)))))).toEqual(['too_many_text_boxes']);
  });

  test('gradient stops 2..5', () => {
    const grad = n => ({ type: 'linear', stops: Array.from({ length: n }, (_, i) => ({ c: '#000000', at: i / 10 })) });

    expect(validate(withSteps(shape('shape001', { fill: grad(2) })))).toEqual([]);
    expect(codes(withSteps(shape('shape001', { fill: grad(1) })))).toEqual(['bad_stops']);
    expect(codes(withSteps(shape('shape001', { stroke: grad(6) })))).toEqual(['bad_stops']);
    expect(codes({ ...emptyNode(), bg: grad(6) })).toEqual(['bad_stops']);
  });

  test('numbers must be finite and within 1e6', () => {
    expect(validate(withSteps(photo({ opacity: NaN })))[0]).toEqual({ code: 'bad_number', path: 'pages[0].steps[0].opacity' });
    expect(codes(withSteps(photo({ m: [1, 0, 0, 1, Infinity, 0] })))).toEqual(['bad_number']);
    expect(codes(withSteps(photo({ m: [1, 0, 0, 1, 2e6, 0] })))).toEqual(['bad_number']);
    expect(validate(withSteps(photo({ m: [1, 0, 0, 1, 1e6, -1e6] })))).toEqual([]);
  });

  test('document size', () => {
    expect(codes(withSteps(text('text0001', { lines: Array.from({ length: 2000 }, () => 'x'.repeat(600)) })))).toContain('too_large');
  });
});

describe('commands', () => {
  // a frozen document: any write to it throws, so a command that mutates its input fails the test
  const freeze = value => {
    if(value && typeof value === 'object') Object.values(value).forEach(freeze);

    return Object.freeze(value);
  };
  const shapeStep = id => ({ op: 'shape', id, path: 'M0 0Z', closed: true, strokeWidth: 1 });
  const ids = doc => doc.pages.map(page => page.steps.map(step => step.id));
  const sample = () => freeze({ ...emptyNode(), pages: [{ id: 'page0001', steps: [photo({ id: 'photo001' }), shapeStep('shape001'), shapeStep('shape002')] }, { id: 'page0002', steps: [] }] });

  test('addStep inserts at the end, at an index, and ignores an unknown page', () => {
    const doc = sample();

    expect(ids(addStep(doc, 'page0002', shapeStep('new00001')))[1]).toEqual(['new00001']);
    expect(ids(addStep(doc, 'page0001', shapeStep('new00001'), 1))[0]).toEqual(['photo001', 'new00001', 'shape001', 'shape002']);
    expect(ids(addStep(doc, 'page0001', shapeStep('new00001'), -5))[0][0]).toBe('new00001');
    expect(addStep(doc, 'nopage01', shapeStep('new00001'))).toBe(doc);
  });

  test('updateStep merges and keeps op and id', () => {
    const doc = sample();
    const next = updateStep(doc, 'photo001', { opacity: 0.5, id: 'hijack01', op: 'stroke' });

    expect(findStep(next, 'photo001').step).toEqual({ ...photo({ id: 'photo001' }), opacity: 0.5 });
    expect(updateStep(doc, 'missing1', { opacity: 0 })).toBe(doc);
  });

  test('removeStep takes the references with it', () => {
    const doc = freeze(withSteps(photo({ id: 'photo001', clip: 'shape001' }), shapeStep('shape001'), { op: 'clip', target: 'photo001', shape: 'shape001' }, { op: 'blend', target: 'photo001', mode: 'screen' }));

    const noShape = removeStep(doc, 'shape001');

    expect(noShape.pages[0].steps.map(s => s.op)).toEqual(['photo', 'blend']);
    expect('clip' in noShape.pages[0].steps[0]).toBe(false);
    expect(validate(noShape)).toEqual([]);
    expect(removeStep(doc, 'photo001').pages[0].steps.map(s => s.op)).toEqual(['shape']);
    expect(removeStep(doc, 'missing1')).toBe(doc);
  });

  test('moveStep to front, back and an index', () => {
    const doc = sample();

    expect(ids(moveStep(doc, 'photo001', 'front'))[0]).toEqual(['shape001', 'shape002', 'photo001']);
    expect(ids(moveStep(doc, 'shape002', 'back'))[0]).toEqual(['shape002', 'photo001', 'shape001']);
    expect(ids(moveStep(doc, 'photo001', 1))[0]).toEqual(['shape001', 'photo001', 'shape002']);
    expect(moveStep(doc, 'photo001', 'back')).toBe(doc);
    expect(moveStep(doc, 'photo001', NaN)).toBe(doc);
  });

  test('pages: add, remove, move', () => {
    const doc = sample();
    const added = addPage(doc, 1);

    expect(added.pages).toHaveLength(3);
    expect(added.pages[1].steps).toEqual([]);
    expect(new Set(allIds(added)).size).toBe(allIds(added).length);
    expect(validate(added)).toEqual([]);
    expect(removePage(doc, 'page0001').pages.map(p => p.id)).toEqual(['page0002']);
    expect(removePage(removePage(doc, 'page0001'), 'page0002').pages).toHaveLength(1);
    expect(movePage(doc, 'page0002', 0).pages.map(p => p.id)).toEqual(['page0002', 'page0001']);
    expect(movePage(doc, 'page0001', 0)).toBe(doc);
  });

  test('mode and title', () => {
    const doc = sample();

    expect(setMode(doc, 'slides').mode).toBe('slides');
    expect(setMode(doc, 'wall')).toBe(doc);
    expect(setMode(doc, 'free')).toBe(doc);
    expect(setTitle(doc, 'Hello').title).toBe('Hello');
    expect(setTitle(doc, 'x'.repeat(300)).title).toHaveLength(LIMITS.title);
    expect(validate(setTitle(doc, 'Hello'))).toEqual([]);
    expect(codes({ ...doc, title: 5 })).toEqual(['bad_title']);
  });

  test('untouched parts are shared with the input', () => {
    const doc = sample();
    const next = addStep(doc, 'page0002', shapeStep('new00001'));

    expect(next.pages[0]).toBe(doc.pages[0]);
    expect(next.pages[1]).not.toBe(doc.pages[1]);
  });
});

describe('photo commands', () => {
  const freeze = value => {
    if(value && typeof value === 'object') Object.values(value).forEach(freeze);

    return Object.freeze(value);
  };
  const portrait = { width: 3000, height: 4000 };
  const landscape = { width: 4000, height: 3000 };
  const shapeStep = { op: 'shape', id: 'shape001', path: 'M0 0Z', closed: true, strokeWidth: 1 };
  const base = () => freeze(addPhoto(withSteps(shapeStep), 'page0001', HASH, portrait, 'photo001'));
  const step = (doc, id) => findStep(doc, id).step;

  test('addPhoto covers the stage with a centred crop, and validates', () => {
    const doc = base();

    expect(step(doc, 'photo001')).toEqual({ op: 'photo', id: 'photo001', photo: HASH, m: [1, 0, 0, 1, 0, 0], crop: 0.5, opacity: 1, blend: 'normal' });
    expect(doc.pages[0].steps.at(-1).id).toBe('photo001');
    expect(validate(doc)).toEqual([]);
    expect(validate(addPhoto(doc, 'page0001', HASH, landscape))).toEqual([]);
    expect(addPhoto(doc, 'nopage01', HASH, portrait)).toBe(doc);
  });

  test('cropWindow: the largest square, moved along the long edge', () => {
    expect(cropWindow({ width: 400, height: 200 }, 0)).toEqual({ side: 200, x: 0, y: 0 });
    expect(cropWindow({ width: 400, height: 200 }, 0.5)).toEqual({ side: 200, x: 100, y: 0 });
    expect(cropWindow({ width: 400, height: 200 }, 1)).toEqual({ side: 200, x: 200, y: 0 });
    expect(cropWindow({ width: 200, height: 400 }, 1)).toEqual({ side: 200, x: 0, y: 200 });
    expect(cropWindow({ width: 300, height: 300 }, 1)).toEqual({ side: 300, x: 0, y: 0 });
    expect(cropWindow({ width: 400, height: 200 }, 9).x).toBe(200); // clamped
  });

  test('a new photo covers the stage with a centred crop; the crop can be set', () => {
    const added = step(base(), 'photo001');

    expect(added).toMatchObject({ m: [1, 0, 0, 1, 0, 0], crop: 0.5 });
    expect(step(setCrop(base(), 'photo001', 0.25), 'photo001').crop).toBe(0.25);
    expect(step(setCrop(base(), 'photo001', 7), 'photo001').crop).toBe(1);
    expect(setCrop(base(), 'photo001', NaN)).toEqual(base());
    expect(validate(setCrop(base(), 'photo001', 0.25))).toEqual([]);
  });

  test('setLayout: fill and gap, bad values change nothing', () => {
    const d = base();

    expect(setLayout(d, { fill: 'tight' }).layout).toEqual({ fill: 'tight' });
    expect(setLayout(setLayout(d, { fill: 'tight' }), { gap: 3 }).layout).toEqual({ fill: 'tight', gap: 3 });
    expect(setLayout(d, { fill: 'huge' })).toBe(d);
    expect(setLayout(d, { gap: -1 })).toBe(d);
    expect(validate(setLayout(d, { fill: 'tight', gap: 3 }))).toEqual([]);
    expect(validate({ ...d, layout: { fill: 'x' } }).map(e => e.code)).toContain('bad_layout');
  });

  test('migrateDoc: a pre-crop photo shows the same picture through the square window', () => {
    // 1000 x 500 photo (long edge 1000 locally), extend: centred, m = translate(0, 250)
    const old = { ...base(), pages: [{ id: 'page0001', steps: [{ op: 'photo', id: 'photo001', photo: HASH, m: [1, 0, 0, 1, 0, 250], fit: 'extend', opacity: 1, blend: 'normal' }] }] };
    const out = migrateDoc(old, () => ({ width: 2000, height: 1000 }));
    const s = out.pages[0].steps[0];

    expect(s.crop).toBe(0.5);
    expect(s.fit).toBeUndefined();
    // new unit = 500 old units / 1000; the window starts at old x = 250
    expect(s.m).toEqual([0.5, 0, 0, 0.5, 250, 250]);
    expect(validate(out)).toEqual([]);
    expect(migrateDoc(out, () => ({ width: 2000, height: 1000 }))).toBe(out); // already converted
    expect(migrateDoc(old, () => null)).toBe(old); // unknown photo
  });


  test('opacity is clamped, blend is checked, only photos change', () => {
    const doc = base();

    expect(step(setOpacity(doc, 'photo001', 0.4), 'photo001').opacity).toBe(0.4);
    expect(step(setOpacity(doc, 'photo001', 7), 'photo001').opacity).toBe(1);
    expect(step(setOpacity(doc, 'photo001', -1), 'photo001').opacity).toBe(0);
    expect(setOpacity(doc, 'photo001', NaN)).toBe(doc);
    expect(step(setBlend(doc, 'photo001', 'multiply'), 'photo001').blend).toBe('multiply');
    expect(setBlend(doc, 'photo001', 'dissolve')).toBe(doc);
    expect(setOpacity(doc, 'shape001', 0.5)).toBe(doc);
  });

  test('setClip and unclip', () => {
    const doc = base();
    const clipped = setClip(doc, 'photo001', 'shape001');

    expect(step(clipped, 'photo001').clip).toBe('shape001');
    expect(validate(clipped)).toEqual([]);
    expect('clip' in step(unclip(clipped, 'photo001'), 'photo001')).toBe(false);
    expect(unclip(doc, 'photo001')).toBe(doc);
    expect(setClip(doc, 'photo001', 'photo001')).toBe(doc);
    expect(setClip(doc, 'photo001', 'missing1')).toBe(doc);
    // deleting the shape drops the reference again
    expect('clip' in step(removeStep(clipped, 'shape001'), 'photo001')).toBe(false);
  });

  test('a shape on another page cannot clip', () => {
    const doc = addPage(base(), 1);
    const other = addStep(doc, doc.pages[1].id, { ...shapeStep, id: 'shape002' });

    expect(setClip(other, 'photo001', 'shape002')).toBe(other);
  });
});
