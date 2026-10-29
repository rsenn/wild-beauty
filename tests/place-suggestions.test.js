// bun test: place suggestions kept at save and answered in bulk (EDITOR.md E140, GRAPH.md S1.5)
import { afterAll, beforeAll, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { config } from '../server/config.js';
import { open } from '../server/db/db.js';
import { addLink, addSuggestions, insertNode } from '../server/db/nodes.js';
import { saveNew } from '../server/api/nodes.js';
import { applyOp } from '../server/api/graph.js';
import { pendingSuggestions, placesRoute } from '../server/api/places.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';
import { seed } from '../tools/seed.js';

setDefaultTimeout(30000);

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const saved = { ...config };
let root;
let h;
let ready = false;

const photo = (id, hash) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal' });
const doc = steps => ({ v: 1, style: {}, mode: 'free', pages: [{ id: 'page0001', steps }] });

// an upload as the upload endpoint leaves it, with an optional position in the sidecar
async function upload(hash, color, pos) {
  await run([...imagemagick.convert, '-size', '40x30', `xc:${color}`, resolve(config.uploadsDir, `${hash}.jpg`)]);
  await Bun.write(resolve(config.uploadsDir, `${hash}.json`), JSON.stringify({ hash, ext: 'jpg', display: `${hash}.jpg`, name: `${hash}.jpg`, palette: [{ hex: '#ff0000', weight: 1 }], padding: ['#ff0000', '#ff0000'], ...(pos && { pos }) }));
}

const post = (body, ops) => placesRoute(new Request('http://x/api/places/suggestions', ops ? { method: 'POST', body: JSON.stringify(body) } : undefined), h);
const get = () => post();

beforeAll(async () => {
  await detectTools();
  ready = !!(imagemagick.convert && Bun.which('jpegtran'));
  root = mkdtempSync(resolve(tmpdir(), 'wb-sugg-'));
  Object.assign(config, { uploadsDir: resolve(root, 'uploads'), tmpDir: resolve(root, 'uploads/.tmp'), photosDir: resolve(root, 'data/photos') });
});

afterAll(() => {
  Object.assign(config, saved);
  rmSync(root, { recursive: true, force: true });
});

beforeEach(async () => {
  h = await open(':memory:');
  rmSync(resolve(root, 'uploads'), { recursive: true, force: true });
  rmSync(resolve(root, 'data'), { recursive: true, force: true });
  mkdirSync(config.tmpDir, { recursive: true });
});

describe('suggestions from a save', () => {
  test('a saved node keeps the position of its uploads, and a photo without one adds nothing', async () => {
    if(!ready) return;

    await upload(A, '#aa0000', { lat: 47.38, lon: 8.54 });
    await upload(B, '#00aa00');

    const { status, body } = await saveNew(h, { doc: doc([photo('ph000001', A), photo('ph000002', B)]) });

    expect(status).toBe(201);
    expect(h.all('SELECT node_id, lat, lon FROM place_suggestions')).toEqual([{ node_id: body.id, lat: 47.38, lon: 8.54 }]);
  });

  test('the node going takes its suggestions with it', () => {
    const { id } = insertNode(h, { doc: {} });

    addSuggestions(h, id, [{ lat: 1.5, lon: 2.5 }]);
    h.run('DELETE FROM nodes WHERE id = ?', id);
    expect(h.get('SELECT COUNT(*) AS n FROM place_suggestions').n).toBe(0);
  });
});

describe('answering in bulk', () => {
  let a;
  let b;

  beforeEach(() => {
    seed(h);
    a = insertNode(h, { title: 'Market day', doc: {} }).id;
    b = insertNode(h, { title: 'Hike', doc: {} }).id;
    addSuggestions(h, a, [{ lat: 47.38, lon: 8.54 }]);
    addSuggestions(h, b, [{ lat: 10.5, lon: 20.5 }]);
  });

  test('lists each with the place it would link to', async () => {
    expect((await (await get()).json()).suggestions).toEqual([
      { node: a, title: 'Market day', lat: 47.38, lon: 8.54, place: { id: expect.any(Number), title: 'Zürich (ZH)' } },
      { node: b, title: 'Hike', lat: 10.5, lon: 20.5, place: { id: null, title: '10.50, 20.50' } },
    ]);
  });

  test('accept links with `at`, creates a missing place and answers the suggestion', async () => {
    const res = await post({ ops: [{ op: 'accept', node: a, lat: 47.38, lon: 8.54 }, { op: 'accept', node: b, lat: 10.5, lon: 20.5 }] }, true);
    const body = await res.json();
    const at = h.all("SELECT l.from_id AS f, n.title FROM node_links l JOIN nodes n ON n.id = l.to_id WHERE l.label = 'at' ORDER BY l.from_id");

    expect(res.status).toBe(200);
    expect(at).toEqual([{ f: a, title: 'Zürich (ZH)' }, { f: b, title: '10.50, 20.50' }]);
    expect(body.suggestions).toEqual([]);
    expect(body.graph.edges.filter(e => e.label === 'at').length).toBe(2);
  });

  test('dismiss only removes the suggestion', async () => {
    const body = await (await post({ ops: [{ op: 'dismiss', node: b, lat: 10.5, lon: 20.5 }] }, true)).json();

    expect(body.suggestions.map(s => s.node)).toEqual([a]);
    expect(h.get("SELECT COUNT(*) AS n FROM node_links WHERE label = 'at'").n).toBe(0);
  });

  test('a node already linked to the place is not suggested again', () => {
    const zurich = h.get("SELECT id FROM nodes WHERE title = 'Zürich (ZH)'").id;

    addLink(h, a, zurich, 'at');
    expect(pendingSuggestions(h).map(s => s.node)).toEqual([b]);
  });

  test('an `at` link made any other way (the chip) answers its suggestion, not another one', () => {
    const zurich = h.get("SELECT id FROM nodes WHERE title = 'Zürich (ZH)'").id;
    const bern = h.get("SELECT id FROM nodes WHERE title = 'Bern (BE)'").id;

    addSuggestions(h, a, [{ lat: 46.95, lon: 7.45 }]);
    applyOp(h, { op: 'link', from: a, to: zurich, label: 'at' });
    expect(h.all('SELECT lat FROM place_suggestions WHERE node_id = ? ORDER BY lat', a)).toEqual([{ lat: 46.95 }]);

    // the same link again, and a link of another label, change nothing more
    expect(applyOp(h, { op: 'link', from: a, to: zurich, label: 'at' })).toBe(false);
    applyOp(h, { op: 'link', from: b, to: bern, label: 'ref' });
    expect(h.get('SELECT COUNT(*) AS n FROM place_suggestions').n).toBe(2);
    applyOp(h, { op: 'link', from: a, to: bern, label: 'at' });
    expect(h.get('SELECT COUNT(*) AS n FROM place_suggestions WHERE node_id = ?', a).n).toBe(0);
  });

  test('an unknown suggestion is a no-op, malformed input is a 400, no places node a 409', async () => {
    expect((await post({ ops: [{ op: 'accept', node: a, lat: 1, lon: 1 }] }, true)).status).toBe(200);
    expect((await post({ ops: [{ op: 'nope' }] }, true)).status).toBe(400);
    expect((await post({ ops: 'x' }, true)).status).toBe(400);
    expect((await placesRoute(new Request('http://x/api/places/suggestions', { method: 'DELETE' }), h)).status).toBe(405);

    h.run("DELETE FROM nodes WHERE title = 'places'");
    expect((await post({ ops: [{ op: 'accept', node: a, lat: 47.38, lon: 8.54 }] }, true)).status).toBe(409);
    expect(h.get('SELECT COUNT(*) AS n FROM place_suggestions').n).toBe(2);
  });
});
