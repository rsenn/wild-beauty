// Node, photo and link queries (PLAN.md S8). Every function takes the handle
// from db.js `open()` first. `doc` and `palette` are JSON in the database and
// plain values here; time is Date.now() unless `now` is given.
import { migrateDoc } from '../../client/editor/model.js';

export const LABELS = ['child', 'ref', 'sells', 'at'];

const json = value => (value === undefined || value === null ? null : JSON.stringify(value));
const parse = text => (text === null || text === undefined ? null : JSON.parse(text));

const node = row => (row ? { ...row, doc: parse(row.doc), palette: parse(row.palette), pinned: !!row.pinned } : null);

// a new node at rev 1 -> { id, rev }
export function insertNode(h, { title = '', doc, palette, kind = 'node', now = Date.now() }) {
  const { lastInsertRowid } = h.run('INSERT INTO nodes (title, doc, palette, kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', title, json(doc), json(palette), kind, now, now);

  return { id: Number(lastInsertRowid), rev: 1 };
}

// the node with `doc` and `palette` parsed, or null. A document from before the
// square crop is converted on the way out (model.js migrateDoc).
export function getNode(h, id) {
  const found = node(h.get('SELECT * FROM nodes WHERE id = ?', id));

  if(found?.doc) found.doc = migrateDoc(found.doc, hash => getPhoto(h, hash));

  return found;
}

// the saved nodes for a list of tiles, newest first: { id, title, kind, tile, updated_at }
export const listNodes = (h, limit = 200) => h.all('SELECT id, title, kind, tile, updated_at FROM nodes ORDER BY updated_at DESC, id DESC LIMIT ?', limit);

// Save a new title, doc and palette if the stored rev is still `rev`.
// -> the new rev, or null when the node is gone or someone saved in between
// (getNode tells the two apart).
export function updateNode(h, id, { rev, title, doc, palette, now = Date.now() }) {
  const { changes } = h.run('UPDATE nodes SET title = ?, doc = ?, palette = ?, rev = rev + 1, updated_at = ? WHERE id = ? AND rev = ?', title, json(doc), json(palette), now, id, rev);

  return changes ? rev + 1 : null;
}

// the node; its photo rows, locks and edges go with it. Photos stay (see orphanPhotos).
export const deleteNode = (h, id) => h.run('DELETE FROM nodes WHERE id = ?', id).changes > 0;

// insert a photo, or refresh the facts of a known hash
export function upsertPhoto(h, { hash, ext, width, height, bytes, palette, meta, now = Date.now() }) {
  h.run(
    `INSERT INTO photos (hash, ext, width, height, bytes, palette, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (hash) DO UPDATE SET ext = excluded.ext, width = excluded.width, height = excluded.height, bytes = excluded.bytes, palette = excluded.palette, meta = excluded.meta`,
    hash, ext, width ?? null, height ?? null, bytes ?? null, json(palette), json(meta), now,
  );
}

export const getPhoto = (h, hash) => {
  const row = h.get('SELECT * FROM photos WHERE hash = ?', hash);

  return row && { ...row, palette: parse(row.palette), meta: parse(row.meta) };
};

// Replace the photos of a node: `photos` is [{ hash, role? }] in drawing
// order (a hash twice counts once). Every hash must be a known photo.
export function setNodePhotos(h, id, photos) {
  h.tx(() => {
    h.run('DELETE FROM node_photos WHERE node_id = ?', id);

    const seen = new Set();

    for(const { hash, role = 'picture' } of photos) {
      if(seen.has(hash)) continue;

      h.run('INSERT INTO node_photos (node_id, photo_hash, sort, role) VALUES (?, ?, ?, ?)', id, hash, seen.size, role);
      seen.add(hash);
    }
  });
}

export const nodePhotos = (h, id) => h.all('SELECT photo_hash AS hash, sort, role FROM node_photos WHERE node_id = ? ORDER BY sort', id);

// photos no node uses any more, to delete from disk and database
export const orphanPhotos = h => h.all('SELECT hash, ext FROM photos WHERE hash NOT IN (SELECT photo_hash FROM node_photos)');

export const deletePhoto = (h, hash) => h.run('DELETE FROM photos WHERE hash = ?', hash).changes > 0;

// an edge from -> to; adding it again changes its sort. -> true
export function addLink(h, from, to, label, sort = 0) {
  if(!LABELS.includes(label)) throw new Error(`unknown link label "${label}"`);

  h.run('INSERT INTO node_links (from_id, to_id, label, sort) VALUES (?, ?, ?, ?) ON CONFLICT (from_id, to_id, label) DO UPDATE SET sort = excluded.sort', from, to, label, sort);

  return true;
}

export const removeLink = (h, from, to, label) => h.run('DELETE FROM node_links WHERE from_id = ? AND to_id = ? AND label = ?', from, to, label).changes > 0;

