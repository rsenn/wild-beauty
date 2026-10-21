// Run an external tool: argv array (never a shell), minimal environment,
// timeout and an output cap. Resolves { code, stdout, stderr }; code is null
// when the tool was killed or could not be started.
export async function run(argv, { timeout = 30000, maxOutput = 1 << 20, cwd } = {}) {
  let proc;

  try {
    proc = Bun.spawn(argv, { cwd, env: { PATH: process.env.PATH, LANG: 'C', HOME: '/tmp' }, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe', timeout, killSignal: 'SIGKILL' });
  } catch(e) {
    return { code: null, stdout: '', stderr: String(e.message) };
  }

  const read = async stream => (await new Response(stream).text()).slice(0, maxOutput);
  const [stdout, stderr, code] = await Promise.all([read(proc.stdout), read(proc.stderr), proc.exited]);

  // `proc.killed` is true after a normal exit too (Bun 1.4.2); signalCode is not
  return { code: proc.signalCode ? null : code, stdout, stderr };
}
