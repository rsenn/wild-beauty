// bun test: guest accounts (docs/GUESTS.md): the first save makes a private guest, claiming keeps the works,
// logging in merges them, the sweep removes the forgotten ones
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { claimRoute, loginRoute, meRoute, registerRoute, saveUser, viewerOf } from '../server/auth.js';
import { guard } from '../server/guard.js';
import { GUEST_LIMITS, resetGuestRates, staleGuests, sweepGuests } from '../server/guests.js';
import { createNode, listedNodes, readNode, removeNode, visibilityRoute } from '../server/api/nodes.js';

let h;

const doc = (extra = {}) => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps: [] }], ...extra });
const req = (method, path, { cookie, ip = '1.1.1.1', body } = {}) => new Request(`http://x${path}`, { method, headers: { 'content-type': 'application/json', 'x-real-ip': ip, ...(cookie && { cookie }) }, body: body && JSON.stringify(body) });
const cookieOf = res => res.headers.getSetCookie().find(c => c.startsWith('wb-auth='))?.split(';')[0];

// a browser's first save -> { id, cookie }
async function firstSave(ip = '1.1.1.1', body = { doc: doc() }) {
  const res = await createNode(req('POST', '/api/nodes', { ip, body }), h);

  return { res, id: (await res.clone().json()).id, cookie: cookieOf(res) };
}

beforeEach(async () => {
  h = await open(':memory:');
  resetGuestRates();
});

describe('the first save', () => {
  test('makes a guest who owns a hidden node, and the answer carries their login cookie', async () => {
    const { res, id, cookie } = await firstSave();

    expect(res.status).toBe(201);
    expect(cookie).toMatch(/^wb-auth=[0-9a-f]{64}$/);

    const guest = viewerOf(h, req('GET', '/', { cookie }));

    expect(guest).toMatchObject({ guest: true, email: '' });
    expect(h.get('SELECT owner_id, visibility FROM nodes WHERE id = ?', id)).toEqual({ owner_id: guest.id, visibility: 'hidden' });
    expect(h.get('SELECT email, pw_hash FROM users WHERE id = ?', guest.id).email).toEndWith('@guest.invalid');
  });

  test('a second save by the same browser reuses the guest', async () => {
    const first = await firstSave();
    const second = await createNode(req('POST', '/api/nodes', { cookie: first.cookie, body: { doc: doc() } }), h);

    expect(second.status).toBe(201);
    expect(cookieOf(second)).toBeUndefined();
    expect(h.get('SELECT COUNT(*) AS n FROM users').n).toBe(1);
    expect(h.get('SELECT COUNT(*) AS n FROM nodes').n).toBe(2);
  });

  test('a first save that fails leaves no guest behind and does not count against the client', async () => {
    for(let i = 0; i < GUEST_LIMITS.perClientPerDay + 3; i++) expect((await createNode(req('POST', '/api/nodes', { body: { doc: 1 } }), h)).status).toBe(400);

    expect(h.get('SELECT COUNT(*) AS n FROM users').n).toBe(0);
    expect((await firstSave()).res.status).toBe(201);
  });

  test('on a personal site a login is needed, and a guest cannot make a site page', async () => {
    expect((await createNode(req('POST', '/api/nodes', { body: { doc: doc() } }), h, { space: 'janos' })).status).toBe(401);

    const { cookie } = await firstSave();

    expect((await createNode(req('POST', '/api/nodes', { cookie, body: { doc: doc() } }), h, { space: 'janos' })).status).toBe(403);
  });
});

