// bun test: text boxes - wrapping, the model, rendering and picking (E88-E93)
import { describe, expect, test } from 'bun:test';
import { renderToString } from '../vendor/preact-render-to-string.js';
import { addText, emptyNode, findStep, updateText, validate } from '../client/editor/model.js';
import { renderText } from '../client/editor/render.js';
import { hitTest, outlineOf } from '../client/editor/hit.js';
import { FONTS, LINE_HEIGHT, boxHeight, firstBaseline, layout, wrap } from '../client/editor/text.js';

const measure = text => text.length * 10; // every character is 10 units wide
const page = doc => doc.pages[0].id;

describe('wrap', () => {
  test('breaks at spaces and keeps newlines', () => {
    expect(wrap('aaa bbb ccc', measure, 70)).toEqual(['aaa bbb', 'ccc']);
    expect(wrap('ab\ncd', measure, 100)).toEqual(['ab', 'cd']);
    expect(wrap('', measure, 100)).toEqual(['']);
  });

  test('breaks a word that is wider than the line by characters', () => {
    expect(wrap('abcdefgh', measure, 30)).toEqual(['abc', 'def', 'gh']);
  });
});

test('layout gives the lines and the height they need', () => {
  const { lines, h } = layout({ text: 'aaa bbb', w: 50, size: 20, padding: 0 }, measure);

  expect(lines).toEqual(['aaa', 'bbb']);
  expect(h).toBe(boxHeight(2, 20, 0));
});

describe('model', () => {

  test('addText makes a valid box with defaults', () => {
    const base = emptyNode();
    const next = addText(base, page(base), { id: 'text0001', text: 'Hi', lines: ['Hi'], w: 300, h: 60, size: 48 });
    const step = findStep(next, 'text0001').step;

    expect(step).toMatchObject({ op: 'text', text: 'Hi', font: 'sans', size: 48, align: 'start' });
    expect(validate(next)).toEqual([]);
  });

  test('updateText keeps only checked fields', () => {
    const base = emptyNode();
    const next = addText(base, page(base), { id: 'text0001', text: 'Hi' });
    const changed = updateText(next, 'text0001', { size: 9999, font: 'comic', align: 'end', bold: true, outline: { color: '#ffffff', width: 6 }, evil: 1 });
    const step = findStep(changed, 'text0001').step;

    expect(step.size).toBe(400);
    expect(step.font).toBe('sans');
    expect(step.align).toBe('end');
    expect(step.bold).toBe(true);
    expect(step.outline).toEqual({ color: '#ffffff', width: 6 });
    expect(step.evil).toBeUndefined();
    expect(updateText(changed, 'text0001', { outline: null }).pages[0].steps[0].outline).toBeNull();
  });

  test('validate rejects an unknown font and a size out of range', () => {
    const base = emptyNode();
    const next = addText(base, page(base), { id: 'text0001', text: 'Hi' });
    const withStep = over => ({ ...next, pages: [{ ...next.pages[0], steps: [{ ...next.pages[0].steps[0], ...over }] }] });

    expect(validate(withStep({ font: 'comic' })).map(e => e.path)).toContain('pages[0].steps[0].font');
    expect(validate(withStep({ size: 2 })).map(e => e.path)).toContain('pages[0].steps[0].size');
  });
});

describe('render and picking', () => {
  const step = { op: 'text', id: 'text0001', text: 'Hi', lines: ['Hi', 'there'], m: [1, 0, 0, 1, 100, 200], w: 300, h: 120, font: 'sans', size: 48, color: '#112233', align: 'center', padding: 0, radius: 0, bold: true, outline: { color: '#ffffff', width: 6 } };

  test('renders one tspan per line with outline and bold', () => {
    const out = renderToString(renderText(step));

    expect(out).toContain('<tspan');
    // the outline is a layer of its own under the letters, so a colour emoji still shows
    expect(out.match(/<tspan/g)).toHaveLength(4);
    expect(out.match(/<text /g)).toHaveLength(2);
    expect(out.match(/stroke=/g)).toHaveLength(1);
    expect(out).toContain('font-weight="700"');
    expect(out).toContain('stroke="#ffffff"');
    expect(out).toContain('text-anchor="middle"');
    expect(out).not.toContain('foreignObject');
  });

  test('a tap inside the box hits it and its outline is the turned rectangle', () => {
    const doc = { ...emptyNode(), pages: [{ id: 'p', steps: [step] }] };

    expect(hitTest(doc, [150, 250])).toBe('text0001');
    expect(hitTest(doc, [50, 50])).toBeNull();
    expect(outlineOf(doc, 'text0001')).toEqual([[100, 200], [400, 200], [400, 320], [100, 320]]);
  });
});

describe('resizing a box', () => {
  test('one command changes the width, the lines and the place', async () => {
    const { apply } = await import('../client/editor/commands.js');
    const { emptyNode, findStep } = await import('../client/editor/model.js');
    let snap = { doc: emptyNode(), kind: 'node' };
    const page = snap.doc.pages[0].id;

    snap = apply(snap, { type: 'addText', id: 'text0001', page, text: 'one two three', lines: ['one two three'], m: [1, 0, 0, 1, 100, 50], w: 600, h: 58, font: 'sans', size: 48, color: '#000000', align: 'start' }).snap;

    const r = apply(snap, { type: 'resizeText', id: 'text0001', patch: { w: 300, lines: ['one two', 'three'], h: 115 }, m: [1, 0, 0, 1, 400, 50] });
    const step = findStep(r.snap.doc, 'text0001').step;

    expect(step).toMatchObject({ w: 300, h: 115, lines: ['one two', 'three'] });
    expect(step.m[4]).toBe(400);
    expect(r.key).toBe('resize:text0001');
  });
});

describe('vertical padding', () => {
  test('the space above the capitals equals the space under the last baseline', () => {
    for(const face of Object.values(FONTS))
      for(const [count, size, pad] of [[1, 48, 0], [2, 60, 20], [5, 24, 8]]) {
        const h = boxHeight(count, size, pad);
        const first = firstBaseline(face, count, size, h);
        const last = first + (count - 1) * size * LINE_HEIGHT;

        expect(first - face.cap * size).toBeCloseTo(h - last, 6);
        expect(first - face.cap * size).toBeGreaterThanOrEqual(pad);
      }
  });
});
