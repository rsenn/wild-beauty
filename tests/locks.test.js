// bun test: editor locks (server/api/locks.js, server/db/nodes.js lock functions)
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { getNode, insertNode, takeLock, getLock } from '../server/db/nodes.js';
import { lockRoute } from '../server/api/locks.js';
import { deleteNodeRoute, saveUpdate, removeNode } from '../server/api/nodes.js';
import { sessionFor } from '../server/session.js';

let h;
let id;
let t;
const clock = { now: () => t };
const doc = (title = '') => ({ v: 1, style: {}, mode: 'free', title, pages: [{ id: 'page0001', steps: [] }] });

// a request from a browser that has the session `token` (none: a new one)
const TOKENS = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
const as = (who, method = 'POST') => new Request('http://x/api/nodes/1/lock', { method, headers: who === undefined ? {} : { cookie: `wb-session=${TOKENS[who]}` } });
const holder = who => sessionFor(as(who)).holder;

beforeEach(async () => {
  h = await open(':memory:');
  id = insertNode(h, { title: 'n', doc: doc() }).id;
  t = 1_000_000;
});

describe('lock with a fake clock', () => {
  test('take, renew, expire and take over', async () => {
    const first = await lockRoute(as(0), String(id), h, clock);

    expect(first.status).toBe(200);
    expect((await first.json()).expires_at).toBe(t + 60000);

    // the other browser is refused, with the holder label and when it frees up
    t += 30000;

    const refused = await lockRoute(as(1), String(id), h, clock);
    const body = await refused.json();

    expect(refused.status).toBe(423);
    expect(body).toEqual({ error: 'locked', holder: holder(0).slice(0, 8), expires_at: 1_060_000 });
    expect(JSON.stringify(body)).not.toContain(TOKENS[0]);

    // the heartbeat renews: 30 s later the lock would have run out at 1_060_000 but now runs to 1_090_000
    const renewed = await lockRoute(as(0), String(id), h, clock);

    expect((await renewed.json()).expires_at).toBe(t + 60000);
    t += 59999;
    expect((await lockRoute(as(1), String(id), h, clock)).status).toBe(423);

    // 60 s without a heartbeat: expired, the other takes over
    t += 2;

    const taken = await lockRoute(as(1), String(id), h, clock);

    expect(taken.status).toBe(200);
    expect(getLock(h, id, t).holder).toBe(holder(1));
    expect((await lockRoute(as(0), String(id), h, clock)).status).toBe(423);
  });

  test('the holder keeps acquired_at while renewing, a taker gets a new one', () => {
    takeLock(h, id, 'a', { now: 100 });
    takeLock(h, id, 'a', { now: 200 });
    expect(getLock(h, id, 250).acquired_at).toBe(100);
    takeLock(h, id, 'b', { now: 61000 });
    expect(getLock(h, id, 61000)).toMatchObject({ holder: 'b', acquired_at: 61000 });
  });

  test('release: the holder frees it at once', async () => {
    await lockRoute(as(0), String(id), h, clock);

    expect((await lockRoute(as(0, 'DELETE'), String(id), h, clock)).status).toBe(204);
    expect(getLock(h, id, t)).toBeNull();
    expect((await lockRoute(as(1), String(id), h, clock)).status).toBe(200);
  });

  test("break: the owner removes another's lock; releasing nothing is fine", async () => {
    await lockRoute(as(0), String(id), h, clock);

    expect((await lockRoute(as(1, 'DELETE'), String(id), h, clock)).status).toBe(204);
    expect(getLock(h, id, t)).toBeNull();
    expect((await lockRoute(as(1, 'DELETE'), String(id), h, clock)).status).toBe(204);
  });

  test('unknown node, bad id, other methods', async () => {
    expect((await lockRoute(as(0), '999', h, clock)).status).toBe(404);
    expect((await lockRoute(as(0), 'abc', h, clock)).status).toBe(404);
    expect((await lockRoute(as(0, 'GET'), String(id), h, clock)).status).toBe(405);
  });
});

describe('sessions', () => {
  test('a request without a valid cookie gets a new session and the cookie back', async () => {
    const res = await lockRoute(as(undefined), String(id), h, clock);

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toMatch(/^wb-session=[0-9a-f-]{36}; Path=\/; HttpOnly; SameSite=Lax/);

    const known = await lockRoute(as(0), String(id), h, clock);

    expect(known.headers.get('set-cookie')).toBeNull();
    expect(sessionFor(new Request('http://x', { headers: { cookie: 'wb-session=../../x' } })).fresh).toBe(true);
  });
});

describe('a lock held by someone else blocks the node', () => {
  const opts = who => ({ holder: holder(who), now: clock.now });

  test('PUT and DELETE are 423 for the other browser, allowed for the holder and when nobody holds it', async () => {
    takeLock(h, id, holder(0), { now: t });

    const put = await saveUpdate(h, id, { rev: 1, doc: doc('x') }, opts(1));

    expect(put).toMatchObject({ status: 423, body: { error: 'locked', holder: holder(0).slice(0, 8) } });
    expect((await removeNode(h, id, opts(1))).status).toBe(423);
    expect(getNode(h, id)).toMatchObject({ rev: 1, title: 'n' });

    expect((await saveUpdate(h, id, { rev: 1, doc: doc('mine') }, opts(0))).status).toBe(200);
    expect(getNode(h, id).title).toBe('mine');
  });

  test('saving releases the holder\'s lock', async () => {
    takeLock(h, id, holder(0), { now: t });
    await saveUpdate(h, id, { rev: 1, doc: doc('x') }, opts(0));
    expect(getLock(h, id, t)).toBeNull();
  });

  test('an expired lock blocks nobody; no lock at all is fine', async () => {
    takeLock(h, id, holder(0), { now: t });
    t += 60001;
    expect((await saveUpdate(h, id, { rev: 1, doc: doc('late') }, opts(1))).status).toBe(200);
    expect((await removeNode(h, id, opts(1))).status).toBe(204);
  });

  test('over HTTP: the route reads the session cookie', async () => {
    takeLock(h, id, holder(0), { now: Date.now() });

    const req = new Request('http://x/api/nodes/1', { method: 'DELETE', headers: { cookie: `wb-session=${TOKENS[1]}` } });

    expect((await deleteNodeRoute(String(id), h, req)).status).toBe(423);
    expect(getNode(h, id)).not.toBeNull();
  });
});
