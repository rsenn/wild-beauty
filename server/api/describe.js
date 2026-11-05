// POST /api/photos/describe { hashes } -> { [hash]: { place, taken } } (docs/BATCH.md S6a):
// the name of the place and the capture time of photos, for generated descriptions. Only
// photos that a node of the logged-in user uses are answered; the position itself never leaves.
import { database } from '../db/db.js';
import { viewerOf } from '../auth.js';
import { getPlaceName, photoTaken, photoWhere } from '../db/nodes.js';
import { roundPosition } from '../media/probe.js';
import { nearestCity } from './geoname.js';

export const MAX_HASHES = 2000;

const fail = (status, error) => Response.json({ error }, { status });

// a name for the position: the cached Swiss municipality, else the nearest city of the list, else null
export function placeOf(h, where) {
  const pos = roundPosition(where.lat, where.lon);
  const known = pos && getPlaceName(h, pos);

  return typeof known === 'string' ? known : (nearestCity(where)?.name ?? null);
}

export async function describeRoute(req, h) {
  if(req.method !== 'POST') return fail(405, 'method_not_allowed');

  h ??= await database();

  const viewer = viewerOf(h, req);

  if(!viewer) return fail(401, 'login_required');

  let body;

  try {
    body = await req.json();
  } catch {
    return fail(400, 'bad_json');
  }

  const hashes = body?.hashes;

  if(!Array.isArray(hashes) || hashes.length > MAX_HASHES || !hashes.every(x => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x))) return fail(400, 'bad_request');

  const out = {};

  for(const hash of new Set(hashes)) {
    if(!h.get('SELECT 1 AS ok FROM node_photos p JOIN nodes n ON n.id = p.node_id WHERE p.photo_hash = ? AND n.owner_id = ? LIMIT 1', hash, viewer.id)) continue;

    const where = photoWhere(h, hash);

    out[hash] = { place: where ? placeOf(h, where) : null, taken: photoTaken(h, hash) };
  }

  return Response.json(out, { headers: { 'cache-control': 'no-store' } });
}
