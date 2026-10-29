import { track } from './events.js';

// Sending files to POST /api/uploads (PLAN.md S6.2, S11.1): one XMLHttpRequest
// per file, because only XHR reports upload progress, and a small queue so
// three run at a time.
const STATUS = { 413: 'too-large', 415: 'unsupported', 422: 'undecodable', 400: 'empty' };

const failure = code => Object.assign(new Error(code), { code });

// -> { done: Promise<record>, abort() }; onProgress gets 0..1 of the bytes sent
export function sendFile(file, { onProgress, pos }) {
  const xhr = new XMLHttpRequest();
  const began = performance.now();
  const done = new Promise((resolve, reject) => {
    xhr.open('POST', '/api/uploads');
    xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    if(pos) xhr.setRequestHeader('X-Position', `${pos.lat},${pos.lon}`);
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => (track('upload', { ok: false, code: 'network', bytes: file.size }), reject(failure('network')));
    xhr.onabort = () => reject(failure('aborted'));
    xhr.onload = () => {
      let body = null;

      try {
        body = JSON.parse(xhr.responseText);
      } catch {}

      const ok = xhr.status >= 200 && xhr.status < 300 && body;

      track('upload', { ok: !!ok, status: xhr.status, bytes: file.size, ms: Math.round(performance.now() - began) });

      if(ok) resolve(body);
      else reject(failure(body?.error?.code ?? STATUS[xhr.status] ?? 'generic'));
    };
    xhr.send(file);
  });

  return { done, abort: () => xhr.abort() };
}

// A dropped connection is common on a phone (the signal fades, the browser pauses
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

          if(error.code === 'network' && attempt < RETRIES) {
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
