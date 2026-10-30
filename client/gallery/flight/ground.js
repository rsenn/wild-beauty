// Ground control after a landing from the flyby (GALLERY.md, the running gag): written, no audio. It
// welcomes the visitor, offers a taxi to the gate (the first picture of the guided tour: its title, else
// n/total), and signs off when the gate is reached, by the taxi or on foot.
//
//   phases: welcome (the offer stands), taxi (on the way), arrived (shown for `stay` seconds, then gone)

export const GROUND = {
  stay: 7, // seconds the last word stays
  gate: 1.5, // metres from the first picture's standing spot that count as the gate
};

// `list` the stations (stations.js), `tour` and `walker` (tour.js, walk.js), `name` the gallery's name
// -> { start(), cancel(), state(), offered(), guided(i), step(dt, mode) }
export function createGround({ list, tour, walker, name = '' }, o = GROUND) {
  let atc = null; // { phase, gate, name }
  let clock = 0;

  return {
    start() {
      atc = { phase: 'welcome', gate: list[0]?.child?.title || `1/${list.length}`, name };
      clock = 0;
    },

    cancel() {
      atc = null;
    },

    state: () => atc,

    // is the taxi on offer (the guided-tour button then reads Taxi)
    offered: () => atc?.phase === 'welcome',

    // the guide goes to picture `i`: the first one is taking the taxi, any other is going one's own way
    guided(i) {
      if(atc) atc = atc.phase !== 'arrived' && i === 0 ? { ...atc, phase: 'taxi' } : null;
    },

    // once a frame; `mode` is the session's: guide (the tour walks) or free
    step(dt, mode) {
      if(atc && atc.phase !== 'arrived' && list.length && (mode === 'guide' ? tour.index === 0 && !tour.moving : Math.hypot(walker.x - list[0].x, walker.y - list[0].y) < o.gate)) {
        atc = { ...atc, phase: 'arrived' };
        clock = 0;
      }

      if(atc?.phase === 'arrived' && (clock += dt) > o.stay) atc = null;
    },
  };
}
