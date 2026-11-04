// bun test: wand geometry and the NDJSON reader (E119)
import { expect, test } from 'bun:test';
import { runStale, clampedImagePoint, defaultPick, imagePoint, photoCoords, photoPoint, readLines, regionOf, resultPolygon, selectionPath, stagePolygon } from '../client/editor/tools/wand/wand.js';

const corners = [[100, 100], [300, 100], [300, 200], [100, 200]];

test('photoPoint maps a stage point into 0..1 and refuses outside', () => {
  expect(photoPoint(corners, [200, 150])).toEqual([0.5, 0.5]);
  expect(photoPoint(corners, [50, 150])).toBeNull();
  expect(photoPoint([[0, 0], [0, 0], [0, 0], [0, 0]], [0, 0])).toBeNull();
});

// a 400 x 200 landscape photo is drawn as a 200 x 200 window moved along the long edge by `crop`
test('taps, regions and outlines go through the crop window of a non-square photo', () => {
  const frame = { width: 400, height: 200, crop: 0.5 }; // window x 100..300
  const stage = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]];

  expect(imagePoint(stage, [500, 500], frame)).toEqual([0.5, 0.5]);
  expect(imagePoint(stage, [0, 0], frame)).toEqual([0.25, 0]);
  expect(imagePoint(stage, [1000, 1000], { ...frame, crop: 1 })).toEqual([1, 1]);
  expect(imagePoint(stage, [500, 500])).toEqual([0.5, 0.5]);
  expect(imagePoint(stage, [-5, 500], frame)).toBeNull();

  // a region: the whole window is the middle half of the image, what lies outside clamps
  expect(regionOf(stage, [[[0, 0], [1000, 0], [1000, 1000]]], frame)).toEqual([[[0.25, 0], [0.75, 0], [0.75, 1]]]);

  // an outline in pixels of the 400 x 200 image: x 100..300 is the window
  expect(stagePolygon([[100, 0], [300, 0], [300, 200]], { width: 400, height: 200 }, stage, 0.5)).toEqual([[0, 0], [1000, 0], [1000, 1000]]);
  expect(resultPolygon({ event: 'result', ok: true, output: { width: 400, height: 200 }, outlines: [{ polygon: [[100, 0], [300, 0], [300, 200]] }] }, stage, 0.5)).toEqual([[0, 0], [1000, 0], [1000, 1000]]);
});

test('regionOf maps a manual clip into the photo and clamps what lies outside it', () => {
  expect(photoCoords(corners, [50, 150])).toEqual([-0.25, 0.5]);
  expect(regionOf(corners, [[[100, 100], [200, 100], [200, 150]], [[0, 0], [1, 1]]])).toEqual([[[0, 0], [0.5, 0], [0.5, 0.5]]]);
  expect(regionOf(corners, [[[0, 100], [400, 100], [400, 300]]])).toEqual([[[0, 0], [1, 0], [1, 1]]]);
  expect(regionOf([[0, 0], [0, 0], [0, 0], [0, 0]], [[[0, 0], [1, 0], [1, 1]]])).toBeNull();
  expect(regionOf(corners, null)).toBeNull();
});

test('photoPoint and stagePolygon are inverse, also for a turned photo', () => {
  const turned = [[0, 0], [0, 100], [-50, 100], [-50, 0]];
  const [p] = stagePolygon([[40, 30]], { width: 100, height: 100 }, turned);
  const [u, v] = photoPoint(turned, p);

  expect(u).toBeCloseTo(0.4);
  expect(v).toBeCloseTo(0.3);
});

test('resultPolygon takes the first outline in output pixels', () => {
  const event = { event: 'result', ok: true, output: { width: 10, height: 10 }, outlines: [{ polygon: [[0, 0], [10, 0], [10, 10]] }] };

  expect(resultPolygon(event, corners)).toEqual([[100, 100], [300, 100], [300, 200]]);
  expect(resultPolygon({ ...event, ok: false }, corners)).toBeNull();
  expect(resultPolygon({ event: 'progress' }, corners)).toBeNull();
});

