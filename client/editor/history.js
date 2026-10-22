// Undo/redo over document snapshots (EDITOR.md S2). Documents are immutable
// (model commands never mutate), so a snapshot is just a reference. A history
// is a plain value too: every function returns a new one.
export const MAX_UNDO = 100;

export const create = doc => ({ past: [], present: doc, future: [], key: null });

// Record `doc` as the new present. The same document again is ignored. With a
// `key` (e.g. 'opacity:abcd1234' while a slider moves), consecutive pushes with
// the same key replace the present instead of adding an undo step, so one
// undo reverts the whole drag. `seal` ends such a run.
export function push(history, doc, key = null) {
  if(doc === history.present) return history;

  if(key !== null && key === history.key) return { ...history, present: doc, future: [] };

  return { past: [...history.past, history.present].slice(-MAX_UNDO), present: doc, future: [], key };
}

// the next push starts a new undo step
export const seal = history => (history.key === null ? history : { ...history, key: null });

export const canUndo = history => history.past.length > 0;
export const canRedo = history => history.future.length > 0;

export const undo = history => (canUndo(history) ? { past: history.past.slice(0, -1), present: history.past.at(-1), future: [history.present, ...history.future], key: null } : history);

export const redo = history => (canRedo(history) ? { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1), key: null } : history);
