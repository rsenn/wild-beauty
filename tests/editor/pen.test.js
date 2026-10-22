// bun test: client/editor/pen.js
import { describe, expect, test } from 'bun:test';
import { lowPass, oneEuro, oneEuroPoint, outline, outlinePath, resample, strokePath, strokeWidths, width } from '../../client/editor/pen.js';

// small deterministic generator, so the tests do not flake
function random(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;

    return seed / 2 ** 32;
  };
}

const variance = values => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  return values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
};

describe('oneEuro', () => {
  test('the first sample passes through', () => {
    expect(oneEuro(1, 0)(42, 0)).toBe(42);
  });

  test('a noisy line is smoothed: the variance drops', () => {
    const rnd = random(7);
    const f = oneEuro(1, 0);
    const noisy = [];
    const smooth = [];

    for(let i = 0; i < 600; i++) {
      const y = (rnd() - 0.5) * 10;

      noisy.push(y);
      smooth.push(f(y, i / 120));
    }

    expect(variance(smooth.slice(60))).toBeLessThan(variance(noisy.slice(60)) * 0.2);
  });

  test('a fast move is not lagged', () => {
    // 2000 units per second at 120 Hz: the filter must stay close to the pen
    const lag = (minCutoff, beta) => {
      const f = oneEuro(minCutoff, beta);
      let x = 0;

      for(let i = 0; i < 240; i++) x = f(2000 * (i / 120), i / 120);

      return 2000 * (239 / 120) - x;
    };

    expect(lag(1, 0.05)).toBeLessThan(10);
    // without the speed term the same filter trails far behind
    expect(lag(1, 0)).toBeGreaterThan(100);
  });

  test('settles on a constant signal and ignores repeated times', () => {
    const f = oneEuro(1, 0);

    f(0, 0);

    let x;

    for(let i = 1; i < 240; i++) x = f(100, i / 120);

    expect(x).toBeCloseTo(100, 1);
    expect(f(5, 239 / 120)).toBe(x);
    expect(f(5, 0)).toBe(x);
  });

  test('a 2D point is filtered per axis', () => {
    const f = oneEuroPoint(1, 0);

    expect(f(10, 20, 0)).toEqual([10, 20]);

    const [x, y] = f(20, 20, 0.01);

    expect(x).toBeGreaterThan(10);
    expect(x).toBeLessThan(20);
    expect(y).toBe(20);
  });
});

const gaps = points => points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));

describe('resample', () => {
  test('a straight line: exact spacing, ends kept, channels interpolated', () => {
    const out = resample([[0, 0, 0, 0], [100, 0, 1, 2]], 10);

    expect(out).toHaveLength(11);
    expect(out[0]).toEqual([0, 0, 0, 0]);
    expect(out.at(-1)).toEqual([100, 0, 1, 2]);
    expect(out[3][0]).toBeCloseTo(30, 9);
    expect(out[3][2]).toBeCloseTo(0.3, 9);
    expect(out[3][3]).toBeCloseTo(0.6, 9);
    gaps(out).forEach(g => expect(g).toBeCloseTo(10, 9));
  });

  test('uneven input on a curve: spacing within 1% of the target', () => {
    const rnd = random(3);
    const circle = [];

    // a circle sampled at irregular angles
    for(let a = 0; a < 2 * Math.PI; a += 0.02 + rnd() * 0.2) circle.push([300 + 200 * Math.cos(a), 300 + 200 * Math.sin(a)]);

    const out = resample(circle, 4);

    expect(out.length).toBeGreaterThan(100);

    // the last gap is the remainder; every other one is the target
    gaps(out).slice(0, -1).forEach(g => expect(Math.abs(g - 4) / 4).toBeLessThan(0.01));
    expect(gaps(out).at(-1)).toBeLessThanOrEqual(4 + 1e-9);
  });

  test('corners: the path is followed, the arc length is the target', () => {
    const out = resample([[0, 0], [50, 0], [50, 50]], 10);

    expect(out.map(p => p.map(Math.round))).toEqual([[0, 0], [10, 0], [20, 0], [30, 0], [40, 0], [50, 0], [50, 10], [50, 20], [50, 30], [50, 40], [50, 50]]);
  });

  test('degenerate input', () => {
    expect(resample([], 5)).toEqual([]);
    expect(resample([[1, 2]], 5)).toEqual([[1, 2]]);
    expect(resample([[1, 2], [1, 2], [1, 2]], 5)).toEqual([[1, 2]]);
    expect(resample([[0, 0], [0, 0], [3, 0]], 10)).toEqual([[0, 0], [3, 0]]);
    expect(resample([[0, 0], [10, 0]], 0)).toEqual([[0, 0], [10, 0]]);
  });

  test('does not touch its input', () => {
    const input = [[0, 0, 0], [10, 0, 1]];
    const copy = JSON.parse(JSON.stringify(input));

    resample(input, 3);
    expect(input).toEqual(copy);
  });
});

