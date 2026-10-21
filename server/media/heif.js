// HEIC/HEIF extraction (PLAN.md S6.2 step 3b): decode the primary image into
// uploads/<hash>.display.jpg (.png when it has alpha) so browsers and the
// rest of the pipeline never see the container.
import { mkdtempSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { run } from './run.js';

const opts = { timeout: config.toolTimeoutMs };

// `heif-info` lists "image: WxH (id=N), primary" and "alpha channel: yes|no"
async function primaryInfo(file) {
  const { code, stdout } = await run(['heif-info', '--', file], opts);

  if(code !== 0) return null;

  const m = /image: \d+x\d+ \(id=(\d+)\), primary[\s\S]*?alpha channel: (yes|no)/.exec(stdout);

  return m ? { id: m[1], alpha: m[2] === 'yes' } : null;
}

// -> the display file name (relative to uploadsDir), or null when undecodable
export async function extractDisplay(file, hash) {
  const info = await primaryInfo(file);

  if(!info) return null;

  const ext = info.alpha ? 'png' : 'jpg';
  const work = mkdtempSync(resolve(config.tmpDir, 'heif-'));

  try {
    // other images of the container (bursts, depth) get a numbered name
    const { code } = await run(['heif-convert', '--quiet', '-q', '99', '--', file, resolve(work, `out.${ext}`)], opts);
    const files = readdirSync(work);
    const picked = files.includes(`out.${ext}`) ? `out.${ext}` : files.find(f => f === `out-${info.id}.${ext}`);

    if(code !== 0 || !picked) return null;

    const name = `${hash}.display.${ext}`;

    renameSync(resolve(work, picked), resolve(config.uploadsDir, name));

    return name;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
