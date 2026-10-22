// Colour helpers for the palette: OKLab distance and the two padding colours
// of an "extended" photo (PLAN.md S6.2 step 5).

const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

// "#rrggbb" -> [L, a, b] (Ottosson's OKLab)
export function oklab(hex) {
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

export const distance = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));

// the most dominant colour plus the next one that is clearly different from
// it; when nothing differs enough, the farthest one (or the colour twice)
export function choosePadding(palette, minDistance = 0.12) {
  if(!palette.length) return null;

  const first = palette[0].hex;
  const rest = palette.slice(1).map(c => c.hex);
  const far = rest.find(hex => distance(first, hex) >= minDistance);
  const farthest = rest.reduce((best, hex) => (!best || distance(first, hex) > distance(first, best) ? hex : best), null);

  return [first, far ?? farthest ?? first];
}
