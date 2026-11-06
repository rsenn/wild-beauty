// bun test: client/editor/io/captions.js (the queue behind the node view's note field) and
// client/editor/core/caption.js (first line, paragraphs)
import { describe, expect, test } from 'bun:test';
import { createCaptionSaver } from '../../client/editor/io/captions.js';
import { hasBody, paragraphsOf, titleOf } from '../../client/editor/core/caption.js';

// a fake timer: nothing runs until fire()
const clock = () => {
  const jobs = new Map();
  let n = 0;

  return { later: fn => (jobs.set(++n, fn), n), clear: id => jobs.delete(id), fire: () => [...jobs.values()].map(fn => fn()), count: () => jobs.size };
};

const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('createCaptionSaver', () => {
  test('changes typed together go out as one request with the rev, the next one uses the answered rev', async () => {
    const c = clock();
    const calls = [];
    const send = async (url, init) => (calls.push([url, init.method, JSON.parse(init.body)]), reply(200, { rev: 2 + calls.length - 1 }));
    const s = createCaptionSaver({ id: 7, rev: 2, send, later: c.later, clear: c.clear });

    s.set('a1', 'one');
    s.set('a2', 'two');
    s.set('a1', 'one!');

    expect(calls).toEqual([]);
    expect(s.pending()).toBe(true);

    await Promise.all(c.fire());

    expect(calls).toEqual([['/api/nodes/7/captions', 'PATCH', { rev: 2, set: { a1: 'one!', a2: 'two' } }]]);
    expect(s.rev()).toBe(2);

    s.set('a3', '');
    await s.flush();

    expect(calls[1][2]).toEqual({ rev: 2, set: { a3: null } });
    expect(s.rev()).toBe(3);
    expect(s.pending()).toBe(false);
  });

  test('a conflict keeps the text queued and learns the stored rev; the retry sends it', async () => {
    const c = clock();
    const states = [];
    let answer = reply(409, { error: 'conflict', rev: 9 });
    const bodies = [];
    const send = async (url, init) => (bodies.push(JSON.parse(init.body)), answer);
    const s = createCaptionSaver({ id: 1, rev: 2, send, later: c.later, clear: c.clear });

    s.onState(state => states.push(state));
    s.set('a1', 'x');
    await s.flush();

    expect(states.at(-1)).toEqual({ rev: 9, status: 'error', code: 'conflict' });
    expect(s.pending()).toBe(true);

    answer = reply(200, { rev: 10 });
    await s.flush();

    expect(bodies[1]).toEqual({ rev: 9, set: { a1: 'x' } });
    expect(states.at(-1)).toEqual({ rev: 10, status: 'saved' });
  });

  test('a network failure and a locked node keep the text; text typed during a request is kept for the next one', async () => {
    const c = clock();
    let calls = 0;
    const s = createCaptionSaver({
      id: 1,
      rev: 1,
      later: c.later,
      clear: c.clear,
      send: async () => {
        calls++;

        if(calls === 1) throw new Error('offline');
        if(calls === 2) return reply(423, { error: 'locked' });

        return reply(200, { rev: 2 });
      },
    });
    const codes = [];

    s.onState(state => state.status === 'error' && codes.push(state.code));
    s.set('a1', 'x');
    await s.flush();
    await s.flush();
    await s.flush();

    expect(codes).toEqual(['network', 'locked']);
    expect(s.pending()).toBe(false);
    expect(s.rev()).toBe(2);
  });
});

describe('note text helpers', () => {
  test('titleOf: the first line, cut with an ellipsis, empty for nothing', () => {
    expect(titleOf('Table Mountain\nWe went up at dawn.')).toBe('Table Mountain');
    expect(titleOf('\n\n  Second line wins  \nrest')).toBe('Second line wins');
    expect(titleOf('x'.repeat(300), 20)).toBe('x'.repeat(19) + '…');
    expect(titleOf(undefined)).toBe('');
  });

  test('paragraphsOf: blank lines split paragraphs, single breaks stay', () => {
    expect(paragraphsOf('A\nB\n\n\nC\r\n\r\nD')).toEqual([['A', 'B'], ['C'], ['D']]);
    expect(paragraphsOf('')).toEqual([]);
  });

  test('hasBody: more than the first line', () => {
    expect(hasBody('one line')).toBe(false);
    expect(hasBody('title\ntext')).toBe(true);
    expect(hasBody('title\n\n')).toBe(false);
  });
});
