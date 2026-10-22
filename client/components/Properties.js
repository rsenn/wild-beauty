import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { KINDS } from '../editor/model.js';

// The properties popover above the stage (EDITOR.md S2.9): kind and stage
// ground now; visibility and group are shown but fixed in the PoC (no
// accounts); the theme joins with M2b.
export const Properties = ({ t, kind, bg, dispatch }) => {
  const [open, setOpen] = useState(false);

  return html`
    <div class="wb-editor-props">
      <button type="button" class="wb-editor-close" aria-expanded=${open ? 'true' : 'false'} aria-controls="wb-editor-props-panel" onClick=${() => setOpen(!open)}>${t('editor.props')}</button>
      ${open &&
      html`<div id="wb-editor-props-panel" class="wb-editor-popover" role="group" aria-label=${t('editor.props')} onKeyDown=${e => e.key === 'Escape' && (e.stopPropagation(), setOpen(false))}>
        <label class="wb-editor-field">${t('editor.props.kind')}
          <select onChange=${e => dispatch({ type: 'setKind', kind: e.target.value })}>${KINDS.map(k => html`<option value=${k} selected=${k === kind}>${t('editor.kind.' + k)}</option>`)}</select>
        </label>
        <label class="wb-editor-field">${t('editor.props.visibility')}
          <select disabled><option>${t('editor.visibility.public')}</option></select>
        </label>
        <label class="wb-editor-field">${t('editor.props.group')}
          <select disabled><option>${t('editor.group.none')}</option></select>
        </label>
        <label class="wb-editor-field">${t('editor.props.bg')}
          <input type="color" value=${/^#[0-9a-f]{6}$/i.test(bg ?? '') ? bg : '#ffffff'} onInput=${e => dispatch({ type: 'setBg', color: e.target.value })} />
        </label>
        <button type="button" class="wb-editor-chip" disabled=${bg === undefined} onClick=${() => dispatch({ type: 'setBg', color: null })}>${t('editor.props.bg.clear')}</button>
      </div>`}
    </div>
  `;
};
