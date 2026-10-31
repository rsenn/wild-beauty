// Give nodes that nobody owns to a user (SITES.md S13): the open public area
// becomes theirs, so only they change it from then on.
//
//   bun tools/adopt.js <email> <id> [id...]     those nodes
//   bun tools/adopt.js <email> --all            every node without an owner and without a space
//
// Adopted nodes keep their visibility (public stays public).
import { open } from '../server/db/db.js';
import { userByEmail } from '../server/auth.js';

const [email, ...rest] = process.argv.slice(2);

if(!email || !rest.length) {
  console.error('usage: bun tools/adopt.js <email> <id...> | --all');
  process.exit(1);
}

const h = await open();
const user = userByEmail(h, email);

if(!user) {
  console.error(`no user ${email}`);
  process.exit(1);
}

const ids = rest.includes('--all') ? h.all('SELECT id FROM nodes WHERE owner_id IS NULL AND space IS NULL').map(r => r.id) : rest.map(Number).filter(Number.isSafeInteger);
const changed = ids.reduce((n, id) => n + h.run('UPDATE nodes SET owner_id = ? WHERE id = ? AND owner_id IS NULL', user.id, id).changes, 0);

console.log(`${changed} of ${ids.length} nodes now belong to ${user.email}`);
h.close();
