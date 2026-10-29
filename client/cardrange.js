// Dragging over the upload cards to choose a run of them (EDITOR.md E140). The
// page scrolls by itself while the pointer is near the top or bottom edge, so a
// run longer than the screen can be dragged out. A mouse drags from the card at
// once; a finger swipes sideways (an up or down swipe is the page scrolling) or
// holds the card (the "ghost" of ghostdrag.js); both go through watchRange below.

export const EDGE_PX = 70; // how near the window's edge the page starts to scroll
export const MAX_SPEED = 28; // px per frame at the very edge
export const MOUSE_SLOP_PX = 6;
export const TOUCH_SLOP_PX = 10; // a finger must go this far sideways, and further sideways than up or down

// the id (as written in `data-card`) of the card under a screen point, or null
export function cardAt(x, y, doc = globalThis.document) {
  return doc.elementFromPoint(x, y)?.closest?.('[data-card]')?.dataset.card ?? null;
}

// how far to scroll this frame for a pointer at y in a window `height` high: up
// (negative) near the top, down near the bottom, none between
export function scrollSpeed(y, height, edge = EDGE_PX, max = MAX_SPEED) {
  if(y < edge) return -Math.ceil(max * Math.min(1, (edge - y) / edge));
  if(y > height - edge) return Math.ceil(max * Math.min(1, (y - (height - edge)) / edge));

  return 0;
}

// Scroll the page while `point()` ([x, y]) is near an edge, calling `tick` after
// each scroll (the card under the pointer has changed). -> stop()
export function autoscroll(point, tick, win = globalThis.window) {
  let frame = 0;
  const step = () => {
    const speed = scrollSpeed(point()[1], win.innerHeight);

    if(speed) {
      win.scrollBy(0, speed);
      tick();
    }

    frame = win.requestAnimationFrame(step);
  };

  frame = win.requestAnimationFrame(step);

  return () => win.cancelAnimationFrame(frame);
}

// A pointer pressed on a card: once a mouse has moved a few pixels, or a finger a
// few pixels more sideways than up or down, it is a drag over cards (a finger that
// goes up or down first is scrolling the page: it is left alone). `update(id)` hears the card under the pointer (null: none), `end(id)`
// the card it was let go on; a click that never became a drag reports nothing.
// -> { dragged(): boolean, cancel() }
export function watchRange(event, { update, end }, win = globalThis.window) {
  const doc = win.document;
  const id = event.pointerId;
  const from = [event.clientX, event.clientY];
  let at = [...from];
  let active = false;
  let stop = null;
  let over = null;
  const touch = event.pointerType !== 'mouse';

  // once a finger drags over cards the page must not scroll under it
  const hold = e => active && e.preventDefault();

  const look = () => {
    const now = cardAt(at[0], at[1], doc);

    if(now !== over) update((over = now));
  };
  const finish = commit => {
    win.removeEventListener('pointermove', move);
    win.removeEventListener('pointerup', up);
    win.removeEventListener('pointercancel', cancel);
    win.removeEventListener('touchmove', hold);
    stop?.();

    if(active && commit) end(over);
    else if(active) update(null);
  };
  function move(e) {
    if(e.pointerId !== id) return;

    at = [e.clientX, e.clientY];

    const [dx, dy] = [Math.abs(at[0] - from[0]), Math.abs(at[1] - from[1])];

    if(!active && touch && dy > TOUCH_SLOP_PX && dy >= dx) return finish(false); // scrolling
    if(!active && (touch ? dx < TOUCH_SLOP_PX || dx <= dy : Math.hypot(dx, dy) < MOUSE_SLOP_PX)) return;

    if(!active) {
      active = true;
      stop = autoscroll(() => at, look, win);
    }

    look();
  }
  const up = e => e.pointerId === id && finish(true);
  const cancel = e => e.pointerId === id && finish(false);

  win.addEventListener('pointermove', move);
  win.addEventListener('pointerup', up);
  win.addEventListener('pointercancel', cancel);
  if(touch) win.addEventListener('touchmove', hold, { passive: false });

  return { dragged: () => active, cancel: () => finish(false) };
}
