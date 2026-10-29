// Input for walking (GALLERY.md S4, TODO 13.4): keyboard and mouse look with
// pointer lock on a desktop, a stick (left half) and drag-look (right half) on a
// touch screen. DOM only; `read()` hands the walker the state since the last call.
//
//   const c = controls(element, { onTap(x, y) })   x, y in -1..1 (up positive)
//   walker.step(dt, c.read());   c.dispose();

const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA'],
  right: ['KeyD'],
  turnLeft: ['KeyQ', 'ArrowLeft'],
  turnRight: ['KeyE', 'ArrowRight'],
};

const LOOK = 0.0022; // radians per pixel of mouse or drag
const STICK = 60; // pixels of drag that mean full speed
const TAP = 10; // pixels, and ms * 30: a touch that moves less is a tap
const TAP_MS = 300;

export function controls(element, { onTap, onLock } = {}) {
  const down = new Set();
  const touches = new Map(); // pointer id -> { role, x0, y0, x, y, t0 }
  let look = [0, 0];
  let locked = false;
  const on = (target, type, fn, opt) => (target.addEventListener(type, fn, opt), () => target.removeEventListener(type, fn, opt));
  const holds = name => KEYS[name].some(code => down.has(code)) - 0;
  const ndc = e => {
    const r = element.getBoundingClientRect();

    return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
  };

  const off = [
    on(globalThis, 'keydown', e => {
      if(e.target?.closest?.('input, textarea, select')) return;
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
        if(!locked) element.requestPointerLock?.();
        else onTap?.(0, 0);

        return;
      }

      const r = element.getBoundingClientRect();

      element.setPointerCapture?.(e.pointerId);
      touches.set(e.pointerId, { role: e.clientX < r.left + r.width / 2 ? 'stick' : 'look', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now() });
    }),
    on(element, 'pointermove', e => {
      const t = touches.get(e.pointerId);

      if(!t) return;

      if(t.role === 'look') look = [look[0] + (e.clientX - t.x) * LOOK, look[1] - (e.clientY - t.y) * LOOK];

      t.x = e.clientX;
      t.y = e.clientY;
    }),
    ...['pointerup', 'pointercancel'].map(type =>
      on(element, type, e => {
        const t = touches.get(e.pointerId);

        touches.delete(e.pointerId);

        if(type === 'pointerup' && t && Math.hypot(e.clientX - t.x0, e.clientY - t.y0) < TAP && performance.now() - t.t0 < TAP_MS) onTap?.(...ndc(e));
      }),
    ),
    on(element, 'contextmenu', e => e.preventDefault()),
  ];

  return {
    get locked() {
      return locked;
    },
    // the input since the last read: what the walker's step takes
    read() {
      let forward = holds('forward') - holds('back');
      let strafe = holds('right') - holds('left');

      for(const t of touches.values()) {
        if(t.role !== 'stick') continue;

        forward += Math.max(-1, Math.min(1, (t.y0 - t.y) / STICK));
        strafe += Math.max(-1, Math.min(1, (t.x - t.x0) / STICK));
      }

      const out = { forward, strafe, turn: holds('turnRight') - holds('turnLeft'), look, run: down.has('Shift') };

      look = [0, 0];

      return out;
    },
    dispose() {
      for(const f of off) f();
      if(document.pointerLockElement === element) document.exitPointerLock?.();
    },
  };
}
