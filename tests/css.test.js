// bun test: the token contract of the stylesheets (PLAN.md S16.2, EDITOR.md E44):
// layout.css holds structure only, no literal colours, and every token it
// reads is defined by every theme.
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..', 'static');
const layout = readFileSync(resolve(root, 'css/layout.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const themes = readdirSync(resolve(root, 'themes')).filter(f => f.endsWith('.css')).map(f => [f, readFileSync(resolve(root, 'themes', f), 'utf8')]);

describe('layout.css', () => {
  test('no literal colour', () => {
    const found = [...layout.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g)].map(m => m[0]);

    expect(found).toEqual([]);
  });

  test('no colour name as a value', () => {
    const values = [...layout.matchAll(/(?:color|background|border|outline|fill|stroke)[a-z-]*:\s*([^;{}]+);/g)].map(m => m[1]);
    const names = /\b(black|white|red|green|blue|yellow|orange|purple|gray|grey|silver|maroon|navy|teal|olive|lime|aqua|fuchsia|pink|brown)\b/;

    expect(values.filter(v => names.test(v.replace(/var\([^)]*\)/g, '')))).toEqual([]);
  });

  test('every token it reads is defined by every theme', () => {
    const used = new Set([...layout.matchAll(/var\((--wb-[a-z0-9-]+)/g)].map(m => m[1]));

    // tokens a rule defines for its own children (per-tool icon indirection) are local
    const local = new Set([...layout.matchAll(/(--wb-[a-z0-9-]+)\s*:/g)].map(m => m[1]));

    for(const [file, css] of themes) {
      const defined = new Set([...css.matchAll(/(--wb-[a-z0-9-]+)\s*:/g)].map(m => m[1]));
      const missing = [...used].filter(name => !defined.has(name) && !local.has(name));

      expect({ file, missing }).toEqual({ file, missing: [] });
    }
  });
});
