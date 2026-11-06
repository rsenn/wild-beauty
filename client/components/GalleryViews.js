import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { PAGE_SIZE, VIEWS, pageCount, pageItems, pageOf, startIndex } from '../gallery/presentation.js';
import { FlowTrack } from './FlowTrack.js';
import { NoteText } from './NoteText.js';
import { createCaptionSaver } from '../editor/io/captions.js';

// The other ways to show the items of a gallery next to the 3D one (docs/GALLERY.md S5a):
// a carousel and a masonry album. They show the same items in the same order as the 3D
// gallery, and the picture the visitor is on (`at`, an item id) goes with them from one
// view to the next.

// beside the node title: which presentation the gallery is shown in
export const ViewSwitch = ({ view, onView }) => {
  const { t } = useI18n();

  return html`
    <div class="wb-gallery-views" role="group" aria-label=${t('gallery.view.label')}>
      ${VIEWS.map(v => html`<button type="button" class="wb-editor-chip" aria-pressed=${v === view ? 'true' : 'false'} onClick=${() => onView(v)}>${t(`gallery.view.${v}`)}</button>`)}
    </div>
  `;
};

// one picture large, with its note beside it (docs/GALLERY.md S5c): to the right in a landscape
// window, under it in a portrait one. The thumbnail is always there; the full image of the slide
// that is shown and of its neighbours loads on top of it and fades in once it is complete, so a
// slide never blinks from one image to the other. `note` is the picture's note in full (an own
// photo), `Edit` the owner's field, only there for the owner.
const Slide = ({ item, near, note, Editor, status, startOpen, onCommit, onNext, onRetry }) => {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const full = item.full && item.full !== item.url ? item.full : null;
  const editable = !!(Editor && item.step && item.rev !== undefined);
  const open = editing || (startOpen && editable && !note);

  // the column of the note exists only when there is a note or it is being written: a picture
  // without one stays in the middle
  return html`
    <figure class=${'wb-gallery-slide' + (note || open ? ' wb-has-note' : '')}>
      <div class="wb-gallery-body">
        <div class="wb-gallery-pic">
          <img src=${item.url} alt=${item.title ?? ''} loading=${near ? 'eager' : 'lazy'} decoding="async" />
          ${full && near && html`<img class=${`wb-gallery-full${ready ? ' wb-gallery-ready' : ''}`} src=${full} alt="" decoding="async" onLoad=${() => setReady(true)} />`}
        </div>
        ${editable && (note || open)
          ? html`<aside class="wb-slide-note"><${Editor.NoteEdit} text=${note ?? ''} hash=${/^[0-9a-f]{64}$/.test(item.id.split(':').pop()) ? item.id.split(':').pop() : null} label=${item.title ?? ''} status=${status} editing=${open} setEditing=${setEditing} onCommit=${onCommit} onNext=${onNext} onRetry=${onRetry} /></aside>`
          : note && html`<aside class="wb-slide-note"><${NoteText} text=${note} /></aside>`}
      </div>
      <figcaption>
        ${note ? '' : item.title ?? ''}${item.href && html` <a class="wb-gallery-open" href=${item.href}>${t('gallery.open')}</a>`}
        ${editable && !note && !open && html` <${Editor.NoteAdd} onClick=${() => setEditing(true)} />`}
      </figcaption>
    </figure>
  `;
};

