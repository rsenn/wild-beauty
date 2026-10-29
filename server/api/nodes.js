// Node endpoints (EDITOR.md S4, S4.1). POST /api/nodes: validate, bake the
// uploads the node uses into data/photos, write the rows in one transaction,
// and only after the commit delete the uploads. Errors are `{ error: <code> }`
// with the codes of EDITOR.md S2.11.
import { createHash } from 'node:crypto';
import { mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { log } from '../log.js';
import { database } from '../db/db.js';
import { addSuggestions, deleteNode, deletePhoto, getNode, listNodes, getPhoto, insertNode, nodePhotos, releaseLock, setNodePhotos, updateNode, upsertPhoto } from '../db/nodes.js';
import { validateNode, photoLookup } from '../node/validate.js';
import { bake } from '../media/bake.js';
import { identify } from '../media/probe.js';
import { firstPhotoStep, thumbnail } from '../media/thumb.js';
import { needsRender, serverTile } from '../media/raster.js';
import { photoInfos } from '../node/view.js';
import { readUpload, removeUpload } from './uploads.js';
import { lockedBody, lockedByOther } from './locks.js';
import { sessionCookie, sessionFor } from '../session.js';

// request bodies are capped a little above the document limit (EDITOR.md S4.1)
export const MAX_BODY = 1.2 * 1024 * 1024;

// a new session (cookie not seen before) is handed its cookie on the way out
const reply = (status, body, session) => Response.json(body, { status, headers: session?.fresh ? { 'set-cookie': sessionCookie(session.token) } : {} });
const fail = (status, error, details) => reply(status, { error, ...(details && { details }) });

// the node palette: the photo palettes added up by colour, heaviest first, 8 at most
export function mergePalettes(palettes) {
  const weight = new Map();

  for(const palette of palettes) for(const { hex, weight: w = 1 } of palette ?? []) weight.set(hex, (weight.get(hex) ?? 0) + w);

  return [...weight].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex, w]) => ({ hex, weight: w }));
}

// Bake one used upload into data/photos and record it. Already baked: nothing
// to do. -> { error } | { baked: true } | { known: true }
async function bakePhoto(h, hash) {
  if(getPhoto(h, hash)) return { known: true };

  const record = await readUpload(hash);

  if(!record) return { error: 'missing_photo' };

  const src = resolve(config.uploadsDir, record.display);
  const dest = resolve(config.photosDir, hash);
  const r = await bake(src, dest);

  if(!r.ok) return { error: 'bake_failed', message: r.error };

  const file = `${dest}.${r.ext}`;
  const { width, height } = await identify(file);

  upsertPhoto(h, { hash, ext: r.ext, width, height, bytes: statSync(file).size, palette: record.palette ?? [] });

  return { baked: true };
}

// Saves are one at a time: two requests must not interleave their baking and
// cleanup (a photo one of them is about to drop could be the other's new one).
let queue = Promise.resolve();
const serial = fn => {
  const run = queue.then(fn, fn);

  queue = run.catch(() => {});

  return run;
};

// The tile the editor drew of the whole composition (a JPEG data url sent with the
// save): written as <sha256>.thumb.jpg in the photos folder, the hash being the
// tile's name. -> the hash, or null when it is no sound JPEG of a sane size.
const THUMB = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/;

