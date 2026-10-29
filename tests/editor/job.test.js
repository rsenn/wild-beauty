// bun test: client/editor/job.js (E128)
import { describe, expect, test } from 'bun:test';
import { blocked } from '../../client/editor/job.js';

const doc = { v: 1, mode: 'free', style: {}, pages: [{ id: 'pageA', steps: [{ op: 'photo', id: 'photoaaa' }, { op: 'photo', id: 'photobbb' }] }, { id: 'pageB', steps: [] }] };

describe('blocked while a job runs on a photo', () => {
  test('what would take the photo away or change it is refused', () => {
    for(const type of ['removeStep', 'cutPhoto', 'duplicatePhoto', 'clipPolygon', 'unclip', 'setCrop', 'setRole', 'replacePhoto']) expect([type, blocked(doc, 'photoaaa', { type, id: 'photoaaa' })]).toEqual([type, true]);

    expect(blocked(doc, 'photoaaa', { type: 'removePage', id: 'pageA' })).toBe(true);
  });

  test('everything else stays editable, also on other photos; the job\'s own results pass', () => {
    expect(blocked(doc, 'photoaaa', { type: 'removeStep', id: 'photobbb' })).toBe(false);
    expect(blocked(doc, 'photoaaa', { type: 'setMatrix', id: 'photoaaa', m: [1, 0, 0, 1, 0, 0] })).toBe(false);
    expect(blocked(doc, 'photoaaa', { type: 'addText', page: 'pageA' })).toBe(false);
    expect(blocked(doc, 'photoaaa', { type: 'removePage', id: 'pageB' })).toBe(false);
    expect(blocked(doc, 'photoaaa', { type: 'replacePhoto', id: 'photoaaa', hash: 'x', cutout: true })).toBe(false);
    expect(blocked(doc, null, { type: 'removeStep', id: 'photoaaa' })).toBe(false);
  });
});
