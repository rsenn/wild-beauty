// bun test: client/editor/keyboard.js
import { describe, expect, test } from 'bun:test';
import { CURSOR_START, cycleId, inEditor, moveCursor } from '../../client/editor/keyboard.js';

describe('keyboard helpers', () => {
  test('cycleId walks the list and wraps', () => {
    const ids = ['a', 'b', 'c'];

    expect(cycleId(ids, null, 1)).toBe('a');
    expect(cycleId(ids, null, -1)).toBe('c');
    expect(cycleId(ids, 'a', 1)).toBe('b');
    expect(cycleId(ids, 'c', 1)).toBe('a');
    expect(cycleId(ids, 'a', -1)).toBe('c');
    expect(cycleId(ids, 'gone', 1)).toBe('a');
    expect(cycleId([], 'a', 1)).toBe(null);
  });

  test('the cursor moves by 10, Shift 50, and stays on the stage', () => {
    expect(moveCursor(CURSOR_START, { key: 'ArrowRight' })).toEqual([510, 500]);
    expect(moveCursor(CURSOR_START, { key: 'ArrowUp', shiftKey: true })).toEqual([500, 450]);
    expect(moveCursor([5, 995], { key: 'ArrowLeft' })).toEqual([0, 995]);
    expect(moveCursor([5, 995], { key: 'ArrowDown', shiftKey: true })).toEqual([5, 1000]);
    expect(moveCursor(CURSOR_START, { key: 'a' })).toBe(null);
    expect(moveCursor(CURSOR_START, { key: 'ArrowLeft', ctrlKey: true })).toBe(null);
  });

  test('keys belong to the editor when nothing or something inside it has the focus', () => {
    const el = inside => ({ tagName: 'BUTTON', closest: sel => (inside && sel === '#wb-editor' ? {} : null) });

    expect(inEditor(null)).toBe(true);
    expect(inEditor({ tagName: 'BODY' })).toBe(true);
    expect(inEditor(el(true))).toBe(true);
    expect(inEditor(el(false))).toBe(false);
  });
});
