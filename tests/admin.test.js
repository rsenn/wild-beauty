// bun test: server/admin.js (the admin panel's data and routes)
import { beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { open } from '../server/db/db.js';
import { insertNode } from '../server/db/nodes.js';
import { adminRoute, isAdmin, recording, sessions, summary, users } from '../server/admin.js';
import { loginRoute, saveUser, viewerOf } from '../server/auth.js';

let h, dataDir;

const req = (path, headers = {}, method = 'GET', body) => new Request(`http://x${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body && JSON.stringify(body) });

async function cookieFor(username, password) {
  const res = await loginRoute(req('/api/login', { 'x-real-ip': '2.2.2.2' }, 'POST', { username, password }), h);

  return res.headers.get('set-cookie')?.split(';')[0];
}

const NOW = Date.parse('2026-10-31T12:00:00Z');
const day = '2026-10-31';

beforeEach(async () => {
  h = await open(':memory:');
  dataDir = mkdtempSync(resolve(tmpdir(), 'wb-admin-'));

  await saveUser(h, { email: 'root@example.org', password: 'pw-root' });
  await saveUser(h, { email: 'user@example.org', password: 'pw-user' });
  h.run("UPDATE users SET is_admin = 1 WHERE email = 'root@example.org'");
  insertNode(h, { title: 'a', doc: { n: 1 } });

  mkdirSync(resolve(dataDir, 'events'));
  mkdirSync(resolve(dataDir, 'replay'));
  writeFileSync(resolve(dataDir, 'events', `${day}.jsonl`), [{ ts: NOW - 60000, who: 'tester-1', sid: 'aaaa1111', ip: '1.2.3.4', type: 'session', url: '/de/new' }, { ts: NOW - 3600000 * 5, who: 'tester-2', sid: 'bbbb2222', ip: '5.6.7.8', type: 'session', url: '/' }].map(r => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(resolve(dataDir, 'replay', `${day}.jsonl`), JSON.stringify({ ts: NOW, who: 'tester-1', sid: 'aaaa1111', rid: 'r1', ip: '1.2.3.4', user: 'user@example.org', url: '/de/new', events: [{ type: 2, timestamp: NOW - 50000, data: {} }, { type: 3, timestamp: NOW - 40000, data: {} }] }) + '\n');
});

describe('admin data', () => {
  test('viewerOf carries the admin flag only for an admin', async () => {
    const root = await cookieFor('root@example.org', 'pw-root');
    const user = await cookieFor('user@example.org', 'pw-user');

    expect(isAdmin(viewerOf(h, req('/', { cookie: root })))).toBe(true);
    expect(isAdmin(viewerOf(h, req('/', { cookie: user })))).toBe(false);
    expect(viewerOf(h, req('/', { cookie: user }))).not.toHaveProperty('admin');
  });

  test('summary counts nodes, accounts, sessions and the active browsers', async () => {
    await cookieFor('root@example.org', 'pw-root');

    const flat = Object.fromEntries(summary(h, { dataDir, now: Date.now() }).groups.flatMap(g => g.items));

    expect(flat.accounts).toBe(2);
    expect(flat.admins).toBe(1);
    expect(flat.nodes).toBe(1);
    expect(flat['logged-in sessions (valid)']).toBe(1);

    const at = Object.fromEntries(summary(h, { dataDir, now: NOW }).groups.flatMap(g => g.items));

    expect(at['browsers active in the last 15 min']).toBe(1);
    expect(at['usage log']).toContain('1 days');
  });

  test('users: counts per account', () => {
    expect(users(h).map(u => [u.email, u.admin, u.nodes])).toEqual([['user@example.org', false, 0], ['root@example.org', true, 0]]);
  });

  test('sessions: filters, groups, and the recording of a session', () => {
    const q = s => new URLSearchParams(s);
    const opts = { dataDir, now: NOW };

    expect(sessions(q('days=7'), opts).sessions.map(s => s.id).sort()).toEqual(['r:aaaa1111-r1', 'u:bbbb2222-' + (NOW - 3600000 * 5).toString(36)].sort());
    expect(sessions(q('replay=1&user=USER@'), opts).sessions.length).toBe(1);
    expect(sessions(q('by=ip'), opts).groups.map(g => g.key).sort()).toEqual(['1.2.3.4', '5.6.7.8']);
    expect(recording('r:aaaa1111-r1', { dataDir }).length).toBe(2);
    expect(recording('r:../../x', { dataDir })).toBeNull();
    expect(recording('r:aaaa1111-nope', { dataDir })).toBeNull();
  });
});

describe('admin routes', () => {
  test('a visitor and a plain user get a 404, an admin gets the data, only GET', async () => {
    const root = await cookieFor('root@example.org', 'pw-root');
    const user = await cookieFor('user@example.org', 'pw-user');
    const get = (path, cookie, method = 'GET') => adminRoute(req(path, cookie ? { cookie } : {}, method), path.split('?')[0], h, { dataDir });

    expect((await get('/api/admin/summary')).status).toBe(404);
    expect((await get('/api/admin/users', user)).status).toBe(404);
    expect((await get('/api/admin/summary', root, 'POST')).status).toBe(404);
    expect(await get('/api/other', root)).toBeNull();

    expect((await (await get('/api/admin/users', root)).json()).users.length).toBe(2);
    expect((await (await get('/api/admin/sessions?replay=1', root)).json()).sessions.length).toBe(1);
    expect((await (await get('/api/admin/recording/r:aaaa1111-r1', root)).json()).events.length).toBe(2);
    expect((await get('/api/admin/recording/r:aaaa1111-zz', root)).status).toBe(404);

    const page = await get('/api/admin/recording/r:aaaa1111-r1/page', root);

    expect(page.headers.get('content-disposition')).toContain('attachment');
    expect(await page.text()).toContain('rrwebPlayer');
    rmSync(dataDir, { recursive: true, force: true });
  });
});
