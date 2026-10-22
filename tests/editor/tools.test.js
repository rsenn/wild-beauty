// bun test: client/editor/tools.js
import { describe, expect, test } from 'bun:test';
import { DEFAULT_TOOL, TOOLS, cursorOf, toolForKey } from '../../client/editor/tools.js';

const key = (k, extra = {}) => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false, target: { tagName: 'BODY' }, ...extra });

describe('toolForKey', () => {
  test('every tool key selects its tool, either case', () => {
    for(const { id, key: k } of TOOLS) {
      expect(toolForKey(key(k))).toBe(id);
      expect(toolForKey(key(k.toLowerCase()))).toBe(id);
    }
  });

  test('Escape goes back to select; other keys do nothing', () => {
    expect(toolForKey(key('Escape'))).toBe(DEFAULT_TOOL);
    for(const k of ['x', 'Enter', 'ArrowLeft', ' ', '1']) expect(toolForKey(key(k))).toBeNull();
  });

  test('shortcuts, repeats and typing in a field are left alone', () => {
    expect(toolForKey(key('p', { ctrlKey: true }))).toBeNull();
    expect(toolForKey(key('p', { metaKey: true }))).toBeNull();
    expect(toolForKey(key('p', { altKey: true }))).toBeNull();
    expect(toolForKey(key('p', { repeat: true }))).toBeNull();

    for(const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) expect(toolForKey(key('p', { target: { tagName } }))).toBeNull();

    expect(toolForKey(key('p', { target: { tagName: 'DIV', isContentEditable: true } }))).toBeNull();
    expect(toolForKey(key('p', { target: { tagName: 'BUTTON' } }))).toBe('pen');
  });
});

describe('the table', () => {
  test('unique ids and keys, a cursor for each', () => {
    expect(new Set(TOOLS.map(t => t.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map(t => t.key)).size).toBe(TOOLS.length);
    expect(cursorOf('pen')).toBe('crosshair');
    expect(cursorOf('text')).toBe('text');
    expect(cursorOf('nothing')).toBe('default');
    expect(TOOLS.every(t => typeof t.cursor === 'string')).toBe(true);
    expect(TOOLS[0].id).toBe(DEFAULT_TOOL);
  });
});