describe('width model', () => {
  test('no pressure gives the base width at rest', () => {
    expect(width(0.5, 0, 8)).toBe(8);
    expect(width(undefined, 0, 8)).toBe(8);
    expect(width(0, 0, 8)).toBe(8);
  });

  test('more pressure is wider, more speed is thinner', () => {
    expect(width(1, 0)).toBeGreaterThan(width(0.5, 0));
    expect(width(0.2, 0)).toBeLessThan(width(0.5, 0));

    let last = Infinity;

    for(const v of [0, 100, 500, 1000, 3000, 10000]) {
      const w = width(0.5, v);

      expect(w).toBeLessThan(last);
      last = w;
    }

    // never vanishes, and pressure beyond 1 is capped
    expect(width(0.5, 1e9)).toBeGreaterThan(0.3);
    expect(width(5, 0)).toBe(width(1, 0));
  });

  test('lowPass approaches its input', () => {
    const f = lowPass(0.05);

    expect(f(0, 0.01)).toBe(0);

    let y;

    for(let i = 0; i < 50; i++) y = f(100, 0.01);

    expect(y).toBeGreaterThan(99);
    expect(f(0, 0)).toBe(y);
  });

  test('a fast stroke is thinner than a slow one, without jitter', () => {
    const stroke = speed => Array.from({ length: 60 }, (_, i) => [i * speed * 0.01, 0, 0.5, i * 0.01]);
    const slow = strokeWidths(stroke(50), 10);
    const fast = strokeWidths(stroke(3000), 10);

    expect(fast.at(-1)).toBeLessThan(slow.at(-1) * 0.7);
    expect(slow).toHaveLength(60);
    // constant speed: the width settles
    expect(Math.abs(fast.at(-1) - fast.at(-2))).toBeLessThan(0.01);
  });
});

const extent = polygon => {
  const xs = polygon.map(p => p[0]);
  const ys = polygon.map(p => p[1]);

  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

describe('outline', () => {
  const line = Array.from({ length: 41 }, (_, i) => [100 + i * 10, 500]);

  test('a straight stroke: the right length, round caps', () => {
    const e = extent(outline(line, line.map(() => 10)));

    // 400 long, 10 wide, a round cap adds half the width at each end; the cap
    // is a short polygon, so the extent is exact only to a few hundredths
    expect(e.x1 - e.x0).toBeCloseTo(410, 1);
    expect(e.y1 - e.y0).toBeCloseTo(10, 6);
    expect(e.x0).toBeCloseTo(95, 1);
    expect(e.x1).toBeCloseTo(505, 1);
  });

  test('our widths drive the thickness', () => {
    const thin = extent(outline(line, line.map(() => 4)));
    const wide = extent(outline(line, line.map(() => 20)));

    expect(thin.y1 - thin.y0).toBeCloseTo(4, 6);
    expect(wide.y1 - wide.y0).toBeCloseTo(20, 6);

    // a stroke that swells: wider at the end than at the start
    const swell = outline(line, line.map((_, i) => 4 + i * 0.4));
    const at = x => extent(swell.filter(p => Math.abs(p[0] - x) < 15));

    expect(at(480).y1 - at(480).y0).toBeGreaterThan((at(120).y1 - at(120).y0) * 2);
  });

  test('one point is a dot, no points nothing', () => {
    const dot = extent(outline([[50, 50]], [10]));

    expect(dot.x1 - dot.x0).toBeGreaterThan(9);
    expect(dot.x1 - dot.x0).toBeLessThan(12);
    expect(outline([], [])).toEqual([]);
    expect(outline([[1, 1]], [0])).toEqual([]);
  });
});

describe('outlinePath', () => {
  test('a closed path of quadratic curves', () => {
    const d = outlinePath(outline(Array.from({ length: 11 }, (_, i) => [100 + i * 10, 500]), Array(11).fill(10)));

    expect(d).toMatch(/^M[\d.]+ [\d.]+(Q[\d.]+ [\d.]+ [\d.]+ [\d.]+)+Z$/);
    expect(outlinePath([])).toBe('');
    expect(outlinePath([[0, 0], [1, 1]])).toBe('');
  });

  test('the whole pipeline: samples to a path inside the document limit', () => {
    const samples = Array.from({ length: 120 }, (_, i) => [100 + i * 6, 500 + 80 * Math.sin(i / 10), 0.6, i / 120]);
    const d = strokePath(samples);

    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.length).toBeLessThan(20000);
  });
});
