// bun test: what a card hands the editor (client/files.js uploadPayload), and what the page's first paint lists
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { uploadPayload } from '../client/files.js';

const record = { hash: 'a'.repeat(64), display: 'a.jpg', width: 4, height: 3, padding: ['#000000', '#ffffff'], palette: [] };

describe('uploadPayload', () => {
  test('carries the rounded position, so the place chip can suggest (E137)', () => {
    expect(uploadPayload({ ...record, pos: { lat: 47.38, lon: 8.54 } }).pos).toEqual({ lat: 47.38, lon: 8.54 });
  });

  test('no position, no key', () => {
    expect('pos' in uploadPayload(record)).toBe(false);
  });
});

// the boot list (server.js `listed`) is a whitelist: a field left out never reaches an upload card
// that was on the page before it loaded. Found in the browser: pos was missing there.
describe('boot upload list', () => {
  test('lists pos', () => {
    const source = readFileSync(resolve(import.meta.dir, '../server.js'), 'utf8');

    expect(/const listed = \(\{[^}]*\bpos\b[^}]*\}\)/.test(source)).toBe(true);
  });
});
