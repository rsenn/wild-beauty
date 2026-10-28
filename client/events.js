// Usage recording (server/events.js): taps on buttons, screen changes,
// errors, upload timings and fast repeated taps (a sign of a button that is
// hard to hit). Nothing about photo content or typed text. Batched, sent
// every few seconds and when the page is hidden.
const queue = [];
const started = performance.now();
let timer = null;

export function track(type, data = {}) {
  queue.push({ type, at: Math.round(performance.now() - started), ...data });

  if(queue.length >= 50) flush();
  else timer ??= setTimeout(flush, 5000);
}

function flush() {
  clearTimeout(timer);
  timer = null;

  if(!queue.length) return;

  const body = JSON.stringify({ events: queue.splice(0) });

  try {
    if(!navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'application/json' }))) fetch('/api/events', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
  } catch {}
}

// what was tapped, in a form that is stable and tells nothing personal
const keyOf = el => el.getAttribute('aria-label') || el.getAttribute('title') || [...el.classList].find(c => c.startsWith('wb-')) || el.tagName.toLowerCase();

const view = () => ({ w: innerWidth, h: innerHeight, orient: matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape' });

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

  // the editor surface, also when it comes later: ask at tap time
  const taps = [];

  addEventListener(
    'pointerdown',
    e => {
      const target = e.target.closest?.('button, a, [role=tab], [draggable=true]');
      const now = performance.now();

      if(target) track('tap', { key: keyOf(target), disabled: !!target.disabled, x: Math.round(e.clientX), y: Math.round(e.clientY) });
      else if(e.target.closest?.('.wb-editor-stage')) track('stage', { x: Math.round(e.clientX), y: Math.round(e.clientY) });

      taps.push({ now, x: e.clientX, y: e.clientY, target });

      while(taps.length && now - taps[0].now > 900) taps.shift();

      // three taps within 900 ms and 40 px: the finger is not hitting what it wants
      if(taps.length >= 3 && taps.every(t => Math.hypot(t.x - e.clientX, t.y - e.clientY) < 40)) {
        track('rage-tap', { key: target ? keyOf(target) : 'none', x: Math.round(e.clientX), y: Math.round(e.clientY) });
        taps.length = 0;
      }
    },
    { capture: true, passive: true },
  );
}
