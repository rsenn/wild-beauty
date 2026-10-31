// bun test: tools/replaylog.js (the sessions of the two logs) and server recordReplay
import { afterAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { purgeReplay } from '../server/events.js';
import { eventsOf, filterSessions, groupSessions, playerPage, readLog, sessionsOf } from '../server/replaylog.js';

const T = 1_800_000_000_000;
const batch = (rid, user, ip, ...times) => ({ ts: T, who: 'tester-1', sid: 'aaaa1111', rid, ip, user, ua: 'Mozilla Android Mobile', url: '/de/new', events: times.map((t, i) => ({ type: i ? 3 : 2, timestamp: T + t, data: {} })) });
const usage = (type, t, extra = {}) => ({ ts: T + t, who: 'tester-1', sid: 'aaaa1111', ip: '1.2.3.4', ua: 'Mozilla Android Mobile', type, ...extra });

describe('sessionsOf', () => {
  const replay = [batch('r1', 'a@x.ch', '1.2.3.4', 0, 1000), batch('r1', 'a@x.ch', '1.2.3.4', 5000, 9000), batch('r2', undefined, '5.6.7.8', 100000)];
  const events = [usage('session', 100, { url: '/de/new' }), usage('cmd', 2000), usage('cmd', 3000), usage('error', 4000), usage('session', 9e9, { url: '/later' }), usage('tap', 9e9 + 5)];
  const list = sessionsOf(replay, events);

  test('a recording is one page load, with the usage events of its time counted', () => {
    const r1 = list.find(s => s.id === 'r:aaaa1111-r1');

    expect(r1).toMatchObject({ replay: true, user: 'a@x.ch', events: 4, start: T, end: T + 9000, cmds: 2, errors: 1 });
    expect(list.filter(s => s.replay).length).toBe(2);
  });

  test('a usage visit a recording covers is not listed twice, the others are', () => {
    expect(list.filter(s => !s.replay).map(s => s.url)).toEqual(['/later']);
  });

  test('the page loads of one tab are one recording, its pages joined', () => {
    const two = sessionsOf([{ ...batch('r9', 'a@x.ch', '1.2.3.4', 0, 1000), url: '/de/new' }, { ...batch('r9', 'a@x.ch', '1.2.3.4', 5000, 6000), url: '/de/tree' }, { ...batch('r9', 'a@x.ch', '1.2.3.4', 7000, 8000), url: '/de/tree' }], []);

    expect(two.length).toBe(1);
    expect(two[0].url).toBe('/de/new → /de/tree');
    expect(eventsOf(two[0]).length).toBe(6);
  });

  test('eventsOf gives the rrweb events in time order', () => {
    expect(eventsOf(list.find(s => s.id === 'r:aaaa1111-r1')).map(e => e.timestamp - T)).toEqual([0, 1000, 5000, 9000]);
  });

  test('filters and groups by address and user', () => {
    expect(filterSessions(list, { user: 'A@X' }).length).toBe(1);
    expect(filterSessions(list, { ip: '5.6.' }).map(s => s.id)).toEqual(['r:aaaa1111-r2']);
    expect(filterSessions(list, { replay: true, minSecs: 5 }).length).toBe(1);
    expect(groupSessions(list, 'ip').map(g => g.key).sort()).toEqual(['1.2.3.4', '5.6.7.8']);
    expect(groupSessions(list, 'user').map(g => g.key)).toContain('(not logged in)');
  });
});

describe('log files and the player page', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'wb-replay-'));

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  test('readLog reads the days asked for and skips broken lines', () => {
    writeFileSync(resolve(dir, '2026-10-30.jsonl'), '{"a":1}\nnot json\n');
    writeFileSync(resolve(dir, '2026-10-31.jsonl'), '{"a":2}\n');
    writeFileSync(resolve(dir, 'other.txt'), '{"a":3}\n');

    expect(readLog(dir).map(r => r.a)).toEqual([1, 2]);
    expect(readLog(dir, { from: '2026-10-31' }).map(r => r.a)).toEqual([2]);
    expect(readLog(resolve(dir, 'none'))).toEqual([]);
  });

  test('playerPage is one file with the events inline, and a script tag in the data cannot end it', () => {
    const page = playerPage([{ type: 4, timestamp: 1, data: { width: 400, height: 300, href: 'x' } }, { type: 2, timestamp: 2, data: { text: '</script><b>' } }], { title: 'a<b', vendor: resolve(import.meta.dir, '..', 'vendor', 'session') });

    expect(page).toContain('rrwebPlayer');
    expect(page).toContain('<title>a&lt;b</title>');
    expect(page).toContain('<\\/script><b>');
    expect(page).toContain('w: 400, h: 300');
  });
});

describe('POST /api/replay', () => {
  test('stores rrweb batches with who sent them, refuses junk', async () => {
    const dataDir = mkdtempSync(resolve(tmpdir(), 'wb-data-'));
    const { recordReplay } = await import('../server/events.js');
    const post = body => recordReplay(new Request('http://x/api/replay', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'x-forwarded-for': '9.9.9.9' } }), { dataDir });

    expect((await post({ rid: 'ab', url: '/de/new', events: [{ type: 2, timestamp: 5, data: {} }, { type: 'x' }, null] })).status).toBe(204);
    expect((await post('{nope')).status).toBe(400);
    expect((await post({ events: [] })).status).toBe(204);

    const file = readFileSync(resolve(dataDir, 'replay', `${new Date().toISOString().slice(0, 10)}.jsonl`), 'utf8').trim().split('\n');

    expect(file.length).toBe(1);
    expect(JSON.parse(file[0])).toMatchObject({ rid: 'ab', ip: '9.9.9.9', url: '/de/new', events: [{ type: 2, timestamp: 5 }] });

    rmSync(dataDir, { recursive: true, force: true });
  });
});

describe('purgeReplay', () => {
  test('removes the day files older than 30 days and nothing else', () => {
    const dataDir = mkdtempSync(resolve(tmpdir(), 'wb-purge-'));
    const dir = resolve(dataDir, 'replay');
    const now = Date.parse('2026-10-31T12:00:00Z');

    mkdirSync(dir);
    for(const f of ['2026-09-30.jsonl', '2026-10-01.jsonl', '2026-10-31.jsonl', 'notes.txt']) writeFileSync(resolve(dir, f), '{}\n');

    expect(purgeReplay({ dataDir, now })).toEqual(['2026-09-30.jsonl']);
    expect(existsSync(resolve(dir, '2026-10-01.jsonl'))).toBe(true);
    expect(existsSync(resolve(dir, 'notes.txt'))).toBe(true);
    expect(purgeReplay({ dataDir: resolve(dataDir, 'none'), now })).toEqual([]);
    rmSync(dataDir, { recursive: true, force: true });
  });
});
