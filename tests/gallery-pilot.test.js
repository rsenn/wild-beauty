import { describe, expect, test } from 'bun:test';
import { createPilot, PILOT } from '../client/gallery/pilot.js';

// a floor 20 m square at height 0, walls round it
const built = {
  floorHeightAt: (x, y) => (Math.abs(x) <= 40 && Math.abs(y) <= 40 ? 0 : null),
  collision: [
    [-40, -40, 40, -40, 0.1],
    [40, -40, 40, 40, 0.1],
    [40, 40, -40, 40, 0.1],
    [-40, 40, -40, -40, 0.1],
  ],
};
const at = (y, extra = {}) => ({ x: 0, y, z: 0, yaw: 0, pitch: 0, roll: 0, ...extra });
const fly = (p, seconds, input = {}, dt = 1 / 60) => {
  for(let t = 0; t < seconds && !p.landed; t += dt) p.step(dt, input);

  return p;
};

describe('createPilot', () => {
  test('flies straight on at cruise, level, with no input', () => {
    const p = fly(createPilot(built, at(20)), 1);

    expect(p.y).toBeCloseTo(PILOT.cruise, 0); // north
    expect(p.h).toBeCloseTo(20, 1);
    expect(Math.abs(p.roll)).toBeLessThan(0.01);
  });

  test('turns and banks into the turn, and levels out when let go', () => {
    const p = createPilot(built, at(20));

    fly(p, 1.5, { turn: 1 });
    expect(p.yaw).toBeGreaterThan(0.8);
    expect(p.roll).toBeLessThan(-0.1); // a right turn banks right (roll positive is left)

    fly(p, 3);
    expect(Math.abs(p.roll)).toBeLessThan(0.05);
  });

  test('push forward dives, pull back climbs, and the nose levels when let go', () => {
    const d = createPilot(built, at(30));
    const c = createPilot(built, at(30));

    fly(d, 1, { forward: 1 });
    fly(c, 1, { forward: -1 });
    expect(d.h).toBeLessThan(30);
    expect(c.h).toBeGreaterThan(30);

    fly(d, 3);
    expect(Math.abs(d.pitch)).toBeLessThan(0.05);
  });

  test('a drag looks and pitches', () => {
    const p = createPilot(built, at(20));

    p.step(1 / 60, { look: [0.05, 0.1] });
    expect(p.yaw).toBeGreaterThan(0.04);
    expect(p.pitch).toBeGreaterThan(0.05);
  });

  test('walls stop it low down and let it pass above', () => {
    const low = createPilot(built, at(1.8, { z: -35 }));
    const high = createPilot(built, at(20, { z: -35 }));

    fly(low, 3);
    expect(low.y).toBeLessThan(40.01); // held by the wall at 40

    fly(high, 3);
    expect(high.y).toBeGreaterThan(40);
  });

  test('throttles back close to a floor, towards a walking pace', () => {
    const p = createPilot(built, at(3, { z: 5 }));

    fly(p, 1.5);
    expect(p.speed).toBeLessThan(PILOT.cruise * 0.6);
  });

  test('a gentle, level, slow approach lands', () => {
    const p = createPilot(built, at(6, { z: 30 })); // 6 m up, 30 m south of the middle, heading north

    fly(p, 20, { forward: 0.12, gear: true }); // a touch forward: a gentle descent, gear down
    expect(p.landed).toBe(true);
    expect(p.h).toBeCloseTo(1.65, 1);
  });

  test('gear up it is a belly landing: it skids and bounces instead of landing', () => {
    const p = createPilot(built, at(6, { z: 30 }));

    for(let t = 0; t < 20 && !p.bounced && !p.landed; t += 1 / 60) p.step(1 / 60, { forward: 0.12 });

    expect(p.landed).toBeFalsy();
    expect(p.belly).toBeGreaterThan(0);
  });

  test('the gear takes its time, and the flaps slow the bird', () => {
    const p = createPilot(built, at(30));
    const q = createPilot(built, at(30));

    fly(p, 2, { gear: true });
    expect(p.gear).toBeGreaterThan(0.2);
    expect(p.gear).toBeLessThan(0.6);
    fly(p, 5, { gear: true });
    expect(p.gear).toBe(1);

    fly(q, 6, { flaps: 3 });
    fly(p, 6, { gear: true, flaps: 3 });
    expect(q.flapsAt).toBe(3);
    expect(p.speed).toBeLessThan(PILOT.cruise * 0.8);
    expect(q.speed).toBeLessThan(PILOT.cruise);
  });

  test('gear down, even a steep dive over the floor arrives softly (an easy landing)', () => {
    const p = createPilot(built, at(12));

    fly(p, 12, { forward: 1, gear: true });
    expect(p.landed).toBe(true);
  });

  test('a dive into the floor is a crash: it bounces up and keeps flying', () => {
    const p = createPilot(built, at(12));

    for(let t = 0; t < 3 && !p.bounced; t += 1 / 60) p.step(1 / 60, { forward: 1 });

    expect(p.landed).toBeFalsy();
    expect(p.bounced).toBeGreaterThan(0);
    expect(p.pitch).toBeGreaterThan(0);
  });

  test('outside the floor it stays above the walls', () => {
    const p = createPilot(built, { x: 60, y: 5, z: 0, yaw: 0, pitch: 0, roll: 0 });

    fly(p, 3, { forward: 1 });
    expect(p.h).toBeGreaterThanOrEqual(PILOT.wall);
  });
});

