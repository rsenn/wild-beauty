// bun test: wand geometry and the NDJSON reader (E119)
import { expect, test } from 'bun:test';
import { photoPoint, readLines, resultPolygon, stagePolygon } from '../client/editor/wand.js';

const corners = [[100, 100], [300, 100], [300, 200], [100, 200]];

test('photoPoint maps a stage point into 0..1 and refuses outside', () => {
  expect(photoPoint(corners, [200, 150])).toEqual([0.5, 0.5]);
  expect(photoPoint(corners, [50, 150])).toBeNull();
  expect(photoPoint([[0, 0], [0, 0], [0, 0], [0, 0]], [0, 0])).toBeNull();
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

test('readLines splits chunks into objects and skips garbage', async () => {
  const body = new Response('{"a":1}\nnot json\n{"b"').body;
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"a":1}\nnot js')); c.enqueue(new TextEncoder().encode('on\n{"b":2}')); c.close(); } });
  const got = [];

  await readLines(stream, o => got.push(o));
  expect(got).toEqual([{ a: 1 }, { b: 2 }]);
  void body;
});
