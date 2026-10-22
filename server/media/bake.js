// Baking (EDITOR.md S4 step 2): the file a saved node keeps in data/photos/,
// oriented, stripped of metadata and at most 2048 on the long edge. This part
// is the JPEG pass-through: a JPEG that needs no shrinking is never
// re-encoded, it goes through jpegtran, which is lossless.
import { renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { firstLine, run } from './run.js';
import { LIMITS, identify } from './probe.js';
import { imagemagick, tools } from './tools.js';

export const MAX_EDGE = 2048;

// quality used when the source's cannot be estimated (EDITOR.md S4)
export const FALLBACK_QUALITY = 90;

// Colour profiles (EDITOR.md S10 point 1, decided): a profile other than sRGB
// (Display P3 from phones, Adobe RGB) changes what the pixels mean, so baking
// keeps it; an sRGB profile, or none, is dropped because browsers assume sRGB.
// `keepIcc: false` in the options of every function below drops all profiles.
// -> { description, srgb } of the embedded profile, or null when there is none
export async function iccProfile(file) {
  if(!tools.exiftool) return null;

  const { code, stdout } = await run(['exiftool', '-json', '-ICC_Profile:ProfileDescription', '--', file], { timeout: 15000 });

  if(code !== 0) return null;

  try {
    const description = JSON.parse(stdout)[0]?.ProfileDescription;

    return description ? { description: String(description), srgb: /srgb/i.test(description) } : null;
  } catch {
    return null;
  }
}

// whether `file` carries a profile worth keeping
async function keepsProfile(file, keepIcc) {
  if(keepIcc === false) return false;

  const profile = await iccProfile(file);

  return !!profile && !profile.srgb;
}

// write the ICC profile of `from` into the JPEG `to`; false on failure
async function copyProfile(from, to) {
  const { code } = await run(['exiftool', '-overwrite_original', '-q', '-TagsFromFile', from, '-icc_profile', '--', to], { timeout: 15000 });

  return code === 0 && !!(await iccProfile(to));
}

// ImageMagick arguments that replace `-strip`: everything dropped, the ICC
// profile of `src` put back when it is worth keeping. { args, cleanup }
async function stripArgs(src, keepIcc) {
  if(!(await keepsProfile(src, keepIcc))) return { args: ['-strip'], cleanup() {} };

  const icc = `${src}.${process.pid}.${Math.random().toString(36).slice(2)}.icc`;
  const { code } = await run([...imagemagick.convert, `${src}[0]`, `icc:${icc}`], { timeout: 15000 });

  return code === 0 ? { args: ['-strip', '-profile', icc], cleanup: () => rmSync(icc, { force: true }) } : { args: ['-strip'], cleanup: () => rmSync(icc, { force: true }) };
}

// EXIF orientation -> jpegtran arguments that turn the stored pixels into the
// displayed ones (1 needs none)
const TRANSFORM = { 1: [], 2: ['-flip', 'horizontal'], 3: ['-rotate', '180'], 4: ['-flip', 'vertical'], 5: ['-transpose'], 6: ['-rotate', '90'], 7: ['-transverse'], 8: ['-rotate', '270'] };

// Write `dest` from the JPEG `src`: orientation applied losslessly, every
// metadata block dropped (`-copy none`: EXIF and XMP are gone, and ICC too
// unless the profile is not sRGB, then only that is put back). A
// transform needs the size to be a multiple of the block size (8 or 16);
// `-perfect` refuses otherwise and we retry with `-trim`, which cuts the
// partial edge blocks (at most 15 pixels). `orientation` defaults to what
// ImageMagick reads from `src`.
// -> { ok: true, orientation, trimmed, icc } | { error }
export async function bakeJpeg(src, dest, { orientation, keepIcc } = {}) {
  if(!tools.jpegtran) return { error: 'bake: jpegtran not installed' };

  if(orientation === undefined) {
    const info = await identify(src);

    if(info.error) return { error: `bake: ${info.error}` };

    orientation = info.orientation;
  }

  const transform = TRANSFORM[orientation] ?? [];
  const tmp = `${dest}.tmp.jpg`;
  const keep = await keepsProfile(src, keepIcc);
  const attempt = flags => run(['jpegtran', '-copy', 'none', '-optimize', ...flags, ...transform, '-outfile', tmp, src], { timeout: 30000 });

  let trimmed = false;
  let result = await attempt(transform.length ? ['-perfect'] : []);

  if(result.code !== 0 && transform.length) {
    trimmed = true;
    result = await attempt(['-trim']);
  }

  if(result.code !== 0) {
    rmSync(tmp, { force: true });

    return { error: `bake: jpegtran: ${firstLine(result.stderr)}` };
  }

  // this jpegtran has no `-copy icc`: put the profile back with exiftool,
  // which edits the coefficients' container only
  if(keep && !(await copyProfile(src, tmp))) {
    rmSync(tmp, { force: true });

    return { error: 'bake: could not keep the colour profile' };
  }

  renameSync(tmp, dest);

  return { ok: true, orientation, trimmed, icc: keep };
}

// the JPEG quality ImageMagick estimates for `file` (1..100), or null
export async function jpegQuality(file) {
  if(!imagemagick.identify) return null;

  const { code, stdout } = await run([...imagemagick.identify, ...LIMITS, '-format', '%Q', `${file}[0]`], { timeout: 15000 });
  const q = Number(stdout.trim());

  return code === 0 && q >= 1 && q <= 100 ? q : null;
}

// Write `dest` from the JPEG `src` scaled down so its long edge is `max`:
// re-encoded at the source's own estimated quality and never higher (90 when
// it cannot be estimated), oriented, metadata dropped. A source that is not
// larger is scaled by nothing but still re-encoded, so callers use bakeJpeg
// for that case (see bakeJpegFile).
// -> { ok: true, quality, width, height, icc } | { error }
export async function shrinkJpeg(src, dest, { max = MAX_EDGE, keepIcc } = {}) {
  if(!imagemagick.convert) return { error: 'bake: ImageMagick not installed' };

  const quality = (await jpegQuality(src)) ?? FALLBACK_QUALITY;
  const tmp = `${dest}.tmp.jpg`;
  const strip = await stripArgs(src, keepIcc);
  const { code, stderr } = await run([...imagemagick.convert, ...LIMITS, `${src}[0]`, '-auto-orient', '-resize', `${max}x${max}>`, ...strip.args, '-quality', String(quality), tmp], { timeout: 60000 });

  strip.cleanup();

  if(code !== 0) {
    rmSync(tmp, { force: true });

    return { error: `bake: convert: ${firstLine(stderr)}` };
  }

  renameSync(tmp, dest);

  const { width, height } = await identify(dest);

  return { ok: true, quality, width, height, icc: strip.args.length > 1 };
}

// the JPEG path of baking: a source whose long edge is within `max` goes
// through jpegtran untouched, a larger one is shrunk
export async function bakeJpegFile(src, dest, { max = MAX_EDGE, orientation, keepIcc } = {}) {
  const info = await identify(src);

  if(info.error) return { error: `bake: ${info.error}` };

  return Math.max(info.width, info.height) > max ? shrinkJpeg(src, dest, { max, keepIcc }) : bakeJpeg(src, dest, { orientation: orientation ?? info.orientation, keepIcc });
}

export const QUALITY = 99;

// ImageMagick's own name for the format of `file` ('JPEG', 'PNG', ...) and
// whether any pixel is transparent; { error } when it cannot read it
async function inspect(file) {
  if(!imagemagick.identify) return { error: 'bake: ImageMagick not installed' };

  const { code, stdout, stderr } = await run([...imagemagick.identify, ...LIMITS, '-format', '%m %[opaque]', `${file}[0]`], { timeout: 15000 });
  const m = /^(\S+) (\S+)/.exec(stdout.trim());

  return code === 0 && m ? { format: m[1], transparent: m[2].toLowerCase() === 'false' } : { error: `bake: identify: ${firstLine(stderr)}` };
}

let webp;

// whether this ImageMagick can write WebP, asked once
async function canWebp() {
  if(webp === undefined) {
    const { stdout } = await run([...imagemagick.convert, '-list', 'format'], { timeout: 10000 });

    webp = /^\s*WEBP\*?\s+\S+\s+\S*[w]/m.test(stdout);
  }

  return webp;
}

// Bake a source that is not a JPEG (or any image when a JPEG's own rules do
// not apply) to `<destBase>.<ext>`, oriented, metadata dropped, long edge at
// most `max`. An image with real transparency stays lossless-capable: WebP
// at quality 99, or PNG when ImageMagick has no WebP. Anything opaque becomes
// a JPEG at quality 99 (4:2:0).
// -> { ok: true, ext, width, height, icc } | { error }
export async function bakeImage(src, destBase, { max = MAX_EDGE, transparent, keepIcc } = {}) {
  if(!imagemagick.convert) return { error: 'bake: ImageMagick not installed' };

  if(transparent === undefined) {
    const info = await inspect(src);

    if(info.error) return info;

    transparent = info.transparent;
  }

  const ext = !transparent ? 'jpg' : (await canWebp()) ? 'webp' : 'png';
  const dest = `${destBase}.${ext}`;
  const tmp = `${destBase}.tmp.${ext}`;
  // an opaque image may still carry an alpha channel: flatten it onto white for the JPEG
  const format = ext === 'jpg' ? ['-background', 'white', '-alpha', 'remove', '-alpha', 'off', '-sampling-factor', '4:2:0', '-quality', String(QUALITY)] : ext === 'webp' ? ['-quality', String(QUALITY), '-define', 'webp:alpha-quality=100'] : [];
  const strip = await stripArgs(src, keepIcc);
  const { code, stderr } = await run([...imagemagick.convert, ...LIMITS, `${src}[0]`, '-auto-orient', '-resize', `${max}x${max}>`, ...strip.args, ...format, tmp], { timeout: 60000 });

  strip.cleanup();

  if(code !== 0) {
    rmSync(tmp, { force: true });

    return { error: `bake: convert: ${firstLine(stderr)}` };
  }

  renameSync(tmp, dest);

  const { width, height } = await identify(dest);

  return { ok: true, ext, width, height, icc: strip.args.length > 1 };
}

// Bake any source image to `<destBase>.<ext>` by the rules of EDITOR.md S4:
// a JPEG by bakeJpegFile, everything else by bakeImage.
// -> { ok: true, ext, ... } | { error }
export async function bake(src, destBase, options = {}) {
  const info = await inspect(src);

  if(info.error) return info;

  if(info.format === 'JPEG') {
    const r = await bakeJpegFile(src, `${destBase}.jpg`, options);

    return r.ok ? { ...r, ext: 'jpg' } : r;
  }

  return bakeImage(src, destBase, { ...options, transparent: info.transparent });
}

// Bake a stored upload (the record of uploads/<hash>.json): the *display*
// file is the source, so a HEIC is baked from the JPEG or PNG that was
// decoded from it at upload, never from the container.
export const bakeUpload = (record, destBase, options = {}) => bake(resolve(config.uploadsDir, record.display), destBase, options);
