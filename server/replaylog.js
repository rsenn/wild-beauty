// The logs of a usage recording as sessions (server/events.js): data/replay/<date>.jsonl holds rrweb batches
// (client/replay.js), data/events/<date>.jsonl the small usage events (client/events.js). Used by tools/replay.js and the admin panel (server/admin.js).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GAP = 30 * 60 * 1000; // usage events of one browser further apart than this are two visits

const lines = file =>
  readFileSync(file, 'utf8')
    .split('\n')
    .flatMap(l => {
      try {
        return l ? [JSON.parse(l)] : [];
      } catch {
        return [];
      }
    });

// every line of a log directory whose day is within [from, to] (YYYY-MM-DD, inclusive, either may be null)
export function readLog(dir, { from = null, to = null } = {}) {
  if(!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter(f => /^\d{4}-\d\d-\d\d\.jsonl$/.test(f))
    .filter(f => (!from || f.slice(0, 10) >= from) && (!to || f.slice(0, 10) <= to))
    .sort()
    .flatMap(f => lines(resolve(dir, f)));
}

// -> [{ id, kind, who, ip, user, ua, sid, url, start, end, events, replay }]: the visits found in the two logs.
// `replay` ones are one page load recorded by rrweb (id r:<sid>-<rid>, their events are the rrweb events and
// `usage` counts the usage events of the same browser in the same time); `usage` ones have no recording.
export function sessionsOf(replayLines, usageLines) {
  const byId = new Map();

  for(const line of replayLines) {
    const id = `r:${line.sid}-${line.rid || '0'}`;
    const times = line.events.map(e => e.timestamp);
    const s = byId.get(id) ?? { id, kind: 'replay', who: line.who, ip: line.ip, user: line.user, ua: line.ua, sid: line.sid, url: undefined, urls: [], start: Infinity, end: 0, events: 0, replay: true, lines: [] };

    s.start = Math.min(s.start, ...times);
    s.end = Math.max(s.end, ...times);
    s.events += line.events.length;
    s.user ||= line.user;
    if(line.url && !s.urls.includes(line.url)) s.urls.push(line.url);
    s.url = s.urls.join(' → ');
    s.lines.push(line);
    byId.set(id, s);
  }

  const replays = [...byId.values()];
  const usage = [];

  for(const r of [...usageLines].filter(r => r.ts && r.type).sort((a, b) => a.ts - b.ts)) {
    const near = usage.findLast(s => s.sid === r.sid && s.who === r.who);

    if(r.type === 'session' || !near || r.ts - near.end > GAP) usage.push({ kind: 'usage', who: r.who, ip: r.ip, user: r.user, ua: r.ua, sid: r.sid, url: undefined, start: r.ts, end: r.ts, events: 0, replay: false, rows: [] });

    const s = usage[usage.length - 1];

    s.rows.push(r);
    s.events++;
    s.end = r.ts;
    s.user ||= r.user;
    if(r.type === 'session') s.url = r.url;
  }

  usage.forEach(s => (s.id = `u:${s.sid}-${s.start.toString(36)}`));

  // a recording knows the usage counts of its browser in its time
  for(const s of replays) {
    const rows = usage.filter(u => u.sid === s.sid && u.end >= s.start && u.start <= s.end).flatMap(u => u.rows).filter(r => r.ts >= s.start && r.ts <= s.end);

    s.usage = rows.length;
    s.cmds = rows.filter(r => r.type === 'cmd').length;
    s.errors = rows.filter(r => r.type === 'error').length;
    s.ua ||= rows[0]?.ua;
  }

  // a usage visit covered by a recording is not listed twice
  const covered = u => replays.some(s => s.sid === u.sid && u.start >= s.start - GAP && u.end <= s.end + GAP);

  return [...replays, ...usage.filter(u => !covered(u))].sort((a, b) => a.start - b.start);
}

// the filters of `list`: { who, ip, user, url, ua, minSecs, minEvents, replay } (strings match as substrings, case-insensitively)
export function filterSessions(sessions, f = {}) {
  const has = (value, needle) => !needle || String(value ?? '').toLowerCase().includes(String(needle).toLowerCase());

  return sessions.filter(
    s => (!f.who || s.who === f.who) && has(s.ip, f.ip) && has(s.user, f.user) && has(s.url, f.url) && has(s.ua, f.ua) && (f.minSecs == null || (s.end - s.start) / 1000 >= f.minSecs) && (f.minEvents == null || s.events >= f.minEvents) && (!f.replay || s.replay),
  );
}

// sessions grouped by `by` (ip | user | who): [{ key, sessions, seconds, replays, first, last, users, ips }]
export function groupSessions(sessions, by) {
  const groups = new Map();

  for(const s of sessions) {
    const key = (by === 'user' ? s.user : s[by]) || (by === 'user' ? '(not logged in)' : '(unknown)');
    const g = groups.get(key) ?? { key, sessions: 0, seconds: 0, replays: 0, first: Infinity, last: 0, users: new Set(), ips: new Set() };

    g.sessions++;
    g.seconds += Math.round((s.end - s.start) / 1000);
    g.replays += s.replay ? 1 : 0;
    g.first = Math.min(g.first, s.start);
    g.last = Math.max(g.last, s.end);
    if(s.user) g.users.add(s.user);
    if(s.ip) g.ips.add(s.ip);
    groups.set(key, g);
  }

  return [...groups.values()].sort((a, b) => b.last - a.last);
}

// the rrweb events of a recorded session, in order
export const eventsOf = session => (session.lines ?? []).flatMap(l => l.events).sort((a, b) => a.timestamp - b.timestamp);

// a standalone page that plays `events`: the player and the events inline, no server needed (the photos load from
// the site while it is online). `title` is shown in the tab.
export function playerPage(events, { title = 'replay', vendor }) {
  const safe = text => text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  const meta = events.find(e => e.type === 4)?.data ?? {};
  const esc = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const readText = name => readFileSync(resolve(vendor, name), 'utf8');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${readText('player.css')}</style>
<style>html,body{margin:0;background:#222;color:#ddd;font:14px system-ui}#bar{padding:8px 12px}#play{display:flex;justify-content:center;padding:8px}</style>
</head><body><div id="bar">${esc(title)}</div><div id="play"></div>
<script>${safe(readText('player.min.js'))}</script>
<script>
const events = ${safe(JSON.stringify(events))};
const meta = { w: ${Number(meta.width) || 1280}, h: ${Number(meta.height) || 800} };
const room = Math.min(innerWidth - 40, 1600);
const k = Math.min(1, room / meta.w, (innerHeight - 140) / meta.h);

new (rrwebPlayer.default ?? rrwebPlayer)({ target: document.getElementById('play'), props: { events, width: Math.round(meta.w * k), height: Math.round(meta.h * k), autoPlay: false, skipInactive: true } });
</script></body></html>
`;
}
