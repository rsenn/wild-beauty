// bun test: the colours of the stage (E132)
import { describe, expect, test } from 'bun:test';

describe('scene palette', () => {
  test('counts the visible pixels, merges look-alikes and ignores transparent ones', async () => {
    const { paletteFromPixels } = await import('../client/editor/scenepalette.js');
    const px = [];
    const put = (r, g, b, a, n) => { for(let i = 0; i < n; i++) px.push(r, g, b, a); };

    put(200, 30, 30, 255, 60);
    put(204, 32, 30, 255, 20); // the same red to the eye
    put(20, 40, 200, 255, 20);
    put(0, 0, 0, 0, 500);

    const palette = paletteFromPixels(Uint8ClampedArray.from(px));

    expect(palette).toHaveLength(2);
    expect(palette[0].hex).toMatch(/^#c[0-9a-f]/);
    expect(palette[0].weight).toBeCloseTo(0.8, 1);
    expect(paletteFromPixels(new Uint8ClampedArray(40))).toEqual([]);
  });
});

describe('used colours', () => {
  test('the node own colours, most used first', async () => {
    const { usedColours } = await import('../client/editor/palette.js');
    const doc = { bg: '#FFFFFF', pages: [{ id: 'p', steps: [{ op: 'stroke', color: '#aa0000' }, { op: 'stroke', color: '#aa0000' }, { op: 'shape', fill: '#00aa00cc', stroke: 'red' }, { op: 'text', color: '#111111', bg: '#aa0000' }] }] };

    expect(usedColours(doc)).toEqual(['#aa0000', '#ffffff', '#00aa00', '#111111']);
    expect(usedColours(doc, 2)).toHaveLength(2);
  });
});
