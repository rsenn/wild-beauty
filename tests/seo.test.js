import { describe, expect, test } from 'bun:test';
import { descriptionOf, headTags, isFindable, listedFor, originOf, robotsTxt, sitemapXml } from '../server/seo.js';

const pub = (extra = {}) => ({ id: 1, title: 'Collage', kind: 'node', visibility: 'public', space: null, owner_id: 7, search: null, doc: { mode: 'free', pages: [{ steps: [] }] }, ...extra });
const photo = (id, desc) => ({ op: 'photo', id, photo: id.padEnd(64, '0'), m: [1, 0, 0, 1, 0, 0], ...(desc && { desc }) });

describe('isFindable', () => {
  test('a public collage is findable by default; photo sets, galleries and hidden nodes are not', () => {
    expect(isFindable(pub())).toBe(true);
    expect(isFindable(pub({ doc: { mode: 'grid', pages: [] } }))).toBe(false);
    expect(isFindable(pub({ doc: { mode: 'slides', pages: [] } }))).toBe(false);
    expect(isFindable(pub({ kind: 'gallery' }))).toBe(false);
    expect(isFindable(pub({ visibility: 'hidden' }))).toBe(false);
    expect(isFindable(pub({ space: 'site-1' }))).toBe(false);
    expect(isFindable(pub({ owner_id: null }))).toBe(false); // the open public area: nobody owns it
    expect(isFindable(pub({ owner_id: null, search: 1 }))).toBe(false);
    expect(isFindable(null)).toBe(false);
  });

  test('the owner\'s setting wins over the default, but never over visibility', () => {
    expect(isFindable(pub({ kind: 'gallery', search: 1 }))).toBe(true);
    expect(isFindable(pub({ search: 0 }))).toBe(false);
    expect(isFindable(pub({ visibility: 'hidden', search: 1 }))).toBe(false);
  });
});

describe('listedFor', () => {
  test('a visitor sees only findable galleries on the front page, a logged-in user sees all', () => {
    expect(listedFor(pub(), null)).toBe(true);
    expect(listedFor(pub({ kind: 'gallery' }), null)).toBe(false);
    expect(listedFor(pub({ kind: 'gallery', search: 1 }), null)).toBe(true);
    expect(listedFor(pub({ kind: 'gallery', search: 0 }), { id: 1 })).toBe(true);
  });
});

describe('originOf', () => {
  const req = headers => ({ headers: new Headers(headers) });

  test('the environment first, then the forwarded host and scheme, plain http for localhost', () => {
    expect(originOf(req({ host: 'x' }), { WB_PUBLIC_URL: 'https://a.example/' })).toBe('https://a.example');
    expect(originOf(req({ host: 'wild.example', 'x-forwarded-proto': 'https' }), {})).toBe('https://wild.example');
    expect(originOf(req({ host: 'localhost:3001' }), {})).toBe('http://localhost:3001');
    expect(originOf(req({ host: 'bad host"<' }), {})).toBe('http://localhost');
  });
});

describe('descriptionOf', () => {
  const messages = { 'seo.description': '{title}: {n} pictures on Wild Beauty.', 'seo.description.single': '{title} on Wild Beauty.', 'node.untitled': 'Untitled' };

  test('title and number of pictures, the first note\'s first line, cut at 160; disabled photos are not counted', () => {
    const doc = { mode: 'grid', pages: [{ steps: [photo('a1', 'Arrival\nthe garden'), photo('b2'), { ...photo('c3'), off: true }] }] };

    expect(descriptionOf(pub({ title: 'Trip', doc }), messages)).toBe('Trip: 2 pictures on Wild Beauty. Arrival');
    expect(descriptionOf(pub({ title: '', doc: { mode: 'free', pages: [{ steps: [photo('a1')] }] } }), messages)).toBe('Untitled on Wild Beauty.');
    expect(descriptionOf(pub({ title: 'x'.repeat(300) }), messages).length).toBeLessThanOrEqual(160);
  });
});

describe('headTags, robots.txt and sitemap.xml', () => {
  const base = { lang: 'en', languages: ['en', 'de'], defaultLang: 'en', path: '/node/1', title: 'Wild Beauty - A "x"', description: 'D & E' };

  test('a findable page: index, canonical, hreflang, Open Graph with the tile, all escaped', () => {
    const tags = headTags('https://w.example', { ...base, findable: true, image: '/files/photos/ab.thumb.jpg' }, {});

    expect(tags).toContain('content="index, follow, noimageindex"');
    expect(tags).toContain('<link rel="canonical" href="https://w.example/en/node/1">');
    expect(tags).toContain('hreflang="de" href="https://w.example/de/node/1"');
    expect(tags).toContain('hreflang="x-default" href="https://w.example/en/node/1"');
    expect(tags).toContain('content="D &amp; E"');
    expect(tags).toContain('og:title" content="Wild Beauty - A &quot;x&quot;"');
    expect(tags).toContain('og:image" content="https://w.example/files/photos/ab.thumb.jpg"');
    expect(tags).toContain('summary_large_image');
  });

  test('a page that is not findable says noindex; a page without Open Graph says only that', () => {
    expect(headTags('https://w.example', { ...base }, {})).toContain('content="noindex, noimageindex"');
    expect(headTags('https://w.example', { ...base, og: false }, {})).toBe('<meta name="robots" content="noindex, noimageindex">');
  });

  test('the Search Console verification only when set', () => {
    expect(headTags('https://w.example', { ...base, og: false }, { WB_SITE_VERIFICATION: 'abc' })).toContain('google-site-verification" content="abc"');
  });

  test('robots.txt keeps the API, the files and the editor pages out and names the sitemap', () => {
    const txt = robotsTxt('https://w.example');

    for(const line of ['Disallow: /api/', 'Disallow: /files/', 'Disallow: /*/new', 'Sitemap: https://w.example/sitemap.xml']) expect(txt).toContain(line);
  });

  test('the sitemap has the front page and every findable node in every language', () => {
    const xml = sitemapXml('https://w.example', [{ id: 5, updated_at: Date.UTC(2026, 10, 6) }], ['en', 'de'], 'en');

    expect(xml.match(/<url>/g).length).toBe(4); // the front page and the node, each in two languages
    expect(xml).toContain('<loc>https://w.example/en/view</loc>');
    expect(xml).toContain('<loc>https://w.example/de/node/5</loc><lastmod>2026-11-06</lastmod>');
    expect(sitemapXml('https://w.example', [], ['en'], 'en').match(/<url>/g).length).toBe(1); // only the front page
  });
});
