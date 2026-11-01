// POST /api/segment: the magic wand (WAND.md, EDITOR.md E119). Two kinds of request, both
// stateless (the client sends all taps every time) and both streamed as NDJSON; closing the request
// kills what runs (a newer tap supersedes the running one):
// - select (no `action`): the taps become a selection. `opencv-imgproc segment --masks-only` answers
//   with three candidate masks as outlines at 1024 px, in about a second; nothing is stored.
// - apply (`action` cut, take or erase): the chosen candidate at full size. `cut` and `take` store
//   the soft-edged cut (`derived` role cut), `take` and `erase` fill the hole the subject leaves
//   (tools/inpaint.py) and store that photo (`derived` role rest). With `fill: false` the hole is
//   left transparent instead (a PNG, no model).
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { HASH, config } from '../config.js';
import { log, logCommand } from '../log.js';
import { lines } from '../media/lines.js';
import { sessionFor } from '../session.js';
import { peer } from '../events.js';
import { keepCookie, storeFile } from './uploads.js';

const TOOL = process.env.WB_IMGPROC ?? 'opencv-imgproc';
const MODELS = process.env.WB_MODELS_DIR;
const VIEW_SIZE = 1024;

// the hole a taken-out subject leaves is filled by tools/inpaint.py (MI-GAN in onnxruntime, about
// 2 s); WB_PYTHON is an interpreter with onnxruntime, numpy and pillow
const VENV_PYTHON = resolve(process.env.HOME ?? '/tmp', '.local/share/wild-beauty/inpaint-venv/bin/python');
const PYTHON = process.env.WB_PYTHON ?? (existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3');
const INPAINT = resolve(import.meta.dir, '../../tools/inpaint.py');

export const inpaintArgs = ({ file, cut, rest, fill = true }) => [PYTHON, '-I', INPAINT, '--image', file, '--cut', cut, '--out', rest, ...(fill ? [] : ['--no-fill'])];
const FILLS = ['take', 'erase'];
const MAX_POINTS = 32;
export const ACTIONS = ['cut', 'take', 'erase'];

const fail = (status, code, message) => Response.json({ error: { code, message } }, { status });

// the image of a photo hash: the baked photo (data/photos/<hash>.<ext>) once the
// node was saved, else the upload the editor shows (uploads/<hash>.display.<ext>,
// or the original when it needed no display file)
export const photoFile = hash => {
  const find = (dir, test) => {
    try {
      const name = readdirSync(dir).find(test);

      return name && resolve(dir, name);
    } catch {
      return null;
    }
  };

  return (
    find(config.photosDir, n => n.startsWith(`${hash}.`) && !n.includes('.thumb.') && !n.includes('.small.')) ||
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

// the manual clip the wand works inside: polygons of [u, v] in 0..1 of the photo. It goes to the tool
// as one argument, so it is thinned to at most MAX_REGION vertices; null when absent or malformed
const MAX_REGION = 600;

export function cleanRegion(region) {
  if(!Array.isArray(region) || !region.length || region.length > 8) return null;

  const total = region.reduce((n, poly) => n + (Array.isArray(poly) ? poly.length : 0), 0);
  const step = Math.max(1, Math.ceil(total / MAX_REGION));
  const out = [];

  for(const poly of region) {
    if(!Array.isArray(poly) || poly.length < 3 || poly.some(q => !Array.isArray(q) || !(q[0] >= 0 && q[0] <= 1) || !(q[1] >= 0 && q[1] <= 1))) return null;

    const thin = poly.filter((_, i) => i % step === 0);

    if(thin.length >= 3) out.push(thin.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]));
  }

  return out.length ? out : null;
}

// the tool's arguments: a select step without `action`, else the full-size cut of candidate `pick`
export function segmentArgs({ file, points, out, cache, pick, region, action }) {
  const args = ['segment', '--in', file, '--units', 'norm', '--progress', '--groups', 'auto', '--exclude', 'object', '--cache-dir', cache];

  for(const [x, y, label] of points) args.push('--point', `${x.toFixed(5)},${y.toFixed(5)},${label}`);

  if(ACTIONS.includes(action)) args.push('--out', resolve(out, 'cut.png'), '--refine', 'guided', '--png', '1', '--candidates', '1', '--pick', Number.isInteger(pick) && pick >= 0 && pick <= 2 ? String(pick) : '2');
  else args.push('--masks-only', '--view-size', String(VIEW_SIZE), '--candidates', '3', '--outline-smooth', '0.003', '--outline-vertices', '120');

  // the hole is filled from an 8-bit mask: it decodes in a fraction of the time of the RGBA cut
  if(FILLS.includes(action)) args.push('--mask-out', resolve(out, 'mask.png'));
  if(region) args.push('--region', JSON.stringify(region));
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

  const action = ACTIONS.includes(body.action) ? body.action : null;
  const fill = body.fill !== false;
  const argv = [TOOL, ...segmentArgs({ file, points, out, cache, pick: body.pick, region: cleanRegion(body.region), action })];

  const spawn = (args, stdin = 'ignore') => {
    logCommand(args);

    return Bun.spawn(args, { env: { PATH: process.env.PATH, LANG: 'C', HOME: process.env.HOME ?? '/tmp', ...(MODELS && { WB_MODELS_DIR: MODELS }) }, stdin, stdout: 'pipe', stderr: 'ignore', killSignal: 'SIGKILL' });
  };
  let proc;
  // take and erase: tools/inpaint.py starts with the tool and loads its model and the photo
  // (about 1.1 s) while the cut is made, then waits for the mask path on stdin
  let filler = null;
  const rest = resolve(out, fill ? 'rest.jpg' : 'rest.png');

  try {
    proc = spawn(argv);
  } catch(e) {
    rmSync(out, { recursive: true, force: true });
    log('exec', `-> ${TOOL} failed to start: ${e.message}`);

    return fail(503, 'no-tool', 'segmentation is not available');
  }

  if(FILLS.includes(action)) {
    try {
      filler = spawn(inpaintArgs({ file, cut: '-', rest, fill }), 'pipe');
    } catch(e) {
      log('exec', `-> ${PYTHON} inpaint failed to start: ${e.message}`);
    }
  }

  const stop = () => {
    proc.kill();
    filler?.kill();
  };

  // a slow final pass must not trip the server's idle timeout
  peer.server?.timeout(req, 0);

  const session = sessionFor(req);
  const encoder = new TextEncoder();
  let closed = false;

  // the tool's lines go on as they are. An apply stores the cut as an upload of the caller and
  // announces it as `derived` role cut (cut, take); tools/inpaint.py then fills the hole of the cut
  // in the photo, announced as `derived` role rest (take, erase), or `failed` role rest
  const stream = new ReadableStream({
    async start(controller) {
      const send = text => {
        if(!closed) controller.enqueue(encoder.encode(text));
      };

      const parse = line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      };
      let cut;
      let filling = null;

      // the hole is filled from the mask while the cut itself is being stored
      const fillHole = async mask => {
        if(!filler) return null;

        try {
          filler.stdin.write(mask + '\n');
          filler.stdin.end();
          await filler.exited;

          return existsSync(rest) && !closed ? await storeFile(session, rest, basename(rest), { displayMax: 2048 }).catch(() => null) : null;
        } catch(e) {
          log('exec', `-> ${PYTHON} inpaint failed: ${e.message}`);

          return null;
        }
      };

      try {
        for await (const line of lines(proc.stdout)) {
          send(line + '\n');

          const event = parse(line);

          if(!action || event?.event !== 'result' || !event.ok || !event.output?.path) continue;

          cut = resolve(out, basename(event.output.path));

          if(FILLS.includes(action)) filling = fillHole(existsSync(resolve(out, 'mask.png')) ? resolve(out, 'mask.png') : cut);
          if(action === 'erase') continue;

          const record = await storeFile(session, cut, 'cut.png', { displayMax: 2048 }).catch(() => null);

          if(record) send(JSON.stringify({ event: 'derived', phase: 'final', role: 'cut', record }) + '\n');
        }

        if(filling) {
          const record = await filling;

          send(JSON.stringify(record ? { event: 'derived', phase: 'final', role: 'rest', record } : { event: 'failed', role: 'rest' }) + '\n');
        }
      } finally {
        // no cut came: the waiting filler reads the end of its stdin and quits
        if(filler && !filling) {
          try {
            filler.stdin.end();
          } catch {}
        }

        rmSync(out, { recursive: true, force: true });

        if(!closed) controller.close();
      }
    },
    cancel() {
      closed = true;
      stop();
    },
  });

  req.signal.addEventListener('abort', stop);

  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'x-accel-buffering': 'no', 'set-cookie': keepCookie(session) } });
}

export const toolAvailable = () => !!Bun.which(TOOL);
