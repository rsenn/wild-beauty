// GET /files/photos/<hash>[.thumb|.large].<ext>: baked photos, node thumbnails and
// the large render of a tile (EDITOR.md S4.1). A baked photo is named by the hash
// of its upload and never changes, and a large render by the hash of its tile, so
// both are cached for good; a thumbnail is rewritten on every save, so it is
// revalidated with an ETag.
import { resolve } from 'node:path';
import { config } from '../config.js';

export const PHOTO_FILE = /^([0-9a-f]{64})(\.thumb|\.large)?\.(jpg|webp|png)$/;

const missing = () => new Response('not found\n', { status: 404 });

export async function servePhoto(name, req) {
  const m = PHOTO_FILE.exec(name);

  if(!m) return missing();

  const file = Bun.file(resolve(config.photosDir, name));

  if(!(await file.exists())) return missing();

  const base = { 'content-type': file.type, 'x-content-type-options': 'nosniff' };

  if(m[2] !== '.thumb') return new Response(req.method === 'HEAD' ? null : file, { headers: { ...base, 'content-length': String(file.size), 'cache-control': 'public, max-age=31536000, immutable' } });

  const etag = `"${file.size}-${Math.round(file.lastModified)}"`;
  const headers = { ...base, etag, 'cache-control': 'public, no-cache' };

  if(req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });

  return new Response(req.method === 'HEAD' ? null : file, { headers: { ...headers, 'content-length': String(file.size) } });
}
