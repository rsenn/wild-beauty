// The width of a string in a text box face, from a canvas (browser) or a rough
// guess where there is none (tests, server). Used by the editor to break lines.
import { FONTS } from './text.js';

let context = null;

export function measureText(text, font, size, bold = false) {
  context ??= typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : false;

  if(!context) return String(text).length * size * 0.55;

  context.font = `${bold ? (FONTS[font] ?? FONTS.sans).bold : 400} ${size}px ${(FONTS[font] ?? FONTS.sans).stack}`;

  return context.measureText(String(text)).width;
}
