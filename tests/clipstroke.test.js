// bun test: what a clip-tool stroke means, and the document changes it makes (E114, E121)
import { describe, expect, test } from 'bun:test';
import { apply } from '../client/editor/commands.js';
import { clipFromStroke, simplify, turning } from '../client/editor/clipstroke.js';
import { area } from '../client/editor/polygon.js';
import { addPhoto, emptyNode, findStep, validate } from '../client/editor/model.js';
import { photoPolygon } from '../client/editor/clipping.js';

const HASH = 'a'.repeat(64);
const info = { width: 400, height: 400 };
const photos = () => info;
const square = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]];
const dist = { tap: 12, reach: 60, close: 30 };

// a circle of n points around (cx, cy)
const circle = (cx, cy, r, n = 24, turns = 1) => Array.from({ length: Math.round(n * turns) + 1 }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);

describe('simplify and turning', () => {
  test('a straight line of many points keeps two corners', () => {
    const line = Array.from({ length: 50 }, (_, i) => [i * 10, i * 5]);

    expect(simplify(line, 1)).toHaveLength(2);
  });

  test('a circle turns about 360 degrees, a line none', () => {
    expect(Math.abs(turning(circle(0, 0, 100)))).toBeGreaterThan(330);
    expect(turning([[0, 0], [10, 0], [20, 0]])).toBe(0);
  });
});

describe('clipFromStroke', () => {
  test('a stroke that hardly moved is a tap', () => {
    expect(clipFromStroke([[100, 100], [102, 101]], square, dist).kind).toBe('tap');
    expect(clipFromStroke([[100, 100]], square, dist).kind).toBe('tap');
  });

  test('a loop that comes back to its start is a closed outline', () => {
    const r = clipFromStroke(circle(500, 500, 200), square, dist);

    expect(r.kind).toBe('closed');
    expect(Math.abs(area(r.polygon))).toBeGreaterThan(100000);
  });

  test('a loop that stops short of its start is not closed', () => {
    expect(clipFromStroke(circle(500, 500, 200, 24, 0.6), square, dist).kind).not.toBe('closed');
  });

  test('a stroke from edge to edge cuts', () => {
    const r = clipFromStroke([[500, -20], [500, 400], [500, 1020]], square, dist);

    expect(r.kind).toBe('cut');
    expect(r.pieces).toHaveLength(2);
  });

  test('the two pieces of a cut share every point of the cut line', () => {
    const r = clipFromStroke([[500, -20], [505, 200], [498, 400], [502, 700], [500, 1020]], square, dist);
    const key = ([x, y]) => `${x},${y}`;
    const [a, b] = r.pieces.map(p => new Set(p.map(key)));
    const shared = [...a].filter(k => b.has(k));

    expect(r.kind).toBe('cut');
    // the cut line has its own corners plus the two crossings, all in both pieces
    expect(shared.length).toBeGreaterThanOrEqual(3);
  });

  test('a stroke wholly inside, tending to the border, cuts (a photo that fills the stage)', () => {
    const r = clipFromStroke([[500, 30], [500, 500], [500, 970]], square, dist);

    expect(r.kind).toBe('cut');
    expect(r.pieces.map(p => Math.round(Math.abs(area(p)))).sort()).toEqual([500000, 500000]);
  });

  test('a stroke that ends in the middle is nothing', () => {
    expect(clipFromStroke([[500, 30], [500, 400]], square, dist).kind).toBe('none');
  });

  test('without a known outline a crossing stroke is nothing', () => {
    expect(clipFromStroke([[500, -20], [500, 1020]], null, dist).kind).toBe('none');
  });
});

