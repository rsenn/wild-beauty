// Server-side rasterising of a document (E82, GRAPH.md S3.7): the same SVG the
// editor and the viewer draw, through librsvg (`rsvg-convert`). Photos are
// referenced by file name next to a temporary SVG in the photos folder (librsvg
// only reads files below its base), fonts come from fontconfig (~/.fonts, see
// `fontsHome`). -> { ok: true, file } | { error }
import { createHash } from 'node:crypto';
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import renderToString from '../../vendor/preact-render-to-string.js';
import { renderStage } from '../../client/editor/render.js';
import { firstLine, run } from './run.js';
import { imagemagick, tools } from './tools.js';
import { config } from '../config.js';
import { isTexture } from '../../client/editor/model.js';

export const SIZE = 512;

// Does the tile of a document need the real render, or is a photo's own
// thumbnail the right tile? Drawings, shapes and text always need it, and so does
// a collage of photos: more than one on page 0 (a free node or a grid), or one
// that is faded, blended or clipped. A slide show's tile is its first slide.
export function needsRender(doc) {
  const steps = doc.pages.flatMap(page => page.steps);

  if(steps.some(step => step.op !== 'photo')) return true;
  if(doc.mode === 'slides') return false;

  const photos = (doc.pages[0]?.steps ?? []).filter(step => step.op === 'photo' && !isTexture(step));

  return photos.length > 1 || photos.some(step => step.opacity < 1 || (step.blend ?? 'normal') !== 'normal' || step.clip);
}

// where fontconfig finds the text faces: the real home, not the sandbox one
const fontEnv = () => ({ HOME: process.env.HOME ?? '/tmp' });

// the SVG text of a document for librsvg: photo hrefs are bare file names
export function rasterSvg(doc, { page = 0, size = SIZE, photos } = {}) {
  const svg = renderToString(renderStage(doc, { photos, page }));

  return svg.replace(/^<svg\b/, `<svg width="${size}" height="${size}"`);
}

// the same for Inkscape, which wants the XLink spelling of href
export const inkscapeSvg = svg => svg.replace(/^<svg\b/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"').replace(/(<(?:image|textPath|use)\b[^>]*?\s)href=/g, '$1xlink:href=');

// Draw `doc` (page `page`) as a PNG of size x size at `dest`. `photoInfo(hash)`
// -> { ext, width, height } of a baked photo or null.
export async function rasterise(doc, dest, { page = 0, size = SIZE, photoInfo, dir = config.photosDir } = {}) {
  const rsvg = tools['rsvg-convert'] ?? Bun.which('rsvg-convert');

  if(!rsvg) return { error: 'raster: rsvg-convert not installed' };

  const photos = hash => {
    const info = photoInfo(hash);

    return info ? { href: `${hash}.${info.ext}`, width: info.width, height: info.height } : null;
  };

  const svg = rasterSvg(doc, { page, size, photos });
  const tmp = resolve(dir, `raster-${process.pid}-${Date.now().toString(36)}.svg`);

  writeFileSync(tmp, svg);

  const ground = doc.bg && /^#[0-9a-f]{6}$/i.test(doc.bg) ? doc.bg : '#ffffff';
  // librsvg draws no <textPath> (curved text, E130): Inkscape does, slower to start
  const curved = svg.includes('<textPath') && Bun.which('inkscape');

  try {
    if(curved) writeFileSync(tmp, inkscapeSvg(svg));

    const argv = curved ? [curved, tmp, '--export-type=png', `--export-filename=${dest}`, `--export-background=${ground}`, '--export-background-opacity=1'] : [rsvg, '--format', 'png', '--background-color', ground, '--output', dest, tmp];
    const { code, stderr } = await run(argv, { timeout: 60000, env: fontEnv() });

    return code === 0 ? { ok: true, file: dest } : { error: `raster: ${firstLine(stderr)}` };
  } finally {
    rmSync(tmp, { force: true });
  }
}

// the tile of a document: page 0 rasterised, written as <sha256>.thumb.jpg in
// the photos folder (the name is the hash of the file, like the editor's tile), or
// as `name` in the folder when one is given (a larger render of a tile).
// -> { ok: true, hash } | { error }
export async function serverTile(doc, photoInfo, { dir = config.photosDir, size = SIZE, name } = {}) {
  if(!imagemagick.convert) return { error: 'raster: ImageMagick not installed' };

  const base = resolve(dir, `tile-${process.pid}-${Date.now().toString(36)}`);
  const made = await rasterise(doc, `${base}.png`, { size, photoInfo, dir });

  try {
    if(made.error) return made;

    const { code, stderr } = await run([...imagemagick.convert, `${base}.png`, '-alpha', 'off', '-strip', '-quality', '88', `${base}.jpg`], { timeout: 60000 });

    if(code !== 0) return { error: `raster: convert: ${firstLine(stderr)}` };

    const hash = createHash('sha256').update(readFileSync(`${base}.jpg`)).digest('hex');

    renameSync(`${base}.jpg`, resolve(dir, name ?? `${hash}.thumb.jpg`));

    return { ok: true, hash };
  } finally {
    rmSync(`${base}.png`, { force: true });
    rmSync(`${base}.jpg`, { force: true });
  }
}
