// Change the password of a user (SITES.md S13):
//
//   bun tools/passwd.js <email or username> [--keep-sessions]
//
// The new password is asked for twice without echo; for a script it may come from the
// environment instead (PASSWD=... bun tools/passwd.js <email>). All sessions of the user
// end with the change, so a stolen or forgotten login is gone too, unless --keep-sessions.
// The user must exist; registration makes users, tools/janos-seed.js the site's one.
import { open } from '../server/db/db.js';
import { changePassword } from '../server/auth.js';

const MIN = 6;

const [email, ...flags] = process.argv.slice(2).filter(a => !a.startsWith('--') || a === '--keep-sessions' || a === '--help');
const keep = flags.includes('--keep-sessions');

if(!email || email === '--help' || flags.includes('--help')) {
  console.error('usage: bun tools/passwd.js <email> [--keep-sessions]\n       (PASSWD=... for a script)');
  process.exit(email ? 0 : 1);
}

// a line from the terminal without echo
function ask(prompt) {
  return new Promise((resolve, reject) => {
    const { stdin, stderr } = process;

    if(!stdin.isTTY) return reject(new Error('no terminal: set PASSWD in the environment'));

    stderr.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let line = '';
    const done = value => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', on);
      stderr.write('\n');
      value === null ? reject(new Error('cancelled')) : resolve(value);
    };
    const on = chunk => {
      for(const c of chunk) {
        if(c === '\r' || c === '\n') return done(line);
        if(c === '\u0003') return done(null); // Ctrl+C
        if(c === '\u007f' || c === '\b') line = line.slice(0, -1);
        else if(c >= ' ') line += c;
      }
    };

    stdin.on('data', on);
  });
}

try {
  const password = process.env.PASSWD ?? (await ask(`new password for ${email}: `));

  if(password.length < MIN) throw new Error(`at least ${MIN} characters`);
  if(process.env.PASSWD === undefined && password !== (await ask('again: '))) throw new Error('the two passwords differ');

  const h = await open();
  const done = await changePassword(h, email, password, { revoke: !keep });

  h.close();

  if(!done) throw new Error(`no user ${email}`);

  console.log(`password of ${email} changed${keep ? '' : ', all their sessions ended'}`);
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
