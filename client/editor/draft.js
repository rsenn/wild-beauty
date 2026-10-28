// Dirty tracking and the local draft (EDITOR.md S2.8, E43). While an editor
// has unsaved changes its snapshot is written to localStorage so a reload, a
// crash or an accidental close does not lose the work. Every storage access
// is in a try/catch: a private window or a full disk just means no draft.
import { fingerprint } from './commands.js';
import { KINDS, validate } from './model.js';

export const DRAFT_VERSION = 1;
export const DRAFT_INTERVAL = 3000;

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

// -> true when written
export function saveDraft(storage, target, snap, photos = {}, now = Date.now()) {
  try {
    storage.setItem(draftKey(target), JSON.stringify({ v: DRAFT_VERSION, savedAt: now, doc: snap.doc, kind: snap.kind, photos: usedPhotos(snap, photos) }));

    return true;
  } catch {
    return false;
  }
}

const isPhotoInfo = p => p && typeof p.href === 'string' && p.href.startsWith('/files/') && p.width > 0 && p.height > 0 && (p.padding === undefined || p.padding === null || (Array.isArray(p.padding) && p.padding.every(c => typeof c === 'string')));

// -> { savedAt, snap: { doc, kind }, photos } or null: nothing stored, not
// ours, or damaged. A stored draft is untrusted input: the document goes
// through the same validation as one from the server.
export function loadDraft(storage, target) {
  try {
    const raw = storage.getItem(draftKey(target));
    const d = raw && JSON.parse(raw);

    if(!d || d.v !== DRAFT_VERSION || !KINDS.includes(d.kind) || validate(d.doc).length) return null;

    const photos = d.photos && typeof d.photos === 'object' ? Object.fromEntries(Object.entries(d.photos).filter(([hash, p]) => /^[0-9a-f]{64}$/.test(hash) && isPhotoInfo(p))) : {};

    return { savedAt: Number(d.savedAt) || 0, snap: { doc: d.doc, kind: d.kind }, photos };
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
