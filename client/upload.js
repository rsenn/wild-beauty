import { track } from './events.js';

// Sending files to POST /api/uploads (docs/PLAN.md S6.2, S11.1): one XMLHttpRequest
// per file, because only XHR reports upload progress, and a small queue so
// three run at a time.
const STATUS = { 413: 'too-large', 415: 'unsupported', 422: 'undecodable', 400: 'empty' };

const failure = code => Object.assign(new Error(code), { code });

// A read that never settles (a cloud photo the phone is still fetching) must not hold the queue
// for ever: after READ_MS it counts as unreadable like one that fails at once.
export const READ_MS = 15000;

// A connection that stops answering without an error (a phone in a tunnel, a proxy that lost the
// request) must not leave a card "uploading" for ever or hold one of the queue's places: no progress
// for STALL_MS while sending, or no reply for REPLY_MS after the last byte (the server converts and
// reads the picture meanwhile), counts as a dropped connection and is sent again. The server keeps
// a file it has already stored by its hash, so a send repeated after a lost reply costs nothing.
export const STALL_MS = 45000;
export const REPLY_MS = 120000;

const withTimeout = (promise, ms) => {
  let timer;

  return Promise.race([promise, new Promise((_, reject) => (timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { name: 'TimeoutError' })), ms)))]).finally(() => clearTimeout(timer));
};

// the other ways to get at a file's bytes: another reader, and slice by slice (a handle that
// refuses one big read sometimes gives ranges). They are tried only after `arrayBuffer` failed.
const viaReader = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader'));
    reader.readAsArrayBuffer(file);
  });

const SLICE = 256 * 1024;
const viaSlices = async file => {
  const parts = [];

  for(let at = 0; at < file.size; at += SLICE) parts.push(await file.slice(at, at + SLICE).arrayBuffer());

  return new Blob(parts);
};

// -> the file's bytes (an ArrayBuffer or a Blob); on failure an Error with `tried`: what each path said
export async function readBytes(file, ms = READ_MS) {
  const tried = [];

  for(const [how, read] of [['buffer', () => file.arrayBuffer()], ['reader', () => viaReader(file)], ['slices', () => viaSlices(file)]]) {
    if(typeof FileReader === 'undefined' && how === 'reader') continue;

    try {
      return await withTimeout(read(), ms);
    } catch(e) {
      tried.push(`${how}:${e?.name ?? 'error'}`);

      // a read that hung is not tried again by another path: it would hang as well
      if(e?.name === 'TimeoutError') break;
    }
  }

  throw Object.assign(new Error('unreadable'), { tried });
}

// -> { done: Promise<record>, abort() }; onProgress gets 0..1 of the bytes sent
//
// The file is read into memory first (`arrayBuffer`) and that copy is sent. A phone
// hands over a photo from the gallery or a cloud app as a lazy handle: the bytes
// are only fetched when the request reads them, and when that fails (a cloud photo
// not downloaded, the permission gone after a few files) the request dies at once
// with a bare "network" error and never reaches the server (2026-10-29: 6 uploads
// went through, the next 200 failed within 40 ms each). Reading first makes that
// failure a clear one, `unreadable`, which is retried, and a read costs no more
// memory than the 3 files in flight.
export function sendFile(file, { onProgress, pos }) {
  const xhr = new XMLHttpRequest();
  const began = performance.now();
  let aborted = false;
  let sent = 0;
  const done = (async () => {
    let body;

    try {
      body = new Blob([await readBytes(file)], { type: 'application/octet-stream' });
    } catch(e) {
      // what the next occurrence needs to be understood: every path's answer, the file's type, the
      // age of its modification stamp (a file changed after it was picked is refused by the browser),
      // and the shape of its name (a picker's own number, a camera's date)
      track('upload', {
        ok: false,
        code: 'unreadable',
        name: e?.tried?.[0]?.split(':')[1] ?? e?.name,
        tried: e?.tried,
        bytes: file.size,
        type: file.type,
        ext: /\.(\w{1,5})$/.exec(file.name ?? '')?.[1]?.toLowerCase(),
        picker: /^\d{9,}\./.test(file.name ?? ''),
        age: file.lastModified ? Math.round((Date.now() - file.lastModified) / 1000) : null,
        ms: Math.round(performance.now() - began),
      });
      throw failure('unreadable');
    }

    if(aborted) throw failure('aborted');

    return new Promise((resolve, reject) => {
      const sending = performance.now();

      let stalled = false;
      let watchdog;
      const watch = ms => (clearTimeout(watchdog), (watchdog = setTimeout(() => ((stalled = true), xhr.abort()), ms)));

      xhr.open('POST', '/api/uploads');
      xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      if(pos) xhr.setRequestHeader('X-Position', `${pos.lat},${pos.lon}`);
      xhr.upload.onprogress = e => {
        sent = e.loaded;
        watch(STALL_MS);
        e.lengthComputable && onProgress(e.loaded / e.total);
      };
      xhr.upload.onload = () => watch(REPLY_MS);
      // what a bare network error knew: how far it got and after how long
      xhr.onerror = () => (clearTimeout(watchdog), track('upload', { ok: false, code: 'network', bytes: file.size, sent, ms: Math.round(performance.now() - sending), online: navigator.onLine }), reject(failure('network')));
      xhr.onabort = () => {
        clearTimeout(watchdog);

        if(!stalled) return reject(failure('aborted'));

        track('upload', { ok: false, code: 'network', stalled: true, bytes: file.size, sent, ms: Math.round(performance.now() - sending), online: navigator.onLine });
        reject(failure('network'));
      };
      xhr.onload = () => {
        clearTimeout(watchdog);

        let json = null;

        try {
          json = JSON.parse(xhr.responseText);
        } catch {}

        const ok = xhr.status >= 200 && xhr.status < 300 && json;

        track('upload', { ok: !!ok, status: xhr.status, bytes: file.size, ms: Math.round(performance.now() - began) });

        if(ok) resolve(json);
        else reject(failure(json?.error?.code ?? STATUS[xhr.status] ?? 'generic'));
      };
      watch(STALL_MS);
      xhr.send(body);
    });
  })();

  return {
    done,
    abort: () => {
      aborted = true;
      xhr.abort();
    },
  };
}

