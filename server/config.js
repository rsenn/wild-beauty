// Paths and limits (PLAN.md S6.2, S9).
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');

export const config = {
  root,
  uploadsDir: resolve(root, 'uploads'),
  tmpDir: resolve(root, 'uploads/.tmp'),
  // Bun.serve rejects larger bodies with 413 before the handler runs
  maxBytes: 40 * 1024 * 1024,
  // the pixel limit handed to ImageMagick when it decodes an upload
  toolTimeoutMs: 30000,
};

export const HASH = /^[0-9a-f]{64}$/;

// names under uploads/ that may be served: <hash>.<ext> or <hash>.display.<jpg|png>
export const UPLOAD_FILE = /^([0-9a-f]{64})(\.display)?\.(jpg|png|webp|gif|avif|heic|heif|tiff)$/;
