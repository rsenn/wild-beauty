// POST /api/segment: the magic wand (EDITOR.md E119). Runs `opencv-imgproc
// segment` for one photo and the taps sent, and streams the tool's NDJSON lines
// back; closing the request kills the tool (a newer tap supersedes this one).
// The tool may print a preview result first and a full-resolution one later.
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { HASH, config } from '../config.js';
import { log, logCommand } from '../log.js';

const TOOL = process.env.WB_IMGPROC ?? 'opencv-imgproc';
const MODELS = process.env.WB_MODELS_DIR;
const VIEW_SIZE = 1024;
const MAX_POINTS = 32;

const fail = (status, code, message) => Response.json({ error: { code, message } }, { status });

// the image of a photo hash: the baked photo (data/photos/<hash>.<ext>) once the
// node was saved, else the upload the editor shows (uploads/<hash>.display.<ext>,
// or the original when it needed no display file)
const photoFile = hash => {
  const find = (dir, test) => {
    try {
      const name = readdirSync(dir).find(test);

      return name && resolve(dir, name);
    } catch {
      return null;
    }
  };

  return (
    find(config.photosDir, n => n.startsWith(`${hash}.`) && !n.includes('.thumb.')) ||
    find(config.uploadsDir, n => n.startsWith(`${hash}.display.`)) ||
    find(config.uploadsDir, n => new RegExp(`^${hash}\\.(jpe?g|png|webp)$`).test(n))
  );
};

// [[x, y, label], ...] with x, y in 0..1 of the photo; null when malformed
export function cleanPoints(points) {
  if(!Array.isArray(points) || points.length < 1 || points.length > MAX_POINTS) return null;

  const out = [];

  for(const p of points) {
    if(!Array.isArray(p) || !(p[0] >= 0 && p[0] <= 1) || !(p[1] >= 0 && p[1] <= 1)) return null;

    out.push([p[0], p[1], p[2] === 0 ? 0 : 1]);
  }

  return out;
}

export function segmentArgs({ file, points, out, cache, pick }) {
  const args = ['segment', '--in', file, '--units', 'norm', '--view-size', String(VIEW_SIZE), '--phases', 'preview,final'];

  for(const [x, y, label] of points) args.push('--point', `${x.toFixed(5)},${y.toFixed(5)},${label}`);

  args.push('--out', resolve(out, 'cut.png'), '--cache-dir', cache, '--refine', 'none', '--candidates', '3', '--pick', Number.isInteger(pick) && pick >= 0 && pick <= 2 ? String(pick) : 'best');

  if(MODELS) args.push('--models-dir', MODELS);

  return args;
}

export async function segmentRoute(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return fail(400, 'bad-json', 'bad request body');
  }

  const points = cleanPoints(body?.points);

  if(typeof body?.photo !== 'string' || !HASH.test(body.photo) || !points) return fail(400, 'bad-request', 'photo and points needed');

  const file = photoFile(body.photo);

  if(!file) return fail(404, 'no-photo', 'photo not found');

  const cache = resolve(config.tmpDir, 'segment-cache');
  const out = resolve(config.tmpDir, `segment-${crypto.randomUUID()}`);

  mkdirSync(cache, { recursive: true });
  mkdirSync(out, { recursive: true });

  const argv = [TOOL, ...segmentArgs({ file, points, out, cache, pick: body.pick })];

  logCommand(argv);

  let proc;

  try {
    proc = Bun.spawn(argv, { env: { PATH: process.env.PATH, LANG: 'C', HOME: process.env.HOME ?? '/tmp', ...(MODELS && { WB_MODELS_DIR: MODELS }) }, stdin: 'ignore', stdout: 'pipe', stderr: 'ignore', killSignal: 'SIGKILL' });
  } catch(e) {
    rmSync(out, { recursive: true, force: true });
    log('exec', `-> ${TOOL} failed to start: ${e.message}`);

    return fail(503, 'no-tool', 'segmentation is not available');
  }

  const clean = () => rmSync(out, { recursive: true, force: true });

  req.signal.addEventListener('abort', () => proc.kill());
  proc.exited.then(clean, clean);

  return new Response(proc.stdout, { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' } });
}

export const toolAvailable = () => !!Bun.which(TOOL);
