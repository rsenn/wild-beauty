// bun test: client/ghostdrag.js and client/editor/pending.js with a minimal fake window
import { describe, expect, test } from 'bun:test';
import { watchHold } from '../client/ghostdrag.js';
import { requestAdd, takePending, ADD_EVENT } from '../client/editor/pending.js';

// just enough window and document for watchHold
function fakeWindow() {
  const listeners = {};
  const body = { children: [], append(el) { this.children.push(el); el.parent = this; } };
  const stage = { classList: { set: new Set(), add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); } } };
  const doc = {
    body,
    stageRect: { x0: 100, y0: 100, x1: 400, y1: 400 },
    createElement: () => ({ style: {}, remove() { this.removed = true; body.children = body.children.filter(c => c !== this); } }),
    elementFromPoint(x, y) {
      const r = doc.stageRect;

      return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1 ? { closest: sel => (sel === '.wb-editor-stage' ? stage : null) } : { closest: () => null };
    },
  };
  const win = {
    document: doc,
    addEventListener: (type, fn) => (listeners[type] ??= new Set()).add(fn),
    removeEventListener: (type, fn) => listeners[type]?.delete(fn),
    fire: (type, e) => [...(listeners[type] ?? [])].forEach(fn => fn(e)),
    count: () => Object.values(listeners).reduce((n, s) => n + s.size, 0),
  };

  return { win, stage, body };
}

const down = { pointerType: 'touch', pointerId: 1, clientX: 50, clientY: 50 };
const sleep = ms => new Promise(r => setTimeout(r, ms));

describe('watchHold', () => {
  test('hold, drag over the stage, release: dropped on the stage, ghost gone, listeners gone', async () => {
    const { win, stage, body } = fakeWindow();
    const dropped = [];

    watchHold(down, { image: '/x.jpg', onDrop: s => dropped.push(s) }, { win, hold: 10 });
    await sleep(25);
    expect(body.children.length).toBe(1);
    expect(body.children[0].className).toBe('wb-ghost');
    expect(body.children[0].src).toBe('/x.jpg');

    win.fire('pointermove', { pointerId: 1, clientX: 200, clientY: 200 });
    expect(body.children[0].style.transform).toContain('200px');
    expect(stage.classList.set.has('wb-editor-stage-over')).toBe(true);

    win.fire('pointerup', { pointerId: 1 });
    expect(dropped).toEqual([stage]);
    expect(body.children.length).toBe(0);
    expect(stage.classList.set.size).toBe(0);
    expect(win.count()).toBe(0);
  });

  test('released outside the stage, or cancelled: no drop', async () => {
    const { win, body } = fakeWindow();
    const dropped = [];

    watchHold(down, { image: '/x.jpg', onDrop: s => dropped.push(s) }, { win, hold: 10 });
    await sleep(25);
    win.fire('pointermove', { pointerId: 1, clientX: 600, clientY: 600 });
    win.fire('pointerup', { pointerId: 1 });
    expect(dropped).toEqual([]);

    watchHold(down, { image: '/x.jpg', onDrop: s => dropped.push(s) }, { win, hold: 10 });
    await sleep(25);
    win.fire('pointermove', { pointerId: 1, clientX: 200, clientY: 200 });
    win.fire('pointercancel', { pointerId: 1 });
    expect(dropped).toEqual([]);
    expect(body.children.length).toBe(0);
  });

  test('moving before the hold is over is a scroll: no ghost ever appears', async () => {
    const { win, body } = fakeWindow();

    watchHold(down, { image: '/x.jpg', onDrop() {} }, { win, hold: 20 });
    win.fire('pointermove', { pointerId: 1, clientX: 50, clientY: 90 });
    await sleep(40);
    expect(body.children.length).toBe(0);
    expect(win.count()).toBe(0);
  });

  test('a lift before the hold is a tap; other pointers are ignored; a mouse is not watched', async () => {
    const { win, body } = fakeWindow();

    watchHold(down, { image: '/x.jpg', onDrop() {} }, { win, hold: 20 });
    win.fire('pointermove', { pointerId: 2, clientX: 300, clientY: 300 }); // another finger
    win.fire('pointerup', { pointerId: 1 });
    await sleep(40);
    expect(body.children.length).toBe(0);

    const cancel = watchHold({ ...down, pointerType: 'mouse' }, { image: '/x.jpg', onDrop() {} }, { win, hold: 5 });

    expect(win.count()).toBe(0);
    expect(cancel).toBeInstanceOf(Function);
  });

  test('cancel() while the ghost is up removes it', async () => {
    const { win, body } = fakeWindow();
    const cancel = watchHold(down, { image: '/x.jpg', onDrop() {} }, { win, hold: 5 });

    await sleep(20);
    expect(body.children.length).toBe(1);
    cancel();
    expect(body.children.length).toBe(0);
    expect(win.count()).toBe(0);
  });
});

describe('pending photos', () => {
  test('queued oldest first, announced, taken once', () => {
    const heard = [];
    const target = { dispatchEvent: e => heard.push(e.type) };

    requestAdd({ hash: 'a' }, target);
    requestAdd({ hash: 'b' }, target);
    expect(heard).toEqual([ADD_EVENT, ADD_EVENT]);
    expect(takePending()).toEqual([{ hash: 'a' }, { hash: 'b' }]);
    expect(takePending()).toEqual([]);
  });
});
