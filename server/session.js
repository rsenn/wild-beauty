// The anonymous session (EDITOR.md S3.5): a random token in the `wb-session`
// cookie so locks work before accounts exist. The token is a credential, so
// the database and every response only ever see its hash, the `holder`.
const COOKIE = 'wb-session';
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const hash = text => new Bun.CryptoHasher('sha256').update(text).digest('hex');

// -> { token, holder, fresh }: the session of the request, a new one (fresh)
// when the cookie is missing or malformed
export function sessionFor(req) {
  const cookie = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('='));
  const given = cookie.find(([name]) => name === COOKIE)?.[1];
  const token = given && TOKEN.test(given) ? given : crypto.randomUUID();

  return { token, holder: hash(token), fresh: token !== given };
}

// the Set-Cookie value that stores the token
export const sessionCookie = token => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;

// what is safe to show other people: the start of the hash
export const holderLabel = holder => holder.slice(0, 8);
