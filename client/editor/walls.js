// The wall layer of the 3D gallery (EDITOR.md S2.3, GALLERY.md S3.1): a shape
// step flagged `wall: { height, width? }`. A closed wall is a room, an open one
// a line (a corridor, `width` metres wide). Rooms and lines may not have a
// corner sharper than 90 degrees. Pure functions; the commands and the editor
// use them to refuse a wall that breaks the rule.
import { verticesFromPath } from './shapes.js';

export const WALL_HEIGHT = 3.2; // metres
export const CORRIDOR_WIDTH = 2; // metres
export const MIN_CORNER = 90; // degrees
export const LIMITS = { height: [0.5, 10], width: [0.5, 10] };

const within = ([lo, hi], v) => Number.isFinite(v) && v >= lo && v <= hi;

// a well-formed wall property: height 0.5..10 m, an optional width 0.5..10 m
export const isWall = v => !!v && typeof v === 'object' && !Array.isArray(v) && within(LIMITS.height, v.height) && (v.width === undefined || within(LIMITS.width, v.width)) && Object.keys(v).every(k => k === 'height' || k === 'width');

// the angle in degrees between the two segments that meet at `b`, 0..180
// (180 = straight on, 0 = folded back); null for a zero-length segment
export function cornerAngle(a, b, c) {
  const [ux, uy, vx, vy] = [a.x - b.x, a.y - b.y, c.x - b.x, c.y - b.y];
  const lu = Math.hypot(ux, uy);
  const lv = Math.hypot(vx, vy);

  if(!lu || !lv) return null;

  return (Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (lu * lv)))) * 180) / Math.PI;
}

// The first corner sharper than 90 degrees of a room (closed) or a line (open;
// its two ends are no corners), as { vertex, angle }, or null. The interior
// angle of a room is then between 90 and 270 degrees, which is the same thing.
export function acuteCorner(vertices, closed) {
  const n = vertices.length;

  for(let i = closed ? 0 : 1; i < (closed ? n : n - 1); i++) {
    const angle = cornerAngle(vertices[(i + n - 1) % n], vertices[i], vertices[(i + 1) % n]);

    if(angle !== null && angle < MIN_CORNER - 1e-9) return { vertex: i, angle };
  }

  return null;
}

// the problem of a shape step used as a wall: { code: 'acute_corner', vertex,
// angle } | { code: 'not_a_path' } | null
export function wallProblem(step) {
  const parsed = step?.op === 'shape' ? verticesFromPath(step.path) : null;

  if(!parsed) return { code: 'not_a_path' };

  const acute = acuteCorner(parsed.vertices, step.closed);

  return acute ? { code: 'acute_corner', ...acute } : null;
}

// the default wall of a shape: rooms have a height, lines a width as well
export const defaultWall = step => (step.closed ? { height: WALL_HEIGHT } : { height: WALL_HEIGHT, width: CORRIDOR_WIDTH });
