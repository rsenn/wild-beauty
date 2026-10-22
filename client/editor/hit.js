// Picking on the stage (EDITOR.md S2.3, E39): which step is under a point,
// and the outline to draw around it. Works on the document as the renderer
// sees it: a step's matrix and clip after its transform/clip ops, shapes that
// serve as a clip not drawn (render.js `effective`). Points are stage units.
import { apply, invert } from './matrix.js';
import { effective } from './render.js';
import { segments, verticesFromPath } from './shapes.js';

const IDENTITY = [1, 0, 0, 1, 0, 0];

// a photo's local size: its long edge scaled to the stage (EDITOR.md S2.1)
function localSize({ width, height }) {
  const k = 1000 / Math.max(width, height);

  return [width * k, height * k];
}

// the polyline of a shape's path, curves sampled, through matrix `m`;
// { points, closed } or null when the path is not one we write
function shapePoints(step, m) {
  const parsed = verticesFromPath(step.path);

  if(!parsed) return null;

  const points = [];

  segments(parsed.vertices, parsed.closed).forEach((bezier, i) => {
    const lut = bezier.getLUT(16);

    for(const p of i === 0 ? lut : lut.slice(1)) points.push(apply(m, [p.x, p.y]));
  });

  if(!points.length && parsed.vertices[0]) points.push(apply(m, [parsed.vertices[0].x, parsed.vertices[0].y]));

  return { points, closed: parsed.closed };
}

// distance from point p to the segment a-b
function segmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) : 0;

  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

const polylineDistance = (p, points, closed) => {
  if(points.length === 1) return Math.hypot(p[0] - points[0][0], p[1] - points[0][1]);

  let best = Infinity;

  for(let i = 0; i + 1 < points.length; i++) best = Math.min(best, segmentDistance(p, points[i], points[i + 1]));

  return closed && points.length > 2 ? Math.min(best, segmentDistance(p, points.at(-1), points[0])) : best;
};

// even-odd point in polygon
function inside(p, points) {
  let in_ = false;

  for(let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];

    if(yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) in_ = !in_;
  }

  return in_;
}

// the steps of page `page` that are drawn, in drawing order, each with its
// effective matrix and clip: [{ step, m, clip }]; `all` also has the shapes
// that only serve as a clip, by id, for the clip test
function drawn(doc, page, upTo) {
  const all = doc.pages[page]?.steps ?? [];
  const steps = upTo === undefined ? all : all.slice(0, Math.max(0, Math.floor(upTo)));
  const { by, clips } = effective(steps);
  const entry = step => ({ step, m: by.get(step.id)?.m ?? IDENTITY, clip: by.get(step.id)?.clip });
  const entries = steps.filter(step => ['photo', 'stroke', 'shape'].includes(step.op) && !(step.op === 'shape' && clips.has(step.id))).map(entry);

  return { entries, all: new Map(steps.filter(step => step.op === 'shape').map(step => [step.id, entry(step)])) };
}

// does the step cover (or, for lines, come near) point p?
function covers(entry, p, tolerance, { photos, steps }) {
  const { step, m, clip } = entry;

  if(step.op === 'photo') {
    const info = photos(step.photo);
    const inverse = invert(m);

    if(!info || !inverse) return false;

    const [w, h] = localSize(info);
    const [x, y] = apply(inverse, p);

    if(x < 0 || y < 0 || x > w || y > h) return false;

    if(clip) {
      const shape = steps.get(clip);
      const outline = shape && shapePoints(shape.step, shape.m);

      if(outline && !inside(p, outline.points)) return false;
    }

    return true;
  }

  if(step.op === 'stroke') {
    const points = step.pts.map(q => apply(m, [q[0], q[1]]));
    const widest = Math.max(...step.pts.map(q => q[2]));

    return polylineDistance(p, points, false) <= Math.max(widest / 2, tolerance);
  }

  const shape = shapePoints(step, m);

  if(!shape) return false;
  if(step.fill && inside(p, shape.points)) return true;
  if(step.stroke) return polylineDistance(p, shape.points, shape.closed) <= Math.max((step.strokeWidth ?? 0) / 2, tolerance);

  return false;
}

// The id of the top-most step under `point`, or null. `photos(hash)` gives
// { width, height } of a photo (a photo without it cannot be hit); `tolerance`
// widens thin lines, in units (the caller turns a finger's width into units).
export function hitTest(doc, point, { photos = () => null, tolerance = 8, page = 0, upTo } = {}) {
  const { entries, all: steps } = drawn(doc, page, upTo);

  for(let i = entries.length - 1; i >= 0; i--) if(covers(entries[i], point, tolerance, { photos, steps })) return entries[i].step.id;

  return null;
}

// The outline of a step as four corners [[x, y] x 4] (a photo's turned
// rectangle; the bounding box of a stroke or shape), or null when the step is
// not drawn or unknown.
export function outlineOf(doc, id, { photos = () => null, page = 0, upTo } = {}) {
  const entry = drawn(doc, page, upTo).entries.find(e => e.step.id === id);

  if(!entry) return null;

  const { step, m } = entry;

  if(step.op === 'photo') {
    const info = photos(step.photo);

    if(!info) return null;

    const [w, h] = localSize(info);

    return [[0, 0], [w, 0], [w, h], [0, h]].map(c => apply(m, c));
  }

  const points = step.op === 'stroke' ? step.pts.map(q => apply(m, [q[0], q[1]])) : shapePoints(step, m)?.points;

  if(!points?.length) return null;

  const pad = step.op === 'stroke' ? Math.max(...step.pts.map(q => q[2])) / 2 : (step.strokeWidth ?? 0) / 2;
  const xs = points.map(q => q[0]);
  const ys = points.map(q => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];

  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
}

// the matrix a step is drawn with now (after its transform ops), or null when
// it is not drawn
export function matrixOf(doc, id, { page = 0, upTo } = {}) {
  return drawn(doc, page, upTo).entries.find(e => e.step.id === id)?.m ?? null;
}

// the centre of a step's outline: where keys and Alt-drag scale and turn it
export function centreOf(doc, id, options = {}) {
  const outline = outlineOf(doc, id, options);

  return outline && [outline.reduce((s, p) => s + p[0], 0) / outline.length, outline.reduce((s, p) => s + p[1], 0) / outline.length];
}
