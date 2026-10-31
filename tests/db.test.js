// bun test: server/db/db.js
import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { open, parseMigrations } from '../server/db/db.js';

const dirs = [];
const fresh = () => {
  const dir = mkdtempSync(join(tmpdir(), 'wb-db-'));

  dirs.push(dir);

  return join(dir, 'data', 'wb.sqlite3');
};

afterEach(() => dirs.splice(0).forEach(d => rmSync(d, { recursive: true, force: true })));

const node = (h, doc = '{}') => h.run('INSERT INTO nodes (doc, created_at, updated_at) VALUES (?, 1, 1)', doc).lastInsertRowid;

describe('open', () => {
  test('a fresh start creates the file, the tables and the version', async () => {
    const file = fresh();
    const h = await open(file);

    expect(existsSync(file)).toBe(true);
    expect(h.get('PRAGMA user_version').user_version).toBe(h.version);
    expect(h.all("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r => r.name)).toEqual(['node_links', 'node_locks', 'node_photos', 'nodes', 'photos', 'place_names', 'place_suggestions', 'sessions', 'users']);
    expect(h.get('PRAGMA journal_mode').journal_mode).toBe('wal');
    expect(h.get('PRAGMA foreign_keys').foreign_keys).toBe(1);
    h.close();
  });

  test('a second start is a no-op and keeps the data', async () => {
    const file = fresh();
    const a = await open(file);
    const id = node(a);

    a.close();

    const b = await open(file);

    expect(b.get('SELECT rev, kind, visibility, pinned FROM nodes WHERE id = ?', id)).toEqual({ rev: 1, kind: 'node', visibility: 'public', pinned: 0 });
    expect(b.get('PRAGMA user_version').user_version).toBe(b.version);
    b.close();
  });

  test('a database from a newer version is refused', async () => {
    const file = fresh();
    const a = await open(file);

    a.db.exec('PRAGMA user_version = 99');
    a.close();
    expect(open(file)).rejects.toThrow('newer');
  });
});

describe('constraints', () => {
  test('foreign keys: a node photo needs its photo, deleting a node cascades', async () => {
    const h = await open(fresh());
    const id = node(h);

    expect(() => h.run("INSERT INTO node_photos (node_id, photo_hash) VALUES (?, 'x')", id)).toThrow();

    h.run("INSERT INTO photos (hash, ext, created_at) VALUES ('x', 'jpg', 1)");
    h.run("INSERT INTO node_photos (node_id, photo_hash) VALUES (?, 'x')", id);
    h.run("INSERT INTO node_locks VALUES (?, 'me', NULL, 1, 2)", id);
    h.run("INSERT INTO node_links (from_id, to_id, label) VALUES (?, ?, 'child')", id, id);
    h.run('DELETE FROM nodes WHERE id = ?', id);

    for(const t of ['node_photos', 'node_locks', 'node_links']) expect(h.get(`SELECT count(*) AS n FROM ${t}`).n).toBe(0);
    expect(h.get('SELECT count(*) AS n FROM photos').n).toBe(1);
    h.close();
  });

  test('an edge is unique per label', async () => {
    const h = await open(fresh());
    const [a, b] = [node(h), node(h)];

    h.run("INSERT INTO node_links (from_id, to_id, label) VALUES (?, ?, 'child')", a, b);
    h.run("INSERT INTO node_links (from_id, to_id, label) VALUES (?, ?, 'ref')", a, b);
    expect(() => h.run("INSERT INTO node_links (from_id, to_id, label) VALUES (?, ?, 'child')", a, b)).toThrow();
    h.close();
  });

  test('tx rolls back on a throw and nested tx joins', async () => {
    const h = await open(fresh());

    expect(() =>
      h.tx(() => {
        node(h);
        h.tx(() => node(h));
        throw new Error('no');
      }),
    ).toThrow('no');
    expect(h.get('SELECT count(*) AS n FROM nodes').n).toBe(0);

    h.tx(() => (node(h), node(h)));
    expect(h.get('SELECT count(*) AS n FROM nodes').n).toBe(2);
    h.close();
  });
});

describe('parseMigrations', () => {
  test('blocks in order', () => {
    const m = parseMigrations('-- header\n-- migration 1\nA;\n-- migration 2\nB;\n');

    expect(m.map(b => [b.version, b.sql.trim()])).toEqual([[1, 'A;'], [2, 'B;']]);
  });

  test('a gap is an error', () => {
    expect(() => parseMigrations('-- migration 1\nA;\n-- migration 3\nB;\n')).toThrow('expected');
  });
});
