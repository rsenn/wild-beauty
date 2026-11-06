// Where the user was (docs/EDITOR.md S2.8b R5b, R6, R7): a small record in localStorage so that the installed app, started again after a phone
// call or an accidental close, opens the editor (or the viewer) at the same place and scrolled to the same spot. Never sent to the server.
export const RESUME_KEY = 'wb-resume';
export const RESUME_HOURS = 12;
export const COVER_MS = 1500;

// { url, at, kind: 'editor' | 'view', target?, view?: { node, step?, index? }, scrollY? } as stored, or null when none, old or damaged
export function loadResume(storage, now = Date.now()) {
  try {
    const r = JSON.parse(storage.getItem(RESUME_KEY));

    if(!r || typeof r.url !== 'string' || !r.url.startsWith('/') || r.url.startsWith('//') || r.url.length > 500) return null;
    if(!Number.isFinite(r.at) || now - r.at > RESUME_HOURS * 3600000 || r.at > now + 60000) return null;
    if(r.kind !== 'editor' && r.kind !== 'view') return null;

    const out = { url: r.url, at: r.at, kind: r.kind };

    if(typeof r.target === 'string' && /^(new|\d{1,15})$/.test(r.target)) out.target = r.target;

    if(r.kind === 'editor' && !out.target) return null;

    if(r.view && typeof r.view === 'object') {
      const v = {};

      if(Number.isInteger(r.view.node) && r.view.node > 0) v.node = r.view.node;
      if(typeof r.view.step === 'string' && r.view.step.length <= 64) v.step = r.view.step;
      if(Number.isInteger(r.view.index) && r.view.index >= 0 && r.view.index < 100000) v.index = r.view.index;

      if(v.node) out.view = v;
    }

    if(Number.isFinite(r.scrollY) && r.scrollY >= 0 && r.scrollY < 1e6) out.scrollY = Math.round(r.scrollY);
    if(r.pending === true) out.pending = true; // set by the page that sends the app there, taken by the page that scrolls

    return out;
  } catch {
    return null;
  }
}

// -> true when written
export function saveResume(storage, record, now = Date.now()) {
  try {
    storage.setItem(RESUME_KEY, JSON.stringify({ ...record, at: now }));

    return true;
  } catch {
    return false;
  }
}

export function clearResume(storage) {
  try {
    storage.removeItem(RESUME_KEY);
  } catch {}
}

// Is this a start of the installed app (not a reload, not a link followed inside it, not a tab)? `standalone` is the display
// mode, `referrer` document.referrer, `navType` the navigation entry's type.
export const isAppLaunch = ({ standalone, referrer = '', navType = 'navigate' }) => !!standalone && referrer === '' && navType === 'navigate';

// Scroll `read()` to `y` and keep trying while the page grows (photos and tiles load and change its height) until it is tall
// enough, `timeout` ms have passed, or the user scrolled by hand (`moved()`). `frame` and `now` are injectable for tests.
// -> a function that stops it
export function scrollWhenReady(y, { scrollTo, height, view, moved = () => false, timeout = COVER_MS, frame = cb => requestAnimationFrame(cb), now = () => performance.now(), done = () => {} }) {
  const start = now();
  let stopped = false;
  const finish = () => {
    stopped = true;
    done();
  };

  const step = () => {
    if(stopped) return;

    if(moved()) return finish();

    scrollTo(y);

    if(height() - view() >= y || now() - start > timeout) return finish();

    frame(step);
  };

  step();

  return () => {
    stopped = true;
  };
}

// the scroll position of a resume for the editor that is about to open without a draft (NewPage sets it, NodeEditor takes it)
export const pendingResume = { scrollY: undefined };

// lift the cover the page's head put up for an app start (server/ssr.js RESUME_SCRIPT)
export const releaseCover = () => globalThis.document?.documentElement?.removeAttribute('data-wb-resume');
