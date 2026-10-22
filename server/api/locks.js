// Lock endpoints (EDITOR.md S2.8, S4.1). `POST /api/nodes/:id/lock` takes or
// renews the lock (the heartbeat), `DELETE` releases it; whoever may break a
// lock (the owner, `canBreak`) removes another's with the same call. The
// holder is the hash of the session cookie, so no account is needed.
import { getNode } from '../db/nodes.js';
import { LOCK_TTL, breakLock, getLock, releaseLock, takeLock } from '../db/nodes.js';
import { database } from '../db/db.js';
import { holderLabel, sessionCookie, sessionFor } from '../session.js';

// Who may remove someone else's lock: the node's owner. The PoC has no owners,
// so everybody may.
export const canBreak = (node, viewer) => true;

const json = (status, body, session) => {
  const headers = session?.fresh ? { 'set-cookie': sessionCookie(session.token) } : {};

  return body === null ? new Response(null, { status, headers }) : Response.json(body, { status, headers });
};

// the refusal for a node locked by someone else; used by PUT and DELETE of the node too
export const lockedBody = lock => ({ error: 'locked', holder: holderLabel(lock.holder), expires_at: lock.expires_at });

// the live lock of `id` held by somebody other than `holder`, or null
export function lockedByOther(h, id, holder, now = Date.now()) {
  const lock = getLock(h, id, now);

  return lock && lock.holder !== holder ? lock : null;
}

// POST and DELETE /api/nodes/:id/lock; `now` is injectable for tests
export async function lockRoute(req, idText, h, { now = Date.now } = {}) {
  const db = h ?? (await database());
  const session = sessionFor(req);
  const node = /^\d{1,15}$/.test(idText) ? getNode(db, Number(idText)) : null;

  if(!node) return json(404, { error: 'not_found' }, session);

  if(req.method === 'POST') {
    const r = takeLock(db, node.id, session.holder, { now: now() });

    return r.ok ? json(200, { expires_at: r.expires_at, ttl: LOCK_TTL }, session) : json(423, lockedBody(r), session);
  }

  if(req.method === 'DELETE') {
    const live = getLock(db, node.id, now());

    if(!live || live.holder === session.holder) {
      releaseLock(db, node.id, session.holder);

      return json(204, null, session);
    }

    if(!canBreak(node, null)) return json(403, { error: 'forbidden' }, session);

    breakLock(db, node.id);

    return json(204, null, session);
  }

  return new Response('method not allowed\n', { status: 405 });
}
