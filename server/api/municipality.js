// The municipality a position lies in, from the federal geoportal (GRAPH.md
// S1.5, EDITOR.md E138): `identify` on swissBOUNDARIES3D, free and without a key.
// Only the position rounded to ~1 km is sent, from the server and never from the
// browser, and each cell is asked once (table place_names). WB_GEO_API=off turns
// it off (the local gazetteer and the cell coordinates name the place then), and
// so does a test run; another base URL points it at a mirror.
import { getPlaceName, setPlaceName } from '../db/nodes.js';

export const MUNICIPALITIES = 'ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill';

const TIMEOUT_MS = 5000;
const MAX_NAME = 80;

const base = () => process.env.WB_GEO_API ?? 'https://api3.geo.admin.ch';

// a name from outside, as a title: no control characters, not too long
const clean = text => (typeof text === 'string' ? text.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME) : '');

// -> { ok: true, name: 'Zürich (ZH)' | null } (null: outside Switzerland) | { ok: false } (not asked, or no answer)
export async function fetchMunicipality({ lat, lon }, fetcher) {
  const url = base();

  if(url === 'off' || (!fetcher && process.env.NODE_ENV === 'test')) return { ok: false };

  const query = new URLSearchParams({
    geometryType: 'esriGeometryPoint',
    geometry: `${lon},${lat}`,
    sr: '4326',
    layers: `all:${MUNICIPALITIES}`,
    tolerance: '0',
    mapExtent: `${lon - 0.5},${lat - 0.5},${lon + 0.5},${lat + 0.5}`,
    imageDisplay: '100,100,96',
    returnGeometry: 'false',
    lang: 'en',
  });

  try {
    const res = await (fetcher ?? fetch)(`${url}/rest/services/all/MapServer/identify?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });

    if(!res.ok) return { ok: false };

    const { results } = await res.json();

    if(!Array.isArray(results)) return { ok: false };

    // the layer also holds the boundaries of earlier years: only the current one counts
    const found = results.map(r => r?.attributes).find(a => a?.is_current_jahr === true);
    const name = clean(found?.gemname);
    const canton = clean(found?.kanton);

    // the service already writes the canton into names that exist in several ("Buchs (SG)")
    return { ok: true, name: name ? (canton && !/\([A-Z]{2}\)$/.test(name) ? `${name} (${canton})` : name) : null };
  } catch {
    return { ok: false };
  }
}

// Ask for the cells that are not known yet (at most `limit` per call, one after
// the other, as the service allows a few requests a second) and remember the
// answers. A cell that got no answer stays unknown and is asked again later.
export async function resolveNames(h, positions, { fetcher, limit = 20 } = {}) {
  const todo = new Map();

  for(const pos of positions) if(getPlaceName(h, pos) === undefined) todo.set(`${pos.lat},${pos.lon}`, pos);

  for(const pos of [...todo.values()].slice(0, limit)) {
    const found = await fetchMunicipality(pos, fetcher);

    if(!found.ok) break; // down, or off: the rest would fail the same way

    setPlaceName(h, pos, found.name);
  }
}
