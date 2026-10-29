// bun test: server/node/reconcile.js, the states a crash during a save can leave
import { afterAll, beforeAll, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { config } from '../server/config.js';
import { open } from '../server/db/db.js';
import { getNode, getPhoto, nodePhotos, upsertPhoto } from '../server/db/nodes.js';
import { saveNew } from '../server/api/nodes.js';
import { reconcile } from '../server/node/reconcile.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';

setDefaultTimeout(30000);

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const saved = { ...config };
let root;
let spare;
let h;
let ready = false;

const up = name => resolve(config.uploadsDir, name);
const photoDir = () => (existsSync(config.photosDir) ? readdirSync(config.photosDir).sort() : []);
const uploadsLeft = () => readdirSync(config.uploadsDir).filter(n => n !== '.tmp').sort();
const photo = (id, hash) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal' });
const doc = steps => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps }] });

beforeAll(async () => {
  await detectTools();
  ready = !!(imagemagick.convert && Bun.which('jpegtran'));
  root = mkdtempSync(resolve(tmpdir(), 'wb-rec-'));
  Object.assign(config, { uploadsDir: resolve(root, 'uploads'), tmpDir: resolve(root, 'uploads/.tmp'), photosDir: resolve(root, 'data/photos') });
  spare = resolve(root, 'spare');
  mkdirSync(spare, { recursive: true });

  if(ready) {
    await run([...imagemagick.convert, '-size', '200x100', 'gradient:red-blue', resolve(spare, `${A}.jpg`)]);
    await run([...imagemagick.convert, '-size', '50x50', 'xc:blue', resolve(spare, `${B}.png`)]);

    for(const [hash, ext] of [[A, 'jpg'], [B, 'png']]) writeFileSync(resolve(spare, `${hash}.json`), JSON.stringify({ hash, ext, display: `${hash}.${ext}`, palette: [{ hex: '#ff0000', weight: 1 }] }));
  }
});

afterAll(() => {
  Object.assign(config, saved);
  rmSync(root, { recursive: true, force: true });
});

beforeEach(async () => {
  h = await open(':memory:');
  rmSync(resolve(root, 'uploads'), { recursive: true, force: true });
  rmSync(resolve(root, 'data'), { recursive: true, force: true });
  mkdirSync(config.tmpDir, { recursive: true });

  if(ready) for(const n of readdirSync(spare)) copyFileSync(resolve(spare, n), up(n));
});

const restoreUploads = () => {
  for(const n of readdirSync(spare)) copyFileSync(resolve(spare, n), up(n));
};

describe('reconcile', () => {
  test('killed after the commit, before the uploads were deleted: the uploads go, the node stays', async () => {
    if(!ready) return;

    const r = await saveNew(h, { doc: doc([photo('photo001', A), photo('photo002', B)]) });

    expect(r.status).toBe(201);
    restoreUploads(); // what the disk looks like if the process died before step 5

    const removed = await reconcile(h);

    expect(removed.uploads.sort()).toEqual([A, B]);
    expect(uploadsLeft()).toEqual([]);
    expect(getNode(h, r.body.id)).not.toBeNull();
    expect(nodePhotos(h, r.body.id).length).toBe(2);
    // the two baked photos and the tile of the node (a photo's own thumbnail or the rendered collage)
    expect(photoDir().filter(n => !n.endsWith('.thumb.jpg'))).toEqual([`${A}.jpg`, `${B}.jpg`]);
    expect(photoDir().filter(n => n.endsWith('.thumb.jpg')).length).toBe(1);
  });

  test('killed after baking, before the commit: the baked files and the row go, the upload stays', async () => {
    if(!ready) return;

    // steps 2-3 done (files, thumbnail, photo row), step 4 never ran
    await saveNew(h, { doc: doc([photo('photo001', A)]) });
    h.run('DELETE FROM nodes');
    restoreUploads();

    expect(getPhoto(h, A)).not.toBeNull();

    const removed = await reconcile(h);

    expect(removed.photos).toEqual([A]);
    expect(getPhoto(h, A)).toBeNull();
    expect(photoDir()).toEqual([]);
    expect(uploadsLeft()).toEqual([`${A}.jpg`, `${A}.json`, `${B}.json`, `${B}.png`]);

    // the user saves again and it works
    expect((await saveNew(h, { doc: doc([photo('photo001', A)]) })).status).toBe(201);
  });

  test('stray files: a baked file without a row, temporary leftovers', async () => {
    if(!ready) return;

    mkdirSync(config.photosDir, { recursive: true });
    upsertPhoto(h, { hash: B, ext: 'jpg' });
    h.run("INSERT INTO nodes (doc, created_at, updated_at) VALUES ('{}', 1, 1)");
    h.run('INSERT INTO node_photos (node_id, photo_hash) VALUES (1, ?)', B);
    for(const n of [`${A}.jpg`, `${A}.thumb.jpg`, `${B}.jpg`, `${B}.jpg.tmp.jpg`, 'notes.txt']) writeFileSync(resolve(config.photosDir, n), 'x');

    const removed = await reconcile(h);

    expect(removed.files.sort()).toEqual([`${A}.jpg`, `${A}.thumb.jpg`, `${B}.jpg.tmp.jpg`, 'notes.txt']);
    expect(photoDir()).toEqual([`${B}.jpg`]);
  });

  test('the tile the editor drew is kept; a node whose tile file is gone shows its first photo again', async () => {
    if(!ready) return;

    await run([...imagemagick.convert, '-size', '64x64', 'gradient:green-white', resolve(root, 'tile.jpg')]);

    const data = 'data:image/jpeg;base64,' + Buffer.from(await Bun.file(resolve(root, 'tile.jpg')).arrayBuffer()).toString('base64');
    const kept = await (await saveNew(h, { doc: doc([photo('photo001', A)]), thumb: data })).body;
    const tile = getNode(h, kept.id).tile;

    expect(tile).not.toBe(A);
    await reconcile(h);
    expect(existsSync(resolve(config.photosDir, `${tile}.thumb.jpg`))).toBe(true);

    rmSync(resolve(config.photosDir, `${tile}.thumb.jpg`));
    expect((await reconcile(h)).tiles).toEqual([kept.id]);
    expect(getNode(h, kept.id).tile).toBe(A);
    expect(existsSync(resolve(config.photosDir, `${A}.thumb.jpg`))).toBe(true);
  });

  test('a clean state is a no-op and a second run changes nothing', async () => {
    if(!ready) return;

    await saveNew(h, { doc: doc([photo('photo001', A)]) });

    const before = [photoDir(), uploadsLeft()];

    expect(await reconcile(h)).toEqual({ uploads: [], photos: [], files: [] });
    expect(await reconcile(h)).toEqual({ uploads: [], photos: [], files: [] });
    expect([photoDir(), uploadsLeft()]).toEqual(before);
  });

  test('no directories at all is fine', async () => {
    rmSync(resolve(root, 'data'), { recursive: true, force: true });
    rmSync(resolve(root, 'uploads'), { recursive: true, force: true });
    expect(await reconcile(h)).toEqual({ uploads: [], photos: [], files: [] });
  });
});
