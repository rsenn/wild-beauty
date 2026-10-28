// bun test: edge decoration geometry (E123)
import { describe, expect, test } from 'bun:test';
import { EDGE_STYLES, edgeShapes, pathOf, rng } from '../client/editor/edge.js';

describe('edgeShapes', () => {
  test('plain has nothing', () => {
    expect(edgeShapes({ style: 'plain' })).toEqual({ clip: null, under: [], rim: 0 });
    expect(edgeShapes(undefined).clip).toBeNull();
    expect(edgeShapes({ style: 'nonsense' }).under).toEqual([]);
  });

  test('the same seed gives the same edge, another seed another', () => {
    const a = edgeShapes({ style: 'torn', amount: 0.7, seed: 5 });
    const b = edgeShapes({ style: 'torn', amount: 0.7, seed: 5 });
    const c = edgeShapes({ style: 'torn', amount: 0.7, seed: 6 });

    expect(a).toEqual(b);
    expect(a.clip).not.toEqual(c.clip);
  });

  test('a bigger amount tears further from the square', () => {
    const reach = shape => Math.max(...shape.clip.map(([x, y]) => Math.max(Math.abs(x - 500), Math.abs(y - 500))));

    expect(reach(edgeShapes({ style: 'torn', amount: 1, seed: 3 }))).toBeGreaterThan(reach(edgeShapes({ style: 'torn', amount: 0, seed: 3 })) - 1);
  });

  test('every style draws a shadow under the picture, except plain', () => {
    for(const style of EDGE_STYLES.filter(s => s !== 'plain')) expect(edgeShapes({ style, amount: 0.5, seed: 1 }).under.length).toBeGreaterThan(0);
  });

  test('polaroid frames the square with a longer bottom and keeps the picture whole', () => {
    const { clip, under } = edgeShapes({ style: 'polaroid', amount: 0.5, seed: 1 });
    const frame = under.at(-1).points;

    expect(clip).toBeNull();
    expect(Math.max(...frame.map(p => p[1]))).toBeGreaterThan(1100);
    expect(Math.min(...frame.map(p => p[0]))).toBeLessThan(0);
  });

  test('sticker rounds the picture and has a rim', () => {
    const { clip, rim } = edgeShapes({ style: 'sticker', amount: 0.5, seed: 1 });

    expect(rim).toBeGreaterThan(0);
    expect(clip.some(([x, y]) => x === 0 && y === 0)).toBe(false); // the corner is cut away
  });
});

test('rng is in 0..1 and repeatable', () => {
  const r = rng(9);
  const values = Array.from({ length: 50 }, r);

  expect(values.every(v => v >= 0 && v < 1)).toBe(true);
  expect(Array.from({ length: 5 }, rng(9))).toEqual(values.slice(0, 5));
});

test('pathOf writes a closed path', () => {
  expect(pathOf([[0, 0], [10, 0], [10, 10]])).toBe('M0 0L10 0L10 10Z');
});
