// Place suggestions for the open node (EDITOR.md E137, GRAPH.md S1.5): the
// rounded positions of its photos and the remembered answers. No state here
// but the browser's storage; the suggestion itself is never saved with the node.
const STORE = 'wb.places.answered';

// the unique positions of the photos a node uses -> [{ lat, lon }]
export function positionsOf(doc, photos) {
  const seen = new Map();

  for(const page of doc.pages)
    for(const step of page.steps) {
      const pos = step.op === 'photo' ? photos[step.photo]?.pos : null;

      if(pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lon)) seen.set(`${pos.lat},${pos.lon}`, { lat: pos.lat, lon: pos.lon });
    }

  return [...seen.values()];
}

// one answer per node and place; a node that is not saved yet is "draft"
export const answerKey = (nodeId, title) => `${nodeId ?? 'draft'}:${title}`;

export function readAnswered(storage = globalThis.localStorage) {
  try {
    return new Set(JSON.parse(storage.getItem(STORE)) ?? []);
  } catch {
    return new Set();
  }
}

// remember a link or a dismissal, so the chip does not come back
export function remember(key, storage = globalThis.localStorage) {
  try {
    const all = readAnswered(storage);

    all.add(key);
    storage.setItem(STORE, JSON.stringify([...all].slice(-500)));
  } catch {}
}

// the place for a position without creating it -> { id|null, title } | null
export async function nearPlace(pos, fetcher = fetch) {
  try {
    const res = await fetcher(`/api/places/near?lat=${pos.lat}&lon=${pos.lon}`);

    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// find or create the place and link the node to it (label `at`) -> true when it worked
export async function linkPlace(nodeId, pos, fetcher = fetch) {
  const json = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  try {
    const place = await fetcher('/api/places', json(pos));

    if(!place.ok) return false;

    const { id } = await place.json();
    const link = await fetcher('/api/graph/ops', json({ ops: [{ op: 'link', from: nodeId, to: id, label: 'at' }] }));

    return link.ok;
  } catch {
    return false;
  }
}

// the position the browser reports, rounded to ~1 km before it leaves the device
// -> { lat, lon } | null (denied, unavailable, timed out: a quiet no-op, EDITOR.md E139)
export function currentPosition(geo = globalThis.navigator?.geolocation, timeout = 8000) {
  return new Promise(resolve => {
    if(!geo) return resolve(null);

    geo.getCurrentPosition(
      ({ coords }) => resolve(snapPosition(coords.latitude, coords.longitude)),
      () => resolve(null),
      { timeout, maximumAge: 60000, enableHighAccuracy: false },
    );
  });
}

export function snapPosition(lat, lon) {
  if(!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return null;

  const r = v => Math.round(v * 100) / 100 + 0;

  return { lat: r(lat), lon: r(lon) };
}
