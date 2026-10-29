// GET /files/photos/<hash>[.thumb|.large|.small].<ext>: baked photos, node thumbnails,
// the large render of a tile and the small picture of a photo (EDITOR.md S4.1). A baked photo is named by the hash
// of its upload and never changes, and a large render by the hash of its tile, so
// both are cached for good; a thumbnail is rewritten on every save, so it is
// revalidated with an ETag.
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from '../config.js';
import { smallImage } from '../media/thumb.js';

export const PHOTO_FILE = /^([0-9a-f]{64})(\.thumb|\.large|\.small)?\.(jpg|webp|png)$/;

const missing = () => new Response('not found\n', { status: 404 });

// <hash>.small.jpg is made from the baked photo when first asked for (one run per
// photo however many ask), then it is a file like any other
const making = new Map();

async function makeSmall(hash, dest) {
  const source = ['jpg', 'webp', 'png'].map(ext => resolve(config.photosDir, `${hash}.${ext}`)).find(existsSync);

  if(!source) return false;

  if(!making.has(hash)) making.set(hash, smallImage(source, dest).finally(() => making.delete(hash)));

  return !!(await making.get(hash)).ok;
}

export async function servePhoto(name, req) {
  const m = PHOTO_FILE.exec(name);

  if(!m) return missing();

  const path = resolve(config.photosDir, name);

  if(!(await Bun.file(path).exists()) && !(m[2] === '.small' && m[3] === 'jpg' && (await makeSmall(m[1], path)))) return missing();

  const file = Bun.file(path);

  const base = { 'content-type': file.type, 'x-content-type-options': 'nosniff' };

  if(m[2] !== '.thumb') return new Response(req.method === 'HEAD' ? null : file, { headers: { ...base, 'content-length': String(file.size), 'cache-control': 'public, max-age=31536000, immutable' } });

  const etag = `"${file.size}-${Math.round(file.lastModified)}"`;
  const headers = { ...base, etag, 'cache-control': 'public, no-cache' };

  if(req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });

  return new Response(req.method === 'HEAD' ? null : file, { headers: { ...headers, 'content-length': String(file.size) } });
}
