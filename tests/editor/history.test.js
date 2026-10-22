// bun test: client/editor/history.js
import { describe, expect, test } from 'bun:test';
import { MAX_UNDO, canRedo, canUndo, create, push, redo, seal, undo } from '../../client/editor/history.js';
import { addPage, emptyNode, setMode, setTitle } from '../../client/editor/model.js';

describe('history', () => {
  const d0 = emptyNode();
  const d1 = setTitle(d0, 'one');
  const d2 = setMode(d1, 'slides');
  const d3 = addPage(d2);

  test('a new history cannot undo or redo', () => {
    const h = create(d0);

    expect(h.present).toBe(d0);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  test('undo after redo after undo restores the exact snapshots', () => {
    let h = [d1, d2, d3].reduce(push, create(d0));

    expect(h.present).toBe(d3);

    h = undo(h);
    expect(h.present).toBe(d2);
    h = undo(h);
    expect(h.present).toBe(d1);
    h = redo(h);
    expect(h.present).toBe(d2);
    h = undo(h);
    expect(h.present).toBe(d1);
    h = redo(redo(h));
    expect(h.present).toBe(d3);
    expect(canRedo(h)).toBe(false);
    expect(undo(undo(undo(h))).present).toBe(d0);
  });

  test('a new push drops the redo branch', () => {
    const h = push(undo([d1, d2].reduce(push, create(d0))), d3);

    expect(h.present).toBe(d3);
    expect(canRedo(h)).toBe(false);
    expect(undo(h).present).toBe(d1);
  });

  test('pushing the same document is ignored', () => {
    const h = push(create(d0), d1);

    expect(push(h, d1)).toBe(h);
  });

  test('histories are values: undo does not change the old one', () => {
    const h = push(create(d0), d1);

    undo(h);
    expect(h.present).toBe(d1);
    expect(h.past).toEqual([d0]);
  });

  test('coalescing: a drag is one undo step', () => {
    const drag = [0.9, 0.8, 0.7].map(o => setTitle(d0, String(o)));
    let h = create(d0);

    for(const doc of drag) h = push(h, doc, 'opacity:abc');

    expect(h.present).toBe(drag[2]);
    expect(h.past).toEqual([d0]);
    expect(undo(h).present).toBe(d0);
  });

  test('coalescing stops on another key, no key, or seal', () => {
    let h = push(push(create(d0), d1, 'a'), d2, 'b');

    expect(h.past).toEqual([d0, d1]);
    h = push(h, d3, 'b');
    expect(h.past).toEqual([d0, d1]);
    h = push(seal(h), setTitle(d3, 'x'), 'b');
    expect(h.past).toHaveLength(3);
    h = push(push(h, setTitle(d3, 'y')), setTitle(d3, 'z'), 'b');
    expect(h.past).toHaveLength(5);
  });

  test('at most 100 undo steps', () => {
    let h = create(d0);

    for(let i = 0; i < 150; i++) h = push(h, setTitle(d0, String(i)));

    expect(h.past).toHaveLength(MAX_UNDO);

    for(let i = 0; i < 200; i++) h = undo(h);

    // the oldest snapshots fell off: the earliest reachable one is title "49"
    expect(h.present.title).toBe('49');
  });
});
