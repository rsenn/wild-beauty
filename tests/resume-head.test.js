// bun test: the cover an installed app puts up while it resumes the editor (server/ssr.js, docs/EDITOR.md S2.8b R5b)
import { describe, expect, test } from 'bun:test';
import { renderPage } from '../server/ssr.js';
import { html } from '../client/html.js';

const page = extra => renderPage(html`<main></main>`, { lang: 'en', dir: 'ltr', title: 't', theme: 'kraft', boot: {}, ...extra });
const script = text => /<script>(\(function\(\)\{try\{var r=.*?)<\/script>/s.exec(text)?.[1];

describe('the resume cover', () => {
  test('the main site holds the page for an app start, a personal site does not', () => {
    expect(page()).toContain('data-wb-resume');
    expect(page({ site: { color: '#fff', icon: '/i.png', canonical: 'https://x/' } })).not.toContain('data-wb-resume');
  });

  test('the script acts on the editor page of an installed app only, within 12 hours', () => {
    const code = script(page());

    expect(code).toBeTruthy();

    const run = ({ record, standalone = true, referrer = '', path = '/de/new', now = 1e9 }) => {
      const attrs = {};
      const win = {
        localStorage: { getItem: () => (record ? JSON.stringify(record) : null) },
        matchMedia: () => ({ matches: standalone }),
        navigator: {},
        document: { referrer, documentElement: { setAttribute: k => (attrs[k] = true), removeAttribute: k => delete attrs[k] } },
        location: { pathname: path },
        Date: { now: () => now },
        setTimeout: () => 0,
      };

      new Function('localStorage', 'matchMedia', 'navigator', 'document', 'location', 'Date', 'setTimeout', code)(win.localStorage, win.matchMedia, win.navigator, win.document, win.location, win.Date, win.setTimeout);

      return 'data-wb-resume' in attrs;
    };
    const record = { kind: 'editor', at: 1e9 - 3600000, url: '/de/new' };

    expect(run({ record })).toBe(true);
    expect(run({ record, path: '/de/view' })).toBe(false);
    expect(run({ record, standalone: false })).toBe(false);
    expect(run({ record, referrer: 'https://x/' })).toBe(false);
    expect(run({ record: { ...record, at: 1e9 - 13 * 3600000 } })).toBe(false);
    expect(run({ record: { ...record, kind: 'view' } })).toBe(true); // a viewer start is covered too, the app sends the user back to the page
    expect(run({ record: { ...record, kind: 'other' } })).toBe(false);
    expect(run({ record: null })).toBe(false);
  });
});
