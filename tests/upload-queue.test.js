// bun test: the upload queue retries a dropped connection (client/upload.js)
import { describe, expect, test } from 'bun:test';
import { RETRIES, createQueue, pause } from '../client/upload.js';

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
});
