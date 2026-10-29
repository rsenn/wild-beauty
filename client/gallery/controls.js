// Input for the gallery (GALLERY.md S4, TODO 13.4, 13.11). Two modes, asked of
// the session through `mode()`:
//  guide  arrows, Space, PageUp/Down or a swipe go to the next or previous
//         picture; Up/Down, the wheel or a pinch zoom; a tap picks a picture;
//         W A S D, Q E or any walking key hands over to free walking
//  free   W A S D walk, Q E / arrows turn, shift runs; pointer lock and mouse
//         look on a desktop; on a touch screen a stick (left half) and drag-look
//         (right half)
// Both: G toggles guide and free, + - and the wheel zoom. DOM only; `read()` hands
// the walker the movement since the last call.
//
//   const c = controls(element, { mode, onTap, onCommand, onZoom, onLock })
//   walker.step(dt, c.read());   c.dispose();
// `onTap(x, y)` gets the point in -1..1 (up positive); `onCommand(name)` one of
// next prev first last zoomIn zoomOut zoomReset open guide; `onZoom(factor)`.

const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA'],
  right: ['KeyD'],
  turnLeft: ['KeyQ', 'ArrowLeft'],
  turnRight: ['KeyE', 'ArrowRight'],
};

// keys that mean something else in guide mode (they are not walking then)
const GUIDE = {
  ArrowRight: 'next',
  Space: 'next',
  PageDown: 'next',
  KeyN: 'next',
  ArrowLeft: 'prev',
  PageUp: 'prev',
  KeyP: 'prev',
  Home: 'first',
  End: 'last',
  ArrowUp: 'zoomIn',
  ArrowDown: 'zoomOut',
  Enter: 'open',
  Escape: 'zoomReset',
};

// in both modes
const ALWAYS = { KeyG: 'guide', Equal: 'zoomIn', NumpadAdd: 'zoomIn', Minus: 'zoomOut', NumpadSubtract: 'zoomOut' };

const LOOK = 0.0022; // radians per pixel of mouse or drag
const STICK = 60; // pixels of drag that mean full speed
const TAP = 10; // pixels a touch may move and still be a tap
const TAP_MS = 300;
const SWIPE = 50; // pixels, mostly sideways, within SWIPE_MS
const SWIPE_MS = 700;
const WHEEL = 0.0015; // zoom per wheel unit (exponent)

export function controls(element, { mode = () => 'free', onTap, onCommand, onZoom, onLock } = {}) {
  const down = new Set();
  const touches = new Map(); // pointer id -> { role, x0, y0, x, y, t0, pinch }
  let look = [0, 0];
  let locked = false;
  let pinchFrom = 0; // distance of the two fingers when the pinch began or last moved
  const on = (target, type, fn, opt) => (target.addEventListener(type, fn, opt), () => target.removeEventListener(type, fn, opt));
  const holds = name => KEYS[name].some(code => down.has(code)) - 0;
  const ndc = e => {
    const r = element.getBoundingClientRect();

    return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
  };
  const fingers = () => [...touches.values()];
  const apart = () => {
    const [a, b] = fingers();

    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const off = [
    on(globalThis, 'keydown', e => {
      if(e.target?.closest?.('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;

      const guide = mode() === 'guide';
      const command = ALWAYS[e.code] ?? (guide ? GUIDE[e.code] : undefined);

      if(command) {
        e.preventDefault();

        // a held key repeats only for zoom; stepping on a picture takes a press each
        if(!e.repeat || command.startsWith('zoom')) onCommand?.(command);

        return;
      }

      if(Object.values(KEYS).flat().includes(e.code)) e.preventDefault();

      down.add(e.code);
      if(e.key === 'Shift') down.add('Shift');
    }),
    on(globalThis, 'keyup', e => (down.delete(e.code), e.key === 'Shift' && down.delete('Shift'))),
    on(globalThis, 'blur', () => (down.clear(), touches.clear())),
    on(document, 'pointerlockchange', () => {
      locked = document.pointerLockElement === element;
      onLock?.(locked);
    }),
    on(document, 'mousemove', e => {
      if(locked) look = [look[0] + e.movementX * LOOK, look[1] - e.movementY * LOOK];
    }),
    on(element, 'pointerdown', e => {
      if(e.pointerType === 'mouse') {
        if(mode() === 'guide') onTap?.(...ndc(e));
        else if(!locked) element.requestPointerLock?.();
        else onTap?.(0, 0);

        return;
      }

      const r = element.getBoundingClientRect();

      element.setPointerCapture?.(e.pointerId);
      touches.set(e.pointerId, { role: e.clientX < r.left + r.width / 2 ? 'stick' : 'look', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), pinch: false });

      if(touches.size === 2) {
        for(const t of fingers()) t.pinch = true; // two fingers: a pinch, not a tap, swipe or step

        pinchFrom = apart();
      }
    }),
    on(element, 'pointermove', e => {
      const t = touches.get(e.pointerId);

      if(!t) return;

      const [dx, dy] = [e.clientX - t.x, e.clientY - t.y];

      t.x = e.clientX;
      t.y = e.clientY;

      if(touches.size === 2) {
        const now = apart();

        if(pinchFrom > 0 && now > 0) onZoom?.(now / pinchFrom);

        pinchFrom = now;

        return;
      }

      if(t.role === 'look' && mode() === 'free') look = [look[0] + dx * LOOK, look[1] - dy * LOOK];
    }),
    ...['pointerup', 'pointercancel'].map(type =>
      on(element, type, e => {
        const t = touches.get(e.pointerId);

        touches.delete(e.pointerId);

        if(type !== 'pointerup' || !t || t.pinch) return;

        const [dx, dy] = [e.clientX - t.x0, e.clientY - t.y0];
        const ms = performance.now() - t.t0;

        if(Math.hypot(dx, dy) < TAP && ms < TAP_MS) onTap?.(...ndc(e));
        else if(mode() === 'guide' && Math.abs(dx) > SWIPE && Math.abs(dx) > 1.5 * Math.abs(dy) && ms < SWIPE_MS) onCommand?.(dx < 0 ? 'next' : 'prev');
      }),
    ),
    on(
      element,
      'wheel',
      e => {
        e.preventDefault();
        onZoom?.(Math.exp(-e.deltaY * WHEEL));
      },
      { passive: false },
    ),
    on(element, 'contextmenu', e => e.preventDefault()),
  ];

  return {
    get locked() {
      return locked;
    },
    // the input since the last read: what the walker's step takes, and `moving`
    // when it asks to walk or look (the session leaves guide mode then)
    read() {
      let forward = holds('forward') - holds('back');
      let strafe = holds('right') - holds('left');

      if(mode() === 'free') {
        for(const t of fingers()) {
          if(t.role !== 'stick' || t.pinch) continue;

          forward += Math.max(-1, Math.min(1, (t.y0 - t.y) / STICK));
          strafe += Math.max(-1, Math.min(1, (t.x - t.x0) / STICK));
        }
      }

      const turn = holds('turnRight') - holds('turnLeft');
      const out = { forward, strafe, turn, look, run: down.has('Shift'), moving: !!(forward || strafe || turn || look[0] || look[1]) };

      look = [0, 0];

      return out;
    },
    dispose() {
      for(const f of off) f();
      if(document.pointerLockElement === element) document.exitPointerLock?.();
    },
  };
}
