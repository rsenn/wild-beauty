// Accounts (SITES.md Phase B): password login with a session cookie. Passwords
// are argon2id hashes (Bun.password), a session token is random and only its
// hash is stored, like the anonymous session (session.js).
const COOKIE = 'wb-auth';
const LIFETIME = 30 * 24 * 3600 * 1000;

// failed logins per client in the last quarter of an hour
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 10;
const fails = new Map();

const hash = text => new Bun.CryptoHasher('sha256').update(text).digest('hex');

const clientOf = req => req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';

const recent = (client, now) => (fails.get(client) ?? []).filter(t => now - t < WINDOW);

// the user row for a mail address, or null
export const userByEmail = (h, email) => h.get('SELECT id, email, name, pw_hash FROM users WHERE email = ?', String(email).trim()) ?? null;

// add a user, or change the password and name of the one with this address -> { id }
export async function saveUser(h, { email, name = '', password, now = Date.now() }) {
  const pw_hash = await Bun.password.hash(password, 'argon2id');
  const known = userByEmail(h, email);

  if(known) {
    h.run('UPDATE users SET pw_hash = ?, name = ? WHERE id = ?', pw_hash, name, known.id);

    return { id: known.id };
  }

  return { id: Number(h.run('INSERT INTO users (email, name, pw_hash, created_at) VALUES (?, ?, ?, ?)', email.trim(), name, pw_hash, now).lastInsertRowid) };
}

// the logged-in user of a request, or null
export function viewerOf(h, req, now = Date.now()) {
  const cookie = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('=')).find(([name]) => name === COOKIE)?.[1];

  if(!cookie || !/^[0-9a-f]{64}$/.test(cookie)) return null;

  return h.get('SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?', hash(cookie), now) ?? null;
}

const setCookie = (req, token, ms) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ms / 1000)}${req.headers.get('x-forwarded-proto') === 'https' ? '; Secure' : ''}`;

// a new session for `userId` -> its Set-Cookie value
function startSession(h, req, userId, now) {
  const token = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

  h.run('DELETE FROM sessions WHERE expires_at < ?', now);
  h.run('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', hash(token), userId, now, now + LIFETIME);

  return setCookie(req, token, LIFETIME);
}

// POST /api/login { username, password } -> 204 and the cookie, 401, or 429
export async function loginRoute(req, h, now = Date.now()) {
  const client = clientOf(req);

  if(recent(client, now).length >= MAX_FAILS) return Response.json({ error: 'too_many' }, { status: 429 });

  const { username, password } = await req.json().catch(() => ({}));
  const user = typeof username === 'string' && typeof password === 'string' ? userByEmail(h, username) : null;

  // verify against something even for an unknown name, so the time does not tell
  const ok = await Bun.password.verify(typeof password === 'string' ? password : '', user?.pw_hash ?? DUMMY).catch(() => false);

  if(!user || !ok) {
    fails.set(client, [...recent(client, now), now]);

    return Response.json({ error: 'invalid' }, { status: 401 });
  }

  fails.delete(client);

  return new Response(null, { status: 204, headers: { 'set-cookie': startSession(h, req, user.id, now), 'cache-control': 'no-store' } });
}

// Registration, as small as it gets: a mail address (kept for a password reset,
// not verified) and a password of 6 characters or more; no activation mail. The
// new user is logged in at once. A client makes at most 5 accounts an hour;
// WB_REGISTRATION=closed switches it off.
const MAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const SIGNUPS = 5;
const SIGNUP_WINDOW = 60 * 60 * 1000;
const signups = new Map();

// POST /api/register { email, password, name? } -> 201 { user } and the cookie, or
// 400 invalid_email | weak_password, 403 closed, 409 taken, 429 too_many
export async function registerRoute(req, h, now = Date.now()) {
  if(process.env.WB_REGISTRATION === 'closed') return Response.json({ error: 'closed' }, { status: 403 });

  const client = clientOf(req);
  const made = (signups.get(client) ?? []).filter(t => now - t < SIGNUP_WINDOW);

  if(made.length >= SIGNUPS) return Response.json({ error: 'too_many' }, { status: 429 });

  const { email, password, name = '' } = await req.json().catch(() => ({}));

  if(typeof email !== 'string' || email.length > 254 || !MAIL.test(email.trim())) return Response.json({ error: 'invalid_email' }, { status: 400 });
  if(typeof password !== 'string' || password.length < 6 || password.length > 200) return Response.json({ error: 'weak_password' }, { status: 400 });
  if(typeof name !== 'string' || name.length > 80) return Response.json({ error: 'invalid_name' }, { status: 400 });
  if(userByEmail(h, email)) return Response.json({ error: 'taken' }, { status: 409 });

  const { id } = await saveUser(h, { email, name: name.trim(), password, now });

  signups.set(client, [...made, now]);

  return Response.json({ user: { id, email: email.trim(), name: name.trim() } }, { status: 201, headers: { 'set-cookie': startSession(h, req, id, now), 'cache-control': 'no-store' } });
}

// POST /api/logout -> 204, the session is gone
export function logoutRoute(req, h) {
  const cookie = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('=')).find(([name]) => name === COOKIE)?.[1];

  if(cookie) h.run('DELETE FROM sessions WHERE token_hash = ?', hash(cookie));

  return new Response(null, { status: 204, headers: { 'set-cookie': setCookie(req, '', 0) } });
}

// GET /api/me -> { user: { id, email, name } | null }
export const meRoute = (req, h) => Response.json({ user: viewerOf(h, req) }, { headers: { 'cache-control': 'no-store' } });

// a valid hash of nothing, for the constant-time path above
const DUMMY = await Bun.password.hash('-', 'argon2id');
