// Metadata of an upload (PLAN.md S6.2 step 4): the size, alpha and EXIF
// orientation of the display file from ImageMagick, the full EXIF dump from
// exiftool (or exiv2), and mediainfo's description. Every call has a timeout
// and an output cap; a failure is reported, never thrown.
import { config } from '../config.js';
import { exifTool, imagemagick, tools } from './tools.js';
import { firstLine, run } from './run.js';

const opts = { timeout: 15000, maxOutput: 2 << 20 };

// ImageMagick limits so a decompression bomb cannot eat the machine
export const LIMITS = ['-limit', 'memory', '512MiB', '-limit', 'map', '1GiB', '-limit', 'area', '100MP', '-limit', 'disk', '1GiB', '-limit', 'time', '20'];

const ORIENTATION = { TopLeft: 1, TopRight: 2, BottomRight: 3, BottomLeft: 4, LeftTop: 5, RightTop: 6, RightBottom: 7, LeftBottom: 8 };

// -> { width, height, hasAlpha, orientation } with the size as displayed
// (EXIF orientation applied), or { error }
export async function identify(file) {
  if(!imagemagick.identify) return { error: 'identify: ImageMagick not installed' };

  const { code, stdout, stderr } = await run([...imagemagick.identify, ...LIMITS, '-format', '%w %h %[channels] %[orientation]', `${file}[0]`], opts);
  const m = /^(\d+) (\d+) (\S+) (\S+)/.exec(stdout.trim());

  if(code !== 0 || !m) return { error: `identify: ${firstLine(stderr)}` };

  let [, width, height, channels, orientation] = m;

  width = +width;
  height = +height;
  orientation = ORIENTATION[orientation] ?? 1;

  if(orientation >= 5) [width, height] = [height, width];

  return { width, height, hasAlpha: /a$/.test(channels), orientation };
}

const SKIP_GROUPS = /^(System|ExifTool|File|SourceFile)/;
const GPS_TAG = /GPS/i; // exiftool "GPS:GPSLatitude", "Composite:GPSPosition", exiv2 "Exif.GPSInfo.*"
const clip = v => (typeof v === 'string' && v.length > 500 ? v.slice(0, 500) : v);

// Place of a photo for suggesting a place link (GRAPH.md S1.5). Coordinates
// are rounded to two decimals (about 1 km); the exact position is neither
// returned nor kept. -> { lat, lon } | null (missing, out of range or 0,0)
export function roundPosition(lat, lon) {
  if(!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return null;

  const r = v => Math.round(v * 100) / 100 + 0; // + 0 turns -0 into 0

  return { lat: r(lat), lon: r(lon) };
}

// exiftool -n -G1 keys: the signed Composite value, else the GPS group's
// unsigned value with its N/S/E/W reference
export function positionFromExiftool(all) {
  const signed = (name, neg) => {
    const composite = all[`Composite:${name}`];

    if(typeof composite === 'number') return composite;

    const raw = all[`GPS:${name}`];

    return typeof raw === 'number' ? (String(all[`GPS:${name}Ref`] ?? '').toUpperCase() === neg ? -Math.abs(raw) : Math.abs(raw)) : NaN;
  };

  return roundPosition(signed('GPSLatitude', 'S'), signed('GPSLongitude', 'W'));
}

// exiv2 values: `47deg 22' 1.20"` (translated) or `47/1 22/1 12/10` (rational)
function degrees(text) {
  const dms = /^(\d+(?:\.\d+)?)deg\s+(\d+(?:\.\d+)?)'\s+(\d+(?:\.\d+)?)"/.exec(text ?? '');

  if(dms) return +dms[1] + dms[2] / 60 + dms[3] / 3600;

  const rat = /^(\d+)\/(\d+)\s+(\d+)\/(\d+)\s+(\d+)\/(\d+)/.exec(text ?? '');

  return rat ? rat[1] / rat[2] + rat[3] / rat[4] / 60 + rat[5] / rat[6] / 3600 : NaN;
}

export function positionFromExiv2(all) {
  const signed = (name, neg) => (String(all[`Exif.GPSInfo.${name}Ref`] ?? '').trim().toUpperCase() === neg ? -1 : 1) * degrees(all[`Exif.GPSInfo.${name}`]);

  return roundPosition(signed('GPSLatitude', 'S'), signed('GPSLongitude', 'W'));
}

// a dump without its GPS tags: the exact position does not go into the sidecar
const withoutGps = all => Object.fromEntries(Object.entries(all).filter(([k]) => !GPS_TAG.test(k)));

// exiftool -json -n -G1 (numeric values, group-prefixed keys), without the
// file system and tool groups
async function exiftoolDump(file) {
  const { code, stdout, stderr } = await run(['exiftool', '-json', '-n', '-G1', '--', file], opts);

  if(code !== 0) return { error: `exiftool: ${firstLine(stderr)}` };

  try {
    const [all] = JSON.parse(stdout);

    return { value: Object.fromEntries(Object.entries(withoutGps(all)).filter(([k]) => !SKIP_GROUPS.test(k)).slice(0, 400).map(([k, v]) => [k, clip(v)])), pos: positionFromExiftool(all) };
  } catch {
    return { error: 'exiftool: unreadable output' };
  }
}

// exiv2 -pa lines: "Exif.Image.Make   Ascii   6  Canon"
async function exiv2Dump(file) {
  const { stdout } = await run(['exiv2', '-pa', '-b', '--', file], opts);
  const value = {};

  for(const line of stdout.split('\n').slice(0, 400)) {
    const m = /^(\S+)\s+\S+\s+\d+\s+(.*)$/.exec(line);

    if(m) value[m[1]] = clip(m[2]);
  }

  return { value: withoutGps(value), pos: positionFromExiv2(value) };
}

export const exif = file => (exifTool() === 'exiftool' ? exiftoolDump(file) : exifTool() === 'exiv2' ? exiv2Dump(file) : Promise.resolve({ error: 'exif: no tool installed' }));

// mediainfo --Output=JSON: the General and Image tracks, without the path
export async function mediainfo(file) {
  if(!tools.mediainfo) return { error: 'mediainfo: not installed' };

  const { code, stdout, stderr } = await run(['mediainfo', '--Output=JSON', '--', file], opts);

  if(code !== 0) return { error: `mediainfo: ${firstLine(stderr)}` };

  try {
    const tracks = (JSON.parse(stdout).media?.track ?? []).filter(t => t['@type'] === 'General' || t['@type'] === 'Image');

    return { value: tracks.map(({ '@ref': _path, ...rest }) => Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, clip(v)]))) };
  } catch {
    return { error: 'mediainfo: unreadable output' };
  }
}
