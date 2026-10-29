import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { Layout } from './Layout.js';
import { GalleryView } from './GalleryView.js';

// /:lang/gallery ("Show"): every saved node with a tile as a picture, in a grid
// that works without JavaScript, and the 3D gallery of them all on a button
export const GalleryPage = () => {
  const { t } = useI18n();
  const { gallery, lang } = useBoot();
  const items = gallery.items;
  const grid = html`
    <ul class="wb-gallery-grid">
      ${items.map(item => html`<li key=${item.id}><a href=${item.href} title=${item.title || null}><img src=${item.url} alt=${item.title || ''} loading="lazy" /></a></li>`)}
    </ul>
  `;

  return html`
    <${Layout} active="show" hrefFor=${code => `/${code}/gallery`}>
      <h1 class="wb-node-title">${t('gallery.title')}</h1>
      ${items.length ? html`<${GalleryView} items=${items} label=${t('gallery.title')} wide>${grid}<//>` : html`<p>${t('gallery.none')}</p>`}
    <//>
  `;
};
