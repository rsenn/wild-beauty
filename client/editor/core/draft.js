// Dirty tracking and the local draft (docs/EDITOR.md S2.8, E43). While an editor
// has unsaved changes its snapshot is written to localStorage so a reload, a
// crash or an accidental close does not lose the work. Every storage access
// is in a try/catch: a private window or a full disk just means no draft.
import { fingerprint } from './commands.js';
import { KINDS, validate } from './model.js';

export const DRAFT_VERSION = 2; // 2 adds `ui`, the editor's state (docs/EDITOR.md S2.8b); version 1 drafts still load
export const DRAFT_INTERVAL = 3000; // the safety net; the editor writes 250 ms after a change (DRAFT_DEBOUNCE) and at once on hide
export const DRAFT_DEBOUNCE = 250;
export const DRAFT_KEEP_DAYS = 30;
export const DRAFT_MAX = 10;
const MAX_IDS = 200;

export const draftKey = target => `wb-draft:${target}`;

// the browser's storage, or null where it is unavailable
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// unsaved changes: the document or the kind differs from the saved snapshot
export const isDirty = (snap, saved) => fingerprint(snap) !== fingerprint(saved);

// the part of the photo table a draft needs to show its photos again
const usedPhotos = (snap, photos) => {
  const used = new Set(snap.doc.pages.flatMap(page => page.steps.filter(step => step.op === 'photo').map(step => step.photo)));

  return Object.fromEntries(Object.entries(photos).filter(([hash]) => used.has(hash)));
};

const id = x => typeof x === 'string' && x.length > 0 && x.length <= 64;
const count = (x, max) => Number.isInteger(x) && x >= 0 && x <= max;

// The editor's state of a draft, from untrusted input: what is not right is left out, never the whole draft.
// -> { page?, slide?, tool?, selected?, multi?, panelTab?, scrollY?, lists? }
export function cleanUi(ui) {
  if(!ui || typeof ui !== 'object' || Array.isArray(ui)) return {};

  const out = {};

  if(count(ui.page, 1000)) out.page = ui.page;
  if(count(ui.slide, 100000)) out.slide = ui.slide;
  if(typeof ui.tool === 'string' && /^[a-z-]{1,24}$/.test(ui.tool)) out.tool = ui.tool;
  if(id(ui.selected)) out.selected = ui.selected;
  if(Array.isArray(ui.multi) && ui.multi.length <= MAX_IDS && ui.multi.every(id)) out.multi = ui.multi;
  if(typeof ui.panelTab === 'string' && /^[a-z-]{1,24}$/.test(ui.panelTab)) out.panelTab = ui.panelTab;
  if(Number.isFinite(ui.scrollY) && ui.scrollY >= 0 && ui.scrollY < 1e6) out.scrollY = Math.round(ui.scrollY);

  if(ui.lists && typeof ui.lists === 'object' && !Array.isArray(ui.lists)) {
    const lists = Object.fromEntries(Object.entries(ui.lists).filter(([name, top]) => /^[a-z-]{1,24}$/.test(name) && Number.isFinite(top) && top >= 0 && top < 1e6).slice(0, 12).map(([name, top]) => [name, Math.round(top)]));

    if(Object.keys(lists).length) out.lists = lists;
  }

  return out;
}

// -> true when written; `ui` is the editor's state (cleanUi says what is kept)
export function saveDraft(storage, target, snap, photos = {}, now = Date.now(), ui = {}) {
  try {
    storage.setItem(draftKey(target), JSON.stringify({ v: DRAFT_VERSION, savedAt: now, doc: snap.doc, kind: snap.kind, photos: usedPhotos(snap, photos), ui: cleanUi(ui) }));

    return true;
  } catch {
    return false;
  }
}

const isPhotoInfo = p => p && typeof p.href === 'string' && p.href.startsWith('/files/') && p.width > 0 && p.height > 0 && (p.padding === undefined || p.padding === null || (Array.isArray(p.padding) && p.padding.every(c => typeof c === 'string')));

// -> { savedAt, snap: { doc, kind }, photos, ui } or null: nothing stored, not
// ours, or damaged. A stored draft is untrusted input: the document goes
// through the same validation as one from the server.
export function loadDraft(storage, target) {
  try {
    const raw = storage.getItem(draftKey(target));
    const d = raw && JSON.parse(raw);

    if(!d || (d.v !== 1 && d.v !== DRAFT_VERSION) || !KINDS.includes(d.kind) || validate(d.doc).length) return null;

    const photos = d.photos && typeof d.photos === 'object' ? Object.fromEntries(Object.entries(d.photos).filter(([hash, p]) => /^[0-9a-f]{64}$/.test(hash) && isPhotoInfo(p))) : {};

    return { savedAt: Number(d.savedAt) || 0, snap: { doc: d.doc, kind: d.kind }, photos, ui: d.v === 1 ? {} : cleanUi(d.ui) };
  } catch {
    return null;
  }
}

export function clearDraft(storage, target) {
  try {
    storage.removeItem(draftKey(target));
  } catch {}
}

// the photos every stored draft of this browser still uses (originals of cutouts
// too): an upload sweep must not take them
export function draftHashes(storage) {
  const out = new Set();

  try {
    for(let i = 0; i < storage.length; i++) {
      const key = storage.key(i);

      if(!key?.startsWith('wb-draft:')) continue;

      for(const page of JSON.parse(storage.getItem(key))?.doc?.pages ?? [])
        for(const step of page.steps ?? [])
          if(step.op === 'photo') for(const hash of [step.photo, step.orig]) if(/^[0-9a-f]{64}$/.test(hash ?? '')) out.add(hash);
    }
  } catch {}

  return out;
}

// Housekeeping of the stored drafts (docs/EDITOR.md S2.8b R8): a draft untouched for 30 days goes, and of more than
// 10 the oldest go, except one younger than a day. `keep` is the target being edited. -> the keys removed
export function pruneDrafts(storage, now = Date.now(), keep = null) {
  const gone = [];

  try {
    const drafts = [];

    for(let i = 0; i < storage.length; i++) {
      const key = storage.key(i);

      if(!key?.startsWith('wb-draft:')) continue;

      let savedAt = 0;

      try {
        savedAt = Number(JSON.parse(storage.getItem(key))?.savedAt) || 0;
      } catch {}

      drafts.push({ key, savedAt });
    }

    const old = d => now - d.savedAt > DRAFT_KEEP_DAYS * 86400000;
    const fresh = drafts.filter(d => !old(d)).sort((a, b) => b.savedAt - a.savedAt);
    const surplus = fresh.slice(DRAFT_MAX).filter(d => now - d.savedAt > 86400000 && d.key !== draftKey(keep));

    for(const d of [...drafts.filter(old), ...surplus]) {
      if(d.key === draftKey(keep)) continue;

      storage.removeItem(d.key);
      gone.push(d.key);
    }
  } catch {}

  return gone;
}
