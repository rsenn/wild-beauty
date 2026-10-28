// bun tools/events-report.js [who] [--days n]: summary of data/events/*.jsonl per
// who and session: device, how long, what was tapped, rage taps, errors, uploads.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(import.meta.dir, '..', process.env.WB_DATA ?? 'data', 'events');
const args = process.argv.slice(2);
const only = args.find(a => !a.startsWith('--'));
const days = Number(args[args.indexOf('--days') + 1]) || 7;
const since = Date.now() - days * 864e5;

let events = [];

try {
  for(const f of readdirSync(dir).filter(f => f.endsWith('.jsonl'))) events.push(...readFileSync(resolve(dir, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)));
} catch {
  console.log('no events yet');
  process.exit(0);
}

events = events.filter(e => e.ts >= since && (!only || e.who === only));

const sessions = Map.groupBy(events, e => `${e.who}/${e.sid}`);
const top = (counts, n = 8) => [...counts].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} x${v}`).join(', ');

for(const [id, list] of sessions) {
  list.sort((a, b) => a.ts - b.ts);

  const first = list.find(e => e.type === 'session') ?? list[0];
  const span = Math.round((list.at(-1).ts - list[0].ts) / 1000);
  const taps = new Map();
  const rage = new Map();
  const uploads = list.filter(e => e.type === 'upload');

  for(const e of list) {
    if(e.type === 'tap') taps.set(e.key, (taps.get(e.key) ?? 0) + 1);
    if(e.type === 'rage-tap') rage.set(e.key, (rage.get(e.key) ?? 0) + 1);
  }

  const firstUpload = uploads.find(e => e.ok);

  console.log(`\n== ${id}  ${new Date(list[0].ts).toLocaleString()}  ${span}s  ${list.length} events`);
  console.log(`   ip ${first.ip}  ${first.w}x${first.h} ${first.orient ?? ''} dpr ${first.dpr ?? '?'} ${first.touch ? 'touch' : 'mouse'}  ${first.ua?.slice(0, 80) ?? ''}`);
  console.log(`   orientation changes: ${list.filter(e => e.type === 'orientation').length}  stage touches: ${list.filter(e => e.type === 'stage').length}`);
  console.log(`   taps: ${top(taps) || '-'}`);
  if(rage.size) console.log(`   RAGE TAPS: ${top(rage)}`);
  console.log(`   uploads: ${uploads.filter(e => e.ok).length} ok, ${uploads.filter(e => !e.ok).length} failed${firstUpload ? `, first ok after ${Math.round(firstUpload.at / 1000)}s into the page` : ''}`);

  const errors = list.filter(e => e.type === 'error');

  for(const e of errors.slice(0, 5)) console.log(`   ERROR ${e.message} ${e.at ?? ''}`);
}

console.log(`\n${sessions.size} sessions, ${events.length} events (last ${days} days${only ? `, ${only}` : ''})`);
