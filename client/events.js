// Usage recording (server/events.js): taps on buttons with the button's box,
// taps that hit nothing, whole pointer gestures (sampled paths), the editor's
// commands, a layout dump of the controls, screen changes, errors, upload
// timings and fast repeated taps (a sign of a button that is hard to hit), and
// the load on the browser (slow interactions, long frames, memory, see
// startLoad). Nothing about photo content or typed text. Batched, sent every
// few seconds and when the page is hidden.
const queue = [];
const started = performance.now();
let timer = null;
let idle = null;

// the recording must not make the page sluggish: a full queue is sent when the browser is idle
// (not in the middle of a drag), at the latest after IDLE_MS
const IDLE_MS = 2000;
const whenIdle = fn => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: IDLE_MS }) : setTimeout(fn, 0));

export function track(type, data = {}) {
  const row = { type, at: Math.round(performance.now() - started), ...data };

  queue.push(row);

  if(queue.length >= 50) idle ??= whenIdle(flush);
  else timer ??= setTimeout(flush, 5000);

  return row;
}

// `fetch` with keepalive survives the page closing too; a beacon is dropped by many
// privacy extensions, so it is only the fallback
function flush() {
  clearTimeout(timer);
  timer = null;
  idle = null;
  merging = null;

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

// the editor also registers what it holds in pictures, for the `load` events
let holding = null;

export const setHolding = fn => {
  holding = fn;
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

// the same, kept until the page scrolls or resizes: reading a box forces a layout, and the
// editor's snapshot is taken for every command (dozens a second while dragging)
const boxes = new WeakMap();
let epoch = 0;

if(typeof addEventListener === 'function') for(const e of ['scroll', 'resize']) addEventListener(e, () => epoch++, { capture: true, passive: true });

export const boxOfCached = el => {
  const known = boxes.get(el);

  if(known?.epoch === epoch) return known.box;

  const box = boxOf(el);

  boxes.set(el, { epoch, box });

  return box;
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

// the editor reports each command: its type and ids, never its text or pixels. The same command
// on the same step again within MERGE_MS (a drag sends one per pointer move) only counts up the
// first one's `n` and `ms`: one row per gesture instead of dozens a second
const MERGE_MS = 400;
let merging = null;

export const trackCommand = (command, applied) => {
  const c = command.type;
  const id = command.id ?? command.ids?.[0] ?? undefined;
  const now = performance.now();

  if(merging && merging.row.c === c && merging.row.id === id && now - merging.last < MERGE_MS) {
    merging.row.n = (merging.row.n ?? 1) + 1;
    merging.row.ms = round(now - merging.first);
    merging.row.ok ||= applied;
    merging.last = now;

    return;
  }

  merging = { row: track('cmd', { c, id, ok: applied, st: snapshot() }), first: now, last: now };
};

// Browser load (TODO.md "Browser load and GUI responsiveness"), only what is slow plus a sample
// per minute:
// - `slow`: an interaction (tap, click, key) whose next paint came more than SLOW_MS after the
//   input, with the control and the editor state; `wait` is the input delay (the main thread was
//   busy), `run` the handlers, the rest is rendering
// - `frame`: an animation frame longer than FRAME_MS, with its three slowest scripts (Long
//   Animation Frames, Chrome 123+), else the bare long task
// - `load`: JS heap (Chrome), the decoded size of the page's <img> pictures and the editor's
//   photos in megapixels (about 4 MB of RAM each), every LOAD_MS while the page is visible
// Timings of the app's own code and sizes of its pictures, nothing personal.
const SLOW_MS = 200;
const FRAME_MS = 150;
const LOAD_MS = 60000;
const MB = 1 << 20;

function startLoad() {
  const observe = (type, fn, options = {}) => {
    try {
      new PerformanceObserver(list => list.getEntries().forEach(fn)).observe({ type, buffered: true, ...options });

      return true;
    } catch {
      return false;
    }
  };
  let reported = 0;

  // one interaction makes several entries (pointerdown, pointerup, click): the first slow one counts
  observe(
    'event',
    e => {
      if(!e.interactionId || e.duration < SLOW_MS || e.interactionId === reported) return;

      reported = e.interactionId;

      const control = e.target?.closest?.(CONTROLS);

      track('slow', { name: e.name, dur: round(e.duration), wait: round(e.processingStart - e.startTime), run: round(e.processingEnd - e.processingStart), key: control ? keyOf(control) : e.target?.closest?.('.wb-editor-stage') ? 'stage' : undefined, st: snapshot() });
    },
    { durationThreshold: 104 },
  );

  const frames = observe('long-animation-frame', f => {
    if(f.duration < FRAME_MS) return;

    const scripts = [...(f.scripts ?? [])]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(s => ({ dur: round(s.duration), fn: s.sourceFunctionName || undefined, src: (s.sourceURL || '').split('/').pop().split('?')[0] || undefined, by: s.invoker ? String(s.invoker).slice(0, 80) : undefined }));

    track('frame', { dur: round(f.duration), block: round(f.blockingDuration ?? 0), scripts, st: snapshot() });
  });

  if(!frames) observe('longtask', t => t.duration >= FRAME_MS && track('frame', { dur: round(t.duration), st: snapshot() }));

  const sample = () => {
    if(document.visibilityState !== 'visible') return;

    let imgs = 0;
    let px = 0;

    for(const img of document.images)
      if(img.complete && img.naturalWidth) {
        imgs++;
        px += img.naturalWidth * img.naturalHeight;
      }

    const m = performance.memory;
    let held;

    try {
      held = holding?.() ?? undefined;
    } catch {}

    track('load', { js: m ? round(m.usedJSHeapSize / MB) : undefined, heap: m ? round(m.totalJSHeapSize / MB) : undefined, limit: m ? round(m.jsHeapSizeLimit / MB) : undefined, imgs, imgMP: Math.round(px / 1e5) / 10, nodes: document.getElementsByTagName('*').length, editor: held, url: location.pathname });
  };

  setTimeout(sample, 10000);
  setInterval(sample, LOAD_MS);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && sample());
}

export function startTracking() {
  track('session', { ...view(), dpr: devicePixelRatio, screen: [screen.width, screen.height], touch: matchMedia('(pointer: coarse)').matches, lang: navigator.language, url: location.pathname, cores: navigator.hardwareConcurrency || undefined, mem: navigator.deviceMemory || undefined });
  startLoad();

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

    // not during a gesture: it reads the box of every control, which forces a layout
    if(gestures.size) return scheduleLayout();

    const els = visibleControls().slice(0, MAX_CONTROLS).map(c => [c.key, ...c.box]);
    const stage = document.querySelector('.wb-editor-stage');
    const signature = JSON.stringify([els, stage && boxOf(stage), innerWidth, innerHeight]);

    if(signature === dumped) return;

    dumped = signature;
    track('layout', { ...view(), sx: round(scrollX), sy: round(scrollY), stage: stage ? boxOf(stage) : undefined, els });
  };
  const scheduleLayout = () => (dumping ??= setTimeout(() => whenIdle(dumpLayout), 1500));

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
