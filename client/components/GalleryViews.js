import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { PAGE_SIZE, VIEWS, pageCount, pageItems, pageOf, startIndex } from '../gallery/presentation.js';
import { FlowTrack } from './FlowTrack.js';

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

// one picture large, with its title and the way to its page. The thumbnail is always there; the
// full image of the slide that is shown and of its neighbours loads on top of it and fades in
// once it is complete, so a slide never blinks from one image to the other
const Slide = ({ item, near }) => {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const full = item.full && item.full !== item.url ? item.full : null;

  return html`
    <figure class="wb-gallery-slide">
      <div class="wb-gallery-pic">
        <img src=${item.url} alt=${item.title ?? ''} loading=${near ? 'eager' : 'lazy'} decoding="async" />
        ${full && near && html`<img class=${`wb-gallery-full${ready ? ' wb-gallery-ready' : ''}`} src=${full} alt="" decoding="async" onLoad=${() => setReady(true)} />`}
      </div>
      <figcaption>${item.title ?? ''}${item.href && html` <a class="wb-gallery-open" href=${item.href}>${t('gallery.open')}</a>`}</figcaption>
    </figure>
  `;
};

// `at` is the item the carousel starts on, `onAt(id)` hears the one it settles on
export const GalleryCarousel = ({ items, at, onAt, label }) => {
  const { t } = useI18n();
  const start = startIndex(items, at);
  const [now, setNow] = useState(start);

  return html`
    <${FlowTrack}
      count=${items.length}
      start=${start}
      wide=${true}
      label=${label}
      draw=${i => html`<${Slide} item=${items[i]} near=${Math.abs(i - now) <= 1} />`}
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
