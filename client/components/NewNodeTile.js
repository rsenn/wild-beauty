import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// last cell of the upload grid: starts (or, when open, closes) the node
// editor. Mockup for E35; the open state moves to the editor store in E34.
export const NewNodeTile = ({ open, onToggle, count = 0, onAdd }) => {
  const { t } = useI18n();

  // an open editor and selected photos: the tile adds them instead of closing
  if(open && count > 0)
    return html`
      <li class="wb-card wb-card-new">
        <button type="button" class="wb-card-box wb-new-node wb-new-node-add" onClick=${onAdd}>
          <span class="wb-new-node-arrow" aria-hidden="true"></span>
          <span class="wb-new-node-label">${t('editor.addSelected', { count })}</span>
        </button>
      </li>
    `;

  return html`
    <li class="wb-card wb-card-new">
      <button type="button" class=${'wb-card-box wb-new-node' + (open ? ' wb-new-node-open' : '')} aria-expanded=${open ? 'true' : 'false'} aria-controls="wb-editor" onClick=${onToggle}>
        <span class="wb-new-node-plus" aria-hidden="true">${open ? '×' : '+'}</span>
        <span class="wb-new-node-label">${t(open ? 'editor.close' : 'editor.new')}</span>
      </button>
    </li>
  `;
};
