// bun test: server/push.js (web push for the personal sites) and the PWA start page
import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { open } from '../server/db/db.js';
import { insertNode } from '../server/db/nodes.js';
import { applyOp } from '../server/api/graph.js';
import { announce, authorization, latest, pushRoute, vapid } from '../server/push.js';
import { siteById } from '../server/sites.js';
import { manifestResponse } from '../server/pwa.js';

const site = siteById('janos');
const EP = 'https://push.example.net/send/abc';
let h, page;

const post = (path, body) => new Request(`http://x${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

beforeAll(async () => {
  await vapid(mkdtempSync(resolve(tmpdir(), 'wb-vapid-')));
});

beforeEach(async () => {
  h = await open(':memory:');
  page = insertNode(h, { title: 'Arbeiten', doc: { n: 1 }, kind: 'page' }).id;
  h.run("UPDATE nodes SET space = 'janos', slug = 'arbeiten', visibility = 'hidden', owner_id = 1 WHERE id = ?", page);
});

describe('subscriptions', () => {
  test('subscribe, again, unsubscribe; junk is refused', async () => {
    expect((await pushRoute(post('/api/push/subscribe', { endpoint: EP }), '/api/push/subscribe', h, site)).status).toBe(204);
    expect((await pushRoute(post('/api/push/subscribe', { endpoint: EP }), '/api/push/subscribe', h, site)).status).toBe(204);
    expect(h.get('SELECT COUNT(*) AS n FROM push_subscriptions').n).toBe(1);
    expect((await pushRoute(post('/api/push/subscribe', { endpoint: 'http://insecure' }), '/api/push/subscribe', h, site)).status).toBe(400);
    expect((await pushRoute(post('/api/push/unsubscribe', { endpoint: EP }), '/api/push/unsubscribe', h, site)).status).toBe(204);
    expect(h.get('SELECT COUNT(*) AS n FROM push_subscriptions').n).toBe(0);
  });

  test('the key is served, the latest page is the newest public one', async () => {
    expect((await (await pushRoute(new Request('http://x/api/push/key'), '/api/push/key', h, site)).json()).key).toMatch(/^[A-Za-z0-9_-]{87}$/);
    expect(latest(h, site)).toMatchObject({ url: '/', body: '' });
    h.run("UPDATE nodes SET visibility = 'public' WHERE id = ?", page);
    expect(latest(h, site)).toMatchObject({ url: '/arbeiten', body: 'Arbeiten', title: 'jános' });
  });
});

describe('sending', () => {
  test('the VAPID header carries a signature the public key verifies', async () => {
    const header = await authorization(EP, 1_800_000_000_000);
    const [, jwt, key] = /^vapid t=([^,]+), k=(.+)$/.exec(header);
    const [head, claims, sig] = jwt.split('.');
    const pub = await crypto.subtle.importKey('raw', Buffer.from(key, 'base64url'), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({ aud: 'https://push.example.net', sub: 'mailto:noreply@transistorisiert.ch' });
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, Buffer.from(sig, 'base64url'), new TextEncoder().encode(`${head}.${claims}`))).toBe(true);
  });

  test('announce pushes to every subscriber once a day, drops gone endpoints', async () => {
    for(const ep of [EP, 'https://push.example.net/send/gone']) h.run('INSERT INTO push_subscriptions (endpoint, site, created_at) VALUES (?, ?, 0)', ep, 'janos');

    const calls = [];
    const send = async (endpoint, init) => (calls.push([endpoint, init.headers.ttl]), { ok: !endpoint.endsWith('gone'), status: endpoint.endsWith('gone') ? 410 : 201 });
    const node = { id: page };

    expect(await announce(h, site, node, { send, now: 1000 })).toBe(1);
    expect(calls.length).toBe(2);
    expect(calls[0][1]).toBe('86400');
    expect(h.get('SELECT COUNT(*) AS n FROM push_subscriptions').n).toBe(1);
    expect(await announce(h, site, node, { send, now: 2000 })).toBe(0);
    expect(calls.length).toBe(2);
    expect(await announce(h, site, node, { send, now: 1000 + 25 * 3600 * 1000 })).toBe(1);
  });

  test('publishing a page through the graph op records the announcement, a node outside a site does not', async () => {
    applyOp(h, { op: 'visibility', id: page, visibility: 'public' }, { viewer: { id: 1 } });
    await Promise.resolve();
    expect(h.get('SELECT COUNT(*) AS n FROM push_sent WHERE node_id = ?', page).n).toBe(1);

    const other = insertNode(h, { title: 'x', doc: { n: 1 } }).id;

    h.run("UPDATE nodes SET owner_id = 1, visibility = 'hidden' WHERE id = ?", other);
    applyOp(h, { op: 'visibility', id: other, visibility: 'public' }, { viewer: { id: 1 } });
    await Promise.resolve();
    expect(h.get('SELECT COUNT(*) AS n FROM push_sent WHERE node_id = ?', other).n).toBe(0);
  });
});

describe('pwa', () => {
  test('the manifest of the site starts on /edit, the app on /new', async () => {
    expect((await manifestResponse(site).json()).start_url).toBe('/edit');
    expect((await manifestResponse(null).json()).start_url).toBe('/new');
  });
});
