// Document changes of the clip tool (EDITOR.md E114, E121): clip a photo with a
// drawn polygon, or cut a photo in two along a stroke (two photo copies, each
// with the clip of one side). Pure: `(doc, ...) -> doc`, called by commands.js.
import { effective } from './render.js';
import { simplify } from './clipstroke.js';
import { outlineOf, shapePoints } from './hit.js';
import { addStep, findStep, removeStep, setClip } from './model.js';
import { pathFromVertices } from './shapes.js';

const r = v => Math.round(v * 100) / 100;

// the visible outline of a photo in stage units: its clip shape, else its turned
// square; null when it is not known
export function photoPolygon(doc, id, { photos = () => null } = {}) {
  const at = findStep(doc, id);

  if(at?.step.op !== 'photo') return null;

  const by = effective(doc.pages[at.page].steps).by;
  const clip = by.get(id)?.clip;
  const shape = clip && findStep(doc, clip);
  // a shape that serves as a clip is not drawn, so its matrix comes from `effective`
  const points = shape && shapePoints(shape.step, by.get(clip)?.m ?? shape.step.m ?? [1, 0, 0, 1, 0, 0]);

  // straight sides were sampled like curves: drop the points on a line
  if(points?.closed && points.points.length >= 3) {
    const flat = simplify(points.points.map(([x, y]) => [r(x), r(y)]), 0.25);
    const [first] = flat;
    const last = flat[flat.length - 1];

    // the closing segment ends where the path began
    return first[0] === last[0] && first[1] === last[1] ? flat.slice(0, -1) : flat;
  }

  return outlineOf(doc, id, { photos, page: at.page });
}

// a closed polygon as a shape step; it serves as a clip, so it is not drawn
const polygonStep = (polygon, id, { color = '#000000', width = 4 } = {}) => ({
  op: 'shape',
  id,
  path: pathFromVertices(polygon.map(([x, y]) => ({ x: r(x), y: r(y) })), true),
  closed: true,
  fill: color,
  stroke: color,
  strokeWidth: width,
});

// the shape a photo was clipped with goes when no photo uses it any more
function dropUnused(doc, shapeId) {
  if(shapeId === undefined || !findStep(doc, shapeId)) return doc;

  const used = doc.pages.some(page => page.steps.some(step => step.op === 'photo' && step.clip === shapeId));

  return used ? doc : removeStep(doc, shapeId);
}

// clip photo `id` with `polygon` (new shape step `shape`); replaces its clip
export function clipPolygon(doc, id, polygon, shape, style) {
  const at = findStep(doc, id);

  if(at?.step.op !== 'photo' || !Array.isArray(polygon) || polygon.length < 3) return doc;

  const next = setClip(addStep(doc, doc.pages[at.page].id, polygonStep(polygon, shape, style)), id, shape);

  return dropUnused(next, at.step.clip);
}

// Cut photo `id` into two: the photo keeps the first piece as its clip, a copy
// right above it (`ids` = [shape of piece 1, shape of piece 2, id of the copy])
// takes the second. The copy draws exactly as the original does now.
export function cutPhoto(doc, id, pieces, ids, style) {
  const at = findStep(doc, id);

  if(at?.step.op !== 'photo' || pieces?.length !== 2 || ids?.length !== 3 || pieces.some(p => !Array.isArray(p) || p.length < 3)) return doc;

  const pageId = doc.pages[at.page].id;
  const now = effective(doc.pages[at.page].steps).by.get(id);
  const { clip, ...base } = at.step;
  let next = addStep(doc, pageId, polygonStep(pieces[0], ids[0], style));

  next = addStep(next, pageId, polygonStep(pieces[1], ids[1], style));
  next = addStep(next, pageId, { ...base, m: now?.m ?? at.step.m, id: ids[2], clip: ids[1] }, findStep(next, id).index + 1);
  next = setClip(next, id, ids[0]);

  return dropUnused(next, clip);
}
