// Paths and limits (PLAN.md S6.2, S9).
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
// WB_DATA and WB_UPLOADS move the writable directories (tests run a server on temporary ones)
const data = process.env.WB_DATA ? resolve(process.env.WB_DATA) : resolve(root, 'data');
const uploads = process.env.WB_UPLOADS ? resolve(process.env.WB_UPLOADS) : resolve(root, 'uploads');

export const config = {
  root,
  dataDir: data,
  photosDir: resolve(data, 'photos'),
  dbFile: resolve(data, 'wb.sqlite3'),
  uploadsDir: uploads,
  tmpDir: resolve(uploads, '.tmp'),
  // Bun.serve rejects larger bodies with 413 before the handler runs
  maxBytes: 40 * 1024 * 1024,
  // the pixel limit handed to ImageMagick when it decodes an upload
  toolTimeoutMs: 30000,
};

export const HASH = /^[0-9a-f]{64}$/;

// names under uploads/ that may be served: <hash>.<ext> or <hash>.display.<jpg|png>
export const UPLOAD_FILE = /^([0-9a-f]{64})(\.display)?\.(jpg|png|webp|gif|avif|heic|heif|tiff)$/;
