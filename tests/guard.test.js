// bun test: server/guard.js, server/auth.js, canView
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { insertNode } from '../server/db/nodes.js';
import { guard } from '../server/guard.js';
import { loginRoute, logoutRoute, meRoute, registerRoute, saveUser, viewerOf } from '../server/auth.js';
import { canView, listedNodes, visibilityRoute, visibleNodes } from '../server/api/nodes.js';
import { applyOp, graphOf } from '../server/api/graph.js';

let h, mine, theirs, community, owner, other;

const req = (method, path, { headers = {}, body } = {}) => new Request(`http://x${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body && JSON.stringify(body) });

async function cookieFor(username, password, ip = '1.1.1.1') {
  const res = await loginRoute(req('POST', '/api/login', { headers: { 'x-real-ip': ip }, body: { username, password } }), h);

  return { res, cookie: res.headers.get('set-cookie')?.split(';')[0] };
}

beforeEach(async () => {
  h = await open(':memory:');
  owner = (await saveUser(h, { email: 'a@example.org', password: 'pw-a' })).id;
  other = (await saveUser(h, { email: 'b@example.org', password: 'pw-b' })).id;
  mine = insertNode(h, { title: 'home', doc: { n: 1 } }).id;
  theirs = insertNode(h, { title: 'theirs', doc: { n: 1 } }).id;
  community = insertNode(h, { title: 'community', doc: { n: 1 } }).id;
  h.run('UPDATE nodes SET space = ?, owner_id = ? WHERE id = ?', 'janos', owner, mine);
  h.run('UPDATE nodes SET space = ?, owner_id = ? WHERE id = ?', 'other', other, theirs);
});

describe('login', () => {
  test('a right password gives a session cookie, a wrong one does not', async () => {
    const ok = await cookieFor('A@Example.org', 'pw-a');

    expect(ok.res.status).toBe(204);
    expect(ok.cookie).toMatch(/^wb-auth=[0-9a-f]{64}$/);
    expect(viewerOf(h, req('GET', '/', { headers: { cookie: ok.cookie } }))).toMatchObject({ id: owner, email: 'a@example.org' });
    expect((await cookieFor('a@example.org', 'nope')).res.status).toBe(401);
    expect((await cookieFor('nobody@example.org', 'pw-a')).res.status).toBe(401);
  });

  test('the password is stored as a hash and the token only as its hash', async () => {
    const { cookie } = await cookieFor('a@example.org', 'pw-a');

    expect(h.get('SELECT pw_hash FROM users WHERE id = ?', owner).pw_hash).toStartWith('$argon2id$');
    expect(h.all('SELECT token_hash FROM sessions').every(s => !cookie.includes(s.token_hash))).toBe(true);
  });

  test('too many failures from one client are refused', async () => {
    for(let i = 0; i < 10; i++) await cookieFor('a@example.org', 'bad', '9.9.9.9');

    expect((await cookieFor('a@example.org', 'pw-a', '9.9.9.9')).res.status).toBe(429);
  });

  test('logout ends the session', async () => {
    const { cookie } = await cookieFor('a@example.org', 'pw-a');

    logoutRoute(req('POST', '/api/logout', { headers: { cookie } }), h);
    expect(viewerOf(h, req('GET', '/', { headers: { cookie } }))).toBeNull();
    expect(await (await meRoute(req('GET', '/api/me'), h)).json()).toEqual({ user: null });
  });
});

describe('guard', () => {
  const run = r => guard(r, new URL(r.url).pathname, h);
  const cookies = async () => ({ a: (await cookieFor('a@example.org', 'pw-a')).cookie, b: (await cookieFor('b@example.org', 'pw-b')).cookie });

  test('the open public area: nobody owns it, everybody writes it', async () => {
    const { a } = await cookies();

    for(const headers of [{}, { cookie: a }]) {
      expect(await run(req('PUT', `/api/nodes/${community}`, { headers }))).toBeNull();
      expect(await run(req('POST', '/api/nodes', { headers }))).toBeNull();
      expect(await run(req('POST', '/api/graph/ops', { headers, body: { ops: [{ op: 'move', id: community, x: 1, y: 1 }] } }))).toBeNull();
    }
  });

  test('a node of a user is written by its owner only', async () => {
    const { a, b } = await cookies();

    for(const [m, p] of [['PUT', `/api/nodes/${mine}`], ['DELETE', `/api/nodes/${mine}`], ['POST', `/api/nodes/${mine}/lock`], ['PUT', `/api/nodes/${mine}/large`], ['POST', `/api/nodes/${mine}/visibility`]]) {
      expect(await run(req(m, p, { headers: { cookie: a } }))).toBeNull();
      expect((await run(req(m, p, { headers: { cookie: b } })))?.status).toBe(403);
      expect((await run(req(m, p)))?.status).toBe(401);
    }

    expect(await run(req('GET', `/api/nodes/${mine}`))).toBeNull();
  });

  test('graph ops change what they change: the from of a link, the node of a move', async () => {
    const { a } = await cookies();
    const ops = ops => req('POST', '/api/graph/ops', { headers: { cookie: a }, body: { ops } });

    expect(await run(ops([{ op: 'link', from: mine, to: theirs }]))).toBeNull(); // pointing at a node is fine, the route checks it is visible
    expect((await run(ops([{ op: 'link', from: theirs, to: mine }])))?.status).toBe(403);
    expect((await run(ops([{ op: 'move', id: theirs, x: 1, y: 1 }])))?.status).toBe(403);
    expect(await run(ops([{ op: 'group', ids: [community, mine], x: 1, y: 1 }]))).toBeNull();
  });
});

describe('registration', () => {
  const register = (body, ip = '2.2.2.2') => registerRoute(req('POST', '/api/register', { headers: { 'x-real-ip': ip }, body }), h);

  test('a new account is logged in and can log in again', async () => {
    const res = await register({ email: 'New@Example.org', password: 'secret' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ user: { email: 'New@Example.org' } });
    expect(viewerOf(h, req('GET', '/', { headers: { cookie: res.headers.get('set-cookie').split(';')[0] } }))?.email).toBe('New@Example.org');
    expect((await cookieFor('new@example.org', 'secret')).res.status).toBe(204);
  });

  test('little is asked, but a mail address and 6 characters are', async () => {
    expect((await register({ email: 'nope', password: 'secret' })).status).toBe(400);
    expect((await register({ email: 'x@example.org', password: '12345' })).status).toBe(400);
    expect((await register({ email: 'x@example.org', password: 'abcdef' })).status).toBe(201);
  });

  test('a taken address, too many accounts, a closed registration', async () => {
    expect((await register({ email: 'A@example.org', password: 'secret' })).status).toBe(409);

    for(let i = 0; i < 5; i++) await register({ email: `n${i}@example.org`, password: 'secret' }, '3.3.3.3');

    expect((await register({ email: 'late@example.org', password: 'secret' }, '3.3.3.3')).status).toBe(429);

    process.env.WB_REGISTRATION = 'closed';
    expect((await register({ email: 'c@example.org', password: 'secret' }, '4.4.4.4')).status).toBe(403);
    delete process.env.WB_REGISTRATION;
  });
});

describe('canView', () => {
  const row = id => h.get('SELECT * FROM nodes WHERE id = ?', id);

  test('a node of a site is seen by its owner only', () => {
    expect(canView(row(community), null)).toBe(true);
    expect(canView(row(mine), null)).toBe(false);
    expect(canView(row(mine), { id: other })).toBe(false);
    expect(canView(row(mine), { id: owner })).toBe(true);
  });

  test('a hidden node is seen by its owner, a public one by everybody', () => {
    const own = insertNode(h, { title: 'own', doc: { n: 1 } }).id;

    h.run("UPDATE nodes SET owner_id = ?, visibility = 'hidden' WHERE id = ?", owner, own);
    expect(canView(row(own), null)).toBe(false);
    expect(canView(row(own), { id: other })).toBe(false);
    expect(canView(row(own), { id: owner })).toBe(true);

    h.run("UPDATE nodes SET visibility = 'public' WHERE id = ?", own);
    expect(canView(row(own), null)).toBe(true);
    expect(canView(row(own), { id: other })).toBe(true);
  });
});

describe('visibility and the editor list', () => {
  test('the owner makes a node public, then it is in the tree and not in the others editor list', async () => {
    const own = insertNode(h, { title: 'own', doc: { n: 1 } }).id;

    h.run("UPDATE nodes SET owner_id = ?, visibility = 'hidden' WHERE id = ?", owner, own);

    const ids = (list) => list.map(n => n.id);
    const asOwner = { id: owner };
    const asOther = { id: other };

    expect(ids(visibleNodes(h, null))).not.toContain(own);
    expect(ids(listedNodes(h, asOwner))).toContain(own);

    const res = await visibilityRoute(req('POST', `/api/nodes/${own}/visibility`, { body: { visibility: 'public' } }), String(own), h);

    expect(res.status).toBe(200);
    expect(ids(visibleNodes(h, null))).toContain(own);
    expect(ids(visibleNodes(h, asOther))).toContain(own);
    expect(ids(listedNodes(h, asOther))).not.toContain(own); // a user's editor lists their own nodes only
    expect(ids(listedNodes(h, null))).toEqual([community]); // a visitor's: the open public area
    expect(visibleNodes(h, asOther).find(n => n.id === own).mine).toBe(false);
    expect((await visibilityRoute(req('POST', `/api/nodes/${own}/visibility`, { body: { visibility: 'x' } }), String(own), h)).status).toBe(400);
  });
});

describe('publish from the graph, and the site out of the tree', () => {
  const own = () => {
    const id = insertNode(h, { title: 'own', doc: { n: 1 } }).id;

    h.run("UPDATE nodes SET owner_id = ?, visibility = 'hidden' WHERE id = ?", owner, id);

    return id;
  };

  test('the visibility op publishes and unpublishes an owned node, and leaves an ownerless one', () => {
    const id = own();

    expect(applyOp(h, { op: 'visibility', id, visibility: 'public' })).toBe(true);
    expect(h.get('SELECT visibility FROM nodes WHERE id = ?', id).visibility).toBe('public');
    expect(applyOp(h, { op: 'visibility', id, visibility: 'public' })).toBe(false); // nothing changed
    expect(applyOp(h, { op: 'visibility', id, visibility: 'hidden' })).toBe(true);
    expect(applyOp(h, { op: 'visibility', id: community, visibility: 'hidden' })).toBe(false);
    expect(() => applyOp(h, { op: 'visibility', id, visibility: 'secret' })).toThrow('bad_op');
  });

  test('only the owner may send it', async () => {
    const id = own();
    const run = (cookie, op) => guard(req('POST', '/api/graph/ops', { headers: { cookie }, body: { ops: [op] } }), '/api/graph/ops', h);
    const a = (await cookieFor('a@example.org', 'pw-a')).cookie;
    const b = (await cookieFor('b@example.org', 'pw-b')).cookie;

    expect(await run(a, { op: 'visibility', id, visibility: 'public' })).toBeNull();
    expect((await run(b, { op: 'visibility', id, visibility: 'public' }))?.status).toBe(403);
  });

  test('the nodes of a site are not in the tree or the gallery list, not even for their owner', () => {
    const ids = graphOf(h, { id: owner }).nodes.map(n => n.id);

    expect(ids).toContain(community);
    expect(ids).not.toContain(mine); // space 'janos', owned by `owner`
    expect(visibleNodes(h, { id: owner }).map(n => n.id)).not.toContain(mine);
    expect(listedNodes(h, { id: owner }).map(n => n.id)).toContain(mine); // but the user's own list has it
  });
});
