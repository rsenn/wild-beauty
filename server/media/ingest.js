// Ingest of a stored upload (PLAN.md S6.2 steps 4-6): probe, palette and the
// two padding colours. Failures degrade to an `errors` list, they never
// reject the upload.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { choosePadding } from './color.js';
import { exif, identify, mediainfo } from './probe.js';
import { palette } from './palette.js';
import { detectTools } from './tools.js';

// `original` is the file as uploaded (EXIF, mediainfo), `display` the file
// browsers and the editor use (size, palette)
export async function ingest(original, display) {
  const [size, exifResult, media, colors] = await Promise.all([identify(display), exif(original), mediainfo(original), palette(display)]);
  const errors = [size, exifResult, media, colors].map(r => r.error).filter(Boolean);
  const { width, height, hasAlpha, orientation } = size;

  return {
    width,
    height,
    hasAlpha,
    orientation,
    exif: exifResult.value ?? null,
    pos: exifResult.pos ?? null, // rounded to ~1 km; the only place the GPS tags survive (GRAPH.md S1.5)
    mediainfo: media.value ?? null,
    palette: colors.value ?? [],
    padding: colors.value ? choosePadding(colors.value) : null,
    ...(errors.length && { errors }),
  };
}

export const uploadPath = name => resolve(config.uploadsDir, name);

// command line: bun run server/media/ingest.js <original-file> [display-file]
// prints the ingest result as JSON (the display file defaults to the original)
if(import.meta.main) {
  const [original, display = original, extra] = process.argv.slice(2).map(arg => resolve(arg));

  if(!process.argv[2] || process.argv[2] === '-h' || process.argv[2] === '--help' || extra) {
    console.error('usage: bun run server/media/ingest.js <original-file> [display-file]');
    process.exit(process.argv[2] === '-h' || process.argv[2] === '--help' ? 0 : 2);
  }

  for(const file of new Set([original, display])) {
    if(!existsSync(file)) {
      console.error(`ingest: no such file: ${file}`);
      process.exit(1);
    }
  }

  await detectTools();

  const result = await ingest(original, display);

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors ? 1 : 0);
}
