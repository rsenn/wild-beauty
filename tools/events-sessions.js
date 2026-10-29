#!/usr/bin/env bun
// Reads usage events (data/events/*.jsonl, server/events.js) and prints a report
// of the heavier editing sessions: what was done, where the friction was.
//   bun tools/events-sessions.js [file...] [--min-cmds N] [--who tester-xxxx]
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const minCmds = Number(opt('--min-cmds') ?? 50);
const who = opt('--who');
const dir = resolve(import.meta.dir, '..', 'data', 'events');
const files = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')).map(f => resolve(f));
const rows = (files.length ? files : readdirSync(dir).filter(f => f.endsWith('.jsonl')).map(f => resolve(dir, f)))
  .flatMap(f => readFileSync(f, 'utf8').split('\n'))
  .flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } })
  .filter(r => r.ts && r.type && (!who || r.who === who))
  .sort((a, b) => a.ts - b.ts);

// a session: one browser visit, found by `session` events (the page's own clock `at` restarts)
const sessions = [];

for(const r of rows) {
  const last = sessions[sessions.length - 1];

  if(r.type === 'session' || !last || last.sid !== r.sid || r.ts - last.end > 30 * 60 * 1000) sessions.push({ sid: r.sid, who: r.who, start: r.ts, end: r.ts, rows: [] });

  const s = sessions[sessions.length - 1];

  s.rows.push(r);
  s.end = r.ts;
}

const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-');
const top = (counter, n = 8) => [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(', ');
const count = list => list.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map());
const mins = ms => (ms / 60000).toFixed(1);
const clock = ts => new Date(ts).toISOString().slice(0, 16).replace('T', ' ');

for(const s of sessions) {
  const cmds = s.rows.filter(r => r.type === 'cmd');

  if(cmds.length < minCmds) continue;

  const device = s.rows.find(r => r.type === 'session');
  const gestures = s.rows.filter(r => r.type === 'gesture');
  const taps = s.rows.filter(r => r.type === 'tap');
  const rage = s.rows.filter(r => r.type === 'rage-tap');
  const miss = s.rows.filter(r => r.type === 'miss');
  const uploads = s.rows.filter(r => r.type === 'upload');

  // a manipulation: setMatrix commands of one step less than 1.5 s apart are one drag
  const drags = [];
  let prev = null;

  for(const c of cmds) {
    if(c.c === 'setMatrix' && prev?.c === 'setMatrix' && prev.id === c.id && c.ts - prev.ts < 1500) prev.n++, prev.ts = c.ts;
    else drags.push({ ...c, n: 1 });

    prev = drags[drags.length - 1];
  }

  const mix = count(drags.map(c => c.c));
  const undone = count(drags.flatMap((c, i) => (c.c === 'undo' && i ? [drags[i - 1].c] : [])));
  const gaps = drags.slice(1).map((c, i) => c.ts - drags[i].ts);
  const idle = gaps.filter(g => g > 60000).reduce((a, b) => a + b, 0);
  const tools = count(cmds.map(c => c.st?.tool).filter(Boolean));

  console.log(`\n## ${clock(s.start)}  ${s.who}  ${device ? `${device.w}x${device.h} ${device.touch ? 'touch' : 'mouse'} ${device.lang}` : ''}`);
  console.log(`${mins(s.end - s.start)} min (${mins(s.end - s.start - idle)} active), ${cmds.length} commands = ${drags.length} actions, ${uploads.length} uploads (${uploads.filter(u => !u.ok).length} failed), pages ${Math.max(...cmds.map(c => c.st?.pages ?? 0))}, most steps ${Math.max(...cmds.map(c => c.st?.steps ?? 0))}`);
  console.log(`actions: ${top(mix, 12)}`);
  console.log(`dragging: ${drags.filter(c => c.c === 'setMatrix').length} drags, median ${[...drags.filter(c => c.c === 'setMatrix').map(c => c.n)].sort((a, b) => a - b)[Math.floor(drags.filter(c => c.c === 'setMatrix').length / 2)] ?? 0} moves each`);
  console.log(`undo: ${mix.get('undo') ?? 0} (${pct(mix.get('undo') ?? 0, drags.length)} of actions), after: ${top(undone, 6) || '-'}`);
  console.log(`tool at command time: ${top(tools)}`);
  console.log(`taps ${taps.length}: ${top(count(taps.map(t => t.key)), 8)}`);
  console.log(`rage taps ${rage.length}: ${top(count(rage.map(t => t.key)), 6) || '-'}   missed taps ${miss.length}`);
  console.log(`gestures ${gestures.length}: ${top(count(gestures.map(g => g.kind)), 5)}; cancelled ${pct(gestures.filter(g => g.end === 'cancel').length, gestures.length)}, median ${[...gestures.map(g => g.dur)].sort((a, b) => a - b)[Math.floor(gestures.length / 2)] ?? 0} ms`);

  // the delete / undo pattern: a removal followed within 15 s by an undo
  const removed = drags.filter((c, i) => c.c === 'removeStep' && drags.slice(i + 1, i + 3).some(n => n.c === 'undo' && n.ts - c.ts < 15000)).length;

  if(removed) console.log(`removals taken back within 15 s: ${removed} of ${mix.get('removeStep') ?? 0}`);

  // time between the actions that follow a photo being added: how long a collage step takes
  const adds = drags.filter(c => c.c === 'addPhoto');

  if(adds.length > 1) console.log(`photo added every ${Math.round((adds.at(-1).ts - adds[0].ts) / (adds.length - 1) / 1000)} s on average`);
}
