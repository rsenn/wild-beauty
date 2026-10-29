// Input for the gallery (GALLERY.md S4, TODO 13.4, 13.11). Two modes, asked of
// the session through `mode()`:
//  guide  arrows, Space, PageUp/Down or a swipe go to the next or previous
//         picture; Up/Down, the wheel or a pinch zoom; a tap picks a picture;
//         W A S D, Q E or any walking key hands over to free walking
//  free   W A S D walk, Q E / arrows turn, shift runs; pointer lock and mouse
//         look on a desktop; on a touch screen a stick (left half) and drag-look
//         (right half)
//  overview  the bird's-eye flyby: the same stick, drag and keys fly the bird (the session
//         pilots it, pilot.js); keys count only while the pointer is over the stage
// Both: G toggles guide and free, + - and the wheel zoom. DOM only; `read()` hands
// the walker the movement since the last call.
//
//   const c = controls(element, { mode, onTap, onCommand, onZoom, onLock, onStick })
//   walker.step(dt, c.read());   c.dispose();
// `onTap(x, y)` gets the point in -1..1 (up positive); `onCommand(name)` one of
// next prev first last zoomIn zoomOut zoomReset open guide gear flaps; `onZoom(factor)`;
// `onStick(view)` the thumb stick to draw ({ x, y, r, knob } in pixels of the element) or null.

import { createStick, radiusFor } from './stick.js';

const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA'],
  right: ['KeyD'],
  turnLeft: ['KeyQ', 'ArrowLeft'],
  turnRight: ['KeyE', 'ArrowRight'],
  slipLeft: ['KeyZ'], // above the plan: a sideslip, held (pilot.js)
  slipRight: ['KeyX'],
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

// above the plan G and F are the bird's gear and flaps (the running gag, pilot.js)
const FLY = { KeyG: 'gear', KeyF: 'flaps' };

const LOOK = 0.0022; // radians per pixel of mouse drag
const LOOK_TOUCH = 0.0034; // and of a thumb
const FLIGHT = { reach: 64, dead: 8 }; // pixels of drag for the bird's full deflection; none under the dead zone
const TAP = 10; // pixels a touch may move and still be a tap
const TAP_MS = 300;
const SWIPE = 50; // pixels, mostly sideways, within SWIPE_MS
const SWIPE_MS = 700;
const WHEEL = 0.0015; // zoom per wheel unit (exponent)