test('resultPolygon returns every object and winds a hole the other way', () => {
  const square = (x, y, n) => [[x, y], [x + n, y], [x + n, y + n], [x, y + n]];
  const event = { event: 'result', ok: true, output: { width: 10, height: 10 }, outlines: [{ polygon: square(0, 0, 4), polygons: [{ polygon: square(0, 0, 4), hole: false }, { polygon: square(6, 6, 3), hole: false }, { polygon: square(1, 1, 1), hole: true }] }] };
  const list = resultPolygon(event, corners);

  expect(list).toHaveLength(3);
  expect(list[0]).toEqual([[100, 100], [180, 100], [180, 140], [100, 140]]);
  // a hole is wound against the objects
  const sign = poly => Math.sign(poly.reduce((s, [x, y], i) => s + x * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * y, 0));

  expect(sign(list[1])).toBe(sign(list[0]));
  expect(sign(list[2])).toBe(-sign(list[0]));

  // one object without a hole stays a plain polygon
  expect(resultPolygon({ ...event, outlines: [{ polygon: square(0, 0, 4), polygons: [{ polygon: square(0, 0, 4), hole: false }] }] }, corners)).toEqual([[100, 100], [180, 100], [180, 140], [100, 140]]);
});

test('the selection of a candidate is one even-odd path in stage units, through the crop window', () => {
  const stage = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]];
  const candidate = { index: 2, polygons: [{ polygon: [[100, 0], [300, 0], [300, 200]], hole: false }, { polygon: [[150, 50], [200, 50], [200, 100]], hole: true }] };

  expect(selectionPath(candidate, { width: 400, height: 200 }, stage, 0.5)).toBe('M0 0L1000 0L1000 1000ZM250 250L500 250L500 500Z');
  expect(selectionPath({ polygons: [] }, { width: 400, height: 200 }, stage, 0.5)).toBeNull();
  expect(selectionPath(candidate, null, stage, 0.5)).toBeNull();
});

test('defaultPick takes the largest candidate that is not the background and never an empty one', () => {
  const c = (index, coverage, n = 1) => ({ index, coverage, polygons: Array.from({ length: n }, () => ({ polygon: [[0, 0], [1, 0], [1, 1]] })) });

  expect(defaultPick([c(0, 0.01), c(1, 0.1), c(2, 0.3)])).toBe(2);
  expect(defaultPick([c(0, 0.01), c(1, 0.1), c(2, 0.9)])).toBe(1);
  expect(defaultPick([c(0, 0.01), c(1, 0.1, 0), c(2, 0.9)])).toBe(0);
  expect(defaultPick([c(0, 0.7), c(1, 0.8), c(2, 0.9)])).toBe(2);
  expect(defaultPick([c(0, 0, 0), c(1, 0, 0), c(2, 0, 0)])).toBeNull();
});

test('readLines splits chunks into objects and skips garbage', async () => {
  const body = new Response('{"a":1}\nnot json\n{"b"').body;
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"a":1}\nnot js')); c.enqueue(new TextEncoder().encode('on\n{"b":2}')); c.close(); } });
  const got = [];

  await readLines(stream, o => got.push(o));
  expect(got).toEqual([{ a: 1 }, { b: 2 }]);
  void body;
});

test('clampedImagePoint keeps a point outside the photo on its edge, and agrees with imagePoint inside', () => {
  const stage = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]];
  const frame = { width: 400, height: 200, crop: 0.5 }; // window x 100..300

  expect(clampedImagePoint(stage, [500, 500], frame)).toEqual(imagePoint(stage, [500, 500], frame));
  expect(clampedImagePoint(stage, [-300, 500], frame)).toEqual([0.25, 0.5]);
  expect(clampedImagePoint(stage, [1500, 1400], frame)).toEqual([0.75, 1]);
  expect(imagePoint(stage, [-300, 500], frame)).toBeNull();
  expect(clampedImagePoint([[0, 0], [0, 0], [0, 0], [0, 0]], [5, 5])).toBeNull();
});

test('runStale: a run ends when an undo took its photo away or swapped its image', () => {
  const at = { step: { photo: 'h1', clip: 'c1' } };

  expect(runStale({ photo: 'h1', clip: 'c1' }, at)).toBe(false);
  expect(runStale({ photo: 'h1', clip: 'c1' }, undefined)).toBe(true); // the photo is gone
  expect(runStale({ photo: 'h0', clip: 'c1' }, at)).toBe(true); // another image (undo of a cut)
  expect(runStale({ photo: 'h1', clip: undefined }, at)).toBe(true); // wand run, the clip changed
  expect(runStale({ photo: 'h1' }, at)).toBe(false); // lasso run: no clip to compare
});
