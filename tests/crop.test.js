// bun test: the square crop of an upload card (client/files.js) and the grid options
import { describe, expect, test } from 'bun:test';
import { cropPosition, loadCrops, panAxis, saveCrop } from '../client/files.js';
import { gridCells, gridLayout } from '../client/editor/grid.js';

const wide = { width: 400, height: 200 };
const tall = { width: 200, height: 400 };

describe('panAxis', () => {
  test('a landscape photo pans sideways, a portrait one up and down, a square one not at all', () => {
    expect(panAxis(wide).axis).toBe('x');
    expect(panAxis(tall).axis).toBe('y');
    expect(panAxis({ width: 300, height: 300 }).axis).toBeNull();
    expect(panAxis(null).axis).toBeNull();
  });

  test('a quarter turn swaps the axis', () => {
    expect(panAxis(wide, 90).axis).toBe('y');
    expect(panAxis(tall, 270).axis).toBe('x');
    expect(panAxis(wide, 180).axis).toBe('x');
  });

  test('dragging right moves the crop down, until the card is turned over', () => {
    expect(panAxis(wide, 0).sign).toBe(-1);
    expect(panAxis(wide, 180).sign).toBe(1);
    expect(panAxis(tall, 0).sign).toBe(-1);
    expect(panAxis(tall, 90).sign).toBe(1);
  });
});

describe('crop position and memory', () => {
  test('object-position follows the long edge', () => {
    expect(cropPosition(wide, 0.25)).toBe('25% 50%');
    expect(cropPosition(tall, 1)).toBe('50% 100%');
  });

  test('crops are remembered per hash and survive broken storage', () => {
    const data = {};
    const storage = { getItem: k => data[k] ?? null, setItem: (k, v) => (data[k] = v) };

    saveCrop('aa', 0.3, storage);
    saveCrop('bb', 1, storage);
    expect(loadCrops(storage)).toEqual({ aa: 0.3, bb: 1 });
    expect(loadCrops({ getItem: () => '{nope' })).toEqual({});
    expect(loadCrops(null)).toEqual({});
  });
});

describe('grid options', () => {
  const covered = cells => cells.reduce((sum, c) => sum + c.size * c.size, 0);

  test('tight covers more of the stage than loose, cells stay square and inside', () => {
    for(const n of [2, 5, 7, 12]) {
      const loose = gridLayout(n, { fill: 'loose' });
      const tight = gridLayout(n, { fill: 'tight' });
      const size = ms => ms.map(m => m[0] * 1000);

      expect(Math.min(...size(tight))).toBeGreaterThan(Math.max(...size(loose)));
      for(const [a, b, c, d, e, f] of tight) {
        expect([b, c]).toEqual([0, 0]);
        expect(a).toBe(d);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e + a * 1000).toBeLessThanOrEqual(1000.0001);
        expect(f + d * 1000).toBeLessThanOrEqual(1000.0001);
      }
    }

    expect(covered(gridCells(4, { gap: 4, margin: 0 }))).toBeGreaterThan(covered(gridCells(4)));
  });

  test('an explicit gap is honoured', () => {
    const [a, b] = gridCells(2, { gap: 50, margin: 0 });

    expect(b.x - (a.x + a.size)).toBe(50);
  });
});
