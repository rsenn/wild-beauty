// Upload endpoints (PLAN.md S6.1, S6.2). One file per request, the raw
// body streamed to disk while it is hashed; the file is then stored as
// uploads/<sha256>.<ext> next to a sidecar uploads/<sha256>.json.
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { HASH, UPLOAD_FILE, config } from '../config.js';
import { sniff } from '../media/sniff.js';
import { extractDisplay } from '../media/heif.js';
import { ingest, uploadPath } from '../media/ingest.js';
import { logFile } from '../log.js';
import { run } from '../media/run.js';
import { imagemagick } from '../media/tools.js';
import { expiringCookie, sessionFor } from '../session.js';

mkdirSync(config.tmpDir, { recursive: true });

const fail = (status, code, message) => Response.json({ error: { code, message } }, { status });

// a file name from the X-Filename header: decoded, no path, no control characters
function cleanName(header) {
  let name;

  try {
    name = decodeURIComponent(header ?? '');
  } catch {
    name = header ?? '';
  }

  return name.replace(/[\u0000-\u001f\u007f]/g, '').split(/[\\/]/).pop().slice(0, 255) || 'unnamed';
}

const sidecarPath = hash => resolve(config.uploadsDir, `${hash}.json`);

async function writeSidecar(record) {
  const tmp = resolve(config.tmpDir, `${crypto.randomUUID()}.json`);

  const json = JSON.stringify(record);

  await Bun.write(tmp, json);
  renameSync(tmp, sidecarPath(record.hash));
  logFile('write', sidecarPath(record.hash), `${json.length} bytes`);
}

// what a client sees of a record: not who owns it
const shown = ({ owners, ...record }) => record;

// when a record expires: the last owner's expiry; records from before owners
// existed have none and age from their upload
const expiryOf = record => (record.owners ? Math.max(0, ...Object.values(record.owners)) : record.uploadedAt + config.uploadTtlMs);

// the owner takes (or renews) the record for the whole lifetime
async function claim(record, session) {
  const live = Object.entries(record.owners ?? {}).filter(([, until]) => until > Date.now());

  record.owners = { ...Object.fromEntries(live), [session.owner]: Date.now() + config.uploadTtlMs };
  await writeSidecar(record);
}

// the reply for an upload: the record, and the cookie with the record's lifetime
const uploaded = (record, status, session) => Response.json(shown(record), { status, headers: { 'set-cookie': expiringCookie(session.token, config.uploadTtlMs) } });

// POST /api/uploads: raw body, name in X-Filename
export async function createUpload(req) {
  const session = sessionFor(req);
  const length = req.headers.get('content-length');

  if(length !== null && Number(length) > config.maxBytes) return fail(413, 'too-large', 'file too large');
  if(!req.body || length === '0') return fail(400, 'empty', 'empty file');

  const name = cleanName(req.headers.get('x-filename'));
  const hasher = new Bun.CryptoHasher('sha256');
  const tmp = resolve(config.tmpDir, crypto.randomUUID());
  const writer = Bun.file(tmp).writer();
  const head = new Uint8Array(32);
  let headLength = 0;
  let size = 0;
  let type = null;

  try {
    for await (const chunk of req.body) {
      size += chunk.byteLength;

      if(size > config.maxBytes) return fail(413, 'too-large', 'file too large');

      if(headLength < head.length) {
        head.set(chunk.subarray(0, head.length - headLength), headLength);
        headLength = Math.min(head.length, headLength + chunk.byteLength);
      }

      // decide as soon as the signature is readable, before the rest arrives
      if(!type && headLength >= head.length && !(type = sniff(head))) return fail(415, 'unsupported', 'not a supported image');

      hasher.update(chunk);
      writer.write(chunk);
    }

    await writer.end();
    logFile('write', tmp, `${size} bytes (temporary upload)`);

    if(size === 0) return fail(400, 'empty', 'empty file');

    type ??= sniff(head.subarray(0, headLength));

    if(!type) return fail(415, 'unsupported', 'not a supported image');

    const hash = hasher.digest('hex');
    const file = `${hash}.${type.ext}`;
    const final = resolve(config.uploadsDir, file);

    // same bytes again: keep the first copy and its record
    if(existsSync(final) && existsSync(sidecarPath(hash))) {
      const known = await Bun.file(sidecarPath(hash)).json();

      await claim(known, session);

      return uploaded(known, 200, session);
    }

    renameSync(tmp, final);
    logFile('write', final, `${size} bytes (moved from .tmp, ${type.mime})`);

    const record = { hash, ext: type.ext, display: file, name, size, mime: type.mime, uploadedAt: Date.now() };

    if(type.ext === 'heic' || type.ext === 'heif') {
      record.display = await extractDisplay(final, hash);

      if(!record.display) {
        rmSync(final, { force: true });
        logFile('rm', final, 'undecodable');

        return fail(422, 'undecodable', 'the image could not be decoded');
      }
    }

    Object.assign(record, await ingest(final, uploadPath(record.display)));

    await claim(record, session);

    return uploaded(record, 201, session);
  } catch {
    // client went away mid-upload or the disk failed
    return fail(500, 'upload-failed', 'upload failed');
  } finally {
    try {
      await writer.end();
    } catch {}

    if(existsSync(tmp)) logFile('rm', tmp, 'temporary upload');

    rmSync(tmp, { force: true });
  }
}

