// bun test: the local draft (client/editor/core/draft.js, docs/EDITOR.md S2.8 and S2.8b)
import { describe, expect, test } from 'bun:test';
import { DRAFT_MAX, cleanUi, draftKey, loadDraft, pruneDrafts, saveDraft } from '../client/editor/core/draft.js';
import { emptyNode } from '../client/editor/core/model.js';

const memory = () => {
  const map = new Map();

  return {
    get length() { return map.size; },
    key: i => [...map.keys()][i] ?? null,
    getItem: k => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: k => void map.delete(k),
  };
};

const snap = () => ({ doc: emptyNode(), kind: 'node' });
const DAY = 86400000;

describe('draft version 2', () => {
  test('keeps the editor state next to the document', () => {
    const storage = memory();
    const ui = { page: 1, tool: 'pen', selected: 'photo0001', multi: ['a', 'b'], panelTab: 'select', scrollY: 120.4, lists: { filmstrip: 80 } };

    expect(saveDraft(storage, 'new', snap(), {}, 5, ui)).toBe(true);

    const d = loadDraft(storage, 'new');

    expect(d.savedAt).toBe(5);
    expect(d.ui).toEqual({ ...ui, scrollY: 120 });
    expect(d.snap.kind).toBe('node');
  });

  test('a version 1 draft still loads, without a state', () => {
    const storage = memory();

    storage.setItem(draftKey('7'), JSON.stringify({ v: 1, savedAt: 9, doc: snap().doc, kind: 'node', photos: {} }));

    expect(loadDraft(storage, '7')).toMatchObject({ savedAt: 9, ui: {} });
  });

  test('a damaged state is dropped field by field, the document survives', () => {
    const storage = memory();

    storage.setItem(draftKey('new'), JSON.stringify({ v: 2, savedAt: 1, doc: snap().doc, kind: 'node', photos: {}, ui: { page: -3, tool: '<script>', selected: 5, multi: [1], scrollY: 'far', lists: { 'x y': 1, ok: 4 } } }));

    expect(loadDraft(storage, 'new').ui).toEqual({ lists: { ok: 4 } });
    expect(cleanUi(null)).toEqual({});
    expect(cleanUi([1])).toEqual({});
  });

  test('a document that does not validate is no draft', () => {
    const storage = memory();

    storage.setItem(draftKey('new'), JSON.stringify({ v: 2, savedAt: 1, doc: { v: 1 }, kind: 'node', ui: {} }));

    expect(loadDraft(storage, 'new')).toBeNull();
  });

  test('a failing storage says so', () => {
    expect(saveDraft({ setItem() { throw new Error('quota'); } }, 'new', snap())).toBe(false);
  });
});

describe('pruneDrafts', () => {
  test('a draft untouched for 30 days goes, a younger one stays', () => {
    const storage = memory();
    const now = 100 * DAY;

    saveDraft(storage, 'old', snap(), {}, now - 31 * DAY);
    saveDraft(storage, 'young', snap(), {}, now - 29 * DAY);

    expect(pruneDrafts(storage, now)).toEqual([draftKey('old')]);
    expect(loadDraft(storage, 'young')).not.toBeNull();
  });

  test('more than 10 drafts: the oldest go, but not one younger than a day nor the one being edited', () => {
    const storage = memory();
    const now = 100 * DAY;

    for(let i = 0; i < DRAFT_MAX + 3; i++) saveDraft(storage, `n${i}`, snap(), {}, now - (i + 2) * DAY);
    saveDraft(storage, 'today', snap(), {}, now - 1000);

    const gone = pruneDrafts(storage, now, 'n12');

    expect(gone.length).toBeGreaterThan(0);
    expect(gone).not.toContain(draftKey('today'));
    expect(gone).not.toContain(draftKey('n12'));
    expect(loadDraft(storage, 'today')).not.toBeNull();
  });
});

import { COVER_MS, RESUME_HOURS, isAppLaunch, loadResume, saveResume, scrollWhenReady } from '../client/editor/core/resume.js';

describe('the resume record', () => {
  const HOUR = 3600000;

  test('round trip; the age is checked', () => {
    const storage = memory();

    expect(saveResume(storage, { url: '/de/new', kind: 'editor', target: '12', scrollY: 530.6 }, 1000)).toBe(true);
    expect(loadResume(storage, 1000 + HOUR)).toEqual({ url: '/de/new', at: 1000, kind: 'editor', target: '12', scrollY: 531 });
    expect(loadResume(storage, 1000 + (RESUME_HOURS + 1) * HOUR)).toBeNull();
  });

  test('an editor record needs a target; a viewer record keeps the node and the photo only', () => {
    const storage = memory();

    saveResume(storage, { url: '/en/new', kind: 'editor' }, 5);
    expect(loadResume(storage, 6)).toBeNull();
    saveResume(storage, { url: '/en/node/7', kind: 'view', view: { node: 7, step: 'photo0003', zoom: 4, camera: [1, 2] } }, 5);
    expect(loadResume(storage, 6)).toEqual({ url: '/en/node/7', at: 5, kind: 'view', view: { node: 7, step: 'photo0003' } });
  });

  test('a stored url must stay on this site, junk is no record', () => {
    const storage = memory();

    for(const url of ['https://evil.example/', '//evil.example/x', 'javascript:alert(1)', '']) {
      storage.setItem('wb-resume', JSON.stringify({ url, at: 5, kind: 'view' }));
      expect(loadResume(storage, 6)).toBeNull();
    }

    storage.setItem('wb-resume', '{nope');
    expect(loadResume(storage, 6)).toBeNull();
  });

  test('only the start of the installed app resumes', () => {
    expect(isAppLaunch({ standalone: true, referrer: '', navType: 'navigate' })).toBe(true);
    expect(isAppLaunch({ standalone: false })).toBe(false);
    expect(isAppLaunch({ standalone: true, referrer: 'https://x/', navType: 'navigate' })).toBe(false);
    expect(isAppLaunch({ standalone: true, referrer: '', navType: 'reload' })).toBe(false);
  });
});

describe('scrollWhenReady', () => {
  const run = ({ heights, moves = [], timeout = COVER_MS, step = 100 }) => {
    let t = 0;
    let n = 0;
    const calls = [];
    const frames = [];
    let finished = false;

    scrollWhenReady(500, { scrollTo: y => calls.push(y), height: () => heights[Math.min(n, heights.length - 1)], view: () => 400, moved: () => !!moves[n], timeout, frame: cb => frames.push(cb), now: () => t, done: () => (finished = true) });

    while(frames.length && !finished && n < 100) {
      t += step;
      n++;
      frames.shift()();
    }

    return { calls, finished, n };
  };

  test('keeps scrolling while the page is too short, stops when it is tall enough', () => {
    const r = run({ heights: [600, 700, 800, 1000] });

    expect(r.finished).toBe(true);
    expect(r.calls.length).toBe(4);
    expect(new Set(r.calls)).toEqual(new Set([500]));
  });

  test('gives up after the time limit', () => {
    const r = run({ heights: [600], timeout: 450 });

    expect(r.finished).toBe(true);
    expect(r.n).toBeLessThan(10);
  });

  test('stops when the user scrolled by hand', () => {
    const r = run({ heights: [600], moves: [false, false, true] });

    expect(r.finished).toBe(true);
    expect(r.calls.length).toBe(2);
  });
});
