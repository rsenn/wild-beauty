// Edge decoration of a photo (EDITOR.md E123): `edge: { style, amount, seed }`.
// Pure geometry in the photo's own 1000 unit square, no filters: a clip polygon
// that shapes the picture (torn, paper), and shapes drawn under it (a rim, a
// frame, a shadow). The same seed always gives the same edge.

export const EDGE_STYLES = ['plain', 'paper', 'sticker', 'torn', 'polaroid'];
export const DEFAULT_EDGE = { style: 'plain', amount: 0.5, seed: 1 };

const SIDE = 1000;

// a small deterministic random generator (mulberry32) giving 0..1
export function rng(seed) {
  let a = Math.floor(seed) >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;

    let t = a;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = v => Math.round(v * 10) / 10;

// the square's outline walked clockwise from the top-left with a point every
// ~`step` units, each pushed outward by up to `amp` (rough edge); `inset` moves
// the whole outline inwards first. Outward is away from the square's centre.
function wobblySquare(random, { step, amp, inset = 0, smooth = 0 }) {
  const pts = [];
  const n = Math.max(2, Math.round(SIDE / step));
  const lo = inset;
  const hi = SIDE - inset;
  let drift = 0;
  const jitter = () => {
    // smooth > 0 blends with the previous offset, a slow wave instead of teeth
    drift = drift * smooth + (random() * 2 - 1) * amp * (1 - smooth);

    return drift;
  };

  for(let i = 0; i < n; i++) pts.push([lo + ((hi - lo) * i) / n, lo - jitter()]);
  for(let i = 0; i < n; i++) pts.push([hi + jitter(), lo + ((hi - lo) * i) / n]);
  for(let i = 0; i < n; i++) pts.push([hi - ((hi - lo) * i) / n, hi + jitter()]);
  for(let i = 0; i < n; i++) pts.push([lo - jitter(), hi - ((hi - lo) * i) / n]);

  return pts.map(([x, y]) => [round(x), round(y)]);
}

const rectPoints = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const shift = (pts, dx, dy) => pts.map(([x, y]) => [round(x + dx), round(y + dy)]);

// a rounded rectangle as a polygon (radius r, 6 segments per corner)
function roundedRect(x0, y0, x1, y1, r) {
  const rad = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const pts = [];
  const corner = (cx, cy, from) => {
    for(let k = 0; k <= 6; k++) {
      const a = from + (k / 6) * (Math.PI / 2);

      pts.push([round(cx + rad * Math.cos(a)), round(cy + rad * Math.sin(a))]);
    }
  };

  corner(x1 - rad, y0 + rad, -Math.PI / 2);
  corner(x1 - rad, y1 - rad, 0);
  corner(x0 + rad, y1 - rad, Math.PI / 2);
  corner(x0 + rad, y0 + rad, Math.PI);

  return pts;
}

const SHADOW = { fill: '#000000', opacity: 0.28 };
const PAPER = '#f4efe3';
const WHITE = '#fbfaf6';

// The decoration of one photo step: { clip, under, rim }
//  clip   polygon [[x, y], ...] the picture is cut to, or null (the plain square)
//  under  shapes drawn beneath the picture: { points, fill, opacity }
//  rim    for a sticker: the rim width, drawn around whatever the photo is clipped to
export function edgeShapes(edge) {
  const style = EDGE_STYLES.includes(edge?.style) ? edge.style : 'plain';
  const amount = Math.min(1, Math.max(0, Number.isFinite(edge?.amount) ? edge.amount : DEFAULT_EDGE.amount));
  const random = rng(Number.isFinite(edge?.seed) ? edge.seed : DEFAULT_EDGE.seed);

  if(style === 'paper') {
    const clip = wobblySquare(random, { step: 90, amp: 3 + amount * 9, smooth: 0.6 });

    return { clip, under: [{ points: shift(clip, 10 + amount * 8, 12 + amount * 10), ...SHADOW }], rim: 0 };
  }

  if(style === 'torn') {
    const clip = wobblySquare(random, { step: 16, amp: 6 + amount * 30, inset: 20 });
    const fibre = wobblySquare(random, { step: 12, amp: 8 + amount * 26, inset: 6 });

    return { clip, under: [{ points: shift(fibre, 8, 10), ...SHADOW }, { points: fibre, fill: PAPER, opacity: 1 }], rim: 0 };
  }

  if(style === 'sticker') {
    const radius = 20 + amount * 140;
    const clip = roundedRect(0, 0, SIDE, SIDE, radius);
    const rim = 24 + amount * 40;

    return { clip, under: [{ points: shift(roundedRect(-rim, -rim, SIDE + rim, SIDE + rim, radius + rim), 8, 12), ...SHADOW }, { points: roundedRect(-rim, -rim, SIDE + rim, SIDE + rim, radius + rim), fill: WHITE, opacity: 1 }], rim };
  }

  if(style === 'polaroid') {
    const side = 50 + amount * 40;
    const bottom = 150 + amount * 120;
    const frame = rectPoints(-side, -side, SIDE + side, SIDE + bottom);

    return { clip: null, under: [{ points: shift(frame, 10, 14), ...SHADOW }, { points: frame, fill: WHITE, opacity: 1 }], rim: 0 };
  }

  return { clip: null, under: [], rim: 0 };
}

// the points as an SVG path 'M..L..Z'
export const pathOf = points => `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