// the cookie that keeps the session's uploads for their whole lifetime
export const keepCookie = session => expiringCookie(session.token, config.uploadTtlMs);

// Store a file the server made itself (a cutout) as an upload of this session:
// same record, same owner and lifetime as an upload from the browser. -> the
// record as a client sees it, or null when the file is not an image.
export async function storeFile(session, path, name, { displayMax = 0 } = {}) {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  const type = sniff(bytes.subarray(0, 32));

  if(!type) return null;

  const hash = new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
  const file = `${hash}.${type.ext}`;
  const final = resolve(config.uploadsDir, file);

  if(existsSync(final) && existsSync(sidecarPath(hash))) {
    const known = await Bun.file(sidecarPath(hash)).json();

    await claim(known, session);

    return shown(known);
  }

  await Bun.write(final, bytes);
  logFile('write', final, `${bytes.length} bytes (${name})`);

  const record = { hash, ext: type.ext, display: file, name, size: bytes.length, mime: type.mime, uploadedAt: Date.now() };

  // a big image gets a smaller display copy (WebP keeps the alpha): the editor loads
  // that one, which matters on a phone; the original stays for baking
  if(displayMax > 0 && imagemagick.convert) {
    const display = `${hash}.display.webp`;
    const { code } = await run([...imagemagick.convert, `${final}[0]`, '-resize', `${displayMax}x${displayMax}>`, '-quality', '88', '-define', 'webp:alpha-quality=100', resolve(config.uploadsDir, display)], { timeout: 60000 });

    if(code === 0) record.display = display;
  }

  Object.assign(record, await ingest(final, uploadPath(record.display)));
  await claim(record, session);

  return shown(record);
}

// the sidecar records on disk, newest first; unreadable ones are skipped
async function readAll() {
  const names = readdirSync(config.uploadsDir).filter(n => n.endsWith('.json') && HASH.test(n.slice(0, -5)));
  const records = await Promise.all(names.map(n => Bun.file(resolve(config.uploadsDir, n)).json().catch(() => null)));

  return records.filter(r => r && r.hash).sort((a, b) => b.uploadedAt - a.uploadedAt);
}

// the uploads of one owner (the `owner` of sessionFor), newest first
export async function readUploads(owner) {
  return (await readAll()).filter(r => r.owners?.[owner] > Date.now()).map(shown);
}

// GET /api/uploads: only what this browser's cookie uploaded, and not yet expired
export async function listUploads(req) {
  return Response.json(await readUploads(sessionFor(req).owner));
}

// remove every upload past its expiry; -> the hashes removed
export async function sweepUploads() {
  const gone = [];

  for(const record of await readAll()) {
    if(expiryOf(record) > Date.now()) continue;

    await removeUpload(record.hash);
    gone.push(record.hash);
  }

  return gone;
}

// GET /files/uploads/<hash>[.display].<ext>: only names that match UPLOAD_FILE
export function serveUpload(name, method) {
  if(!UPLOAD_FILE.test(name)) return new Response('not found\n', { status: 404 });

  const file = Bun.file(resolve(config.uploadsDir, name));

  // content-addressed: the bytes behind a name never change
  const headers = { 'content-type': file.type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' };

  return file.exists().then(found => (found ? new Response(method === 'HEAD' ? null : file, { headers: { ...headers, 'content-length': String(file.size) } }) : new Response('not found\n', { status: 404 })));
}

// the original, the display file and the sidecar of an upload; false when
// there is no such upload
export async function removeUpload(hash) {
  const meta = existsSync(sidecarPath(hash)) ? await Bun.file(sidecarPath(hash)).json() : null;

  if(!meta) return false;

  for(const name of new Set([`${hash}.${meta.ext}`, meta.display, `${hash}.json`])) {
    if(!UPLOAD_FILE.test(name) && name !== `${hash}.json`) continue;

    logFile('rm', resolve(config.uploadsDir, name), 'delete upload');
    rmSync(resolve(config.uploadsDir, name), { force: true });
  }

  return true;
}

// the sidecar record of an upload, or null
export const readUpload = async hash => (HASH.test(hash) && existsSync(sidecarPath(hash)) ? Bun.file(sidecarPath(hash)).json().catch(() => null) : null);

// DELETE /api/uploads/<hash>: the owner lets go; the files go with the last owner
export async function deleteUpload(hash, req) {
  if(!HASH.test(hash)) return fail(400, 'bad-hash', 'invalid hash');

  const record = await readUpload(hash);
  const owner = sessionFor(req).owner;

  if(!record?.owners?.[owner]) return fail(404, 'not-found', 'no such upload');

  delete record.owners[owner];

  if(Object.values(record.owners).some(until => until > Date.now())) await writeSidecar(record);
  else await removeUpload(hash);

  return new Response(null, { status: 204 });
}
