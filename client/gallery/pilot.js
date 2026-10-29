// Taking the controls during the flyby (GALLERY.md): the visitor flies the bird for a while.
// Pure maths, no DOM and no three.js: `createPilot(built, from)` -> `step(dt, input)`.
// Plan coordinates, x east and y north, the height `h` over the scene's zero; yaw in radians, 0
// faces north and turning right is positive; pitch up positive; roll positive banks left.
//
// The bird keeps flying: the stick turns it (and banks it, as a coordinated turn does) and sets how
// steeply it climbs or descends; it levels itself when let go. Near a floor it throttles back and flares
// (the retard), and touches down when it arrives gently, level and slow enough: a landing, the
// visitor then walks. Arriving too hard bounces it back up, and so does arriving with the gear up
// (the running gag), and so does touching down still slipping. A sideslip (held: Z left, X right) crosses the
// controls: the wing goes down on one side and the nose points the other way, the track does not turn, the
// drag and the sink grow; it eases out when let go, and has to be out before the flare. The gear takes its time to come down (`GEAR` seconds), the flaps (`FLAPS`
// notches, a notch in `NOTCH` seconds) slow the bird down and make it draggy.

import { EYE } from './scene.js';
import { collide } from './walk.js';

export const PILOT = {
  cruise: 8, // metres per second
  fast: 1.5, // factor with shift
  slow: 3, // metres per second, the approach over a floor
  turn: 1.1, // radians per second on a key at full deflection
  pitch: 0.9, // radians per second the nose follows the stick, at most (twice that)
  limit: 1.1, // the steepest the nose goes
  level: 0.7, // radians per second the nose returns to level, when let go
  flare: 3, // ... and near the floor
  approach: 7, // metres over the floor where the throttle comes back
  ground: 2.5, // metres over the floor ... the nose comes up (ground effect)
  easy: 0.38, // radians: the steepest the nose goes low over a floor with the gear down
  sink: 2.6, // metres per second: the fastest touchdown that is a landing
  nose: -0.4, // the nose this low or lower at touchdown is a crash
  bank: 0.5, // radians at most
  roll: 0.25, // seconds the roll follows the turn
  wall: 3.4, // metres: below this the walls stop the bird
  top: 80, // metres: the ceiling
  radius: 0.4, // metres
  slip: { ease: 2.5, sink: 2.4, drag: 0.12, yaw: 0.28, bank: 0.32, out: 0.12 }, // ease 1/s; sink m/s and drag share at full slip; the nose off the track and the wing down, radians; slip still in at touchdown
  gear: 5.5, // seconds the gear takes to come down or go up
  notch: 1.1, // seconds a flap notch takes
  flaps: 3, // notches
  medal: { sink: 1, roll: 0.12, nose: 0.2, flaps: 2 }, // a perfect landing: gentle, level, flaps out, no bounce on the way
  drag: [0.07, 0.06], // the share of the speed the gear (all the way down) and a flap notch take away
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// the checklist of a landing worth a medal: gear down (it landed at all), the flaps out, no bounce
// before, a gentle sink, wings level, the nose near level
export const deserves = (t, o = PILOT) => t.bounced === 0 && t.flaps >= o.medal.flaps - 0.05 && t.sink <= o.medal.sink && Math.abs(t.roll) <= o.medal.roll && Math.abs(t.pitch) <= o.medal.nose;

// the checklist the aids show, from the instruments: each item is 'ok', 'wait' (on its way) or 'no'
export const checklist = (ins, o = PILOT) => ({
  gear: ins.gear > 0.95 ? 'ok' : ins.gear > 0.02 ? 'wait' : 'no',
  flaps: ins.flaps >= o.medal.flaps - 0.05 ? 'ok' : ins.flaps > 0.05 ? 'wait' : 'no',
  slip: Math.abs(ins.slip) <= o.slip.out ? 'ok' : 'no',
});

// `from` is a pose of the camera { x, y, z, yaw, pitch, roll } in scene coordinates (z = -plan y)
export function createPilot(built, from, o = PILOT) {
  const p = { x: from.x, y: -from.z, h: from.y, yaw: from.yaw, pitch: from.pitch, roll: from.roll ?? 0, speed: o.cruise, rate: 0, sink: 0, bounced: 0, belly: 0, skidded: 0, gear: 0, flapsAt: 0, slip: 0 };
  const floorAt = () => built.floorHeightAt(p.x, p.y);

  // input as the walker's: forward (+ pushes the nose down, as a flight stick), strafe and turn (right +),
  // look [dyaw, dpitch] from a drag (up pitches up), run (shift: faster)
  // -> { landed } on a touchdown; `crashed` counts the bounces
  p.step = (dt, { forward = 0, strafe = 0, turn = 0, look = [0, 0], run = false, gear = false, flaps = 0, slip = 0 } = {}) => {
    dt = Math.min(dt, 0.1);

    // the slip eases in and out; it slows the bird and sinks it
    p.slip += (clamp(slip, -1, 1) - p.slip) * Math.min(1, dt * o.slip.ease);

    // gear and flaps move at their own pace; both slow the bird
    p.gear = clamp(p.gear + clamp((gear ? 1 : 0) - p.gear, -dt / o.gear, dt / o.gear), 0, 1);
    p.flapsAt = clamp(p.flapsAt + clamp(flaps - p.flapsAt, -dt / o.notch, dt / o.notch), 0, o.flaps);

    const drag = 1 - o.drag[0] * p.gear - o.drag[1] * p.flapsAt - o.slip.drag * Math.abs(p.slip);

    const floor = floorAt();
    const above = floor === null ? Infinity : p.h - floor;
    const steer = clamp(turn + strafe, -1, 1);

    // the turn, and the roll that goes with it
    const rate = clamp(steer * o.turn + look[0] / Math.max(dt, 1e-3), -2.2, 2.2);

    p.rate += (rate - p.rate) * Math.min(1, dt * 6); // what the bank follows
    p.yaw += steer * o.turn * dt + look[0];
    p.roll += (clamp(-Math.atan((p.speed * p.rate) / 9.81) * 0.9, -o.bank, o.bank) - p.slip * o.slip.bank - p.roll) * Math.min(1, dt / o.roll);

    // the nose: the stick sets the attitude (a little forward is a gentle descent), a drag moves it, and
    // it returns to level when let go, quicker low over a floor
    p.pitch += look[1];

    if(forward) {
      const goal = -forward * o.limit;

      p.pitch += clamp(goal - p.pitch, -o.pitch * 2 * dt, o.pitch * 2 * dt);
    } else if(!look[1]) {
      const back = (above < o.ground ? o.flare : o.level) * dt;

      p.pitch += clamp(-p.pitch, -back, back);
    }

    p.pitch = clamp(p.pitch, -o.limit, o.limit);

    // an easy landing: close to a floor with the gear down the nose is kept from a steep descent, so
    // any approach that goes down to the floor arrives softly (gear up it does not, that is the gag)
    if(p.gear > 0.95 && above < o.ground + 1) p.pitch = Math.max(p.pitch, -Math.min(o.easy, Math.asin(Math.min(1, (o.sink * 0.7) / Math.max(p.speed, 0.5)))));

    // the throttle: cruise, faster on shift, back to a walking pace when close to a floor
    const eased = clamp((o.approach - above) / (o.approach - 1.5), 0, 1);
    const goal = (o.cruise * (run ? o.fast : 1) * drag) * (1 - eased) + o.slow * drag * eased;

    p.speed += (goal - p.speed) * Math.min(1, dt * 1.5);

    const along = Math.cos(p.pitch) * p.speed;
    const [nx, ny] = [p.x + Math.sin(p.yaw) * along * dt, p.y + Math.cos(p.yaw) * along * dt];

    p.sink = -Math.sin(p.pitch) * p.speed + Math.abs(p.slip) * o.slip.sink;
    p.h -= p.sink * dt;

    // walls stop it low down; no floor there is a drop it keeps over
    const [cx, cy] = p.h < o.wall ? collide(nx, ny, o.radius, built.collision) : [nx, ny];

    [p.x, p.y] = [cx, cy];

    const here = floorAt();

    if(here === null) {
      p.h = clamp(p.h, o.wall + 0.3, o.top);

      return p;
    }

    p.h = Math.min(p.h, o.top);

    if(p.h <= here + EYE + 0.05) {
      const wheels = p.gear > 0.95; // three greens
      const straight = Math.abs(p.slip) <= o.slip.out; // out of the slip: the nose is on the track
      const gentle = p.sink <= o.sink && p.pitch > o.nose && wheels && straight;

      p.h = here + EYE + 0.05;

      if(gentle) {
        p.landed = true;
        p.touch = { sink: p.sink, pitch: p.pitch, roll: p.roll, flaps: p.flapsAt, bounced: p.bounced };
        p.medal = deserves(p.touch, o);
      } else {
        p.bounced++;
        if(!straight) p.skidded++;
        if(!wheels) p.belly++; // the gear is up: it skids and bounces
        p.pitch = 0.5;
        p.speed *= 0.6;
      }
    }

    return p;
  };

  // the aids: the radar altimeter (metres from the feet to the floor under the bird, null where there is none),
  // the vertical speed (up positive), the speed over the air and the gear and the flaps
  p.instruments = () => {
    const floor = floorAt();

    return { ra: floor === null ? null : Math.max(0, p.h - floor - EYE), vs: -(-Math.sin(p.pitch) * p.speed + Math.abs(p.slip) * o.slip.sink), speed: p.speed, slip: p.slip, gear: p.gear, flaps: p.flapsAt };
  };

  // the camera pose, scene coordinates
  p.pose = () => ({ x: p.x, y: p.h, z: -p.y, yaw: p.yaw - p.slip * o.slip.yaw, pitch: p.pitch, roll: p.roll });

  return p;
}
