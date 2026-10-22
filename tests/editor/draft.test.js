// bun test: client/editor/draft.js and shortcuts.js
import { describe, expect, test } from 'bun:test';
import { clearDraft, draftKey, isDirty, loadDraft, saveDraft } from '../../client/editor/draft.js';
import { emptyNode } from '../../client/editor/model.js';
import { shortcutFor } from '../../client/editor/shortcuts.js';

const A = 'a'.repeat(64);
const memory = () => {
  const data = new Map();

  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k), data };
};
const snapWith = steps => ({ doc: { ...emptyNode(), pages: [{ id: 'page0001', steps }] }, kind: 'node' });
const photoStep = { op: 'photo', id: 'photo001', photo: A, m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal' };
const info = { href: `/files/uploads/${A}.jpg`, width: 400, height: 300, padding: ['#112233', '#445566'] };

describe('isDirty', () => {
  test('equal content is clean, any change is dirty', () => {
    const saved = snapWith([]);

    expect(isDirty({ ...saved }, saved)).toBe(false);
    expect(isDirty(JSON.parse(JSON.stringify(saved)), saved)).toBe(false);
    expect(isDirty({ ...saved, kind: 'list' }, saved)).toBe(true);
    expect(isDirty(snapWith([photoStep]), saved)).toBe(true);
    expect(isDirty({ doc: { ...saved.doc, title: 'x' }, kind: 'node' }, saved)).toBe(true);
  });
});

describe('drafts', () => {
  test('save and load round trip, with only the photos the document uses', () => {
    const s = memory();
    const snap = snapWith([photoStep]);

    expect(saveDraft(s, 'new', snap, { [A]: info, ['b'.repeat(64)]: info }, 1234)).toBe(true);
    expect(s.data.has('wb-draft:new')).toBe(true);

    const d = loadDraft(s, 'new');

    expect(d.savedAt).toBe(1234);
    expect(d.snap).toEqual(snap);
    expect(Object.keys(d.photos)).toEqual([A]);
    expect(d.photos[A]).toEqual(info);
  });

  test('each target has its own draft; clear removes it', () => {
    const s = memory();

    saveDraft(s, 'new', snapWith([]), {});
    saveDraft(s, 7, snapWith([]), {});
    expect(draftKey(7)).toBe('wb-draft:7');
    clearDraft(s, 'new');
    expect(loadDraft(s, 'new')).toBeNull();
    expect(loadDraft(s, 7)).not.toBeNull();
  });

  test('damaged, foreign or hostile drafts are ignored', () => {
    const s = memory();
    const put = v => s.setItem('wb-draft:new', typeof v === 'string' ? v : JSON.stringify(v));
    const good = { v: 1, savedAt: 1, doc: emptyNode(), kind: 'node', photos: {} };

    expect(loadDraft(s, 'new')).toBeNull();

    for(const bad of ['{nope', 'null', { ...good, v: 2 }, { ...good, kind: 'blog' }, { ...good, doc: { v: 9 } }, { ...good, doc: null }]) {
      put(bad);
      expect(loadDraft(s, 'new')).toBeNull();
    }

    // photo infos that are not ours are dropped, the rest of the draft survives
    put({ ...good, photos: { [A]: { ...info, href: 'https://evil.example/x.jpg' }, nothash: info, ['c'.repeat(64)]: info } });
    expect(Object.keys(loadDraft(s, 'new').photos)).toEqual(['c'.repeat(64)]);
  });

  test('storage that throws, or none at all, never breaks anything', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); }, removeItem: () => { throw new Error('denied'); } };

    expect(saveDraft(broken, 'new', snapWith([]))).toBe(false);
    expect(loadDraft(broken, 'new')).toBeNull();
    expect(() => clearDraft(broken, 'new')).not.toThrow();
    expect(saveDraft(null, 'new', snapWith([]))).toBe(false);
    expect(loadDraft(null, 'new')).toBeNull();
  });
});

describe('shortcutFor', () => {
  const key = (k, extra = {}) => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, target: { tagName: 'BODY' }, ...extra });

  test('undo, redo and delete', () => {
    expect(shortcutFor(key('z', { ctrlKey: true }))).toBe('undo');
    expect(shortcutFor(key('Z', { metaKey: true }))).toBe('undo');
    expect(shortcutFor(key('z', { ctrlKey: true, shiftKey: true }))).toBe('redo');
    expect(shortcutFor(key('y', { ctrlKey: true }))).toBe('redo');
    expect(shortcutFor(key('Delete'))).toBe('delete');
    expect(shortcutFor(key('Backspace'))).toBe('delete');
  });

  test('other combinations, repeats and fields are left alone', () => {
    expect(shortcutFor(key('z'))).toBeNull();
    expect(shortcutFor(key('a', { ctrlKey: true }))).toBeNull();
    expect(shortcutFor(key('Delete', { shiftKey: true }))).toBeNull();
    expect(shortcutFor(key('z', { ctrlKey: true, repeat: true }))).toBeNull();
    expect(shortcutFor(key('z', { ctrlKey: true, target: { tagName: 'INPUT' } }))).toBeNull();
    expect(shortcutFor(key('Delete', { target: { tagName: 'TEXTAREA' } }))).toBeNull();
  });
});
