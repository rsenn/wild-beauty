// The room aid of a gallery node (EDITOR.md E136): while on, the shape tool
// draws rooms the way a floor plan is built and the pen draws corridors.
//   - one step is the room a hung work takes (picture size + gap, hang.js), in
//     stage units `STEP`; the first vertex sits on that grid and every edge is a
//     whole number of steps long (at least one)
//   - an edge turns by 0, +-45, +-90 or +-135 degrees against the one before
//     (the first edge goes in one of the 8 compass directions), which keeps
//     every interior corner at 45 degrees or more (walls.js MIN_CORNER)
//   - a freehand stroke from the inside of one room to the inside of another
//     becomes a corridor: an open wall shape of the same quantised kind
// Pure functions over [x, y] points and the vertices of shapes.js; stage units.
import { PICTURE } from '../gallery/hang.js';
import { CORRIDOR_WIDTH, WALL_HEIGHT, acuteCorner, defaultWall } from './walls.js';
import { contains } from './polygon.js';
import { pathFromVertices, verticesFromPath } from './shapes.js';

export const STEP_M = PICTURE.size + PICTURE.gap; // metres, one hung work
export const STEP = 40; // stage units of one step (25 steps across the stage)
export const UNITS_PER_METRE = STEP / STEP_M;
export const MAX_TURN_STEPS = 3; // 3 x 45 = 135 degrees
const EIGHTH = Math.PI / 4;

const r2 = v => Math.round(v * 100) / 100;

// the angle between two headings in eighths of a turn, -4..4 (wrapped)
const wrap = k => ((((k % 8) + 12) % 8) - 4);

// the nearest of the allowed headings (eighths of a turn) to the angle `a`
function nearest(a, allowed) {
  let best = allowed[0];
  let off = Infinity;

  for(const k of allowed) {
    const d = Math.abs(Math.atan2(Math.sin(a - k * EIGHTH), Math.cos(a - k * EIGHTH)));

    if(d < off) [best, off] = [k, d];
  }

  return best;
}

// The point the aid puts a vertex at when the pointer is at `p` and `vertices`
// ([{ x, y }]) are placed: on the grid for the first one, else along an allowed
// heading a whole number of steps from the last. -> [x, y]
export function snapVertex(vertices, p, step = STEP) {
  if(!vertices.length) return [r2(Math.round(p[0] / step) * step), r2(Math.round(p[1] / step) * step)];

  const last = vertices[vertices.length - 1];
  const prev = vertices[vertices.length - 2];
  const a = Math.atan2(p[1] - last.y, p[0] - last.x);
  const before = prev ? Math.round(Math.atan2(last.y - prev.y, last.x - prev.x) / EIGHTH) : 0;
  const allowed = prev ? Array.from({ length: 2 * MAX_TURN_STEPS + 1 }, (_, i) => before + i - MAX_TURN_STEPS) : [0, 1, 2, 3, 4, 5, 6, 7];
  const k = nearest(a, allowed);
  const n = Math.max(1, Math.round(Math.hypot(p[0] - last.x, p[1] - last.y) / step));

  return [r2(last.x + Math.cos(k * EIGHTH) * n * step), r2(last.y + Math.sin(k * EIGHTH) * n * step)];
}

// May the room be closed on its last vertex? The closing edge must itself run in
// one of the 8 directions and no corner may be sharper than the wall rule allows.
export function canClose(vertices) {
  if(vertices.length < 3) return false;

  const last = vertices[vertices.length - 1];
  const [first] = vertices;
  const k = Math.atan2(first.y - last.y, first.x - last.x) / EIGHTH;

  return Math.abs(k - Math.round(k)) < 1 / 45 && !acuteCorner(vertices, true);
}

// the rooms of a list of steps: [{ id, poly }] for the closed wall shapes
export function roomsOf(steps) {
  const rooms = [];

  for(const step of steps) {
    if(step.op !== 'shape' || !step.closed || !step.wall) continue;

    const parsed = verticesFromPath(step.path);

    if(parsed) rooms.push({ id: step.id, poly: parsed.vertices.map(v => [v.x, v.y]) });
  }

  return rooms;
}

const roomAt = (rooms, p) => rooms.find(room => contains(room.poly, p));

// Douglas-Peucker: the points that keep the line within `tolerance`
function simplify(points, tolerance) {
  if(points.length < 3) return points;

  const [a, b] = [points[0], points[points.length - 1]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let far = -1;
  let at = 0;

  for(let i = 1; i < points.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - points[i][1]) - (a[0] - points[i][0]) * (b[1] - a[1])) / len;

    if(d > far) [far, at] = [d, i];
  }

  if(far <= tolerance) return [a, b];

  return [...simplify(points.slice(0, at + 1), tolerance).slice(0, -1), ...simplify(points.slice(at), tolerance)];
}

// A freehand stroke ([[x, y], ...]) from one room to another: the corridor it
// stands for as vertices [{ x, y }] snapped like a room, or null when the stroke
// does not start in one room and end in another. The corridor starts where the
// stroke did (on the grid when that is still in the room) and, when the snapped
// end falls short, runs on along its last heading to reach into the second room.
export function corridorOf(stroke, rooms, step = STEP) {
  if(stroke.length < 2) return null;

  const from = roomAt(rooms, stroke[0]);
  const to = roomAt(rooms, stroke[stroke.length - 1]);

  if(!from || !to || from.id === to.id) return null;

  const snapped = snapVertex([], stroke[0], step);
  const [x, y] = roomAt(rooms, snapped)?.id === from.id ? snapped : stroke[0].map(r2);
  const out = [{ x, y }];

  for(const p of simplify(stroke, step / 2).slice(1)) {
    const [px, py] = snapVertex(out, p, step);
    const last = out[out.length - 1];

    if(Math.hypot(px - last.x, py - last.y) > step / 2) out.push({ x: px, y: py });
  }

  if(out.length < 2) return null;

  for(let more = 0; more < 4 && roomAt(rooms, [out[out.length - 1].x, out[out.length - 1].y])?.id !== to.id; more++) {
    const [a, b] = out.slice(-2);
    const len = Math.hypot(b.x - a.x, b.y - a.y);

    out[out.length - 1] = { x: r2(b.x + ((b.x - a.x) / len) * step), y: r2(b.y + ((b.y - a.y) / len) * step) };
  }

  if(roomAt(rooms, [out[out.length - 1].x, out[out.length - 1].y])?.id !== to.id || acuteCorner(out, false)) return null;

  return out;
}

// the wall step of a corridor, drawn as wide as the corridor is (CORRIDOR_WIDTH m)
export function corridorStep(vertices, id, color) {
  const step = { op: 'shape', id, path: pathFromVertices(vertices, false), closed: false, stroke: color, strokeWidth: r2(CORRIDOR_WIDTH * UNITS_PER_METRE) };

  return { ...step, wall: { height: WALL_HEIGHT, width: CORRIDOR_WIDTH } };
}

// a room finished with the shape tool: the step gets the wall flag
export const wallOf = step => ({ ...step, wall: defaultWall(step) });
