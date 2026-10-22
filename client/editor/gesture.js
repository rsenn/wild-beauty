// The move / scale / rotate gesture on the selection (EDITOR.md S2.4, E48) as
// a small state machine that knows nothing of the DOM. One pointer moves the
// step, two pointers move, scale and turn it together (pinch), Alt with one
// pointer scales and turns about a pivot (the step's centre). The result is
// always composed onto the matrix at the moment the pointer set last changed,
// from the start and current points: no drift however long it runs, and a
// finger lifted or added does not make the step jump.
import { multiply } from './matrix.js';
import { solveSimilarity } from './gestures.js';

// m0: the step's matrix now; slop: how far (units) a pointer must travel
// before the step moves at all, so a tap selects without nudging it
export function createGesture(m0, { slop = 4 } = {}) {
  let base = m0;
  let current = m0;
  let moved = false;
  let pivot = null; // Alt: the fixed point
  const start = new Map();
  const now = new Map();

  const rebase = () => {
    base = current;
    start.clear();

    for(const [id, p] of now) start.set(id, p);
  };

  return {
    get matrix() {
      return current;
    },
    get pointers() {
      return now.size;
    },
    get moved() {
      return moved;
    },

    // a pointer goes down at p; `alt` and `centre` make a single pointer turn about the centre
    down(id, p, { alt = false, centre = null } = {}) {
      now.set(id, p);
      rebase();
      pivot = alt && now.size === 1 ? centre : null;
    },

    // -> the new matrix, or null while nothing has moved beyond the slop
    move(id, p) {
      if(!now.has(id)) return null;

      now.set(id, p);

      const ids = [...start.keys()];
      let sim;

      if(ids.length >= 2) sim = solveSimilarity(start.get(ids[0]), start.get(ids[1]), now.get(ids[0]), now.get(ids[1]));
      else if(pivot) sim = solveSimilarity(pivot, start.get(ids[0]), pivot, now.get(ids[0]));
      else sim = solveSimilarity(start.get(ids[0]), null, now.get(ids[0]), null);

      if(!moved) {
        const travelled = ids.some(i => Math.hypot(now.get(i)[0] - start.get(i)[0], now.get(i)[1] - start.get(i)[1]) > slop);

        if(!travelled) return null;

        moved = true;
      }

      current = multiply(sim, base);

      return current;
    },

    // a pointer goes up; -> how many are left (0: the gesture is over)
    up(id) {
      now.delete(id);
      start.delete(id);
      rebase();
      pivot = null;

      return now.size;
    },
  };
}
