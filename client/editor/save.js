// Saving a node (EDITOR.md S2.8, S4, E64): POST a new one, PUT an open one
// with the `rev` it was read at. `send` is fetch, injectable for tests.
// -> { ok: true, id, rev, photos } | { ok: false, code, status, details }
// where `code` is the server's error code ('invalid', 'too_large',
// 'missing_photo', 'bake_failed', 'conflict', 'locked', ...) or 'network'.
export async function saveNode(snap, remote, send = globalThis.fetch) {
  const put = !!remote;
  const body = JSON.stringify({ doc: snap.doc, kind: snap.kind, ...(put && { rev: remote.rev }) });

  let res;

  try {
    res = await send(put ? `/api/nodes/${remote.id}` : '/api/nodes', { method: put ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body });
  } catch {
    return { ok: false, code: 'network', status: 0 };
  }

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if(!res.ok) return { ok: false, code: typeof data?.error === 'string' ? data.error : 'generic', status: res.status, details: data?.details };

  const id = put ? remote.id : data?.id;
  const rev = data?.rev;

  if(!Number.isInteger(id) || !Number.isInteger(rev)) return { ok: false, code: 'generic', status: res.status };

  return { ok: true, id, rev, photos: data.photos && typeof data.photos === 'object' ? data.photos : {} };
}

// the message key for an error code: editor.save.error.<code>, else generic
export const SAVE_ERRORS = ['invalid', 'too_large', 'missing_photo', 'bake_failed', 'conflict', 'locked', 'forbidden', 'not_found', 'network'];
export const errorKey = code => 'editor.save.error.' + (SAVE_ERRORS.includes(code) ? code : 'generic');
