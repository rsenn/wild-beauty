// bun test: server/sites.js, server/site.js
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { addLink, insertNode } from '../server/db/nodes.js';
import { siteFor, siteById, isOwner } from '../server/sites.js';
import { editLocation, createPage, pathsOf, resolve, siteGraph, sitemap, sitemapXml, slugify, uniqueSlug } from '../server/site.js';
import { graphRoute } from '../server/api/graph.js';

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

describe('editLocation', () => {
  const at = path => editLocation(h, { ...site, editUrl: 'https://wb.example/de/new?site=janos' }, path);
  const idOf = slug => h.get('SELECT id FROM nodes WHERE slug = ?', slug).id;

  test('/edit is the home page, /edit/<slug> a page, both behind the editor link', () => {
    expect(at('/edit')).toBe(`https://wb.example/de/new?site=janos&edit=${idOf('home')}`);
    expect(at('/edit/')).toBe(at('/edit'));
    expect(at('/edit/about')).toBe(`https://wb.example/de/new?site=janos&edit=${idOf('about')}`);
  });

  test('a draft page can be edited, an unknown slug falls back to the list, other paths are not edit paths', () => {
    h.run("UPDATE nodes SET visibility = 'hidden' WHERE slug = 'contact'");
    expect(at('/edit/contact')).toContain(`edit=${idOf('contact')}`);
    expect(at('/edit/nope')).toBe('https://wb.example/de/new?site=janos');
    expect(at('/about')).toBeNull();
    expect(at('/editor')).toBeNull();
  });
});

describe('owner and pages', () => {
  test('isOwner compares the mail address, ignoring case', () => {
    expect(isOwner(site, { email: 'Janos.Morzsinay@gmail.com' })).toBe(true);
    expect(isOwner(site, { email: 'other@x.ch' })).toBe(false);
    expect(isOwner(site, null)).toBe(false);
  });

  test('slugify and uniqueSlug: ascii, never a route, never taken', () => {
    expect(slugify('Über mich!')).toBe('uber-mich');
    expect(slugify('???')).toBe('page');
    expect(uniqueSlug(h, site, 'Edit')).toBe('edit-page');
    expect(uniqueSlug(h, site, 'Kontakt')).toBe('kontakt');
    expect(uniqueSlug(h, site, 'about')).toBe('about-2');
  });

  test('createPage: hidden, owned, last child of the root, listed for the owner only', () => {
    const user = { id: 7 };
    const made = createPage(h, site, user, 'Arbeiten');

    expect(made.slug).toBe('arbeiten');
    expect(h.get('SELECT owner_id, space, visibility, kind FROM nodes WHERE id = ?', made.id)).toEqual({ owner_id: 7, space: 'janos', visibility: 'hidden', kind: 'page' });
    expect(sitemap(h, site).pages.map(p => p.slug)).not.toContain('arbeiten');
    expect(sitemap(h, site, { drafts: true }).pages.map(p => p.slug).at(-1)).toBe('arbeiten');
    expect(pathsOf(sitemap(h, site, { drafts: true }))[made.id]).toBe('/arbeiten');
  });

  test('siteGraph: a visitor sees the public nodes only', () => {
    h.run("UPDATE nodes SET visibility = 'hidden'");
    h.run("UPDATE nodes SET visibility = 'public' WHERE kind = 'site' OR slug = 'home'");
    expect(siteGraph(h, site, false).nodes.length).toBe(2);
    expect(siteGraph(h, site, true).nodes.length).toBe(4);
  });

  test('graph route on a site: a visitor cannot change it', async () => {
    const post = new Request('http://x/api/graph/ops', { method: 'POST', body: JSON.stringify({ ops: [] }) });

    expect((await graphRoute(post, h, { site })).status).toBe(403);
    expect((await graphRoute(new Request('http://x/api/graph'), h, { site })).status).toBe(200);
  });
});
