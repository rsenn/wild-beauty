import { track } from './events.js';

// Sending files to POST /api/uploads (PLAN.md S6.2, S11.1): one XMLHttpRequest
// per file, because only XHR reports upload progress, and a small queue so
// three run at a time.
const STATUS = { 413: 'too-large', 415: 'unsupported', 422: 'undecodable', 400: 'empty' };

const failure = code => Object.assign(new Error(code), { code });

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
      body = new Blob([await file.arrayBuffer()], { type: 'application/octet-stream' });
    } catch(e) {
      track('upload', { ok: false, code: 'unreadable', name: e?.name, bytes: file.size, ms: Math.round(performance.now() - began) });
      throw failure('unreadable');
    }

    if(aborted) throw failure('aborted');

    return new Promise((resolve, reject) => {
      const sending = performance.now();

      xhr.open('POST', '/api/uploads');
      xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      if(pos) xhr.setRequestHeader('X-Position', `${pos.lat},${pos.lon}`);
      xhr.upload.onprogress = e => {
        sent = e.loaded;
        e.lengthComputable && onProgress(e.loaded / e.total);
      };
      // what a bare network error knew: how far it got and after how long
      xhr.onerror = () => (track('upload', { ok: false, code: 'network', bytes: file.size, sent, ms: Math.round(performance.now() - sending), online: navigator.onLine }), reject(failure('network')));
      xhr.onabort = () => reject(failure('aborted'));
      xhr.onload = () => {
        let json = null;

        try {
          json = JSON.parse(xhr.responseText);
        } catch {}

        const ok = xhr.status >= 200 && xhr.status < 300 && json;

        track('upload', { ok: !!ok, status: xhr.status, bytes: file.size, ms: Math.round(performance.now() - began) });

        if(ok) resolve(json);
        else reject(failure(json?.error?.code ?? STATUS[xhr.status] ?? 'generic'));
      };
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
      onChange(id, { state: 'uploading', progress: 0, error: null, attempt });

      task.done.then(
        record => {
          limit = concurrency;
          onChange(id, { state: 'done', progress: 1, record });
        },
        error => {
          if(error.code === 'aborted') return;

          if((error.code === 'network' || error.code === 'unreadable') && attempt < RETRIES) {
            limit = 1;
            onChange(id, { state: 'queued', progress: 0, error: null, attempt: attempt + 1 });
            retrying.set(id, wait(pause(attempt + 1), () => retrying.has(id) && (retrying.delete(id), waiting.push({ id, file, pos, attempt: attempt + 1 }), pump())));

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
