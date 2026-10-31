import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { KINDS } from '../editor/model.js';
import { ColourPick } from './ColourPick.js';

// The properties popover above the stage (EDITOR.md S2.9): kind, visibility
// (public or private; the owner of a saved node changes it, `onVisibility`) and
// stage ground; the group is shown but fixed; the theme joins with M2b.
export const Properties = ({ t, kind, bg, pal, used = [], dropper, onOpen, dispatch, visibility = 'public', canPublish = false, onVisibility }) => {
  const [open, setOpenState] = useState(false);
  const setOpen = value => (setOpenState(value), onOpen?.(value));

  return html`
    <div class="wb-editor-props">
      <button type="button" class="wb-editor-close" aria-expanded=${open ? 'true' : 'false'} aria-controls="wb-editor-props-panel" onClick=${() => setOpen(!open)}>${t('editor.props')}</button>
      ${open &&
      html`<div id="wb-editor-props-panel" class="wb-editor-popover" role="group" aria-label=${t('editor.props')} onKeyDown=${e => e.key === 'Escape' && (e.stopPropagation(), setOpen(false))}>
        <label class="wb-editor-field">${t('editor.props.kind')}
          <select onChange=${e => dispatch({ type: 'setKind', kind: e.target.value })}>${KINDS.map(k => html`<option value=${k} selected=${k === kind}>${t('editor.kind.' + k)}</option>`)}</select>
        </label>
        <label class="wb-editor-field">${t('editor.props.visibility')}
          <select disabled=${!canPublish} title=${canPublish ? undefined : t('editor.visibility.fixed')} onChange=${e => onVisibility?.(e.target.value)}>
            ${['public', 'hidden'].map(v => html`<option value=${v} selected=${v === visibility}>${t('editor.visibility.' + v)}</option>`)}
          </select>
        </label>
        <label class="wb-editor-field">${t('editor.props.group')}
          <select disabled><option>${t('editor.group.none')}</option></select>
        </label>
        <div class="wb-editor-field" role="group" aria-label=${t('editor.props.bg')}>${t('editor.props.bg')}
          ${pal && html`<${ColourPick} t=${t} pal=${pal} used=${used} current=${bg} dropper=${dropper} onPick=${color => dispatch({ type: 'setBg', color })} />`}
        </div>
        <button type="button" class="wb-editor-chip" disabled=${bg === undefined} onClick=${() => dispatch({ type: 'setBg', color: null })}>${t('editor.props.bg.clear')}</button>
      </div>`}
    </div>
  `;
};
