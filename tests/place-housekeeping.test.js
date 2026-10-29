// bun test: place housekeeping (TODO 12.6f): migration 4 renames old places, cells that touch are one place,
// answered suggestions are purged
import { Database } from 'bun:sqlite';
import { beforeEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseMigrations, open } from '../server/db/db.js';
import { addLink, addSuggestions, insertNode } from '../server/db/nodes.js';
import { applyOp } from '../server/api/graph.js';
import { ensurePlace, findPlace, pendingSuggestions, placesRoute } from '../server/api/places.js';
import { roundPosition } from '../server/media/probe.js';
import { seed } from '../tools/seed.js';

const at = (lat, lon) => roundPosition(lat, lon);
const migrations = parseMigrations(readFileSync(resolve(import.meta.dir, '../server/db/schema.sql'), 'utf8'));

describe('migration 4: places made before the canton was in the title', () => {
  let db;
  let root;
  const node = (title, kind = 'node') => Number(db.query("INSERT INTO nodes (title, doc, kind, created_at, updated_at) VALUES (?, ?, ?, 1, 1)").run(title, JSON.stringify({ v: 1, title }), kind).lastInsertRowid);
  const link = (from, to, label) => db.query('INSERT INTO node_links (from_id, to_id, label) VALUES (?, ?, ?)').run(from, to, label);
  const migrate = () => db.exec(migrations.find(m => m.version === 4).sql);
  const titles = () => db.query("SELECT n.title FROM node_links l JOIN nodes n ON n.id = l.to_id WHERE l.from_id = ? AND l.label = 'child' ORDER BY n.id").all(root).map(r => r.title);

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON');
    for(const m of migrations.filter(m => m.version <= 3)) db.exec(m.sql);
    root = node('places', 'list');
  });

  test('the five gazetteer names get their canton, the title and the document, other places stay', () => {
    const zurich = node('Zürich');
    const cell = node('47.27, 8.01');
    const kusnacht = node('Küsnacht (ZH)');
    const photo = node('Market day');

    for(const to of [zurich, cell, kusnacht]) link(root, to, 'child');
    link(photo, zurich, 'at');
    migrate();

    expect(titles()).toEqual(['Zürich (ZH)', '47.27, 8.01', 'Küsnacht (ZH)']);
    expect(JSON.parse(db.query('SELECT doc FROM nodes WHERE id = ?').get(zurich).doc).title).toBe('Zürich (ZH)');
    expect(db.query("SELECT to_id FROM node_links WHERE from_id = ? AND label = 'at'").get(photo).to_id).toBe(zurich);
  });

  test('where the new title exists already, the links go to it and the old node goes', () => {
    const old = node('Bern');
    const fresh = node('Bern (BE)');
    const a = node('Walk');
    const b = node('Hike');

    for(const to of [old, fresh]) link(root, to, 'child');
    link(a, old, 'at');
    link(b, old, 'at');
    link(b, fresh, 'at'); // b is linked to both: one link must remain
    migrate();

    expect(titles()).toEqual(['Bern (BE)']);
    expect(db.query("SELECT from_id, to_id FROM node_links WHERE label = 'at' ORDER BY from_id").all()).toEqual([{ from_id: a, to_id: fresh }, { from_id: b, to_id: fresh }]);
    expect(db.query('SELECT COUNT(*) AS n FROM nodes WHERE title = ?').get('Bern').n).toBe(0);
  });

  test('a node called Zürich that is not below places is left alone, and so is a database without places', () => {
    const elsewhere = node('Zürich');

    migrate();
    expect(db.query('SELECT title FROM nodes WHERE id = ?').get(elsewhere).title).toBe('Zürich');

    const bare = new Database(':memory:');

    for(const m of migrations.filter(m => m.version <= 3)) bare.exec(m.sql);

    expect(() => bare.exec(migrations.find(m => m.version === 4).sql)).not.toThrow();
  });

  test('migrating twice is harmless', () => {
    link(root, node('Basel'), 'child');
    migrate();
    migrate();
    expect(titles()).toEqual(['Basel (BS)']);
  });
});

describe('cells that touch are one place', () => {
  let h;

  beforeEach(async () => {
    h = await open(':memory:');
    seed(h);
  });

  test('a neighbouring cell, a diagonal one too, reuses the place; a cell 5 km away does not', () => {
    const first = ensurePlace(h, at(10.5, 20.5), []);
    const east = ensurePlace(h, at(10.5, 20.51), []);
    const diagonal = ensurePlace(h, at(10.51, 20.51), []);
    const far = ensurePlace(h, at(10.55, 20.5), []);
    const skipped = ensurePlace(h, at(10.5, 20.53), []); // two cells over

    expect(east).toEqual({ id: first.id, title: first.title, created: false });
    expect(diagonal.id).toBe(first.id);
    expect(far.created).toBe(true);
    expect(skipped.created).toBe(true);
  });

  test('find says the same without creating, and a named place is never snapped', () => {
    const first = ensurePlace(h, at(10.5, 20.5), []);

    expect(findPlace(h, at(10.5, 20.51), [])).toEqual({ id: first.id, title: first.title });
    expect(findPlace(h, at(10.7, 20.5), [])).toEqual({ id: null, title: '10.70, 20.50' });

    // a gazetteer town and a cell next to it stay what they are
    expect(ensurePlace(h, at(47.38, 8.54))).toMatchObject({ title: 'Zürich (ZH)', created: false });
  });

  test('a suggestion next to an existing cell place shows that place', () => {
    const first = ensurePlace(h, at(10.5, 20.5), []);
    const node = insertNode(h, { title: 'Trip', doc: {} }).id;

    addSuggestions(h, node, [{ lat: 10.5, lon: 20.51 }]);
    expect(pendingSuggestions(h, [])[0].place).toEqual({ id: first.id, title: first.title });
  });
});

describe('answered suggestions are purged', () => {
  let h;

  beforeEach(async () => {
    h = await open(':memory:');
    seed(h);
  });

  test('a node linked to the place before the suggestion existed: the list leaves it out and the next read deletes it', async () => {
    const node = insertNode(h, { title: 'Market day', doc: {} }).id;
    const zurich = h.get("SELECT id FROM nodes WHERE title = 'Zürich (ZH)'").id;
    const rows = () => h.get('SELECT COUNT(*) AS n FROM place_suggestions').n;

    addLink(h, node, zurich, 'at');
    addSuggestions(h, node, [{ lat: 47.38, lon: 8.54 }]);

    expect(pendingSuggestions(h)).toEqual([]);
    expect(rows()).toBe(1); // listing alone changes nothing

    const res = await placesRoute(new Request('http://x/api/places/suggestions'), h);

    expect((await res.json()).suggestions).toEqual([]);
    expect(rows()).toBe(0);
  });

  test('a suggestion that is still open is not purged', async () => {
    const node = insertNode(h, { title: 'Hike', doc: {} }).id;

    addSuggestions(h, node, [{ lat: 10.5, lon: 20.5 }]);
    await placesRoute(new Request('http://x/api/places/suggestions'), h);
    expect(h.get('SELECT COUNT(*) AS n FROM place_suggestions').n).toBe(1);
  });
});
