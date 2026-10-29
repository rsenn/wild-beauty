// Usage recording (server/events.js): taps on buttons with the button's box,
// taps that hit nothing, whole pointer gestures (sampled paths), the editor's
// commands, a layout dump of the controls, screen changes, errors, upload
// timings and fast repeated taps (a sign of a button that is hard to hit).
// Nothing about photo content or typed text. Batched, sent every few seconds
// and when the page is hidden.
const queue = [];
const started = performance.now();
let timer = null;

export function track(type, data = {}) {
  queue.push({ type, at: Math.round(performance.now() - started), ...data });

  if(queue.length >= 50) flush();
  else timer ??= setTimeout(flush, 5000);
}

// `fetch` with keepalive survives the page closing too; a beacon is dropped by many
// privacy extensions, so it is only the fallback
function flush() {
  clearTimeout(timer);
  timer = null;

  if(!queue.length) return;

  const body = JSON.stringify({ events: queue.splice(0) });
  const send = () => fetch('/api/events', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});

  try {
    send();
  } catch {
    navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'application/json' }));
  }
}

const view = () => ({ w: innerWidth, h: innerHeight, orient: matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape' });

// the editor registers a function that returns a small snapshot of its state
// (tool, selection, page, scale, stage box); it is added to taps and gestures
let context = null;

export const setContext = fn => {
  context = fn;
};

const snapshot = () => {
  try {
    return context?.() ?? undefined;
  } catch {
    return undefined;
  }
};

const round = v => Math.round(v);
const CONTROLS = 'button, a, [role=tab], [draggable=true]';
const MISS_REACH = 80; // px: the nearest control is named for a tap this near
const SAMPLE_MS = 33; // gesture paths are sampled at about 30 Hz
const MAX_POINTS = 300;
const MAX_CONTROLS = 150;

// [x, y, w, h] of an element in viewport pixels
export const boxOf = el => {
  const r = el.getBoundingClientRect();

  return [round(r.x), round(r.y), round(r.width), round(r.height)];
};

// distance from a point to a box [x, y, w, h] (0 inside)
export const distance = (x, y, [bx, by, bw, bh]) => Math.hypot(Math.max(bx - x, 0, x - (bx + bw)), Math.max(by - y, 0, y - (by + bh)));

// the nearest of `items` ({ key, box }) to a point within `reach`, or null
export function nearest(x, y, items, reach = MISS_REACH) {
  let best = null;

  for(const item of items) {
    const d = distance(x, y, item.box);

    if(d <= reach && (!best || d < best.d)) best = { key: item.key, box: item.box, d: round(d) };
  }

  return best;
}

// the visible controls of the page as { key, box }
const visibleControls = () =>
  [...document.querySelectorAll(CONTROLS)]
    .map(el => ({ key: keyOf(el), box: boxOf(el) }))
    .filter(c => c.box[2] > 0 && c.box[3] > 0);

// the labels of what is open (menus and popovers set aria-expanded)
const openPanels = () => [...document.querySelectorAll('[aria-expanded="true"]')].map(keyOf).slice(0, 6);

// where the page is scrolled and what is open, for every pointer event
const where = () => ({ sx: round(scrollX), sy: round(scrollY), open: openPanels(), st: snapshot() });

// what was tapped, in a form that is stable and tells nothing personal
function keyOf(el) {
  return el.getAttribute('aria-label') || el.getAttribute('title') || [...el.classList].find(c => c.startsWith('wb-')) || el.tagName.toLowerCase();
}

// the editor reports each command: its type and ids, never its text or pixels
export const trackCommand = (command, applied) => track('cmd', { c: command.type, id: command.id ?? command.ids?.[0] ?? undefined, ok: applied, st: snapshot() });

export function startTracking() {
  track('session', { ...view(), dpr: devicePixelRatio, screen: [screen.width, screen.height], touch: matchMedia('(pointer: coarse)').matches, lang: navigator.language, url: location.pathname });

  let last = { orient: view().orient };

  addEventListener('resize', () => {
    const v = view();

    if(v.orient !== last.orient) track('orientation', v);

    last = v;
  });

  addEventListener('error', e => track('error', { message: String(e.message).slice(0, 200), at: `${String(e.filename).split('/').pop()}:${e.lineno}` }));
  addEventListener('unhandledrejection', e => track('error', { message: String(e.reason?.message ?? e.reason).slice(0, 200) }));
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());

  // layout dump: the box of every control, at the start and when the layout changes
  let dumped = '';
  let dumping = null;

  const dumpLayout = () => {
    dumping = null;

    const els = visibleControls().slice(0, MAX_CONTROLS).map(c => [c.key, ...c.box]);
    const stage = document.querySelector('.wb-editor-stage');
    const signature = JSON.stringify([els, stage && boxOf(stage), innerWidth, innerHeight]);

    if(signature === dumped) return;

    dumped = signature;
    track('layout', { ...view(), sx: round(scrollX), sy: round(scrollY), stage: stage ? boxOf(stage) : undefined, els });
  };
  const scheduleLayout = () => (dumping ??= setTimeout(dumpLayout, 1500));

  scheduleLayout();
  addEventListener('resize', scheduleLayout);
  new MutationObserver(scheduleLayout).observe(document.documentElement, { childList: true, subtree: true });

  // the editor surface, also when it comes later: ask at tap time
  const taps = [];
  const gestures = new Map();

  const endGesture = (e, how) => {
    const g = gestures.get(e.pointerId);

    if(!g) return;

    gestures.delete(e.pointerId);

    const dur = round(performance.now() - g.t0);
    const moved = Math.hypot(e.clientX - g.x0, e.clientY - g.y0);

    // plain taps on controls are the `tap` events; keep stage gestures and drags
    if(g.kind !== 'stage' && moved < 6 && dur < 400) return;

    g.pts.push([dur, round(e.clientX), round(e.clientY), Math.round((e.pressure ?? 0) * 100) / 100]);
    track('gesture', { kind: g.kind, ptype: g.ptype, pid: e.pointerId, dur, end: how, pointers: g.max, size: g.size, pts: g.pts, ...where() });
  };

  addEventListener('pointermove', e => {
    const g = gestures.get(e.pointerId);
    const now = performance.now();

    if(!g || now - g.last < SAMPLE_MS || g.pts.length >= MAX_POINTS) return;

    g.last = now;
    g.size = Math.max(g.size, round(Math.max(e.width ?? 0, e.height ?? 0)));
    g.pts.push([round(now - g.t0), round(e.clientX), round(e.clientY), Math.round((e.pressure ?? 0) * 100) / 100]);
  }, { capture: true, passive: true });
  addEventListener('pointerup', e => endGesture(e, 'up'), { capture: true, passive: true });
  addEventListener('pointercancel', e => endGesture(e, 'cancel'), { capture: true, passive: true });

  addEventListener(
    'pointerdown',
    e => {
      const target = e.target.closest?.(CONTROLS);
      const stage = e.target.closest?.('.wb-editor-stage');
      const now = performance.now();
      const x = round(e.clientX);
      const y = round(e.clientY);

      for(const g of gestures.values()) g.max = gestures.size + 1;

      gestures.set(e.pointerId, { t0: now, last: now, x0: e.clientX, y0: e.clientY, kind: target ? keyOf(target) : stage ? 'stage' : 'page', ptype: e.pointerType, size: round(Math.max(e.width ?? 0, e.height ?? 0)), max: gestures.size + 1, pts: [[0, x, y, Math.round((e.pressure ?? 0) * 100) / 100]] });

      if(target) {
        const box = boxOf(target);

        track('tap', { key: keyOf(target), disabled: !!target.disabled, x, y, box, rx: box[2] ? Math.round(((x - box[0]) / box[2]) * 100) / 100 : undefined, ry: box[3] ? Math.round(((y - box[1]) / box[3]) * 100) / 100 : undefined, ptype: e.pointerType, ...where() });
      } else if(stage) track('stage', { x, y, ptype: e.pointerType, ...where() });
      else if(!e.target.closest?.('input, textarea, select, label, [contenteditable]')) track('miss', { x, y, ptype: e.pointerType, near: nearest(x, y, visibleControls()) ?? undefined, ...where() });

      taps.push({ now, x: e.clientX, y: e.clientY, target });

      while(taps.length && now - taps[0].now > 900) taps.shift();

      // three taps within 900 ms and 40 px: the finger is not hitting what it wants
      if(taps.length >= 3 && taps.every(t => Math.hypot(t.x - e.clientX, t.y - e.clientY) < 40)) {
        track('rage-tap', { key: target ? keyOf(target) : 'none', x, y });
        taps.length = 0;
      }
    },
    { capture: true, passive: true },
  );
}
