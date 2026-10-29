import { describe, expect, test } from 'bun:test';


describe('transparent padding is not hit (alpha map)', () => {
  test('a click on a clear pixel falls through, on content it hits', async () => {
    const { alphaMap, loadAlpha, opaqueAt } = await import('../client/editor/alphamap.js');
    const rgba = new Uint8Array(10 * 10 * 4);

    for(let y = 3; y < 6; y++) for(let x = 3; x < 6; x++) rgba[(y * 10 + x) * 4 + 3] = 255;

    const map = alphaMap(rgba, 10, 10);

    expect(map.box).toEqual([0.3, 0.3, 0.6, 0.6]);
    expect(opaqueAt(map, 0.45, 0.45, 0)).toBe(true);
    expect(opaqueAt(map, 0.05, 0.05, 1)).toBe(false);
    expect(opaqueAt(null, 0.05, 0.05)).toBe(true); // no map: opaque
    expect(alphaMap(new Uint8Array(10 * 10 * 4).fill(255), 10, 10)).toBeNull(); // nothing transparent
    expect(await loadAlpha('x.png')).toBeNull(); // no browser
  });
});

describe('the content box inside a clip (computed at cut time)', () => {
  test('hugs the content inside the piece, not the whole picture', async () => {
    const { alphaMap, contentBox } = await import('../client/editor/alphamap.js');
    const w = 100;
    const rgba = new Uint8Array(w * w * 4);

    // two blobs: x 10..29 and x 60..79, both y 20..49
    for(let y = 20; y < 50; y++) for(let x = 0; x < w; x++) if((x >= 10 && x < 30) || (x >= 60 && x < 80)) rgba[(y * w + x) * 4 + 3] = 255;

    const map = alphaMap(rgba, w, w);
    const info = { width: 100, height: 100 };
    const left = [[0, 0], [500, 0], [500, 1000], [0, 1000]];
    const box = contentBox(map, info, 0.5, [left]);

    expect(box[0]).toBeGreaterThanOrEqual(80);
    expect(box[0]).toBeLessThanOrEqual(110);
    expect(box[2]).toBeGreaterThanOrEqual(290);
    expect(box[2]).toBeLessThanOrEqual(320);
    expect(contentBox(map, info, 0.5, [[[900, 900], [990, 900], [990, 990], [900, 990]]])).toBeNull();
  });
});
