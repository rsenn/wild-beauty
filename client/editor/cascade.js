// Where a photo lands on the stage when it is added (EDITOR.md E112,
// UX-REQUIREMENTS.md I2): a half-stage square, each photo of a page stepped 10 %
// of the stage down and to the right of the one before, the last on top, so every
// edge shows and it is plain that the photos are layers. After six the cascade
// wraps to the top left again, shifted 3 % per round so it does not sit exactly
// on the first photo. Pure; `i` is the number of photos the page already has.
const STAGE = 1000;

export const SIZE = 0.5; // of the stage
export const STEP = 0.1; // of the stage, per photo
export const ROUND = 0.03; // of the stage, per completed round
export const PER_ROUND = Math.round((1 - SIZE) / STEP) + 1; // 6

// the matrix of the i-th photo of a page
export function cascade(i) {
  const n = Number.isInteger(i) && i > 0 ? i : 0;
  const offset = Math.min(STAGE * (1 - SIZE), STAGE * ((n % PER_ROUND) * STEP + Math.floor(n / PER_ROUND) * ROUND));

  return [SIZE, 0, 0, SIZE, offset, offset];
}

// how many photos a page already shows: pictures, not textures (those are not drawn)
export const photosOnPage = page => page.steps.filter(step => step.op === 'photo' && step.role !== 'texture').length;
