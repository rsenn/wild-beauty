import { describe, expect, test } from 'bun:test';

describe('the magic wand route (E119)', () => {
  test('a select step asks for the three candidates as outlines only, an apply for the picked one at full size', async () => {
    const { segmentArgs } = await import('../server/api/segment.js');
    const points = [[0.5, 0.25, 1], [0.1, 0.9, 0]];
    const select = segmentArgs({ file: '/p/a.jpg', points, out: '/o', cache: '/c', pick: 1 });

    expect(select.slice(0, 4)).toEqual(['segment', '--in', '/p/a.jpg', '--units']);
    expect(select).toContain('0.50000,0.25000,1');
    expect(select).toContain('0.10000,0.90000,0');
    expect(select[select.indexOf('--groups') + 1]).toBe('auto');
    // an exclude tap subtracts the object under it (WAND.md A6), select and apply alike
    expect(select[select.indexOf('--exclude') + 1]).toBe('object');
    expect(select).toContain('--masks-only');
    expect(select[select.indexOf('--candidates') + 1]).toBe('3');
    expect(select[select.indexOf('--outline-vertices') + 1]).toBe('120');
    expect(select).not.toContain('--out');

    const apply = segmentArgs({ file: '/p/a.jpg', points, out: '/o', cache: '/c', pick: 1, action: 'take' });

    expect(apply).not.toContain('--masks-only');
    expect(apply[apply.indexOf('--mask-out') + 1]).toBe('/o/mask.png');

    // a cut needs no mask, and is never a select
    const cut = segmentArgs({ file: '/p/a.jpg', points, out: '/o', cache: '/c', pick: 1, action: 'cut' });

    expect(cut).not.toContain('--masks-only');
    expect(cut).not.toContain('--mask-out');
    expect(apply[apply.indexOf('--candidates') + 1]).toBe('1');
    expect(apply[apply.indexOf('--pick') + 1]).toBe('1');
    expect(apply[apply.indexOf('--out') + 1]).toBe('/o/cut.png');
    expect(segmentArgs({ file: '/p/a.jpg', points, out: '/o', cache: '/c', action: 'cut' })[apply.indexOf('--pick') + 1]).toBe('2');
  });

  test('inpaintArgs runs tools/inpaint.py isolated on the photo and the cut', async () => {
    const { inpaintArgs } = await import('../server/api/segment.js');
    const args = inpaintArgs({ file: '/p/a.jpg', cut: '/o/cut.png', rest: '/o/rest.png' });

    expect(args[1]).toBe('-I');
    expect(args[2]).toMatch(/tools\/inpaint\.py$/);
    expect(args.slice(3)).toEqual(['--image', '/p/a.jpg', '--cut', '/o/cut.png', '--out', '/o/rest.png']);
    expect(inpaintArgs({ file: '/p/a.jpg', cut: '/o/cut.png', rest: '/o/rest.png', fill: false }).at(-1)).toBe('--no-fill');
  });

  test('cleanPoints refuses malformed taps and caps the list', async () => {
    const { cleanPoints } = await import('../server/api/segment.js');

    expect(cleanPoints([[0.5, 0.5]])).toEqual([[0.5, 0.5, 1]]);
    expect(cleanPoints([[0.5, 0.5, 0]])).toEqual([[0.5, 0.5, 0]]);
    expect(cleanPoints([[1.5, 0.5]])).toBeNull();
    expect(cleanPoints([])).toBeNull();
    expect(cleanPoints(Array.from({ length: 33 }, () => [0.5, 0.5]))).toBeNull();
  });

  test('cleanRegion keeps polygons in 0..1, thins big ones and refuses the rest', async () => {
    const { cleanRegion, segmentArgs } = await import('../server/api/segment.js');
    const tri = [[0, 0], [0.123456, 0], [0.5, 0.5]];

    expect(cleanRegion([tri])).toEqual([[[0, 0], [0.1235, 0], [0.5, 0.5]]]);
    expect(cleanRegion(null)).toBeNull();
    expect(cleanRegion([[[0, 0], [2, 0], [0.5, 0.5]]])).toBeNull();
    expect(cleanRegion([[[0, 0], [1, 0]]])).toBeNull();
    expect(cleanRegion(Array.from({ length: 9 }, () => tri))).toBeNull();

    const big = Array.from({ length: 3000 }, (_, i) => [i / 3000, 0.5]);

    expect(cleanRegion([big])[0].length).toBeLessThanOrEqual(600);
    expect(segmentArgs({ file: '/p/a.jpg', points: [[0.5, 0.5, 1]], out: '/o', cache: '/c', region: [tri] })).toContain('--region');
  });
});
