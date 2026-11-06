// Accounts (docs/SITES.md Phase B): password login with a session cookie. Passwords
// are argon2id hashes (Bun.password), a session token is random and only its
// hash is stored, like the anonymous session (session.js).
import { GUEST_DOMAIN, mergeGuest } from './guests.js';

const COOKIE = 'wb-auth';
const LIFETIME = 30 * 24 * 3600 * 1000;

// failed logins per client in the last quarter of an hour
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 10;
const fails = new Map();

const hash = text => new Bun.CryptoHasher('sha256').update(text).digest('hex');

export const clientOf = req => req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';

const recent = (client, now) => (fails.get(client) ?? []).filter(t => now - t < WINDOW);

// the user row for a mail address, or null
export const userByEmail = (h, email) => h.get('SELECT id, email, name, username, pw_hash, guest FROM users WHERE email = ?', String(email).trim()) ?? null;

// the user row for what is typed into the login: a mail address or a username (no `@` in a username, so which is clear)
export const userByLogin = (h, login) => {
  const text = String(login).trim();

  return text.includes('@') ? userByEmail(h, text) : (h.get('SELECT id, email, name, username, pw_hash, guest FROM users WHERE username = ? COLLATE NOCASE', text) ?? null);
};

// a username: letters, digits, dot, dash and underscore, 2 to 30 characters, starting with a letter or digit
export const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{1,29}$/;

// give the user with this mail address a username (null takes it away) -> true | 'invalid' | 'taken' | 'no_user'
export function setUsername(h, email, username) {
  const user = userByEmail(h, email);

  if(!user) return 'no_user';
  if(username !== null && !USERNAME.test(username)) return 'invalid';
  if(username !== null && h.get('SELECT 1 AS used FROM users WHERE username = ? COLLATE NOCASE AND id <> ?', username, user.id)) return 'taken';

  h.run('UPDATE users SET username = ? WHERE id = ?', username, user.id);

  return true;
}

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

// Set a new password for the user with this address or username; `revoke` also ends all their sessions, so
// whoever knew the old password is out -> true, or false when there is no such user
export async function changePassword(h, email, password, { revoke = true } = {}) {
  const user = userByLogin(h, email);

  if(!user) return false;

  h.run('UPDATE users SET pw_hash = ? WHERE id = ?', await Bun.password.hash(password, 'argon2id'), user.id);

  if(revoke) h.run('DELETE FROM sessions WHERE user_id = ?', user.id);

  return true;
}

// the defaults a user can set (docs/PROFILE.md S2, S3); `prefs` is the stored JSON or null
export const DEFAULT_PREFS = { titlePattern: '{date} [{location}] {pseudonym}', descPattern: '{location}, {date}', visibility: 'hidden' };

export function prefsOf(stored) {
  let given = {};

  try {
    given = typeof stored === 'string' ? JSON.parse(stored) : (stored ?? {});
  } catch {}

  return { ...DEFAULT_PREFS, ...Object.fromEntries(Object.entries(given ?? {}).filter(([k, v]) => k in DEFAULT_PREFS && typeof v === 'string')) };
}

const DAY = 24 * 3600 * 1000;

// the logged-in user of a request, or null. A guest has `guest: true` and no mail address (''); each visit
// renews the 30 days they are kept, at most once a day.
export function viewerOf(h, req, now = Date.now()) {
  const cookie = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('=')).find(([name]) => name === COOKIE)?.[1];

  if(!cookie || !/^[0-9a-f]{64}$/.test(cookie)) return null;

  const row = h.get('SELECT u.id, u.email, u.name, u.username, u.pseudonym, u.prefs, u.is_admin, u.guest, u.last_seen, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?', hash(cookie), now);

  if(!row) return null;

  const { is_admin: admin, prefs, guest, last_seen: seen, created_at: created, ...viewer } = row;
  const out = { ...viewer, prefs: prefsOf(prefs), ...(viewer.email.endsWith(`@${GUEST_DOMAIN}`) && { email: '' }) };

  if(guest) {
    if(now - (seen ?? created) > DAY) {
      h.run('UPDATE users SET last_seen = ? WHERE id = ?', now, row.id);
      h.run('UPDATE sessions SET expires_at = ? WHERE token_hash = ?', now + LIFETIME, hash(cookie));
    }

    return { ...out, email: '', guest: true };
  }

  return admin ? { ...out, admin: true } : out;
}

