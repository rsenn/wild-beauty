import { describe, expect, test } from 'bun:test';
import { createTakeover, TAKEOVER } from '../client/gallery/flight/takeover.js';

const built = { floorHeightAt: () => 0, collision: [] };
const pose = (x = 0) => ({ x, y: 30, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 50 });
const make = () => {
  const notes = [];
  const walker = { x: 0, y: 0 };
  const flight = createTakeover(built, { walker, list: [], tour: { index: 0, moving: false }, onNote: n => notes.push(n) });

  return { flight, notes, walker };
};

describe('createTakeover', () => {
  test('gear and flaps are commands, anything else is not', () => {
    const { flight, notes } = make();

    expect(flight.command('gear')).toBe(true);
    expect(flight.state().gear).toBe(true);
    expect(flight.command('flaps')).toBe(true);
    expect(flight.state().flaps).toBe(1);
    expect(flight.command('slipLeft')).toBe(true);
    expect(flight.command('walk')).toBe(false);
    expect(notes).toEqual(['gear.down', 'flaps.1']);
  });

  test('without input the flyby flies on; a control takes the bird from where the flyby was', () => {
    const { flight } = make();
    let asked = 0;
    const base = () => (asked++, pose(5));

    expect(flight.step(0.1, { moving: false }, pose(), base).x).toBe(5);
    expect(flight.state().piloting).toBe(false);

    const q = flight.step(0.1, { moving: true, forward: 0, turn: 1 }, pose(5), base);

    expect(asked).toBe(1); // the loop is paused while the visitor flies
    expect(flight.state().piloting).toBe(true);
    expect(q.fov).toBe(TAKEOVER.fov);
  });

  test('a minute without a control hands the bird back, gliding onto the flyby', () => {
    const { flight } = make();
    const base = () => pose(5);

    flight.step(0.1, { moving: true, turn: 1 }, pose(), base);

    for(let t = 0; t < TAKEOVER.grace + 1; t += 0.5) flight.step(0.5, { moving: false }, pose(), base);

    expect(flight.state().piloting).toBe(false);

    for(let t = 0; t < TAKEOVER.rejoin + 1; t += 0.5) flight.step(0.5, { moving: false }, pose(), base);

    expect(flight.step(0.1, { moving: false }, pose(), base).x).toBe(5);
  });

  test('reset puts the gear and the flaps up', () => {
    const { flight } = make();

    flight.command('gear');
    flight.command('flaps');
    flight.reset();
    expect(flight.state()).toMatchObject({ gear: false, flaps: 0, piloting: false, atc: null });
  });
});
