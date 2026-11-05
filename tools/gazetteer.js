#!/usr/bin/env bun
// Fetch the GeoNames list of cities with 1000+ inhabitants (public data, CC BY 4.0)
// and write data/gazetteer/cities1000.tsv: name, latitude, longitude, country, population.
// server/api/geoname.js reads it to name the place of a photo (docs/BATCH.md S6a).
// usage: bun tools/gazetteer.js [--force]
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../server/config.js';

const dir = resolve(config.dataDir ?? 'data', 'gazetteer');
const out = resolve(dir, 'cities1000.tsv');

if(existsSync(out) && !process.argv.includes('--force')) {
  console.log(`${out} exists (--force fetches again)`);
  process.exit(0);
}

mkdirSync(dir, { recursive: true });

const zip = resolve(dir, 'cities1000.zip');
const res = await fetch('https://download.geonames.org/export/dump/cities1000.zip');

if(!res.ok) {
  console.error(`download failed: ${res.status}`);
  process.exit(1);
}

writeFileSync(zip, new Uint8Array(await res.arrayBuffer()));

const txt = Bun.spawnSync(['unzip', '-p', zip, 'cities1000.txt']).stdout.toString();
const rows = [];

// geonameid, name, asciiname, alternatenames, lat, lon, class, code, country, cc2, admin1, ...population (index 14)
for(const line of txt.split('\n')) {
  const f = line.split('\t');

  if(f.length > 14) rows.push([f[1], f[4], f[5], f[8], f[14]].join('\t'));
}

writeFileSync(out, rows.join('\n') + '\n');
console.log(`${rows.length} places -> ${out}`);
