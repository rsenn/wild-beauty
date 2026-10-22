// Crash recovery at start (EDITOR.md S4, "reconcile"). Saving bakes photos
// into data/photos, writes the rows, and only then deletes the uploads, so a
// process that dies in between leaves one of three states:
//  - committed, uploads still there: a photo some node uses is also an
//    upload: the upload goes;
//  - baked, never committed: the photo row has no node, the baked file stays
//    from a save that did not happen: the baked files and the row go, the
//    upload stays so the user can save again;
//  - files in data/photos without a row, or half-written temporary files: go.
// Idempotent; safe to run on every start.
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { HASH, config } from '../config.js';
import { logFile } from '../log.js';
import { removeUpload } from '../api/uploads.js';
import { deletePhoto } from '../db/nodes.js';

const FILE = /^([0-9a-f]{64})\.(.+)$/;
const TEMP = /\.tmp(\.|$)/;

const list = dir => (existsSync(dir) ? readdirSync(dir) : []);

// -> { uploads: [hash], photos: [hash], files: [name] } what was removed
export async function reconcile(h) {
  const removed = { uploads: [], photos: [], files: [] };
  const rm = name => {
    logFile('rm', resolve(config.photosDir, name), 'reconcile');
    rmSync(resolve(config.photosDir, name), { force: true });
    removed.files.push(name);
  };

  const used = new Set(h.all('SELECT DISTINCT photo_hash AS hash FROM node_photos').map(r => r.hash));
  const known = new Set(h.all('SELECT hash FROM photos').map(r => r.hash));
  const uploads = new Set(list(config.uploadsDir).filter(n => n.endsWith('.json') && HASH.test(n.slice(0, -5))).map(n => n.slice(0, -5)));

  // 1. an upload of a photo a node already uses
  for(const hash of uploads)
    if(used.has(hash) && (await removeUpload(hash))) removed.uploads.push(hash);

  // 2. a photo no node uses whose upload is still there: an unfinished save
  for(const hash of known)
    if(!used.has(hash) && uploads.has(hash)) {
      h.tx(() => deletePhoto(h, hash));
      known.delete(hash);
      removed.photos.push(hash);
    }

  // 3. baked files with no row, and temporary leftovers
  for(const name of list(config.photosDir)) {
    const m = FILE.exec(name);

    if(TEMP.test(name) || (m && !known.has(m[1])) || !m) rm(name);
  }

  return removed;
}
