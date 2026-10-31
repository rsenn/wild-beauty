// Give a user a username to log in with besides the mail address (SITES.md S13):
//
//   bun tools/username.js <email> <username>      set it
//   bun tools/username.js <email> --none           take it away
//
// A username has 2 to 30 letters, digits, dots, dashes or underscores and no `@`;
// it is unique, whatever the case.
import { open } from '../server/db/db.js';
import { setUsername } from '../server/auth.js';

const [email, name] = process.argv.slice(2);

if(!email || !name) {
  console.error('usage: bun tools/username.js <email> <username> | --none');
  process.exit(1);
}

const h = await open();
const result = setUsername(h, email, name === '--none' ? null : name);

h.close();

if(result !== true) {
  console.error({ invalid: 'a username has 2 to 30 letters, digits, . - _', taken: 'that username is taken', no_user: `no user ${email}` }[result]);
  process.exit(1);
}

console.log(name === '--none' ? `${email} has no username now` : `${email} logs in as ${name} too`);
