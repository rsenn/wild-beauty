// The sounds of the bird's gear and flaps (the running gag, GALLERY.md). Synthesised with Web Audio,
// no files: a hydraulic whine under a rush of air, the doors' clunk and the lock. The audio context
// is made on the first sound, which always follows a key or a tap; no context, no sound.
//
//   const s = makeSound();  s.gear(true);  s.flaps(2, 1);  s.fanfare();  s.dispose()
// `thrust(level)` is the reverse thrust after a touchdown, 0..1, set every frame: a roar that rises with it.
// `gear(down)` plays the whole 5 s cycle; `flaps(notch, from)` a short motor run, longer for more notches.

export const SOUND = {
  volume: 0.22,
  gear: 5.5, // seconds, as PILOT.gear
  notch: 1.1, // seconds a flap notch takes, as PILOT.notch
};

export function makeSound({ context = () => new (globalThis.AudioContext ?? globalThis.webkitAudioContext)(), volume = SOUND.volume } = {}) {
  let ctx = null;
  let master = null;
  let noise = null;

  const ready = () => {
    if(ctx) return ctx.state !== 'closed';

    try {
      ctx = context();
    } catch {
      return false;
    }

    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    // a second of noise, looped for the air and the clunks
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);

    const data = noise.getChannelData(0);

    for(let i = 0, s = 7; i < data.length; i++) data[i] = ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;

    return true;
  };

  const hiss = (at, length, { type = 'lowpass', freq = 800, q = 0.7, gain = 0.5, attack = 0.05, release = 0.2, to = null } = {}) => {
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();

    src.buffer = noise;
    src.loop = true;
    filter.type = type;
    filter.frequency.setValueAtTime(freq, at);
    if(to) filter.frequency.linearRampToValueAtTime(to, at + length);
    filter.Q.value = q;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.linearRampToValueAtTime(gain, at + attack);
    amp.gain.setValueAtTime(gain, at + Math.max(attack, length - release));
    amp.gain.linearRampToValueAtTime(0.0001, at + length);
    src.connect(filter).connect(amp).connect(master);
    src.start(at);
    src.stop(at + length + 0.05);
  };

  const tone = (at, length, { type = 'sawtooth', from = 200, to = 200, gain = 0.2, attack = 0.1, release = 0.3, wobble = 0, filter = 1400 } = {}) => {
    const osc = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.linearRampToValueAtTime(to, at + length);
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.linearRampToValueAtTime(gain, at + attack);
    amp.gain.setValueAtTime(gain, at + Math.max(attack, length - release));
    amp.gain.linearRampToValueAtTime(0.0001, at + length);

    if(wobble) {
      // a pump that is not quite steady
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();

      lfo.frequency.value = wobble;
      depth.gain.value = gain * 0.35;
      lfo.connect(depth).connect(amp.gain);
      lfo.start(at);
      lfo.stop(at + length + 0.05);
    }

    osc.connect(lp).connect(amp).connect(master);
    osc.start(at);
    osc.stop(at + length + 0.05);
  };

  // a heavy thump: a falling sine and a puff of noise
  const thump = (at, { gain = 0.9, low = 70, size = 0.22 } = {}) => {
    tone(at, size, { type: 'sine', from: low * 2, to: low * 0.6, gain, attack: 0.004, release: size * 0.85, filter: 400 });
    hiss(at, size * 0.8, { freq: 500, gain: gain * 0.5, attack: 0.003, release: size * 0.7 });
  };

  let engine = null; // the reverse thrust while it runs: { src, filter, amp, osc, whine }

  const api = {
    // the reverse thrust: the engines' roar and a whine, louder and brighter with `level`; 0 lets it die away
    thrust(level) {
      if(level <= 0.001 && !engine) return true;
      if(!ready()) return false;

      ctx.resume?.();

      if(!engine) {
        const src = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        const osc = ctx.createOscillator();
        const whine = ctx.createGain();

        src.buffer = noise;
        src.loop = true;
        filter.type = 'lowpass';
        filter.Q.value = 0.8;
        amp.gain.value = 0.0001;
        osc.type = 'sawtooth';
        whine.gain.value = 0.0001;
        src.connect(filter).connect(amp).connect(master);
        osc.connect(whine).connect(master);
        src.start();
        osc.start();
        engine = { src, filter, amp, osc, whine };
      }

      const now = ctx.currentTime;
      const l = Math.max(0, Math.min(1, level));

      engine.filter.frequency.setTargetAtTime(250 + 1400 * l, now, 0.1);
      engine.amp.gain.setTargetAtTime(Math.max(0.0001, 1.1 * l), now, 0.12);
      engine.osc.frequency.setTargetAtTime(70 + 110 * l, now, 0.15);
      engine.whine.gain.setTargetAtTime(Math.max(0.0001, 0.05 * l), now, 0.12);

      if(l <= 0.001) {
        const e = engine;

        engine = null;
        e.src.stop(now + 1);
        e.osc.stop(now + 1);
      }

      return true;
    },

    // the gear comes down (true) or goes up (false): the doors, the pump, the air, the lock
    gear(down) {
      if(!ready()) return false;

      ctx.resume?.();

      const t = ctx.currentTime + 0.02;
      const long = SOUND.gear;

      thump(t, { gain: 0.6, low: 90 }); // the doors open, or the up-lock lets go
      hiss(t + 0.3, long - 0.9, { freq: down ? 500 : 900, to: down ? 900 : 500, gain: 0.35, attack: 0.8, release: 1 }); // the air
      tone(t + 0.35, long - 1.2, { from: down ? 150 : 260, to: down ? 270 : 150, gain: 0.16, attack: 0.5, release: 0.9, wobble: 7, filter: 1100 }); // the pump
      tone(t + 0.35, long - 1.2, { type: 'square', from: down ? 75 : 130, to: down ? 135 : 75, gain: 0.07, attack: 0.5, release: 0.9, wobble: 7, filter: 500 });
      thump(t + long - 1.1, { gain: 0.95, low: 60, size: 0.3 }); // the leg locks
      thump(t + long - 0.75, { gain: 0.5, low: 85, size: 0.18 }); // the doors close
      if(down) tone(t + long - 0.55, 0.12, { type: 'sine', from: 1600, to: 1600, gain: 0.05, attack: 0.005, release: 0.08, filter: 3000 }); // three greens

      return true;
    },

    // the flaps move to `notch` from `from`: the motor, a rumble of air, a click at the detent
    flaps(notch, from = 0) {
      if(!ready()) return false;

      ctx.resume?.();

      const t = ctx.currentTime + 0.02;
      const run = Math.max(0.5, Math.abs(notch - from) * SOUND.notch);
      const out = notch > from;

      thump(t, { gain: 0.22, low: 140, size: 0.08 }); // the lever's click
      tone(t + 0.1, run, { type: 'sawtooth', from: out ? 110 : 150, to: out ? 150 : 110, gain: 0.1, attack: 0.15, release: 0.25, wobble: 11, filter: 800 });
      hiss(t + 0.1, run, { type: 'bandpass', freq: 220, q: 0.6, gain: 0.3, attack: 0.2, release: 0.3 });
      thump(t + 0.1 + run, { gain: 0.35, low: 110, size: 0.1 }); // the stop

      return true;
    },

    // a bugle call in C major for a perfect landing: three quick notes, a rise, a held chord and a cymbal
    fanfare() {
      if(!ready()) return false;

      ctx.resume?.();

      const t = ctx.currentTime + 0.05;
      const hz = n => 261.63 * 2 ** (n / 12); // n semitones over middle C
      const brass = (at, n, length, gain = 0.16) => {
        for(const [detune, g] of [[0, 1], [0.004, 0.6]]) tone(at, length, { type: 'sawtooth', from: hz(n) * (1 + detune), to: hz(n) * (1 + detune), gain: gain * g, attack: 0.03, release: Math.min(0.3, length * 0.6), wobble: 5.5, filter: 1800 + n * 60 });
      };

      for(const [at, n, len] of [[0, 7, 0.13], [0.16, 7, 0.13], [0.32, 7, 0.13], [0.48, 12, 0.36], [0.9, 7, 0.16], [1.1, 12, 0.5]]) brass(t + at, n, len); // G G G C, G C
      for(const n of [12, 16, 19]) brass(t + 1.7, n, 1.3, 0.12); // the chord: C E G
      brass(t + 1.7, 0, 1.3, 0.16);
      hiss(t + 1.7, 1.4, { type: 'highpass', freq: 6000, gain: 0.18, attack: 0.01, release: 1.2 }); // the cymbal
      thump(t + 1.7, { gain: 0.5, low: 70, size: 0.3 });

      return true;
    },

    dispose() {
      engine = null;
      ctx?.close?.();
      ctx = null;
    },
  };

  return api;
}
