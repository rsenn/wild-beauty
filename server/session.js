// The anonymous session (EDITOR.md S3.5): a random token in the `wb-session`
// cookie so locks work before accounts exist. The token is a credential, so
// the database and every response only ever see its hash, the `holder`.
const COOKIE = 'wb-session';
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// A browser tab names itself in `x-wb-tab`, so two tabs of one browser hold locks
// as two holders (the cookie is shared by all of a browser's tabs).
const TAB = /^[0-9a-f]{16}$/;

const hash = text => new Bun.CryptoHasher('sha256').update(text).digest('hex');

// -> { token, holder, fresh }: the session of the request, a new one (fresh)
// when the cookie is missing or malformed
export function sessionFor(req) {
  const cookie = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('='));
  const given = cookie.find(([name]) => name === COOKIE)?.[1];
  const token = given && TOKEN.test(given) ? given : crypto.randomUUID();

  const tab = req.headers.get('x-wb-tab');

  // `owner` is per browser, not per tab: what a browser uploaded is shown to all its tabs
  return { token, holder: hash(tab && TAB.test(tab) ? `${token}:${tab}` : token), owner: hash(`owner:${token}`), fresh: token !== given };
}

// the Set-Cookie value that stores the token
export const sessionCookie = token => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;

// the same cookie with a lifetime of `ms`: uploads are kept that long, and the
// browser forgets who it is at the same moment
export const expiringCookie = (token, ms) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ms / 1000)}; Expires=${new Date(Date.now() + ms).toUTCString()}`;

// what is safe to show other people: the start of the hash
export const holderLabel = holder => holder.slice(0, 8);
