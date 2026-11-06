// bun test: PATCH /api/nodes/:id/captions (server/api/nodes.js saveCaptions), the notes of photos
// edited in place (docs/GALLERY.md S5c): only the document and its rev change
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { getNode, insertNode, nodePhotos, setNodePhotos, takeLock, upsertPhoto } from '../server/db/nodes.js';
import { saveUser } from '../server/auth.js';
import { saveCaptions } from '../server/api/nodes.js';
import { LIMITS } from '../client/editor/core/model.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
let h;
let owner;
let other;

const photo = (id, hash, extra = {}) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal', ...extra });
const doc = steps => ({ v: 1, style: {}, mode: 'grid', pages: [{ id: 'page0001', steps }] });

beforeEach(async () => {
  h = await open(':memory:');
  upsertPhoto(h, { hash: A, ext: 'jpg', width: 400, height: 300, bytes: 10 });
  upsertPhoto(h, { hash: B, ext: 'jpg', width: 400, height: 300, bytes: 10 });

  const o = await saveUser(h, { email: 'o@example.test', password: 'a-long-test-password-1' });
  const x = await saveUser(h, { email: 'x@example.test', password: 'a-long-test-password-2' });

  owner = { id: o.id };
  other = { id: x.id };
});

const make = (steps = [photo('aaaaaaa1', A), photo('aaaaaaa2', B)]) => {
  const { id } = insertNode(h, { title: 'Trip', doc: doc(steps), palette: ['#112233'] });

  h.run('UPDATE nodes SET owner_id = ?, tile = ? WHERE id = ?', owner.id, 'tile', id);
  setNodePhotos(h, id, [{ hash: A }]);

  return id;
};

const notes = id => getNode(h, id).doc.pages[0].steps.map(s => s.desc);

describe('saveCaptions', () => {
  test('sets and clears notes, bumps rev, leaves the tile, the title, the palette and the photo rows alone', async () => {
    const id = make();
    const before = getNode(h, id);
    const r = await saveCaptions(h, id, { rev: before.rev, set: { aaaaaaa1: 'Table Mountain\n\nWe went up at dawn.', aaaaaaa2: null } }, { viewer: owner });

    expect(r).toEqual({ status: 200, body: { rev: before.rev + 1 } });
    expect(notes(id)).toEqual(['Table Mountain\n\nWe went up at dawn.', undefined]);

    const after = getNode(h, id);

    expect([after.tile, after.title, after.palette]).toEqual(['tile', 'Trip', ['#112233']]);
    expect(nodePhotos(h, id).map(p => p.hash)).toEqual([A]);

    const again = await saveCaptions(h, id, { rev: after.rev, set: { aaaaaaa1: '' } }, { viewer: owner });

    expect(again.status).toBe(200);
    expect(notes(id)).toEqual([undefined, undefined]);
  });

  test('line ends and control characters are cleaned, the ends are trimmed', async () => {
    const id = make();

    await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: '  one\r\ntwo\u0007\r\n\r\nthree  ' } }, { viewer: owner });

    expect(notes(id)[0]).toBe('one\ntwo\n\nthree');
  });

  test('only the owner; a stranger gets 403, nobody 403 too for an owned node', async () => {
    const id = make();

    expect((await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'x' } }, { viewer: other })).status).toBe(403);
    expect((await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'x' } }, { viewer: null })).status).toBe(403);
    expect((await saveCaptions(h, 999, { rev: 1, set: { aaaaaaa1: 'x' } }, { viewer: owner })).status).toBe(404);
    expect(notes(id)).toEqual([undefined, undefined]);
  });

  test('a node open in an editor elsewhere is locked; the holder itself may write; the lock stays', async () => {
    const id = make();

    takeLock(h, id, 'tab-1', { userId: owner.id });

    const locked = await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'x' } }, { viewer: owner, holder: 'tab-2' });

    expect(locked.status).toBe(423);
    expect((await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'x' } }, { viewer: owner, holder: 'tab-1' })).status).toBe(200);
    expect(h.get('SELECT holder FROM node_locks WHERE node_id = ?', id)?.holder).toBe('tab-1');
  });

  test('a stale rev is a conflict that names the stored one; a missing rev is invalid', async () => {
    const id = make();

    await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'x' } }, { viewer: owner });

    expect(await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'y' } }, { viewer: owner })).toEqual({ status: 409, body: { error: 'conflict', rev: 2 } });
    expect((await saveCaptions(h, id, { set: { aaaaaaa1: 'y' } }, { viewer: owner })).status).toBe(400);
    expect(notes(id)[0]).toBe('x');
  });

  test('a body of the wrong shape, an unknown step, a texture or a non-string is refused whole', async () => {
    const id = make([photo('aaaaaaa1', A), photo('aaaaaaa2', B, { role: 'texture' })]);
    const go = set => saveCaptions(h, id, { rev: 1, set }, { viewer: owner });

    for(const set of [undefined, null, [], {}, { nope: 'x' }, { aaaaaaa1: 'ok', aaaaaaa2: 'texture' }, { aaaaaaa1: 5 }]) expect((await go(set)).status).toBe(400);

    expect(Object.keys(Object.fromEntries(Array.from({ length: 201 }, (_, i) => ['k' + i, 'x'])))).toHaveLength(201);
    expect((await go(Object.fromEntries(Array.from({ length: 201 }, (_, i) => ['k' + i, 'x'])))).status).toBe(400);
    expect(notes(id)).toEqual([undefined, undefined]);
  });

  test('the limit of a note is LIMITS.desc, over it nothing is written', async () => {
    const id = make();

    expect((await saveCaptions(h, id, { rev: 1, set: { aaaaaaa1: 'x'.repeat(LIMITS.desc) } }, { viewer: owner })).status).toBe(200);

    const r = await saveCaptions(h, id, { rev: 2, set: { aaaaaaa2: 'y', aaaaaaa1: 'x'.repeat(LIMITS.desc + 1) } }, { viewer: owner });

    expect(r.status).toBe(413);
    expect(notes(id)[1]).toBeUndefined();
    expect(getNode(h, id).rev).toBe(2);
  });

  test('a document that would pass the size limit is refused', async () => {
    const steps = Array.from({ length: 300 }, (_, i) => photo('p' + String(i).padStart(7, '0'), A));
    const id = make(steps);
    let rev = 1;
    let refused = null;

    // 300 notes of the full length are about 1.5 MB, over the 1 MiB of a document
    for(let i = 0; i < 300 && !refused; i += 100) {
      const r = await saveCaptions(h, id, { rev, set: Object.fromEntries(steps.slice(i, i + 100).map(s => [s.id, 'z'.repeat(LIMITS.desc)])) }, { viewer: owner });

      if(r.status === 200) rev = r.body.rev;
      else refused = r;
    }

    expect(refused?.status).toBe(413);
    expect(refused?.body.details).toEqual([{ code: 'doc_full', path: 'doc' }]);
  });
});
