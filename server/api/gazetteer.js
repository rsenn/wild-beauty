// Which place a rounded position belongs to (GRAPH.md S1.5): a locality of the
// gazetteer, else the 0.01 degree cell titled by its coordinates. Kept apart from
// places.js so the graph ops can use it without importing the routes.
// A starter list; a position within RADIUS_KM of an entry is that locality.
export const GAZETTEER = [
  { name: 'Zürich', lat: 47.3769, lon: 8.5417 },
  { name: 'Bern', lat: 46.948, lon: 7.4474 },
  { name: 'Basel', lat: 47.5596, lon: 7.5886 },
  { name: 'Genève', lat: 46.2044, lon: 6.1432 },
  { name: 'Luzern', lat: 47.0502, lon: 8.3093 },
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
