// SQLite access (PLAN.md S8): `bun:sqlite` with a few helpers, no abstraction
// layer. All SQL lives in server/db/. `open()` creates the file on a fresh
// start and applies the numbered migrations of schema.sql that are still
// missing; a second start finds nothing to do.
import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';

const SCHEMA = resolve(import.meta.dir, 'schema.sql');

// schema.sql -> [{ version, sql }] in order; `-- migration N` starts a block
export function parseMigrations(text) {
  const parts = text.split(/^-- migration (\d+)\s*$/m).slice(1);
  const blocks = [];

  for(let i = 0; i < parts.length; i += 2) blocks.push({ version: Number(parts[i]), sql: parts[i + 1] });

  blocks.forEach((b, i) => {
    if(b.version !== i + 1) throw new Error(`schema.sql: migration ${b.version} where ${i + 1} was expected`);
  });

  return blocks;
}

// -> { db, run, get, all, tx, close, version }
//  run(sql, ...params) -> { changes, lastInsertRowid }; get -> row | null;
//  all -> rows; tx(fn) runs fn in a transaction (nested calls join it)
export async function open(file = config.dbFile) {
  if(file !== ':memory:') mkdirSync(dirname(file), { recursive: true });

  const db = new Database(file, { create: true, strict: true });

  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');

  const migrations = parseMigrations(await Bun.file(SCHEMA).text());
  const current = db.query('PRAGMA user_version').get().user_version;

  if(current > migrations.length) throw new Error(`${file}: schema version ${current} is newer than this code (${migrations.length})`);

  for(const m of migrations.slice(current)) {
    db.transaction(() => {
      db.exec(m.sql);
      db.exec(`PRAGMA user_version = ${m.version}`);
    })();
  }


  const handle = {
    db,
    run: (sql, ...params) => db.query(sql).run(...params),
    get: (sql, ...params) => db.query(sql).get(...params),
    all: (sql, ...params) => db.query(sql).all(...params),
    // bun's transaction() nests as savepoints, so fn may call tx again
    tx: fn => db.transaction(fn)(),
    close: () => db.close(),
    version: migrations.length,
  };

  return handle;
}

let shared;

// the process-wide database at config.dbFile, opened on first use
export const database = () => (shared ??= open());
