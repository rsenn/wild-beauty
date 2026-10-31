// The admin panel's data (client/components/AdminPage.js): counts for the summary, the user accounts, and the
// sessions of the usage logs with their recordings. Only a user with the admin flag (tools/admin.js) gets any of
// it; everybody else gets a plain 404, as if the routes did not exist.
import { existsSync, openSync, readSync, closeSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';
import { viewerOf } from './auth.js';
import { eventsOf, filterSessions, groupSessions, playerPage, readLog, sessionsOf } from './replaylog.js';

const ACTIVE_MS = 15 * 60 * 1000; // a browser that sent an event this recently is "active"
const TAIL = 4 * 1024 * 1024; // the part of today's log read to find who is active
const LIST_MAX = 500;

export const isAdmin = viewer => !!viewer?.admin;

const count = (h, sql, ...args) => h.get(sql, ...args).n;
const sizeOf = file => (existsSync(file) ? statSync(file).size : 0);

// the files of a log directory -> { files, bytes, oldest, newest }
function logStats(dir) {
  const files = existsSync(dir) ? readdirSync(dir).filter(f => /^\d{4}-\d\d-\d\d\.jsonl$/.test(f)).sort() : [];

  return { files: files.length, bytes: files.reduce((sum, f) => sum + sizeOf(resolve(dir, f)), 0), oldest: files[0]?.slice(0, 10) ?? null, newest: files.at(-1)?.slice(0, 10) ?? null };
}

// the last lines of a file (a partial first line is dropped), parsed; what happened lately
function tailLines(file, bytes = TAIL) {
  if(!existsSync(file)) return [];

  const size = statSync(file).size;
  const start = Math.max(0, size - bytes);
  const buffer = Buffer.alloc(size - start);
  const fd = openSync(file, 'r');

  try {
    readSync(fd, buffer, 0, buffer.length, start);
  } finally {
    closeSync(fd);
  }

  const lines = buffer.toString('utf8').split('\n');

  if(start > 0) lines.shift();

  return lines.flatMap(l => {
    try {
      return l ? [JSON.parse(l)] : [];
    } catch {
      return [];
    }
  });
}

// -> { groups: [{ title, items: [[label, value]] }] }
export function summary(h, { dataDir = config.dataDir, now = Date.now() } = {}) {
  const day = new Date(now).toISOString().slice(0, 10);
  const recent = tailLines(resolve(dataDir, 'events', `${day}.jsonl`)).filter(e => e.ts >= now - ACTIVE_MS);
  const browsers = new Map(recent.map(e => [e.sid, e]));
  const kinds = h.all('SELECT kind, COUNT(*) AS n FROM nodes GROUP BY kind ORDER BY n DESC').map(r => `${r.kind} ${r.n}`).join(', ');
  const events = logStats(resolve(dataDir, 'events'));
  const replay = logStats(resolve(dataDir, 'replay'));
  const mb = bytes => `${(bytes / 1048576).toFixed(1)} MB`;

  return {
    groups: [
      {
        title: 'Now',
        items: [
          ['logged-in sessions (valid)', count(h, 'SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?', now)],
          ['users logged in', count(h, 'SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE expires_at > ?', now)],
          [`browsers active in the last ${ACTIVE_MS / 60000} min`, browsers.size],
          ['editor locks held', count(h, 'SELECT COUNT(*) AS n FROM node_locks WHERE expires_at > ?', now)],
        ],
      },
      {
        title: 'Accounts',
        items: [
          ['accounts', count(h, 'SELECT COUNT(*) AS n FROM users')],
          ['admins', count(h, 'SELECT COUNT(*) AS n FROM users WHERE is_admin = 1')],
          ['registered in the last 7 days', count(h, 'SELECT COUNT(*) AS n FROM users WHERE created_at > ?', now - 7 * 86400000)],
        ],
      },
      {
        title: 'Nodes',
        items: [
          ['nodes', count(h, 'SELECT COUNT(*) AS n FROM nodes')],
          ['by kind', kinds || '-'],
          ['public', count(h, "SELECT COUNT(*) AS n FROM nodes WHERE visibility = 'public'")],
          ['hidden (private)', count(h, "SELECT COUNT(*) AS n FROM nodes WHERE visibility = 'hidden'")],
          ['in the open area (no owner)', count(h, 'SELECT COUNT(*) AS n FROM nodes WHERE owner_id IS NULL AND space IS NULL')],
          ['pages of personal sites', count(h, 'SELECT COUNT(*) AS n FROM nodes WHERE space IS NOT NULL')],
          ['links between nodes', count(h, 'SELECT COUNT(*) AS n FROM node_links')],
          ['created in the last 7 days', count(h, 'SELECT COUNT(*) AS n FROM nodes WHERE created_at > ?', now - 7 * 86400000)],
        ],
      },
      {
        title: 'Photos',
        items: [
          ['photos stored', count(h, 'SELECT COUNT(*) AS n FROM photos')],
          ['photos linked to nodes', count(h, 'SELECT COUNT(DISTINCT photo_hash) AS n FROM node_photos')],
          ['photo placements in nodes', count(h, 'SELECT COUNT(*) AS n FROM node_photos')],
          ['photos in no node', count(h, 'SELECT COUNT(*) AS n FROM photos WHERE hash NOT IN (SELECT photo_hash FROM node_photos)')],
          ['size of the photos', mb(h.get('SELECT COALESCE(SUM(bytes), 0) AS n FROM photos').n)],
        ],
      },
      {
        title: 'Logs',
        items: [
          ['usage log', `${events.files} days, ${mb(events.bytes)}${events.newest ? `, ${events.oldest} .. ${events.newest}` : ''}`],
          ['recordings', `${replay.files} days, ${mb(replay.bytes)}${replay.newest ? `, ${replay.oldest} .. ${replay.newest}` : ''}`],
          ['database', mb(sizeOf(config.dbFile))],
        ],
      },
    ],
  };
}

// the accounts, newest first (not editable yet)
export const users = (h, now = Date.now()) =>
  h.all(
    `SELECT u.id, u.email, u.username, u.name, u.is_admin AS admin, u.created_at AS created,
            (SELECT COUNT(*) FROM nodes n WHERE n.owner_id = u.id) AS nodes,
            (SELECT COUNT(*) FROM nodes n WHERE n.owner_id = u.id AND n.visibility = 'public') AS published,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > ?) AS sessions,
            (SELECT MAX(s.created_at) FROM sessions s WHERE s.user_id = u.id) AS last_login
       FROM users u ORDER BY u.id DESC`,
    now,
  ).map(u => ({ ...u, admin: !!u.admin }));

// the fields of a session a table needs (not its events)
const row = s => ({ id: s.id, kind: s.kind, who: s.who, user: s.user ?? null, ip: s.ip ?? null, ua: s.ua ?? null, url: s.url ?? null, start: s.start, end: s.end, events: s.events, replay: s.replay, usage: s.usage ?? null, cmds: s.cmds ?? null, errors: s.errors ?? null });

// the sessions of the last `days` days, filtered (`q` as the tools/replay.js filters), newest first;
// `by` ip | user | who groups them instead -> { sessions } | { groups }
export function sessions(q, { dataDir = config.dataDir, now = Date.now() } = {}) {
  const days = Math.min(90, Math.max(1, Number(q.get('days')) || 7));
  const from = new Date(now - days * 86400000).toISOString().slice(0, 10);
  const num = name => (q.get(name) ? Number(q.get(name)) : null);
  const all = filterSessions(sessionsOf(readLog(resolve(dataDir, 'replay'), { from }), readLog(resolve(dataDir, 'events'), { from })), { who: q.get('who'), ip: q.get('ip'), user: q.get('user'), url: q.get('url'), ua: q.get('ua'), minSecs: num('minSecs'), minEvents: num('minEvents'), replay: q.get('replay') === '1' });
  const by = q.get('by');

  if(['ip', 'user', 'who'].includes(by)) return { groups: groupSessions(all, by).map(g => ({ key: g.key, sessions: g.sessions, seconds: g.seconds, replays: g.replays, first: g.first, last: g.last, users: [...g.users], ips: [...g.ips] })) };

  return { total: all.length, sessions: all.slice(-LIST_MAX).reverse().map(row) };
}

// the rrweb events of one recorded session, or null
export function recording(id, { dataDir = config.dataDir } = {}) {
  const m = /^r:([0-9a-f]{8})-([a-z0-9]{1,16}|0)$/.exec(id);

  if(!m) return null;

  const lines = readLog(resolve(dataDir, 'replay')).filter(l => l.sid === m[1] && (l.rid || '0') === m[2]);

  return lines.length ? eventsOf({ lines }) : null;
}

const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const missing = () => new Response('not found\n', { status: 404 });

// GET /api/admin/summary | users | sessions?... | recording/<id> | recording/<id>/page -> a Response, or null when the
// path is not an admin route; for a visitor and for a user who is no admin the answer is a 404
export async function adminRoute(req, pathname, h, options = {}) {
  if(!pathname.startsWith('/api/admin/')) return null;
  if(!isAdmin(viewerOf(h, req)) || req.method !== 'GET') return missing();

  const url = new URL(req.url);

  if(pathname === '/api/admin/summary') return json(summary(h, options));
  if(pathname === '/api/admin/users') return json({ users: users(h) });
  if(pathname === '/api/admin/sessions') return json(sessions(url.searchParams, options));

  const rec = /^\/api\/admin\/recording\/([^/]+?)(\/page)?$/.exec(pathname);

  if(rec) {
    const events = recording(decodeURIComponent(rec[1]), options);

    if(!events) return missing();
    if(!rec[2]) return json({ events });

    return new Response(playerPage(events, { title: `recording ${rec[1]}`, vendor: resolve(config.root, 'vendor', 'session') }), { headers: { 'content-type': 'text/html; charset=utf-8', 'content-disposition': `attachment; filename="replay-${rec[1].replace(/[^a-z0-9-]/gi, '_')}.html"`, 'cache-control': 'no-store' } });
  }

  return missing();
}