export function controls(element, { mode = () => 'free', onTap, onCommand, onZoom, onLock, onStick } = {}) {
  const down = new Set();
  const steers = () => mode() === 'free' || mode() === 'overview'; // walking or flying: the stick, the drag and the keys steer
  let over = false; // the pointer is over the stage
  let flight = null; // a finger flying the bird: { id, x0, y0, x, y }, steering by how far it is from where it touched down
  let dragging = null; // the mouse button held in the overview: a drag steers
  const stick = createStick();
  let stickId = null; // the pointer that works the stick
  let before = performance.now();
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

      // above the plan the page owns the keys (scrolling, typing) unless the stage is what the visitor is at
      if(mode() === 'overview' && !over && !document.fullscreenElement) return;

      const guide = mode() === 'guide';
      const command = mode() === 'overview' ? FLY[e.code] : (ALWAYS[e.code] ?? (guide ? GUIDE[e.code] : undefined));

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
    on(element, 'pointerenter', () => (over = true)),
    on(element, 'pointerleave', () => ((over = false), down.clear())),
    on(element, 'pointerdown', e => {
      if(e.pointerType === 'mouse') {
        if(mode() === 'overview') {
          dragging = e.pointerId;
          element.setPointerCapture?.(e.pointerId);
        } else if(mode() === 'guide') onTap?.(...ndc(e));
        else if(!locked) element.requestPointerLock?.();
        else onTap?.(0, 0);

        return;
      }

      const r = element.getBoundingClientRect();

      // above the plan one finger is a flight stick, wherever it lands: right turns, up climbs, down dives
      if(mode() === 'overview') {
        element.setPointerCapture?.(e.pointerId);

        if(!flight) {
          flight = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
          onStick?.({ x: e.clientX - r.left, y: e.clientY - r.top, r: FLIGHT.reach * 0.6, knob: [e.clientX - r.left, e.clientY - r.top] });
        }

        return;
      }

      const left = e.clientX < r.left + r.width * 0.55; // the stick has a little more than the left half

      element.setPointerCapture?.(e.pointerId);
      touches.set(e.pointerId, { role: left ? 'stick' : 'look', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), pinch: false });

      if(left && stickId === null && steers()) {
        stickId = e.pointerId;
        stick.down(e.clientX - r.left, e.clientY - r.top, radiusFor(r.width, r.height));
        onStick?.(stick.view());
      }

      if(touches.size === 2) {
        for(const t of fingers()) t.pinch = true; // two fingers: a pinch, not a tap, swipe or step

        pinchFrom = apart();
      }
    }),
    on(element, 'pointermove', e => {
      if(flight && e.pointerId === flight.id) {
        const r = element.getBoundingClientRect();
        const [dx, dy] = [e.clientX - flight.x0, e.clientY - flight.y0];
        const len = Math.hypot(dx, dy) || 1;
        const k = Math.min(len, FLIGHT.reach) / len;

        [flight.x, flight.y] = [e.clientX, e.clientY];
        onStick?.({ x: flight.x0 - r.left, y: flight.y0 - r.top, r: FLIGHT.reach * 0.6, knob: [flight.x0 - r.left + dx * k * 0.6, flight.y0 - r.top + dy * k * 0.6] });

        return;
      }

      if(e.pointerId === dragging) look = [look[0] + e.movementX * LOOK, look[1] - e.movementY * LOOK];

      const t = touches.get(e.pointerId);

      if(!t) return;

      const [dx, dy] = [e.clientX - t.x, e.clientY - t.y];

      t.x = e.clientX;
      t.y = e.clientY;

      if(touches.size === 2 && stickId === null) {
        const now = apart();

        if(pinchFrom > 0 && now > 0) onZoom?.(now / pinchFrom);

        pinchFrom = now;

        return;
      }

      if(e.pointerId === stickId) {
        const r = element.getBoundingClientRect();

        stick.move(e.clientX - r.left, e.clientY - r.top);
        onStick?.(stick.view());
      } else if(t.role === 'look' && steers()) look = [look[0] + dx * LOOK_TOUCH, look[1] - dy * LOOK_TOUCH];
    }),
    ...['pointerup', 'pointercancel'].map(type =>
      on(element, type, e => {
        const t = touches.get(e.pointerId);

        touches.delete(e.pointerId);
        if(e.pointerId === dragging) dragging = null;

        if(flight && e.pointerId === flight.id) {
          flight = null;
          onStick?.(null);

          return;
        }

        if(e.pointerId === stickId) {
          stickId = null;
          stick.up();
          onStick?.(null);
        }

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
      let turn = holds('turnRight') - holds('turnLeft');
      let run = down.has('Shift');
      const slip = holds('slipRight') - holds('slipLeft');
      const now = performance.now();
      const pad = stick.read(Math.min(0.1, (now - before) / 1000));

      // the flight stick: how far the finger is from where it touched down, past a dead zone
      if(flight) {
        const axis = d => (Math.abs(d) < FLIGHT.dead ? 0 : Math.max(-1, Math.min(1, (d - Math.sign(d) * FLIGHT.dead) / (FLIGHT.reach - FLIGHT.dead))));

        turn += axis(flight.x - flight.x0);
        forward += axis(flight.y - flight.y0); // down dives, up climbs
      }

      before = now;

      if(steers()) {
        forward += pad.forward;
        strafe += pad.strafe;
        turn += pad.turn;
        run ||= pad.run;
      }

      const out = { forward, strafe, turn, look, run, slip, moving: !!(forward || strafe || turn || slip || look[0] || look[1]) };

      look = [0, 0];

      return out;
    },
    dispose() {
      for(const f of off) f();
      onStick?.(null);
      if(document.pointerLockElement === element) document.exitPointerLock?.();
    },
  };
}
