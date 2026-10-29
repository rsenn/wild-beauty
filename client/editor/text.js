// Text boxes (EDITOR.md S2.3b, E88-E93): the faces, line breaking and the box
// size. A box's local space has its top-left corner at (0, 0), the box is `w`
// wide and `h` high, and `m` places it on the stage like a photo's matrix.
// Pure: the width of a string comes from an injected `measure(text, font, size)`.

// the faces by role id; the ids name the role, not the file, so the faces can
// change later without touching saved nodes. `stack` goes to the font-family.
export const FONTS = {
  fixed: { stack: 'Fixed, monospace', bold: 500, asc: 0.75, desc: 0.25, cap: 0.703 },
  serif: { stack: '"EB Garamond", Garamond, Georgia, serif', bold: 700, asc: 1.007, desc: 0.298, cap: 0.656 },
  sans: { stack: 'Jost, Futura, "Century Gothic", "Helvetica Neue", Arial, sans-serif', bold: 700, asc: 1.07, desc: 0.375, cap: 0.703 },
  display: { stack: '"Archivo Black", Impact, "Arial Black", sans-serif', bold: 400, asc: 0.878, desc: 0.21, cap: 0.703 },
};

export const FONT_IDS = Object.keys(FONTS);
export const DEFAULT_FONT = 'sans';

export const LIMITS = { size: [8, 400], padding: [0, 100], width: [20, 2000], outline: [0, 40] };

export const LINE_HEIGHT = 1.2;

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));

export const clampSize = v => clamp(Number.isFinite(v) ? v : 48, LIMITS.size);
export const clampWidth = v => clamp(Number.isFinite(v) ? v : 600, LIMITS.width);

// break `text` into lines no wider than `width` (units), keeping explicit
// newlines; a word wider than the line is broken by characters
export function wrap(text, measure, width) {
  const lines = [];

  for(const paragraph of String(text).split('\n')) {
    let line = '';

    for(const word of paragraph.split(/(?<=\s)/)) {
      const tryLine = line + word;

      if(line === '' || measure(tryLine.trimEnd()) <= width) {
        line = tryLine;
        continue;
      }

      lines.push(line.trimEnd());
      line = word;
    }

    // a single word that does not fit: split it by characters
    while(line.length > 1 && measure(line.trimEnd()) > width) {
      let cut = line.length - 1;

      while(cut > 1 && measure(line.slice(0, cut)) > width) cut--;

      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }

    lines.push(line.trimEnd());
  }

  return lines;
}

// `asc`, `desc` and `cap` are the face's ascent, descent and capital height in
// em (what the browser reports for the font file): the text is placed by them,
// so the space above the capitals equals the space below the last baseline

// The y of the first baseline in a box `h` high with `count` lines of `size`:
// the block from the top of the first capitals to the last baseline is centred.
export function firstBaseline(face, count, size, h) {
  const ink = (Math.max(1, count) - 1) * size * LINE_HEIGHT + face.cap * size;

  return (h - ink) / 2 + face.cap * size;
}

// the height of a box with `count` lines
export const boxHeight = (count, size, padding = 0) => Math.max(1, count) * size * LINE_HEIGHT + padding * 2;

// Is the text right-to-left? The first strong letter decides, as for a textarea
// with dir="auto" (Hebrew, Arabic, Syriac, Thaana and the presentation forms).
const RTL = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/u;
const LTR = /\p{L}/u;

export function isRtl(text) {
  for(const ch of String(text ?? '')) {
    if(RTL.test(ch)) return true;
    if(LTR.test(ch)) return false;
  }

  return false;
}

// the x of a line's start inside a box for an alignment (logical: `start` / `center` / `end`);
// in right-to-left text the start is the right edge
export const alignX = (align, w, padding = 0, rtl = false) => (align === 'center' ? w / 2 : (align === 'end') !== rtl ? w - padding : padding);

// the text-anchor for an alignment
export const anchorOf = align => (align === 'center' ? 'middle' : align === 'end' ? 'end' : 'start');

// what a box needs after its text, font, size, width or padding changed
export function layout(step, measure) {
  const size = clampSize(step.size);
  const padding = clamp(step.padding ?? 0, LIMITS.padding);
  const w = clampWidth(step.w);
  const lines = wrap(step.text, text => measure(text, step.font ?? DEFAULT_FONT, size, step.bold), w - padding * 2);

  // a fixed box keeps its height, whatever the text needs
  return { lines, h: step.fixed && Number.isFinite(step.h) && step.h > 0 ? step.h : boxHeight(lines.length, size, padding) };
}
