// Who may write a node (SITES.md S13). The nodes of the open public area have
// no owner and no space: everybody may create and change them, logged in or not.
// A node of a user (owner_id) is changed by its owner only, and a user's new node
// is theirs. `tools/adopt.js` gives an ownerless node an owner.
import { viewerOf } from './auth.js';

// may `viewer` change `node`?
export const mayWrite = (node, viewer) => (!!viewer && node.owner_id === viewer.id) || (node.owner_id === null && !node.space);

// the ids a write request changes, and whether it changes anything at all
// -> { writes: bool, ids: [...] }; for the graph view only what an op changes
// (the `from` of a link, the node of a move), not what it points at
export async function writtenIds(req, pathname) {
  const node = /^\/api\/nodes\/(\d{1,15})(?:\/(?:lock|large|visibility))?$/.exec(pathname);

  if(node) return { writes: true, ids: [Number(node[1])] };

  if(pathname !== '/api/graph' && pathname !== '/api/graph/ops') return { writes: false, ids: [] };

  try {
    const { ops } = await req.clone().json();

    if(!Array.isArray(ops)) return { writes: true, ids: [] };

    return { writes: true, ids: ops.flatMap(op => (op?.op === 'link' || op?.op === 'unlink' ? [op.from] : op?.op === 'group' ? [] : [op?.id])).filter(id => Number.isInteger(id)) };
  } catch {
    return { writes: true, ids: [] };
  }
}

const refuse = (status, error) => Response.json({ error }, { status });

// -> Response (401 for an owned node without a login, 403 for someone else's) or null
export async function guard(req, pathname, h) {
  if(req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return null;

  const viewer = viewerOf(h, req);

  if(pathname === '/api/nodes' && req.method === 'POST') return null;

  const { writes, ids } = await writtenIds(req, pathname);

  if(!writes || !ids.length) return null;

  const rows = h.all(`SELECT id, owner_id, space FROM nodes WHERE id IN (${ids.map(() => '?').join(',')})`, ...ids);

  return rows.every(row => mayWrite(row, viewer)) ? null : refuse(viewer ? 403 : 401, viewer ? 'forbidden' : 'login_required');
}
