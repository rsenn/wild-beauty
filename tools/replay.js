#!/usr/bin/env bun
// Inspector for the usage recording (server/events.js, client/replay.js).
//   bun tools/replay.js list [filters] [--by ip|user|who]   the sessions, or the totals per address / user
//   bun tools/replay.js show <id>                           one session in detail (the usage events counted)
//   bun tools/replay.js export <id> [-o file] [--json]      a standalone replay page (or the rrweb events)
// filters: --who claude|owner|tester-xxxx  --ip a.b  --user mail  --url /de/new  --ua phone  --min-secs n
//          --min-events n  --replay (only recorded ones)  --day YYYY-MM-DD  --days n (the last n days)  --data dir
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eventsOf, filterSessions, groupSessions, loadOf, playerPage, readLog, sessionsOf } from '../server/replaylog.js';

const args = process.argv.slice(2);
const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const flag = name => args.includes(name);
const [command = 'list', target] = args.filter((a, i) => !a.startsWith('-') && !args[i - 1]?.startsWith('-') || i === 0 && !a.startsWith('-'));
const root = resolve(opt('--data') ?? resolve(import.meta.dir, '..', 'data'));
const day = opt('--day');
const days = opt('--days');
const range = day ? { from: day, to: day } : days ? { from: new Date(Date.now() - Number(days) * 86400000).toISOString().slice(0, 10), to: null } : {};
const num = name => (opt(name) == null ? null : Number(opt(name)));
const sessions = filterSessions(sessionsOf(readLog(resolve(root, 'replay'), range), readLog(resolve(root, 'events'), range)), { who: opt('--who'), ip: opt('--ip'), user: opt('--user'), url: opt('--url'), ua: opt('--ua'), minSecs: num('--min-secs'), minEvents: num('--min-events'), replay: flag('--replay') });

const clock = ts => new Date(ts).toISOString().slice(0, 16).replace('T', ' ');
const span = s => {
  const secs = Math.round(s / 1000);

  return secs >= 90 ? `${Math.round(secs / 60)}m` : `${secs}s`;
};
const device = ua => (/iPhone|Android.*Mobile/.test(ua ?? '') ? 'phone' : /iPad|Tablet/.test(ua ?? '') ? 'tablet' : ua ? 'desktop' : '-');

if(command === 'list') {
  const by = opt('--by');

  if(by) {
    if(!['ip', 'user', 'who'].includes(by)) throw new Error('--by takes ip, user or who');

    for(const g of groupSessions(sessions, by)) console.log(`${g.key.padEnd(28)} ${String(g.sessions).padStart(4)} sessions ${span(g.seconds * 1000).padStart(5)}  ${g.replays} recorded  ${clock(g.first)} .. ${clock(g.last)}${by !== 'ip' && g.ips.size ? '  ip ' + [...g.ips].slice(0, 3).join(',') : ''}${by !== 'user' && g.users.size ? '  ' + [...g.users].slice(0, 2).join(',') : ''}`);
  } else {
    for(const s of sessions) console.log(`${s.id.padEnd(24)} ${clock(s.start)} ${span(s.end - s.start).padStart(5)} ${s.replay ? 'REC' : '   '} ${String(s.events).padStart(6)} ev  ${s.who.padEnd(12)} ${(s.user ?? '-').padEnd(26)} ${(s.ip ?? '-').padEnd(16)} ${device(s.ua).padEnd(7)} ${s.url ?? ''}`);

    console.log(`${sessions.length} sessions`);
  }
} else {
  const s = sessions.find(x => x.id === target || x.id.endsWith(target ?? '\0'));

  if(!s) {
    console.error(`no session ${target ?? ''} (see: bun tools/replay.js list)`);
    process.exit(1);
  }

  if(command === 'show') {
    console.log(`${s.id}\n  who ${s.who}  user ${s.user ?? '-'}  ip ${s.ip ?? '-'}  ${device(s.ua)}\n  ${clock(s.start)} .. ${clock(s.end)} (${span(s.end - s.start)})  ${s.url ?? ''}\n  ua ${s.ua ?? '-'}`);

    if(s.replay) console.log(`  recorded: ${s.events} rrweb events in ${s.lines.length} batches; usage events ${s.usage ?? 0} (commands ${s.cmds ?? 0}, errors ${s.errors ?? 0})`);
    else console.log(`  not recorded: ${s.events} usage events`, Object.entries(s.rows.reduce((m, r) => ((m[r.type] = (m[r.type] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(', '));

    // the load on the browser (client/events.js startLoad); decoded pictures take about 4 MB per megapixel
    const load = loadOf(s.rows ?? []);
    const time = ts => new Date(ts).toISOString().slice(11, 19);

    if(load) {
      const { device: d, slow, frames, memory: m } = load;

      if(d) console.log(`  device: ${d.cores ?? '?'} cores, ${d.mem ?? '?'} GB, dpr ${d.dpr}, screen ${d.screen?.join('x')}`);
      console.log(`  slow interactions (> 200 ms): ${slow.count}, p95 ${slow.p95} ms${slow.worst.map(w => `\n    ${time(w.ts)} ${w.dur} ms (wait ${w.wait}, run ${w.run}) ${w.key ?? ''} [${w.tool ?? '-'}]`).join('')}`);
      console.log(`  long frames (> 150 ms): ${frames.count}, p95 ${frames.p95} ms${frames.worst.map(w => `\n    ${time(w.ts)} ${w.dur} ms ${w.script ?? ''} [${w.tool ?? '-'}]`).join('')}`);
      console.log(`  memory peaks: js ${m.js} of ${m.limit} MB, <img> ${m.imgs} pictures ${m.imgMP} MP (~${Math.round(m.imgMP * 4)} MB decoded), editor ${m.photos} photos ${m.photoMP} MP (~${Math.round(m.photoMP * 4)} MB), page ${m.pageMP} MP, ${m.nodes} DOM nodes (${m.samples} samples)`);
    }
  } else if(command === 'export') {
    if(!s.replay) {
      console.error('that session has no recording (list --replay shows the recorded ones)');
      process.exit(1);
    }

    const events = eventsOf(s);
    const json = flag('--json');
    const out = resolve(opt('-o') ?? `replay-${s.id.slice(2)}.${json ? 'json' : 'html'}`);

    writeFileSync(out, json ? JSON.stringify(events) : playerPage(events, { title: `${s.user ?? s.who} ${s.ip ?? ''} ${clock(s.start)} ${s.url ?? ''}`, vendor: resolve(import.meta.dir, '..', 'vendor', 'session') }));
    console.log(`${out} (${events.length} events)`);
  } else {
    console.error('commands: list, show, export');
    process.exit(1);
  }
}
