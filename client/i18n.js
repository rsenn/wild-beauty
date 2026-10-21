// Translation lookup shared by server and browser. Messages are flat
// key -> string maps (locales/<code>.json); plural forms are `<key>.<category>`
// chosen by Intl.PluralRules; `{name}` is replaced from the params.
import { createContext } from '../vendor/preact.js';
import { useContext } from '../vendor/hooks.js';

const warned = new Set();

// t(key, params): missing in `messages` -> `fallback` (en) -> the key itself
export function createT({ lang, messages, fallback = {} }) {
  const rules = new Intl.PluralRules(lang);
  const numbers = new Intl.NumberFormat(lang);
  const lookup = key => messages[key] ?? fallback[key];

  return function t(key, params = {}) {
    let text = 'count' in params ? lookup(`${key}.${rules.select(params.count)}`) ?? lookup(`${key}.other`) : undefined;

    text ??= lookup(key);

    if(text === undefined) {
      if(!warned.has(key)) {
        warned.add(key);
        console.warn(`i18n: missing key "${key}" for "${lang}"`);
      }

      return key;
    }

    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? (typeof params[name] === 'number' ? numbers.format(params[name]) : String(params[name])) : match));
  };
}

// what components read: { lang, dir, languages, t }; `boot` carries the data
export const makeI18n = ({ lang, messages, fallback, languages }) => ({
  lang,
  dir: messages['meta.dir'] ?? 'ltr',
  languages,
  t: createT({ lang, messages, fallback }),
});

export const I18n = createContext(makeI18n({ lang: 'en', messages: {}, languages: [] }));

export const useI18n = () => useContext(I18n);
