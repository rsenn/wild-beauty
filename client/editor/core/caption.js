import { LIMITS } from './model.js';

// The notes of photos are plain text (docs/GALLERY.md S5c): paragraphs are separated by blank
// lines, single line breaks stay. The first line is the note's title wherever only a short
// caption has room (album tiles, the 3D gallery, `alt` and tooltips).

// the first line of a note, cut at `max` characters with an ellipsis; '' for no note
export function titleOf(text, max = 100) {
  const line = String(text ?? '').split(/\r?\n/).find(l => l.trim()) ?? '';
  const one = line.trim().replace(/\s+/g, ' ');

  return one.length > max ? one.slice(0, max - 1).trimEnd() + '…' : one;
}

// a note as paragraphs, each a list of lines: [['A title', 'second line'], ['Next paragraph']]
export const paragraphsOf = text =>
  String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.split('\n').map(l => l.trimEnd()).filter((l, i, all) => l || i < all.length - 1))
    .filter(p => p.some(l => l.trim()));

// has the note more than its first line: then the first line is drawn as a heading
export const hasBody = text => String(text ?? '').split(/\r?\n/).filter(l => l.trim()).length > 1;

export const NOTE_MAX = LIMITS.desc;
