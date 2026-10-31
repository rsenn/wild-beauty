// bun test: server/sites.js, server/site.js
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { addLink, insertNode } from '../server/db/nodes.js';
import { siteFor, siteById } from '../server/sites.js';
import { resolve, sitemap, sitemapXml } from '../server/site.js';

const site = siteById('janos');
let h;

beforeEach(async () => {
  h = await open(':memory:');

  const make = (title, kind, slug) => {
    const { id } = insertNode(h, { title, doc: { n: 1 }, kind });

    h.run('UPDATE nodes SET space = ?, slug = ? WHERE id = ?', site.id, slug ?? null, id);

    return id;
  };
  const root = make('jános.ch', 'site');

  [['Start', 'home'], ['Über', 'about'], ['Kontakt', 'contact']].forEach(([title, slug], i) => addLink(h, root, make(title, 'page', slug), 'child', i));
});

describe('sites', () => {
  test('the host picks the site, in punycode or not, with a port', () => {
    const at = host => siteFor(new Request('http://x/', { headers: { host } }));

    expect(at('www.xn--jnos-5na.ch')?.id).toBe('janos');
    expect(at('WWW.xn--jnos-5na.ch:3001')?.id).toBe('janos');
    expect(at('www.jános.ch')?.id).toBe('janos');
    expect(at('wild-beauty.transistorisiert.ch')).toBeNull();
  });
});

describe('sitemap', () => {
  test('pages in link order, the first at /', () => {
    const map = sitemap(h, site);

    expect(map.pages.map(p => [p.node.title, p.path])).toEqual([['Start', '/'], ['Über', '/about'], ['Kontakt', '/contact']]);
  });

  test('resolve: pages, redirects, unknown', () => {
    const map = sitemap(h, site);

    expect(resolve(map, '/about').page.node.title).toBe('Über');
    expect(resolve(map, '/').page.node.title).toBe('Start');
    expect(resolve(map, '/home')).toEqual({ redirect: '/' });
    expect(resolve(map, '/about/')).toEqual({ redirect: '/about' });
    expect(resolve(map, '/nope')).toBeNull();
    expect(resolve(null, '/')).toBeNull();
  });

  test('a node of another space is not a page', () => {
    h.run("UPDATE nodes SET space = 'other' WHERE slug = 'about'");
    expect(sitemap(h, site).pages.map(p => p.slug)).toEqual(['home', 'contact']);
  });

  test('sitemap.xml lists the paths', () => {
    expect(sitemapXml(site, sitemap(h, site))).toContain('<loc>https://www.xn--jnos-5na.ch/about</loc>');
  });
});
