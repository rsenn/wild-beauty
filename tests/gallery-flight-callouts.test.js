import { describe, expect, test } from 'bun:test';
import { createCallouts } from '../client/gallery/flight/callouts.js';
import { makeVoice, pick } from '../client/gallery/flight/voice.js';

const run = (heights, { vs = -1, gear = 1, flaps = 3, dt = 0.1 } = {}) => {
  const said = [];
  const c = createCallouts((words, o) => said.push(o?.urgent ? `!${words}` : words));

  for(const m of heights) c.step(dt, { ra: m, vs, gear, flaps });

  return said;
};
const descend = (from, to, step = 0.1) => Array.from({ length: Math.round((from - to) / step) + 1 }, (_, i) => from - i * step);

describe('radar altimeter callouts', () => {
  test('calls the heights on the way down, in feet, and RETARD near the floor', () => {
    const said = run(descend(32, 0.5, 0.05)); // 105 ft down to 1.6 ft

    expect(said.filter(w => w !== 'retard')).toEqual(['one hundred', 'fifty', 'forty', 'thirty', 'twenty', 'ten']);
    expect(said.filter(w => w === 'retard').length).toBeGreaterThanOrEqual(1);
    expect(said.indexOf('twenty')).toBeLessThan(said.indexOf('retard'));
  });

  test('says nothing going up, or without a floor', () => {
    expect(run(descend(0.5, 32, -0.05).reverse(), { vs: 1 })).toEqual([]);
    expect(run([null, null, null])).toEqual([]);
  });

  test('SINK RATE when too fast for the height left, PULL UP when worse', () => {
    expect(run(descend(10, 8), { vs: -3 })).toContain('!sink rate');
    expect(run(descend(7, 5), { vs: -6 })).toContain('!pull up');
  });

  test('TOO LOW GEAR with the gear up, TOO LOW FLAPS with the gear down and no flaps', () => {
    expect(run(descend(15, 10), { gear: 0 })).toContain('!too low, gear');
    expect(run(descend(15, 10), { gear: 1, flaps: 0 })).toContain('!too low, flaps');
    expect(run(descend(15, 10), { gear: 1, flaps: 3 })).not.toContain('!too low, gear');
  });

  test('a warning repeats after its interval, not every step', () => {
    const said = run(Array(40).fill(8), { vs: -3 }); // 4 s of it

    expect(said.filter(w => w === '!sink rate').length).toBeLessThanOrEqual(2);
    expect(said.filter(w => w === '!sink rate').length).toBeGreaterThanOrEqual(1);
  });
});

describe('voice', () => {
  const synth = (voices = []) => {
    const spoken = [];

    return { spoken, cancelled: 0, getVoices: () => voices, speak(u) { spoken.push(u); }, cancel() { this.cancelled++; } };
  };
  const Utterance = class { constructor(text) { this.text = text; } };

  test('prefers an English woman\'s voice', () => {
    const v = [{ name: 'Deutsch', lang: 'de-DE' }, { name: 'English UK', lang: 'en-GB' }, { name: 'Samantha', lang: 'en-US' }];

    expect(pick(v).name).toBe('Samantha');
    expect(pick([{ name: 'x', lang: 'fr-FR' }])).toBe(null);
  });

  test('an urgent warning drops what is queued', () => {
    const s = synth([{ name: 'Samantha', lang: 'en-US' }]);
    const v = makeVoice({ synth: s, Utterance });

    v.say('fifty');
    v.say('pull up', { urgent: true });
    expect(s.spoken.map(u => u.text)).toEqual(['fifty', 'pull up']);
    expect(s.cancelled).toBe(1);
  });

  test('without speech synthesis it is silent and does not throw', () => {
    const v = makeVoice({ synth: undefined, Utterance: undefined });

    expect(v.available).toBe(false);
    expect(v.say('fifty')).toBe(false);
    v.cancel();
  });
});
