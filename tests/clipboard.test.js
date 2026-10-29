// bun test: clipboard (EDITOR.md E131), the pure parts
import { describe, expect, test } from 'bun:test';
import { apply } from '../client/editor/commands.js';
import { classify, copyPayload, htmlFor, pasteSteps, payloadFromHtml, plainFor, svgFor } from '../client/editor/clipboard.js';
import { emptyNode, findStep, validate } from '../client/editor/model.js';

const HASH = 'a'.repeat(64);
const sq = (x, y, s) => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];

function start() {
  let snap = { doc: emptyNode(), kind: 'node' };
  const page = snap.doc.pages[0].id;

  snap = apply(snap, { type: 'addPhoto', hash: HASH, info: {}, id: 'photo001', page }).snap;
  snap = apply(snap, { type: 'clipPolygon', id: 'photo001', polygon: sq(100, 100, 300), shape: 'shape001', style: {} }).snap;
  snap = apply(snap, { type: 'addText', id: 'text0001', page, text: 'Hello <b> & "you"', lines: ['Hello'], m: [1, 0, 0, 1, 50, 60], w: 400, h: 60, font: 'serif', size: 40, color: '#aa0000', align: 'start' }).snap;

  return snap;
}

describe('copy and paste of steps', () => {
  test('the payload survives html', () => {
    const { doc } = start();
    const payload = copyPayload(doc, 'text0001');
    const html = htmlFor(payload);

    expect(html).toContain('Hello &lt;b&gt; &amp; &quot;you&quot;');
    expect(html).toContain('EB Garamond');
    expect(payloadFromHtml(html)).toEqual(payload);
    expect(plainFor(payload)).toBe('Hello <b> & "you"');
    expect(payloadFromHtml('<div data-wb-clip="%7Bbad">')).toBeNull();
  });

  test('a clipped photo is pasted with its own clip, moved, and valid', () => {
    const { doc } = start();
    const payload = copyPayload(doc, 'photo001');

    expect(payload.items[0].clip.step.id).toBe('shape001');

    const r = pasteSteps(doc, doc.pages[0].id, payload, { shift: 50 });
    const copy = findStep(r.doc, r.ids[0]).step;

    expect(r.ids).toHaveLength(1);
    expect(copy.clip).toBeDefined();
    expect(copy.clip).not.toBe('shape001');
    expect(copy.m[4]).toBe(payload.items[0].m[4] + 50);
    expect(validate(r.doc)).toEqual([]);
  });

  test('a text box is pasted, and an unknown photo is left out', () => {
    const { doc } = start();
    const r = pasteSteps(doc, doc.pages[0].id, copyPayload(doc, 'text0001'), { ids: ['abcd1234'] });

    expect(r.ids).toEqual(['abcd1234']);
    expect(findStep(r.doc, 'abcd1234').step.text).toContain('Hello');
    expect(pasteSteps(doc, doc.pages[0].id, copyPayload(doc, 'photo001'), { known: () => false }).ids).toEqual([]);
  });

  test('a hostile payload is refused', () => {
    const { doc } = start();
    const bad = { v: 1, items: [{ step: { op: 'text', id: 'x', text: 5, w: 'no' }, m: [1, 0, 0, 1, 0, 0] }] };

    expect(pasteSteps(doc, doc.pages[0].id, bad).ids).toEqual([]);
  });

  test('a paste command adds the steps in one go', () => {
    const snap = start();
    const payload = copyPayload(snap.doc, 'text0001');
    const next = apply(snap, { type: 'pasteSteps', page: snap.doc.pages[0].id, payload, shift: 30, ids: ['ffff0001'] }).snap;

    expect(findStep(next.doc, 'ffff0001')).not.toBeNull();
  });
});

describe('what a paste is', () => {
  test('ours first, then an image, then words', () => {
    const { doc } = start();
    const html = htmlFor(copyPayload(doc, 'text0001'));
    const file = { type: 'image/png' };

    expect(classify({ html, text: 'x', files: [file] }).kind).toBe('steps');
    expect(classify({ html: '<img src="x">', text: '', files: [file] })).toEqual({ kind: 'image', file });
    expect(classify({ html: '<p>Hi&nbsp;<b>there</b></p>' })).toEqual({ kind: 'text', text: 'Hi there' });
    expect(classify({ text: '  words \n ' }).text).toBe('words');
    expect(classify({})).toBeNull();
  });
});

describe('svg (E131 follow-up)', () => {
  test('a text box copies as a standalone svg on its own box; a photo has none', () => {
    const { doc } = start();
    const svg = svgFor(copyPayload(doc, 'text0001'));

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="46.0 56.0');
    expect(svg).toContain('width="');
    expect(svg).toContain('Hello');
    expect(svg).not.toContain('viewBox="0 0 1000 1000"');
    expect(svgFor(copyPayload(doc, 'photo001'))).toBeNull();
  });

  test('pasted svg source and svg files are told apart from words', () => {
    expect(classify({ text: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>' })).toEqual({ kind: 'svg', source: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>' });
    expect(classify({ text: '<?xml version="1.0"?>\n<svg viewBox="0 0 1 1"/>' }).kind).toBe('svg');
    expect(classify({ text: 'an <svgx> tag' }).kind).toBe('text');

    const file = { type: 'image/svg+xml', name: 'a.svg' };

    expect(classify({ files: [file] })).toEqual({ kind: 'image', file });
  });
});
