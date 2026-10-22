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

// POST /api/uploads: raw body, name in X-Filename
export async function createUpload(req) {
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
    if(existsSync(final) && existsSync(sidecarPath(hash))) return Response.json(await Bun.file(sidecarPath(hash)).json(), { status: 200 });

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

    await writeSidecar(record);

    return Response.json(record, { status: 201 });
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

// the sidecar records on disk, newest first; unreadable ones are skipped
export async function readUploads() {
  const names = readdirSync(config.uploadsDir).filter(n => n.endsWith('.json') && HASH.test(n.slice(0, -5)));
  const records = await Promise.all(names.map(n => Bun.file(resolve(config.uploadsDir, n)).json().catch(() => null)));

  return records.filter(r => r && r.hash).sort((a, b) => b.uploadedAt - a.uploadedAt);
}

// GET /api/uploads
export async function listUploads() {
  return Response.json(await readUploads());
}

// GET /files/uploads/<hash>[.display].<ext>: only names that match UPLOAD_FILE
export function serveUpload(name, method) {
  if(!UPLOAD_FILE.test(name)) return new Response('not found\n', { status: 404 });

  const file = Bun.file(resolve(config.uploadsDir, name));

  // content-addressed: the bytes behind a name never change
  const headers = { 'content-type': file.type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' };

  return file.exists().then(found => (found ? new Response(method === 'HEAD' ? null : file, { headers: { ...headers, 'content-length': String(file.size) } }) : new Response('not found\n', { status: 404 })));
}

// DELETE /api/uploads/<hash>: the original, the display file and the sidecar
export async function deleteUpload(hash) {
  if(!HASH.test(hash)) return fail(400, 'bad-hash', 'invalid hash');

  const meta = existsSync(sidecarPath(hash)) ? await Bun.file(sidecarPath(hash)).json() : null;

  if(!meta) return fail(404, 'not-found', 'no such upload');

  for(const name of new Set([`${hash}.${meta.ext}`, meta.display, `${hash}.json`])) {
    if(!UPLOAD_FILE.test(name) && name !== `${hash}.json`) continue;

    logFile('rm', resolve(config.uploadsDir, name), 'delete upload');
    rmSync(resolve(config.uploadsDir, name), { force: true });
  }

  return new Response(null, { status: 204 });
}
