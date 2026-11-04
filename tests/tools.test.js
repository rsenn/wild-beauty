// bun test: the tool column, its groups and keys (E37)
import { expect, test } from 'bun:test';
import { SLOTS, TOOLS, slotOf, toolForKey } from '../client/editor/input/toolTable.js';

const key = k => toolForKey({ key: k, target: { tagName: 'DIV' } });

test('grouped tools share one slot, the first member is its default', () => {
  expect(SLOTS.map(s => s.id)).toEqual(['select', 'pen', 'shape', 'clip', 'wand', 'text']);
  expect(slotOf('unclip').members.map(m => m.id)).toEqual(['clip', 'unclip']);
  expect(slotOf('cutout').members.map(m => m.id)).toEqual(['wand', 'lasso', 'cutout']);
  expect(slotOf('pen').members).toHaveLength(1);
  expect(slotOf('nope')).toBeNull();
});

test('every tool keeps its own key, also inside a group', () => {
  expect(key('u')).toBe('unclip');
  expect(key('B')).toBe('cutout');
  expect(key('w')).toBe('wand');
  expect(key('l')).toBe('lasso');
  expect(new Set(TOOLS.map(t => t.key)).size).toBe(TOOLS.length);
});
