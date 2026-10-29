// The thumb stick of the touch screen (GALLERY.md S4): a floating stick that starts where the
// thumb lands, so there is nothing to aim at. Pure maths, no DOM: `controls.js` feeds it the
// pointer and reads the walker's input from it, the page draws `view()`.
//   - a small push already walks (a first kick), the speed grows to full over the radius
//   - pushed beyond the radius it runs, and the stick's centre follows the thumb, so letting go
//     of the push (to stop) is a short way back
//   - pushed forward, the sideways part steers (turns) instead of side-stepping, as in driving;
//     with little forward push it side-steps
//   - the input is eased, so starting and stopping are not abrupt

export const STICK = {
  radius: 56, // pixels of push for full walking speed (at least; see `radiusFor`)
  dead: 0.1, // share of the radius that does nothing
  kick: 0.32, // speed share a push just past the dead zone gives
  run: 1.12, // share of the radius from which it runs
  reach: 1.55, // share of the radius the stick's centre lets the thumb go before it follows
  steer: 0.9, // turn input per unit of sideways push while walking forward
  side: 0.4, // side-step left in then
  forward: 0.28, // forward push from which the sideways part steers
  ease: 12, // 1/s: how fast the input follows the thumb
};

// a bigger screen asks for a bigger stick
export const radiusFor = (width, height, o = STICK) => Math.max(o.radius, Math.min(96, Math.min(width, height) * 0.14));

export function createStick(o = STICK) {
  let s = null; // { x0, y0, x, y, r }
  let out = { forward: 0, strafe: 0, turn: 0, run: false };

  const raw = () => {
    if(!s) return { forward: 0, strafe: 0, turn: 0, run: false };

    const [dx, dy] = [s.x - s.x0, s.y0 - s.y]; // forward is up the screen
    const m = Math.hypot(dx, dy) / s.r;

    if(m < o.dead) return { forward: 0, strafe: 0, turn: 0, run: false };

    const norm = Math.min(1, (m - o.dead) / (1 - o.dead));
    const v = Math.min(1, o.kick + (1 - o.kick) * norm); // speed share
    const [ux, uy] = [dx / (m * s.r), dy / (m * s.r)]; // the direction
    const forward = uy * v;
    const lateral = ux * v;
    const steering = forward > o.forward;

    return { forward, strafe: steering ? lateral * o.side : lateral, turn: steering ? lateral * o.steer : 0, run: m > o.run };
  };

  return {
    get active() {
      return !!s;
    },

    // the thumb lands at (x, y); `r` the radius for this screen
    down(x, y, r = o.radius) {
      s = { x0: x, y0: y, x, y, r };
    },

    move(x, y) {
      if(!s) return;

      s.x = x;
      s.y = y;

      // beyond the reach the centre follows, so the way back stays short
      const [dx, dy] = [x - s.x0, y - s.y0];
      const d = Math.hypot(dx, dy);
      const max = s.r * o.reach;

      if(d > max) {
        s.x0 += (dx / d) * (d - max);
        s.y0 += (dy / d) * (d - max);
      }
    },

    up() {
      s = null;
    },

    // the input for a step of `dt` seconds: the stick's, eased
    read(dt = 1 / 60) {
      const want = raw();
      const k = 1 - Math.exp(-o.ease * dt);
      const ease = (a, b) => a + (b - a) * k;

      out = { forward: ease(out.forward, want.forward), strafe: ease(out.strafe, want.strafe), turn: ease(out.turn, want.turn), run: want.run };

      // let the last of the ease die away
      for(const key of ['forward', 'strafe', 'turn']) if(Math.abs(out[key]) < 0.01 && !want[key]) out[key] = 0;

      return out;
    },

    // what to draw: the base and the knob (the knob stays inside the radius), or null
    view() {
      if(!s) return null;

      const [dx, dy] = [s.x - s.x0, s.y - s.y0];
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / s.r);

      return { x: s.x0, y: s.y0, r: s.r, knob: [s.x0 + (dx / d) * s.r * k, s.y0 + (dy / d) * s.r * k] };
    },
  };
}