describe('clipPolygon and cutPhoto commands', () => {
  const start = () => {
    const node = emptyNode();
    const doc = addPhoto(node, node.pages[0].id, HASH, info, 'photo001');

    return { doc, page: doc.pages[0].id };
  };
  const run = (doc, command) => apply({ doc, kind: 'node' }, command).snap.doc;
  const style = { color: '#336699', width: 4 };

  test('photoPolygon of a fresh photo is its stage square', () => {
    const { doc } = start();

    expect(photoPolygon(doc, 'photo001', { photos })).toEqual(square);
  });

  test('clipPolygon adds a shape and clips the photo with it', () => {
    const { doc } = start();
    const next = run(doc, { type: 'clipPolygon', id: 'photo001', polygon: [[100, 100], [900, 100], [500, 900]], shape: 'shape001', style });
    const photo = findStep(next, 'photo001').step;

    expect(photo.clip).toBe('shape001');
    expect(findStep(next, 'shape001').step).toMatchObject({ op: 'shape', closed: true });
    expect(validate(next)).toEqual([]);
    expect(photoPolygon(next, 'photo001', { photos })).toHaveLength(3);
  });

  test('clipping again replaces the clip and drops the shape that nobody uses', () => {
    const { doc } = start();
    let next = run(doc, { type: 'clipPolygon', id: 'photo001', polygon: [[100, 100], [900, 100], [500, 900]], shape: 'shape001', style });

    next = run(next, { type: 'clipPolygon', id: 'photo001', polygon: [[0, 0], [500, 0], [500, 500], [0, 500]], shape: 'shape002', style });

    expect(findStep(next, 'photo001').step.clip).toBe('shape002');
    expect(findStep(next, 'shape001')).toBeFalsy();
    expect(validate(next)).toEqual([]);
  });

  test('cutPhoto makes a copy; each photo keeps one side', () => {
    const { doc } = start();
    const left = [[0, 0], [500, 0], [500, 1000], [0, 1000]];
    const right = [[500, 0], [1000, 0], [1000, 1000], [500, 1000]];
    const next = run(doc, { type: 'cutPhoto', id: 'photo001', pieces: [left, right], ids: ['shapeaaa', 'shapebbb', 'photo002'], style });

    expect(validate(next)).toEqual([]);
    expect(findStep(next, 'photo001').step.clip).toBe('shapeaaa');
    expect(findStep(next, 'photo002').step).toMatchObject({ op: 'photo', photo: HASH, clip: 'shapebbb' });
    expect(findStep(next, 'photo002').index).toBe(findStep(next, 'photo001').index + 1);
    expect(Math.abs(area(photoPolygon(next, 'photo001', { photos })))).toBe(500000);
    expect(Math.abs(area(photoPolygon(next, 'photo002', { photos })))).toBe(500000);
  });

  test('cutting an already clipped photo cuts its clip, and the old clip shape goes', () => {
    const { doc } = start();
    let next = run(doc, { type: 'clipPolygon', id: 'photo001', polygon: [[0, 0], [800, 0], [800, 800], [0, 800]], shape: 'shape001', style });
    const cut = clipFromStroke([[400, -20], [400, 400], [400, 900]], photoPolygon(next, 'photo001', { photos }), dist);

    expect(cut.kind).toBe('cut');

    next = run(next, { type: 'cutPhoto', id: 'photo001', pieces: cut.pieces, ids: ['shapeaaa', 'shapebbb', 'photo002'], style });

    expect(findStep(next, 'shape001')).toBeFalsy();
    expect(validate(next)).toEqual([]);

    const [a, b] = ['photo001', 'photo002'].map(id => Math.abs(area(photoPolygon(next, id, { photos }))));

    expect(a + b).toBeCloseTo(640000, -2);
  });

  test('bad input changes nothing', () => {
    const { doc } = start();

    expect(run(doc, { type: 'cutPhoto', id: 'nothing1', pieces: [[], []], ids: ['a', 'b', 'c'], style })).toBe(doc);
    expect(run(doc, { type: 'clipPolygon', id: 'photo001', polygon: [[0, 0]], shape: 'shape001', style })).toBe(doc);
  });
});
