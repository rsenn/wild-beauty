// Search engines and link previews (docs/SEO.md). Pure functions: nodes and requests in, text out.
import { titleOf } from '../client/editor/core/caption.js';
import { visibleDoc } from '../client/editor/core/model.js';
import { photoSteps } from '../client/editor/view/render.js';

const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// the server's own address: WB_PUBLIC_URL, else the scheme and host the request came in on
export function originOf(req, env = process.env) {
  if(env.WB_PUBLIC_URL) return env.WB_PUBLIC_URL.replace(/\/+$/, '');

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost';
  const proto = req.headers.get('x-forwarded-proto') ?? (/^(localhost|127\.|\[::1\])/.test(host) ? 'http' : 'https');

  return /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? `${proto}://${host}` : 'http://localhost';
}

// May search engines be offered this node? Public, not a page of a personal site, and the
// owner's setting (`search`: 1 yes, 0 no) or, when there is none, the default rule: a collage.
export function isFindable(node) {
  // a node of the open public area (nobody owns it, everybody may change it) is never offered: with a wide reach a stranger could put anything there
  if(!node || node.visibility !== 'public' || node.space || node.owner_id == null) return false;
  if(node.search === 1) return true;
  if(node.search === 0) return false;

  return node.kind === 'node' && (node.doc?.mode ?? 'free') === 'free';
}

// Is this node listed on the front page (the Show page) for `viewer`? A visitor who is not logged in sees
// only the findable galleries: what search engines may not be offered is not listed where a crawler reads it
// (docs/SEO.md S1b). It stays public by its link. A logged-in user sees what they may see.
export const listedFor = (node, viewer) => !!viewer || isFindable(node);

const ROBOTS = { off: 'noindex, noimageindex', on: 'index, follow, noimageindex' };

// the pictures of a node as a visitor sees them (one per photo), and the first note's first line
export function factsOf(node) {
  const steps = photoSteps(visibleDoc(node.doc ?? { pages: [] }));
  const seen = new Set(steps.map(s => s.photo));
  const note = steps.find(s => s.desc?.trim())?.desc;

  return { pictures: seen.size, note: note ? titleOf(note, 100) : '' };
}

// "<title>: N pictures on Wild Beauty. <first note>" cut at 160 characters
export function descriptionOf(node, messages) {
  const { pictures, note } = factsOf(node);
  const title = (node.title ?? '').trim();
  const base = (pictures > 1 ? messages['seo.description'] : messages['seo.description.single'] ?? '{title}').replace('{title}', title || messages['node.untitled'] || '').replace('{n}', pictures.toLocaleString('en'));
  const text = [base, note].filter(Boolean).join(' ');

  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

// The tags for the head of a page, as HTML. `page` = { lang, path (without the language: `/node/63`),
// title, description?, image? (a path), findable, og? }; `languages` = codes; `x-default` is `defaultLang`.
export function headTags(origin, { lang, languages, defaultLang, path, title, description, image, findable = false, og = true }, env = process.env) {
  const url = code => `${origin}/${code}${path}`;
  const tags = [`<meta name="robots" content="${findable ? ROBOTS.on : ROBOTS.off}">`];

  if(env.WB_SITE_VERIFICATION) tags.push(`<meta name="google-site-verification" content="${esc(env.WB_SITE_VERIFICATION)}">`);

  if(og) {
    tags.push(`<link rel="canonical" href="${esc(url(lang))}">`);

    for(const code of languages) tags.push(`<link rel="alternate" hreflang="${esc(code)}" href="${esc(url(code))}">`);

    tags.push(`<link rel="alternate" hreflang="x-default" href="${esc(url(defaultLang))}">`);

    if(description) tags.push(`<meta name="description" content="${esc(description)}">`);

    const img = `${origin}${image ?? '/static/img/pwa-apple-180.png'}`;

    tags.push(
      '<meta property="og:site_name" content="Wild Beauty">',
      `<meta property="og:title" content="${esc(title)}">`,
      ...(description ? [`<meta property="og:description" content="${esc(description)}">`] : []),
      '<meta property="og:type" content="website">',
      `<meta property="og:url" content="${esc(url(lang))}">`,
      `<meta property="og:locale" content="${esc(lang)}">`,
      `<meta property="og:image" content="${esc(img)}">`,
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    );
  }

  return tags.join('\n');
}

export const robotsTxt = origin => `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /files/\nDisallow: /*/new\nDisallow: /*/admin\nDisallow: /*/profile\nDisallow: /*/tree\nSitemap: ${origin}/sitemap.xml\n`;

export const MAX_URLS = 50000;

// the sitemap: the front page and the findable nodes (`nodes` = [{ id, updated_at }]), each in every language with alternates
export function sitemapXml(origin, nodes, languages, defaultLang) {
  // the front page (the Show page) in every language comes first
  const home = [...languages.map(code => `<xhtml:link rel="alternate" hreflang="${esc(code)}" href="${esc(`${origin}/${code}/view`)}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(`${origin}/${defaultLang}/view`)}"/>`].join('');
  const entries = languages.map(code => `<url><loc>${esc(`${origin}/${code}/view`)}</loc>${home}</url>`);

  for(const node of nodes.slice(0, MAX_URLS / languages.length | 0)) {
    const links = [...languages.map(code => `<xhtml:link rel="alternate" hreflang="${esc(code)}" href="${esc(`${origin}/${code}/node/${node.id}`)}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(`${origin}/${defaultLang}/node/${node.id}`)}"/>`].join('');

    for(const code of languages) entries.push(`<url><loc>${esc(`${origin}/${code}/node/${node.id}`)}</loc>${node.updated_at ? `<lastmod>${new Date(node.updated_at).toISOString().slice(0, 10)}</lastmod>` : ''}${links}</url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>\n`;
}
