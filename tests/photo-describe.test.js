// bun test: place and capture time of a photo for generated descriptions (docs/BATCH.md S6a)
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { open } from '../server/db/db.js';
import { photoTaken, setPhotoTaken, setPhotoWhere, upsertPhoto } from '../server/db/nodes.js';
import { forget, nearestCity } from '../server/api/geoname.js';
import { placeOf } from '../server/api/describe.js';
import { takenFrom } from '../server/media/probe.js';

const HASH = 'c'.repeat(64);

describe('takenFrom', () => {
  test('the EXIF capture time as local text, original before the others', () => {
    expect(takenFrom({ 'IFD0:ModifyDate': '2026:05:01 10:00:00', 'ExifIFD:DateTimeOriginal': '2026:04:15 14:03:22', 'ExifIFD:CreateDate': '2026:04:16 00:00:00' })).toBe('2026-04-15T14:03:22');
    expect(takenFrom({ 'Exif.Photo.DateTimeOriginal': '2026:04:15 14:03:22' })).toBe('2026-04-15T14:03:22');
  });

  test('nothing usable gives null', () => {
    expect(takenFrom({})).toBeNull();
    expect(takenFrom({ 'ExifIFD:DateTimeOriginal': '0000:00:00 00:00:00' })).toBeNull();
    expect(takenFrom({ 'ExifIFD:DateTimeOriginal': 'unknown' })).toBeNull();
  });
});

describe('photos.meta.taken', () => {
  test('set and read, the position stays', async () => {
    const h = await open(':memory:');

    upsertPhoto(h, { hash: HASH, ext: 'jpg', width: 1, height: 1, bytes: 1, palette: [], meta: { where: { lat: 1.5, lon: 2.5 } } });

    expect(photoTaken(h, HASH)).toBeNull();
    expect(setPhotoTaken(h, HASH, '2026-04-15T14:03:22')).toBe(true);
    expect(photoTaken(h, HASH)).toBe('2026-04-15T14:03:22');
    expect(setPhotoTaken(h, 'd'.repeat(64), 'x')).toBe(false);
    expect(setPhotoWhere(h, HASH, { lat: 3, lon: 4 })).toBe(true);
    expect(photoTaken(h, HASH)).toBe('2026-04-15T14:03:22');
    h.close();
  });
});

describe('nearestCity', () => {
  test('the nearest city within 25 km, else null, also across a cell edge', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'gaz-')), 'cities.tsv');

    writeFileSync(file, 'Plettenberg Bay\t-34.05271\t23.37160\tZA\t29000\nKnysna\t-34.03665\t23.04713\tZA\t52000\nBern\t46.94809\t7.44744\tCH\t133000\n');
    forget();

    expect(nearestCity({ lat: -34.0884, lon: 23.3556 }, file)).toEqual({ name: 'Plettenberg Bay', country: 'ZA' });
    expect(nearestCity({ lat: -33.99, lon: 23.37 }, file)?.name).toBe('Plettenberg Bay'); // other 1 degree cell
    expect(nearestCity({ lat: 0, lon: 0 }, file)).toBeNull();
    forget();
  });

  test('without the list file: no place, no error', async () => {
    forget();
    expect(nearestCity({ lat: 10, lon: 10 }, '/nonexistent/cities.tsv')).toBeNull();
    forget();

    const h = await open(':memory:');

    expect(typeof placeOf(h, { lat: 10, lon: 10 }) === 'string' || placeOf(h, { lat: 10, lon: 10 }) === null).toBe(true);
    h.close();
  });
});
