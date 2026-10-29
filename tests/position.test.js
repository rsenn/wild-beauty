// bun test: the photo position from EXIF (EDITOR.md E136, GRAPH.md S1.5)
import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { ingest } from '../server/media/ingest.js';
import { exif, positionFromExiftool, positionFromExiv2, roundPosition } from '../server/media/probe.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick, tools } from '../server/media/tools.js';

describe('position from a dump', () => {
  test('rounds to two decimals and rejects nonsense', () => {
    expect(roundPosition(47.37689, 8.54169)).toEqual({ lat: 47.38, lon: 8.54 });
    expect(roundPosition(-0.001, 0.002)).toEqual({ lat: 0, lon: 0 });
    expect(roundPosition(0, 0)).toBeNull();
    expect(roundPosition(91, 0)).toBeNull();
    expect(roundPosition(NaN, 1)).toBeNull();
  });

  test('exiftool: the signed Composite value, else GPS plus its reference', () => {
    expect(positionFromExiftool({ 'Composite:GPSLatitude': -33.8688, 'Composite:GPSLongitude': 151.2093 })).toEqual({ lat: -33.87, lon: 151.21 });
    expect(positionFromExiftool({ 'GPS:GPSLatitude': 33.8688, 'GPS:GPSLatitudeRef': 'S', 'GPS:GPSLongitude': 70.65, 'GPS:GPSLongitudeRef': 'W' })).toEqual({ lat: -33.87, lon: -70.65 });
    expect(positionFromExiftool({ 'GPS:GPSLatitude': 47.4 })).toBeNull();
    expect(positionFromExiftool({})).toBeNull();
  });

  test('exiv2: degrees-minutes-seconds and rationals', () => {
    expect(positionFromExiv2({ 'Exif.GPSInfo.GPSLatitude': `47deg 22' 36.00"`, 'Exif.GPSInfo.GPSLatitudeRef': 'N', 'Exif.GPSInfo.GPSLongitude': `8deg 32' 24.00"`, 'Exif.GPSInfo.GPSLongitudeRef': 'E' })).toEqual({ lat: 47.38, lon: 8.54 });
    expect(positionFromExiv2({ 'Exif.GPSInfo.GPSLatitude': '33/1 52/1 0/1', 'Exif.GPSInfo.GPSLatitudeRef': 'S', 'Exif.GPSInfo.GPSLongitude': '151/1 12/1 0/1', 'Exif.GPSInfo.GPSLongitudeRef': 'E' })).toEqual({ lat: -33.87, lon: 151.2 });
    expect(positionFromExiv2({})).toBeNull();
  });
});

describe('position through ingest (needs ImageMagick and exiftool)', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'wb-pos-'));
  const path = name => resolve(dir, name);

  beforeAll(async () => {
    await detectTools();

    if(!imagemagick.convert) return;

    await run([...imagemagick.convert, '-size', '40x30', 'xc:#336699', path('plain.jpg')]);
    await run([...imagemagick.convert, '-size', '40x30', 'xc:#336699', path('geo.jpg')]);

    if(tools.exiftool) await run(['exiftool', '-overwrite_original', '-GPSLatitude=47.37689', '-GPSLatitudeRef=N', '-GPSLongitude=8.54169', '-GPSLongitudeRef=E', '-Make=Test', path('geo.jpg')]);
  });

  test('a geotagged photo gives a rounded pos and no GPS tag in the dump', async () => {
    if(!tools.exiftool) return;

    const { pos, exif: dump } = await ingest(path('geo.jpg'), path('geo.jpg'));

    expect(pos).toEqual({ lat: 47.38, lon: 8.54 });
    expect(Object.keys(dump).filter(k => /GPS/i.test(k))).toEqual([]);
    expect(JSON.stringify(dump)).not.toContain('47.37689');
    expect(Object.values(dump)).toContain('Test');
  });

  test('a photo without a position gives null', async () => {
    if(!imagemagick.convert) return;

    expect((await ingest(path('plain.jpg'), path('plain.jpg'))).pos).toBeNull();
    expect((await exif(path('plain.jpg'))).pos ?? null).toBeNull();
  });
});
