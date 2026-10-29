// Which place a rounded position belongs to (GRAPH.md S1.5): the municipality the
// federal geoportal named (cached, municipality.js), else a locality of the
// offline gazetteer, else the 0.01 degree cell titled by its coordinates. A title
// is `Name (KT)`: the canton tells apart the many municipalities of one name. Kept apart from
// places.js so the graph ops can use it without importing the routes.
import { getPlaceName } from '../db/nodes.js';

// The offline fallback, a starter list; a position within RADIUS_KM of an entry is that locality.
export const GAZETTEER = [
  { name: 'Zürich (ZH)', lat: 47.3769, lon: 8.5417 },
  { name: 'Bern (BE)', lat: 46.948, lon: 7.4474 },
  { name: 'Basel (BS)', lat: 47.5596, lon: 7.5886 },
  { name: 'Genève (GE)', lat: 46.2044, lon: 6.1432 },
  { name: 'Luzern (LU)', lat: 47.0502, lon: 8.3093 },
];

export const RADIUS_KM = 5;

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

// the title for a position as far as it is known now (no request): the cached
// municipality, else placeTitle. municipality.js resolveNames fills the cache first.
export function titleFor(h, pos, gazetteer) {
  const known = getPlaceName(h, pos);

  return typeof known === 'string' ? known : placeTitle(pos, gazetteer);
}
