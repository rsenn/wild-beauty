import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { useEffect, useMemo, useRef, useState } from '../../vendor/hooks.js';
import { useEditor } from '../editor/core/useEditor.js';
import { createChrome } from '../gallery/chrome.js';
import { GalleryNav, GalleryTools } from './GalleryTools.js';
import { Layout } from './Layout.js';
import { NodeEditor } from './NodeEditor.js';
import { NodeView } from './NodeView.js';
import { RecordConsent } from './RecordConsent.js';
import { GalleryView } from './GalleryView.js';
import { GalleryCarousel, GalleryMasonry, ViewSwitch } from './GalleryViews.js';
import { galleryItems, galleryable } from '../gallery/items.js';
import { atOf, presentationQuery, viewOf } from '../gallery/presentation.js';

// /:lang/node/:id: a saved node, read-only. The server renders it into the
// HTML (no JavaScript needed to see it); the browser adopts the same markup
// from boot.node and boot.photos. On a node of one's own the recording tick box sits at the lower
// right, also while the editor is open (client/replay.js).

// the address shows the view and the picture, so a link, a reload and the back button keep the place
const writeLocation = (view, at) => globalThis.history?.replaceState?.(null, '', `${globalThis.location.pathname}${presentationQuery({ view, at })}${globalThis.location.hash}`);

export const NodePage = () => {
  const { t } = useI18n();
  const { node, photos = {}, lang, view: bootView, at: bootAt } = useBoot();
  const [view, setView] = useState(viewOf(bootView)); // 3d | carousel | masonry (docs/GALLERY.md S5a)
  const at = useRef(atOf(bootAt)); // the picture all three views share: an item id, not an index
  // how the 3D view opens, fixed when it opens: from above, or standing at the picture asked for
  const opening = () => ({ overview: node.kind === 'gallery' && !at.current, at: at.current });
  const [open3d, setOpen3d] = useState(opening);
  const title = node.title || t('node.untitled');
  const { open: editing, target, openEditor, closeEditor } = useEditor();
  const editingThis = editing && target === node.id;

  // /node/:id?edit=1&back=/en/tree?batch=...: Close goes back to the batch editor, not to the node view
  const back = (() => {
    const to = new URLSearchParams(globalThis.location?.search).get('back');

    return to && /^\/[a-z]{2}\/(tree|profile)(\?|$)/.test(to) ? to : null;
  })();
  const close = () => (back ? globalThis.location.assign(back) : closeEditor());

  // /node/:id?edit=1 (the batch editor's pencil) opens the editor at once
  useEffect(() => {
    if(node.mine && /[?&]edit(=|&|$)/.test(globalThis.location.search)) openEditor(node.id);
  }, []);
  const items = galleryItems(node, lang, hash => photos[hash] ?? null);
  const chrome = useMemo(createChrome, []); // the buttons of the 3D gallery that sit outside its stage
  const isGallery = !editingThis && galleryable(node, items);
  const poster = html`<${NodeView} doc=${node.doc} photos=${hash => photos[hash] ?? null} label=${title} />`;
  const shown = isGallery ? view : '3d';

  // a view hears which picture the visitor is on and tells the address
  const remember = id => {
    if(!id || id === at.current) return;

    at.current = id;
    writeLocation(shown, id);
  };
  const choose = next => {
    if(next === '3d') setOpen3d(opening());

    setView(next);
    writeLocation(next, at.current);
  };

  return html`
    <${Layout} active="" hrefFor=${code => `/${code}/node/${node.id}`}>
      <div class="wb-node-head">
        <h1 class="wb-node-title">${title}</h1>
        ${isGallery && html`<${ViewSwitch} view=${shown} onView=${choose} />`}
        ${isGallery && html`<a class="wb-node-book" href=${`/${lang}/node/${node.id}/book`}>${t('book.link')}</a>`}
        ${isGallery && shown === '3d' && html`<${GalleryTools} chrome=${chrome} overview=${open3d.overview} />`}
      </div>
      ${!editingThis && shown === 'carousel' && html`<${GalleryCarousel} key="carousel" items=${items} at=${at.current} onAt=${remember} label=${title} />`}
      ${!editingThis && shown === 'masonry' && html`<${GalleryMasonry} key="masonry" items=${items} at=${at.current} onAt=${remember} onPick=${id => (remember(id), choose('carousel'))} label=${t('gallery.album')} />`}
      ${!editingThis && shown === '3d' && (isGallery ? html`<${GalleryView} key="3d" items=${items} doc=${node.kind === 'gallery' ? node.doc : undefined} photos=${hash => photos[hash] ?? null} overview=${open3d.overview} startAt=${open3d.at} onAt=${remember} label=${title} chrome=${chrome}>${poster}<//>` : poster)}
      ${!editingThis && html`<div class="wb-node-foot">${node.mine && html`<button type="button" class="wb-editor-chip wb-node-edit" onClick=${() => openEditor(node.id)}>${t('editor.edit')}</button>`}${isGallery && shown === '3d' && html`<${GalleryNav} chrome=${chrome} />`}</div>`}
      ${editingThis && html`<${NodeEditor} key=${target} target=${target} onClose=${close} />`}
      ${node.mine && html`<div class="wb-node-record"><${RecordConsent} fold=${true} /></div>`}
    <//>
  `;
};
