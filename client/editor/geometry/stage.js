// Stage geometry (EDITOR.md S2.2, E36): the stage is a square drawn at any
// size, and the document lives in a 0..1000 unit square (S2.1). Pure
// functions, shared by the stage component and the tools.
export const STAGE = 1000;

// A client position -> stage units, for a stage whose box is `rect` (anything
// with left, top, width, height: a DOMRect). Not clamped: a pointer outside
// the stage gives units outside 0..1000, which is what a drag past the edge
// needs. null for a box without size.
export function toUnits(rect, clientX, clientY) {
  if(!(rect.width > 0) || !(rect.height > 0)) return null;

  return [((clientX - rect.left) / rect.width) * STAGE, ((clientY - rect.top) / rect.height) * STAGE];
}

// the same for a pointer event on the stage's overlay element
export const eventUnits = (element, event) => toUnits(element.getBoundingClientRect(), event.clientX, event.clientY);

// the other way, for drawing handles under the pointer
export function toClient(rect, x, y) {
  return [rect.left + (x / STAGE) * rect.width, rect.top + (y / STAGE) * rect.height];
}

// CSS pixels per unit at a given on-screen side length: how big one unit is,
// for handles and hit slop that must stay the same size on screen
export const pixelsPerUnit = side => (side > 0 ? side / STAGE : 1);
