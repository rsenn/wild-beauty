// bun test: client/editor/save.js with a fake fetch
import { describe, expect, test } from 'bun:test';
import { errorKey, saveNode } from '../../client/editor/save.js';
import { emptyNode } from '../../client/editor/model.js';

const snap = { doc: emptyNode(), kind: 'node' };
const reply = (status, body) => async (url, init) => Object.assign(Response.json(body, { status }), { sent: { url, init } });
const spy = (status, body) => {
  const calls = [];
  const fn = async (url, init) => (calls.push({ url, init }), Response.json(body, { status }));

  fn.calls = calls;

  return fn;
};

describe('saveNode', () => {
  test('a new node is POSTed without a rev', async () => {
    const send = spy(201, { id: 7, rev: 1, photos: { a: { href: '/files/photos/a.jpg' } } });
    const r = await saveNode(snap, null, send);

    expect(r).toEqual({ ok: true, id: 7, rev: 1, photos: { a: { href: '/files/photos/a.jpg' } } });
    expect(send.calls[0].url).toBe('/api/nodes');
    expect(send.calls[0].init.method).toBe('POST');
    expect(JSON.parse(send.calls[0].init.body)).toEqual({ doc: snap.doc, kind: 'node' });
  });

  test('an open node is PUT with its rev', async () => {
    const send = spy(200, { rev: 4, photos: {} });
    const r = await saveNode(snap, { id: 7, rev: 3 }, send);

    expect(r).toMatchObject({ ok: true, id: 7, rev: 4 });
    expect(send.calls[0].url).toBe('/api/nodes/7');
    expect(send.calls[0].init.method).toBe('PUT');
    expect(JSON.parse(send.calls[0].init.body).rev).toBe(3);
  });

  test('server errors keep their code and status', async () => {
    expect(await saveNode(snap, null, reply(422, { error: 'missing_photo' }))).toMatchObject({ ok: false, code: 'missing_photo', status: 422 });
    expect(await saveNode(snap, { id: 1, rev: 1 }, reply(409, { error: 'conflict', rev: 2 }))).toMatchObject({ ok: false, code: 'conflict', status: 409 });
    expect(await saveNode(snap, null, reply(500, 'nope'))).toMatchObject({ ok: false, code: 'generic' });
    expect(await saveNode(snap, null, reply(201, { nothing: true }))).toMatchObject({ ok: false, code: 'generic' });
  });

  test('a failing network is its own code', async () => {
    expect(await saveNode(snap, null, async () => { throw new TypeError('offline'); })).toEqual({ ok: false, code: 'network', status: 0 });
  });

  test('error keys', () => {
    expect(errorKey('conflict')).toBe('editor.save.error.conflict');
    expect(errorKey('weird')).toBe('editor.save.error.generic');
  });
});
