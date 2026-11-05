import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { renderText } from '../editor/view/render.js';
import { Layout } from './Layout.js';

// /:lang/view ("Show", where / leads to, so the landing page with the logo): the galleries as cards
// (docs/GALLERY.md S5b). A card has a mosaic of the actual photos, the title drawing of the gallery (its text
// box, drawn as in the editor) or else its title, and the number of pictures. Plain links, no JavaScript needed.

// how many cells and columns the mosaic of n pictures has
export const mosaic = n => (n >= 6 ? { cols: 3, cells: 6 } : n >= 4 ? { cols: 2, cells: 4 } : { cols: Math.max(1, n), cells: Math.max(1, n) });

// the text box of the gallery as a picture of its own: the stage cropped to the box
const Heading = ({ heading, label }) => {
  const [x, y, w, h] = heading.box;

  return html`<svg class="wb-view-heading" viewBox=${`${x} ${y} ${w} ${h}`} role="img" aria-label=${label} preserveAspectRatio="xMidYMid meet">${renderText(heading.step, heading.step.m)}</svg>`;
};

const Card = ({ card }) => {
  const { t } = useI18n();
  const title = card.title || t('node.untitled');
  const { cols, cells } = mosaic(card.photos.length);

  return html`
    <li class="wb-view-card">
      <a href=${card.href}>
        <span class="wb-view-mosaic" style=${`grid-template-columns:repeat(${cols},1fr)`} aria-hidden="true">
          ${card.photos.slice(0, cells).map(p => html`<img key=${p.id} src=${p.url} alt="" loading="lazy" decoding="async" />`)}
          ${!card.photos.length && html`<span class="wb-view-empty"></span>`}
        </span>
        <span class="wb-view-caption">
          ${card.heading ? html`<${Heading} heading=${card.heading} label=${title} />` : html`<span class="wb-view-title">${title}</span>`}
          <span class="wb-view-count">${t('view.count', { n: card.count })}</span>
        </span>
      </a>
    </li>
  `;
};

export const GalleryPage = () => {
  const { t } = useI18n();
  const { gallery } = useBoot();

  return html`
    <${Layout} logo active="show" hrefFor=${code => `/${code}/view`}>
      <h1 class="wb-node-title">${t('gallery.title')}</h1>
      ${gallery.cards.length ? html`<ul class="wb-view-grid">${gallery.cards.map(card => html`<${Card} key=${card.id} card=${card} />`)}</ul>` : html`<p>${t('gallery.none')}</p>`}
    <//>
  `;
};
