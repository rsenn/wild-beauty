// Locale files and negotiation (PLAN.md S11.7). Locales are read once at
// start; adding locales/<code>.json and restarting is all a new language needs.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const LOCALES_DIR = resolve(ROOT, 'locales');
const FLAGS_DIR = resolve(ROOT, 'static/img');

export const DEFAULT_LANG = 'en';

// { code -> flat messages } from every locales/*.json
export function loadLocales(dir = LOCALES_DIR) {
  const locales = new Map();

  for(const file of readdirSync(dir).sort()) {
    const m = /^([a-z]{2,3})\.json$/.exec(file);

    if(m) locales.set(m[1], JSON.parse(readFileSync(resolve(dir, file), 'utf8')));
  }

  return locales;
}

// [{ code, name, dir, flag }] for the language tab; flag is null when
// static/img/flag-<flag>.svg does not exist
export function languageList(locales) {
  return [...locales].map(([code, msgs]) => {
    const flag = msgs['meta.flag'];

    return { code, name: msgs['meta.name'] ?? code, dir: msgs['meta.dir'] ?? 'ltr', flag: flag && existsSync(resolve(FLAGS_DIR, `flag-${flag}.svg`)) ? flag : null };
  });
}

const cookieValue = (header, name) => (header ?? '').split(';').map(p => p.trim().split('=')).find(([k]) => k === name)?.[1];

// ordered primary language subtags of an Accept-Language header, by q
function acceptedLanguages(header) {
  return (header ?? '')
    .split(',')
    .map(part => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map(p => /^\s*q=([\d.]+)/.exec(p)).find(Boolean);

      return { code: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q[1]) : 1 };
    })
    .filter(({ code, q }) => /^[a-z]{2,3}$/.test(code) && q > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ code }) => code);
}

// URL prefix, then the wb-lang cookie, then Accept-Language, then en
export function negotiate(locales, { pathLang, req }) {
  const candidates = [pathLang, cookieValue(req.headers.get('cookie'), 'wb-lang'), ...acceptedLanguages(req.headers.get('accept-language'))];

  return candidates.find(code => code && locales.has(code)) ?? DEFAULT_LANG;
}
