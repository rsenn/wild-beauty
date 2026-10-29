// The touch fallback for dragging an upload onto the stage (EDITOR.md S2.5,
// E46). HTML5 drag-and-drop does not fire for a finger on most phones, so a
// card also listens for a press-and-hold with a pointer: after HOLD_MS without
// moving it picks the card up as a "ghost" picture under the finger; letting
// go over the editor stage drops it there. Let go over another card instead and
// the run of cards from the held one to that one is chosen (`range`, cardrange.js);
// near the top or bottom edge the page scrolls by itself meanwhile. Scrolling still works, because only
// a held press (not a swipe) turns into a drag.
import { autoscroll, cardAt } from './cardrange.js';

export const HOLD_MS = 350;
export const SLOP_PX = 10;
const STAGE_SELECTOR = '.wb-editor-stage';

// the stage under a screen point, or null
export function stageAt(x, y, doc = globalThis.document) {
  return doc.elementFromPoint(x, y)?.closest?.(STAGE_SELECTOR) ?? null;
}

// Start watching a pointerdown on a card.
//  event    the pointerdown (touch and pen only; a mouse has real drag-and-drop)
//  image    the card's picture URL, for the ghost
//  onDrop   called once with the stage element when it is dropped there
//  range    { update(id|null), end(id|null) }: the card under the finger while held, and
//           where it was let go when that was not the stage
// -> cancel(): stop watching (the card was removed)
export function watchHold(event, { image, onDrop, range }, { win = globalThis.window, hold = HOLD_MS } = {}) {
  if(event.pointerType === 'mouse') return () => {};

  const doc = win.document;
  const id = event.pointerId;
  let x = event.clientX;
  let y = event.clientY;
  const from = [x, y];
  let ghost = null;
  let timer = null;
  let over = null;
  let card = null; // the card under the finger
  let stop = null; // the page's own scrolling

  const mark = stage => {
    if(over === stage) return;

    over?.classList.remove('wb-editor-stage-over');
    stage?.classList.add('wb-editor-stage-over');
    over = stage;
  };

  const place = () => {
    if(!ghost) return;

    ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    mark(stageAt(x, y, doc));

    if(range) {
      const now = over ? null : cardAt(x, y, doc);

      if(now !== card) range.update((card = now));
    }
  };

  // a drag in progress must not scroll the page
  const stopScroll = e => ghost && e.preventDefault();

  const finish = drop => {
    clearTimeout(timer);
    win.removeEventListener('pointermove', move);
    win.removeEventListener('pointerup', up);
    win.removeEventListener('pointercancel', cancel);
    win.removeEventListener('touchmove', stopScroll);
    mark(null);
    stop?.();

    const target = ghost && drop ? stageAt(x, y, doc) : null;
    const held = !!ghost;

    ghost?.remove();
    ghost = null;

    if(target) onDrop(target);
    else if(range && held) drop ? range.end(card) : range.update(null);
  };

  function move(e) {
    if(e.pointerId !== id) return;

    x = e.clientX;
    y = e.clientY;

    // moving before the hold is over is a scroll or a swipe, not a drag
    if(!ghost && Math.hypot(x - from[0], y - from[1]) > SLOP_PX) return finish(false);

    place();
  }

  const up = e => e.pointerId === id && finish(true);
  const cancel = e => e.pointerId === id && finish(false);

  win.addEventListener('pointermove', move);
  win.addEventListener('pointerup', up);
  win.addEventListener('pointercancel', cancel);
  win.addEventListener('touchmove', stopScroll, { passive: false });

  timer = setTimeout(() => {
    ghost = doc.createElement('img');
    ghost.className = 'wb-ghost';
    ghost.src = image;
    ghost.alt = '';
    doc.body.append(ghost);
    place();
    if(range) stop = autoscroll(() => [x, y], place, win);
  }, hold);

  return () => finish(false);
}
