import { html } from '../html.js';
import { useBoot } from '../boot.js';
import { NodeView } from './NodeView.js';

// A page of a personal site (SITES.md): the navigation of the sitemap above,
// the node in a centred stage below. Its own layout, not the app's tab strip.
export const SitePage = () => {
  const { site, photos = {} } = useBoot();
  const { node, nav } = site;

  return html`
    <div class="site">
      <header class="site-head">
        <nav class="site-nav" aria-label=${site.title}>
          ${nav.map(
            (item, i) => html`${i > 0 && html`<span class="site-dot" aria-hidden="true">·</span>`}<a class="site-link" href=${item.href} aria-current=${item.current ? 'page' : null}>${item.title}</a>`,
          )}
        </nav>
      </header>
      <main class="site-stage">
        <h1 class="site-h1">${node.title}</h1>
        <${NodeView} doc=${node.doc} photos=${hash => photos[hash] ?? null} label=${node.title} />
      </main>
    </div>
  `;
};
