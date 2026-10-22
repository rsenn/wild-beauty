import { html } from '../html.js';
import { MODES } from '../editor/model.js';

// The mode switch of the page sequencer (EDITOR.md S2.7, E57): free (what the
// author drew), slides (one photo per page) or grid (photos auto-tiled).
export const ModeSwitch = ({ t, mode, onMode }) => html`
  <span class="wb-editor-modes" role="group" aria-label=${t('editor.mode')}>
    ${MODES.map(m => html`<button type="button" class="wb-editor-chip" aria-pressed=${m === mode ? 'true' : 'false'} onClick=${() => onMode(m)}>${t('editor.mode.' + m)}</button>`)}
  </span>
`;
