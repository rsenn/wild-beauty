// bun test: ordering and alignment of a multiple selection (E147)
import { describe, expect, test } from 'bun:test';
import { alignShifts, extentOf } from '../../client/editor/align.js';
import { orderCommands } from '../../client/editor/ordering.js';
import { apply } from '../../client/editor/commands.js';
import { emptyNode, findStep } from '../../client/editor/model.js';

const stroke = id => ({ op: 'stroke', id, pts: [[0, 0, 4], [10, 10, 4]], color: '#000000' });
const doc = (...ids) => ({ ...emptyNode(), pages: [{ id: 'page0001', steps: ids.map(stroke) }] });
const order = d => d.pages[0].steps.map(s => s.id);
const run = (d, commands) => commands.reduce((x, c) => apply({ doc: x, kind: 'node' }, c).snap.doc, d);

describe('ordering', () => {
  test('forward moves each step one place but not over a selected one', () => {
    const d = doc('s0000001', 's0000002', 's0000003', 's0000004');

    expect(order(run(d, orderCommands(d, ['s0000001', 's0000002'], 'up')))).toEqual(['s0000003', 's0000001', 's0000002', 's0000004']);
  });

  test('backward, front and back keep the inner order', () => {
    const d = doc('s0000001', 's0000002', 's0000003', 's0000004');

    expect(order(run(d, orderCommands(d, ['s0000003', 's0000004'], 'down')))).toEqual(['s0000001', 's0000003', 's0000004', 's0000002']);
    expect(order(run(d, orderCommands(d, ['s0000001', 's0000003'], 'front')))).toEqual(['s0000002', 's0000004', 's0000001', 's0000003']);
    expect(order(run(d, orderCommands(d, ['s0000002', 's0000004'], 'back')))).toEqual(['s0000002', 's0000004', 's0000001', 's0000003']);
  });

  test('a step at the end stays', () => {
    const d = doc('s0000001', 's0000002');

    expect(orderCommands(d, ['s0000002'], 'up')).toEqual([]);
    expect(findStep(d, 's0000001').index).toBe(0);
  });
});

describe('align', () => {
  const items = [{ id: 'a', box: [0, 0, 10, 10] }, { id: 'b', box: [30, 20, 70, 40] }, { id: 'c', box: [100, 5, 110, 25] }];

  test('to an edge or the centre of the whole extent', () => {
    expect(alignShifts(items, 'left').map(s => s.dx)).toEqual([0, -30, -100]);
    expect(alignShifts(items, 'right').map(s => s.dx)).toEqual([100, 40, 0]);
    expect(alignShifts(items, 'middle').map(s => s.dy)).toEqual([15, -10, 5]);
  });

  test('distribute leaves the outer two and evens the gaps', () => {
    const shifts = alignShifts(items, 'distribute-h');

    // widths 10 + 40 + 10, span 110: two gaps of 25; b moves to 35
    expect(shifts.find(s => s.id === 'b').dx).toBe(5);
    expect(shifts.find(s => s.id === 'a').dx).toBe(0);
    expect(shifts.find(s => s.id === 'c').dx).toBe(0);
    expect(alignShifts(items.slice(0, 2), 'distribute-h')).toEqual([]);
  });

  test('the box of outlines', () => {
    expect(extentOf([[[0, 0], [4, 0], [4, 3], [0, 3]], [[-2, 1], [1, 1], [1, 9], [-2, 9]]])).toEqual([-2, 0, 4, 9]);
  });
});

describe('recordMoves', () => {
  const photo = (id, extra = {}) => ({ op: 'photo', id, photo: 'a'.repeat(64), m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal', ...extra });
  const base = () => ({ ...emptyNode(), pages: [{ id: 'page0001', steps: [photo('photo001'), photo('photo002'), stroke('strok001')] }] });
  const ops = d => d.pages[0].steps.map(s => (s.op === 'transform' ? `t:${s.target}` : s.id));

  test('one transform per step, after the scrubber position, then later events only change them', () => {
    const items = m => ['photo001', 'photo002'].map(id => ({ id, m }));
    const first = apply({ doc: base(), kind: 'node' }, { type: 'recordMoves', items: items([1, 0, 0, 1, 5, 0]), k: 2, again: false }).snap.doc;

    expect(ops(first)).toEqual(['photo001', 'photo002', 't:photo001', 't:photo002', 'strok001']);

    const next = apply({ doc: first, kind: 'node' }, { type: 'recordMoves', items: items([1, 0, 0, 1, 9, 0]), k: 4, again: true }).snap.doc;

    expect(ops(next)).toEqual(ops(first));
    expect(next.pages[0].steps[2].m[4]).toBe(9);
    expect(next.pages[0].steps[3].m[4]).toBe(9);
  });

  test('steps on different pages or unknown ids change nothing', () => {
    const d = base();

    expect(apply({ doc: d, kind: 'node' }, { type: 'recordMoves', items: [{ id: 'nothere1', m: [1, 0, 0, 1, 1, 1] }], k: 2 }).snap.doc).toBe(d);
  });
});
