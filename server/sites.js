// The personal sites wild-beauty renders (SITES.md). A request whose Host is
// one of a site's hosts gets that site's pages and nothing else of the app.
// Host names arrive in punycode; `www.` is the canonical one (it follows the
// server's IP through the dyndns CNAME), the apex redirects there in nginx.
import { domainToASCII } from 'node:url';

export const sites = [
  {
    id: 'janos',
    hosts: ['www.xn--jnos-5na.ch'],
    url: 'https://www.xn--jnos-5na.ch',
    // the root node of the sitemap; its child nodes (by `sort`) are the pages
    rootTitle: 'jános.ch',
    title: 'jános',
    lang: 'de',
    theme: 'janos',
    color: '#ffffff',
    icon: '/static/img/janos.svg',
    // where /edit/ goes: the node editor on the wild-beauty host, behind a login
    editUrl: 'https://wild-beauty.transistorisiert.ch/de/new?site=janos',
  },
];

// the site a request is for, or null (the wild-beauty app itself)
export function siteFor(req) {
  const host = (req.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');

  return sites.find(site => site.hosts.includes(domainToASCII(host) || host)) ?? null;
}

export const siteById = id => sites.find(site => site.id === id) ?? null;
