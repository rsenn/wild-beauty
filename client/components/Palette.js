import { html } from '../html.js';
import { ColourPick } from './ColourPick.js';

// The palette strip (EDITOR.md S2.3a, E54): a chip naming what a tap colours
// and the shared colour selector. `pal` is the result of editor/palette.js
// `swatches`; `onPick(hex)` applies a colour to the target.
export const Palette = ({ t, pal, used = [], target, targets, onTarget, current, onPick, dropper }) => html`
  <div class="wb-editor-palette" role="group" aria-label=${t('editor.palette')}>
    <span class="wb-editor-palette-target" role="group" aria-label=${t('editor.palette.target')}>
      ${targets.length > 1
        ? targets.map(id => html`<button type="button" class="wb-editor-chip" aria-pressed=${id === target ? 'true' : 'false'} onClick=${() => onTarget(id)}>${t('editor.target.' + id)}</button>`)
        : html`<span class="wb-editor-chip">${t('editor.target.' + target)}</span>`}
    </span>
    <${ColourPick} t=${t} pal=${pal} used=${used} current=${current} onPick=${onPick} dropper=${dropper} />
  </div>
`;
