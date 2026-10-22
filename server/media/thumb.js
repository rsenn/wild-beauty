// The square thumbnail of a node (EDITOR.md S4 step 3): `<hash>.thumb.jpg`, the
// node's tile until server-side rasterising exists. PoC: the first photo step
// of the document, drawn as the stage draws it (fit, matrix, padding ground).
import { renameSync, rmSync } from 'node:fs';
import { firstLine, run } from './run.js';
import { LIMITS, identify } from './probe.js';
import { FALLBACK_QUALITY, QUALITY, jpegQuality } from './bake.js';
import { imagemagick } from './tools.js';

export const SIZE = 512;
const STAGE = 1000;
const HEX = /^#[0-9a-f]{6}$/i;

// the first photo step of the document in page order, or null
export function firstPhotoStep(doc) {
  for(const page of doc.pages) for(const step of page.steps) if(step.op === 'photo') return step;

  return null;
}

// Write `dest` (JPEG, size x size) from the baked photo `src`.
//  step     the photo step: `fit` and `m` (local space -> the 1000 unit stage)
//  padding  [colour, colour] of `extend`: a gradient over the stage, top to
//           bottom behind a wide photo, left to right behind a tall one
//  bg       ground colour of the document; plain white when absent
// Quality: a JPEG source is never encoded higher than it is (90 when it
// cannot be estimated), any other source gets 99.
// -> { ok: true, quality } | { error }
export async function thumbnail(src, dest, { step, padding, bg, size = SIZE }) {
  if(!imagemagick.convert) return { error: 'thumb: ImageMagick not installed' };

  const info = await identify(src);

  if(info.error) return { error: `thumb: ${info.error}` };

  const { width, height } = info;
  const k = (STAGE / Math.max(width, height)) * (size / STAGE); // photo pixels -> thumbnail pixels
  const [a, b, c, d, e, f] = step.m;
  const s = size / STAGE;
  const ground = step.fit === 'extend' && padding?.length === 2 && padding.every(x => HEX.test(x)) ? padding : null;
  const flat = HEX.test(bg ?? '') ? bg : '#ffffff';
  const jpeg = (await run([...imagemagick.identify, '-format', '%m', `${src}[0]`])).stdout.trim() === 'JPEG';
  const quality = jpeg ? ((await jpegQuality(src)) ?? FALLBACK_QUALITY) : QUALITY;
  const tmp = `${dest}.tmp.jpg`;

  const canvas = ground
    ? ['-size', `${size}x${size}`, `gradient:${ground[0]}-${ground[1]}`, ...(width >= height ? [] : ['-rotate', '-90'])]
    : ['-size', `${size}x${size}`, `xc:${flat}`];

  // the photo at its local size, then moved by the matrix (linear part as is,
  // translation scaled to the thumbnail) inside a size x size viewport
  const photo = ['(', `${src}[0]`, '-auto-orient', '-resize', `${Math.max(1, Math.round(width * k))}x${Math.max(1, Math.round(height * k))}!`, '-alpha', 'set', '-virtual-pixel', 'transparent', '-define', `distort:viewport=${size}x${size}+0+0`, '-distort', 'AffineProjection', `${a},${b},${c},${d},${e * s},${f * s}`, ')'];

  const { code, stderr } = await run([...imagemagick.convert, ...LIMITS, ...canvas, ...photo, '-compose', 'over', '-composite', '-alpha', 'off', '-sampling-factor', '4:2:0', '-strip', '-quality', String(quality), tmp], { timeout: 60000 });

  if(code !== 0) {
    rmSync(tmp, { force: true });

    return { error: `thumb: convert: ${firstLine(stderr)}` };
  }

  renameSync(tmp, dest);

  return { ok: true, quality };
}
