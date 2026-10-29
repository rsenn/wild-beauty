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
