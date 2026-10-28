// bun test: clips with several outlines (E122)
import { describe, expect, test } from 'bun:test';
import { apply } from '../client/editor/commands.js';
import { emptyNode, findStep } from '../client/editor/model.js';
import { outlineCount, pathFromPolygons, polygonsFromPath, windingAt, wound } from '../client/editor/multiclip.js';
import { area } from '../client/editor/polygon.js';

const HASH = 'a'.repeat(64);
const sq = (x, y, s) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];

// a document with one photo clipped by `polygon`
function start(polygon) {
  let snap = { doc: emptyNode(), kind: 'node' };
  const page = snap.doc.pages[0].id;

  snap = apply(snap, { type: 'addPhoto', hash: HASH, info: {}, id: 'photo001', page }).snap;

  return apply(snap, { type: 'clipPolygon', id: 'photo001', polygon, shape: 'shape001', style: {} }).snap;
}

const clipPath = snap => findStep(snap.doc, 'shape001').step.path;

describe('paths', () => {
  test('polygons survive a round trip', () => {
    const polys = [sq(0, 0, 10), sq(20, 20, 5)];

    expect(polygonsFromPath(pathFromPolygons(polys))).toEqual(polys);
    expect(polygonsFromPath('M0 0C1 1 2 2 3 3Z')).toEqual([]);
  });

  test('wound sets the direction', () => {
    expect(area(wound(sq(0, 0, 10), true))).toBeGreaterThan(0);
    expect(area(wound(sq(0, 0, 10), false))).toBeLessThan(0);
  });

  test('winding is 1 inside an added outline, 0 in a hole, 0 outside', () => {
    const polys = [wound(sq(0, 0, 100), true), wound(sq(40, 40, 20), false)];

    expect(windingAt(polys, [10, 10])).toBe(1);
    expect(windingAt(polys, [50, 50])).toBe(0);
    expect(windingAt(polys, [200, 200])).toBe(0);
  });
});

describe('add, subtract and split', () => {
  test('add appends an outline wound like the first', () => {
    const snap = apply(start(sq(0, 0, 100)), { type: 'clipOutline', id: 'photo001', polygon: sq(200, 0, 100), mode: 'add', shape: 'shape002', style: {} }).snap;
    const polys = polygonsFromPath(clipPath(snap));

    expect(polys).toHaveLength(2);
    expect(polys.every(p => area(p) > 0)).toBe(true);
    expect(outlineCount(snap.doc, 'photo001')).toBe(2);
  });

  test('subtract adds a hole inside, and does nothing outside', () => {
    const base = start(sq(0, 0, 100));
    const hole = apply(base, { type: 'clipOutline', id: 'photo001', polygon: sq(40, 40, 20), mode: 'subtract', shape: 'shape002', style: {} }).snap;
    const outside = apply(base, { type: 'clipOutline', id: 'photo001', polygon: sq(500, 500, 20), mode: 'subtract', shape: 'shape002', style: {} }).snap;

    expect(polygonsFromPath(clipPath(hole)).map(p => Math.sign(area(p)))).toEqual([1, -1]);
    expect(clipPath(outside)).toBe(clipPath(base));
  });

  test('replace falls back to the normal clip', () => {
    const snap = apply(start(sq(0, 0, 100)), { type: 'clipOutline', id: 'photo001', polygon: sq(10, 10, 30), mode: 'replace', shape: 'shape002', style: {} }).snap;

    expect(findStep(snap.doc, 'photo001').step.clip).toBe('shape002');
  });

  test('split makes one photo per outline, holes go with their outline', () => {
    let snap = apply(start(sq(0, 0, 100)), { type: 'clipOutline', id: 'photo001', polygon: sq(200, 0, 100), mode: 'add', shape: 'x', style: {} }).snap;

    snap = apply(snap, { type: 'clipOutline', id: 'photo001', polygon: sq(240, 40, 20), mode: 'subtract', shape: 'x', style: {} }).snap;
    snap = apply(snap, { type: 'splitClip', id: 'photo001', ids: ['shape002', 'photo002'] }).snap;

    const photos = snap.doc.pages[0].steps.filter(s => s.op === 'photo');

    expect(photos).toHaveLength(2);
    expect(polygonsFromPath(findStep(snap.doc, photos[0].clip).step.path)).toHaveLength(1);
    expect(polygonsFromPath(findStep(snap.doc, photos[1].clip).step.path)).toHaveLength(2);
  });

  test('split needs enough ids and two outlines', () => {
    const snap = start(sq(0, 0, 100));

    expect(apply(snap, { type: 'splitClip', id: 'photo001', ids: ['a', 'b'] }).snap.doc).toBe(snap.doc);
  });
});

describe('editing the outline in place', () => {
  test('nearestVertex and insertOnEdge', async () => {
    const { nearestVertex, insertOnEdge } = await import('../client/editor/multiclip.js');
    const polys = [sq(0, 0, 100)];

    expect(nearestVertex(polys, [3, 4], 10)).toMatchObject({ poly: 0, vertex: 0 });
    expect(nearestVertex(polys, [50, 50], 10)).toBeNull();

    const added = insertOnEdge(polys, [50, 3], 10);

    expect(added.polys[0]).toHaveLength(5);
    expect(added.polys[0][added.vertex]).toEqual([50, 0]);
    expect(insertOnEdge(polys, [1, 1], 10)).toBeNull(); // near a corner, not an edge insert
  });

  test('moving a vertex rewrites the clip path', () => {
    const snap = start(sq(0, 0, 100));
    const moved = apply(snap, { type: 'setClipPolygons', id: 'photo001', polygon: undefined, polygons: [[[0, 0], [150, 0], [100, 100], [0, 100]]] }).snap;

    expect(polygonsFromPath(clipPath(moved))[0][1]).toEqual([150, 0]);
    expect(apply(snap, { type: 'setClipPolygons', id: 'photo001', polygons: [[[0, 0]]] }).snap.doc).toBe(snap.doc);
  });
});

describe('selection box', () => {
  test('a clipped photo is selected by its visible part', async () => {
    const { outlineOf } = await import('../client/editor/hit.js');
    const snap = start(sq(200, 300, 100));
    const photos = () => ({ width: 1000, height: 1000 });
    const full = outlineOf(snap.doc, 'photo001', { photos });
    const box = outlineOf(snap.doc, 'photo001', { photos, clipped: true });

    expect(full[2]).toEqual([1000, 1000]);
    expect(box[0]).toEqual([200, 300]);
    expect(box[2]).toEqual([300, 400]);
  });
});

describe('visible box', () => {
  test('boxFromAlpha finds the solid part, and a saved cutout validates', async () => {
    const { boxFromAlpha } = await import('../client/editor/alpha.js');
    const { validate, replacePhoto, setBox } = await import('../client/editor/model.js');
    const data = new Uint8Array(10 * 10 * 4);

    for(let y = 2; y < 5; y++) for(let x = 3; x < 8; x++) data[(y * 10 + x) * 4 + 3] = 255;

    expect(boxFromAlpha(data, 10, 10)).toEqual([300, 200, 800, 500]);
    expect(boxFromAlpha(new Uint8Array(400), 10, 10)).toBeNull();

    let doc = start(sq(0, 0, 10)).doc;

    doc = replacePhoto(doc, 'photo001', 'b'.repeat(64));
    doc = setBox(doc, 'photo001', [300, 200, 800, 500]);
    expect(validate(doc)).toEqual([]);
    expect(replacePhoto(doc, 'photo001', 'c'.repeat(64)).pages[0].steps[0].box).toBeUndefined();
  });
});
