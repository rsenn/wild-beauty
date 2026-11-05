// bun test: the profile of a user (docs/PROFILE.md): server/api/profile.js, prefs in viewerOf
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { DEFAULT_PREFS, loginRoute, prefsOf, saveUser, viewerOf } from '../server/auth.js';
import { profileRoute } from '../server/api/profile.js';
import { getNode } from '../server/db/nodes.js';

let h, cookie, cookie2;

const req = (method, path, { body, c = cookie } = {}) => new Request(`http://x${path}`, { method, headers: { 'content-type': 'application/json', ...(c && { cookie: c }) }, body: body && JSON.stringify(body) });
const call = (method, path, body, c) => profileRoute(req(method, path, { body, c }), path, h);

async function login(username, password, ip) {
  const res = await loginRoute(new Request('http://x/api/login', { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': ip }, body: JSON.stringify({ username, password }) }), h);

  return res.headers.get('set-cookie').split(';')[0];
}

beforeEach(async () => {
  h = await open(':memory:');
  await saveUser(h, { email: 'a@example.org', password: 'pw-aaaaaa', name: 'A' });
  await saveUser(h, { email: 'b@example.org', password: 'pw-bbbbbb' });
  cookie = await login('a@example.org', 'pw-aaaaaa', '1.1.1.1');
  cookie2 = await login('b@example.org', 'pw-bbbbbb', '2.2.2.2');
});

describe('prefsOf', () => {
  test('defaults, stored values over them, junk ignored', () => {
    expect(prefsOf(null)).toEqual(DEFAULT_PREFS);
    expect(prefsOf('{"visibility":"public","x":"y"}')).toEqual({ ...DEFAULT_PREFS, visibility: 'public' });
    expect(prefsOf('not json')).toEqual(DEFAULT_PREFS);
  });
});

describe('/api/profile', () => {
  test('a visitor is asked to log in', async () => {
    expect((await call('GET', '/api/profile', undefined, null)).status).toBe(401);
    expect((await call('PUT', '/api/profile', { name: 'x' }, null)).status).toBe(401);
  });

  test('read, change a few fields, the rest stays', async () => {
    const first = (await (await call('GET', '/api/profile')).json()).profile;

    expect(first).toMatchObject({ email: 'a@example.org', username: '', name: 'A', pseudonym: '', rootId: null, prefs: DEFAULT_PREFS });

    const r = await call('PUT', '/api/profile', { username: 'jane', pseudonym: ' Jane Doe ', prefs: { visibility: 'public' } });

    expect(r.status).toBe(200);
    expect((await r.json()).profile).toMatchObject({ username: 'jane', name: 'A', pseudonym: 'Jane Doe', prefs: { ...DEFAULT_PREFS, visibility: 'public' } });

    const viewer = viewerOf(h, req('GET', '/', {}));

    expect(viewer).toMatchObject({ username: 'jane', pseudonym: 'Jane Doe', prefs: { visibility: 'public' } });
  });

  test('the username is the second name to log in with, unique, checked, removable', async () => {
    expect((await call('PUT', '/api/profile', { username: 'jane' })).status).toBe(200);
    expect(await login('JANE', 'pw-aaaaaa', '3.3.3.3')).toMatch(/^wb_|=/);
    expect((await call('PUT', '/api/profile', { username: 'jane' }, cookie2)).status).toBe(409);
    expect((await call('PUT', '/api/profile', { username: 'a@b' })).status).toBe(400);
    expect((await call('PUT', '/api/profile', { username: 'x' })).status).toBe(400);
    expect((await (await call('PUT', '/api/profile', { username: '' })).json()).profile.username).toBe('');
  });

  test('bad input is refused and changes nothing', async () => {
    for(const body of [{ name: 5 }, { pseudonym: 'x'.repeat(101) }, { prefs: { visibility: 'maybe' } }, { prefs: { other: 'x' } }, { prefs: { titlePattern: 'x'.repeat(201) } }, [], null]) expect((await call('PUT', '/api/profile', body)).status).toBe(400);

    expect((await (await call('GET', '/api/profile')).json()).profile.name).toBe('A');
  });
});

describe('/api/profile/avatar', () => {
  test('makes the root node once, owned and hidden, and makes a new one when it is gone', async () => {
    await call('PUT', '/api/profile', { pseudonym: 'Jane Doe' });

    const r = await call('POST', '/api/profile/avatar');
    const { id } = await r.json();

    expect(r.status).toBe(201);
    expect(getNode(h, id)).toMatchObject({ title: 'Jane Doe', visibility: 'hidden' });
    expect(h.get('SELECT owner_id FROM nodes WHERE id = ?', id).owner_id).toBeGreaterThan(0);
    expect((await (await call('POST', '/api/profile/avatar')).json()).id).toBe(id);
    expect((await (await call('GET', '/api/profile')).json()).profile.rootId).toBe(id);

    h.run('DELETE FROM nodes WHERE id = ?', id);

    expect((await (await call('GET', '/api/profile')).json()).profile.rootId).toBeNull();

    const again = (await (await call('POST', '/api/profile/avatar')).json()).id;

    expect(getNode(h, again)).toBeTruthy(); // (SQLite may reuse the freed id)
    expect((await (await call('GET', '/api/profile')).json()).profile.rootId).toBe(again);
  });
});
