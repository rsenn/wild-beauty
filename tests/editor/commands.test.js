// bun test: client/editor/commands.js with history.js
import { describe, expect, test } from 'bun:test';
import { apply, fingerprint } from '../../client/editor/commands.js';
import * as history from '../../client/editor/history.js';
import { emptyNode, findStep, validate } from '../../client/editor/model.js';
import { effective } from '../../client/editor/render.js';

const A = 'a'.repeat(64);
const info = { width: 400, height: 300 };
const fresh = () => ({ doc: emptyNode(), kind: 'node' });

// run commands through apply and history, the way the editor does
function run(commands, start = fresh()) {
  let h = history.create(start);

  for(const c of commands) {
    const { snap, key } = apply(h.present, c);

    h = history.push(h, snap, key);
  }

  return h;
}

describe('apply', () => {
  test('add a photo, then change everything about it', () => {
    let h = run([{ type: 'addPhoto', hash: A, info, id: 'photo001' }]);
    const id = 'photo001';
    const step = () => findStep(h.present.doc, id).step;

    for(const c of [{ type: 'setCrop', id, crop: 0.2 }, { type: 'setOpacity', id, value: 0.4 }, { type: 'setBlend', id, mode: 'multiply' }]) h = history.push(h, apply(h.present, c).snap);

    expect(step()).toMatchObject({ crop: 0.2, opacity: 0.4, blend: 'multiply' });
    expect(validate(h.present.doc)).toEqual([]);
  });

  test('a command that changes nothing returns the same snapshot', () => {
    const snap = fresh();

    for(const c of [{ type: 'removeStep', id: 'nothing1' }, { type: 'setBlend', id: 'nothing1', mode: 'screen' }, { type: 'setTitle', title: undefined }, { type: 'setKind', kind: 'node' }, { type: 'setKind', kind: 'blog' }, { type: 'bogus' }, { type: 'setBg', color: null }, { type: 'setBg', color: 'not a colour' }])
      expect(apply(snap, c).snap).toBe(snap);
  });

  test('title, kind and ground', () => {
    const { snap } = apply(fresh(), { type: 'setTitle', title: 'Hi' });

    expect(snap.doc.title).toBe('Hi');
    expect(apply(snap, { type: 'setKind', kind: 'album' }).snap.kind).toBe('album');
    expect(apply(snap, { type: 'setBg', color: '#ffeedd' }).snap.doc.bg).toBe('#ffeedd');
    expect('bg' in apply(apply(snap, { type: 'setBg', color: '#ffeedd' }).snap, { type: 'setBg', color: null }).snap.doc).toBe(false);
  });

  test('colours and stroke width', () => {
    const shape = { op: 'shape', id: 'shape001', path: 'M0 0L9 9', closed: false, strokeWidth: 2 };
    const stroke = { op: 'stroke', id: 'strok001', pts: [[1, 1, 2]], color: '#000000' };
    let snap = apply(apply(fresh(), { type: 'addStep', step: shape }).snap, { type: 'addStep', step: stroke }).snap;

    snap = apply(snap, { type: 'setColor', id: 'strok001', color: '#ff0000' }).snap;
    snap = apply(snap, { type: 'setColor', id: 'shape001', field: 'fill', color: '#00ff00' }).snap;
    snap = apply(snap, { type: 'setStrokeWidth', id: 'shape001', value: 7 }).snap;

    expect(findStep(snap.doc, 'strok001').step.color).toBe('#ff0000');
    expect(findStep(snap.doc, 'shape001').step).toMatchObject({ fill: '#00ff00', strokeWidth: 7 });
    expect(apply(snap, { type: 'setColor', id: 'strok001', color: 'red;x' }).snap).toBe(snap);
    expect(apply(snap, { type: 'setStrokeWidth', id: 'strok001', value: 3 }).snap).toBe(snap);
    expect(apply(snap, { type: 'setStrokeWidth', id: 'shape001', value: -1 }).snap).toBe(snap);
  });
});

