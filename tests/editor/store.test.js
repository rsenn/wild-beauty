// bun test: client/editor/core/store.js
import { describe, expect, test } from 'bun:test';
import { NEW, createEditorStore } from '../../client/editor/core/store.js';

describe('editor store', () => {
  test('starts closed; open opens, close closes', async () => {
    const s = createEditorStore();

    expect(s.state).toEqual({ open: false, target: null, dirty: false, saving: false, used: [] });
    expect(await s.open(NEW)).toBe(true);
    expect(s.state).toEqual({ open: true, target: NEW, dirty: false, saving: false, used: [] });
    s.close();
    expect(s.state.open).toBe(false);
    s.close(); // closing twice is fine
  });

  test('the same target again is a no-op and does not ask', async () => {
    const asked = [];
    const s = createEditorStore({ confirmReplace: (...a) => asked.push(a) });

    await s.open(7);
    expect(await s.open(7)).toBe(true);
    expect(asked).toEqual([]);
  });

  test('opening a second request raises the prompt hook with both targets and the dirty flag', async () => {
    const asked = [];
    const s = createEditorStore({ confirmReplace: (cur, next, info) => (asked.push([cur, next, info]), true) });

    await s.open(1);
    s.setDirty(true);
    expect(await s.open(2)).toBe(true);
    expect(asked).toEqual([[1, 2, { dirty: true }]]);
    expect(s.state).toEqual({ open: true, target: 2, dirty: false, saving: false, used: [] });
  });

  test('a no keeps the current editor; the default hook says no', async () => {
    const s = createEditorStore();

    await s.open(1);
    s.setDirty(true);
    expect(await s.open(2)).toBe(false);
    expect(s.state).toEqual({ open: true, target: 1, dirty: true, saving: false, used: [] });

    s.setConfirm(async () => false);
    expect(await s.open(3)).toBe(false);
    s.setConfirm(async () => true);
    expect(await s.open(3)).toBe(true);
    expect(s.state.target).toBe(3);
  });

  test('an editor closed while the prompt is up is not resurrected', async () => {
    let answer;
    const s = createEditorStore({ confirmReplace: () => new Promise(r => (answer = r)) });

    await s.open(1);

    const pending = s.open(2);

    s.close();
    answer(true);
    expect(await pending).toBe(false);
    expect(s.state.open).toBe(false);
  });

  test('subscribers hear every change and can unsubscribe; setDirty only on change', async () => {
    const s = createEditorStore();
    const seen = [];
    const off = s.subscribe(state => seen.push({ ...state }));

    s.setDirty(true); // closed: ignored
    await s.open(NEW);
    s.setDirty(true);
    s.setDirty(true);
    s.close();
    off();
    s.setConfirm(() => true);
    await s.open(1);

    expect(seen).toEqual([{ open: true, target: NEW, dirty: false, saving: false, used: [] }, { open: true, target: NEW, dirty: true, saving: false, used: [] }, { open: false, target: null, dirty: false, saving: false, used: [] }]);
  });

  // docs/EDITOR.md E64b: a replace or close waits for a save that is running
  test('setSaving reports only changes; idle resolves at once when no save runs', async () => {
    const s = createEditorStore();
    const seen = [];

    s.subscribe(state => seen.push(state.saving));
    await s.open(NEW);
    s.setSaving(true);
    s.setSaving(true);
    s.setSaving(false);

    expect(seen).toEqual([false, true, false]);
    expect(await s.idle()).toBeUndefined();
  });

  test('idle waits for the end of a running save', async () => {
    const s = createEditorStore();
    const order = [];

    await s.open(NEW);
    s.setSaving(true);

    const waiting = s.idle().then(() => order.push('idle'));

    order.push('before');
    s.setSaving(false);
    await waiting;

    expect(order).toEqual(['before', 'idle']);
  });
});
