// bun test: the recording tick box (client/replay.js): the choice is the visitor's, kept in this browser
// until the box is unticked, and every tab follows it
import { beforeEach, describe, expect, test } from 'bun:test';

let store;
let handlers;
let recorders;
let n = 0;

// a browser, as far as replay.js looks
beforeEach(() => {
  store = new Map();
  handlers = {};
  recorders = { started: 0, stopped: 0 };
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  globalThis.sessionStorage = { getItem: () => null, setItem() {} };
  globalThis.location = { pathname: '/en/new', search: '' };
  globalThis.addEventListener = (type, fn) => (handlers[type] = fn);
  globalThis.document = { addEventListener() {}, createElement: () => ({}), head: { append: script => script.onload?.() }, visibilityState: 'visible' };
  globalThis.fetch = async () => new Response('');
  globalThis.rrweb = { record: () => (recorders.started++, () => recorders.stopped++) };
});

const fresh = () => import(`../client/replay.js?case=${++n}`);

describe('the recording choice', () => {
  test('it is kept in this browser until the box is unticked', async () => {
    const replay = await fresh();

    expect(replay.isRecording()).toBe(false);
    expect(await replay.setRecording(true)).toBe(true);
    expect(store.get('wb-record')).toBe('1');

    // the next page, a new visit: still on, and it records again by itself
    const next = await fresh();

    expect(next.isRecording()).toBe(true);
    next.startReplay({});
    await Bun.sleep(5);
    expect(recorders.started).toBe(2);

    await next.setRecording(false);
    expect((await fresh()).isRecording()).toBe(false);
  });

  test('a link can tick the box, never untick it', async () => {
    store.set('wb-record', '1');
    location.search = '?record=0';
    (await fresh()).startReplay({});
    expect(store.get('wb-record')).toBe('1');

    store.delete('wb-record');
    location.search = '?record=1';
    (await fresh()).startReplay({});
    expect(store.get('wb-record')).toBe('1');
  });

  test('unticked in another tab: this tab stops at once; ticked there: it starts', async () => {
    const replay = await fresh();

    expect(await replay.setRecording(true)).toBe(true);
    replay.startReplay({});

    const seen = [];

    replay.onChoice(on => seen.push(on));

    // the other tab unticks the box
    store.delete('wb-record');
    handlers.storage({ key: 'wb-record' });
    expect(recorders.stopped).toBe(1);
    expect(seen).toEqual([false]);

    // and ticks it again
    store.set('wb-record', '1');
    handlers.storage({ key: 'wb-record' });
    await Bun.sleep(5);
    expect(recorders.started).toBe(2);
    expect(seen).toEqual([false, true]);

    // an unrelated key changing does nothing
    handlers.storage({ key: 'something-else' });
    expect(seen).toHaveLength(2);
  });

  test('two starts at once make one recorder', async () => {
    const replay = await fresh();

    await Promise.all([replay.begin(), replay.begin(), replay.begin()]);
    expect(recorders.started).toBe(1);
  });

  test('a recorder that cannot load is reported, and the choice is not made', async () => {
    delete globalThis.rrweb;
    globalThis.document.head.append = script => script.onerror?.();

    const replay = await fresh();

    expect(await replay.setRecording(true)).toBe(false);
    expect(store.has('wb-record')).toBe(false);
  });
});
