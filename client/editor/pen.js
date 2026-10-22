// Ink pen maths (EDITOR.md S4 "Ink pen", E10-E12): smoothing, resampling,
// width model and outline. Pure functions on [x, y, ...] arrays; times in
// seconds.
import { getStroke } from '../../vendor/perfect-freehand.js';

// One-Euro filter (Casiez, Roussel, Vogel 2012): a low-pass filter whose
// cutoff rises with the speed of the signal, so a slow hand is smoothed hard
// (jitter gone) and a fast one hardly at all (no lag). `minCutoff` (Hz) is
// the cutoff at rest, `beta` how fast it grows with speed, `dCutoff` (Hz)
// smooths the speed estimate. Returns `filter(x, t)` for one scalar signal.
export function oneEuro(minCutoff = 1, beta = 0, dCutoff = 1) {
  let t0;
  let x0;
  let dx0 = 0;

  const alpha = (cutoff, dt) => 1 / (1 + 1 / (2 * Math.PI * cutoff) / dt);

  return function filter(x, t) {
    if(t0 === undefined) {
      t0 = t;
      x0 = x;

      return x;
    }

    const dt = t - t0;

    // same instant or out of order: nothing new to learn
    if(!(dt > 0)) return x0;

    dx0 += alpha(dCutoff, dt) * ((x - x0) / dt - dx0);
    x0 += alpha(minCutoff + beta * Math.abs(dx0), dt) * (x - x0);
    t0 = t;

    return x0;
  };
}

// the filter for a 2D point: `filter(x, y, t)` -> [x, y]
export function oneEuroPoint(minCutoff, beta, dCutoff) {
  const fx = oneEuro(minCutoff, beta, dCutoff);
  const fy = oneEuro(minCutoff, beta, dCutoff);

  return (x, y, t) => [fx(x, t), fy(y, t)];
}

// Resample a polyline at a fixed arc length (E11). Points are [x, y, ...rest]
// (rest: pressure, time, ...), and `rest` is interpolated linearly. The first
// and the last point are kept, so every gap is exactly `spacing` except the
// final one, which is the remainder and never longer. Repeated points are
// skipped.
export function resample(points, spacing) {
  if(points.length < 2 || !(spacing > 0)) return points.map(p => p.slice());

  const out = [points[0].slice()];
  let prev = points[0];
  let need = spacing; // distance still to travel before the next output point

  for(let i = 1; i < points.length; i++) {
    const next = points[i];
    let length = Math.hypot(next[0] - prev[0], next[1] - prev[1]);

    if(!length) continue;

    let from = prev;
    let done = 0;

    while(length - done >= need) {
      done += need;

      const f = done / length;

      out.push(from.map((v, k) => v + (next[k] - v) * f));
      need = spacing;
    }

    need -= length - done;
    prev = next;
  }

  const last = points.at(-1);
  const end = out.at(-1);

  if(end[0] !== last[0] || end[1] !== last[1]) out.push(last.slice());

  return out;
}

// Width model (E11): width = base * f(pressure) * g(speed).
// f rises from 0.5 to 1.5 with pressure 0..1, so the 0.5 a mouse or a
// pressure-less pen reports gives exactly `base`; no pressure (0 or missing)
// is treated the same. g falls with speed in stage units per second, from 1
// at rest towards 0.4: a fast flick is thin, a slow stroke full.
const SPEED_REF = 1000;

export function width(pressure, speed, base = 1) {
  const p = pressure > 0 ? Math.min(pressure, 1) : 0.5;
  const g = 0.4 + 0.6 / (1 + Math.max(speed, 0) / SPEED_REF);

  return base * (0.5 + p) * g;
}

// first-order low-pass with a time constant `tau` seconds: `step(x, dt)`
export function lowPass(tau) {
  let y;

  return (x, dt) => {
    if(y === undefined) return (y = x);

    y += (dt > 0 ? 1 - Math.exp(-dt / tau) : 0) * (x - y);

    return y;
  };
}

// width of every point of a stroke of [x, y, pressure, t] samples (t in
// seconds): the speed between neighbours, low-passed so the width does not
// jitter
export function strokeWidths(points, base = 1, tau = 0.05) {
  const smooth = lowPass(tau);
  let speed = 0;

  return points.map((p, i) => {
    if(i > 0) {
      const q = points[i - 1];
      const dt = p[3] - q[3];

      if(dt > 0) speed = smooth(Math.hypot(p[0] - q[0], p[1] - q[1]) / dt, dt);
    }

    return width(p[2], speed, base);
  });
}

// Outline (E12): the closed polygon around a stroke, with the width of every
// point, from the vendored perfect-freehand. The points are already smoothed
// and resampled (the stroke stores them), so its own streamlining is off and
// pressure simulation is off; our widths go in as pressure. With thinning 1
// the diameter at a point is size * 2 * pressure, hence p = w / (2 * size)
// for size = the largest width. Round caps. -> [[x, y], ...]
export function outline(points, widths, { smoothing = 0.5 } = {}) {
  if(!points.length) return [];

  const size = Math.max(...widths);

  if(!(size > 0)) return [];

  return getStroke(
    points.map((q, i) => [q[0], q[1], widths[i] / (2 * size)]),
    { size, thinning: 1, smoothing, streamline: 0, simulatePressure: false, last: true },
  );
}

// the polygon as an SVG path string: quadratic curves through the midpoints
// of its edges, coordinates to 0.1 unit, closed. '' for an empty outline.
export function outlinePath(polygon) {
  const n = polygon.length;

  if(n < 3) return '';

  const r = v => Math.round(v * 10) / 10;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = mid(polygon[n - 1], polygon[0]);
  let d = `M${r(first[0])} ${r(first[1])}`;

  for(let i = 0; i < n; i++) {
    const c = polygon[i];
    const m = mid(c, polygon[(i + 1) % n]);

    d += `Q${r(c[0])} ${r(c[1])} ${r(m[0])} ${r(m[1])}`;
  }

  return d + 'Z';
}

// a stroke's [x, y, pressure, t] samples -> path string, through the whole
// pen pipeline: resample, widths, outline
export function strokePath(samples, base = 8, spacing = 4) {
  const points = resample(samples, spacing);

  return outlinePath(outline(points, strokeWidths(points, base)));
}
