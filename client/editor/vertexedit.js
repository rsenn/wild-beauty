// Editing the vertices of a selected shape (EDITOR.md S6, E61): find the vertex
// or handle under the pointer, drag it, delete a vertex. Pure functions; the
// vertices are in the shape's own space, the points to hit-test in stage
// space (the step's matrix applied).
import { apply, invert } from './matrix.js';
import { breakSymmetry, deleteVertex, joinSymmetry, moveHandle, moveVertex, verticesFromPath } from './shapes.js';

// the vertices of a shape step in its own space, or null when its path is not
// one the tool wrote
export const verticesOf = step => (step?.op === 'shape' ? verticesFromPath(step.path) : null);

// what to draw: every vertex and its handle ends, in stage space
export function geometry(parsed, m) {
  return parsed.vertices.map((v, i) => ({
    i,
    p: apply(m, [v.x, v.y]),
    hin: v.hin ? apply(m, [v.x + v.hin[0], v.y + v.hin[1]]) : null,
    hout: v.hout ? apply(m, [v.x + v.hout[0], v.y + v.hout[1]]) : null,
    broken: !!v.broken,
  }));
}

// -> { kind: 'vertex' | 'hin' | 'hout', index } for the nearest handle or
// vertex within `tolerance` (stage units) of `point`; handles win a tie
export function hitVertex(geo, point, tolerance) {
  let best = null;
  const near = (kind, index, p) => {
    if(!p) return;

    const d = Math.hypot(p[0] - point[0], p[1] - point[1]);

    if(d <= tolerance && (!best || d < best.d - 1e-9)) best = { kind, index, d };
  };

  for(const g of geo) {
    near('hin', g.i, g.hin);
    near('hout', g.i, g.hout);
  }

  for(const g of geo) near('vertex', g.i, g.p);

  return best && { kind: best.kind, index: best.index };
}

// The vertices after dragging `hit` from `from` to `to` (both in stage space).
// A vertex keeps its handles; a handle mirrors unless the vertex is broken, and
// with `alt` it breaks first.
export function drag(vertices, hit, m, from, to, { alt = false } = {}) {
  const inverse = invert(m);

  if(!inverse) return vertices;

  const [lx, ly] = apply(inverse, to);
  const [fx, fy] = apply(inverse, from);
  const v = vertices[hit.index];

  if(!v) return vertices;

  if(hit.kind === 'vertex') return moveVertex(vertices, hit.index, v.x + (lx - fx), v.y + (ly - fy));

  const base = alt && !v.broken ? breakSymmetry(vertices, hit.index) : vertices;

  return moveHandle(base, hit.index, hit.kind, lx - v.x, ly - v.y);
}

// the vertex taken out, or null when the shape would have too few left (two
// for an open shape, three for a closed one)
export const removeVertex = (vertices, index, closed) => (vertices.length <= (closed ? 3 : 2) || !vertices[index] ? null : deleteVertex(vertices, index));

export const breakVertex = (vertices, index) => breakSymmetry(vertices, index);
export const joinVertex = (vertices, index) => joinSymmetry(vertices, index);

// Several vertices dragged together by the same step, `from` to `to` (stage space)
export const dragMany = (vertices, indices, m, from, to) => indices.reduce((vs, index) => drag(vs, { kind: 'vertex', index }, m, from, to), vertices);

// the vertices taken out, or null when none is named or too few would be left
export function removeVertices(vertices, indices, closed) {
  const at = [...new Set(indices)].filter(i => vertices[i]).sort((a, b) => b - a);

  if(!at.length || vertices.length - at.length < (closed ? 3 : 2)) return null;

  return at.reduce((vs, i) => deleteVertex(vs, i), vertices);
}

// the indices of the vertices of `geo` (see geometry) inside a selection
// rectangle, two opposite corners [x, y] in stage space
export const insideRect = (geo, [a, b]) => geo.filter(g => g.p[0] >= Math.min(a[0], b[0]) && g.p[0] <= Math.max(a[0], b[0]) && g.p[1] >= Math.min(a[1], b[1]) && g.p[1] <= Math.max(a[1], b[1])).map(g => g.i);
