// bun test: the thumb stick of the touch screen (client/gallery/stick.js)
import { describe, expect, test } from 'bun:test';
import { STICK, createStick, radiusFor } from '../client/gallery/stick.js';

const settle = (stick, frames = 90) => {
  let out;

  for(let i = 0; i < frames; i++) out = stick.read(1 / 60);

  return out;
};
const push = (dx, dy, r = 60) => {
  const s = createStick();

  s.down(200, 400, r);
  s.move(200 + dx, 400 + dy);

  return s;
};

describe('the thumb stick', () => {
  test('a thumb that has not moved does nothing; a small push already walks', () => {
    expect(settle(push(0, 0))).toMatchObject({ forward: 0, strafe: 0, turn: 0, run: false });
    expect(settle(push(0, -3)).forward).toBe(0); // the dead zone
    expect(settle(push(0, -12)).forward).toBeGreaterThan(STICK.kick * 0.9); // just past it: a first kick
  });

  test('speed grows with the push to full at the radius, and further it runs', () => {
    const f = d => settle(push(0, -d)).forward;

    expect(f(20)).toBeLessThan(f(40));
    expect(f(40)).toBeLessThan(f(58));
    expect(f(60)).toBeCloseTo(1, 1);
    expect(settle(push(0, -60)).run).toBe(false);
    expect(settle(push(0, -75)).run).toBe(true);
  });

  test('back and sideways: back walks back, sideways with no forward push side-steps', () => {
    expect(settle(push(0, 40)).forward).toBeLessThan(0);
    expect(settle(push(0, 40)).turn).toBe(0);

    const side = settle(push(50, -2));

    expect(side.strafe).toBeGreaterThan(0.5);
    expect(side.turn).toBe(0);
  });

  test('pushed forward, the sideways part steers: a turn, and only a little side-step', () => {
    const o = settle(push(30, -50));

    expect(o.forward).toBeGreaterThan(0.6);
    expect(o.turn).toBeGreaterThan(0.2);
    expect(o.strafe).toBeLessThan(o.turn);
    expect(settle(push(-30, -50)).turn).toBeLessThan(-0.2); // to the left, the other way
  });

  test('the input is eased: it does not jump, and dies away when the thumb lifts', () => {
    const s = push(0, -60);
    const first = s.read(1 / 60).forward;

    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(0.5);
    settle(s);
    s.up();
    expect(s.read(1 / 60).forward).toBeGreaterThan(0.3); // not at once
    expect(settle(s).forward).toBe(0);
    expect(s.active).toBe(false);
  });

  test('pushed far beyond the radius the centre follows the thumb, the way back is short', () => {
    const s = createStick();

    s.down(100, 500, 60);
    s.move(100, 500 - 400); // far up the screen

    const v = s.view();

    expect(500 - v.y).toBeGreaterThan(300); // the centre went up with it
    expect(Math.hypot(v.knob[0] - v.x, v.knob[1] - v.y)).toBeLessThanOrEqual(60 + 1e-6); // the knob stays in the ring

    s.move(100, v.y); // the thumb back at the centre
    expect(settle(s).forward).toBe(0);
  });

  test('the ring is bigger on a big screen', () => {
    expect(radiusFor(360, 640)).toBe(STICK.radius);
    expect(radiusFor(820, 1180)).toBeGreaterThan(STICK.radius);
    expect(radiusFor(3000, 3000)).toBeLessThanOrEqual(96);
  });

  test('nothing to draw without a thumb', () => {
    expect(createStick().view()).toBeNull();
    expect(push(10, 10).view()).toMatchObject({ x: 200, y: 400, r: 60 });
  });
});
