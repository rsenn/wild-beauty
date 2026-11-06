#!/usr/bin/env bun
// Who looked at the site? Reads the web server's access log (nginx, combined format, the
// rotated files too) and the usage events, and lists the real visitors: browser visits to the
// pages, grouped into visits, without scanners and crawlers, without your own devices (the
// addresses a logged-in user was seen on in data/events, WB_OWNER_IPS and --own), and apart
// from them the link previews that chat apps fetch when somebody pastes a link (a preview is
// not a visit). Read only.
//
//   bun tools/visitors.js [--days N] [--own IP,IP] [--users] [--bots] [--loose] [--json] [--log FILE]
//
//   --days N    how far back (default 3)
//   --own IPS   more addresses that are yours
//   --users     also list the visits of logged-in users (own devices, testers with an account)
//   --bots      also count what was left out as a bot, by name
//   --loose     also list the visits that look like scanners: a visit counts as a person when its
//               browser loaded the page's style sheets and scripts and it opened a page other than
//               the front page, came from a link or fetched photos (scanners with a browser's name
//               fetch the front page's HTML only)
//   --json      the result as JSON
//   --log FILE  the access log (default /var/log/nginx/access.log, with .1 and .N.gz next to it);
//               the file needs the group adm: add yourself or run it with sudo
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { gunzipSync } from 'node:zlib';

const GAP = 30 * 60 * 1000; // a visit ends after this much quiet

