import { useEffect, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { partsOf } from '../editor/core/pattern.js';

// The Place, Date and Time buttons of the note editors (docs/BATCH.md S6a2): they put what the
// server knows of the photo (place from its position, capture date and time) into the note at the
// cursor, so a picture can get a placeholder note to be written over later. Owner's tools: the
// answer of POST /api/photos/describe only exists for photos of the user's own nodes.

// -> { location, date, time } of the photo, '' where unknown, until the answer comes
export function useParts(hash, active = true) {
  const { lang } = useI18n();
  const [parts, setParts] = useState(null);

  useEffect(() => {
    if(!active || !hash) return;

    let live = true;

    fetch('/api/photos/describe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hashes: [hash] }) })
      .then(r => (r.ok ? r.json() : {}))
      .then(info => live && setParts(partsOf(info[hash], lang)))
      .catch(() => live && setParts(partsOf(null, lang)));

    return () => {
      live = false;
    };
  }, [hash, active]);

  return parts;
}

// `text` with `value` put in at the selection [from, to), a comma before it when text comes
// before; -> { text, at } with `at` the cursor behind the inserted value. Pure.
export function insertAt(text, from, to, value) {
  const before = text.slice(0, from);
  const glue = before.trim() && !/[\s,;:]$/.test(before) ? ', ' : '';
  const put = glue + value;

  return { text: before + put + text.slice(to), at: before.length + put.length };
}

// the buttons: each shows the value itself (the municipality, the date, the time) as its caption, so
// it is a clue for writing the note even when never pressed; pressing it calls `onPick(value)`. A value
// not known (yet) leaves the button disabled with the word Place, Date or Time. They keep the focus in
// the text field (a press must not blur it).
export const PartButtons = ({ parts, onPick }) => {
  const { t } = useI18n();

  return html`<span class="wb-note-parts" role="group" aria-label=${t('note.insert')}>
    ${[['location', 'place'], ['date', 'date'], ['time', 'time']].map(
      ([key, name]) => html`<button type="button" class="wb-editor-chip wb-note-part" disabled=${!parts?.[key]} title=${t(`note.insert.${name}`)} aria-label=${parts?.[key] ? `${t(`note.insert.${name}`)}: ${parts[key]}` : t(`note.insert.${name}`)} onPointerDown=${e => e.preventDefault()} onClick=${() => onPick(parts[key])}>${parts?.[key] || t(`note.insert.${name}`)}</button>`,
    )}
  </span>`;
};
