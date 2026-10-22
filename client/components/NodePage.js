import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { renderNode } from '../editor/render.js';
import { Layout } from './Layout.js';

// /:lang/node/:id: a saved node, read-only. The server renders it into the
// HTML (no JavaScript needed to see it); the browser adopts the same markup
// from boot.node and boot.photos.
export const NodePage = () => {
  const { t } = useI18n();
  const { node, photos = {} } = useBoot();
  const title = node.title || t('node.untitled');

  return html`
    <${Layout} active="" hrefFor=${code => `/${code}/node/${node.id}`}>
      <h1 class="wb-node-title">${title}</h1>
      <div class="wb-node-view" role="img" aria-label=${title}>${renderNode(node.doc, { photos: hash => photos[hash] ?? null })}</div>
    <//>
  `;
};
