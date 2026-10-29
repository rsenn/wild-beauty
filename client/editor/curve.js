// A curved text baseline (E130): one cubic Bezier { p0, c0, c1, p1 } in the text
// box's own space. Pure. The rules keep the text legible: at most 180 degrees of
// turning, each handle points towards the other end and is no longer than the
// chord, one bend only (no S), radius of curvature at least MIN_RADIUS x size.
export const MIN_RADIUS = 1.5;
export const SNAP_DEG = 4;

const STEPS = 48;
const isPoint = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

export const isCurve = v => !!v && typeof v === 'object' && ['p0', 'c0', 'c1', 'p1'].every(k => isPoint(v[k]));

const at = (c, t) => {
  const u = 1 - t;
  const [a, b, d, e] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];

  return [a * c.p0[0] + b * c.c0[0] + d * c.c1[0] + e * c.p1[0], a * c.p0[1] + b * c.c0[1] + d * c.c1[1] + e * c.p1[1]];
};

const deriv = (c, t) => {
  const u = 1 - t;
  const [a, b, d] = [3 * u * u, 6 * u * t, 3 * t * t];

  return [a * (c.c0[0] - c.p0[0]) + b * (c.c1[0] - c.c0[0]) + d * (c.p1[0] - c.c1[0]), a * (c.c0[1] - c.p0[1]) + b * (c.c1[1] - c.c0[1]) + d * (c.p1[1] - c.c1[1])];
};

const second = (c, t) => {
  const u = 1 - t;

  return [0, 1].map(i => 6 * (u * (c.c1[i] - 2 * c.c0[i] + c.p0[i]) + t * (c.p1[i] - 2 * c.c1[i] + c.c0[i])));
};

// the arc length, by sampling
export function curveLength(c) {
  let len = 0;
  let prev = c.p0;

  for(let i = 1; i <= STEPS; i++) {
    const p = at(c, i / STEPS);

    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }

  return len;
}

// the smallest radius of curvature along the curve (Infinity when straight)
export function minRadius(c) {
  let min = Infinity;

  for(let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const [dx, dy] = deriv(c, t);
    const [ex, ey] = second(c, t);
    const k = Math.abs(dx * ey - dy * ex) / Math.pow(dx * dx + dy * dy || 1, 1.5);

    if(k > 1e-9) min = Math.min(min, 1 / k);
  }

  return min;
}

// the total turning of the tangent, in degrees; null for a cusp or an S bend
export function turning(c) {
  let total = 0;
  let sign = 0;
  let prev = null;

  for(let i = 0; i <= STEPS; i++) {
    const [dx, dy] = deriv(c, i / STEPS);

    if(!dx && !dy) return null;

    const a = Math.atan2(dy, dx);

    if(prev !== null) {
      let d = a - prev;

      while(d > Math.PI) d -= 2 * Math.PI;
      while(d < -Math.PI) d += 2 * Math.PI;

      if(Math.abs(d) > 1e-6) {
        if(sign && Math.sign(d) !== sign) return null;

        sign = Math.sign(d);
      }

      total += d;
    }

    prev = a;
  }

  return Math.abs(total) * (180 / Math.PI);
}

// is this curve allowed for text of this size?
export function legal(c, size) {
  if(!isCurve(c)) return false;

  const chord = [c.p1[0] - c.p0[0], c.p1[1] - c.p0[1]];
  const len = Math.hypot(chord[0], chord[1]);

  if(len < size) return false;

  for(const [from, to] of [[c.p0, c.c0], [c.p1, c.c1]]) {
    const h = [to[0] - from[0], to[1] - from[1]];
    const dir = from === c.p0 ? 1 : -1;

    if(Math.hypot(h[0], h[1]) > len + 1e-6 || dir * (h[0] * chord[0] + h[1] * chord[1]) < -1e-6) return false;
  }

  const turn = turning(c);

  return turn !== null && turn <= 180 + 1e-6 && minRadius(c) >= MIN_RADIUS * size - 1e-6;
}

// a symmetric curve over a chord of this length: bend in -1..1 (positive curves
// the ends down, like a smile), 0 is straight. Reduced until it is legal.
export function bendCurve(chord, bend, size) {
  const make = b => {
    const a = Math.max(-1, Math.min(1, b)) * (Math.PI / 2);
    const h = chord / 3;

    return { p0: [0, 0], c0: [h * Math.cos(a), h * Math.sin(a)], c1: [chord - h * Math.cos(a), h * Math.sin(a)], p1: [chord, 0] };
  };

  if(Math.abs(bend) * 90 < SNAP_DEG) return null;

  let b = bend;

  for(let i = 0; i < 12 && !legal(make(b), size); i++) b *= 0.8;

  return legal(make(b), size) ? make(b) : null;
}

// how much a symmetric curve bends, -1..1 (for the slider)
export function bendOf(c) {
  if(!isCurve(c)) return 0;

  return Math.atan2(c.c0[1] - c.p0[1], c.c0[0] - c.p0[0]) / (Math.PI / 2);
}

// the SVG path data for <textPath>
export const curvePath = c => `M${c.p0[0]} ${c.p0[1]}C${c.c0[0]} ${c.c0[1]} ${c.c1[0]} ${c.c1[1]} ${c.p1[0]} ${c.p1[1]}`;

// the font size that makes `width` of text fit the curve, but not below `min`
export const fitSize = (size, width, c, min = 8) => {
  const len = curveLength(c);

  return width > len ? Math.max(min, (size * len) / width) : size;
};
