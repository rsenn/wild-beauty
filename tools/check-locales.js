// Fails (exit 1) when the locale files in locales/ (or the directory given as
// argument) disagree with en.json: missing or extra keys, missing meta keys,
// plural groups without `.other`, differing {placeholders}.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? resolve(import.meta.dir, '..', 'locales'));
const REFERENCE = 'en';
const PLURAL = /\.(zero|one|two|few|many|other)$/;
const META = ['meta.name', 'meta.dir', 'meta.flag'];

const files = readdirSync(dir).filter(f => /^[a-z]{2,3}\.json$/.test(f)).sort();
const locales = Object.fromEntries(files.map(f => [f.slice(0, -5), JSON.parse(readFileSync(resolve(dir, f), 'utf8'))]));
const problems = new Set();

if(!(REFERENCE in locales)) {
  console.error(`${dir}: no ${REFERENCE}.json`);
  process.exit(1);
}

// plural forms differ per language (fr has `many`), so compare base keys
const baseKeys = messages => {
  const keys = Object.keys(messages);
  const plural = new Set(keys.filter(k => k.endsWith('.other')).map(k => k.slice(0, -'.other'.length)));

  return new Set(keys.map(k => (PLURAL.test(k) && plural.has(k.replace(PLURAL, '')) ? k.replace(PLURAL, '') : k)));
};

const placeholders = text => [...new Set([...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]))].sort().join(',');

const reference = locales[REFERENCE];
const referenceKeys = baseKeys(reference);

for(const [code, messages] of Object.entries(locales)) {
  for(const key of META) if(typeof messages[key] !== 'string') problems.add(`${code}: missing ${key}`);

  if(code === REFERENCE) continue;

  const keys = baseKeys(messages);

  for(const key of referenceKeys) if(!keys.has(key)) problems.add(`${code}: missing ${key}`);
  for(const key of keys) if(!referenceKeys.has(key)) problems.add(`${code}: extra ${key}`);

  for(const [key, text] of Object.entries(messages)) {
    const refKey = key in reference ? key : key.replace(PLURAL, '.other');

    if(refKey in reference && placeholders(text) !== placeholders(reference[refKey])) problems.add(`${code}: ${key} placeholders {${placeholders(text)}} differ from en {${placeholders(reference[refKey])}}`);
  }
}

for(const [code, messages] of Object.entries(locales)) {
  const groups = new Set(Object.keys(messages).filter(k => PLURAL.test(k)).map(k => k.replace(PLURAL, '')));

  for(const group of groups) if(!(`${group}.other` in messages)) problems.add(`${code}: ${group} has plural forms but no .other`);
}

if(problems.size) {
  console.error([...problems].join('\n'));
  process.exit(1);
}

console.log(`${files.length} locales ok (${Object.keys(locales).join(', ')})`);
