// The two-finger gesture of the graph view (GraphPage.js): the distance between the fingers sets the zoom.
// Kept apart so the cases around lifting a finger can be tested: when one finger of a pinch lifts, the other
// is still on the screen and must not be treated as a pinch of one (the maths needs two points; with one it
// read `undefined.x` on every move, hundreds of times a pinch on a phone) - it goes on as a pan.

// the two pointers of a pinch -> { a, b } or null when fewer than two are down
export const fingers = pointers => {
  const [a, b] = [...pointers.values()];

  return a && b ? { a, b } : null;
};

// the zoom of a pinch started at `g.d` apart with zoom `g.k`; null when a finger is missing
export function pinchZoom(g, pointers, { min = 0, max = 4 } = {}) {
  const f = fingers(pointers);

  return f && g.d > 0 ? Math.min(max, Math.max(min, (g.k * Math.hypot(f.a.x - f.b.x, f.a.y - f.b.y)) / g.d)) : null;
}

// a pointer was lifted or cancelled: the gesture that goes on. `g` is the gesture before, `pointers` the map of
// the fingers still down, `view` the pan offset. A pinch left with one finger becomes a pan from where that
// finger is (marked as moved: lifting it is not a tap); with none the gesture ends; with three or more it stays.
export function afterLift(g, pointers, view) {
  const left = [...pointers.values()];

  if(!left.length) return null;

  if(g?.pinch && left.length === 1) return { pan: true, x: left[0].x - view.x, y: left[0].y - view.y, moved: true, start: { x: left[0].x, y: left[0].y } };

  return g?.pinch ? g : null;
}
