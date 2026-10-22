// bun test: client/editor/shapetool.js and model.updateShape (E60)
import { describe, expect, test } from 'bun:test';
import { emptyDraft, preview, press, pull, shapeStep, undoVertex } from '../../client/editor/shapetool.js';
import { emptyNode, updateShape, validate } from '../../client/editor/model.js';
import { verticesFromPath } from '../../client/editor/shapes.js';

const add = (d, p) => press(d, p).draft;

describe('shape tool', () => {
  test('clicks add vertices; a click near the first closes, but not with fewer than three', () => {
    let d = add(emptyDraft(), [100, 100]);

    expect(press(d, [101, 101]).closed).toBe(false); // two vertices: still open
    d = add(add(add(emptyDraft(), [100, 100]), [300, 100]), [200, 300]);

    const closing = press(d, [104, 98], { near: 12 });

    expect(closing.closed).toBe(true);
    expect(closing.draft.vertices.length).toBe(3);
    expect(press(d, [150, 150]).closed).toBe(false);
  });

  test('dragging pulls a symmetric handle, Alt breaks the symmetry', () => {
    let d = add(emptyDraft(), [100, 100]);
    const sym = pull(d, [160, 120]);

    expect(sym.vertices[0].hout).toEqual([60, 20]);
    expect(sym.vertices[0].hin).toEqual([-60, -20]);

    const alt = pull(pull(d, [160, 120]), [100, 180], { alt: true });

    expect(alt.vertices[0].broken).toBe(true);
    expect(alt.vertices[0].hout).toEqual([0, 80]);
    expect(alt.vertices[0].hin).toEqual([-60, -20]); // stays
    expect(pull(d, [100.2, 100.2])).toBe(d); // a click is not a drag
  });

  test('undoVertex and the step', () => {
    let d = add(add(emptyDraft(), [0, 0]), [100, 0]);

    expect(shapeStep(d, 'shape001', { color: '#ff0000' })).toMatchObject({ op: 'shape', closed: false, stroke: '#ff0000' });
    expect(shapeStep(d, 'shape001', { color: '#ff0000' }).fill).toBeUndefined();
    expect(shapeStep(undoVertex(d), 'shape001', { color: '#ff0000' })).toBe(null);
    d = { ...add(d, [50, 80]), closed: true };

    const step = shapeStep(d, 'shape001', { color: '#ff0000', width: 6 });

    expect(step).toMatchObject({ closed: true, fill: '#ff0000', strokeWidth: 6 });
    expect(step.path.endsWith('Z')).toBe(true);
  });

  test('a heart with curves round-trips through its path and validates', () => {
    let d = emptyDraft();

    for(const [p, drag] of [[[500, 850], null], [[200, 400], [200, 150]], [[500, 330], [560, 330]], [[800, 400], [800, 650]]]) {
      d = add(d, p);
      if(drag) d = pull(d, drag);
    }

    const step = shapeStep({ ...d, closed: true }, 'shape001', { color: '#cc2244' });

    expect(step.path).toContain('C');

    const back = verticesFromPath(step.path);

    expect(back.closed).toBe(true);
    expect(back.vertices.length).toBe(4);
    expect(preview(d).handles.length).toBeGreaterThan(0);

    const doc = { ...emptyNode() };

    doc.pages = [{ ...doc.pages[0], steps: [step] }];
    expect(validate(doc)).toEqual([]);
  });
});

describe('updateShape', () => {
  const step = { op: 'shape', id: 'shape001', path: 'M0 0L100 0L50 80Z', closed: true, fill: '#ff0000', stroke: '#000000', strokeWidth: 4 };
  const doc = { ...emptyNode(), pages: [{ id: 'page0001', steps: [step] }] };
  const get = d => d.pages[0].steps[0];

  test('fill and stroke on and off', () => {
    expect('fill' in get(updateShape(doc, 'shape001', { fill: null }))).toBe(false);
    expect(get(updateShape(doc, 'shape001', { stroke: null })).fill).toBe('#ff0000');
    expect(get(updateShape(updateShape(doc, 'shape001', { fill: null }), 'shape001', { fill: '#00ff00' })).fill).toBe('#00ff00');
    expect(updateShape(doc, 'shape001', { fill: 'not a colour' })).toBe(doc);
  });

  test('open and close keep the vertices', () => {
    const open = updateShape(doc, 'shape001', { closed: false });

    expect(get(open).closed).toBe(false);
    expect(get(open).path.includes('Z')).toBe(false);
    expect(verticesFromPath(get(open).path).vertices.length).toBe(3);
    expect(get(updateShape(open, 'shape001', { closed: true })).path.endsWith('Z')).toBe(true);
    expect(validate(open)).toEqual([]);
    expect(updateShape(doc, 'nothing1', { fill: null })).toBe(doc);
  });
});
