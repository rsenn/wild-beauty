// The selection handles and the transform buttons (EDITOR.md E113): four corner
// handles that scale, one round handle above the top edge that turns, and the
// button steps (larger, smaller, turn left, turn right). Pure functions in stage
// units; the sizes in pixels come from the caller (`px / scale`).
import { aboutPoint } from './gestures.js';
import { multiply } from './matrix.js';

// one button press: scale by this factor, turn by this angle
export const STEP_SCALE = 1.1;
export const STEP_TURN = Math.PI / 12; // 15 degrees

const STAGE = 1000;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const centreOf = outline => [outline.reduce((s, p) => s + p[0], 0) / outline.length, outline.reduce((s, p) => s + p[1], 0) / outline.length];

// Where the handles are drawn and hit, for a selection `outline` (four corners).
// A photo that covers the stage has its corners on the stage edge and its top
// edge above the stage, so every handle is moved inside the stage by `inset`;
// `gap` is how far the turning handle stands off the top edge.
export function handlePoints(outline, { inset = 0, gap = 0, limit = STAGE } = {}) {
  const centre = centreOf(outline);
  const mid = [(outline[0][0] + outline[1][0]) / 2, (outline[0][1] + outline[1][1]) / 2];
  const away = [mid[0] - centre[0], mid[1] - centre[1]];
  const len = Math.hypot(away[0], away[1]) || 1;
  const keep = ([x, y]) => [clamp(x, inset, limit - inset), clamp(y, inset, limit - inset)];

  return {
    centre,
    corners: outline.map(keep),
    rotate: keep([mid[0] + (away[0] / len) * gap, mid[1] + (away[1] / len) * gap]),
  };
}

// the handle under `point` within `radius`: { kind: 'rotate' } or { kind:
// 'corner', index }, or null. The turning handle wins where they overlap.
export function hitHandle(handles, point, radius) {
  const near = p => Math.hypot(p[0] - point[0], p[1] - point[1]) <= radius;

  if(near(handles.rotate)) return { kind: 'rotate' };

  const index = handles.corners.findIndex(near);

  return index >= 0 ? { kind: 'corner', index } : null;
}

// Dragging a corner scales the selection about the opposite corner: `base` is
// the matrix when the drag began, `down` where the pointer went down, `now`
// where it is. The factor is the ratio of the distances to the pivot, so a handle
// that was moved inside the stage does not make the selection jump.
export function scaleDrag(base, pivot, down, now) {
  const before = Math.hypot(down[0] - pivot[0], down[1] - pivot[1]);

  if(before < 1e-6) return base;

  const factor = clamp(Math.hypot(now[0] - pivot[0], now[1] - pivot[1]) / before, 0.05, 20);

  return multiply(aboutPoint(factor, 0, pivot), base);
}

// Dragging the turning handle turns the selection about its centre by the angle
// the pointer has gone round the centre
export function rotateDrag(base, centre, down, now) {
  const turn = Math.atan2(now[1] - centre[1], now[0] - centre[0]) - Math.atan2(down[1] - centre[1], down[0] - centre[0]);

  return multiply(aboutPoint(1, turn, centre), base);
}

// the similarity of a button press about `centre`; kind: larger, smaller, left, right
export function nudge(kind, centre) {
  switch(kind) {
    case 'larger':
      return aboutPoint(STEP_SCALE, 0, centre);
    case 'smaller':
      return aboutPoint(1 / STEP_SCALE, 0, centre);
    case 'left':
      return aboutPoint(1, -STEP_TURN, centre);
    case 'right':
      return aboutPoint(1, STEP_TURN, centre);
    default:
      return null;
  }
}
