import { describe, expect, test } from 'bun:test';
import { bendCurve, bendOf, curveLength, curvePath, fitSize, legal, minRadius, turning } from '../client/editor/curve.js';
import { renderToString } from '../vendor/preact-render-to-string.js';
import { renderText } from '../client/editor/render.js';

describe('curved text baseline', () => {
  test('a tiny bend snaps to straight', () => expect(bendCurve(400, 0.02, 24)).toBeNull());

  test('a bend is legal, symmetric and turns less than 180 degrees', () => {
    const c = bendCurve(400, 0.6, 24);

    expect(legal(c, 24)).toBe(true);
    expect(turning(c)).toBeLessThanOrEqual(180);
    expect(c.c0[1]).toBeCloseTo(c.c1[1]);
    expect(bendOf(c)).toBeCloseTo(0.6, 1);
  });

  test('a bend too tight for the font size is reduced until legal', () => {
    const c = bendCurve(300, 1, 60);

    expect(c === null || minRadius(c) >= 90 - 1e-6).toBe(true);
  });

  test('a loop or an S bend is illegal', () => {
    expect(legal({ p0: [0, 0], c0: [300, 100], c1: [-100, 100], p1: [200, 0] }, 10)).toBe(false);
    expect(legal({ p0: [0, 0], c0: [100, 80], c1: [200, -80], p1: [300, 0] }, 10)).toBe(false);
  });

  test('text longer than the curve scales down, not below the minimum', () => {
    const c = bendCurve(400, 0.5, 20);

    expect(fitSize(40, curveLength(c) * 2, c)).toBeCloseTo(20, 0);
    expect(fitSize(40, 10, c)).toBe(40);
    expect(fitSize(10, curveLength(c) * 100, c)).toBe(8);
  });

  test('renders a textPath along the curve', () => {
    const curve = bendCurve(400, 0.5, 24);
    const svg = renderToString(renderText({ id: 't1', text: 'Hello', lines: ['Hello'], m: [1, 0, 0, 1, 0, 0], w: 400, h: 60, font: 'sans', size: 24, color: '#000000', align: 'start', padding: 0, radius: 0, curve }));

    expect(svg).toContain('<textPath');
    expect(svg).toContain(curvePath(curve).replace(/\s/g, ' '));
  });
});
