import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';

// The film-strip (EDITOR.md S2.7, E53): one thumbnail per photo step in draw
// order, shown from two photos on. Click selects, drag (or the arrow buttons,
// for keyboard and touch) reorders, the cross removes. `photos` is the editor's
// hash -> info table; the texture toggle is for gallery nodes (a photo that already is a texture keeps it, to be undone); `onMove(id, to)` and `onRemove(id)` change the node.
export const Filmstrip = ({ t, steps, photos, selected, onSelect, onMove, onRole, onRemove, kind }) => {
  const [drag, setDrag] = useState(null);

  if(steps.length < 2) return null;

  return html`
    <ol class="wb-editor-strip" aria-label=${t('editor.strip')}>
      ${steps.map((step, i) => html`
        <li class=${'wb-editor-strip-item' + (step.id === selected ? ' wb-editor-strip-selected' : '') + (step.role === 'texture' ? ' wb-editor-strip-texture' : '') + (drag === step.id ? ' wb-editor-strip-drag' : '')} draggable="true"
          onDragStart=${e => (e.dataTransfer.setData('text/plain', step.id), (e.dataTransfer.effectAllowed = 'move'), setDrag(step.id))}
          onDragEnd=${() => setDrag(null)}
          onDragOver=${e => drag && (e.preventDefault(), (e.dataTransfer.dropEffect = 'move'))}
          onDrop=${e => (e.preventDefault(), drag && onMove(drag, i), setDrag(null))}>
          <button type="button" class="wb-editor-strip-pick" aria-pressed=${step.id === selected ? 'true' : 'false'} onClick=${() => onSelect(step.id)} aria-label=${t('editor.strip.photo', { n: i + 1 })}>
            <img src=${photos[step.photo]?.href ?? ''} alt="" draggable="false" />
          </button>
          <span class="wb-editor-strip-tools">
            <button type="button" class="wb-editor-chip" disabled=${i === 0} aria-label=${t('editor.strip.left')} title=${t('editor.strip.left')} onClick=${() => onMove(step.id, i - 1)}>◀</button>
            <button type="button" class="wb-editor-chip" disabled=${i === steps.length - 1} aria-label=${t('editor.strip.right')} title=${t('editor.strip.right')} onClick=${() => onMove(step.id, i + 1)}>▶</button>
            ${(kind === 'gallery' || step.role === 'texture') && html`<button type="button" class="wb-editor-chip" aria-pressed=${step.role === 'texture' ? 'true' : 'false'} aria-label=${t('editor.role.texture')} title=${t('editor.role.hint')} onClick=${() => onRole(step.id, step.role === 'texture' ? 'picture' : 'texture')}>▦</button>`}
            <button type="button" class="wb-editor-chip" aria-label=${t('editor.strip.remove')} title=${t('editor.strip.remove')} onClick=${() => onRemove(step.id)}>✕</button>
          </span>
        </li>`)}
    </ol>
  `;
};