const setCookie = (req, token, ms) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ms / 1000)}${req.headers.get('x-forwarded-proto') === 'https' ? '; Secure' : ''}`;

// a new session for `userId` -> its Set-Cookie value. A guest's server-side session lasts 30 days from
// their last visit (viewerOf renews it); their cookie lives a year so it is there to be renewed.
export function startSession(h, req, userId, now, { guest = false } = {}) {
  const token = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

  h.run('DELETE FROM sessions WHERE expires_at < ?', now);
  h.run('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', hash(token), userId, now, now + LIFETIME);

  return setCookie(req, token, guest ? 365 * DAY : LIFETIME);
}

// POST /api/login { username, password } -> 204 and the cookie, 401, or 429. `allow(user)` lets a host
// accept only some users (a personal site: its owner); the others are refused like a wrong password.
export async function loginRoute(req, h, now = Date.now(), { allow = () => true } = {}) {
  const client = clientOf(req);

  if(recent(client, now).length >= MAX_FAILS) return Response.json({ error: 'too_many' }, { status: 429 });

  const { username, password, merge } = await req.json().catch(() => ({}));
  const found = typeof username === 'string' && typeof password === 'string' ? userByLogin(h, username) : null;
  const user = found?.guest ? null : found;

  // verify against something even for an unknown name, so the time does not tell
  const ok = await Bun.password.verify(typeof password === 'string' ? password : '', user?.pw_hash ?? DUMMY).catch(() => false);

  if(!user || !ok || !allow(user)) {
    fails.set(client, [...recent(client, now), now]);

    return Response.json({ error: 'invalid' }, { status: 401 });
  }

  fails.delete(client);

  // a guest who logs in to an account can take their works along (docs/GUESTS.md G6)
  const guest = merge === true ? viewerOf(h, req, now) : null;

  if(guest?.guest && guest.id !== user.id) mergeGuest(h, guest.id, user.id);

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
  if(email.trim().toLowerCase().endsWith(`@${GUEST_DOMAIN}`) || userByEmail(h, email)) return Response.json({ error: 'taken' }, { status: 409 });

  // a guest who registers keeps their account and their works: the same row is upgraded (docs/GUESTS.md G6)
  const guest = viewerOf(h, req, now);

  if(guest?.guest) {
    h.run('UPDATE users SET email = ?, name = ?, pw_hash = ?, guest = 0 WHERE id = ?', email.trim(), name.trim(), await Bun.password.hash(password, 'argon2id'), guest.id);
    h.run('UPDATE sessions SET expires_at = ? WHERE user_id = ?', now + LIFETIME, guest.id);
    signups.set(client, [...made, now]);

    return Response.json({ user: { id: guest.id, email: email.trim(), name: name.trim() } }, { status: 201, headers: { 'cache-control': 'no-store' } });
  }

  const { id } = await saveUser(h, { email, name: name.trim(), password, now });

  signups.set(client, [...made, now]);

  return Response.json({ user: { id, email: email.trim(), name: name.trim() } }, { status: 201, headers: { 'set-cookie': startSession(h, req, id, now), 'cache-control': 'no-store' } });
}

// Claiming: the guest turns their account into a normal one with a username and a password; a mail address is
// optional (kept for a password reset). The same row, so the works stay where they are (docs/GUESTS.md G5).
const claims = new Map();

// POST /api/claim { username, password, email? } -> 200 { user }, or 401 not a guest session, 400 invalid_username |
// weak_password | invalid_email, 409 taken | taken_email, 429 too_many
export async function claimRoute(req, h, now = Date.now()) {
  const guest = viewerOf(h, req, now);

  if(!guest?.guest) return Response.json({ error: 'not_guest' }, { status: 401 });

  const client = clientOf(req);
  const recentClaims = (claims.get(client) ?? []).filter(t => now - t < SIGNUP_WINDOW);

  if(recentClaims.length >= SIGNUPS) return Response.json({ error: 'too_many' }, { status: 429 });

  const { username, password, email = '' } = await req.json().catch(() => ({}));

  if(typeof username !== 'string' || !USERNAME.test(username)) return Response.json({ error: 'invalid_username' }, { status: 400 });
  if(typeof password !== 'string' || password.length < 6 || password.length > 200) return Response.json({ error: 'weak_password' }, { status: 400 });
  if(typeof email !== 'string' || (email.trim() && (email.length > 254 || !MAIL.test(email.trim()) || email.trim().toLowerCase().endsWith(`@${GUEST_DOMAIN}`)))) return Response.json({ error: 'invalid_email' }, { status: 400 });
  if(h.get('SELECT 1 AS used FROM users WHERE username = ? COLLATE NOCASE', username)) return Response.json({ error: 'taken' }, { status: 409 });
  if(email.trim() && userByEmail(h, email)) return Response.json({ error: 'taken_email' }, { status: 409 });

  const pw_hash = await Bun.password.hash(password, 'argon2id');

  // the placeholder address stays when no mail address was given
  h.run(`UPDATE users SET username = ?, pw_hash = ?, guest = 0${email.trim() ? ', email = ?' : ''} WHERE id = ?`, ...[username, pw_hash, ...(email.trim() ? [email.trim()] : []), guest.id]);
  h.run('UPDATE sessions SET expires_at = ? WHERE user_id = ?', now + LIFETIME, guest.id);
  claims.set(client, [...recentClaims, now]);

  return Response.json({ user: { id: guest.id, username, email: email.trim() } }, { headers: { 'cache-control': 'no-store' } });
}

// POST /api/logout -> 204, the session is gone
export function logoutRoute(req, h) {
  const cookie = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('=')).find(([name]) => name === COOKIE)?.[1];

  if(cookie) h.run('DELETE FROM sessions WHERE token_hash = ?', hash(cookie));

  return new Response(null, { status: 204, headers: { 'set-cookie': setCookie(req, '', 0) } });
}

// GET /api/me -> { user: { id, email, name } | null }
// A guest also gets `works` (how many nodes they hold) and `until` (ms, when they would be removed).
export function meRoute(req, h) {
  const viewer = viewerOf(h, req);
  const user = viewer?.guest ? { ...viewer, works: h.get('SELECT COUNT(*) AS n FROM nodes WHERE owner_id = ?', viewer.id).n, until: (h.get('SELECT last_seen, created_at FROM users WHERE id = ?', viewer.id).last_seen ?? 0) + LIFETIME } : viewer;

  return Response.json({ user }, { headers: { 'cache-control': 'no-store' } });
}

// a valid hash of nothing, for the constant-time path above
const DUMMY = await Bun.password.hash('-', 'argon2id');
