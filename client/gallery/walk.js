// Walking (GALLERY.md S4, TODO 13.4): the visitor is a circle on the plan that
// moves with the input, is pushed out of the walls and keeps to the floor. No
// DOM and no three.js: the host feeds it the build's `collision` and
// `floorHeightAt`. Plan coordinates, x east and y north; yaw in radians, 0 faces
// north and turning right is positive.

import { EYE } from './scene.js';

export const WALK = {
  radius: 0.3, // body, metres
  speed: 2.2, // metres per second
  run: 2, // factor with shift
  turn: 1.8, // radians per second on a key
  pitch: 1.2, // looking up or down at most, radians
  settle: 12, // how fast the eye follows the floor height, 1/s
};

// push the circle (px, py) out of the segments [x0, y0, x1, y1, half] of the
// build (x, z = -y); the position is in plan coordinates
export function collide(px, py, r, segments) {
  for(const [x0, z0, x1, z1, half] of segments) {
    const y0 = -z0;
    const y1 = -z1;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2));
    const cx = x0 + t * dx;
    const cy = y0 + t * dy;
    const ex = px - cx;
    const ey = py - cy;
    const d = Math.hypot(ex, ey);
    const m = r + half;

    if(d < m && d > 0) {
      px = cx + (ex / d) * m;
      py = cy + (ey / d) * m;
    }
  }

  return [px, py];
}

// the visitor: { x, y, yaw, pitch, eye } from the build's start
export function createWalker(built, o = WALK) {
  const w = { x: built.start.x, y: built.start.y, yaw: (built.start.look * Math.PI) / 180, pitch: 0, eye: built.start.h + EYE };

  // input: { forward, strafe } in -1..1 (forward is +), `turn` -1..1 (right +),
  // `look: [dyaw, dpitch]` radians from the mouse or a drag, `run` boolean
  w.step = (dt, { forward = 0, strafe = 0, turn = 0, look = [0, 0], run = false } = {}) => {
    dt = Math.min(dt, 0.1);
    w.yaw += turn * o.turn * dt + look[0];
    w.pitch = Math.max(-o.pitch, Math.min(o.pitch, w.pitch + look[1]));

    const len = Math.hypot(forward, strafe);

    if(len) {
      const v = (o.speed * (run ? o.run : 1) * Math.min(1, len) * dt) / len;
      const [sx, sy] = [Math.sin(w.yaw), Math.cos(w.yaw)];
      const [nx, ny] = collide(w.x + (forward * sx + strafe * sy) * v, w.y + (forward * sy - strafe * sx) * v, o.radius, built.collision);

      // no floor there is no step: stay on the floor that exists
      if(built.floorHeightAt(nx, ny) !== null) [w.x, w.y] = [nx, ny];
    }

    const floor = built.floorHeightAt(w.x, w.y) ?? w.eye - EYE;

    w.eye += (floor + EYE - w.eye) * Math.min(1, o.settle * dt);

    return w;
  };

  return w;
}
