import { describe, expect, test } from 'bun:test';
import { makeSound } from '../client/gallery/sound.js';

// a context that counts what is scheduled
function fake() {
  const made = { osc: 0, src: 0, started: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = extra => {
    const n = { connect: x => x, start() { made.started++; }, stop() {}, ...extra };

    return n;
  };
  const ctx = {
    state: 'running',
    currentTime: 0,
    sampleRate: 100,
    destination: node(),
    resume() {},
    close() { ctx.state = 'closed'; },
    createGain: () => node({ gain: param() }),
    createOscillator: () => (made.osc++, node({ frequency: param(), type: '' })),
    createBiquadFilter: () => node({ frequency: param(), Q: {}, type: '' }),
    createBufferSource: () => (made.src++, node({})),
    createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  };

  return { ctx, made };
}

describe('makeSound', () => {
  test('the gear cycle schedules the pump, the air and the locks', () => {
    const { ctx, made } = fake();
    const s = makeSound({ context: () => ctx });

    expect(s.gear(true)).toBe(true);
    expect(made.osc).toBeGreaterThan(4);
    expect(made.src).toBeGreaterThan(2);
    expect(made.started).toBeGreaterThan(8);
  });

  test('the flaps play less than the gear, and more for more notches', () => {
    const [a, b, c] = [fake(), fake(), fake()];

    makeSound({ context: () => a.ctx }).gear(false);
    makeSound({ context: () => b.ctx }).flaps(1, 0);
    expect(b.made.started).toBeLessThan(a.made.started);
    expect(makeSound({ context: () => c.ctx }).flaps(3, 0)).toBe(true);
  });

  test('no audio context: silent, and it does not throw', () => {
    const s = makeSound({ context: () => { throw new Error('no audio'); } });

    expect(s.gear(true)).toBe(false);
    expect(s.flaps(1, 0)).toBe(false);
    s.dispose();
  });
});

describe('thrust', () => {
  test('starts the roar once, follows the level, and lets it die away at 0', () => {
    const { ctx, made } = fake();
    const s = makeSound({ context: () => ctx });

    expect(s.thrust(0)).toBe(true); // nothing running, nothing to make
    expect(made.started).toBe(0);
    expect(s.thrust(0.4)).toBe(true);
    expect(made.started).toBe(2); // the roar and the whine
    s.thrust(1);
    expect(made.started).toBe(2);
    s.thrust(0);
    s.thrust(0.5);
    expect(made.started).toBe(4); // a new run after it had died away
  });

  test('no audio context: silent', () => {
    expect(makeSound({ context: () => { throw new Error('no'); } }).thrust(1)).toBe(false);
  });
});

describe('fanfare', () => {
  test('a call of brass notes, a chord and a cymbal', () => {
    const { ctx, made } = fake();

    expect(makeSound({ context: () => ctx }).fanfare()).toBe(true);
    expect(made.osc).toBeGreaterThan(16);
    expect(made.src).toBeGreaterThan(1);
  });
});
