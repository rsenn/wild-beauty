// bun test: the exact position of a photo, kept private in photos.meta.where (docs/GRAPH.md S1.5)
import { describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { getPhoto, photoWhere, setPhotoWhere, upsertPhoto } from '../server/db/nodes.js';
import { exactPosition, positionFromExiftool, roundPosition } from '../server/media/probe.js';

const HASH = 'a'.repeat(64);

describe('exactPosition', () => {
  test('six decimals, same limits as roundPosition', () => {
    expect(exactPosition(-34.0865468, 23.3535143)).toEqual({ lat: -34.086547, lon: 23.353514 });
    expect(roundPosition(-34.0865468, 23.3535143)).toEqual({ lat: -34.09, lon: 23.35 });

    for(const [lat, lon] of [[0, 0], [91, 0], [0, 181], [NaN, 1], [1, Infinity]]) expect(exactPosition(lat, lon)).toBeNull();
  });

  test('exiftool values: both kinds from one dump', () => {
    const all = { 'Composite:GPSLatitude': -34.0865468, 'Composite:GPSLongitude': 23.3535143 };

    expect(positionFromExiftool(all)).toEqual({ lat: -34.09, lon: 23.35 });
    expect(positionFromExiftool(all, true)).toEqual({ lat: -34.086547, lon: 23.353514 });
  });
});

describe('photos.meta.where', () => {
  test('set, read, kept when the photo row is read again, other keys stay', async () => {
    const h = await open(':memory:');

    upsertPhoto(h, { hash: HASH, ext: 'jpg', width: 10, height: 10, bytes: 1, palette: [], meta: { note: 'x' } });

    expect(photoWhere(h, HASH)).toBeNull();
    expect(setPhotoWhere(h, HASH, { lat: -34.086547, lon: 23.353514 })).toBe(true);
    expect(photoWhere(h, HASH)).toEqual({ lat: -34.086547, lon: 23.353514 });
    expect(getPhoto(h, HASH).meta).toEqual({ note: 'x', where: { lat: -34.086547, lon: 23.353514 } });
    expect(setPhotoWhere(h, 'b'.repeat(64), { lat: 1, lon: 1 })).toBe(false);
    h.close();
  });

  test('a baked photo with a position in its upload record keeps it', async () => {
    const h = await open(':memory:');

    upsertPhoto(h, { hash: HASH, ext: 'jpg', width: 10, height: 10, bytes: 1, palette: [], meta: { where: { lat: 1.5, lon: 2.5 } } });

    expect(photoWhere(h, HASH)).toEqual({ lat: 1.5, lon: 2.5 });
    h.close();
  });
});
