// The radar altimeter's voice and the ground proximity warnings, as on an Airbus (the running gag,
// GALLERY.md): "FIFTY ... FORTY ... THIRTY ... TWENTY ... RETARD ... TEN" on the way down, and
// "SINK RATE", "PULL UP", "TOO LOW GEAR" when the bird is doing it wrong. Pure logic: `step` takes
// the instruments (pilot.js `instruments`) and calls `say(words, { urgent })`; the voice is voice.js.
// Heights are called in feet, as in the cockpit.

export const CALLOUTS = {
  feet: 3.281, // feet in a metre
  heights: [
    [100, 'one hundred'],
    [50, 'fifty'],
    [40, 'forty'],
    [30, 'thirty'],
    [20, 'twenty'],
    [10, 'ten'],
  ],
  retard: 15, // feet: "RETARD" starts, and repeats until the wheels are on the floor
  sink: { height: 40, rate: -2.4 }, // feet, metres per second: "SINK RATE"
  pull: { height: 25, rate: -4.5 }, // "PULL UP"
  low: 50, // feet: "TOO LOW GEAR" when the gear is not down, "TOO LOW FLAPS" when the flaps are not out
  every: { retard: 1.4, sink: 2.2, pull: 1.2, gear: 3, flaps: 4 }, // seconds between repeats
};

// -> { step(dt, ins), reset() }; `ins` is { ra (metres or null), vs (m/s, up +), gear (0..1), flaps (notches) }
export function createCallouts(say, o = CALLOUTS) {
  let prev = null; // the height (feet) at the last step
  let clock = 0;
  const last = {};
  const due = (name, now) => now - (last[name] ?? -Infinity) >= o.every[name];

  return {
    step(dt, ins) {
      clock += dt;

      if(ins.ra === null || ins.ra === undefined) {
        prev = null;

        return;
      }

      const ft = ins.ra * o.feet;
      const down = ins.vs < -0.15;

      // the warnings first: they cut in over everything
      if(down && ft < o.pull.height && ins.vs < o.pull.rate && due('pull', clock)) {
        last.pull = clock;
        say('pull up', { urgent: true });
      } else if(down && ft < o.sink.height && ins.vs < o.sink.rate && due('sink', clock)) {
        last.sink = clock;
        say('sink rate', { urgent: true });
      } else if(down && ft < o.low && ins.gear < 0.95 && due('gear', clock)) {
        last.gear = clock;
        say('too low, gear', { urgent: true });
      } else if(down && ft < o.low && ins.gear >= 0.95 && ins.flaps < 1 && due('flaps', clock)) {
        last.flaps = clock;
        say('too low, flaps', { urgent: true });
      } else if(prev !== null && down) {
        // the callouts as the height passes each mark on the way down
        for(const [mark, words] of o.heights) if(prev > mark && ft <= mark) say(words);

        if(ft <= o.retard && due('retard', clock)) {
          last.retard = clock;
          say('retard');
        }
      }

      prev = ft;
    },

    reset() {
      prev = null;
      for(const k of Object.keys(last)) delete last[k];
    },
  };
}
