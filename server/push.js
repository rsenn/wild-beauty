// Web push for the personal sites (docs/SITES.md S15): a visitor who allows it gets a notification when a new page is
// published. The push carries no content (so no payload encryption is needed): the service worker asks
// /api/push/latest what is new. Messages are signed with a VAPID key pair, made once in data/vapid.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';
import { siteById } from './sites.js';

const SUBJECT = 'mailto:noreply@transistorisiert.ch';
const MIN_GAP = 24 * 3600 * 1000; // a page that is published again within a day is not announced again
const b64 = bytes => Buffer.from(bytes).toString('base64url');

let keys = null;

// { publicKey: base64url of the raw point, private: CryptoKey, jwk } (made on first use)
export async function vapid(dataDir = config.dataDir) {
  if(keys) return keys;

  const file = resolve(dataDir, 'vapid.json');
  let stored = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;

  if(!stored) {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

    stored = { publicKey: b64(await crypto.subtle.exportKey('raw', pair.publicKey)), jwk: await crypto.subtle.exportKey('jwk', pair.privateKey) };
    writeFileSync(file, JSON.stringify(stored), { mode: 0o600 });
  }

  keys = { publicKey: stored.publicKey, private: await crypto.subtle.importKey('jwk', stored.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']) };

  return keys;
}

// the Authorization header of a push to `endpoint` (RFC 8292)
export async function authorization(endpoint, now = Date.now()) {
  const { publicKey, private: key } = await vapid();
  const part = value => b64(JSON.stringify(value));
  const head = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: SUBJECT })}`;
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(head));

  return `vapid t=${head}.${b64(signature)}, k=${publicKey}`;
}

const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
const valid = endpoint => typeof endpoint === 'string' && endpoint.length < 1000 && /^https:\/\//.test(endpoint);

// the latest published page of a site: what the notification says -> { title, url }
export function latest(h, site) {
  const page = h.get("SELECT title, slug FROM nodes WHERE space = ? AND kind = 'page' AND slug IS NOT NULL AND visibility = 'public' ORDER BY updated_at DESC, id DESC LIMIT 1", site.id);

  return { title: site.title, body: page?.title ?? '', url: page ? `/${page.slug}` : '/', icon: site.icon };
}

// GET /api/push/key, GET /api/push/latest, POST /api/push/subscribe | unsubscribe { endpoint } on a site host
export async function pushRoute(req, pathname, h, site) {
  if(pathname === '/api/push/key' && req.method === 'GET') return json({ key: (await vapid()).publicKey });
  if(pathname === '/api/push/latest' && req.method === 'GET') return json(latest(h, site));
  if(req.method !== 'POST' || (pathname !== '/api/push/subscribe' && pathname !== '/api/push/unsubscribe')) return json({ error: 'not_found' }, 404);

  const body = await req.json().catch(() => null);

  if(!valid(body?.endpoint)) return json({ error: 'invalid' }, 400);

  if(pathname.endsWith('/unsubscribe')) h.run('DELETE FROM push_subscriptions WHERE endpoint = ? AND site = ?', body.endpoint, site.id);
  else h.run('INSERT INTO push_subscriptions (endpoint, site, created_at) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET site = excluded.site', body.endpoint, site.id, Date.now());

  return new Response(null, { status: 204 });
}

// tell the subscribers of `site` that `node` was published; each push is sent once, gone endpoints are dropped.
// `send(endpoint, headers)` is fetch unless a test gives another. -> number of pushes sent
export async function announce(h, site, node, { send = fetch, now = Date.now() } = {}) {
  const sent = h.get('SELECT at FROM push_sent WHERE node_id = ?', node.id);

  if(sent && now - sent.at < MIN_GAP) return 0;

  h.run('INSERT INTO push_sent (node_id, at) VALUES (?, ?) ON CONFLICT(node_id) DO UPDATE SET at = excluded.at', node.id, now);

  let n = 0;

  for(const { endpoint } of h.all('SELECT endpoint FROM push_subscriptions WHERE site = ?', site.id)) {
    try {
      const res = await send(endpoint, { method: 'POST', headers: { authorization: await authorization(endpoint, now), ttl: '86400', urgency: 'normal', 'content-length': '0' } });

      if(res.status === 404 || res.status === 410) h.run('DELETE FROM push_subscriptions WHERE endpoint = ?', endpoint);
      else if(res.ok) n++;
    } catch {}
  }

  return n;
}

// a node became public: if it is a page of a personal site, announce it (in the background, errors are not the caller's)
export function published(h, id) {
  const node = h.get("SELECT id, title, space, kind, slug FROM nodes WHERE id = ? AND space IS NOT NULL AND kind = 'page' AND slug IS NOT NULL", id);
  const site = node && siteById(node.space);

  if(site) announce(h, site, node).catch(() => {});
}
