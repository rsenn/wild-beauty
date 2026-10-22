// bun test: client/editor/vertexedit.js and model.setVertices (E61)
import { describe, expect, test } from 'bun:test';
import { breakVertex, drag, geometry, hitVertex, joinVertex, removeVertex, verticesOf } from '../../client/editor/vertexedit.js';
import { emptyNode, setVertices, validate } from '../../client/editor/model.js';
import { pathFromVertices } from '../../client/editor/shapes.js';

const I = [1, 0, 0, 1, 0, 0];
const vertices = [{ x: 100, y: 100, hout: [40, 0], hin: [-40, 0] }, { x: 400, y: 100 }, { x: 250, y: 400 }];
const step = { op: 'shape', id: 'shape001', path: pathFromVertices(vertices, true), closed: true, fill: '#ff0000', strokeWidth: 2 };
const doc = { ...emptyNode(), pages: [{ id: 'page0001', steps: [step] }] };

describe('vertex hit and drag', () => {
  const parsed = verticesOf(step);
  const geo = geometry(parsed, I);

  test('handles and vertices are found, handles first', () => {
    expect(hitVertex(geo, [102, 101], 10)).toEqual({ kind: 'vertex', index: 0 });
    expect(hitVertex(geo, [140, 100], 10)).toEqual({ kind: 'hout', index: 0 });
    expect(hitVertex(geo, [60, 100], 10)).toEqual({ kind: 'hin', index: 0 });
    expect(hitVertex(geo, [700, 700], 10)).toBe(null);
  });

  test('geometry follows the matrix, a hit is in stage space', () => {
    const m = [2, 0, 0, 2, 10, 0];
    const g = geometry(parsed, m);

    expect(g[0].p).toEqual([210, 200]);
    expect(hitVertex(g, [210, 200], 5)).toEqual({ kind: 'vertex', index: 0 });
  });

  test('moving a vertex keeps its handles', () => {
    const moved = drag(parsed.vertices, { kind: 'vertex', index: 0 }, I, [100, 100], [160, 130]);

    expect([moved[0].x, moved[0].y]).toEqual([160, 130]);
    expect(moved[0].hout).toEqual([40, 0]);
    expect(moved[0].hin).toEqual([-40, 0]);
    expect(moved[1]).toEqual(parsed.vertices[1]);
  });

  test('moving through a scaled matrix moves by the same stage distance', () => {
    const m = [2, 0, 0, 2, 0, 0];
    const moved = drag(parsed.vertices, { kind: 'vertex', index: 1 }, m, [800, 200], [900, 260], {});

    expect([moved[1].x, moved[1].y]).toEqual([450, 130]);
  });

  test('a handle mirrors, Alt breaks the symmetry', () => {
    const sym = drag(parsed.vertices, { kind: 'hout', index: 0 }, I, [140, 100], [150, 150]);

    expect(sym[0].hout).toEqual([50, 50]);
    expect(sym[0].hin).toEqual([-50, -50]);

    const alt = drag(parsed.vertices, { kind: 'hout', index: 0 }, I, [140, 100], [150, 150], { alt: true });

    expect(alt[0].broken).toBe(true);
    expect(alt[0].hout).toEqual([50, 50]);
    expect(alt[0].hin).toEqual([-40, 0]);
  });

  test('break and join', () => {
    const broken = breakVertex(parsed.vertices, 0);

    expect(broken[0].broken).toBe(true);
    expect(joinVertex(broken, 0)[0].broken).toBeUndefined();
  });

  test('delete needs three left for a closed shape, two for an open one', () => {
    expect(removeVertex(parsed.vertices, 0, true)).toBe(null);
    expect(removeVertex([...parsed.vertices, { x: 5, y: 5 }], 3, true).length).toBe(3);
    expect(removeVertex(parsed.vertices.slice(0, 2), 0, false)).toBe(null);
    expect(removeVertex(parsed.vertices, 0, false).length).toBe(2);
    expect(removeVertex(parsed.vertices, 9, false)).toBe(null);
  });
});

describe('setVertices', () => {
  const get = d => d.pages[0].steps[0];

  test('the path follows and the document stays valid', () => {
    const next = setVertices(doc, 'shape001', drag(verticesOf(step).vertices, { kind: 'vertex', index: 2 }, I, [250, 400], [300, 500]));

    expect(get(next).path).not.toBe(step.path);
    expect(get(next).path.endsWith('Z')).toBe(true);
    expect(validate(next)).toEqual([]);
    expect(verticesOf(get(next)).vertices[2]).toMatchObject({ x: 300, y: 500 });
  });

  test('bad input changes nothing', () => {
    expect(setVertices(doc, 'shape001', vertices.slice(0, 2))).toBe(doc); // closed needs three
    expect(setVertices(doc, 'shape001', [...vertices.slice(0, 2), { x: NaN, y: 0 }])).toBe(doc);
    expect(setVertices(doc, 'nothing1', vertices)).toBe(doc);
    expect(setVertices(doc, 'shape001', 'x')).toBe(doc);
  });
});
