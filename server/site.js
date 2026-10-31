// The pages of a site (SITES.md Phase C/D): the sitemap is the root node of the
// site and its `child` links in order; a page's path is its `slug`, the first
// page is the home page at `/`.
import { getNode, linksFrom } from './db/nodes.js';

// -> { root, pages: [{ node, slug, path }] } or null when the site has no root yet
export function sitemap(h, site) {
  const row = h.get("SELECT id FROM nodes WHERE space = ? AND kind = 'site' ORDER BY id LIMIT 1", site.id);

  if(!row) return null;

  const found = linksFrom(h, row.id, 'child').flatMap(({ id }) => {
    const node = getNode(h, id);

    return node && node.space === site.id && node.slug && node.visibility === 'public' ? [node] : [];
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