const LINE = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d+) \S+ "([^"]*)" "([^"]*)"/;
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// one line of the log -> { ip, at (ms), method, path, status, referrer, ua } or null
export function parseLine(line) {
  const m = LINE.exec(line);

  if(!m) return null;

  const t = /^(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+) ([+-])(\d\d)(\d\d)$/.exec(m[2]);

  if(!t) return null;

  const offset = (t[7] === '-' ? -1 : 1) * (+t[8] * 60 + +t[9]) * 60000;
  const at = Date.UTC(+t[3], MONTHS[t[2]], +t[1], +t[4], +t[5], +t[6]) - offset;

  return { ip: m[1], at, method: m[3], path: m[4], status: +m[5], referrer: m[6], ua: m[7] };
}

// chat apps that fetch a link to draw its preview
const PREVIEW = /TelegramBot|WhatsApp|facebookexternalhit|Facebot|Slackbot|Discordbot|Signal|Twitterbot|LinkedInBot|SkypeUriPreview|iMessage|Applebot/i;

// Google's servers that fetch pages for a Chrome on Android (data saver, preloading): they act for a phone, not for a visitor
const GOOGLE_PROXY = /^(?:66\.249\.|66\.102\.|64\.233\.|74\.125\.|72\.14\.)/;

// crawlers, scanners, tools and the like
const BOT = /bot\b|bot\/|crawl|spider|scan|curl|wget|python|go-http|java\/|zgrab|censys|research|check|validator|monitor|probe|inspect|fetch|http-client|okhttp|axios|libwww|headless|palo alto|nuclei|masscan|nmap|^-?$|^mozilla\/5\.0$/i;

// a page of the site (not a file, not the API)
const PAGE = /^\/(?:(?:[a-z]{2}\/)?(?:node\/\d+|view|gallery|tree|new|profile|admin)(?:[?#].*)?)?$/; // the root only without a query: `/?phpinfo=-1` is a probe

export const isPage = path => PAGE.test(path);

// -> 'preview' | 'bot' | 'visitor'
export function kindOf(ua) {
  if(PREVIEW.test(ua)) return 'preview';

  return BOT.test(ua ?? '') ? 'bot' : 'visitor';
}

// a short name of the device from the user agent: "Firefox 159, Linux"
export function deviceOf(ua = '') {
  const browser = /(Edg|OPR|SamsungBrowser|Firefox|Chrome|CriOS|FxiOS|Safari)\/(\d+)/.exec(ua);
  const name = browser ? ({ Edg: 'Edge', OPR: 'Opera', CriOS: 'Chrome', FxiOS: 'Firefox' }[browser[1]] ?? browser[1]) : 'browser';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android (\d+)/.exec(ua) ? `Android ${/Android (\d+)/.exec(ua)[1]}` : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux|X11/.test(ua) ? 'Linux' : '';

  return `${name}${browser ? ` ${browser[2]}` : ''}${os ? `, ${os}` : ''}`;
}

// requests of one visitor (same address and browser) cut into visits at a quiet gap
// -> [{ ip, ua, from, to, pages: [path], files (photos), assets (style sheets, scripts), referrer }]
export function visits(requests) {
  const by = new Map();

  for(const r of [...requests].sort((a, b) => a.at - b.at)) {
    const key = `${r.ip}\n${r.ua}`;
    const list = by.get(key) ?? [];
    const last = list.at(-1);

    if(!last || r.at - last.to > GAP) list.push({ ip: r.ip, ua: r.ua, from: r.at, to: r.at, pages: [], files: 0, assets: 0, referrer: '' });

    const v = list.at(-1);

    v.to = r.at;

    if(isPage(r.path) && r.status < 400) {
      if(!v.pages.length) v.referrer = r.referrer === '-' ? '' : r.referrer;

      v.pages.push(r.path);
    } else if(r.path.startsWith('/files/')) v.files++;
    else if(/^\/(?:static|app|vendor)\//.test(r.path)) v.assets++;

    by.set(key, list);
  }

  return [...by.values()].flat().filter(v => v.pages.length).sort((a, b) => a.from - b.from);
}

// a visit that looks like a person: the browser loaded the page's files and the visit went further than the front page
export const looksHuman = v => v.assets > 0 && (v.files > 0 || !!v.referrer || v.pages.some(p => p !== '/'));

// the addresses logged-in users were seen on, from the usage events: -> Map(ip -> Set(user))
export function knownAddresses(eventLines) {
  const known = new Map();

  for(const line of eventLines) {
    try {
      const { ip, user } = JSON.parse(line);

      if(ip && user) known.set(ip, (known.get(ip) ?? new Set()).add(user));
    } catch {}
  }

  return known;
}

// the lines of the log file and its rotated copies (access.log, access.log.1, access.log.2.gz ...) newer than `since`
function logLines(file, since) {
  const dir = dirname(file);
  const base = basename(file);
  const names = existsSync(dir) ? readdirSync(dir).filter(n => n === base || n.startsWith(`${base}.`)) : [];
  const out = [];

  for(const name of names) {
    try {
      const raw = readFileSync(resolve(dir, name));

      out.push(...(name.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8').split('\n'));
    } catch(e) {
      if(e.code === 'EACCES') throw new Error(`cannot read ${resolve(dir, name)}: the file needs the group adm (run with sudo or add yourself to adm)`);
    }
  }

  return out.map(parseLine).filter(r => r && r.at >= since);
}

const stamp = ms => new Date(ms).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });

function main() {
  const args = process.argv.slice(2);
  const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
  const days = Number(opt('--days') ?? 3);
  const log = opt('--log') ?? '/var/log/nginx/access.log';
  const eventsDir = resolve(import.meta.dir, '..', 'data', 'events');
  const own = new Set(['127.0.0.1', '::1', ...(process.env.WB_OWNER_IPS ?? '').split(','), ...(opt('--own') ?? '').split(',')].map(s => s.trim()).filter(Boolean));
  const loose = args.includes('--loose');
  const since = Date.now() - days * 86400000;
  const known = knownAddresses(existsSync(eventsDir) ? readdirSync(eventsDir).filter(f => f.endsWith('.jsonl')).flatMap(f => readFileSync(resolve(eventsDir, f), 'utf8').split('\n')) : []);
  const rows = logLines(log, since);
  const people = [];
  const mine = [];
  const previews = [];
  const bots = new Map();

  for(const r of rows) {
    const kind = kindOf(r.ua);

    if(kind === 'preview') {
      if(isPage(r.path) || r.path === '/robots.txt') previews.push(r);
    } else if(kind === 'bot') {
      if(isPage(r.path)) bots.set(r.ua.slice(0, 40) || '(no user agent)', (bots.get(r.ua.slice(0, 40) || '(no user agent)') ?? 0) + 1);
    } else if(own.has(r.ip) || known.has(r.ip) || GOOGLE_PROXY.test(r.ip)) mine.push(r);
    else people.push(r);
  }

  const result = {
    since,
    visitors: visits(people).filter(v => loose || looksHuman(v)),
    users: visits(mine),
    previews: previews.map(r => ({ at: r.at, app: PREVIEW.exec(r.ua)?.[0], path: r.path.slice(0, 80) })),
    bots: [...bots].sort((a, b) => b[1] - a[1]),
  };

  if(args.includes('--json')) return console.log(JSON.stringify(result, null, 2));

  const show = v => `${stamp(v.from)}${v.to - v.from > 60000 ? `-${stamp(v.to).slice(11)}` : ''}  ${v.ip}  ${deviceOf(v.ua)}  ${v.pages.length} page${v.pages.length === 1 ? '' : 's'}, ${v.files} files  ${[...new Set(v.pages)].slice(0, 3).join(' ')}${v.referrer ? `  from ${v.referrer.slice(0, 40)}` : ''}`;

  console.log(`Visitors in the last ${days} days (${stamp(since)} on), without bots, link previews and your own devices${loose ? '' : ', only visits that look like a person'}:`);
  console.log(result.visitors.length ? result.visitors.map(show).join('\n') : '  nobody');

  console.log('\nLink previews (a chat app fetched the link, which is not a visit):');
  console.log(result.previews.length ? result.previews.map(p => `  ${stamp(p.at)}  ${p.app}  ${p.path}`).join('\n') : '  none');

  if(args.includes('--users')) console.log(`\nLogged-in users and your devices:\n${result.users.length ? result.users.map(show).join('\n') : '  none'}`);

  if(args.includes('--bots')) console.log(`\nLeft out as bots (page requests): ${result.bots.reduce((n, b) => n + b[1], 0)}\n${result.bots.slice(0, 15).map(([ua, n]) => `  ${n}  ${ua}`).join('\n')}`);
}

if(import.meta.main) {
  try {
    main();
  } catch(e) {
    console.error(String(e.message ?? e));
    process.exit(1);
  }
}
