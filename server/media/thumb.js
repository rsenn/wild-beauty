// The square thumbnail of a node (EDITOR.md S4 step 3): `<hash>.thumb.jpg`, the
// node's tile until server-side rasterising exists. PoC: the first photo step
// of the document, drawn as the stage draws it (square crop, matrix).
import { renameSync, rmSync } from 'node:fs';
import { firstLine, run } from './run.js';
import { LIMITS, identify } from './probe.js';
import { FALLBACK_QUALITY, QUALITY, jpegQuality } from './bake.js';
import { imagemagick } from './tools.js';
import { cropWindow } from '../../client/editor/model.js';

export const SIZE = 512;
const STAGE = 1000;
const HEX = /^#[0-9a-f]{6}$/i;

// the first photo step of the document in page order, or null
export function firstPhotoStep(doc) {
  for(const page of doc.pages) for(const step of page.steps) if(step.op === 'photo' && step.role !== 'texture') return step; // a texture is not a picture

  return null;
}

// Write `dest` (JPEG, size x size) from the baked photo `src`.
//  step     the photo step: `crop` and `m` (the photo's 1000 unit square -> the
//           1000 unit stage)
//  bg       ground colour of the document; plain white when absent
// Quality: a JPEG source is never encoded higher than it is (90 when it
// cannot be estimated), any other source gets 99.
// -> { ok: true, quality } | { error }
export async function thumbnail(src, dest, { step, bg, size = SIZE }) {
  if(!imagemagick.convert) return { error: 'thumb: ImageMagick not installed' };

  const info = await identify(src);

  if(info.error) return { error: `thumb: ${info.error}` };

  const { side, x, y } = cropWindow(info, step.crop);
  const [a, b, c, d, e, f] = step.m;
  const s = size / STAGE;
  const flat = HEX.test(bg ?? '') ? bg : '#ffffff';
  const jpeg = (await run([...imagemagick.identify, '-format', '%m', `${src}[0]`])).stdout.trim() === 'JPEG';
  const quality = jpeg ? ((await jpegQuality(src)) ?? FALLBACK_QUALITY) : QUALITY;
  const tmp = `${dest}.tmp.jpg`;
  const canvas = ['-size', `${size}x${size}`, `xc:${flat}`];

  // the square window of the photo, scaled to size x size (its local square),
  // then moved by the matrix (linear part as is, translation scaled to the
  // thumbnail) inside a size x size viewport
  const photo = ['(', `${src}[0]`, '-auto-orient', '-crop', `${side}x${side}+${Math.round(x)}+${Math.round(y)}`, '+repage', '-resize', `${size}x${size}!`, '-alpha', 'set', '-virtual-pixel', 'transparent', '-define', `distort:viewport=${size}x${size}+0+0`, '-distort', 'AffineProjection', `${a},${b},${c},${d},${e * s},${f * s}`, ')'];

  const { code, stderr } = await run([...imagemagick.convert, ...LIMITS, ...canvas, ...photo, '-compose', 'over', '-composite', '-alpha', 'off', '-sampling-factor', '4:2:0', '-strip', '-quality', String(quality), tmp], { timeout: 60000 });

  if(code !== 0) {
    rmSync(tmp, { force: true });

    return { error: `thumb: convert: ${firstLine(stderr)}` };
  }

  renameSync(tmp, dest);

  return { ok: true, quality };
}

// The picture a gallery hangs for one photo of a sequence: `<hash>.small.jpg`, the
// whole photo (its proportions kept) at most `size` px on the long side, made
// from the baked photo `src` the first time it is asked for. -> { ok } | { error }
export async function smallImage(src, dest, { size = 640 } = {}) {
  if(!imagemagick.convert) return { error: 'small: ImageMagick not installed' };

  const tmp = `${dest}.tmp.jpg`;
  const { code, stderr } = await run([...imagemagick.convert, ...LIMITS, `${src}[0]`, '-auto-orient', '-resize', `${size}x${size}>`, '-background', '#ffffff', '-alpha', 'remove', '-alpha', 'off', '-sampling-factor', '4:2:0', '-strip', '-quality', '82', tmp], { timeout: 60000 });

  if(code !== 0) {
    rmSync(tmp, { force: true });

    return { error: `small: convert: ${firstLine(stderr)}` };
  }

  renameSync(tmp, dest);

  return { ok: true };
}
