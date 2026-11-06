import { html } from '../html.js';
import { hasBody, paragraphsOf } from '../editor/core/caption.js';

// A note as the visitor reads it (docs/GALLERY.md S5c): plain text, a blank line starts a
// paragraph, a single line break stays; when the note has more than one line the first line is
// its title and is drawn as a heading. No markup is ever interpreted.
export const NoteText = ({ text }) => {
  const heading = hasBody(text);

  return html`<div class="wb-note-text">
    ${paragraphsOf(text).map(
      (lines, p) => html`<p>${lines.map((line, i) => html`${i > 0 && html`<br />`}${heading && p === 0 && i === 0 ? html`<strong class="wb-note-title">${line}</strong>` : line}`)}</p>`,
    )}
  </div>`;
};
