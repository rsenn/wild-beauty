// The instant cut and its refinement in the background (docs/WAND.md A7). On Cut out the photo gets the picked outline as its clip at
// once; the exact cut is made by the server meanwhile and replaces the photo when it arrives, with whatever position the user gave the
// piece in the meantime. The pieces that can be tested without the editor live here. Pure.
import { findStep } from '../../core/model.js';

// the refinements running at the same time (the host has 8 cores and one apply is mostly one of them)
export const MAX_REFINING = 2;

// commands that change what a refinement relies on: the photo's image, its clip, its crop. Moves, scale, rotation, opacity, order,
// flips, duplicates and delete stay free (delete cancels the job).
const CHANGES_IMAGE = new Set(['cutPhoto', 'clipPolygon', 'clipOutline', 'setClipPolygons', 'splitClip', 'setClip', 'unclip', 'setCrop', 'replacePhoto', 'setBox']);

// is `command` refused because it acts on a photo whose exact cut is still being made? `ids` are those photos. The job's own results
// carry `refine`.
export function refineBlocked(ids, command) {
  if(!ids?.length || command.refine || command.cutout || command.wand) return false;

  return CHANGES_IMAGE.has(command.type) && ids.includes(command.id);
}

// May the cut that arrived replace the photo? Only when the photo is still the one the job started on and still wears the clip the job
// put there: otherwise it was undone, replaced or clipped again meanwhile and the result is dropped.
export function canRebase(doc, job) {
  const at = findStep(doc, job.id);

  return !!at && at.step.op === 'photo' && at.step.photo === job.photo && at.step.clip === job.clip;
}

// A queue that runs at most `limit` jobs at once, first come first served. `start(job)` returns a promise; `onChange()` is told when
// the number running or waiting changed.
export function createQueue(start, { limit = MAX_REFINING, onChange = () => {} } = {}) {
  const waiting = [];
  let running = 0;

  const pump = () => {
    while(running < limit && waiting.length) {
      const job = waiting.shift();

      running++;
      Promise.resolve()
        .then(() => start(job))
        .catch(() => {})
        .finally(() => {
          running--;
          onChange();
          pump();
        });
    }

    onChange();
  };

  return {
    add(job) {
      waiting.push(job);
      pump();
    },
    // forget a job that has not started
    drop(match) {
      const before = waiting.length;

      for(let i = waiting.length - 1; i >= 0; i--) if(match(waiting[i])) waiting.splice(i, 1);

      if(waiting.length !== before) onChange();
    },
    get running() {
      return running;
    },
    get waiting() {
      return waiting.length;
    },
  };
}
