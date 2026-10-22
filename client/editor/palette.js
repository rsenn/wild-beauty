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

// D1-D4 from a stored palette ([{ hex, weight }] heaviest first): colours a
// kept one is closer than MIN_DISTANCE to are skipped, then the skipped ones and
// lightness steps of D1 fill up to four
export function dominant(palette, count = 4) {
  const kept = [];
  const skipped = [];

  for(const { hex } of palette ?? []) (kept.every(k => distance(k, hex) >= MIN_DISTANCE) ? kept : skipped).push(hex);

  const out = [...kept, ...skipped].slice(0, count);

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

// the node's own colours when it has no photo (theme tokens read by the caller)
export function swatches(palette, fallback = []) {
  const d = dominant(palette);
  const own = d.length ? d : dominant([...fallback, ...BASIC].map(hex => ({ hex })));

  return derive(own);
}
