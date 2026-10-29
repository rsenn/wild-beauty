import { tabHeaders } from './tab.js';

// Saving a node (EDITOR.md S2.8, S4, E64): POST a new one, PUT an open one
// with the `rev` it was read at. `send` is fetch, injectable for tests.
// -> { ok: true, id, rev, photos } | { ok: false, code, status, details }
// where `code` is the server's error code ('invalid', 'too_large',
// 'missing_photo', 'bake_failed', 'conflict', 'locked', ...) or 'network'.
export async function saveNode(snap, remote, send = globalThis.fetch, { thumb } = {}) {
  const put = !!remote;
  const body = JSON.stringify({ doc: snap.doc, kind: snap.kind, ...(put && { rev: remote.rev }), ...(thumb && { thumb }) });

  let res;

  try {
    res = await send(put ? `/api/nodes/${remote.id}` : '/api/nodes', { method: put ? 'PUT' : 'POST', headers: tabHeaders({ 'content-type': 'application/json' }), body });
  } catch {
    return { ok: false, code: 'network', status: 0 };
  }

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if(!res.ok) return { ok: false, code: typeof data?.error === 'string' ? data.error : 'generic', status: res.status, details: data?.details, ...(Number.isInteger(data?.rev) && { rev: data.rev }) };

  const id = put ? remote.id : data?.id;
  const rev = data?.rev;

  if(!Number.isInteger(id) || !Number.isInteger(rev)) return { ok: false, code: 'generic', status: res.status };

  return { ok: true, id, rev, photos: data.photos && typeof data.photos === 'object' ? data.photos : {} };
}

// the message key for an error code: editor.save.error.<code>, else generic
export const SAVE_ERRORS = ['invalid', 'too_large', 'missing_photo', 'bake_failed', 'conflict', 'locked', 'forbidden', 'not_found', 'network'];
export const errorKey = code => 'editor.save.error.' + (SAVE_ERRORS.includes(code) ? code : 'generic');

// Hand the server the large render of a saved node (see putLargeRoute). Best
// effort: the server draws its own when this fails. -> boolean
export async function saveLarge(id, blob, send = globalThis.fetch) {
  try {
    return !!blob && (await send(`/api/nodes/${id}/large`, { method: 'PUT', headers: tabHeaders({ 'content-type': 'image/jpeg' }), body: blob })).ok;
  } catch {
    return false;
  }
}

// Read node `id` again (E65 "take theirs", E66 open).
// -> { ok: true, id, rev, snap: { doc, kind }, photos } | { ok: false, code, status }
export async function loadNode(id, send = globalThis.fetch) {
  let res;

  try {
    res = await send(`/api/nodes/${id}`, { headers: { accept: 'application/json' }, cache: 'no-store' });
  } catch {
    return { ok: false, code: 'network', status: 0 };
  }

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if(!res.ok) return { ok: false, code: typeof data?.error === 'string' ? data.error : 'generic', status: res.status };
  if(!data?.node?.doc || !Number.isInteger(data.rev)) return { ok: false, code: 'generic', status: res.status };

  return { ok: true, id, rev: data.rev, snap: { doc: data.node.doc, kind: data.node.kind }, photos: data.photos && typeof data.photos === 'object' ? data.photos : {} };
}

// Delete node `id` (E69). -> { ok: true } | { ok: false, code, status }; a node that
// is already gone counts as deleted.
export async function deleteNode(id, send = globalThis.fetch) {
  let res;

  try {
    res = await send(`/api/nodes/${id}`, { method: 'DELETE', headers: tabHeaders() });
  } catch {
    return { ok: false, code: 'network', status: 0 };
  }

  if(res.ok || res.status === 404) return { ok: true };

  let data = null;

  try {
    data = await res.json();
  } catch {}

  return { ok: false, code: typeof data?.error === 'string' ? data.error : 'generic', status: res.status };
}
