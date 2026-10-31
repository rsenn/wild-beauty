// The eight-swatch palette (EDITOR.md S2.3a, E85 + E86): D1-D4 are the dominant
// colours of a reference photo, T1 T2 R N are derived from them on the OKLCH
// hue circle. Pure functions over '#rrggbb' strings.
import { distance, fromOklch, toOklch } from '../color.js';

export const MIN_DISTANCE = 0.08; // OKLab, below this two colours count as the same
const GREY = 0.02; // OKLCH chroma under which a colour has no hue
const WASHED = 0.05;
const DIRTY_L = 0.35;
const DIRTY_C = 0.09;

const wrap = h => ((h % 360) + 360) % 360;
const hueGap = (a, b) => {
  const d = Math.abs(wrap(a) - wrap(b));

  return Math.min(d, 360 - d);
};

// the colour turned by `deg` on the hue circle, lightness and chroma kept; an
// achromatic one has no hue, so its lightness is inverted instead
export function complement(hex, deg = 180) {
  const [L, C, h] = toOklch(hex);

  return C < GREY ? fromOklch([1 - L, C, h]) : fromOklch([L, C, wrap(h + deg)]);
}

// D1-D4 from a stored palette ([{ hex, weight }] heaviest first). D1 is the heaviest;
// each next one is the colour that adds most to the picture: far from those kept
// (OKLab distance, at least MIN_DISTANCE), vivid rather than dull and not negligible in
// weight, so a purple flower or a yellow phone wins over a third shade of dark
// background. Fewer than four left: the skipped ones, then lightness steps of D1.
export function dominant(palette, count = 4) {
  const rest = (palette ?? []).map(({ hex, weight }, i, all) => ({ hex, weight: weight ?? 1 / all.length, chroma: toOklch(hex)[1] }));
  const kept = rest.splice(0, 1);
  const skipped = [];

  while(kept.length < count && rest.length) {
    let best = -1;
    let top = 0;

    rest.forEach((c, i) => {
      const gap = Math.min(...kept.map(k => distance(k.hex, c.hex)));
      const score = gap < MIN_DISTANCE ? 0 : gap * (1 + 4 * c.chroma) * c.weight ** 0.25;

      if(score > top) {
        top = score;
        best = i;
      }
    });

    if(best < 0) break;

    kept.push(...rest.splice(best, 1));
  }

  skipped.push(...rest);

  const out = [...kept, ...skipped].map(c => c.hex).slice(0, count);

  if(!out.length) return out;

  const [L, C, h] = toOklch(out[0]);

  for(let step = 1; out.length < count && step < 20; step++) {
    const l = Math.min(0.95, Math.max(0.05, L + (step % 2 ? 1 : -1) * Math.ceil(step / 2) * 0.15));
    const hex = fromOklch([l, C, h]);

    if(out.every(o => distance(o, hex) >= MIN_DISTANCE)) out.push(hex);
  }

  while(out.length < count) out.push(out[out.length - 1]);

  return out;
}

// the pair of dominants whose hues are closest to 60 degrees apart (at least
// 20), as indexes; D1 and D2 when none qualifies
export function tetradicPair(d) {
  let best = [0, 1];
  let off = Infinity;

  for(let i = 0; i < d.length; i++)
    for(let j = i + 1; j < d.length; j++) {
      const [, ci, hi] = toOklch(d[i]);
      const [, cj, hj] = toOklch(d[j]);

      if(ci < GREY || cj < GREY) continue;

      const gap = hueGap(hi, hj);

      if(gap >= 20 && Math.abs(gap - 60) < off) {
        off = Math.abs(gap - 60);
        best = [i, j];
      }
    }

  return best;
}

// the colour that completes a triadic wheel with a and b: the midpoint of the
// larger hue arc between them, lightness and chroma the mean of both
export function triadic(a, b) {
  const [La, Ca, ha] = toOklch(a);
  const [Lb, Cb, hb] = toOklch(b);
  const arc = wrap(hb - ha); // from a to b going up
  const mid = arc >= 180 ? wrap(ha + arc / 2) : wrap(hb + (360 - arc) / 2);

  return fromOklch([(La + Lb) / 2, (Ca + Cb) / 2, mid]);
}

// N: the complement of the heaviest colour, or black / white when that one is
// washed out or a dirty dark
export function neutral(d1) {
  const [L, C] = toOklch(d1);

  if(C < WASHED || (L < DIRTY_L && C < DIRTY_C)) return L > 0.5 ? '#000000' : '#ffffff';

  return complement(d1);
}

// the eight swatches { D: [4], T: [2], R, N } in display order too: `all`
export function derive(d) {
  const [a, b] = tetradicPair(d);
  const rest = d.filter((_, i) => i !== a && i !== b);
  const T = [complement(d[a]), complement(d[b])];
  const R = triadic(rest[0] ?? d[a], rest[1] ?? d[b]);
  const N = neutral(d[0]);

  return { D: d, T, R, N, all: [...d, ...T, R, N] };
}

const BASIC = ['#d33f2f', '#2f6fd3', '#2fa35a', '#e8b923'];

// colours that stand out from the picture: black, white and a hue wheel in a
// light and a dark step, picked one at a time for the largest distance to the
// scene's dominant colours and to those already picked
const CANDIDATES = ['#000000', '#ffffff', ...[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].flatMap(h => [fromOklch([0.85, 0.17, h]), fromOklch([0.45, 0.17, h])])];

export function contrast(scene, count = 6) {
  const against = dominant(scene, 6);
  const out = [];

  for(let n = 0; n < count; n++) {
    let best = null;
    let far = -1;

    for(const hex of CANDIDATES) {
      if(out.includes(hex)) continue;

      const gap = Math.min(...[...against, ...out].map(c => distance(c, hex)), 1);

      if(gap > far) {
        far = gap;
        best = hex;
      }
    }

    if(best) out.push(best);
  }

  return out;
}

// the node's own colours when it has no photo (theme tokens read by the caller);
// `contrast` stands out from the scene whatever the swatches are
export function swatches(palette, fallback = []) {
  const d = dominant(palette);
  const own = d.length ? d : dominant([...fallback, ...BASIC].map(hex => ({ hex })));

  return { ...derive(own), contrast: contrast(d.length ? palette : [...fallback, ...BASIC].map(hex => ({ hex }))) };
}

// the colours the node already uses (strokes, shapes, text, the ground), the
// most used first, as lower-case '#rrggbb'; at most `count`
export function usedColours(doc, count = 8) {
  const seen = new Map();
  const add = v => {
    const hex = typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v.slice(0, 7).toLowerCase() : null;

    if(hex) seen.set(hex, (seen.get(hex) ?? 0) + 1);
  };

  add(doc.bg);

  for(const page of doc.pages)
    for(const step of page.steps) {
      if(step.op === 'stroke') add(step.color);
      else if(step.op === 'shape') (add(step.fill), add(step.stroke));
      else if(step.op === 'text') (add(step.color), add(step.bg), add(step.outline?.color));
    }

  return [...seen].sort((a, b) => b[1] - a[1]).slice(0, count).map(([hex]) => hex);
}
