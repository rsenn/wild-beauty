// first line of a tool's stderr for an `errors` entry, with directory
// prefixes of any absolute path removed (`/srv/wb/uploads/x.png` -> `x.png`)
export const firstLine = text => text.trim().split('\n')[0].replace(/\/(?:[^\s`'"\/]+\/)+/g, '') || 'failed';

import { log, logCommand } from '../log.js';

// Run an external tool: argv array (never a shell), minimal environment,
// timeout and an output cap. Resolves { code, stdout, stderr }; code is null
// when the tool was killed or could not be started.
export async function run(argv, { timeout = 30000, maxOutput = 1 << 20, cwd, env = {} } = {}) {
  let proc;

  logCommand(argv);

  const started = performance.now();

  try {
    proc = Bun.spawn(argv, { cwd, env: { PATH: process.env.PATH, LANG: 'C', HOME: '/tmp', ...env }, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe', timeout, killSignal: 'SIGKILL' });
  } catch(e) {
    log('exec', `-> ${argv[0]} failed to start: ${e.message}`);

    return { code: null, stdout: '', stderr: String(e.message) };
  }

  const read = async stream => (await new Response(stream).text()).slice(0, maxOutput);
  const [stdout, stderr, code] = await Promise.all([read(proc.stdout), read(proc.stderr), proc.exited]);

  // `proc.killed` is true after a normal exit too (Bun 1.4.2); signalCode is not
  const result = { code: proc.signalCode ? null : code, stdout, stderr };

  log('exec', `-> ${argv[0]} exit ${result.code ?? proc.signalCode} in ${Math.round(performance.now() - started)} ms`);

  return result;
}