// edges out of / into a node, children first in their order; `label` narrows
export const linksFrom = (h, id, label) => h.all('SELECT to_id AS id, label, sort FROM node_links WHERE from_id = ?1 AND (?2 IS NULL OR label = ?2) ORDER BY sort, id', id, label ?? null);

export const linksTo = (h, id, label) => h.all('SELECT from_id AS id, label, sort FROM node_links WHERE to_id = ?1 AND (?2 IS NULL OR label = ?2) ORDER BY sort, id', id, label ?? null);

// --- editor locks (EDITOR.md S2.8, S3.5) -----------------------------------
// One row per node. A lock is live while `expires_at` is in the future; an
// expired row is ignored and replaced, never swept. Times are ms since 1970.
export const LOCK_TTL = 60000;

// the live lock of a node, or null
export const getLock = (h, id, now = Date.now()) => h.get('SELECT holder, user_id, acquired_at, expires_at FROM node_locks WHERE node_id = ? AND expires_at > ?', id, now);

// Take or renew the lock for `holder`.
// -> { ok: true, expires_at } | { ok: false, holder, expires_at } (someone else holds it)
export function takeLock(h, id, holder, { userId = null, ttl = LOCK_TTL, now = Date.now() } = {}) {
  return h.tx(() => {
    const live = getLock(h, id, now);

    if(live && live.holder !== holder) return { ok: false, holder: live.holder, expires_at: live.expires_at };

    const expires = now + ttl;

    h.run(
      `INSERT INTO node_locks (node_id, holder, user_id, acquired_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT (node_id) DO UPDATE SET holder = excluded.holder, user_id = excluded.user_id, expires_at = excluded.expires_at,
         acquired_at = CASE WHEN node_locks.holder = excluded.holder AND node_locks.expires_at > ?4 THEN node_locks.acquired_at ELSE excluded.acquired_at END`,
      id, holder, userId, now, expires,
    );

    return { ok: true, expires_at: expires };
  });
}

// release the lock if `holder` holds it; true when a row went
export const releaseLock = (h, id, holder) => h.run('DELETE FROM node_locks WHERE node_id = ? AND holder = ?', id, holder).changes > 0;

// remove the lock whoever holds it; true when a row went
export const breakLock = (h, id) => h.run('DELETE FROM node_locks WHERE node_id = ?', id).changes > 0;

// --- graph view (GRAPH.md S3.5) --------------------------------------------

// every node as the graph draws it: { id, title, kind, tile, x, y, pinned, color }
export const graphNodes = h =>
  h.all('SELECT id, title, kind, tile, x, y, pinned, palette FROM nodes ORDER BY id').map(({ palette, pinned, ...row }) => ({ ...row, pinned: !!pinned, color: parse(palette)?.[0]?.hex ?? null }));

export const graphEdges = h => h.all('SELECT from_id AS "from", to_id AS "to", label FROM node_links ORDER BY from_id, sort, id');

// the place of a node on the graph, optionally pinned there -> true when the node exists
export const setPosition = (h, id, x, y, pinned) => h.run('UPDATE nodes SET x = ?, y = ?, pinned = COALESCE(?, pinned) WHERE id = ?', x, y, pinned === undefined ? null : pinned ? 1 : 0, id).changes > 0;

export const setPinned = (h, id, pinned) => h.run('UPDATE nodes SET pinned = ? WHERE id = ?', pinned ? 1 : 0, id).changes > 0;

// --- place suggestions (GRAPH.md S1.5) ---------------------------------------

// remember the rounded positions of the photos a node was saved with
export function addSuggestions(h, nodeId, positions) {
  for(const { lat, lon } of positions) h.run('INSERT OR IGNORE INTO place_suggestions (node_id, lat, lon) VALUES (?, ?, ?)', nodeId, lat, lon);
}

// every open suggestion: { node_id, title, lat, lon }
export const listSuggestions = h => h.all('SELECT s.node_id, n.title, s.lat, s.lon FROM place_suggestions s JOIN nodes n ON n.id = s.node_id ORDER BY s.node_id, s.lat, s.lon');

export const removeSuggestion = (h, nodeId, lat, lon) => h.run('DELETE FROM place_suggestions WHERE node_id = ? AND lat = ? AND lon = ?', nodeId, lat, lon).changes > 0;

// --- place names (GRAPH.md S1.5) -----------------------------------------------

// the cached municipality of a cell: a string, null (outside Switzerland) or undefined (not asked yet)
export function getPlaceName(h, { lat, lon }) {
  const row = h.get('SELECT name FROM place_names WHERE lat = ? AND lon = ?', lat, lon);

  return row ? row.name : undefined;
}

export const setPlaceName = (h, { lat, lon }, name) => h.run('INSERT OR REPLACE INTO place_names (lat, lon, name) VALUES (?, ?, ?)', lat, lon, name);
