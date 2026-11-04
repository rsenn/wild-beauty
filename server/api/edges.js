// GET /api/edges/<photo hash>: the edge map the magnetic lasso follows (docs/WAND.md 0). `opencv-imgproc
// edgemap` does the work - CLAHE on the lightness, an edge-aware smoothing, Sobel and Canny fused,
// optionally a deep detector - and answers with an 8-bit PNG, 255 on the strongest edge, with the
// long side `size` px. The tool caches by photo and flags itself (`--cache-dir`), so the second ask
// for a photo costs a copy. The editor falls back to its own Sobel when this answers anything but 200
// (no tool installed, too slow), so the lasso never waits for it for good.
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { HASH, config } from '../config.js';
import { log, logCommand } from '../log.js';
import { lines } from '../media/lines.js';
import { photoFile } from './segment.js';

const tool = () => process.env.WB_IMGPROC ?? 'opencv-imgproc';
const MIN_SIZE = 128;
const MAX_SIZE = 1024;
const TIMEOUT_MS = 30000;

const fail = (status, code, message) => Response.json({ error: { code, message } }, { status });

// the arguments of the tool: the photo, the PNG to write, the size, the cache
export const edgeArgs = ({ file, out, size = 640, cache, models }) => ['edgemap', '--in', file, '--out', out, '--size', String(Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(size) || 640))), '--cache-dir', cache, ...(models ? ['--models-dir', models] : [])];

export async function edgesRoute(req, hash) {
  if(!HASH.test(hash)) return fail(400, 'bad-request', 'bad photo');

  const file = photoFile(hash);

  if(!file) return fail(404, 'no-photo', 'photo not found');

  const size = Number(new URL(req.url).searchParams.get('size')) || 640;
  const cache = resolve(config.tmpDir, 'edge-cache');
  const out = resolve(config.tmpDir, `edges-${crypto.randomUUID()}`);

  mkdirSync(cache, { recursive: true });
  mkdirSync(out, { recursive: true });

  const argv = [tool(), ...edgeArgs({ file, out: resolve(out, 'edges.png'), size, cache, models: process.env.WB_MODELS_DIR })];
  let proc;

  try {
    logCommand(argv);
    proc = Bun.spawn(argv, { env: { PATH: process.env.PATH, LANG: 'C', HOME: process.env.HOME ?? '/tmp', ...(process.env.WB_MODELS_DIR && { WB_MODELS_DIR: process.env.WB_MODELS_DIR }) }, stdin: 'ignore', stdout: 'pipe', stderr: 'ignore', killSignal: 'SIGKILL' });
  } catch(e) {
    rmSync(out, { recursive: true, force: true });
    log('exec', `-> ${argv[0]} failed to start: ${e.message}`);

    return fail(503, 'no-tool', 'edge detection is not available');
  }

  // a stuck tool must not hold the request (or a process) for ever
  const timer = setTimeout(() => proc.kill(), TIMEOUT_MS);

  req.signal.addEventListener('abort', () => proc.kill());

  try {
    let result = null;

    for await (const line of lines(proc.stdout)) {
      try {
        const event = JSON.parse(line);

        if(event?.event === 'result') result = event;
      } catch {}
    }

    await proc.exited;

    if(!result?.ok || !result.output?.path) return fail(502, 'tool-failed', 'edge detection failed');

    const png = Bun.file(resolve(out, 'edges.png'));

    if(!(await png.exists())) return fail(502, 'tool-failed', 'edge detection failed');

    const body = await png.arrayBuffer();

    // which detector really ran (a deep one falls back to none when its model is missing) travels along
    return new Response(body, { headers: { 'content-type': 'image/png', 'cache-control': 'private, max-age=3600', 'x-edge-detector': String(result.detector ?? 'none'), 'x-edge-cached': String(!!result.cached) } });
  } finally {
    clearTimeout(timer);
    rmSync(out, { recursive: true, force: true });
  }
}
