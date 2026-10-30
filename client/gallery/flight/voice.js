// A synthesised voice for the callouts (callouts.js): the browser's speech synthesis, set up to
// sound flat and clipped like a cockpit warning, a female English voice when the device has one.
// The words are English whatever the page's language, as in the cockpit. No synthesis, no voice.
//
//   const v = makeVoice();  v.say('fifty');  v.say('pull up', { urgent: true });  v.cancel()

export const VOICE = { rate: 1.05, pitch: 0.9, volume: 1 };

// the preferred voice: English, and a woman's by name if any is known
const WOMEN = /female|samantha|zira|hazel|fiona|susan|karen|moira|serena|victoria|google uk english female|google us english/i;

export function pick(voices) {
  const english = voices.filter(v => /^en(-|_|$)/i.test(v.lang));

  return english.find(v => WOMEN.test(v.name)) ?? english.find(v => /^en-gb/i.test(v.lang)) ?? english[0] ?? null;
}

export function makeVoice({ synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance } = {}) {
  let voice;

  return {
    available: !!(synth && Utterance),

    // `urgent` drops what is still being said: a warning does not wait behind the callouts
    say(words, { urgent = false } = {}) {
      if(!synth || !Utterance) return false;

      voice ??= pick(synth.getVoices?.() ?? []);

      if(urgent) synth.cancel();

      const u = new Utterance(words);

      u.lang = voice?.lang ?? 'en-US';
      if(voice) u.voice = voice;
      u.rate = VOICE.rate;
      u.pitch = VOICE.pitch;
      u.volume = VOICE.volume;
      synth.speak(u);

      return true;
    },

    cancel() {
      synth?.cancel();
    },
  };
}
