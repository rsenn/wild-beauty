// POST /api/cutout: remove the background of a photo (EDITOR.md E127). Runs
// `opencv-imgproc cutout` in two phases and streams NDJSON: `progress` lines of
// the tool, then a `derived` line per phase (the cut stored as a new upload of
// the caller, as a client sees an upload record), then `done`. Closing the
// request kills the tool.
import { mkdirSync, rmSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { HASH, config } from '../config.js';
import { log, logCommand } from '../log.js';
import { sessionFor } from '../session.js';
import { peer } from '../events.js';
import { keepCookie, storeFile } from './uploads.js';
import { lines } from '../media/lines.js';
import { photoFile } from './segment.js';

const TOOL = process.env.WB_IMGPROC ?? 'opencv-imgproc';
const MODELS = process.env.WB_MODELS_DIR;
const VIEW_SIZE = 1024;

const fail = (status, code, message) => Response.json({ error: { code, message } }, { status });

export const cutoutArgs = ({ file, out }) => {
  const args = ['cutout', '--in', file, '--out', resolve(out, 'cut.png'), '--view-size', String(VIEW_SIZE), '--phases', 'preview,final', '--refine', 'guided', '--subjects', 'all', '--progress'];

  if(MODELS) args.push('--models-dir', MODELS);

  return args;
};

export async function cutoutRoute(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return fail(400, 'bad-json', 'bad request body');
  }

  if(typeof body?.photo !== 'string' || !HASH.test(body.photo)) return fail(400, 'bad-request', 'photo needed');

  const file = photoFile(body.photo);

  if(!file) return fail(404, 'no-photo', 'photo not found');

  const session = sessionFor(req);
  const out = resolve(config.tmpDir, `cutout-${crypto.randomUUID()}`);

  mkdirSync(out, { recursive: true });

  const argv = [TOOL, ...cutoutArgs({ file, out })];

  logCommand(argv);

  let proc;

  try {
    proc = Bun.spawn(argv, { env: { PATH: process.env.PATH, LANG: 'C', HOME: process.env.HOME ?? '/tmp', ...(MODELS && { WB_MODELS_DIR: MODELS }) }, stdin: 'ignore', stdout: 'pipe', stderr: 'ignore', killSignal: 'SIGKILL' });
  } catch(e) {
    rmSync(out, { recursive: true, force: true });
    log('exec', `-> ${TOOL} failed to start: ${e.message}`);

    return fail(503, 'no-tool', 'background removal is not available');
  }

  // the two passes may be more than the idle timeout apart
  peer.server?.timeout(req, 0);

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = object => {
        if(!closed) controller.enqueue(encoder.encode(JSON.stringify(object) + '\n'));
      };

      try {
        for await (const line of lines(proc.stdout)) {
          let event;

          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if(event.event === 'progress') send({ event: 'progress', phase: event.phase, percent: event.percent });
          else if(event.event === 'result' && event.ok) {
            const path = event.output?.path && resolve(out, basename(event.output.path));
            const record = path && (await storeFile(session, path, 'cutout.png').catch(() => null));

            if(record) send({ event: 'derived', phase: event.phase ?? 'final', record });
          } else if(event.event === 'result') send({ event: 'error', code: event.error?.code ?? 'failed' });
        }

        send({ event: 'done' });
      } finally {
        rmSync(out, { recursive: true, force: true });

        if(!closed) controller.close();
      }
    },
    cancel() {
      closed = true;
      proc.kill();
    },
  });

  req.signal.addEventListener('abort', () => proc.kill());

  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'set-cookie': keepCookie(session) } });
}
