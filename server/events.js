// Usage recording (UX-REQUIREMENTS.md, testing): the client posts batches of
// small events (what was tapped, errors, upload timings, never photo content
// or text); each is stored with who sent it as a line of
// data/events/<date>.jsonl. Who: `claude` (the cookie wb-who=claude, set in the
// automated browser), `owner` (an IP of WB_OWNER_IPS: localhost, the LAN
// addresses and the public address of the owner's devices), else `tester-<id>`.
import { appendFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';
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
  const ctx = { who, sid: session.owner.slice(0, 8), ip: addressOf(req), ua: (req.headers.get('user-agent') ?? '').slice(0, 200) };
  const lines = events.filter(e => e && typeof e.type === 'string').map(e => JSON.stringify({ ts: Date.now(), ...ctx, ...e }) + '\n');

  const file = resolve(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`);

  if(lines.length) {
    mkdirSync(dir, { recursive: true });

    if(!existsSync(file) || statSync(file).size < MAX_FILE) appendFileSync(file, lines.join(''));
  }

  return new Response(null, { status: 204, headers });
}
