// Keyboard helpers of the editor (EDITOR.md E73): which keys are the editor's,
// walking through the steps, the keyboard cursor of the shape tool.
export const CURSOR_STEP = 10; // units per arrow press, Shift: ten times that
export const CURSOR_START = [500, 500];

// Is a keydown aimed at the editor? Keys typed into something elsewhere on the
// page (a field, a card button) keep their meaning; keys with nothing focused
// (the body) and keys inside the editor belong to it.
export function inEditor(target) {
  if(!target || target.tagName === 'BODY' || target.tagName === 'HTML') return true;

  return !!target.closest?.('#wb-editor');
}

// the id after (dir 1) or before (dir -1) `current` in `ids`, wrapping round;
// from nothing, the first or the last
export function cycleId(ids, current, dir = 1) {
  if(!ids.length) return null;

  const at = ids.indexOf(current);

  if(at < 0) return dir > 0 ? ids[0] : ids[ids.length - 1];

  return ids[(at + dir + ids.length) % ids.length];
}

// the keyboard cursor after an arrow key, kept on the stage; null for other keys
export function moveCursor(cursor, event, limit = 1000) {
  const step = event.shiftKey ? CURSOR_STEP * 5 : CURSOR_STEP;
  const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];

  if(!delta || event.ctrlKey || event.metaKey || event.altKey) return null;

  return [Math.min(limit, Math.max(0, cursor[0] + delta[0])), Math.min(limit, Math.max(0, cursor[1] + delta[1]))];
}

// the translated name of what a step is, for the screen reader
export const stepKind = step => 'editor.step.' + step.op;
