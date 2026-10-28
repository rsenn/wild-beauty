// The graph view (GRAPH.md S3): GET /api/graph lists the nodes with their
// place and the links between them; POST /api/graph/ops applies a few edits
// (link, unlink, move, pin) in one transaction. Preliminary: no owner checks
// yet, like the node routes (canView/canEdit are always true).
import { database } from '../db/db.js';
import { LABELS, addLink, deleteNode, graphEdges, graphNodes, insertNode, removeLink, setPinned, setPosition } from '../db/nodes.js';
import { canView } from './nodes.js';

const MAX_OPS = 200;
const MAX_TITLE = 200;

// a group is a node of kind 'list' with nothing drawn on it: its members are its child links
const emptyDoc = title => ({ v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {}, ...(title && { title }) });
const COORD = 1e6;

const fail = (status, error) => Response.json({ error }, { status });
const isId = v => Number.isSafeInteger(v) && v > 0;
const isCoord = v => Number.isFinite(v) && Math.abs(v) <= COORD;

// the graph for the client -> { nodes: [...], edges: [{ from, to, label }] }
export function graphOf(h) {
  const nodes = graphNodes(h).filter(n => canView(n, null));
  const ids = new Set(nodes.map(n => n.id));

  return { nodes, edges: graphEdges(h).filter(e => ids.has(e.from) && ids.has(e.to)) };
}

// one operation -> true when it changed something, false when it was a no-op;
// throws a short code on a malformed one
export function applyOp(h, op) {
  if(!op || typeof op !== 'object') throw new Error('bad_op');

  const label = op.label ?? 'child';

  switch(op.op) {
    case 'link':
      if(!isId(op.from) || !isId(op.to) || op.from === op.to || !LABELS.includes(label)) throw new Error('bad_op');
      if(!h.get('SELECT 1 AS ok FROM nodes WHERE id = ?', op.from) || !h.get('SELECT 1 AS ok FROM nodes WHERE id = ?', op.to)) throw new Error('not_found');
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

      setPosition(h, id, op.x, op.y, true);
      ids.forEach((to, i) => addLink(h, id, to, 'child', i));

      return true;
    }
    case 'ungroup':
      // only a group (a list) goes; the nodes it linked stay
      if(!isId(op.id)) throw new Error('bad_op');
      if(h.get('SELECT kind FROM nodes WHERE id = ?', op.id)?.kind !== 'list') return false;

      return deleteNode(h, op.id);
    case 'pin':
      if(!isId(op.id) || typeof op.pinned !== 'boolean') throw new Error('bad_op');

      return setPinned(h, op.id, op.pinned);
    default:
      throw new Error('bad_op');
  }
}

export async function graphRoute(req, h) {
  h ??= await database();

  if(req.method === 'GET') return Response.json(graphOf(h), { headers: { 'cache-control': 'no-cache' } });
  if(req.method !== 'POST') return fail(405, 'method_not_allowed');

  let body;

  try {
    body = await req.json();
  } catch {
    return fail(400, 'bad_json');
  }

  if(!Array.isArray(body?.ops) || body.ops.length > MAX_OPS) return fail(400, 'bad_request');

  try {
    h.tx(() => {
      for(const op of body.ops) applyOp(h, op);
    });
  } catch(e) {
    return fail(e.message === 'not_found' ? 404 : 400, ['bad_op', 'not_found'].includes(e.message) ? e.message : 'bad_request');
  }

  return Response.json(graphOf(h));
}