// A dropped connection (or a photo that could not be read yet) is common on a phone (the signal fades, the browser pauses
// the page): the file is sent again, up to RETRIES times, after a growing pause. A
// file the server already stored is recognised by its hash, so a retry of an upload
// that only lost its reply costs nothing. After a drop only one file goes at a time,
// until one has got through.
export const RETRIES = 4;
export const pause = attempt => 1500 * attempt * attempt;

// A file the phone cannot read is the same dead handle on every attempt, so it gets only a
// couple of quick tries (a cloud photo may be there by then) before the card asks for the file
// again; it also does not slow the other files down (only a dropped connection does).
export const READ_RETRIES = 2;
export const readPause = attempt => 1000 * attempt;

// `onChange(id, patch)` reports { state, progress, record, error, attempt }; states:
// queued, uploading, processing (bytes sent, server still working), done, failed
// `send` and `wait` are injectable for the tests.
export function createQueue({ concurrency = 3, onChange, send = sendFile, wait = (ms, fn) => setTimeout(fn, ms) }) {
  const waiting = [];
  const running = new Map();
  const retrying = new Map(); // id -> timer, a file waiting for its next attempt
  let limit = concurrency;

  const pump = () => {
    while(running.size < limit && waiting.length) {
      const { id, file, pos, attempt = 0 } = waiting.shift();
      const task = send(file, {
        pos,
        onProgress: progress => onChange(id, { state: progress >= 1 ? 'processing' : 'uploading', progress }),
      });

      running.set(id, task);
      onChange(id, { state: 'uploading', progress: 0, error: null, attempt, retry: null });

      task.done.then(
        record => {
          limit = concurrency;
          onChange(id, { state: 'done', progress: 1, record });
        },
        error => {
          if(error.code === 'aborted') return;

          const unreadable = error.code === 'unreadable';
          const tries = unreadable ? READ_RETRIES : RETRIES;

          if((error.code === 'network' || unreadable) && attempt < tries) {
            if(!unreadable) limit = 1;
            // `retry` tells the card why it waits: { n, of, reason }
            onChange(id, { state: 'queued', progress: 0, error: null, attempt: attempt + 1, retry: { n: attempt + 1, of: tries, reason: error.code } });
            retrying.set(id, wait((unreadable ? readPause : pause)(attempt + 1), () => retrying.has(id) && (retrying.delete(id), waiting.push({ id, file, pos, attempt: attempt + 1 }), pump())));

            return;
          }

          onChange(id, { state: 'failed', error: error.code });
        },
      ).finally(() => {
        running.delete(id);
        pump();
      });
    }
  };

  return {
    add(id, file, pos) {
      waiting.push({ id, file, pos });
      onChange(id, { state: 'queued', progress: 0, error: null });
      pump();
    },
    // forget a waiting file or abort a running one
    cancel(id) {
      const at = waiting.findIndex(w => w.id === id);

      if(at >= 0) waiting.splice(at, 1);

      if(retrying.has(id)) (clearTimeout(retrying.get(id)), retrying.delete(id));

      running.get(id)?.abort();
    },
  };
}