describe('what is private', () => {
  test('another browser neither sees nor changes a guest\'s node, and a visitor has no list', async () => {
    const { id, cookie } = await firstSave();
    const guard_ = (r, path) => guard(r, path, h);

    expect((await readNode(req('GET', `/api/nodes/${id}`), String(id), h)).status).toBe(404);
    expect((await readNode(req('GET', `/api/nodes/${id}`, { cookie }), String(id), h)).status).toBe(200);
    expect((await guard_(req('PUT', `/api/nodes/${id}`), `/api/nodes/${id}`)).status).toBe(401);

    const other = (await firstSave('2.2.2.2')).cookie;

    expect((await guard_(req('PUT', `/api/nodes/${id}`, { cookie: other }), `/api/nodes/${id}`)).status).toBe(403);
    expect(await guard_(req('PUT', `/api/nodes/${id}`, { cookie }), `/api/nodes/${id}`)).toBeNull();
    expect(listedNodes(h, null)).toEqual([]);
    expect(listedNodes(h, viewerOf(h, req('GET', '/', { cookie }))).map(n => n.id)).toEqual([id]);
  });

  test('a guest cannot publish, but may hide again', async () => {
    const { id, cookie } = await firstSave();
    const post = visibility => visibilityRoute(req('POST', `/api/nodes/${id}/visibility`, { cookie, body: { visibility } }), String(id), h);

    expect((await post('public')).status).toBe(403);
    expect((await post('hidden')).status).toBe(200);
    expect(h.get('SELECT visibility FROM nodes WHERE id = ?', id).visibility).toBe('hidden');
  });

  test('ownerless nodes (the old open area) are changed by an admin only', async () => {
    h.run("INSERT INTO nodes (title, doc, created_at, updated_at) VALUES ('old', '{}', 1, 1)");

    const old = h.get('SELECT id FROM nodes').id;
    const { cookie } = await firstSave();

    expect((await guard(req('PUT', `/api/nodes/${old}`, { cookie }), `/api/nodes/${old}`, h)).status).toBe(403);
  });
});

describe('limits', () => {
  test('a guest holds at most 20 works', async () => {
    const { cookie } = await firstSave();

    for(let i = 1; i < GUEST_LIMITS.nodes; i++) expect((await createNode(req('POST', '/api/nodes', { cookie, body: { doc: doc() } }), h)).status).toBe(201);

    const res = await createNode(req('POST', '/api/nodes', { cookie, body: { doc: doc() } }), h);

    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('quota');
  });

  test('a client makes at most 20 guests a day', async () => {
    for(let i = 0; i < GUEST_LIMITS.perClientPerDay; i++) expect((await firstSave('3.3.3.3')).res.status).toBe(201);

    expect((await firstSave('3.3.3.3')).res.status).toBe(429);
    expect((await firstSave('4.4.4.4')).res.status).toBe(201);
  });
});

describe('keeping the work', () => {
  const claim = (cookie, body, ip) => claimRoute(req('POST', '/api/claim', { cookie, ip, body }), h);

  test('claiming needs a username and a password only; the same account and the same works go on', async () => {
    const { id, cookie } = await firstSave();
    const before = viewerOf(h, req('GET', '/', { cookie })).id;
    const res = await claim(cookie, { username: 'Mallow', password: 'secret1' });

    expect(res.status).toBe(200);

    const after = viewerOf(h, req('GET', '/', { cookie }));

    expect(after).toMatchObject({ id: before, username: 'Mallow', email: '' });
    expect(after.guest).toBeUndefined();
    expect(h.get('SELECT owner_id FROM nodes WHERE id = ?', id).owner_id).toBe(before);

    // the name and password now log in
    expect((await loginRoute(req('POST', '/api/login', { body: { username: 'mallow', password: 'secret1' } }), h)).status).toBe(204);
  });

  test('a mail address is optional and kept when given', async () => {
    const { cookie } = await firstSave();

    expect((await claim(cookie, { username: 'Mallow', password: 'secret1', email: 'm@example.org' })).status).toBe(200);
    expect(viewerOf(h, req('GET', '/', { cookie })).email).toBe('m@example.org');
  });

  test('refused: a taken name or address, a bad name, a short password, and a session that is not a guest', async () => {
    await saveUser(h, { email: 'a@example.org', password: 'pw-aaaa' });
    h.run("UPDATE users SET username = 'taken' WHERE email = 'a@example.org'");

    const { cookie } = await firstSave();

    expect((await claim(cookie, { username: 'Taken', password: 'secret1' })).status).toBe(409);
    expect((await claim(cookie, { username: 'fine', password: 'secret1', email: 'a@example.org' })).status).toBe(409);
    expect((await claim(cookie, { username: '!', password: 'secret1' })).status).toBe(400);
    expect((await claim(cookie, { username: 'fine', password: 'short' })).status).toBe(400);
    expect((await claim(cookie, { username: 'fine', password: 'secret1', email: 'x@guest.invalid' })).status).toBe(400);
    expect((await claim(undefined, { username: 'fine', password: 'secret1' })).status).toBe(401);
    expect(viewerOf(h, req('GET', '/', { cookie })).guest).toBe(true);
  });

  test('registering as a guest upgrades the same account', async () => {
    const { id, cookie } = await firstSave();
    const guestId = viewerOf(h, req('GET', '/', { cookie })).id;
    const res = await registerRoute(req('POST', '/api/register', { cookie, body: { email: 'new@example.org', password: 'secret1' } }), h);

    expect(res.status).toBe(201);
    expect(viewerOf(h, req('GET', '/', { cookie }))).toMatchObject({ id: guestId, email: 'new@example.org' });
    expect(h.get('SELECT owner_id FROM nodes WHERE id = ?', id).owner_id).toBe(guestId);
    expect(h.get('SELECT COUNT(*) AS n FROM users').n).toBe(1);
  });

  test('nobody can log in as a guest, or register the placeholder address', async () => {
    await firstSave();

    const email = h.get('SELECT email FROM users').email;

    expect((await loginRoute(req('POST', '/api/login', { body: { username: email, password: '!' } }), h)).status).toBe(401);
    expect((await registerRoute(req('POST', '/api/register', { body: { email: 'guest-x@guest.invalid', password: 'secret1' } }), h)).status).toBe(409);
  });

  test('logging in to an account takes the guest\'s works along when asked', async () => {
    await saveUser(h, { email: 'a@example.org', password: 'pw-aaaa' });

    const account = h.get("SELECT id FROM users WHERE email = 'a@example.org'").id;
    const { id, cookie } = await firstSave();
    const login = merge => loginRoute(req('POST', '/api/login', { cookie, body: { username: 'a@example.org', password: 'pw-aaaa', merge } }), h);

    expect((await login(false)).status).toBe(204);
    expect(h.get('SELECT owner_id FROM nodes WHERE id = ?', id).owner_id).not.toBe(account);

    expect((await login(true)).status).toBe(204);
    expect(h.get('SELECT owner_id, visibility FROM nodes WHERE id = ?', id)).toEqual({ owner_id: account, visibility: 'hidden' });
    expect(h.get('SELECT COUNT(*) AS n FROM users WHERE guest = 1').n).toBe(0);
  });

  test('/api/me tells a guest how many works they hold and until when they are kept', async () => {
    const { cookie } = await firstSave();
    const { user } = await meRoute(req('GET', '/api/me', { cookie }), h).json();

    expect(user).toMatchObject({ guest: true, works: 1 });
    expect(user.until).toBeGreaterThan(Date.now());
  });
});