describe('deserves a medal', () => {
  const good = { sink: 0.6, pitch: 0.02, roll: 0.01, flaps: 3, bounced: 0 };

  test('gentle, level, flaps out, no bounce', async () => {
    const { deserves } = await import('../client/gallery/pilot.js');

    expect(deserves(good)).toBe(true);
    expect(deserves({ ...good, flaps: 0 })).toBe(false); // no flaps: a landing, no medal
    expect(deserves({ ...good, bounced: 1 })).toBe(false);
    expect(deserves({ ...good, sink: 2 })).toBe(false);
    expect(deserves({ ...good, roll: 0.3 })).toBe(false);
  });

  test('a landing with gear and flaps down is a medal, with no flaps it is not', () => {
    const a = createPilot(built, at(6, { z: 30 }));
    const b = createPilot(built, at(6, { z: 30 }));

    fly(a, 20, { forward: 0.12, gear: true, flaps: 3 });
    fly(b, 20, { forward: 0.12, gear: true });
    expect(a.landed).toBe(true);
    expect(a.medal).toBe(true);
    expect(b.landed).toBe(true);
    expect(b.medal).toBe(false);
  });
});

describe('sideslip', () => {
  test('sinks faster without turning the track, wing down and nose off the track, and eases out when let go', () => {
    const a = createPilot(built, at(40));
    const b = createPilot(built, at(40));

    fly(a, 3, { slip: 1 });
    fly(b, 3);
    expect(a.h).toBeLessThan(b.h - 4); // down by the extra sink
    expect(a.yaw).toBeCloseTo(b.yaw, 5); // the track is the same
    expect(a.speed).toBeLessThan(b.speed);
    expect(a.roll).toBeLessThan(-0.1); // slipping right: the right wing is down
    expect(a.pose().yaw).toBeLessThan(a.yaw - 0.15); // and the nose is off to the left of the track

    fly(a, 3);
    expect(Math.abs(a.slip)).toBeLessThan(0.02);
  });

  test('the vertical speed on the instruments counts the slip', () => {
    const p = createPilot(built, at(40));

    fly(p, 2, { slip: 1 });
    expect(p.instruments().vs).toBeLessThan(-2);
  });

  test('still slipping at touchdown is a skid, it bounces; out of the slip it lands', () => {
    const slipping = createPilot(built, at(6, { z: 30 }));
    const clean = createPilot(built, at(6, { z: 30 }));

    for(let t = 0; t < 20 && !slipping.bounced && !slipping.landed; t += 1 / 60) slipping.step(1 / 60, { forward: 0.12, gear: true, slip: 1 });

    fly(clean, 20, { forward: 0.12, gear: true });
    expect(slipping.landed).toBeFalsy();
    expect(clean.landed).toBe(true);
  });
});

describe('checklist', () => {
  test('gear, flaps and slip as the aids show them', async () => {
    const { checklist } = await import('../client/gallery/pilot.js');

    expect(checklist({ gear: 1, flaps: 3, slip: 0 })).toEqual({ gear: 'ok', flaps: 'ok', slip: 'ok' });
    expect(checklist({ gear: 0.5, flaps: 1, slip: 0.4 })).toEqual({ gear: 'wait', flaps: 'wait', slip: 'no' });
    expect(checklist({ gear: 0, flaps: 0, slip: 0 })).toEqual({ gear: 'no', flaps: 'no', slip: 'ok' });
  });
});
