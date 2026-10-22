// The editor's lock on an open node (EDITOR.md S2.8, E67): take it, renew it
// every 20 s, release it on close. State: 'idle' | 'held' | 'locked' (someone
// else had it when we asked: read-only) | 'lost' (we had it and it is gone:
// read-only, the draft is kept). `send` and the timers are injectable for tests.
import { tabHeaders } from './tab.js';

export const HEARTBEAT = 20000;

export function createLock(id, { send = globalThis.fetch, interval = HEARTBEAT, timers = { setInterval: (fn, ms) => setInterval(fn, ms), clearInterval: id => clearInterval(id) }, onChange = () => {} } = {}) {
  let state = 'idle';
  let info = null; // { holder, expires_at } of whoever has it
  let timer = null;
  let stopped = false;

  const set = (next, nextInfo = null) => {
    if(state === next && info?.holder === nextInfo?.holder && info?.expires_at === nextInfo?.expires_at) return;

    state = next;
    info = nextInfo;
    onChange({ state, info });
  };

  const call = async method => {
    try {
      const res = await send(`/api/nodes/${id}/lock`, { method, headers: tabHeaders(), ...(method === 'DELETE' && { keepalive: true }) });
      let data = null;

      try {
        data = await res.json();
      } catch {}

      return { status: res.status, data };
    } catch {
      return { status: 0, data: null };
    }
  };

  const stopTimer = () => {
    if(timer !== null) timers.clearInterval(timer);

    timer = null;
  };

  // ask for the lock; a network failure changes nothing, the next beat asks again
  const take = async () => {
    const r = await call('POST');

    if(stopped) return state;

    if(r.status === 200) set('held');
    else if(r.status === 423) {
      set(state === 'held' || state === 'lost' ? 'lost' : 'locked', { holder: r.data?.holder, expires_at: r.data?.expires_at });
      stopTimer(); // read-only now: nothing to renew
    } else if(r.status === 404) {
      set('lost', { gone: true });
      stopTimer();
    }

    return state;
  };

  const beat = () => {
    if(timer === null) timer = timers.setInterval(() => take(), interval);
  };

  return {
    get state() {
      return state;
    },
    get info() {
      return info;
    },

    // take the lock and keep it
    async start() {
      stopped = false;
      await take();

      if(state === 'held') beat();

      return state;
    },

    // ask again (after a save released it, or the user wants the lock back)
    async retake() {
      stopped = false;
      await take();

      if(state === 'held') beat();

      return state;
    },

    // remove whoever's lock it is, then take it
    async breakLock() {
      await call('DELETE');
      state = 'idle';
      info = null;

      return this.retake();
    },

    // release it (close, unmount, page hide)
    stop() {
      stopped = true;
      stopTimer();

      if(state === 'held') call('DELETE');

      state = 'idle';
    },
  };
}
