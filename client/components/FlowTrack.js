import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// A track of slides that pages (snapping, with Previous and Next) or scrolls, horizontally or
// vertically: the carousel of a node (NodeView) and of a gallery (GalleryViews) are this one.
//  count      how many slides
//  draw(i)    the slide
//  flow       page | scroll
//  axis       h | v
//  wide       no frame, not square; also no glide: a button or a key changes the slide at once, only a
//             touch drag moves it (it follows the finger, the browser snaps it on release)
//  start      the slide shown first (the browser scrolls to it after the page is adopted)
//  onAt(i)    the slide the track has settled on
//  itemLabel  (i) -> the accessible name of a slide, else "n of count"
export const FlowTrack = ({ count, draw, label, flow = 'page', axis = 'h', start = 0, wide = false, onAt, itemLabel }) => {
  const { t } = useI18n();
  const track = useRef(null);
  const [at, setAt] = useState(start);
  const h = axis === 'h';
  const size = () => (h ? track.current.clientWidth : track.current.clientHeight);
  const seen = () => Math.round((h ? track.current.scrollLeft : track.current.scrollTop) / Math.max(1, size()));
  const go = step => track.current?.scrollBy({ [h ? 'left' : 'top']: step * size(), behavior: wide ? 'instant' : 'smooth' });

  // land on the first slide asked for, at once, not by gliding there
  useEffect(() => {
    if(start > 0 && track.current) track.current.scrollTo({ [h ? 'left' : 'top']: start * size(), behavior: 'instant' });
  }, []);

  // the keys of a scroller glide in the browser; here they change the slide at once
  const KEYS = h ? { ArrowLeft: -1, ArrowRight: 1, PageUp: -1, PageDown: 1 } : { ArrowUp: -1, ArrowDown: 1, PageUp: -1, PageDown: 1 };

  const key = e => {
    if(!wide || flow !== 'page' || e.altKey || e.ctrlKey || e.metaKey) return;

    const step = KEYS[e.key];
    const to = step !== undefined ? step : e.key === 'Home' ? -count : e.key === 'End' ? count : 0;

    if(!to) return;

    e.preventDefault();
    go(to);
  };

  const moved = () => {
    if(flow !== 'page') return;

    const now = seen();

    setAt(now);
    onAt?.(now);
  };

  return html`
    <div class=${`wb-node-view wb-flow wb-flow-${flow} wb-flow-${axis}${wide ? ' wb-flow-wide' : ''}`} role="group" aria-roledescription=${t(flow === 'page' ? 'view.pages' : 'view.scroll')} aria-label=${label}>
      <div class="wb-flow-track" ref=${track} tabindex="0" onScroll=${moved} onKeyDown=${key}>
        ${Array.from({ length: count }, (_, i) => html`<div class="wb-flow-item" key=${i} role="img" aria-label=${itemLabel ? itemLabel(i) : t('view.item', { n: i + 1, count })}>${draw(i)}</div>`)}
      </div>
    </div>
    ${flow === 'page' &&
    html`<p class="wb-flow-nav">
      <button type="button" class="wb-editor-chip" disabled=${at <= 0} onClick=${() => go(-1)}>${t('view.prev')}</button>
      <span role="status">${t('view.of', { n: at + 1, count })}</span>
      <button type="button" class="wb-editor-chip" disabled=${at >= count - 1} onClick=${() => go(1)}>${t('view.next')}</button>
    </p>`}
  `;
};
