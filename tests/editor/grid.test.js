// bun test: client/editor/grid.js
import { describe, expect, test } from 'bun:test';
import { GAP, gridCells, gridLayout, gridOptions } from '../../client/editor/grid.js';
import { setLayout, validate } from '../../client/editor/model.js';
import { apply } from '../../client/editor/matrix.js';

// the rectangle a photo of the given aspect covers on the stage
function rect(m, aspect) {
  const w = aspect >= 1 ? 1000 : 1000 * aspect;
  const h = aspect >= 1 ? 1000 / aspect : 1000;
  const [x0, y0] = apply(m, [0, 0]);
  const [x1, y1] = apply(m, [w, h]);

  return { x0, y0, x1, y1 };
}

const overlap = (a, b) => a.x0 < b.x1 - 1e-9 && b.x0 < a.x1 - 1e-9 && a.y0 < b.y1 - 1e-9 && b.y0 < a.y1 - 1e-9;

describe('gridLayout', () => {
  test('no photos, no cells', () => {
    expect(gridLayout(0)).toEqual([]);
    expect(gridCells(0)).toEqual([]);
  });

  test('1, 2, 5 and 9 photos: inside the stage, no overlap', () => {
    for(const n of [1, 2, 3, 5, 9, 16, 40]) {
      const rects = gridLayout(n).map(m => rect(m, 1));

      expect(rects).toHaveLength(n);

      rects.forEach((r, i) => {
        expect(r.x0).toBeGreaterThanOrEqual(0);
        expect(r.y0).toBeGreaterThanOrEqual(0);
        expect(r.x1).toBeLessThanOrEqual(1000 + 1e-9);
        expect(r.y1).toBeLessThanOrEqual(1000 + 1e-9);
        rects.slice(i + 1).forEach(other => expect(overlap(r, other)).toBe(false));
      });
    }
  });

  test('mixed aspects stay inside their cells', () => {
    const aspects = [0.75, 1.5, 1, 0.5, 2];
    const cells = gridCells(5);
    const rects = gridLayout(5, aspects).map((m, i) => rect(m, aspects[i]));

    rects.forEach((r, i) => {
      const c = cells[i];

      expect(r.x0).toBeGreaterThanOrEqual(c.x - 1e-9);
      expect(r.y0).toBeGreaterThanOrEqual(c.y - 1e-9);
      expect(r.x1).toBeLessThanOrEqual(c.x + c.size + 1e-9);
      expect(r.y1).toBeLessThanOrEqual(c.y + c.size + 1e-9);
      // the long edge fills the cell
      expect(Math.max(r.x1 - r.x0, r.y1 - r.y0)).toBeCloseTo(c.size, 9);
    });
  });

  test('known layouts', () => {
    expect(gridCells(1)).toEqual([{ x: GAP, y: GAP, size: 1000 - 2 * GAP }]);

    // 2 photos: side by side, centred vertically
    const [a, b] = gridCells(2);

    expect(a.size).toBeCloseTo((1000 - 3 * GAP) / 2, 9);
    expect(b.x).toBeCloseTo(a.x + a.size + GAP, 9);
    expect(a.y).toBe(b.y);
    expect(a.y).toBeGreaterThan(GAP);

    // 9 photos: 3 x 3
    expect(new Set(gridCells(9).map(c => c.y)).size).toBe(3);
    expect(new Set(gridCells(9).map(c => c.x)).size).toBe(3);
  });

  test('an incomplete last row is centred', () => {
    const cells = gridCells(5);
    const last = cells.slice(-2);
    const left = last[0].x;
    const right = last[1].x + last[1].size;

    expect(left + right).toBeCloseTo(1000, 9);
  });
});

describe('columns and spacing 0', () => {
  test('cols fixes the column count (at most n), gap 0 packs the cells', () => {
    const cells = gridCells(5, { gap: 0, margin: 0, cols: 2 });

    expect(new Set(cells.map(c => c.x)).size).toBeLessThanOrEqual(3); // two columns, the last row centred
    expect(cells.filter(c => c.y === cells[0].y).length).toBe(2);
    expect(cells[0].size).toBeCloseTo(1000 / 3, 3); // three rows decide
    expect(gridCells(2, { cols: 9 }).length).toBe(2);
    expect(gridOptions({ cols: 3, gap: 0 })).toMatchObject({ gap: 0, margin: 0, cols: 3 });
    expect(gridOptions({ cols: 0 }).cols).toBeUndefined();
  });

  test('setLayout takes cols, drops it again with null, refuses nonsense', () => {
    const doc = { v: 1, mode: 'grid', pages: [{ id: 'p', steps: [] }], style: {} };
    const a = setLayout(doc, { cols: 3, gap: 0 });

    expect(a.layout).toEqual({ cols: 3, gap: 0 });
    expect(setLayout(a, { cols: null }).layout).toEqual({ gap: 0 });
    expect(setLayout(a, { cols: 99 })).toBe(a);
    expect(setLayout(a, { cols: 1.5 })).toBe(a);
    expect(validate(a).filter(e => e.code === 'bad_layout')).toEqual([]);
  });
});
