// Taking the controls of the flyby (GALLERY.md, the running gag): everything of it that the session
// (../session.js) does not have to know. The visitor flies the bird (pilot.js) while the loop pauses,
// works the gear and the flaps (sound.js), hears the callouts (callouts.js, voice.js), and lands
// (a medal for a perfect one), rolls out and is welcomed by ground control (ground.js).
//
//   const flight = createTakeover(built, { walker, list, tour, name, onNote, onFlight, onLanded })
//   flight.command(name)   gear, flaps, slipLeft, slipRight, slipOff: true when it was one of them
//   flight.step(dt, inp, last, base) -> the camera pose { x, y, z, yaw, pitch, roll, fov }, above the plan
//   flight.state(), flight.release(), flight.reset(), flight.dispose()
//
// `inp` is controls.js `read()`, `last` the pose of the frame before (where the bird is taken from),
// `base()` the flyby's pose, asked only while the visitor has not the bird. `onLanded(pose)` is called
// when the bird has rolled out and stopped: the session starts the walk from there.

import { PILOT, checklist, createPilot } from './pilot.js';
import { makeSound } from './sound.js';
import { createCallouts } from './callouts.js';
import { makeVoice } from './voice.js';
import { createGround } from './ground.js';

export const TAKEOVER = {
  fov: 62, // the field of view of the bird
  grace: 60, // seconds without input before the bird glides back onto the flyby's path: a minute, so one can stay in the flare
  rejoin: 2.4, // seconds that glide takes
};

const wrapAngle = a => ((a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
const mixPose = (a, b, k) => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  z: a.z + (b.z - a.z) * k,
  yaw: a.yaw + wrapAngle(b.yaw - a.yaw) * k,
  pitch: a.pitch + (b.pitch - a.pitch) * k,
  roll: a.roll + (b.roll - a.roll) * k,
  fov: a.fov + (b.fov - a.fov) * k,
});

export function createTakeover(built, { walker, list, tour, name = '', onNote, onFlight, onLanded } = {}, o = TAKEOVER) {
  let pilot = null;
  let rejoin = null; // { t, from, now }: the bird glides back onto the flyby's path
  let idle = 0;
  let slipHeld = 0;
  let aids = 0; // seconds since the instruments were last sent
  let noted = false; // the hint about the controls is given once
  let touched = false; // the touchdown has been announced; the bird is rolling out
  let gear = false;
  let flaps = 0;

  const sound = makeSound();
  const voice = makeVoice();
  const callouts = createCallouts(voice.say);
  const ground = createGround({ list, tour, walker, name });

  const api = {
    ground,

    state: () => ({ piloting: !!pilot, gear, flaps, atc: ground.state() }),

    // the keys G and F and the chips; -> true when it was a flight command (the session is above the plan)
    command(cmd) {
      if(cmd === 'gear') {
        gear = !gear;
        idle = 0; // a switch is a control too
        sound.gear(gear);
        onNote?.(gear ? 'gear.down' : 'gear.up');

        return true;
      }

      if(cmd === 'flaps') {
        const from = flaps;

        flaps = (flaps + 1) % (PILOT.flaps + 1);
        idle = 0;
        sound.flaps(flaps, from);
        onNote?.(`flaps.${flaps}`);

        return true;
      }

      if(cmd.startsWith('slip')) {
        slipHeld = cmd === 'slipLeft' ? -1 : cmd === 'slipRight' ? 1 : 0; // the chips for touch hold it

        return true;
      }

      return false;
    },

    // the visitor walks (or the bird has landed): the pilot and the glide back are over
    release() {
      pilot = rejoin = null;
    },

    // back up above the gallery, the flyby starts again: gear and flaps are up
    reset() {
      pilot = rejoin = null;
      slipHeld = 0;
      touched = false;
      gear = false;
      flaps = 0;
      sound.thrust(0);
      onFlight?.(null);
      voice.cancel();
      ground.cancel();
    },

    // one frame above the plan
    step(dt, inp, last, base) {
      const moving = inp.moving || slipHeld !== 0;

      idle = moving ? 0 : idle + dt;

      // a touch, a key or a drag takes the controls and pauses the loop; let go and it glides back
      if(moving && !pilot) {
        pilot = createPilot(built, rejoin?.now ?? last);
        pilot.gear = gear ? 1 : 0;
        pilot.flapsAt = flaps;
        rejoin = null;
        touched = false;
        callouts.reset();
        if(!noted) onNote?.('fly');
        noted = true;
      }

      if(!pilot) {
        const flyby = base();

        if(!rejoin) return flyby;

        rejoin.t += dt / o.rejoin;

        const k = Math.min(1, rejoin.t);
        const q = (rejoin.now = mixPose(rejoin.from, flyby, k * k * (3 - 2 * k)));

        if(rejoin.t >= 1) rejoin = null;

        return q;
      }

      const [bounced, belly, skidded] = [pilot.bounced, pilot.belly, pilot.skidded];

      pilot.step(dt, { ...inp, gear, flaps, slip: inp.slip || slipHeld });
      if(pilot.skidded > skidded) onNote?.('skid');
      else if(pilot.belly > belly) onNote?.('belly');
      else if(pilot.bounced > bounced) onNote?.('bounce');

      const q = { ...pilot.pose(), fov: o.fov };
      const ins = pilot.instruments();

      if(!pilot.landed) callouts.step(dt, ins); // the radar altimeter's voice and the proximity warnings

      if(onFlight && (aids += dt) >= 0.1) {
        aids = 0;
        onFlight({ ...ins, landed: !!pilot.landed, check: checklist(ins) });
      }

      if(pilot.landed && !touched) {
        touched = true;
        voice.cancel();

        if(pilot.medal) {
          sound.fanfare();
          onNote?.('medal');
        } else onNote?.('touchdown');
      }

      if(pilot.landed) sound.thrust(pilot.reverse); // the reverse thrust spools up and stows

      if(pilot.stopped) {
        // rolled out and stopped: the visitor walks from here
        walker.x = pilot.x;
        walker.y = pilot.y;
        walker.yaw = pilot.yaw;
        walker.pitch = 0;
        walker.eye = pilot.h;
        pilot = null;
        onFlight?.(null);
        voice.cancel();
        sound.thrust(0);
        onLanded?.(q);
        ground.start();
      } else if(!pilot.landed && idle > o.grace) {
        rejoin = { t: 0, from: q, now: q };
        pilot = null;
        onFlight?.(null);
        voice.cancel();
      }

      return q;
    },

    dispose() {
      sound.dispose();
      voice.cancel();
    },
  };

  return api;
}
