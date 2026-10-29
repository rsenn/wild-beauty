// bun test: "Add photos" in the node editor (client/editor/quickadd.js, the addPhotos command)
import { describe, expect, test } from 'bun:test';
import { apply } from '../client/editor/commands.js';
import * as history from '../client/editor/history.js';
import { emptyNode, photoSteps } from '../client/editor/model.js';
import { fitFiles, readyToAdd } from '../client/editor/quickadd.js';

const item = (id, state, record = null) => ({ id, state, record: state === 'done' ? (record ?? { hash: 'h' + id }) : record });

describe('readyToAdd', () => {
  test('photos go in the order chosen: one still on its way holds back the ones after it', () => {
    const taken = new Set();
    const a = readyToAdd([item(1, 'uploading'), item(2, 'done'), item(3, 'done')], 0, taken);

    expect(a.records).toEqual([]);
    expect(a.next).toBe(0);

    const b = readyToAdd([item(1, 'done'), item(2, 'done'), item(3, 'uploading')], a.next, taken);

    expect(b.records.map(r => r.hash)).toEqual(['h1', 'h2']);
    expect(b.next).toBe(2);
  });

  test('a photo that failed for good is skipped, and added at the end when it is retried', () => {
    const taken = new Set();
    const first = readyToAdd([item(1, 'done'), item(2, 'failed'), item(3, 'done')], 0, taken);

    expect(first.records.map(r => r.hash)).toEqual(['h1', 'h3']);
    first.ids.forEach(id => taken.add(id));

    const later = readyToAdd([item(1, 'done'), item(2, 'done'), item(3, 'done')], first.next, taken);

    expect(later.records.map(r => r.hash)).toEqual(['h2']);
    expect(readyToAdd([item(1, 'done'), item(2, 'done'), item(3, 'done')], later.next, new Set([1, 2, 3])).records).toEqual([]);
  });
});

describe('fitFiles', () => {
  test('only what the node still takes, counting those on their way', () => {
    expect(fitFiles(100, { limit: 40 })).toEqual({ take: 40, skipped: 60 });
    expect(fitFiles(10, { limit: 40, have: 35 })).toEqual({ take: 5, skipped: 5 });
    expect(fitFiles(10, { limit: 40, have: 30, waiting: 10 })).toEqual({ take: 0, skipped: 10 });
    expect(fitFiles(3, { limit: 40 })).toEqual({ take: 3, skipped: 0 });
  });
});

describe('the addPhotos command', () => {
  const photos = ks => ks.map(k => ({ hash: String(k).repeat(64), info: { width: 400, height: 300 }, id: 'p' + k + 'xxxxxx' }));
  const start = () => {
    const doc = emptyNode();

    return { snap: { doc, kind: 'node' }, page: doc.pages[0].id };
  };

  test('adds all in order in one step, and a batch key makes the flushes one undo step', () => {
    const { snap, page } = start();
    let h = history.create(snap);

    for(const ks of [[1, 2], [3]]) {
      const r = apply(h.present, { type: 'addPhotos', page, batch: 'b1', photos: photos(ks) });

      h = history.push(h, r.snap, r.key);
    }

    expect(photoSteps(h.present.doc).map(s => s.photo[0])).toEqual(['1', '2', '3']);
    expect(h.past.length).toBe(1); // one undo takes the whole batch back

    h = history.undo(h);
    expect(photoSteps(h.present.doc).length).toBe(0);
  });

  test('without a batch every call is its own undo step', () => {
    const { snap, page } = start();
    let h = history.create(snap);

    for(const ks of [[1], [2]]) {
      const r = apply(h.present, { type: 'addPhotos', page, photos: photos(ks) });

      h = history.push(h, r.snap, r.key);
    }

    expect(h.past.length).toBe(2);
  });
});
