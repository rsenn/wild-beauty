// Sending files to POST /api/uploads (PLAN.md S6.2, S11.1): one XMLHttpRequest
// per file, because only XHR reports upload progress, and a small queue so
// three run at a time.
const STATUS = { 413: 'too-large', 415: 'unsupported', 422: 'undecodable', 400: 'empty' };

const failure = code => Object.assign(new Error(code), { code });

// -> { done: Promise<record>, abort() }; onProgress gets 0..1 of the bytes sent
export function sendFile(file, { onProgress }) {
  const xhr = new XMLHttpRequest();
  const done = new Promise((resolve, reject) => {
    xhr.open('POST', '/api/uploads');
    xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(failure('network'));
    xhr.onabort = () => reject(failure('aborted'));
    xhr.onload = () => {
      let body = null;

      try {
        body = JSON.parse(xhr.responseText);
      } catch {}

      if(xhr.status >= 200 && xhr.status < 300 && body) resolve(body);
      else reject(failure(body?.error?.code ?? STATUS[xhr.status] ?? 'generic'));
    };
    xhr.send(file);
  });

  return { done, abort: () => xhr.abort() };
}

// `onChange(id, patch)` reports { state, progress, record, error }; states:
// queued, uploading, processing (bytes sent, server still working), done, failed
export function createQueue({ concurrency = 3, onChange }) {
  const waiting = [];
  const running = new Map();

  const pump = () => {
    while(running.size < concurrency && waiting.length) {
      const { id, file } = waiting.shift();
      const task = sendFile(file, {
        onProgress: progress => onChange(id, { state: progress >= 1 ? 'processing' : 'uploading', progress }),
      });

      running.set(id, task);
      onChange(id, { state: 'uploading', progress: 0, error: null });

      task.done.then(
        record => onChange(id, { state: 'done', progress: 1, record }),
        error => error.code !== 'aborted' && onChange(id, { state: 'failed', error: error.code }),
      ).finally(() => {
        running.delete(id);
        pump();
      });
    }
  };

  return {
    add(id, file) {
      waiting.push({ id, file });
      onChange(id, { state: 'queued', progress: 0, error: null });
      pump();
    },
    // forget a waiting file or abort a running one
    cancel(id) {
      const at = waiting.findIndex(w => w.id === id);

      if(at >= 0) waiting.splice(at, 1);

      running.get(id)?.abort();
    },
  };
}
