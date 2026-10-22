// bun test: the translations (EDITOR.md E72): parity of the three locale files,
// every key the code asks for exists, every key built from a list exists for
// each member, and no German or French string is an untranslated copy
import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { BLENDS, FITS, KINDS, MODES } from '../client/editor/model.js';
import { TOOLS } from '../client/editor/tools.js';
import { SAVE_ERRORS } from '../client/editor/save.js';

const root = resolve(import.meta.dir, '..');
const locale = code => JSON.parse(readFileSync(resolve(root, 'locales', code + '.json'), 'utf8'));
const en = locale('en');
const keys = Object.keys(en);

// every .js file under a directory
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = resolve(dir, name);

  return statSync(path).isDirectory() ? walk(path) : path.endsWith('.js') ? [path] : [];
});
const sources = [...walk(resolve(root, 'client')), ...walk(resolve(root, 'server')), resolve(root, 'server.js')].map(file => readFileSync(file, 'utf8'));

describe('locales', () => {
  test('tools/check-locales.js is green', () => {
    const run = Bun.spawnSync(['bun', resolve(root, 'tools/check-locales.js')]);

    expect(run.stderr.toString()).toBe('');
    expect(run.exitCode).toBe(0);
  });

  test('every key written out in t(...) exists', () => {
    const used = new Set();

    for(const text of sources) for(const m of text.matchAll(/\bt\(\s*'([^']+)'(?!\s*\+)/g)) used.add(m[1]);

    const exists = k => keys.includes(k) || keys.some(x => x.startsWith(k + '.'));

    expect([...used].filter(k => !exists(k))).toEqual([]);
    expect(used.size).toBeGreaterThan(80);
  });

  test('every key built from a list exists for each member', () => {
    const wanted = [
      ...BLENDS.map(b => 'editor.blend.' + b),
      ...FITS.map(f => 'editor.fit.' + f),
      ...KINDS.map(k => 'editor.kind.' + k),
      ...MODES.map(m => 'editor.mode.' + m),
      ...TOOLS.map(t => 'editor.tool.' + t.id),
      ...['pen', 'stroke', 'fill', 'outline'].map(t => 'editor.target.' + t),
      ...['undo', 'redo', 'page', 'delete', 'save'].map(a => 'editor.short.' + a),
      ...SAVE_ERRORS.map(c => 'editor.save.error.' + c),
      'editor.save.error.generic',
      ...['clip', 'unclip', 'empty', 'pen', 'label'].map(c => 'editor.context.' + c),
    ];

    expect(wanted.filter(k => !(k in en))).toEqual([]);
  });

  test('every string is non-empty and German and French are not English copies', () => {
    // short symbols, loanwords and names that are the same in every language
    const SAME = new Set(['editor.short.undo', 'editor.short.redo', 'editor.short.page', 'editor.short.delete', 'upload.add.short', 'upload.state.uploading', 'page.title.node', 'editor.blend.normal', 'editor.kind.node', 'editor.kind.album', 'editor.kind.shop', 'editor.scrub.pause', 'nav.lang', 'upload.files.one', 'upload.files.other', 'editor.actions', 'editor.page.1', 'editor.visibility.public', 'editor.strip', 'editor.strip.photo', 'editor.pages', 'editor.page.n', 'editor.mode', 'editor.role.texture']);

    for(const code of ['en', 'de', 'fr']) for(const [k, v] of Object.entries(locale(code))) expect([code, k, v.trim() === '']).toEqual([code, k, false]);

    for(const code of ['de', 'fr']) {
      const other = locale(code);
      const copies = keys.filter(k => !k.startsWith('meta.') && other[k] === en[k] && !SAME.has(k));

      expect([code, copies]).toEqual([code, []]);
    }
  });
});
