// bun test: the selection handles and button steps (E113)
import { describe, expect, test } from 'bun:test';
import { handlePoints, hitHandle, nudge, rotateDrag, scaleDrag, STEP_SCALE } from '../client/editor/handles.js';
import { apply } from '../client/editor/matrix.js';

const IDENTITY = [1, 0, 0, 1, 0, 0];
const stage = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]];
const small = [[400, 400], [600, 400], [600, 600], [400, 600]];
const near = (p, q) => expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeLessThan(1e-6);

describe('handlePoints', () => {
  test('a small selection has its handles on its corners and the turning handle above', () => {
    const h = handlePoints(small, { gap: 60 });

    expect(h.corners).toEqual(small);
    near(h.rotate, [500, 340]);
  });

  test('a photo covering the stage gets its handles moved inside the stage', () => {
    const h = handlePoints(stage, { inset: 20, gap: 60 });

    expect(h.corners).toEqual([[20, 20], [980, 20], [980, 980], [20, 980]]);
    near(h.rotate, [500, 20]);
  });

  test('the turning handle stands off the top edge of a turned selection', () => {
    const turned = [[500, 400], [600, 500], [500, 600], [400, 500]]; // a square turned 45 degrees
    const h = handlePoints(turned, { gap: 50 });

    expect(h.rotate[0]).toBeGreaterThan(550);
    expect(h.rotate[1]).toBeLessThan(450);
  });
});

describe('hitHandle', () => {
  const h = handlePoints(small, { gap: 60 });

  test('finds a corner or the turning handle within the radius, else null', () => {
    expect(hitHandle(h, [402, 398], 10)).toEqual({ kind: 'corner', index: 0 });
    expect(hitHandle(h, [598, 602], 10)).toEqual({ kind: 'corner', index: 2 });
    expect(hitHandle(h, [500, 345], 10)).toEqual({ kind: 'rotate' });
    expect(hitHandle(h, [500, 500], 10)).toBeNull();
  });
});

describe('scaleDrag and rotateDrag', () => {
  test('dragging a corner twice as far from the opposite corner doubles the size, the pivot stays', () => {
    const pivot = [400, 400];
    const m = scaleDrag(IDENTITY, pivot, [600, 600], [800, 800]);

    near(apply(m, pivot), pivot);
    near(apply(m, [600, 600]), [800, 800]);
  });

  test('a handle that was moved inside the stage does not make the selection jump', () => {
    // the real corner is at 1000, the handle at 980: pressing there and not moving changes nothing
    expect(scaleDrag(IDENTITY, [0, 0], [980, 980], [980, 980])).toEqual([1, 0, 0, 1, 0, 0]);
  });

  test('the factor is limited, and a pointer on the pivot changes nothing', () => {
    expect(scaleDrag(IDENTITY, [0, 0], [100, 0], [0, 0])[0]).toBeCloseTo(0.05);
    expect(scaleDrag(IDENTITY, [0, 0], [0, 0], [50, 50])).toEqual(IDENTITY);
  });

  test('going a quarter turn round the centre turns the selection by 90 degrees', () => {
    const centre = [500, 500];
    const m = rotateDrag(IDENTITY, centre, [500, 300], [700, 500]);

    near(apply(m, centre), centre);
    near(apply(m, [500, 300]), [700, 500]);
  });
});

describe('nudge', () => {
  const centre = [500, 500];

  test('larger and smaller scale about the centre and cancel out', () => {
    const [a] = nudge('larger', centre);

    expect(a).toBeCloseTo(STEP_SCALE);
    near(apply(nudge('larger', centre), centre), centre);
    near(apply(nudge('smaller', centre), apply(nudge('larger', centre), [600, 500])), [600, 500]);
  });

  test('right turns clockwise on the screen (y down), left the other way, 15 degrees', () => {
    near(apply(nudge('right', centre), [600, 500]), [500 + 100 * Math.cos(Math.PI / 12), 500 + 100 * Math.sin(Math.PI / 12)]);
    near(apply(nudge('left', centre), [600, 500]), [500 + 100 * Math.cos(Math.PI / 12), 500 - 100 * Math.sin(Math.PI / 12)]);
  });

  test('an unknown kind gives null', () => {
    expect(nudge('sideways', centre)).toBeNull();
  });
});
