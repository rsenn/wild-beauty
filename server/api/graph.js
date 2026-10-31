// The graph view (GRAPH.md S3): GET /api/graph lists the nodes with their
// place and the links between them; POST /api/graph/ops applies a few edits
// (link, unlink, move, pin, visibility) in one transaction. The nodes of a site are listed
// to their owner only (canView); server/guard.js checks who may change them.
import { database } from '../db/db.js';
import { LABELS, addLink, deleteNode, graphEdges, graphNodes, insertNode, removeLink, setPinned, setPosition } from '../db/nodes.js';
import { canView } from './nodes.js';
import { viewerOf } from '../auth.js';
import { titleFor } from './gazetteer.js';

const MAX_OPS = 200;
const MAX_TITLE = 200;

// a group is a node of kind 'list' with nothing drawn on it: its members are its child links
const emptyDoc = title => ({ v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {}, ...(title && { title }) });
const COORD = 1e6;

const fail = (status, error) => Response.json({ error }, { status });
const isId = v => Number.isSafeInteger(v) && v > 0;
const isCoord = v => Number.isFinite(v) && Math.abs(v) <= COORD;

// the graph for the client -> { nodes: [...], edges: [{ from, to, label }] }
export function graphOf(h, viewer = null) {
  // the tree is the public view: the nodes of a site are not in it, for nobody
  const nodes = graphNodes(h).filter(n => !n.space && canView(n, viewer));
  const ids = new Set(nodes.map(n => n.id));

  return { nodes, edges: graphEdges(h).filter(e => ids.has(e.from) && ids.has(e.to)) };
}

// the suggestions of `node` that the place node `to` stands for go (GRAPH.md S1.5)
function dropAnswered(h, node, to) {
  const title = h.get('SELECT title FROM nodes WHERE id = ?', to).title;

  for(const s of h.all('SELECT lat, lon FROM place_suggestions WHERE node_id = ?', node)) if(titleFor(h, s) === title) h.run('DELETE FROM place_suggestions WHERE node_id = ? AND lat = ? AND lon = ?', node, s.lat, s.lon);
}

// one operation -> true when it changed something, false when it was a no-op;
// throws a short code on a malformed one
export function applyOp(h, op, { viewer = null } = {}) {
  if(!op || typeof op !== 'object') throw new Error('bad_op');

  const label = op.label ?? 'child';

  switch(op.op) {
    case 'link':
      if(!isId(op.from) || !isId(op.to) || op.from === op.to || !LABELS.includes(label)) throw new Error('bad_op');
      if(!h.get('SELECT 1 AS ok FROM nodes WHERE id = ?', op.from) || !h.get('SELECT 1 AS ok FROM nodes WHERE id = ?', op.to)) throw new Error('not_found');

      // linking a node to a place answers its suggestion for that place, whichever view made the link
      if(label === 'at') dropAnswered(h, op.from, op.to);

      // a link that exists stays where it is, unless `resort` moves it behind the others
      if(!op.resort && h.get('SELECT 1 AS ok FROM node_links WHERE from_id = ? AND to_id = ? AND label = ?', op.from, op.to, label)) return false;

      return addLink(h, op.from, op.to, label, h.get('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM node_links WHERE from_id = ?', op.from).n);
    case 'unlink':
      if(!isId(op.from) || !isId(op.to) || !LABELS.includes(label)) throw new Error('bad_op');

      return removeLink(h, op.from, op.to, label);
    case 'move':
      if(!isId(op.id) || !isCoord(op.x) || !isCoord(op.y) || (op.pinned !== undefined && typeof op.pinned !== 'boolean')) throw new Error('bad_op');

      return setPosition(h, op.id, op.x, op.y, op.pinned);
    case 'group': {
      const ids = op.ids;
      const title = op.title ?? '';

      if(!Array.isArray(ids) || ids.length < 1 || ids.length > MAX_OPS || !ids.every(isId) || new Set(ids).size !== ids.length) throw new Error('bad_op');
      if(typeof title !== 'string' || title.length > MAX_TITLE || !isCoord(op.x) || !isCoord(op.y)) throw new Error('bad_op');
      if(ids.some(id => !h.get('SELECT 1 AS ok FROM nodes WHERE id = ?', id))) throw new Error('not_found');

      const { id } = insertNode(h, { title, doc: emptyDoc(title), kind: 'list' });

      // a group of a logged-in user is theirs, and hidden like their new nodes
      if(viewer) h.run("UPDATE nodes SET owner_id = ?, visibility = 'hidden' WHERE id = ?", viewer.id, id);

      setPosition(h, id, op.x, op.y, true);
      ids.forEach((to, i) => addLink(h, id, to, 'child', i));

      return true;
    }
    case 'ungroup':
      // only a group (a list) goes; the nodes it linked stay
      if(!isId(op.id)) throw new Error('bad_op');
      if(h.get('SELECT kind FROM nodes WHERE id = ?', op.id)?.kind !== 'list') return false;

      return deleteNode(h, op.id);
    case 'visibility':
      // publish (public) or unpublish (hidden) a node of a user's; the community nodes have no owner and stay public
      if(!isId(op.id) || (op.visibility !== 'public' && op.visibility !== 'hidden')) throw new Error('bad_op');

      return h.run('UPDATE nodes SET visibility = ? WHERE id = ? AND owner_id IS NOT NULL AND visibility <> ?', op.visibility, op.id, op.visibility).changes > 0;
    case 'pin':
      if(!isId(op.id) || typeof op.pinned !== 'boolean') throw new Error('bad_op');

      return setPinned(h, op.id, op.pinned);
    default:
      throw new Error('bad_op');
  }
}

export async function graphRoute(req, h) {
  h ??= await database();

  const viewer = viewerOf(h, req);

  if(req.method === 'GET') return Response.json(graphOf(h, viewer), { headers: { 'cache-control': 'no-cache' } });
  if(req.method !== 'POST') return fail(405, 'method_not_allowed');

  let body;

  try {
    body = await req.json();
  } catch {
    return fail(400, 'bad_json');
  }

  if(!Array.isArray(body?.ops) || body.ops.length > MAX_OPS) return fail(400, 'bad_request');

  // an op may point only at a node the user can see
  for(const op of body.ops) {
    for(const id of [op?.id, op?.from, op?.to, ...(Array.isArray(op?.ids) ? op.ids : [])]) {
      if(!Number.isInteger(id)) continue;

      const node = h.get('SELECT id, owner_id, space, visibility FROM nodes WHERE id = ?', id);

      if(node && !canView(node, viewer)) return fail(404, 'not_found');
    }
  }

  try {
    h.tx(() => {
      for(const op of body.ops) applyOp(h, op, { viewer });
    });
  } catch(e) {
    return fail(e.message === 'not_found' ? 404 : 400, ['bad_op', 'not_found'].includes(e.message) ? e.message : 'bad_request');
  }

  return Response.json(graphOf(h, viewer));
}
