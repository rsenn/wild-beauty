import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// last cell of the upload grid: starts (or, when open, closes) the node
// editor. Mockup for E35; the open state moves to the editor store in E34.
export const NewNodeTile = ({ open, onToggle }) => {
  const { t } = useI18n();

  return html`
    <li class="wb-card wb-card-new">
      <button type="button" class=${'wb-card-box wb-new-node' + (open ? ' wb-new-node-open' : '')} aria-expanded=${open ? 'true' : 'false'} aria-controls="wb-editor" onClick=${onToggle}>
        <span class="wb-new-node-plus" aria-hidden="true">${open ? '×' : '+'}</span>
        <span class="wb-new-node-label">${t(open ? 'editor.close' : 'editor.new')}</span>
      </button>
    </li>
  `;
};
