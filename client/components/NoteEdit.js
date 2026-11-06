import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { NOTE_MAX } from '../editor/core/caption.js';
import { errorKey } from '../editor/io/save.js';
import { NoteText } from './NoteText.js';
import { PartButtons, insertAt, useParts } from './NoteParts.js';

// The owner's tools for the note of the picture on show (docs/GALLERY.md S5c). They are loaded
// only for the owner of a node (a dynamic import in GalleryViews.js), so visitors never fetch
// them. `NoteAdd` is the small scroll-and-stylus button under a picture without a note; the
// picture stays centred until the field is opened. `NoteEdit` is the note itself: a tap on the
// text opens a multi-line field right there; leaving the field keeps the text, Ctrl+Enter keeps it
// and goes to the next picture, Escape throws the change away. The text goes to the server by
// the caption saver (a second after the last key, one request at a time); `status` is what it
// last said.

// a parchment scroll with a stylus, as a small icon that takes the colour of its button
export const NoteIcon = () => html`
  <svg class="wb-note-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 5a2 2 0 0 1 2-2h9v12.5M5 5v11a3 3 0 0 0 3 3h5M9 8h4M9 11.5h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M14.5 19.5l5.8-5.8a1.4 1.4 0 0 1 2 2l-5.8 5.8-2.7.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

export const NoteAdd = ({ onClick }) => {
  const { t } = useI18n();

  return html`<button type="button" class="wb-note-add" title=${t('note.add')} aria-label=${t('note.add')} onClick=${onClick}><${NoteIcon} /></button>`;
};

export const NoteEdit = ({ text, hash, label, status, editing, setEditing, onCommit, onNext, onRetry }) => {
  const { t } = useI18n();
  const [draft, setDraft] = useState(text);
  const box = useRef(null);
  const cancelled = useRef(false);
  const parts = useParts(hash, editing);
  const active = useRef(false); // the field is open: closing it twice (Ctrl+Enter, then the blur of the field going away) keeps the text once

  // the field grows with its text
  const fit = () => {
    const el = box.current;

    if(el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  // the field opens from a tap on the text, from the add button or by Ctrl+Enter on the picture before
  useEffect(() => {
    if(editing) {
      cancelled.current = false;
      active.current = true;
      setDraft(text);
      fit();
    }
  }, [editing]);

  // the field has the focus the moment it is in the page, so what is typed right after the tap is not lost
  const grab = el => {
    box.current = el;

    if(el && !el.dataset.grabbed) {
      el.dataset.grabbed = '1';
      el.focus();
    }
  };

  // the Place, Date and Time buttons put their value in at the cursor and leave the field open
  const pick = value => {
    const el = box.current;
    const r = insertAt(draft, el?.selectionStart ?? draft.length, el?.selectionEnd ?? draft.length, value);

    setDraft(r.text);
    requestAnimationFrame(() => {
      fit();
      el?.setSelectionRange(r.at, r.at);
    });
  };

  const open = () => setEditing(true);

  const close = keep => {
    if(!active.current) return;

    active.current = false;

    if(keep && draft.trim() !== text.trim()) onCommit(draft.trim());

    setEditing(false);
  };

  const state = status && (status.status === 'error' ? t(errorKey(status.code)) : status.status === 'saving' ? t('note.saving') : t('note.saved'));

  return html`
    <div class="wb-note">
      ${editing
        ? html`<div class="wb-note-form">
            <textarea
              ref=${grab}
              class="wb-note-input"
              rows="4"
              maxlength=${NOTE_MAX}
              value=${draft}
              aria-label=${label}
              placeholder=${t('note.placeholder')}
              onInput=${e => (setDraft(e.target.value), fit())}
              onBlur=${() => (cancelled.current ? ((cancelled.current = false), (active.current = false), setEditing(false)) : close(true))}
              onKeyDown=${e => {
                e.stopPropagation(); // typing never pages the carousel

                if(e.key === 'Escape') {
                  e.preventDefault();
                  cancelled.current = true;
                  box.current?.blur();
                } else if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  close(true);
                  onNext?.();
                }
              }}
            />
            <p class="wb-note-meta"><span>${t('note.hint')}</span><span class="wb-note-count">${draft.length} / ${NOTE_MAX}</span></p>
            ${hash && html`<${PartButtons} parts=${parts} onPick=${pick} />`}
          </div>`
        : html`<div class="wb-note-view" role="button" tabindex="0" title=${t('note.edit')} aria-label=${`${t('note.edit')}: ${label}`} onClick=${open} onKeyDown=${e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}><${NoteText} text=${text} /></div>`}
      ${state && html`<p class=${'wb-note-status' + (status.status === 'error' ? ' wb-note-error' : '')} role="status">${state}${status.status === 'error' && html` <button type="button" class="wb-editor-chip" onClick=${onRetry}>${t('note.retry')}</button>`}</p>`}
    </div>
  `;
};
