// Clips with several outlines (EDITOR.md E122). A clip is one shape whose path
// has several closed subpaths 'M..L..Z'. SVG fills a clip path with the
// non-zero rule, so no polygon boolean is needed: an outline wound the same
// way as the first one ADDS to the clip (overlaps are united), an outline wound
// the other way cuts a HOLE where it lies over an added one.
import { area, contains, cutByStroke } from './polygon.js';
import { addStep, findStep, setClip } from './model.js';
import { apply, invert } from './matrix.js';
import { effective } from './render.js';
import { verticesFromPath } from './shapes.js';

const r = v => Math.round(v * 100) / 100;

// the closed polygons of a path of 'M..L..Z' subpaths (what pathFromPolygons
// writes; also a single polygon from the clip tool); [] when it is anything else
export function polygonsFromPath(d) {
  const polys = [];

  for(const part of String(d).split(/(?=M)/)) {
    if(!part.trim()) continue;

    // the sampled polygon of one subpath: curves are not used by multi-outline clips
    const parsed = verticesFromPath(part);

    if(!parsed?.closed || parsed.vertices.some(v => v.hin || v.hout)) return [];

    polys.push(parsed.vertices.map(v => [v.x, v.y]));
  }

  return polys;
}

export const pathFromPolygons = polys => polys.map(poly => `M${poly.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}Z`).join('');

// a polygon wound positively (counter-clockwise in y-up, i.e. positive signed area) or negatively
export const wound = (poly, positive) => ((area(poly) > 0) === positive ? poly : [...poly].reverse());

// non-zero winding number of point p in a polygon list (positive and negative outlines)
export function windingAt(polys, p) {
  let total = 0;

  for(const poly of polys) {
    let w = 0;

    for(let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];

      if(y1 <= p[1]) {
        if(y2 > p[1] && (x2 - x1) * (p[1] - y1) - (p[0] - x1) * (y2 - y1) > 0) w++;
      } else if(y2 <= p[1] && (x2 - x1) * (p[1] - y1) - (p[0] - x1) * (y2 - y1) < 0) w--;
    }

    total += w;
  }

  return total;
}

// the clip shape of photo `id` in stage units (its own matrix is applied by `effective`)
function clipOf(doc, id) {
  const at = findStep(doc, id);

  if(at?.step.op !== 'photo') return null;

  const by = effective(doc.pages[at.page].steps).by;
  const shapeId = by.get(id)?.clip;
  const shape = shapeId && findStep(doc, shapeId);

  return shape?.step.op === 'shape' ? { shape: shape.step, page: at.page, m: by.get(shapeId)?.m ?? shape.step.m ?? [1, 0, 0, 1, 0, 0] } : null;
}

// How a new closed outline meets the clip: 'add' (united with it) or 'subtract'
// (a hole). Returns null when the outline is not combined with the clip (mode
// 'replace', no clip, a clip that is not plain polygons, or a moved clip shape);
// the caller then replaces the clip. A hole must lie inside what is clipped,
// else the document is returned unchanged.
export function combineOutline(doc, id, polygon, mode, shapeId, style) {
  const at = findStep(doc, id);
  const clip = clipOf(doc, id);

  if(at?.step.op !== 'photo' || !Array.isArray(polygon) || polygon.length < 3) return doc;

  const polys = clip ? polygonsFromPath(clip.shape.path) : [];
  const moved = clip && clip.m && !(clip.m[0] === 1 && clip.m[1] === 0 && clip.m[2] === 0 && clip.m[3] === 1 && clip.m[4] === 0 && clip.m[5] === 0);

  if(mode === 'replace' || !clip || !polys.length || moved) return null;

  const base = polys.map(poly => wound(poly, true));
  const next = mode === 'subtract' ? [...base, wound(polygon, false)] : [...base, wound(polygon, true)];

  if(mode === 'subtract' && !windingAt(base, polygon[0]) && !windingAt(base, centroid(polygon))) return doc;

  const at2 = findStep(doc, clip.shape.id);

  if(!at2) return doc;

  return {
    ...doc,
    pages: doc.pages.map((page, i) => (i === at2.page ? { ...page, steps: page.steps.map(step => (step.id === clip.shape.id ? { ...step, path: pathFromPolygons(next) } : step)) } : page)),
  };
}

const centroid = poly => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];

// how many separate (positive) outlines the clip of photo `id` has
export function outlineCount(doc, id) {
  const clip = clipOf(doc, id);

  return clip ? polygonsFromPath(clip.shape.path).filter(poly => area(poly) > 0).length || (polygonsFromPath(clip.shape.path).length ? 1 : 0) : 0;
}

