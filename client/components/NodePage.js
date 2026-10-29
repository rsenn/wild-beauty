import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { useEditor } from '../editor/useEditor.js';
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
  const items = galleryItems(node, lang);
  const view = html`<${NodeView} doc=${node.doc} photos=${hash => photos[hash] ?? null} label=${title} />`;

  return html`
    <${Layout} active="" hrefFor=${code => `/${code}/node/${node.id}`}>
      <h1 class="wb-node-title">${title}</h1>
      ${!editingThis && (galleryable(node, items) ? html`<${GalleryView} items=${items} label=${title}>${view}<//>` : view)}
      ${!editingThis && html`<p><button type="button" class="wb-editor-chip wb-node-edit" onClick=${() => openEditor(node.id)}>${t('editor.edit')}</button></p>`}
      ${editingThis && html`<${NodeEditor} key=${target} target=${target} onClose=${closeEditor} />`}
    <//>
  `;
};
