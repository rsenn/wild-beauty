// The profile of the logged-in user (docs/PROFILE.md S6): GET and PUT /api/profile, and
// POST /api/profile/avatar, which makes the root node (the avatar) when there is none.
import { database } from '../db/db.js';
import { DEFAULT_PREFS, USERNAME, prefsOf, viewerOf } from '../auth.js';
import { getNode, insertNode } from '../db/nodes.js';
import { emptyNode } from '../../client/editor/core/model.js';

const fail = (status, error) => Response.json({ error }, { status });
const MAX_NAME = 100;
const MAX_PATTERN = 200;

// the profile as the page shows it; `rootId` only while the node still exists
export function profileOf(h, id) {
  const row = h.get('SELECT email, username, name, pseudonym, prefs, root_id FROM users WHERE id = ?', id);

  if(!row) return null;

  const root = row.root_id ? getNode(h, row.root_id) : null;

  return { email: row.email, username: row.username ?? '', name: row.name, pseudonym: row.pseudonym, prefs: prefsOf(row.prefs), rootId: root?.id ?? null, tile: root?.tile ?? null };
}

// the fields of `body` that are given, checked -> { set } | { error, status }
export function checkProfile(h, id, body) {
  const set = {};
  const bad = error => ({ error, status: 400 });

  if(!body || typeof body !== 'object' || Array.isArray(body)) return bad('invalid');

  if(body.username !== undefined) {
    const username = typeof body.username === 'string' ? body.username.trim() : null;

    if(username === null) return bad('invalid_username');

    if(username !== '') {
      if(!USERNAME.test(username)) return bad('invalid_username');
      if(h.get('SELECT 1 AS used FROM users WHERE username = ? COLLATE NOCASE AND id <> ?', username, id)) return { error: 'username_taken', status: 409 };
    }

    set.username = username === '' ? null : username;
  }

  for(const key of ['name', 'pseudonym']) {
    if(body[key] === undefined) continue;
    if(typeof body[key] !== 'string' || body[key].length > MAX_NAME) return bad('invalid');

    set[key] = body[key].trim();
  }

  if(body.prefs !== undefined) {
    const p = body.prefs;

    if(!p || typeof p !== 'object' || Array.isArray(p)) return bad('invalid');
    if(Object.keys(p).some(k => !(k in DEFAULT_PREFS)) || Object.values(p).some(v => typeof v !== 'string' || v.length > MAX_PATTERN)) return bad('invalid');
    if(p.visibility !== undefined && p.visibility !== 'hidden' && p.visibility !== 'public') return bad('invalid');

    const stored = prefsOf(h.get('SELECT prefs FROM users WHERE id = ?', id).prefs);

    set.prefs = JSON.stringify({ ...stored, ...p });
  }

  return { set };
}

export async function profileRoute(req, pathname, h) {
  h ??= await database();

  const viewer = viewerOf(h, req);

  if(!viewer) return fail(401, 'login_required');

  if(pathname === '/api/profile/avatar') {
    if(req.method !== 'POST') return fail(405, 'method_not_allowed');

    const have = h.get('SELECT root_id FROM users WHERE id = ?', viewer.id).root_id;

    if(have && getNode(h, have)) return Response.json({ id: have });

    const title = viewer.pseudonym || viewer.name || viewer.username || viewer.email.split('@')[0];
    const { id } = insertNode(h, { title, doc: { ...emptyNode(), title }, kind: 'node' });

    h.run('UPDATE nodes SET owner_id = ?, visibility = ? WHERE id = ?', viewer.id, viewer.prefs.visibility === 'public' ? 'public' : 'hidden', id);
    h.run('UPDATE users SET root_id = ? WHERE id = ?', id, viewer.id);

    return Response.json({ id }, { status: 201 });
  }

  if(req.method === 'GET') return Response.json({ profile: profileOf(h, viewer.id) }, { headers: { 'cache-control': 'no-store' } });
  if(req.method !== 'PUT') return fail(405, 'method_not_allowed');

  const body = await req.json().catch(() => undefined);
  const r = checkProfile(h, viewer.id, body);

  if(r.error) return fail(r.status, r.error);

  const columns = Object.keys(r.set);

  if(columns.length) h.run(`UPDATE users SET ${columns.map(c => `${c} = ?`).join(', ')} WHERE id = ?`, ...columns.map(c => r.set[c]), viewer.id);

  return Response.json({ profile: profileOf(h, viewer.id) });
}
