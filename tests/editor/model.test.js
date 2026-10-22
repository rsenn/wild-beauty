// bun test: client/editor/model.js
import { describe, expect, test } from 'bun:test';
import { LIMITS, MODES, VERSION, emptyNode, newId, unique, validate } from '../../client/editor/model.js';

describe('ids', () => {
  test('8 base-36 characters, two thousand are distinct', () => {
    const ids = new Set(Array.from({ length: 2000 }, newId));

    expect(ids.size).toBe(2000);

    for(const id of ids) expect(id).toMatch(/^[0-9a-z]{8}$/);
  });

  test('unique avoids taken ids', () => {
    const taken = new Set(Array.from({ length: 100 }, newId));

    expect(taken.has(unique(taken))).toBe(false);
    expect(unique([])).toMatch(/^[0-9a-z]{8}$/);
  });
});

describe('emptyNode', () => {
  test('version 1, free mode, one empty page', () => {
    const node = emptyNode();

    expect(node.v).toBe(VERSION);
    expect(MODES).toContain(node.mode);
    expect(node.pages).toHaveLength(1);
    expect(node.pages[0].steps).toEqual([]);
    expect(node.pages[0].id).toMatch(/^[0-9a-z]{8}$/);
    expect(new TextEncoder().encode(JSON.stringify(node)).length).toBeLessThan(LIMITS.docBytes);
  });

  test('each call returns a separate document', () => {
    const a = emptyNode();
    const b = emptyNode();

    a.pages[0].steps.push({});
    expect(b.pages[0].steps).toEqual([]);
    expect(a.pages[0].id).not.toBe(b.pages[0].id);
  });
});

const HASH = 'a'.repeat(64);
const photo = (over = {}) => ({ op: 'photo', id: 'abcd1234', photo: HASH, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal', ...over });
const withSteps = (...steps) => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
const codes = doc => validate(doc).map(e => e.code);

describe('validate, structure', () => {
  test('the empty node validates', () => {
    expect(validate(emptyNode())).toEqual([]);
  });

  test('one valid step of every op', () => {
    const steps = [
      photo(),
      { op: 'stroke', id: 'stroke01', pts: [[1, 2, 3]], color: '#ff0000', smooth: true },
      { op: 'shape', id: 'shape001', path: 'M0 0L1 1Z', closed: true, fill: { type: 'linear', stops: [{ c: '#000000', at: 0 }, { c: 'rgb(1,2,3)', at: 1 }] }, strokeWidth: 2 },
      { op: 'clip', target: 'abcd1234', shape: 'shape001' },
      { op: 'unclip', target: 'abcd1234' },
      { op: 'blend', target: 'abcd1234', mode: 'multiply' },
      { op: 'transform', target: 'abcd1234', m: [1, 0, 0, 1, 5, 5], ease: 'linear' },
      { op: 'text', id: 'text0001', text: 'hi', lines: ['hi'], m: [1, 0, 0, 1, 0, 0], w: 10, h: 5, font: 'fixed', size: 12, color: '#000000', align: 'left', padding: 1, radius: 0 },
    ];

    expect(validate(withSteps(...steps))).toEqual([]);
  });

  test('each malformed fixture has its own code', () => {
    const fixtures = [
      [null, 'not_object'],
      [[], 'not_object'],
      [{ ...emptyNode(), v: 2 }, 'bad_version'],
      [{ ...emptyNode(), style: [] }, 'bad_style'],
      [{ ...emptyNode(), mode: 'wall' }, 'bad_mode'],
      [{ ...emptyNode(), bg: 'red' }, 'bad_bg'],
      [{ ...emptyNode(), pages: {} }, 'bad_pages'],
      [{ ...emptyNode(), pages: [7] }, 'bad_page'],
      [{ ...emptyNode(), pages: [{ id: 'page0001', steps: 1 }] }, 'bad_steps'],
      [{ ...emptyNode(), pages: [{ id: 'x', steps: [] }] }, 'bad_id'],
      [withSteps(5), 'bad_step'],
      [withSteps({ op: 'sparkle' }), 'unknown_op'],
      [withSteps(photo({ id: 'no' })), 'bad_id'],
      [withSteps(photo({ m: [1, 2, 3] })), 'bad_field'],
      [withSteps(photo({ fit: 'zoom' })), 'bad_field'],
      [withSteps(photo({ extra: 1 })), 'bad_field'],
      [withSteps({ op: 'clip', target: 'abcd1234' }), 'bad_field'],
    ];

    for(const [doc, code] of fixtures) expect(codes(doc)).toContain(code);
  });

  test('errors carry the path', () => {
    expect(validate(withSteps(photo({ fit: 'zoom' })))[0]).toEqual({ code: 'bad_field', path: 'pages[0].steps[0].fit' });
  });
});
