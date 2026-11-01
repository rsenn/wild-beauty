// Session replay (server/events.js recordReplay, tools/replay.js): rrweb records the page as a DOM snapshot and
// the changes to it, the pointer (also without a button), scrolling, resizing, focus and input. Typed text is
// masked here, before anything is sent: the value of every field and the text drawn on the editor stage.
// Only with the visitor's consent: the tick box (RecordConsent.js) sets the flag in this browser; a link with
// ?record=1 sets it too (for testers who are asked to), ?record=0 clears it. And only where it is of use: the
// editing pages /new and /tree of the app, a node page of one's own (its editor), and on a personal site while
// its owner is logged in. A tab keeps one
// recording id over the page changes (30 minutes of quiet end it), so the pages of a visit are one recording.
const KEY = 'wb-record';
const RID = 'wb-record-rid';
const QUIET_MS = 30 * 60 * 1000;
const FLUSH_MS = 3000;
const CHUNK = 400 * 1024; // chars of JSON per request, the server takes 2 MB

// may this page be recorded at all (when the visitor wants it)
export const recordable = boot =>
  boot?.site ? !!boot.site.owner : /^\/[a-z]{2,3}\/(new|tree)\/?$/.test(location.pathname) || (!!boot?.node?.mine && /^\/[a-z]{2,3}\/node\/\d+\/?$/.test(location.pathname));

// the id of this tab's recording: kept over page changes, renewed after a quiet half hour
const recordingId = () => {
  const fresh = Math.random().toString(36).slice(2, 10);

  try {
    const [rid, at] = (sessionStorage.getItem(RID) ?? '').split(':');
    const keep = /^[a-z0-9]{8}$/.test(rid) && Date.now() - Number(at) < QUIET_MS ? rid : fresh;

    sessionStorage.setItem(RID, `${keep}:${Date.now()}`);

    return keep;
  } catch {
    return fresh;
  }
};

const touch = rid => {
  try {
    sessionStorage.setItem(RID, `${rid}:${Date.now()}`);
  } catch {}
};

export const isRecording = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

const remember = on => {
  try {
    if(on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {}
};

// the link flags of testers, read once at the start
const fromLink = () => {
  const flag = new URLSearchParams(location.search).get('record');

  if(flag === '1' || flag === '0') remember(flag === '1');
};

const load = src =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

let stop = null;
let flush = () => {};

// start recording now; -> false when the recorder could not be loaded (a content blocker refused it)
async function begin() {
  if(stop) return true;

  try {
    if(typeof rrweb === 'undefined') await load('/vendor/session/recorder.min.js');
  } catch {
    return false;
  }

  if(typeof rrweb === 'undefined') return false;

  const rid = recordingId();
  let buffer = [];
  let timer = 0;

  flush = () => {
    clearTimeout(timer);
    timer = 0;

    while(buffer.length) {
      // one request holds whole events, up to CHUNK characters (a snapshot alone may be larger)
      let size = 0;
      let n = 0;

      while(n < buffer.length && (n === 0 || size + buffer[n].len <= CHUNK)) size += buffer[n++].len;

      const events = buffer.splice(0, n).map(item => item.event);

      touch(rid);

      fetch('/api/replay', { method: 'POST', keepalive: size < 60000, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rid, url: location.pathname, events }) }).catch(() => {});
    }
  };

  stop = rrweb.record({
    emit(event) {
      buffer.push({ event, len: JSON.stringify(event).length });
      timer ||= setTimeout(flush, FLUSH_MS);
    },
    maskAllInputs: true,
    maskTextSelector: '.wb-editor-stage text, .wb-editor-stage tspan, .wb-text-edit',
    sampling: { mousemove: 30, scroll: 100, input: 'last' },
    checkoutEveryNms: 60000,
  });

  return !!stop;
}

// the tick box: -> whether recording is on now
export async function setRecording(on) {
  if(on) {
    if(!(await begin())) return false;

    remember(true);

    return true;
  }

  remember(false);
  flush();
  stop?.();
  stop = null;

  return false;
}

// at the start of every page: records again when the visitor ticked the box before
export function startReplay(boot) {
  fromLink();

  if(isRecording() && recordable(boot) && typeof fetch === 'function') begin();

  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  addEventListener('pagehide', () => flush());
}
