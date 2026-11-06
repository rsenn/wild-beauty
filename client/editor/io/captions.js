import { tabHeaders } from '../core/tab.js';

// Saving the notes of photos from the node view (docs/GALLERY.md S5c): the changes made within
// `wait` ms go out as one PATCH /api/nodes/:id/captions, one request at a time, each with the
// `rev` the one before answered. `send` is fetch and `later` is setTimeout, injectable for tests.
// -> { set(stepId, text), flush(), pending(), rev(), onState(fn) }
// A state is { status: 'saved' | 'saving' | 'error', code?, rev }: 'conflict' (the node changed
// elsewhere, `rev` is the stored one), 'locked', 'too_large', 'forbidden', 'network' or 'generic';
// after an error the changes stay queued and the next set() or flush() tries them again.
export function createCaptionSaver({ id, rev, wait = 900, send = globalThis.fetch, later = globalThis.setTimeout, clear = globalThis.clearTimeout } = {}) {
  let current = rev;
  let queued = {};
  let timer = null;
  let running = null;
  const listeners = new Set();

  const say = state => listeners.forEach(fn => fn({ rev: current, ...state }));
  const count = () => Object.keys(queued).length;

  const run = async () => {
    if(running) return running;

    running = (async () => {
      while(count()) {
        const batch = queued;

        queued = {};
        say({ status: 'saving' });

        let res;

        try {
          res = await send(`/api/nodes/${id}/captions`, { method: 'PATCH', headers: tabHeaders({ 'content-type': 'application/json' }), body: JSON.stringify({ rev: current, set: batch }) });
        } catch {
          queued = { ...batch, ...queued };

          return say({ status: 'error', code: 'network' });
        }

        let data = null;

        try {
          data = await res.json();
        } catch {}

        if(res.ok && Number.isInteger(data?.rev)) {
          current = data.rev;
          continue;
        }

        queued = { ...batch, ...queued };

        if(Number.isInteger(data?.rev)) current = data.rev; // a conflict says the stored rev: the next try can use it

        return say({ status: 'error', code: typeof data?.error === 'string' ? data.error : 'generic' });
      }

      say({ status: 'saved' });
    })().finally(() => (running = null));

    return running;
  };

  return {
    // the text of a step (empty or null removes the note)
    set(stepId, text) {
      queued[stepId] = text === '' ? null : text;
      clear(timer);
      timer = later(run, wait);
    },

    // now: used when the author leaves the field or moves on
    flush() {
      clear(timer);
      timer = null;

      return run();
    },

    pending: () => count() > 0 || !!running,
    rev: () => current,

    onState(fn) {
      listeners.add(fn);

      return () => listeners.delete(fn);
    },
  };
}
