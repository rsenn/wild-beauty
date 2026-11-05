import { html } from '../html.js';
import { FlowTrack } from './FlowTrack.js';
import { gridPlan } from '../editor/geometry/grid.js';
import { photoSteps, renderNode } from '../editor/view/render.js';
import { visibleDoc } from '../editor/core/model.js';

// What the viewer shows of a node, as a list of stages and how to move along it
// (docs/EDITOR.md E135): `{ flow, axis, list: [{ mode, page, part }] }`.
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
export const NodeView = ({ doc: whole, photos, label }) => {
  const doc = visibleDoc(whole);
  const { flow, axis, list } = viewOf(doc);
  const draw = item => renderNode(doc, { photos, links: true, ...item });

  if(flow === 'fit' || (flow === 'page' && list.length < 2)) return html`<div class="wb-node-view" role="img" aria-label=${label}>${draw(list[0])}</div>`;

  return html`<${FlowTrack} count=${list.length} draw=${i => draw(list[i])} label=${label} flow=${flow} axis=${axis} />`;
};
