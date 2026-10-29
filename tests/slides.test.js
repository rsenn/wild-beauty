// bun test: the drawings of a slide (render.js slideOf, slideView, stepsOf via renderStage)
import { describe, expect, test } from 'bun:test';
import { renderToString } from '../vendor/preact-render-to-string.js';
import { renderStage, slideOf, slideView } from '../client/editor/render.js';

const photo = (id, hash) => ({ op: 'photo', id, photo: hash, m: [0.5, 0, 0, 0.5, 100, 100], crop: undefined });
const stroke = id => ({ op: 'stroke', id, pts: [[0, 0, 1], [20, 30, 1], [40, 20, 1], [60, 80, 1], [80, 40, 1], [100, 100, 1]], color: '#ff0000', smooth: false });
const doc = {
  v: 1,
  mode: 'slides',
  style: {},
  pages: [
    { id: 'pageA', steps: [photo('pa1', 'a'.repeat(64)), stroke('s1'), stroke('s2'), photo('pa2', 'b'.repeat(64)), stroke('s3')] },
    { id: 'pageB', steps: [photo('pb1', 'c'.repeat(64))] },
  ],
};

describe('slides', () => {
  test('a drawing belongs to the photo before it', () => {
    expect(slideOf(doc, 0).owned.map(s => s.id)).toEqual(['s1', 's2']);
    expect(slideOf(doc, 1).owned.map(s => s.id)).toEqual(['s3']);
    expect(slideOf(doc, 2).owned).toEqual([]);
    expect(slideOf(doc, 3)).toBeNull();
  });

  test('a new drawing goes after the last one of its slide', () => {
    expect(slideOf(doc, 0)).toMatchObject({ page: 0, at: 0, insertAt: 3 });
    expect(slideOf(doc, 2)).toMatchObject({ page: 1, at: 0, insertAt: 1 });
  });

  test('the editor view holds the drawings alone on the page, all ids still there', () => {
    const view = slideView(doc, slideOf(doc, 0));
    const ids = view.pages.flatMap(p => p.steps.map(s => s.id));

    expect(view.mode).toBe('free');
    expect(view.pages[0].id).toBe('pageA');
    expect(view.pages[0].steps.map(s => s.id)).toEqual(['s1', 's2']);
    expect([...ids].sort()).toEqual(['pa1', 'pa2', 'pb1', 's1', 's2', 's3']);
  });

  test('the slide shows its photo and its drawings, not the others', () => {
    const photos = hash => ({ hash, ext: 'jpg', width: 100, height: 100 });
    const svg = renderToString(renderStage(doc, { photos, page: 0 }));

    expect(svg).toContain('#ff0000');
    expect(svg.split('<image').length - 1).toBe(1);
    expect(renderToString(renderStage(doc, { photos, page: 2 }))).not.toContain('#ff0000');
  });
});
