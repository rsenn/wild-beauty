// bun test: z-order, photo order, delete with undo (E51-E53), shortcuts
import { describe, expect, test } from 'bun:test';
import { apply } from '../../client/editor/commands.js';
import * as history from '../../client/editor/history.js';
import { emptyNode, findStep, moveStep, movePhoto, photoSteps, validate } from '../../client/editor/model.js';
import { orderFor } from '../../client/editor/shortcuts.js';

const H = n => String(n).repeat(64);
const photo = (id, n) => ({ op: 'photo', id, photo: H(n), m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal' });
const stroke = id => ({ op: 'stroke', id, pts: [[1, 2, 3]], color: '#112233' });

const doc = steps => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
const ids = d => d.pages[0].steps.map(s => s.id ?? s.op);
const run = (snap, commands) => {
  let h = history.create(snap);

  for(const c of commands) {
    const r = apply(h.present, c);

    h = history.push(h, r.snap, r.key);
  }

  return h;
};

describe('z-order', () => {
  const d = doc([photo('photo001', 1), stroke('strok001'), photo('photo002', 2)]);

  test('up and down pass one drawn step', () => {
    expect(ids(moveStep(d, 'photo001', 'up'))).toEqual(['strok001', 'photo001', 'photo002']);
    expect(ids(moveStep(d, 'photo002', 'down'))).toEqual(['photo001', 'photo002', 'strok001']);
    expect(moveStep(d, 'photo002', 'up')).toBe(d);
    expect(moveStep(d, 'photo001', 'down')).toBe(d);
  });

  test('a photo goes behind a stroke', () => {
    const above = doc([stroke('strok001'), photo('photo001', 1)]);
    const h = run({ doc: above, kind: 'node' }, [{ type: 'moveStep', id: 'photo001', to: 'back' }]);

    expect(ids(h.present.doc)).toEqual(['photo001', 'strok001']);
    expect(ids(history.undo(h).present.doc)).toEqual(['strok001', 'photo001']);
  });

  test('up skips steps without an id', () => {
    const e = doc([photo('photo001', 1), { op: 'blend', target: 'photo001', mode: 'screen' }, stroke('strok001')]);

    expect(ids(moveStep(e, 'photo001', 'up'))).toEqual(['blend', 'strok001', 'photo001']);
  });

  test('keys', () => {
    const key = (k, extra = {}) => orderFor({ key: k, target: {}, ...extra });

    expect([key('['), key(']'), key('{'), key('}'), key('a'), key('[', { ctrlKey: true })]).toEqual(['down', 'up', 'back', 'front', null, null]);
  });
});

describe('film-strip order', () => {
  const d = doc([photo('photo001', 1), stroke('strok001'), photo('photo002', 2), photo('photo003', 3)]);

  test('reordering photos leaves the strokes where they are', () => {
    const m = movePhoto(d, 'photo003', 0);

    expect(ids(m)).toEqual(['photo003', 'strok001', 'photo001', 'photo002']);
    expect(photoSteps(m).map(s => s.id)).toEqual(['photo003', 'photo001', 'photo002']);
    expect(validate(m)).toEqual([]);
    expect(movePhoto(d, 'photo001', 0)).toBe(d);
    expect(movePhoto(d, 'strok001', 0)).toBe(d);
    expect(movePhoto(d, 'photo001', NaN)).toBe(d);
    expect(ids(movePhoto(d, 'photo001', 99))).toEqual(['photo002', 'strok001', 'photo003', 'photo001']);
  });

  test('survives undo', () => {
    const h = run({ doc: d, kind: 'node' }, [{ type: 'movePhoto', id: 'photo002', to: 0 }]);

    expect(photoSteps(h.present.doc).map(s => s.id)).toEqual(['photo002', 'photo001', 'photo003']);
    expect(photoSteps(history.undo(h).present.doc).map(s => s.id)).toEqual(['photo001', 'photo002', 'photo003']);
    expect(photoSteps(history.redo(history.undo(h)).present.doc).map(s => s.id)).toEqual(['photo002', 'photo001', 'photo003']);
  });
});

describe('delete step', () => {
  test('undo restores the step and what pointed at it', () => {
    const d = doc([photo('photo001', 1), { ...stroke('strok001') }, { op: 'transform', target: 'strok001', m: [2, 0, 0, 2, 0, 0] }, { op: 'clip', target: 'photo001', shape: 'strok001' }]);
    const h = run({ doc: d, kind: 'node' }, [{ type: 'removeStep', id: 'strok001' }]);

    expect(ids(h.present.doc)).toEqual(['photo001']);
    expect(validate(h.present.doc)).toEqual([]);
    expect(ids(history.undo(h).present.doc)).toEqual(['photo001', 'strok001', 'transform', 'clip']);
    expect(findStep(history.undo(h).present.doc, 'strok001')).toBeTruthy();
  });
});

describe('pages', () => {
  test('two pages keep separate steps, and undo takes a page back', () => {
    let h = run({ doc: emptyNode(), kind: 'node' }, [{ type: 'addPage' }]);
    const [first, second] = h.present.doc.pages.map(p => p.id);

    h = run(h.present, [{ type: 'addStep', page: first, step: stroke('strok001') }, { type: 'addStep', page: second, step: stroke('strok002') }]);
    expect(h.present.doc.pages.map(p => p.steps.map(s => s.id))).toEqual([['strok001'], ['strok002']]);
    expect(findStep(h.present.doc, 'strok002').page).toBe(1);

    const moved = apply(h.present, { type: 'movePage', id: second, to: 0 }).snap.doc;

    expect(moved.pages.map(p => p.steps[0].id)).toEqual(['strok002', 'strok001']);
    expect(apply(h.present, { type: 'removePage', id: first }).snap.doc.pages.map(p => p.id)).toEqual([second]);
    const lone = { doc: emptyNode(), kind: 'node' };

    expect(apply(lone, { type: 'removePage', id: lone.doc.pages[0].id }).snap.doc.pages.length).toBe(1);
  });
});

describe('mode', () => {
  test('setMode switches and undoes; unknown modes change nothing', () => {
    const start = { doc: emptyNode(), kind: 'node' };
    const h = run(start, [{ type: 'setMode', mode: 'slides' }]);

    expect(h.present.doc.mode).toBe('slides');
    expect(history.undo(h).present.doc.mode).toBe(start.doc.mode);
    expect(apply(start, { type: 'setMode', mode: 'bogus' }).snap.doc).toBe(start.doc);
  });
});