describe('expiry', () => {
  const DAY = 24 * 3600 * 1000;

  test('guests unseen for 30 days go with their works; the others stay', async () => {
    const old = await firstSave('5.5.5.5');
    const fresh = await firstSave('6.6.6.6');
    const oldId = viewerOf(h, req('GET', '/', { cookie: old.cookie })).id;

    h.run('UPDATE users SET last_seen = ? WHERE id = ?', Date.now() - 31 * DAY, oldId);

    expect(staleGuests(h)).toEqual([oldId]);
    expect(await sweepGuests(h, (node, guest) => removeNode(h, node, { viewer: { id: guest } }))).toBe(1);
    expect(h.get('SELECT 1 AS there FROM nodes WHERE id = ?', old.id)).toBeNull();
    expect(h.get('SELECT 1 AS there FROM nodes WHERE id = ?', fresh.id)).not.toBeNull();
    expect(h.get('SELECT COUNT(*) AS n FROM users').n).toBe(1);
    expect(h.get('SELECT COUNT(*) AS n FROM sessions').n).toBe(1);
  });

  test('a visit renews the 30 days', async () => {
    const { cookie } = await firstSave();
    const row = () => h.get('SELECT id, last_seen FROM users');
    const day40 = Date.now() + 40 * DAY;

    h.run('UPDATE users SET last_seen = ?', Date.now() - 29 * DAY);
    h.run('UPDATE sessions SET expires_at = ?', Date.now() + DAY);

    expect(viewerOf(h, req('GET', '/', { cookie }), Date.now())).toMatchObject({ guest: true });
    expect(row().last_seen).toBeGreaterThan(Date.now() - DAY);
    expect(staleGuests(h, Date.now() + 29 * DAY)).toEqual([]);
    expect(staleGuests(h, day40)).toEqual([row().id]);
    expect(viewerOf(h, req('GET', '/', { cookie }), Date.now() + 20 * DAY)).not.toBeNull();
  });

  test('a work that cannot be removed now keeps its guest for the next sweep', async () => {
    const { cookie } = await firstSave();

    h.run('UPDATE users SET last_seen = 1');

    expect(await sweepGuests(h, async () => ({ status: 423 }))).toBe(0);
    expect(h.get('SELECT COUNT(*) AS n FROM users').n).toBe(1);
    expect(viewerOf(h, req('GET', '/', { cookie }))).not.toBeNull();
  });
});
