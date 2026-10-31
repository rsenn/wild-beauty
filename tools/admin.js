// Give or take the admin panel of a user (server/admin.js):
//
//   bun tools/admin.js grant <email or username>
//   bun tools/admin.js revoke <email or username>
//   bun tools/admin.js list
import { open } from '../server/db/db.js';
import { userByLogin } from '../server/auth.js';

const [command, login] = process.argv.slice(2);
const h = await open();

if(command === 'list') {
  for(const u of h.all('SELECT id, email, username FROM users WHERE is_admin = 1 ORDER BY id')) console.log(`${u.id}  ${u.email}${u.username ? `  (${u.username})` : ''}`);
} else if((command === 'grant' || command === 'revoke') && login) {
  const user = userByLogin(h, login);

  if(!user) {
    console.error(`no user ${login}`);
    process.exit(1);
  }

  h.run('UPDATE users SET is_admin = ? WHERE id = ?', command === 'grant' ? 1 : 0, user.id);
  console.log(`${user.email}: admin ${command === 'grant' ? 'on' : 'off'}`);
} else {
  console.error('usage: bun tools/admin.js grant|revoke <email or username> | list');
  process.exit(1);
}
