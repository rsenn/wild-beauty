// The shape tool's state machine (EDITOR.md S2.3, E60): a click adds a vertex,
// a click-drag pulls a symmetric bezier handle out of it (Alt: the handles stay
// independent), a click on the first vertex closes the shape. Pure functions
// over a draft `{ vertices, closed }`; every one returns a new draft.
import { breakSymmetry, moveHandle, pathFromVertices } from './shapes.js';

export const emptyDraft = () => ({ vertices: [], closed: false });

const r = v => Math.round(v * 100) / 100;

// the draft after pressing at point p. `near` is the closing distance in stage
// units. -> { draft, closed } where closed says this press closed the shape
export function press(draft, [x, y], { near = 12 } = {}) {
  const [first] = draft.vertices;

  if(draft.vertices.length >= 3 && first && Math.hypot(x - first.x, y - first.y) <= near) return { draft: { ...draft, closed: true }, closed: true };

  return { draft: { ...draft, vertices: [...draft.vertices, { x: r(x), y: r(y) }] }, closed: false };
}

// the last vertex dragged to p: its outgoing handle follows, the incoming one
// mirrors it, and with `alt` only the outgoing one moves
export function pull(draft, [x, y], { alt = false } = {}) {
  const i = draft.vertices.length - 1;
  const v = draft.vertices[i];

  if(!v) return draft;

  const [dx, dy] = [x - v.x, y - v.y];

  if(Math.hypot(dx, dy) < 1) return draft;

  let vertices = draft.vertices;

  if(alt && !v.broken) vertices = breakSymmetry(vertices, i);

  return { ...draft, vertices: moveHandle(vertices, i, 'hout', dx, dy) };
}

// the last vertex taken back
export const undoVertex = draft => ({ ...draft, closed: false, vertices: draft.vertices.slice(0, -1) });

// the shape step for a draft (colours from the pen), or null when it has too few
// vertices. A closed shape is filled, an open one only stroked.
export function shapeStep(draft, id, { color, width = 4 }) {
  const need = draft.closed ? 3 : 2;

  if(draft.vertices.length < need) return null;

  const path = pathFromVertices(draft.vertices, draft.closed);

  return { op: 'shape', id, path, closed: draft.closed, ...(draft.closed && { fill: color }), stroke: color, strokeWidth: width };
}

// what to draw in the overlay: the path so far and the handle lines
export function preview(draft) {
  const path = draft.vertices.length > 1 ? pathFromVertices(draft.vertices, draft.closed) : '';
  const handles = draft.vertices.flatMap(v => [v.hin && [v.x, v.y, v.x + v.hin[0], v.y + v.hin[1]], v.hout && [v.x, v.y, v.x + v.hout[0], v.y + v.hout[1]]].filter(Boolean));

  return { path, handles, points: draft.vertices.map(v => [v.x, v.y]) };
}
