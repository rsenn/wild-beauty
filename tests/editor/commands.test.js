// bun test: client/editor/commands.js with history.js
import { describe, expect, test } from 'bun:test';
import { apply, fingerprint } from '../../client/editor/commands.js';
import * as history from '../../client/editor/history.js';
import { emptyNode, findStep, validate } from '../../client/editor/model.js';

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

    for(const c of [{ type: 'setFit', id, fit: 'cover', info }, { type: 'setOpacity', id, value: 0.4 }, { type: 'setBlend', id, mode: 'multiply' }]) h = history.push(h, apply(h.present, c).snap);

    expect(step()).toMatchObject({ fit: 'cover', opacity: 0.4, blend: 'multiply' });
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
      { type: 'setFit', id: 'photo001', fit: 'cover', info },
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
