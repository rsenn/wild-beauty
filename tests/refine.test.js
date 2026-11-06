// bun test: the pure parts of the instant cut and its background refinement (client/editor/tools/wand/refine.js, docs/WAND.md A7)
import { describe, expect, test } from 'bun:test';
import { MAX_REFINING, canRebase, createQueue, refineBlocked } from '../client/editor/tools/wand/refine.js';
import { emptyNode } from '../client/editor/core/model.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const docWith = step => ({ ...emptyNode(), pages: [{ id: 'page0001', steps: [{ op: 'photo', id: 'photo001', photo: A, m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal', ...step }] }] });

describe('refineBlocked', () => {
  test('what would change the image or the clip of a refining photo is refused, moves and the rest are free', () => {
    const ids = ['photo001'];

    for(const type of ['clipPolygon', 'clipOutline', 'setClipPolygons', 'unclip', 'setClip', 'replacePhoto', 'cutPhoto', 'setCrop', 'splitClip']) expect(refineBlocked(ids, { type, id: 'photo001' })).toBe(true);
    for(const type of ['moveStep', 'setMatrix', 'setOpacity', 'removeStep', 'duplicatePhoto', 'setBlend', 'flipStep']) expect(refineBlocked(ids, { type, id: 'photo001' })).toBe(false);
  });

  test('another photo, no running job, and the job\'s own commands are free', () => {
    expect(refineBlocked(['photo001'], { type: 'unclip', id: 'photo002' })).toBe(false);
    expect(refineBlocked([], { type: 'unclip', id: 'photo001' })).toBe(false);
    expect(refineBlocked(['photo001'], { type: 'unclip', id: 'photo001', refine: true })).toBe(false);
    expect(refineBlocked(['photo001'], { type: 'replacePhoto', id: 'photo001', wand: true })).toBe(false);
  });
});

describe('canRebase', () => {
  const job = { id: 'photo001', photo: A, clip: 'shape001' };

  test('the photo still wears the clip of the job: the exact cut may replace it, wherever the piece was moved to', () => {
    expect(canRebase(docWith({ clip: 'shape001', m: [2, 0, 0, 2, 300, 40] }), job)).toBe(true);
  });

  test('undone (no clip), clipped again, replaced or deleted: the result is dropped', () => {
    expect(canRebase(docWith({}), job)).toBe(false);
    expect(canRebase(docWith({ clip: 'shape002' }), job)).toBe(false);
    expect(canRebase(docWith({ clip: 'shape001', photo: B }), job)).toBe(false);
    expect(canRebase(emptyNode(), job)).toBe(false);
  });
});

describe('createQueue', () => {
  const tick = () => new Promise(r => setTimeout(r, 0));

  test('runs at most two at once, the rest in order', async () => {
    const started = [];
    const finish = {};
    const queue = createQueue(job => new Promise(r => ((finish[job] = r), started.push(job))));

    expect(MAX_REFINING).toBe(2);

    for(const job of ['a', 'b', 'c', 'd']) queue.add(job);

    await tick();
    expect(started).toEqual(['a', 'b']);
    expect(queue.running).toBe(2);
    expect(queue.waiting).toBe(2);

    finish.a();
    await tick();
    expect(started).toEqual(['a', 'b', 'c']);

    finish.b();
    finish.c();
    await tick();
    expect(started).toEqual(['a', 'b', 'c', 'd']);
    finish.d();
    await tick();
    expect(queue.running).toBe(0);
  });

  test('a job that fails frees its place; a waiting job can be dropped', async () => {
    const started = [];
    const queue = createQueue(job => (started.push(job), job === 'bad' ? Promise.reject(new Error('x')) : new Promise(() => {})), { limit: 1 });

    queue.add('bad');
    queue.add('next');
    queue.add('dropped');
    queue.drop(job => job === 'dropped');
    await tick();
    expect(started).toEqual(['bad', 'next']);
    expect(queue.waiting).toBe(0);
  });
});
