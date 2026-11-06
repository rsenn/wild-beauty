import { useEffect, useMemo, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useBoot } from '../boot.js';
import { NodeView } from './NodeView.js';
import { OwnerBar } from './SiteApp.js';
import { RecordConsent } from './RecordConsent.js';
import { PushToggle } from './PushToggle.js';
import { GalleryView } from './GalleryView.js';
import { GalleryCarousel, GalleryMasonry, ViewSwitch } from './GalleryViews.js';
import { GalleryNav, GalleryTools } from './GalleryTools.js';
import { createChrome } from '../gallery/chrome.js';
import { galleryItems, galleryable } from '../gallery/items.js';
import { viewOf } from '../gallery/presentation.js';

// A page of a personal site (docs/SITES.md): the navigation of the sitemap above,
// the node in a centred stage below. Its own layout, not the app's tab strip.
// Centres what is drawn on the stage horizontally: the picture is shifted (by its viewBox) so that the middle of
// the drawn parts is the middle of the stage, however the page was laid out in the editor.
const centre = root => {
  for(const svg of root.querySelectorAll('.wb-node-view svg')) {
    const box = svg.getBoundingClientRect();
    const [x0, y0, w, h] = (svg.getAttribute('viewBox') ?? '0 0 1000 1000').split(/\s+/).map(Number);
    let left = Infinity;
    let right = -Infinity;

    for(const part of svg.children) {
      if(part.tagName === 'defs' || part.tagName === 'rect') continue;

      const r = part.getBoundingClientRect();

      if(r.width > 0) (left = Math.min(left, r.left), (right = Math.max(right, r.right)));
    }

    if(box.width > 0 && left < right) svg.setAttribute('viewBox', `${x0 + (((left + right) / 2 - box.left) * w) / box.width - w / 2} ${y0} ${w} ${h}`);
  }
};

export const SitePage = () => {
  const { site, photos = {} } = useBoot();
  const { node, nav } = site;
  const stage = useRef(null);
  const { lang } = useBoot();
  // a gallery page offers the three views of the node page (docs/SITES.md S16); no picture leads to a page of its own here
  const items = galleryItems(node, lang, hash => photos[hash] ?? null).map(({ href, ...item }) => item);
  const isGallery = galleryable(node, items);
  const [view, setView] = useState(viewOf(new URLSearchParams(globalThis.location?.search).get('view')));
  const at = useRef(null);
  const chrome = useMemo(createChrome, []);
  const remember = id => id && (at.current = id);
  const choose = next => setView(next);
  const poster = html`<${NodeView} doc=${node.doc} photos=${hash => photos[hash] ?? null} label=${node.title} />`;

  useEffect(() => {
    const run = () => centre(stage.current);

    run();
    // photos arrive after the first paint and change what is drawn
    const timer = setTimeout(run, 600);

    return () => clearTimeout(timer);
  }, []);

  return html`
    <div class="site">
      <header class="site-head">
        <nav class="site-nav" aria-label=${site.title}>
          ${nav.map(
            (item, i) => html`${i > 0 && html`<span class="site-dot" aria-hidden="true">·</span>`}<a class="site-link" href=${item.href} aria-current=${item.current ? 'page' : null}>${item.title}</a>`,
          )}
        </nav>
      </header>
      <main class="site-stage" ref=${stage}>
        <h1 class="site-h1">${node.title}</h1>
        ${isGallery && html`<div class="wb-node-head"><${ViewSwitch} view=${view} onView=${choose} />${view === '3d' && html`<${GalleryTools} chrome=${chrome} overview=${!at.current} />`}</div>`}
        ${isGallery && view === 'carousel' && html`<${GalleryCarousel} key="carousel" items=${items} at=${at.current} onAt=${remember} label=${node.title} />`}
        ${isGallery && view === 'masonry' && html`<${GalleryMasonry} key="masonry" items=${items} at=${at.current} onAt=${remember} onPick=${id => (remember(id), choose('carousel'))} label=${node.title} />`}
        ${isGallery && view === '3d' && html`<${GalleryView} key="3d" items=${items} doc=${node.kind === 'gallery' ? node.doc : undefined} photos=${hash => photos[hash] ?? null} overview=${!at.current} startAt=${at.current} onAt=${remember} label=${node.title} chrome=${chrome}>${poster}<//>`}
        ${!isGallery && poster}
        ${isGallery && view === '3d' && html`<div class="wb-node-foot"><${GalleryNav} chrome=${chrome} /></div>`}
      </main>
      <footer class="site-foot"><${PushToggle} />${site.owner && html`<${RecordConsent} fold=${true} />`}</footer>
      ${site.owner && html`<${OwnerBar} edit=${node.slug ? `/edit/${node.slug}` : '/edit'} />`}
    </div>
  `;
};
