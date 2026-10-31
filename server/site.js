// The pages of a site (SITES.md Phase C/D): the sitemap is the root node of the
// site and its `child` links in order; a page's path is its `slug`, the first
// page is the home page at `/`.
import { addLink, getNode, graphEdges, graphNodes, insertNode, linksFrom } from './db/nodes.js';

// -> { root, pages: [{ node, slug, path }] } or null when the site has no root yet. `drafts` also
// lists the pages that are not public (the owner's list); the first page is the home page either way.
export function sitemap(h, site, { drafts = false } = {}) {
  const row = h.get("SELECT id FROM nodes WHERE space = ? AND kind = 'site' ORDER BY id LIMIT 1", site.id);

  if(!row) return null;

  const found = linksFrom(h, row.id, 'child').flatMap(({ id }) => {
    const node = getNode(h, id);

    return node && node.space === site.id && node.slug && (drafts || node.visibility === 'public') ? [node] : [];
  });
  const pages = found.map((node, i) => ({ node, slug: node.slug, path: i === 0 ? '/' : `/${node.slug}` }));

  return { root: getNode(h, row.id), pages };
}

// the page for a request path -> { page } | { redirect } | null
export function resolve(map, pathname) {
  if(!map) return null;

  if(pathname !== '/' && pathname.endsWith('/')) return { redirect: pathname.replace(/\/+$/, '') || '/' };

  const page = map.pages.find(p => p.path === pathname);

  if(page) return { page };

  // the home page lives at `/` only
  const home = map.pages[0];

  return home && pathname === `/${home.slug}` ? { redirect: '/' } : null;
}

// /sitemap.xml
export function sitemapXml(site, map) {
  const urls = (map?.pages ?? []).map(p => `<url><loc>${site.url}${p.path === '/' ? '/' : p.path}</loc></url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

export const robotsTxt = site => `User-agent: *\nAllow: /\nDisallow: /edit\nSitemap: ${site.url}/sitemap.xml\n`;

// Where /edit goes for a site (SITES.md): the editor on the wild-beauty host with the page's node open,
// behind a login. `/edit` and `/edit/` are the home page, `/edit/<slug>` the page with that slug (a
// draft too); an unknown slug, or a site without pages, goes to the editor's list -> URL | null (not an edit path)
export function editLocation(h, site, pathname) {
  const m = /^\/edit(?:\/([a-z0-9-]*))?\/?$/.exec(pathname);

  if(!m) return null;

  const node = m[1] ? h.get('SELECT id FROM nodes WHERE space = ? AND slug = ?', site.id, m[1]) : sitemap(h, site)?.pages[0]?.node;
  const url = new URL(site.editUrl);

  if(node) url.searchParams.set('edit', String(node.id));

  return url.href;
}

// a path segment from a title: "Über mich!" -> "uber-mich"
export function slugify(title) {
  const base = String(title ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return base || 'page';
}

// the names the app uses itself: no page may take them
const RESERVED = new Set(['edit', 'graph', 'api', 'static', 'vendor', 'app', 'files', 'node']);

// a slug for `title` that no other node of the site has and that is no route
export function uniqueSlug(h, site, title) {
  const base = slugify(title);
  const first = RESERVED.has(base) ? `${base}-page` : base;
  let slug = first;

  for(let n = 2; h.get('SELECT 1 AS used FROM nodes WHERE space = ? AND slug = ?', site.id, slug); n++) slug = `${first}-${n}`;

  return slug;
}

// the root node of a site, or null
export const rootOf = (h, site) => h.get("SELECT * FROM nodes WHERE space = ? AND kind = 'site' ORDER BY id LIMIT 1", site.id) ?? null;

// A new page: a node of the site, owned by `user`, hidden until published, linked under the root as its
// last child, with a path segment from its title -> { id, slug } | null (the site has no root)
export function createPage(h, site, user, title, now = Date.now()) {
  const root = rootOf(h, site);

  if(!root) return null;

  return h.tx(() => {
    const { id } = insertNode(h, { title, doc: { v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {}, title }, kind: 'page', now });
    const slug = uniqueSlug(h, site, title);

    h.run("UPDATE nodes SET owner_id = ?, space = ?, slug = ?, visibility = 'hidden' WHERE id = ?", user.id, site.id, slug, id);
    addLink(h, root.id, id, 'child', h.get('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM node_links WHERE from_id = ?', root.id).n);

    return { id, slug };
  });
}

// the graph of a site -> { nodes, edges } like graphOf: all its nodes for the owner, the public ones for a visitor
export function siteGraph(h, site, owner) {
  const nodes = graphNodes(h).filter(n => n.space === site.id && (owner || n.visibility === 'public'));
  const ids = new Set(nodes.map(n => n.id));

  return { nodes, edges: graphEdges(h).filter(e => ids.has(e.from) && ids.has(e.to)) };
}

// node id -> path of the page it is: { 25: '/', 26: '/about' }
export const pathsOf = map => Object.fromEntries((map?.pages ?? []).map(p => [p.node.id, p.path]));
