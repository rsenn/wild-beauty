import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { useMemo } from '../../vendor/hooks.js';
import { useEditor } from '../editor/useEditor.js';
import { createChrome } from '../gallery/chrome.js';
import { GalleryNav, GalleryTools } from './GalleryTools.js';
import { Layout } from './Layout.js';
import { NodeEditor } from './NodeEditor.js';
import { NodeView } from './NodeView.js';
import { GalleryView } from './GalleryView.js';
import { galleryItems, galleryable } from '../gallery/items.js';

// /:lang/node/:id: a saved node, read-only. The server renders it into the
// HTML (no JavaScript needed to see it); the browser adopts the same markup
// from boot.node and boot.photos.
export const NodePage = () => {
  const { t } = useI18n();
  const { node, photos = {}, lang } = useBoot();
  const title = node.title || t('node.untitled');
  const { open: editing, target, openEditor, closeEditor } = useEditor();
  const editingThis = editing && target === node.id;
  const items = galleryItems(node, lang, hash => photos[hash] ?? null);
  const chrome = useMemo(createChrome, []); // the buttons of the 3D gallery that sit outside its stage
  const isGallery = !editingThis && galleryable(node, items);
  const view = html`<${NodeView} doc=${node.doc} photos=${hash => photos[hash] ?? null} label=${title} />`;

  return html`
    <${Layout} active="" hrefFor=${code => `/${code}/node/${node.id}`}>
      <div class="wb-node-head">
        <h1 class="wb-node-title">${title}</h1>
        ${isGallery && html`<${GalleryTools} chrome=${chrome} overview=${node.kind === 'gallery'} />`}
      </div>
      ${!editingThis && (isGallery ? html`<${GalleryView} items=${items} doc=${node.kind === 'gallery' ? node.doc : undefined} overview=${node.kind === 'gallery'} label=${title} chrome=${chrome}>${view}<//>` : view)}
      ${!editingThis && html`<div class="wb-node-foot"><button type="button" class="wb-editor-chip wb-node-edit" onClick=${() => openEditor(node.id)}>${t('editor.edit')}</button>${isGallery && html`<${GalleryNav} chrome=${chrome} />`}</div>`}
      ${editingThis && html`<${NodeEditor} key=${target} target=${target} onClose=${closeEditor} />`}
    <//>
  `;
};
