// The nearest city of the offline GeoNames list (data/gazetteer/cities1000.tsv, made by
// tools/gazetteer.js) for a position (docs/BATCH.md S6a). Loaded on first use, kept in
// 1 degree cells so a lookup reads a handful of rows.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { km } from './gazetteer.js';

export const NEAR_KM = 25;

let cells = null;

function load(file) {
  cells = new Map();

  if(!existsSync(file)) return;

  for(const line of readFileSync(file, 'utf8').split('\n')) {
    const [name, lat, lon, country] = line.split('\t');

    if(!country) continue;

    const key = `${Math.floor(lat)},${Math.floor(lon)}`;

    if(!cells.has(key)) cells.set(key, []);

    cells.get(key).push({ name, lat: +lat, lon: +lon, country });
  }
}

// -> { name, country } of the nearest city within NEAR_KM, or null (also when the list is not there)
export function nearestCity(pos, file = resolve(config.dataDir, 'gazetteer', 'cities1000.tsv')) {
  if(!cells) load(file);

  let best = null;
  let near = NEAR_KM;

  for(let dy = -1; dy <= 1; dy++)
    for(let dx = -1; dx <= 1; dx++)
      for(const c of cells.get(`${Math.floor(pos.lat) + dy},${Math.floor(pos.lon) + dx}`) ?? []) {
        const d = km(pos, c);

        if(d <= near) [best, near] = [c, d];
      }

  return best && { name: best.name, country: best.country };
}

// for tests: forget the loaded list
export const forget = () => {
  cells = null;
};
