import { useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { gridPlan } from '../editor/grid.js';
import { photoSteps, renderNode } from '../editor/render.js';

// What the viewer shows of a node, as a list of stages and how to move along it
// (EDITOR.md E135): `{ flow, axis, list: [{ mode, page, part }] }`.
//  free     one stage per page          slides  one per photo
//  grid     fit: one stage with all photos; page: pages of cols x cols;
//           scroll: one long stage
// `layout.flow` is page (default) or scroll for free and slides, and fit
// (default), page or scroll for a grid; `layout.axis` h or v.
export function viewOf(doc) {
  const layout = doc.layout ?? {};

  if(doc.mode === 'grid') {
    const plan = gridPlan(photoSteps(doc).length, layout);

    return { flow: plan.flow, axis: plan.axis, list: plan.pages.map((_, part) => ({ mode: 'grid', part })) };
  }

  const flow = layout.flow === 'scroll' ? 'scroll' : 'page';
  const axis = layout.axis === 'h' || layout.axis === 'v' ? layout.axis : flow === 'scroll' ? 'v' : 'h';
  const count = doc.mode === 'slides' ? photoSteps(doc).length : doc.pages.length;

  return { flow, axis, list: Array.from({ length: Math.max(1, count) }, (_, page) => ({ mode: doc.mode, page })) };
}

// the node as the visitor sees it: one stage, or a track of them that pages
// (snapping, with Previous and Next) or scrolls, horizontally or vertically
export const NodeView = ({ doc, photos, label }) => {
  const { t } = useI18n();
  const { flow, axis, list } = viewOf(doc);
  const track = useRef(null);
  const [at, setAt] = useState(0);
  const draw = item => renderNode(doc, { photos, links: true, ...item });

  if(flow === 'fit' || (flow === 'page' && list.length < 2)) return html`<div class="wb-node-view" role="img" aria-label=${label}>${draw(list[0])}</div>`;

  const h = axis === 'h';
  const size = () => (h ? track.current.clientWidth : track.current.clientHeight);
  const seen = () => Math.round((h ? track.current.scrollLeft : track.current.scrollTop) / Math.max(1, size()));
  const go = step => track.current?.scrollBy({ [h ? 'left' : 'top']: step * size(), behavior: 'smooth' });

  return html`
    <div class=${`wb-node-view wb-flow wb-flow-${flow} wb-flow-${axis}`} role="group" aria-roledescription=${t(flow === 'page' ? 'view.pages' : 'view.scroll')} aria-label=${label}>
      <div class="wb-flow-track" ref=${track} tabindex="0" onScroll=${() => flow === 'page' && setAt(seen())}>
        ${list.map((item, i) => html`<div class="wb-flow-item" key=${i} role="img" aria-label=${t('view.item', { n: i + 1, count: list.length })}>${draw(item)}</div>`)}
      </div>
    </div>
    ${flow === 'page' &&
    html`<p class="wb-flow-nav">
      <button type="button" class="wb-editor-chip" disabled=${at <= 0} onClick=${() => go(-1)}>${t('view.prev')}</button>
      <span role="status">${t('view.of', { n: at + 1, count: list.length })}</span>
      <button type="button" class="wb-editor-chip" disabled=${at >= list.length - 1} onClick=${() => go(1)}>${t('view.next')}</button>
    </p>`}
  `;
};
