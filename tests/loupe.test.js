// bun test: when the loupe shows (client/editor/loupe.js, EDITOR.md E124)
import { describe, expect, test } from 'bun:test';
import { LOUPE_TOOLS, loupeEnabled, loupeShows, readPref, toggled, writePref } from '../client/editor/loupe.js';

const store = () => {
  const map = new Map();

  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k), map };
};

describe('loupeShows', () => {
  test('by default only on small screens, for a finger or pen, in the tools that give feedback under the finger', () => {
    for(const tool of LOUPE_TOOLS) {
      expect(loupeShows({ pref: 'auto', small: true, tool, pointerType: 'touch' })).toBe(true);
      expect(loupeShows({ pref: 'auto', small: true, tool, pointerType: 'pen' })).toBe(true);
      expect(loupeShows({ pref: 'auto', small: true, tool, pointerType: 'mouse' })).toBe(false); // a mouse hides nothing
      expect(loupeShows({ pref: 'auto', small: false, tool, pointerType: 'touch' })).toBe(false); // opt-in on a big screen
    }
  });

  test('not where the tool acts at the moment of the tap', () => {
    for(const tool of ['wand', 'cutout', 'unclip', 'text', 'select']) expect(loupeShows({ pref: 'on', small: true, tool, pointerType: 'touch' })).toBe(false);
  });

  test('the select tool gets it while a handle or vertex is dragged', () => {
    expect(loupeShows({ pref: 'auto', small: true, tool: 'select', fine: true, pointerType: 'touch' })).toBe(true);
    expect(loupeShows({ pref: 'auto', small: true, tool: 'select', fine: false, pointerType: 'touch' })).toBe(false);
    expect(loupeShows({ pref: 'auto', small: false, tool: 'select', fine: true, pointerType: 'touch' })).toBe(false);
  });

  test('the visitor wins in both directions: on shows it everywhere (also for a mouse), off never', () => {
    expect(loupeShows({ pref: 'on', small: false, tool: 'pen', pointerType: 'mouse' })).toBe(true);
    expect(loupeShows({ pref: 'on', small: false, tool: 'select', fine: true, pointerType: 'mouse' })).toBe(true);
    expect(loupeShows({ pref: 'off', small: true, tool: 'pen', pointerType: 'touch' })).toBe(false);
  });
});

describe('the choice', () => {
  test('the toggle shows whether the loupe is on for this screen, and flips it', () => {
    expect(loupeEnabled('auto', true)).toBe(true);
    expect(loupeEnabled('auto', false)).toBe(false);
    expect(loupeEnabled('on', false)).toBe(true);
    expect(loupeEnabled('off', true)).toBe(false);

    expect(toggled('auto', true)).toBe('off'); // small screen: switched off
    expect(toggled('auto', false)).toBe('on'); // big screen: switched on (the opt-in)
    expect(toggled('off', true)).toBe('auto'); // back to what the screen gives: no choice kept
    expect(toggled('on', false)).toBe('auto'); // big screen, switched off again: the default
    expect(toggled('on', true)).toBe('off');
    expect(toggled('off', false)).toBe('on');
  });

  test('it is kept in this browser, and a broken storage means no choice', () => {
    const s = store();

    expect(readPref(s)).toBe('auto');
    writePref('on', s);
    expect(readPref(s)).toBe('on');
    writePref('off', s);
    expect(readPref(s)).toBe('off');
    writePref('auto', s);
    expect(s.map.size).toBe(0);
    s.setItem('wb-loupe', 'weird');
    expect(readPref(s)).toBe('auto');
    expect(readPref({ getItem() { throw new Error('blocked'); } })).toBe('auto');
    expect(() => writePref('on', { setItem() { throw new Error('blocked'); } })).not.toThrow();
  });
});
