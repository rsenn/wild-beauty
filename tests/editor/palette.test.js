// bun test: client/color.js and client/editor/palette.js (E84-E86)
import { describe, expect, test } from 'bun:test';
import { distance, fromOklch, parseHex, formatHex, toOklch } from '../../client/color.js';
import { contrast, complement, dominant, neutral, swatches, tetradicPair, triadic } from '../../client/editor/palette.js';

const hueOf = hex => toOklch(hex)[2];
const gap = (a, b) => {
  const d = Math.abs(a - b) % 360;

  return Math.min(d, 360 - d);
};
const pal = (...hex) => hex.map(h => ({ hex: h }));

describe('colour', () => {
  test('hex parse and format with alpha', () => {
    expect(parseHex('#fa0')).toEqual([255, 170, 0, 1]);
    expect(formatHex(parseHex('#11223380'))).toBe('#11223380');
    expect(formatHex([1, 2, 3])).toBe('#010203');
    expect(parseHex('red')).toBe(null);
  });

  test('hex -> oklch -> hex within one unit per channel', () => {
    for(const hex of ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#808080', '#000000', '#ffffff', '#123456']) {
      const back = parseHex(fromOklch(toOklch(hex)));

      parseHex(hex).slice(0, 3).forEach((v, i) => expect(Math.abs(v - back[i])).toBeLessThanOrEqual(1));
    }
  });

  test('out-of-gamut colours are clamped into sRGB', () => {
    expect(fromOklch([0.7, 0.45, 150])).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('distance', () => {
    expect(distance('#336699', '#336699')).toBe(0);
    expect(distance('#000000', '#ffffff')).toBeGreaterThan(0.9);
  });
});

describe('palette', () => {
  test('a 2-colour photo still gives 4 distinct colours', () => {
    const d = dominant(pal('#c0392b', '#2980b9'));

    expect(d.length).toBe(4);
    expect(new Set(d).size).toBe(4);
  });

  test('an 8-colour photo keeps the heaviest and skips near duplicates', () => {
    const d = dominant(pal('#c0392b', '#c13a2c', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#16a085', '#d35400'));

    expect(d[0]).toBe('#c0392b');
    expect(d).not.toContain('#c13a2c');
    expect(new Set(d).size).toBe(4);
  });

  test('small vivid colours win over more shades of a dull, heavy background', () => {
    const d = dominant([
      { hex: '#1b1d22', weight: 0.4 },
      { hex: '#2a2c33', weight: 0.2 },
      { hex: '#5a5750', weight: 0.15 },
      { hex: '#7a2fb0', weight: 0.04 },
      { hex: '#e8c81a', weight: 0.03 },
      { hex: '#b5651d', weight: 0.05 },
    ]);

    expect(d[0]).toBe('#1b1d22');
    expect(d).toEqual(expect.arrayContaining(['#7a2fb0', '#e8c81a', '#b5651d']));
  });

  test('a grey photo gives 4 distinct colours', () => {
    const d = dominant(pal('#808080'));

    expect(new Set(d).size).toBe(4);
  });

  test('complements are 180 degrees from their sources, triadic completes 120', () => {
    expect(gap(hueOf(complement('#2980b9')), hueOf('#2980b9'))).toBeGreaterThan(175);

    const a = fromOklch([0.65, 0.12, 30]);
    const b = fromOklch([0.65, 0.12, 150]);

    expect(Math.abs(gap(hueOf(triadic(a, b)), hueOf(a)) - 120)).toBeLessThan(2);
    expect(Math.abs(gap(hueOf(triadic(a, b)), hueOf(b)) - 120)).toBeLessThan(2);
  });

  test('neutral: complement, or black / white for dull colours', () => {
    expect(['#000000', '#ffffff']).toContain(neutral('#808080'));
    expect(neutral('#202020')).toBe('#ffffff');
    expect(neutral('#e0e0e0')).toBe('#000000');
    expect(neutral('#c0392b')).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('tetradic pair prefers a 60 degree gap', () => {
    const d = [fromOklch([0.6, 0.12, 0]), fromOklch([0.6, 0.12, 100]), fromOklch([0.6, 0.12, 200]), fromOklch([0.6, 0.12, 60])];

    expect(tetradicPair(d)).toEqual([0, 3]);
  });

  test('eight valid swatches, with or without a palette', () => {
    for(const p of [pal('#c0392b', '#2980b9', '#27ae60', '#f1c40f'), pal('#808080'), []]) {
      const all = swatches(p).all;

      expect(all.length).toBe(8);
      for(const hex of all) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('contrast swatches', () => {
  test('stand out from a scene: far from its dominant colours, no repeats', () => {
    const scene = pal('#2c5d2a', '#3f7d3a', '#1f4a20', '#6aa35f');
    const out = contrast(scene);

    expect(out.length).toBe(6);
    expect(new Set(out).size).toBe(6);
    for(const hex of out.slice(0, 3)) expect(Math.min(...scene.map(s => distance(s.hex, hex)))).toBeGreaterThan(0.15);
    expect(swatches(scene).contrast).toEqual(out);
  });

  test('a dark scene gets light colours first', () => {
    expect(contrast(pal('#000000', '#101010', '#202020'))[0]).toMatch(/^#(ffffff|[c-f])/i);
  });
});