async function storeTile(thumb) {
  const found = typeof thumb === 'string' && thumb.length < 600000 && THUMB.exec(thumb);

  if(!found) return null;

  const bytes = Buffer.from(found[1], 'base64');

  if(bytes.length < 200 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;

  const hash = createHash('sha256').update(bytes).digest('hex');
  const dest = resolve(config.photosDir, `${hash}.thumb.jpg`);
  const tmp = `${dest}.tmp.jpg`;

  mkdirSync(config.photosDir, { recursive: true });
  writeFileSync(tmp, bytes);

  const info = await identify(tmp);

  if(info.error || info.width < 16 || info.height < 16 || info.width > 1024 || info.height > 1024) return (rmSync(tmp, { force: true }), null);

  renameSync(tmp, dest);

  return hash;
}

// a tile no node shows any more: its file goes, unless it is a photo's own thumbnail
export function dropTile(h, tile) {
  if(!tile || getPhoto(h, tile) || h.get('SELECT 1 AS used FROM nodes WHERE tile = ?', tile)) return;

  rmSync(resolve(config.photosDir, `${tile}.thumb.jpg`), { force: true });
}

// the validated body made ready to commit: every photo baked, the tile
// written. -> { error: { status, body } } | { bakedNow, tile, palette }
async function prepare(h, checked, thumb) {
  mkdirSync(config.photosDir, { recursive: true });

  // baking is idempotent and happens before the transaction: a crash leaves
  // a photo in both places, which the next start reconciles (E27)
  const bakedNow = [];
  const positions = [];

  for(const { hash } of checked.photos) {
    // an upload's position is kept only as a suggestion for the owner (GRAPH.md S1.5)
    const pos = (await readUpload(hash))?.pos;

    if(pos) positions.push(pos);

    const r = await bakePhoto(h, hash);

    if(r.error) {
      dropUnused(h, bakedNow);

      return { error: { status: r.error === 'missing_photo' ? 422 : 500, body: { error: r.error, details: r.message } } };
    }

    if(r.baked) bakedNow.push(hash);
  }

  // the tile: what the editor drew, else the whole page rasterised on the server
  // (E82), else the first photo step (best effort)
  let tile = await storeTile(thumb);

  // a single plain photo keeps its own thumbnail; collages, drawings, text and shapes get the real render
  if(!tile && needsRender(checked.doc)) {
    const r = await serverTile(checked.doc, hash => getPhoto(h, hash));

    if(r.ok) tile = r.hash;
    else log('error', 'tile', r.error);
  }

  const step = tile ? null : firstPhotoStep(checked.doc);

  if(step) {
    const photo = getPhoto(h, step.photo);
    const t = await thumbnail(resolve(config.photosDir, `${photo.hash}.${photo.ext}`), resolve(config.photosDir, `${photo.hash}.thumb.jpg`), { step, bg: checked.doc.bg });

    if(t.ok) tile = photo.hash;
    else log('error', 'thumbnail', t.error);
  }

  return { bakedNow, positions, tile, palette: mergePalettes(checked.photos.map(p => getPhoto(h, p.hash).palette)) };
}

// the baked files and the row of photos no node uses: -> the hashes removed
function dropUnused(h, hashes) {
  const gone = [];

  for(const hash of hashes) {
    const photo = getPhoto(h, hash);

    if(!photo || h.get('SELECT 1 AS used FROM node_photos WHERE photo_hash = ?', hash)) continue;

    h.tx(() => deletePhoto(h, hash));

    for(const name of [`${hash}.${photo.ext}`, `${hash}.thumb.jpg`]) rmSync(resolve(config.photosDir, name), { force: true });

    gone.push(hash);
  }

  return gone;
}

// Create a node from `body` ({ doc, kind? }) -> { status, body }. `h` is the database.
export const saveNew = (h, body) =>
  serial(async () => {
    const checked = validateNode(body, { hasPhoto: photoLookup(h) });

    if(!checked.ok) return { status: checked.status, body: { error: checked.code, details: checked.errors } };

    const ready = await prepare(h, checked, body.thumb);

    if(ready.error) return ready.error;

    const created = h.tx(() => {
      const node = insertNode(h, { title: checked.title, doc: checked.doc, palette: ready.palette, kind: checked.kind });

      setNodePhotos(h, node.id, checked.photos);
      addSuggestions(h, node.id, ready.positions);

      if(ready.tile) h.run('UPDATE nodes SET tile = ? WHERE id = ?', ready.tile, node.id);

      return node;
    });

    // after the commit the uploads are no longer needed
    for(const { hash } of checked.photos) await removeUpload(hash);

    // the photos now live in data/photos: where they are, for the editor
    return { status: 201, body: { ...created, photos: photoInfos(h, checked.doc) } };
  });

// Replace the document of node `id` with `body` ({ doc, kind?, rev }) when
// `rev` is still the stored one, else 409 with the current rev. Only uploads
// are baked (a photo the node already had is kept); photos the node no longer
// uses and nobody else does are removed. -> { status, body }
export const saveUpdate = (h, id, body, { holder = null, now = Date.now } = {}) =>
  serial(async () => {
    const node = getNode(h, id);

    if(!node) return { status: 404, body: { error: 'not_found' } };
    if(!canEdit(node, null)) return { status: 403, body: { error: 'forbidden' } };
    const locked = lockedByOther(h, id, holder, now());

    if(locked) return { status: 423, body: lockedBody(locked) };
    if(!Number.isInteger(body?.rev) || body.rev < 1) return { status: 400, body: { error: 'invalid', details: [{ code: 'bad_rev', path: 'rev' }] } };
    if(body.rev !== node.rev) return { status: 409, body: { error: 'conflict', rev: node.rev } };

    const checked = validateNode(body, { hasPhoto: photoLookup(h) });

    if(!checked.ok) return { status: checked.status, body: { error: checked.code, details: checked.errors } };

    const before = nodePhotos(h, id).map(p => p.hash);
    const ready = await prepare(h, checked, body.thumb);

    if(ready.error) return ready.error;

    const rev = h.tx(() => {
      const next = updateNode(h, id, { rev: body.rev, title: checked.title, doc: checked.doc, palette: ready.palette });

      if(next === null) return null;

      h.run('UPDATE nodes SET kind = ?, tile = ? WHERE id = ?', checked.kind, ready.tile, id);
      setNodePhotos(h, id, checked.photos);
      addSuggestions(h, id, ready.positions);

      return next;
    });

    if(rev === null) {
      // lost a race inside the transaction: undo what this request baked
      dropUnused(h, ready.bakedNow);

      return { status: 409, body: { error: 'conflict', rev: getNode(h, id)?.rev } };
    }

    if(node.tile !== ready.tile) dropTile(h, node.tile);

    const kept = new Set(checked.photos.map(p => p.hash));

    dropUnused(h, before.filter(hash => !kept.has(hash)));

    for(const { hash } of checked.photos) await removeUpload(hash);

    // saving ends the editing session: the lock is released
    if(holder) releaseLock(h, id, holder);

    return { status: 200, body: { rev, photos: photoInfos(h, checked.doc) } };
  });

// Delete node `id`: the row, its photo rows, edges and lock go with it, then
// every photo nobody else uses, with its file and thumbnail. -> { status, body }
export const removeNode = (h, id, { holder = null, now = Date.now } = {}) =>
  serial(async () => {
    const node = getNode(h, id);

    if(!node) return { status: 404, body: { error: 'not_found' } };
    if(!canEdit(node, null)) return { status: 403, body: { error: 'forbidden' } };

    const locked = lockedByOther(h, id, holder, now());

    if(locked) return { status: 423, body: lockedBody(locked) };

    const photos = nodePhotos(h, id).map(p => p.hash);

    h.tx(() => deleteNode(h, id));
    dropTile(h, node.tile);
    dropUnused(h, photos);

    return { status: 204, body: null };
  });

// the JSON body of a request: { body } or { error: Response }
async function jsonBody(req) {
  if(!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return { error: fail(415, 'invalid') };
  if(Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return { error: fail(413, 'too_large') };

  const text = await req.text();

  if(Buffer.byteLength(text) > MAX_BODY) return { error: fail(413, 'too_large') };

  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: fail(400, 'invalid') };
  }
}

// POST /api/nodes
export async function createNode(req, h) {
  const { body, error } = await jsonBody(req);

  if(error) return error;

  const r = await saveNew(h ?? (await database()), body);

  return reply(r.status, r.body);
}

// PUT /api/nodes/:id
export async function updateNodeRoute(req, idText, h) {
  if(!/^\d{1,15}$/.test(idText)) return fail(404, 'not_found');

  const { body, error } = await jsonBody(req);

  if(error) return error;

  const session = sessionFor(req);
  const r = await saveUpdate(h ?? (await database()), Number(idText), body, { holder: session.holder });

  return reply(r.status, r.body, session);
}

// Who may see a node. The PoC has no accounts: everybody sees everything.
// With accounts this is the one place that applies `visibility`, the owner
// and the group (PLAN.md S8); everything that reads a node goes through it.
export const canView = (node, viewer) => true;

// Who may change or delete a node: the owner, or a curator or admin of its
// group. The PoC has no accounts, so everybody may.
export const canEdit = (node, viewer) => true;

// what the API tells about a node: the row without internals, and the document
const publicNode = ({ id, title, kind, doc, palette, tile, visibility, owner_id, group_id, x, y, pinned, created_at, updated_at }) => ({ id, title, kind, doc, palette, tile, visibility, owner_id, group_id, x, y, pinned, created_at, updated_at });

// GET /api/nodes/:id -> 200 { node, rev }; the ETag is the rev, so a client
// that has it gets 304
export async function readNode(req, idText, h) {
  const db = h ?? (await database());
  const node = /^\d{1,15}$/.test(idText) ? getNode(db, Number(idText)) : null;

  if(!node) return fail(404, 'not_found');
  if(!canView(node, null)) return fail(403, 'forbidden');

  const etag = `"${node.id}-${node.rev}"`;
  const headers = { etag, 'cache-control': 'no-cache' };

  if(req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });

  return Response.json({ node: publicNode(node), rev: node.rev, photos: photoInfos(db, node.doc) }, { headers });
}

// DELETE /api/nodes/:id -> 204
export async function deleteNodeRoute(idText, h, req) {
  if(!/^\d{1,15}$/.test(idText)) return fail(404, 'not_found');

  const session = req ? sessionFor(req) : { holder: null };
  const r = await removeNode(h ?? (await database()), Number(idText), { holder: session.holder });

  return r.status === 204 ? new Response(null, { status: 204 }) : reply(r.status, r.body);
}

// what a tile of the saved-nodes list shows (E68)
export const tileOf = ({ id, title, kind, tile, updated_at }) => ({ id, title, kind, tile, updated_at });

// the nodes that may be seen, newest first
export const visibleNodes = h => listNodes(h).filter(node => canView(node, null)).map(tileOf);

// GET /api/nodes -> 200 { nodes: [tile, ...] }
export async function listNodesRoute(h) {
  return Response.json({ nodes: visibleNodes(h ?? (await database())) }, { headers: { 'cache-control': 'no-cache' } });
}
