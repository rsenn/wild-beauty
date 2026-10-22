// Colour helpers for the palette: OKLab distance and the two padding colours
// of an "extended" photo (PLAN.md S6.2 step 5).

import { distance } from '../../client/color.js';

export { distance, oklab } from '../../client/color.js';

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