// `at` is the item the carousel starts on, `onAt(id)` hears the one it settles on. The owner of
// the node whose photos these are (or of the children they come from) can write the notes right
// here: the items that carry a `rev` are theirs, the field is loaded on demand and each node's
// changes go to the server by its own caption saver (client/editor/io/captions.js).
export const GalleryCarousel = ({ items, at, onAt, label }) => {
  const { t } = useI18n();
  const start = startIndex(items, at);
  const [now, setNow] = useState(start);
  const [Editor, setEditor] = useState(null); // the owner's note tools, loaded on demand
  const [openKey, setOpenKey] = useState(null); // the picture whose field Ctrl+Enter opens next
  const [notes, setNotes] = useState({}); // what the owner wrote since the page was drawn: "node:step" -> text
  const [status, setStatus] = useState(null);
  const [statusKey, setStatusKey] = useState(null); // the picture the status line belongs to: the one written last
  const savers = useRef(new Map()); // node id -> its caption saver
  const control = useRef(null);
  const editable = items.some(item => item.rev !== undefined);

  const saverFor = item => {
    let saver = savers.current.get(item.node);

    if(!saver) {
      saver = createCaptionSaver({ id: item.node, rev: item.rev });
      saver.onState(setStatus);
      savers.current.set(item.node, saver);
    }

    return saver;
  };

  useEffect(() => {
    if(!editable) return;

    const leave = e => [...savers.current.values()].some(s => s.pending()) && (e.preventDefault(), (e.returnValue = ''));

    window.addEventListener('beforeunload', leave);
    import('./NoteEdit.js').then(setEditor);

    return () => {
      window.removeEventListener('beforeunload', leave);
      for(const saver of savers.current.values()) saver.flush();
    };
  }, [editable]);

  // Ctrl+Enter: on to the next picture, and when that one has no note yet and is the owner's, its field opens
  const next = i => {
    const after = items[i + 1];

    setOpenKey(after && after.rev !== undefined && after.step && !(`${after.node}:${after.step}` in notes) && !after.desc ? `${after.node}:${after.step}` : null);
    control.current?.go(1);
  };

  const commit = (item, text) => {
    const saver = saverFor(item);

    setNotes(old => ({ ...old, [`${item.node}:${item.step}`]: text }));
    setStatusKey(`${item.node}:${item.step}`);
    saver.set(item.step, text);
    saver.flush();
  };

  return html`
    <${FlowTrack}
      count=${items.length}
      start=${start}
      wide=${true}
      label=${label}
      control=${control}
      draw=${i => {
        const item = items[i];
        const key = `${item.node}:${item.step}`;

        return html`<${Slide}
          item=${item}
          near=${Math.abs(i - now) <= 1}
          note=${key in notes ? notes[key] : item.desc}
          Editor=${Editor}
          startOpen=${openKey === key}
          status=${statusKey === key ? status : null}
          onCommit=${text => commit(item, text)}
          onNext=${() => next(i)}
          onRetry=${() => saverFor(item).flush()}
        />`;
      }}
      itemLabel=${i => items[i].title || t('view.item', { n: i + 1, count: items.length })}
      onAt=${i => (setNow(i), onAt?.(items[i]?.id ?? null))}
    />
  `;
};

// every item at once as square tiles, a page of PAGE_SIZE at a time. The tile of the current
// picture is marked and scrolled into view; a tap on a tile makes it the current one and
// `onPick(id)` is told (the page then opens it in the carousel).
export const GalleryMasonry = ({ items, at, onPick, onAt, label }) => {
  const { t } = useI18n();
  const first = startIndex(items, at);
  const [page, setPage] = useState(pageOf(first));
  const [current, setCurrent] = useState(items[first]?.id ?? null);
  const pages = pageCount(items.length);
  const ring = useRef(null);

  // the current tile is in view when the album opens and when the page turns
  useEffect(() => {
    ring.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [page]);

  const turn = to => {
    const next = Math.min(pages - 1, Math.max(0, to));

    setPage(next);

    // the page's first picture becomes current when the current one is on another page
    const here = pageItems(items, next);

    if(!here.some(item => item.id === current) && here[0]) {
      setCurrent(here[0].id);
      onAt?.(here[0].id);
    }
  };

  return html`
    <section class="wb-masonry" aria-label=${label}>
      <ol class="wb-masonry-grid">
        ${pageItems(items, page).map((item, i) => {
          const index = page * PAGE_SIZE + i;
          const on = item.id === current;

          return html`
            <li class=${`wb-masonry-tile${on ? ' wb-masonry-current' : ''}`} key=${item.id} ref=${on ? ring : null}>
              <button type="button" aria-pressed=${on ? 'true' : 'false'} aria-label=${item.title || t('view.item', { n: index + 1, count: items.length })} onClick=${() => (setCurrent(item.id), onAt?.(item.id), onPick?.(item.id))}>
                <img src=${item.url} alt=${item.title ?? ''} loading="lazy" decoding="async" />
              </button>
              ${item.href && html`<a class="wb-masonry-open" href=${item.href} aria-label=${`${t('gallery.open')}: ${item.title ?? ''}`}>↗</a>`}
            </li>
          `;
        })}
      </ol>
      ${pages > 1 &&
      html`<p class="wb-flow-nav">
        <button type="button" class="wb-editor-chip" disabled=${page <= 0} onClick=${() => turn(page - 1)}>${t('view.prev')}</button>
        <span role="status">${t('gallery.album.page', { n: page + 1, count: pages })}</span>
        <button type="button" class="wb-editor-chip" disabled=${page >= pages - 1} onClick=${() => turn(page + 1)}>${t('view.next')}</button>
      </p>`}
    </section>
  `;
};
