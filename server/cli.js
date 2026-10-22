// Command line of server.js: options, --help, and the restart keys. Imported
// first, so --help and bad options end the process before anything else loads.
const USAGE = `usage: bun server.js [options]

  -p, --port <n>    port to listen on (default 3000, env PORT)
  -H, --host <name> address to bind (default all interfaces, env HOST)
      --dev         log every request and response (env WB_DEV=1)
      --no-keys     no restart keys, even on a terminal
  -h, --help        this text

On a terminal: Ctrl+R (or "rs" + Enter) restarts the server, Ctrl+C quits.
`;

const OPTIONS = { '-p': '--port', '-H': '--host', '-h': '--help' };

// argv (without bun and the script) -> { port, host, dev, keys, help } or throws
export function parse(argv, env = {}) {
  const out = { port: Number(env.PORT ?? 3000), host: env.HOST || undefined, dev: false, keys: true, help: false };

  for(let i = 0; i < argv.length; i++) {
    let [name, value] = argv[i].startsWith('--') ? argv[i].split(/=(.*)/s) : [argv[i]];

    name = OPTIONS[name] ?? name;

    const take = () => value ?? argv[++i] ?? (() => { throw new Error(`${name} needs a value`); })();

    switch(name) {
      case '--port':
        out.port = Number(take());
        break;
      case '--host':
        out.host = take();
        break;
      case '--dev':
        out.dev = true;
        break;
      case '--no-keys':
        out.keys = false;
        break;
      case '--help':
        out.help = true;
        break;
      default:
        throw new Error(`unknown option ${argv[i]}`);
    }
  }

  if(!Number.isInteger(out.port) || out.port < 0 || out.port > 65535) throw new Error('--port must be 0-65535');

  return out;
}

let options;

try {
  options = parse(process.argv.slice(2), process.env);
} catch(e) {
  console.error(`${e.message}\n\n${USAGE}`);
  process.exit(2);
}

if(options.help) {
  console.log(USAGE);
  process.exit(0);
}

export const { port, host } = options;

// On a terminal this process becomes a small supervisor: the server runs as a
// child, Ctrl+R / "rs" + Enter restart it (like nodemon), Ctrl+C quits. The
// child (WB_CHILD set), a pipe and the tests never take this path.
if(process.stdin.isTTY && options.keys && !process.env.WB_CHILD) {
  const start = () => Bun.spawn([process.execPath, ...process.argv.slice(1)], { env: { ...process.env, WB_CHILD: '1' }, stdin: 'ignore', stdout: 'inherit', stderr: 'inherit' });
  let child = start();
  let line = '';
  let busy = false;

  const stop = async () => {
    child.kill();
    await child.exited;
  };
  const restart = async () => {
    if(busy) return;

    busy = true;
    console.log('[wild-beauty] restarting');
    await stop();
    child = start();
    busy = false;
  };

  process.stdin.setRawMode(true);
  process.stdin.on('data', async data => {
    for(const ch of data.toString()) {
      if(ch === '\x03' || ch === '\x04') {
        await stop();
        process.stdin.setRawMode(false);
        process.exit(0);
      }

      if(ch === '\x12') {
        line = '';
        restart();
      } else if(ch === '\r' || ch === '\n') {
        if(line === 'rs') restart();

        line = '';
      } else {
        line += ch;
      }
    }
  });

  console.log('[wild-beauty] Ctrl+R restarts, Ctrl+C quits');
  await new Promise(() => {});
}
