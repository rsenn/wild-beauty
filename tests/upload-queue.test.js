// bun test: the upload queue retries a dropped connection (client/upload.js)
import { describe, expect, test } from 'bun:test';
import { READ_MS, READ_RETRIES, RETRIES, STALL_MS, REPLY_MS, createQueue, pause, readBytes, readPause, sendFile } from '../client/upload.js';

const fail = code => ({ done: Promise.reject(Object.assign(new Error(code), { code })), abort() {} });
const ok = record => ({ done: Promise.resolve(record), abort() {} });
const tick = () => new Promise(r => setTimeout(r, 0));

describe('createQueue', () => {
  test('a dropped connection is retried after a pause, one file at a time, then goes through', async () => {
    const events = [];
    const waits = [];
    const calls = [];
    const answers = { a: [fail('network'), ok({ hash: 'a' })], b: [ok({ hash: 'b' })] };
    const queue = createQueue({
      concurrency: 3,
      onChange: (id, patch) => events.push([id, patch.state, patch.attempt]),
      send: file => (calls.push(file), answers[file].shift()),
      wait: (ms, fn) => (waits.push([ms, fn]), waits.length),
    });

    queue.add(1, 'a');
    queue.add(2, 'b');
    await tick();

    expect(calls).toEqual(['a', 'b']); // both started, a dropped
    expect(waits.map(w => w[0])).toEqual([pause(1)]);
    expect(events).toContainEqual([1, 'queued', 1]);

    waits[0][1]();
    await tick();

    expect(calls).toEqual(['a', 'b', 'a']);
    expect(events.at(-1)).toEqual([1, 'done', undefined]);
  });

  test('gives up after RETRIES attempts and reports the failure; other errors are not retried', async () => {
    const events = [];
    const waits = [];
    let sent = 0;
    const queue = createQueue({ onChange: (id, patch) => events.push([id, patch.state, patch.error]), send: () => (sent++, fail('network')), wait: (ms, fn) => waits.push(fn) });

    queue.add(1, 'x');

    for(let i = 0; i <= RETRIES; i++) {
      await tick();
      waits.shift()?.();
    }

    await tick();

    expect(sent).toBe(RETRIES + 1);
    expect(events.at(-1)).toEqual([1, 'failed', 'network']);

    const other = [];
    const q2 = createQueue({ onChange: (id, patch) => other.push(patch.state), send: () => fail('unsupported'), wait: () => { throw new Error('no retry'); } });

    q2.add(1, 'y');
    await tick();
    expect(other.at(-1)).toBe('failed');
  });

  test('a photo that could not be read is retried like a dropped connection', async () => {
    const waits = [];
    const answers = [fail('unreadable'), ok({ hash: 'a' })];
    const states = [];
    const queue = createQueue({ onChange: (id, patch) => states.push(patch.state), send: () => answers.shift(), wait: (ms, fn) => waits.push(fn) });

    queue.add(1, 'a');
    await tick();
    waits.shift()();
    await tick();

    expect(states.at(-1)).toBe('done');
  });

  test('a photo that cannot be read gets a few quick tries, says why it waits, and does not slow the others', async () => {
    const waits = [];
    const events = [];
    let sent = 0;
    const answers = { dead: () => fail('unreadable'), good: () => ok({ hash: 'g' }) };
    const queue = createQueue({ onChange: (id, patch) => events.push([id, patch.state, patch.error, patch.retry]), send: file => (sent++, answers[file]()), wait: (ms, fn) => waits.push([ms, fn]) });

    queue.add(1, 'dead');
    await tick();
    expect(events).toContainEqual([1, 'queued', null, { n: 1, of: READ_RETRIES, reason: 'unreadable' }]);
    expect(waits[0][0]).toBe(readPause(1));

    // a second file is not held back to one at a time
    queue.add(2, 'good');
    queue.add(3, 'good');
    await tick();
    expect(events.filter(e => e[1] === 'done').map(e => e[0])).toEqual([2, 3]);

    for(let i = 0; i < READ_RETRIES; i++) {
      waits.shift()[1]();
      await tick();
    }

    expect(sent).toBe(READ_RETRIES + 1 + 2);
    expect(events.at(-1)).toEqual([1, 'failed', 'unreadable', undefined]);
  });

  test('a read that never settles is given up after READ_MS instead of holding the queue', async () => {
    const real = globalThis.setTimeout;
    const realXhr = globalThis.XMLHttpRequest;
    const timers = [];

    globalThis.setTimeout = (fn, ms) => (timers.push([fn, ms]), timers.length);
    globalThis.XMLHttpRequest = class {};

    try {
      const hung = { name: 'x.jpg', size: 1, arrayBuffer: () => new Promise(() => {}) };
      const task = sendFile(hung, { onProgress() {} });
      const outcome = task.done.then(() => 'sent', e => e.code);

      await Promise.resolve();
      expect(timers.at(-1)[1]).toBe(READ_MS);
      timers.at(-1)[0]();
      expect(await outcome).toBe('unreadable');
    } finally {
      globalThis.setTimeout = real;
      globalThis.XMLHttpRequest = realXhr;
    }
  });

  test('cancel stops a file that waits for its next attempt', async () => {
    const waits = [];
    let sent = 0;
    const queue = createQueue({ onChange() {}, send: () => (sent++, fail('network')), wait: (ms, fn) => (waits.push(fn), 7) });

    queue.add(1, 'x');
    await tick();
    queue.cancel(1);
    waits[0]();
    await tick();

    expect(sent).toBe(1); // the pending attempt was forgotten
  });

  test('a file that refuses one big read is read slice by slice; when nothing works the error says what each path answered', async () => {
    const dead = () => Promise.reject(Object.assign(new Error('x'), { name: 'NotReadableError' }));
    const whole = { name: 'a.jpg', size: 600000, arrayBuffer: dead, slice: (from, to) => ({ arrayBuffer: async () => new ArrayBuffer(Math.min(to, 600000) - from) }) };

    expect((await readBytes(whole)).size).toBe(600000);

    const gone = { name: 'b.jpg', size: 10, arrayBuffer: dead, slice: () => ({ arrayBuffer: dead }) };
    const error = await readBytes(gone).catch(e => e);

    expect(error.tried[0]).toBe('buffer:NotReadableError');
    expect(error.tried.at(-1)).toBe('slices:NotReadableError');
  });

  test('a connection that stops answering is given up on and counts as a dropped connection', async () => {
    const real = globalThis.setTimeout;
    const realXhr = globalThis.XMLHttpRequest;
    const timers = [];
    let aborted = 0;

    globalThis.setTimeout = (fn, ms) => (timers.push([fn, ms]), timers.length);
    globalThis.XMLHttpRequest = class {
      upload = {};
      open() {}
      setRequestHeader() {}
      send() {}
      abort() {
        aborted++;
        this.onabort?.();
      }
    };

    try {
      const task = sendFile({ name: 'a.jpg', size: 3, arrayBuffer: async () => new ArrayBuffer(3) }, { onProgress() {} });
      const outcome = task.done.then(() => 'sent', e => e.code);

      for(let i = 0; i < 20 && !timers.some(t => t[1] === STALL_MS); i++) await Promise.resolve();

      // nothing arrives: the stall timer fires
      timers.filter(t => t[1] === STALL_MS).at(-1)[0]();

      expect(await outcome).toBe('network');
      expect(aborted).toBe(1);
      expect(REPLY_MS).toBeGreaterThan(STALL_MS);
    } finally {
      globalThis.setTimeout = real;
      globalThis.XMLHttpRequest = realXhr;
    }
  });

  test('an abort the user asked for is still an abort, not a retry', async () => {
    const realXhr = globalThis.XMLHttpRequest;

    globalThis.XMLHttpRequest = class {
      upload = {};
      open() {}
      setRequestHeader() {}
      send() {}
      abort() {
        this.onabort?.();
      }
    };

    try {
      const task = sendFile({ name: 'a.jpg', size: 3, arrayBuffer: async () => new ArrayBuffer(3) }, { onProgress() {} });
      const outcome = task.done.then(() => 'sent', e => e.code);

      await Bun.sleep(5);
      task.abort();
      expect(await outcome).toBe('aborted');
    } finally {
      globalThis.XMLHttpRequest = realXhr;
    }
  });
});