describe('history through commands', () => {
  test('10 actions can be undone and redone, snapshot by snapshot', () => {
    const cs = [
      { type: 'addPhoto', hash: A, info, id: 'photo001' },
      { type: 'addStep', step: { op: 'stroke', id: 'strok001', pts: [[1, 1, 2]], color: '#000000' } },
      { type: 'setTitle', title: 'T' },
      { type: 'setBlend', id: 'photo001', mode: 'screen' },
      { type: 'setCrop', id: 'photo001', crop: 0.9 },
      { type: 'moveStep', id: 'photo001', to: 'front' },
      { type: 'setKind', kind: 'list' },
      { type: 'setBg', color: '#102030' },
      { type: 'unclip', id: 'photo001' }, // no clip: changes nothing, not an action
      { type: 'removeStep', id: 'strok001' },
      { type: 'setOpacity', id: 'photo001', value: 0.5 },
    ];
    const h = run(cs);
    expect(h.past.length).toBe(10);

    // walk back to the start and forward again, comparing every state
    const states = [...h.past.map(fingerprint), fingerprint(h.present)];
    let back = h;

    for(let i = states.length - 2; i >= 0; i--) {
      back = history.undo(back);
      expect(fingerprint(back.present)).toBe(states[i]);
    }

    expect(history.canUndo(back)).toBe(false);

    for(let i = 1; i < states.length; i++) {
      back = history.redo(back);
      expect(fingerprint(back.present)).toBe(states[i]);
    }

    expect(history.canRedo(back)).toBe(false);
  });

  test('typing a title is one undo step; the opacity slider too', () => {
    const h = run([{ type: 'addPhoto', hash: A, info, id: 'photo001' }, ...'Sunset'.split('').map((_, i, a) => ({ type: 'setTitle', title: a.slice(0, i + 1).join('') })), ...[0.9, 0.8, 0.7].map(value => ({ type: 'setOpacity', id: 'photo001', value }))]);

    expect(h.past.length).toBe(3);
    expect(history.undo(h).present.doc.title).toBe('Sunset');
    expect(findStep(history.undo(h).present.doc, 'photo001').step.opacity).toBe(1);
    expect(history.undo(history.undo(h)).present.doc.title).toBeUndefined();
  });

  test('title edits are undoable', () => {
    const h = run([{ type: 'setTitle', title: 'One' }]);

    expect(h.present.doc.title).toBe('One');
    expect(history.undo(h).present.doc.title).toBeUndefined();
    expect(history.redo(history.undo(h)).present.doc.title).toBe('One');
  });
});

describe('a clipped photo and its mask', () => {
  const clipped = () => {
    let snap = fresh();

    for(const c of [{ type: 'addPhoto', hash: A, info, id: 'photo001' }, { type: 'addStep', step: { op: 'shape', id: 'shape001', path: 'M100 100L300 100L300 300L100 300Z', closed: true, fill: '#ff0000', strokeWidth: 0 } }, { type: 'setClip', id: 'photo001', shape: 'shape001' }]) snap = apply(snap, c).snap;

    return snap;
  };
  const eff = (snap, id) => effective(snap.doc.pages[0].steps).by.get(id)?.m;

  test('setMatrix moves the mask by the same move', () => {
    const snap = apply(clipped(), { type: 'setMatrix', id: 'photo001', m: [1, 0, 0, 1, 50, -20] }).snap;

    expect(eff(snap, 'photo001')).toEqual([1, 0, 0, 1, 50, -20]);
    expect(eff(snap, 'shape001')).toEqual([1, 0, 0, 1, 50, -20]);

    // a second move is relative to the new place, a scale carries the mask with it
    const scaled = apply(snap, { type: 'setMatrix', id: 'photo001', m: [2, 0, 0, 2, 50, -20] }).snap;

    expect(eff(scaled, 'shape001')).toEqual([2, 0, 0, 2, 50, -20]);
    expect(validate(scaled.doc)).toEqual([]);
  });

  test('an unclipped photo and a plain shape move alone', () => {
    const plain = apply(clipped(), { type: 'unclip', id: 'photo001' }).snap;
    const moved = apply(plain, { type: 'setMatrix', id: 'photo001', m: [1, 0, 0, 1, 9, 9] }).snap;

    expect(eff(moved, 'shape001')).toBeUndefined();
  });

  test('a recorded move takes the mask along too', () => {
    const snap = apply(clipped(), { type: 'recordMove', id: 'photo001', m: [1, 0, 0, 1, 30, 0], k: 3 }).snap;

    expect(eff(snap, 'shape001')).toEqual([1, 0, 0, 1, 30, 0]);
  });
});

describe('batch', () => {
  const two = () => run([{ type: 'addPhoto', hash: A, info, id: 'photo001' }, { type: 'addPhoto', hash: A, info, id: 'photo002' }]);

  test('one change to several steps is one undo step', () => {
    let h = two();
    const before = h.present;

    h = run([], h.present);
    h = history.push(h, apply(h.present, { type: 'batch', commands: ['photo001', 'photo002'].map(id => ({ type: 'setOpacity', id, value: 0.4 })) }).snap);

    expect(findStep(h.present.doc, 'photo001').step.opacity).toBe(0.4);
    expect(findStep(h.present.doc, 'photo002').step.opacity).toBe(0.4);
    expect(history.undo(h).present).toBe(before);
  });

  test('a keyed batch folds a run into one step and removing several at once works', () => {
    let h = two();
    const move = x => ({ type: 'batch', key: 'group-move', commands: ['photo001', 'photo002'].map(id => ({ type: 'setMatrix', id, m: [1, 0, 0, 1, x, 0] })) });

    for(const x of [5, 10, 20]) {
      const { snap, key } = apply(h.present, move(x));

      h = history.push(h, snap, key);
    }

    expect(h.past.length).toBe(3); // two photos added, one folded move
    expect(findStep(h.present.doc, 'photo002').step.m[4]).toBe(20);

    const gone = apply(h.present, { type: 'batch', commands: ['photo001', 'photo002'].map(id => ({ type: 'removeStep', id })) }).snap;

    expect(findStep(gone.doc, 'photo001')).toBeFalsy();
    expect(findStep(gone.doc, 'photo002')).toBeFalsy();
  });
});
