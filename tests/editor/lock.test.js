// bun test: client/editor/lock.js with a fake server and timers, and the
// per-tab holder of server/session.js
import { describe, expect, test } from 'bun:test';
import { createLock } from '../../client/editor/lock.js';
import { sessionFor } from '../../server/session.js';

// a fake lock endpoint: `holder` is who has it, `mine` what this client is
function fake() {
  const s = { holder: null, calls: [] };
  const send = async (url, init) => {
    s.calls.push(init.method);

    if(s.net) throw new TypeError('offline');

    if(init.method === 'POST') return s.holder && s.holder !== 'me' ? Response.json({ error: 'locked', holder: s.holder, expires_at: 99 }, { status: 423 }) : ((s.holder = 'me'), Response.json({ expires_at: 60000 }));

    s.holder = s.holder === 'me' || init.method === 'DELETE' ? null : s.holder;

    return new Response(null, { status: 204 });
  };
  const timers = { fns: [], setInterval: fn => (s.timerSet = true, timers.fns.push(fn), timers.fns.length), clearInterval: () => (s.timerCleared = true, timers.fns.length = 0) };

  return { s, send, timers, beat: () => Promise.all(timers.fns.map(f => f())) };
}

describe('lock client', () => {
  test('a free node is taken and renewed on every beat', async () => {
    const f = fake();
    const lock = createLock(1, { send: f.send, timers: f.timers });

    expect(await lock.start()).toBe('held');
    expect(f.s.timerSet).toBe(true);
    await f.beat();
    expect(f.s.calls).toEqual(['POST', 'POST']);
    expect(lock.state).toBe('held');
  });

  test('a node locked by someone else opens read-only, with who and until when', async () => {
    const f = fake();

    f.s.holder = 'abcd1234';

    const changes = [];
    const lock = createLock(1, { send: f.send, timers: f.timers, onChange: c => changes.push(c.state) });

    expect(await lock.start()).toBe('locked');
    expect(lock.info).toEqual({ holder: 'abcd1234', expires_at: 99 });
    expect(f.s.timerSet).toBeUndefined(); // nothing to renew
    expect(changes).toEqual(['locked']);
  });

  test('a lock that is lost on a beat turns the editor read-only', async () => {
    const f = fake();
    const lock = createLock(1, { send: f.send, timers: f.timers });

    await lock.start();
    f.s.holder = 'other'; // broken and taken by someone else
    await f.beat();
    expect(lock.state).toBe('lost');
    expect(f.s.timerCleared).toBe(true);
  });

  test('breaking the lock takes it over', async () => {
    const f = fake();

    f.s.holder = 'other';

    const lock = createLock(1, { send: f.send, timers: f.timers });

    await lock.start();
    expect(await lock.breakLock()).toBe('held');
  });

  test('a network failure keeps the state; stop releases only a held lock', async () => {
    const f = fake();
    const lock = createLock(1, { send: f.send, timers: f.timers });

    await lock.start();
    f.s.net = true;
    await f.beat();
    expect(lock.state).toBe('held');
    f.s.net = false;
    lock.stop();
    await Promise.resolve();
    expect(f.s.calls.at(-1)).toBe('DELETE');

    const g = fake();

    g.s.holder = 'other';

    const waiting = createLock(1, { send: g.send, timers: g.timers });

    await waiting.start();
    waiting.stop();
    expect(g.s.calls).toEqual(['POST']); // nothing to release
  });

  test('retake after a save released the lock', async () => {
    const f = fake();
    const lock = createLock(1, { send: f.send, timers: f.timers });

    await lock.start();
    f.s.holder = null; // the PUT released it
    expect(await lock.retake()).toBe('held');
  });
});

describe('session holder per tab', () => {
  const req = tab => new Request('http://x/', { headers: { cookie: 'wb-session=11111111-2222-3333-4444-555555555555', ...(tab && { 'x-wb-tab': tab }) } });

  test('two tabs of one browser are two holders; no header is the cookie alone', () => {
    const a = sessionFor(req('aaaaaaaaaaaaaaaa')).holder;
    const b = sessionFor(req('bbbbbbbbbbbbbbbb')).holder;
    const none = sessionFor(req()).holder;

    expect(new Set([a, b, none]).size).toBe(3);
    expect(sessionFor(req('aaaaaaaaaaaaaaaa')).holder).toBe(a);
    expect(sessionFor(req('not a tab id!')).holder).toBe(none);
  });
});
