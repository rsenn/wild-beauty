// Step playback (EDITOR.md S2.7, E56). A page shows its steps 0..k; playing
// advances k from 0 to the step count over the page's `duration` (seconds).
export const STEP_SECONDS = 0.5; // per step, when the page has no duration of its own
export const MAX_SECONDS = 60;

// seconds a page takes to play
export const durationOf = (page, count = page.steps.length) => {
  const d = Number(page.duration);

  return Number.isFinite(d) && d > 0 ? Math.min(d, MAX_SECONDS) : Math.max(count * STEP_SECONDS, STEP_SECONDS);
};

// the k reached `elapsed` seconds into playback of `count` steps over `seconds`
export const stepAt = (elapsed, count, seconds) => Math.min(count, Math.max(0, Math.floor((elapsed / seconds) * (count + 1))));

// the position `k` is shown at: missing, or at or past the end, is the whole page
export const clampK = (k, count) => (k === null || k === undefined || !(k < count) ? count : Math.max(0, Math.trunc(k)));

// easing of a `transform` step: t 0..1 -> 0..1; unknown names are 'inOut'
export const EASES = {
  linear: t => t,
  in: t => t * t,
  out: t => t * (2 - t),
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
};

export const ease = (name, t) => (EASES[name] ?? EASES.inOut)(Math.min(1, Math.max(0, t)));

// the position reached `elapsed` seconds into playback: 0..count, fractional,
// so a transform step between whole numbers is part way through its move
export const positionAt = (elapsed, count, seconds) => Math.min(count, Math.max(0, (elapsed / seconds) * count));
