// bun test: the bird's-eye view of a gallery (client/gallery/overview.js)
import { describe, expect, test } from 'bun:test';
import { overviewPose, planBounds } from '../client/gallery/overview.js';
import { buildGallery } from '../client/gallery/build.js';
import { planFromDoc } from '../client/gallery/fromdoc.js';
import node9 from './fixtures/node9.json';

describe('planBounds', () => {
  test('the box round the wall segments; none without walls', () => {
    expect(planBounds([[0, 0, 10, 0, 0.1], [10, 0, 10, -4, 0.1]])).toEqual({ cx: 5, cz: -2, rx: 5, rz: 2 });
    expect(planBounds([])).toBeNull();
  });
});

describe('overviewPose', () => {
  const box = { cx: 20, cz: -30, rx: 25, rz: 10 };

  test('above and south of the centre, looking down at it', () => {
    const p = overviewPose(box, 1);

    expect(p.x).toBe(20);
    expect(p.y).toBeGreaterThan(0);
    expect(p.z).toBeGreaterThan(-30);
    expect(p.pitch).toBeLessThan(0);

    // the line of sight meets the ground at the centre: down by y over a run of z - cz
    expect(Math.atan2(p.y, p.z - box.cz)).toBeCloseTo(-p.pitch, 9);
  });

  test('a bigger plan is seen from further, a wide stage from nearer than a tall one', () => {
    expect(overviewPose({ ...box, rx: 50, rz: 20 }, 1).distance).toBeGreaterThan(overviewPose(box, 1).distance);
    expect(overviewPose(box, 16 / 9).distance).toBeLessThan(overviewPose(box, 0.5).distance);
  });

  test('real perspective: the plan of node 9 fits the stage with room to spare', () => {
    const built = buildGallery(planFromDoc(node9.doc));
    const b = planBounds(built.collision);
    const p = overviewPose(b, 1);

    expect(b.rx).toBeGreaterThan(20);
    expect(p.distance * Math.tan((42 * Math.PI) / 360)).toBeGreaterThan(b.rx); // half the view at the centre is wider than the plan
  });
});
