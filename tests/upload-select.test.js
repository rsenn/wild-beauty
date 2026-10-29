// bun test: choosing a run of uploads by dragging over them (client/uploadselect.js, cardrange.js)
import { describe, expect, test } from 'bun:test';
import { scrollSpeed, watchRange } from '../client/cardrange.js';
import { choose, rangeBetween } from '../client/uploadselect.js';

// cards 1..10; 4 is still uploading, 7 failed
const cards = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, record: i + 1 === 4 || i + 1 === 7 ? null : { hash: 'h' + (i + 1) }, selected: false, selectedAt: 0 }));

describe('rangeBetween', () => {
  test('both ends included, either direction, unfinished cards skipped, ids as numbers or text', () => {
    expect(rangeBetween(cards, 2, 6)).toEqual([2, 3, 5, 6]);
    expect(rangeBetween(cards, 6, 2)).toEqual([2, 3, 5, 6]);
    expect(rangeBetween(cards, 3, '3')).toEqual([3]);
    expect(rangeBetween(cards, 3, 99)).toEqual([]);
  });
});

describe('choose', () => {
  test('adds to what is chosen, numbering in display order from the counter', () => {
    const first = choose(cards, [3, 1], 0);

    expect(first.filter(c => c.selected).map(c => [c.id, c.selectedAt])).toEqual([[1, 2], [3, 1]]);

    const more = choose(first, [3, 5], 2); // 3 is chosen already: it keeps its place

    expect(more.filter(c => c.selected).map(c => [c.id, c.selectedAt])).toEqual([[1, 2], [3, 1], [5, 4]]);
  });
});

describe('scrollSpeed', () => {
  test('none between the edges, faster the nearer the edge, up at the top and down at the bottom', () => {
    expect(scrollSpeed(400, 800)).toBe(0);
    expect(scrollSpeed(0, 800)).toBe(-28);
    expect(scrollSpeed(35, 800)).toBeLessThan(0);
    expect(scrollSpeed(35, 800)).toBeGreaterThan(-28);
    expect(scrollSpeed(799, 800)).toBeGreaterThan(20);
  });
});

describe('watchRange', () => {
  // a window that records its listeners; the document says which card is at x
  const make = () => {
    const listeners = {};
    const win = {
      innerHeight: 800,
      document: { elementFromPoint: x => ({ closest: () => ({ dataset: { card: String(Math.floor(x / 100) + 1) } }) }) },
      addEventListener: (type, fn) => (listeners[type] = fn),
      removeEventListener: type => delete listeners[type],
      requestAnimationFrame: () => 1,
      cancelAnimationFrame() {},
      scrollBy() {},
    };

    return { win, fire: (type, e) => listeners[type]?.({ pointerId: 1, ...e }) };
  };

  test('a click is no drag; a drag reports the card under the pointer and where it ended', () => {
    const { win, fire } = make();
    const seen = [];
    const ended = [];
    const click = watchRange({ pointerId: 1, clientX: 50, clientY: 50 }, { update: id => seen.push(id), end: id => ended.push(id) }, win);

    fire('pointerup', {});
    expect(click.dragged()).toBe(false);
    expect(seen.concat(ended)).toEqual([]);

    const drag = watchRange({ pointerId: 1, clientX: 50, clientY: 50 }, { update: id => seen.push(id), end: id => ended.push(id) }, win);

    fire('pointermove', { clientX: 52, clientY: 50 }); // inside the slop
    expect(drag.dragged()).toBe(false);
    fire('pointermove', { clientX: 150, clientY: 50 });
    fire('pointermove', { clientX: 350, clientY: 50 });
    fire('pointerup', {});

    expect(drag.dragged()).toBe(true);
    expect(seen).toEqual(['2', '4']);
    expect(ended).toEqual(['4']);
  });

  test('a cancelled drag clears the marks and ends nothing', () => {
    const { win, fire } = make();
    const seen = [];
    const ended = [];

    watchRange({ pointerId: 1, clientX: 50, clientY: 50 }, { update: id => seen.push(id), end: id => ended.push(id) }, win);
    fire('pointermove', { clientX: 250, clientY: 50 });
    fire('pointercancel', {});

    expect(seen).toEqual(['3', null]);
    expect(ended).toEqual([]);
  });
});

describe('watchRange with a finger', () => {
  const make = () => {
    const listeners = {};
    const win = {
      innerHeight: 800,
      document: { elementFromPoint: x => ({ closest: () => ({ dataset: { card: String(Math.floor(x / 100) + 1) } }) }) },
      addEventListener: (type, fn) => (listeners[type] = fn),
      removeEventListener: type => delete listeners[type],
      requestAnimationFrame: () => 1,
      cancelAnimationFrame() {},
      scrollBy() {},
    };

    return { win, listeners, fire: (type, e) => listeners[type]?.({ pointerId: 1, preventDefault() {}, ...e }) };
  };
  const touch = { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 300 };

  test('a sideways swipe chooses cards and keeps the page from scrolling', () => {
    const { win, fire, listeners } = make();
    const ended = [];
    let blocked = 0;
    const watch = watchRange(touch, { update() {}, end: id => ended.push(id) }, win);

    fire('pointermove', { clientX: 120, clientY: 305 });
    expect(watch.dragged()).toBe(true);
    listeners.touchmove({ preventDefault: () => blocked++ });
    expect(blocked).toBe(1);
    fire('pointermove', { clientX: 340, clientY: 310 });
    fire('pointerup', {});
    expect(ended).toEqual(['4']);
    expect(listeners.touchmove).toBeUndefined();
  });

  test('an up or down swipe is the page scrolling: nothing is chosen and no scroll is blocked', () => {
    const { win, fire, listeners } = make();
    const calls = [];
    const watch = watchRange(touch, { update: id => calls.push(id), end: id => calls.push(id) }, win);

    fire('pointermove', { clientX: 55, clientY: 340 });
    fire('pointermove', { clientX: 400, clientY: 360 }); // too late, it was a scroll
    fire('pointerup', {});

    expect(watch.dragged()).toBe(false);
    expect(calls).toEqual([]);
    expect(listeners.pointermove).toBeUndefined();
  });
});
