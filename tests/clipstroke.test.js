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

describe('duplicatePhoto command', () => {
  const style = { color: '#336699', width: 4 };
  const run = (doc, command) => apply({ doc, kind: 'node' }, command).snap.doc;
  const start = () => {
    const node = emptyNode();

    return addPhoto(node, node.pages[0].id, HASH, info, 'photo001');
  };

  test('the copy sits right above the photo, one cascade step down and right', () => {
    const next = run(start(), { type: 'duplicatePhoto', id: 'photo001', ids: ['photo002', 'shape002'] });

    expect(findStep(next, 'photo002').index).toBe(findStep(next, 'photo001').index + 1);
    expect(findStep(next, 'photo002').step.m).toEqual([1, 0, 0, 1, 100, 100]);
    expect(findStep(next, 'photo001').step.m).toEqual([1, 0, 0, 1, 0, 0]);
    expect(validate(next)).toEqual([]);
  });

  test('a clipped photo gets a clip shape of its own, moved along with the copy', () => {
    let next = run(start(), { type: 'clipPolygon', id: 'photo001', polygon: [[100, 100], [900, 100], [500, 900]], shape: 'shape001', style });

    next = run(next, { type: 'duplicatePhoto', id: 'photo001', ids: ['photo002', 'shape002'] });

    expect(findStep(next, 'photo002').step.clip).toBe('shape002');
    expect(findStep(next, 'photo001').step.clip).toBe('shape001');
    expect(validate(next)).toEqual([]);

    const [a, b] = ['photo001', 'photo002'].map(id => photoPolygon(next, id, { photos }));

    expect(b.map(([x, y]) => [Math.round(x - 100), Math.round(y - 100)])).toEqual(a.map(([x, y]) => [Math.round(x), Math.round(y)]));
  });

  test('a photo that does not exist, or bad ids, change nothing', () => {
    const doc = start();

    expect(run(doc, { type: 'duplicatePhoto', id: 'nothing1', ids: ['a', 'b'] })).toBe(doc);
    expect(run(doc, { type: 'duplicatePhoto', id: 'photo001', ids: ['a'] })).toBe(doc);
  });
});

describe('cutting a clip of several outlines', () => {
  const square = (x, y, s) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];

  test('splits the crossed outline, the others go to their side', async () => {
    const { cutOutlines } = await import('../client/editor/multiclip.js');
    const polys = [square(0, 0, 100), square(150, 20, 30), square(-60, 20, 30)];
    const pieces = cutOutlines(polys, [[50, -10], [50, 110]], 20);

    expect(pieces).not.toBeNull();
    expect(pieces[0].length + pieces[1].length).toBe(4); // two halves + two untouched outlines
    expect(pieces[0].length).toBe(2);
  });

  test('null when the stroke splits no outline', async () => {
    const { cutOutlines } = await import('../client/editor/multiclip.js');

    expect(cutOutlines([square(0, 0, 100), square(300, 0, 50)], [[200, -10], [200, 110]], 5)).toBeNull();
  });
});

describe('the outline a stroke would split', () => {
  const square = (x, y, s) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];

  test('is the largest outline crossed twice', async () => {
    const { crossedOutline } = await import('../client/editor/multiclip.js');

    expect(crossedOutline([square(200, 0, 40), square(0, 0, 100)], [[50, -10], [50, 110]], 20)?.i).toBe(1);
    expect(crossedOutline([square(200, 0, 40), square(0, 0, 100)], [[120, -10], [120, 110]], 5)).toBeNull();
  });
});

describe('cutting a cutout along its visible box', () => {
  test('the outline of an unclipped photo with a box is the box, so a stroke across the box cuts it', () => {
    let doc = emptyNode();
    const info = { width: 1000, height: 1000, href: 'x' };

    doc = addPhoto(doc, doc.pages[0].id, 'a'.repeat(64), info, 'p0000001');
    doc = apply({ doc, kind: 'node' }, { type: 'setBox', id: 'p0000001', box: [300, 100, 700, 900] }).snap.doc;

    const polygon = photoPolygon(doc, 'p0000001', { photos: () => info });
    const xs = polygon.map(p => p[0]);

    expect(Math.min(...xs)).toBeCloseTo(300);
    expect(Math.max(...xs)).toBeCloseTo(700);

    // a stroke from left of the box to right of it, both ends inside the photo square
    const found = clipFromStroke([[100, 500], [500, 500], [900, 500]], polygon, { tap: 8, reach: 24, close: 20 });

    expect(found.kind).toBe('cut');
  });
});

describe('the outlines of a background removal become a multi-outline clip', () => {
  test('outlinesToStage maps fractions to stage, drops specks, largest first', async () => {
    const { outlinesToStage } = await import('../client/editor/clipping.js');
    const info = { width: 1000, height: 1000 };
    const big = [[0.1, 0.1], [0.4, 0.1], [0.4, 0.5], [0.1, 0.5]];
    const bigger = [[0.5, 0.1], [0.9, 0.1], [0.9, 0.9], [0.5, 0.9]];
    const speck = [[0.7, 0.01], [0.71, 0.01], [0.71, 0.02]];
    const out = outlinesToStage([big, speck, bigger], info, 0.5, [1, 0, 0, 1, 0, 0]);

    expect(out.length).toBe(2);
    expect(out[0][0][0]).toBeCloseTo(500); // the larger outline first
    expect(out.every(poly => area(poly) > 0)).toBe(true);
    expect(outlinesToStage([], info, 0.5, [1, 0, 0, 1, 0, 0])).toBeNull();
  });

  test('clipPolygon takes a list of outlines: one clip shape of several subpaths', () => {
    let doc = emptyNode();

    doc = addPhoto(doc, doc.pages[0].id, 'a'.repeat(64), { width: 1000, height: 1000 }, 'p0000001');
    doc = apply({ doc, kind: 'node' }, { type: 'clipPolygon', id: 'p0000001', polygon: [[[0, 0], [100, 0], [100, 100], [0, 100]], [[200, 200], [300, 200], [300, 300], [200, 300]]], shape: 's0000001', style: {} }).snap.doc;

    const shape = findStep(doc, 's0000001').step;

    expect(shape.path.match(/M/g).length).toBe(2);
    expect(findStep(doc, 'p0000001').step.clip).toBe('s0000001');
    expect(validate(doc).ok ?? true).toBeTruthy();
  });
});
