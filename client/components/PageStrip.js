import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { renderNode } from '../editor/render.js';

// The page strip under the editor (EDITOR.md S2.7, E55): one thumbnail per
// page, the current one pressed. Click switches, drag (or ◀ ▶) reorders, the
// minus removes (the editor asks first when the page has steps), the plus adds.
export const PageStrip = ({ t, doc, photos, current, onSelect, onAdd, onMove, onRemove }) => {
  const [drag, setDrag] = useState(null);
  const only = doc.pages.length === 1;

  return html`
    <div class="wb-editor-pages" role="group" aria-label=${t('editor.pages')}>
      <ol class="wb-editor-page-list">
        ${doc.pages.map((page, i) => html`
          <li class=${'wb-editor-page' + (i === current ? ' wb-editor-page-current' : '') + (drag === page.id ? ' wb-editor-strip-drag' : '')} draggable="true"
            onDragStart=${e => (e.dataTransfer.setData('text/plain', page.id), (e.dataTransfer.effectAllowed = 'move'), setDrag(page.id))}
            onDragEnd=${() => setDrag(null)}
            onDragOver=${e => drag && (e.preventDefault(), (e.dataTransfer.dropEffect = 'move'))}
            onDrop=${e => (e.preventDefault(), drag && onMove(drag, i), setDrag(null))}>
            <button type="button" class="wb-editor-page-pick" aria-pressed=${i === current ? 'true' : 'false'} aria-label=${t('editor.page.n', { n: i + 1 })} onClick=${() => onSelect(i)}>
              <span class="wb-editor-page-thumb" aria-hidden="true">${renderNode(doc, { photos: hash => photos[hash] ?? null, page: i })}</span>
              <span class="wb-editor-page-number">${i + 1}</span>
            </button>
            <span class="wb-editor-strip-tools">
              <button type="button" class="wb-editor-chip" disabled=${i === 0} aria-label=${t('editor.page.left')} title=${t('editor.page.left')} onClick=${() => onMove(page.id, i - 1)}>◀</button>
              <button type="button" class="wb-editor-chip" disabled=${i === doc.pages.length - 1} aria-label=${t('editor.page.right')} title=${t('editor.page.right')} onClick=${() => onMove(page.id, i + 1)}>▶</button>
              <button type="button" class="wb-editor-chip" disabled=${only} aria-label=${t('editor.page.remove')} title=${t('editor.page.remove')} onClick=${() => onRemove(page.id)}>−</button>
            </span>
          </li>`)}
      </ol>
      <button type="button" class="wb-editor-button wb-editor-page-add" title=${t('editor.page.add')} aria-label=${t('editor.page.add')} onClick=${onAdd}>+</button>
    </div>
  `;
};
