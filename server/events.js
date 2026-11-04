// Usage recording (docs/UX-REQUIREMENTS.md, testing): the client posts batches of
// small events (what was tapped, errors, upload timings, never photo content
// or text); each is stored with who sent it as a line of
// data/events/<date>.jsonl. Who: `claude` (the cookie wb-who=claude, set in the
// automated browser), `owner` (an IP of WB_OWNER_IPS: localhost, the LAN
// addresses and the public address of the owner's devices), else `tester-<id>`.
import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { viewerOf } from './auth.js';
import { config } from './config.js';
import { database } from './db/db.js';
import { sessionCookie, sessionFor } from './session.js';

const dir = resolve(config.dataDir, 'events');
const OWNER_IPS = new Set((process.env.WB_OWNER_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean));
// gestures carry sampled paths, so batches are larger; a day's file is capped
const MAX_BODY = 256 * 1024;
const MAX_EVENTS = 400;
const MAX_FILE = 100 * 1024 * 1024;

// the server object of Bun.serve, for the peer address when no proxy header is there
export const peer = { server: null };

const cookieOf = (req, name) => (req.headers.get('cookie') ?? '').split(';').map(c => c.trim().split('=')).find(([k]) => k === name)?.[1];

// the client address: nginx sends it in x-forwarded-for (first entry), a direct connection has the peer
export function addressOf(req) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0].trim();

  return (forwarded || req.headers.get('x-real-ip') || peer.server?.requestIP(req)?.address || '').replace(/^::ffff:/, '');
}

// -> 'claude' | 'owner' | 'tester-<id>'
export function whoIs(req, session) {
  const address = addressOf(req);

  if(cookieOf(req, 'wb-who') === 'claude') return 'claude';
  if(OWNER_IPS.has(address)) return 'owner';

  return `tester-${session.owner.slice(0, 4)}`;
}

// the logged-in user of a request, as it is logged: the mail address, else nothing
const userOf = async req => viewerOf(await database(), req)?.email;

// POST /api/events: { events: [{ t, type, ...data }] }
export async function recordEvents(req) {
  const session = sessionFor(req);
  const headers = session.fresh ? { 'set-cookie': sessionCookie(session.token) } : {};
  let body;

  try {
    const text = await req.text();

    if(text.length > MAX_BODY) return new Response(null, { status: 413, headers });

    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }

  const events = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS) : [];
  const who = whoIs(req, session);
  const ctx = { who, sid: session.owner.slice(0, 8), ip: addressOf(req), user: await userOf(req), ua: (req.headers.get('user-agent') ?? '').slice(0, 200) };
  const lines = events.filter(e => e && typeof e.type === 'string').map(e => JSON.stringify({ ts: Date.now(), ...ctx, ...e }) + '\n');

  const file = resolve(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);

  if(lines.length) {
    mkdirSync(dir, { recursive: true });

    if(!existsSync(file) || statSync(file).size < MAX_FILE) appendFileSync(file, lines.join(''));
  }

  return new Response(null, { status: 204, headers });
}

// Session replay (rrweb, vendor/rrweb): the page is recorded as a DOM snapshot, the changes to it, the pointer,
// scrolling and resizing; typed text is masked on the client. POST /api/replay { events: [rrweb events] }
// is appended to data/replay/<date>.jsonl, one line per batch with who sent it (the tools/replay.js inspector
// groups the lines by session).
const REPLAY_BODY = 2 * 1024 * 1024;
const REPLAY_FILE = 400 * 1024 * 1024;

export async function recordReplay(req, { dataDir = config.dataDir } = {}) {
  const session = sessionFor(req);
  const headers = session.fresh ? { 'set-cookie': sessionCookie(session.token) } : {};
  let body;

  try {
    const text = await req.text();

    if(text.length > REPLAY_BODY) return new Response(null, { status: 413, headers });

    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }

  const events = Array.isArray(body?.events) ? body.events.filter(e => e && Number.isInteger(e.type) && Number.isFinite(e.timestamp)) : [];

  if(!events.length) return new Response(null, { status: 204, headers });

  const rid = typeof body.rid === 'string' ? body.rid.replace(/[^a-z0-9]/gi, '').slice(0, 16) : '';
  const line = { ts: Date.now(), who: whoIs(req, session), sid: session.owner.slice(0, 8), rid, ip: addressOf(req), ua: (req.headers.get('user-agent') ?? '').slice(0, 200), user: await userOf(req), url: typeof body.url === 'string' ? body.url.slice(0, 200) : undefined, events };
  const out = resolve(dataDir, 'replay');
  const file = resolve(out, `${new Date().toISOString().slice(0, 10)}.jsonl`);

  mkdirSync(out, { recursive: true });

  if(!existsSync(file) || statSync(file).size < REPLAY_FILE) appendFileSync(file, JSON.stringify(line) + '\n');

  return new Response(null, { status: 204, headers });
}

// The recordings are kept 30 days at most (the promise on the tick box of /new): the day files older than that go
export const REPLAY_DAYS = 30;

export function purgeReplay({ dataDir = config.dataDir, now = Date.now(), days = REPLAY_DAYS } = {}) {
  const dir = resolve(dataDir, 'replay');

  if(!existsSync(dir)) return [];

  const oldest = new Date(now - days * 86400000).toISOString().slice(0, 10);
  const gone = readdirSync(dir).filter(f => /^\d{4}-\d\d-\d\d\.jsonl$/.test(f) && f.slice(0, 10) < oldest);

  for(const f of gone) rmSync(resolve(dir, f));

  return gone;
}
