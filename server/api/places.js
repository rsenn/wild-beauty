// Places (GRAPH.md S1.5, EDITOR.md E138): a rounded photo position -> the place
// node below `places`. A place is a locality from the gazetteer, or else a cell
// of about 1 km titled by its rounded coordinates; its node holds no
// coordinates, only the title. GET /api/places/near?lat=&lon= looks it up
// without creating anything, POST /api/places { lat, lon } finds or creates it.
import { database } from '../db/db.js';
import { addLink, insertNode, linksFrom, listSuggestions, removeSuggestion } from '../db/nodes.js';
import { graphOf } from './graph.js';
import { emptyNode } from '../../client/editor/model.js';
import { roundPosition } from '../media/probe.js';

// A starter list; a position within RADIUS_KM of an entry is that locality.
export const GAZETTEER = [
  { name: 'Zürich', lat: 47.3769, lon: 8.5417 },
  { name: 'Bern', lat: 46.948, lon: 7.4474 },
  { name: 'Basel', lat: 47.5596, lon: 7.5886 },
  { name: 'Genève', lat: 46.2044, lon: 6.1432 },
  { name: 'Luzern', lat: 47.0502, lon: 8.3093 },
];

export const RADIUS_KM = 5;

const fail = (status, error) => Response.json({ error }, { status });

// great-circle distance in km
function km(a, b) {
  const rad = d => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;

  return 12742 * Math.asin(Math.sqrt(h));
}

// the title of the place a position belongs to
export function placeTitle(pos, gazetteer = GAZETTEER) {
  let best;
  let near = RADIUS_KM;

  for(const entry of gazetteer) {
    const d = km(pos, entry);

    if(d <= near) [best, near] = [entry, d];
  }

  return best ? best.name : `${pos.lat.toFixed(2)}, ${pos.lon.toFixed(2)}`;
}

const placesRoot = h => h.get("SELECT id FROM nodes WHERE title = 'places' AND kind = 'list'")?.id ?? null;

const titled = (h, root, title) =>
  linksFrom(h, root, 'child')
    .map(l => h.get('SELECT id, title FROM nodes WHERE id = ?', l.id))
    .find(n => n.title === title);

// -> { id, title } | { id: null, title } when no such place exists yet;
// null when there is no `places` node (run tools/seed.js)
export function findPlace(h, pos, gazetteer) {
  const root = placesRoot(h);
  const title = placeTitle(pos, gazetteer);

  if(root === null) return null;

  return { id: titled(h, root, title)?.id ?? null, title };
}

// -> { id, title, created } | null without a `places` node
export function ensurePlace(h, pos, gazetteer) {
  return h.tx(() => {
    const root = placesRoot(h);

    if(root === null) return null;

    const title = placeTitle(pos, gazetteer);
    const found = titled(h, root, title);

    if(found) return { id: found.id, title, created: false };

    const { id } = insertNode(h, { title, kind: 'node', doc: { ...emptyNode(), title } });

    addLink(h, root, id, 'child', h.get('SELECT COUNT(*) AS n FROM node_links WHERE from_id = ?', root).n);

    return { id, title, created: true };
  });
}

// The open place suggestions (GRAPH.md S1.5, EDITOR.md E140): saved nodes whose
// photos were taken at a place the node is not linked to yet.
// -> [{ node, title, lat, lon, place: { id|null, title } }]
export function pendingSuggestions(h, gazetteer) {
  const root = placesRoot(h);

  return listSuggestions(h).flatMap(({ node_id, title, lat, lon }) => {
    const name = placeTitle({ lat, lon }, gazetteer);
    const place = root === null ? null : titled(h, root, name);

    if(place && h.get("SELECT 1 AS ok FROM node_links WHERE from_id = ? AND to_id = ? AND label = 'at'", node_id, place.id)) return [];

    return [{ node: node_id, title, lat, lon, place: { id: place?.id ?? null, title: name } }];
  });
}

// one answer: { op: 'accept' | 'dismiss', node, lat, lon } -> true when a suggestion was answered
export function answerSuggestion(h, op, gazetteer) {
  if(!op || !['accept', 'dismiss'].includes(op.op) || !Number.isSafeInteger(op.node) || !Number.isFinite(op.lat) || !Number.isFinite(op.lon)) throw new Error('bad_op');

  if(!h.get('SELECT 1 AS ok FROM place_suggestions WHERE node_id = ? AND lat = ? AND lon = ?', op.node, op.lat, op.lon)) return false;

  if(op.op === 'accept') {
    const place = ensurePlace(h, { lat: op.lat, lon: op.lon }, gazetteer);

    if(!place) throw new Error('no_places_root');

    addLink(h, op.node, place.id, 'at', h.get('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM node_links WHERE from_id = ?', op.node).n);
  }

  return removeSuggestion(h, op.node, op.lat, op.lon);
}

const MAX_ANSWERS = 200;

// a position from a query or a body, snapped to the 1 km grid, or null
const positionOf = ({ lat, lon }) => (typeof lat === 'string' || typeof lat === 'number' ? roundPosition(Number(lat), Number(lon)) : null);

export async function placesRoute(req, h, gazetteer) {
  h ??= await database();

  const url = new URL(req.url);

  if(url.pathname === '/api/places/suggestions') {
    if(req.method === 'GET') return Response.json({ suggestions: pendingSuggestions(h, gazetteer) }, { headers: { 'cache-control': 'no-cache' } });
    if(req.method !== 'POST') return fail(405, 'method_not_allowed');

    let body;

    try {
      body = await req.json();
    } catch {
      return fail(400, 'bad_json');
    }

    if(!Array.isArray(body?.ops) || body.ops.length > MAX_ANSWERS) return fail(400, 'bad_request');

    try {
      h.tx(() => {
        for(const op of body.ops) answerSuggestion(h, op, gazetteer);
      });
    } catch(e) {
      return e.message === 'no_places_root' ? fail(409, 'no_places_root') : fail(400, 'bad_op');
    }

    return Response.json({ suggestions: pendingSuggestions(h, gazetteer), graph: graphOf(h) });
  }

  if(req.method === 'GET' && url.pathname === '/api/places/near') {
    const pos = positionOf(Object.fromEntries(url.searchParams));

    if(!pos) return fail(400, 'bad_position');

    const found = findPlace(h, pos, gazetteer);

    return found ? Response.json(found, { headers: { 'cache-control': 'no-cache' } }) : fail(409, 'no_places_root');
  }

  if(req.method === 'POST' && url.pathname === '/api/places') {
    let body;

    try {
      body = await req.json();
    } catch {
      return fail(400, 'bad_json');
    }

    const pos = body && typeof body === 'object' ? positionOf(body) : null;

    if(!pos) return fail(400, 'bad_position');

    const place = ensurePlace(h, pos, gazetteer);

    return place ? Response.json(place, { status: place.created ? 201 : 200 }) : fail(409, 'no_places_root');
  }

  return fail(405, 'method_not_allowed');
}