// Split a clip with several outlines into one photo copy per outline (E122): the
// photo keeps the first, each other outline gets a copy of the photo right above
// with its own shape. Holes go with the outline they lie in. `ids` are fresh ids
// (shapes and copies). Returns the document, unchanged when there is one outline.
export function splitClip(doc, id, ids) {
  const clip = clipOf(doc, id);
  const at = findStep(doc, id);

  if(!clip || at?.step.op !== 'photo') return doc;

  const polys = polygonsFromPath(clip.shape.path);
  const positive = polys.filter(poly => area(poly) > 0);
  const negative = polys.filter(poly => area(poly) < 0);

  if(positive.length < 2 || ids.length < (positive.length - 1) * 2) return doc;

  const pageId = doc.pages[clip.page].id;
  const groups = positive.map(poly => [poly, ...negative.filter(h => contains(poly, centroid(h)))]);
  let next = doc;

  // the photo and its shape take the first outline
  next = {
    ...next,
    pages: next.pages.map((page, i) => (i === clip.page ? { ...page, steps: page.steps.map(step => (step.id === clip.shape.id ? { ...step, path: pathFromPolygons(groups[0]) } : step)) } : page)),
  };

  let used = 0;

  groups.slice(1).forEach((group, k) => {
    const shapeId = ids[used++];
    const copyId = ids[used++];
    const { clip: _drop, ...base } = at.step;

    next = addStep(next, pageId, { ...clip.shape, id: shapeId, path: pathFromPolygons(group) });
    next = addStep(next, pageId, { ...base, id: copyId }, at.index + 1 + k);
    next = setClip(next, copyId, shapeId);
  });

  return next;
}

// The outlines of the clip of photo `id` in stage units for editing (E116):
// { shape, polys } or null when there is no clip or it is not made of plain polygons.
export function clipPolygonsOf(doc, id) {
  const clip = clipOf(doc, id);

  if(!clip) return null;

  const polys = polygonsFromPath(clip.shape.path);

  return polys.length ? { shape: clip.shape.id, polys: polys.map(poly => poly.map(q => apply(clip.m, q))) } : null;
}

// write edited outlines (stage units) back into the clip shape of photo `id`
export function setClipPolygons(doc, id, polys) {
  const clip = clipOf(doc, id);
  const inverse = clip && invert(clip.m);
  const at = clip && findStep(doc, clip.shape.id);

  if(!inverse || !at || !Array.isArray(polys) || polys.length === 0 || polys.some(poly => !Array.isArray(poly) || poly.length < 3 || poly.some(q => !q.every(Number.isFinite)))) return doc;

  const path = pathFromPolygons(polys.map(poly => poly.map(q => apply(inverse, q))));

  return { ...doc, pages: doc.pages.map((page, i) => (i === at.page ? { ...page, steps: page.steps.map(step => (step.id === clip.shape.id ? { ...step, path } : step)) } : page)) };
}

// the vertex of `polys` nearest to p within `tol`: { poly, vertex } or null
export function nearestVertex(polys, p, tol) {
  let best = null;

  polys.forEach((poly, i) =>
    poly.forEach(([x, y], j) => {
      const d = Math.hypot(x - p[0], y - p[1]);

      if(d <= tol && (!best || d < best.d)) best = { poly: i, vertex: j, d };
    }),
  );

  return best;
}

// a new vertex on the edge of `polys` nearest to p within `tol` (and not near a vertex):
// { polys, poly, vertex } with the vertex inserted at the foot of p, or null
export function insertOnEdge(polys, p, tol) {
  let best = null;

  polys.forEach((poly, i) =>
    poly.forEach((a, j) => {
      const b = poly[(j + 1) % poly.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = dx * dx + dy * dy;
      const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
      const d = Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));

      if(d <= tol && t > 0.05 && t < 0.95 && (!best || d < best.d)) best = { poly: i, after: j, point: [a[0] + t * dx, a[1] + t * dy], d };
    }),
  );

  if(!best) return null;

  const next = polys.map(poly => [...poly]);

  next[best.poly].splice(best.after + 1, 0, best.point);

  return { polys: next, poly: best.poly, vertex: best.after + 1 };
}

// Cut a clip of several outlines along a stroke (E121 for E122 clips): the largest
// outline the stroke splits in two (exactly two crossings) is split, every other
// outline goes to the piece on its side of the stroke's chord. -> [polys, polys]
// (each a list of outlines) or null when the stroke splits none.
export function cutOutlines(polys, stroke, reach) {
  if(!Array.isArray(polys) || polys.length < 2 || !Array.isArray(stroke) || stroke.length < 2) return null;

  const order = polys.map((poly, i) => i).sort((a, b) => Math.abs(area(polys[b])) - Math.abs(area(polys[a])));

  for(const i of order) {
    const parts = cutByStroke(polys[i], stroke, reach);

    if(!parts) continue;

    const [a, b] = stroke[0];
    const [c, d] = stroke[stroke.length - 1];
    const side = poly => {
      const m = poly.reduce(([x, y], q) => [x + q[0] / poly.length, y + q[1] / poly.length], [0, 0]);

      return Math.sign((c - a) * (m[1] - b) - (d - b) * (m[0] - a));
    };
    const positive = area(polys[i]) > 0;
    const out = [[wound(parts[0], positive)], [wound(parts[1], positive)]];
    const first = side(parts[0]);

    polys.forEach((poly, j) => j !== i && out[side(poly) === first ? 0 : 1].push(poly));

    return out;
  }

  return null;
}
