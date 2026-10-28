import { html } from '../html.js';

// The palette strip (EDITOR.md S2.3a, E54): eight swatches in two rows of four
// under the context bar, and a chip naming what a tap colours. `swatches` is
// the `all` list of editor/palette.js; `onPick(hex)` applies it to the target.
export const Palette = ({ t, swatches, used = [], target, targets, onTarget, current, onPick }) => html`
  <div class="wb-editor-palette" role="group" aria-label=${t('editor.palette')}>
    <span class="wb-editor-palette-target" role="group" aria-label=${t('editor.palette.target')}>
      ${targets.length > 1
        ? targets.map(id => html`<button type="button" class="wb-editor-chip" aria-pressed=${id === target ? 'true' : 'false'} onClick=${() => onTarget(id)}>${t('editor.target.' + id)}</button>`)
        : html`<span class="wb-editor-chip">${t('editor.target.' + target)}</span>`}
    </span>
    <span class="wb-editor-swatches">
      ${swatches.map(hex => html`<button type="button" class="wb-editor-swatch" style=${`background:${hex}`} aria-pressed=${current?.toLowerCase() === hex ? 'true' : 'false'} title=${t('editor.swatch', { hex })} aria-label=${t('editor.swatch', { hex })} onClick=${() => onPick(hex)}></button>`)}
    </span>
    ${used.length > 0 && html`<span class="wb-editor-swatches wb-editor-swatches-used" role="group" aria-label=${t('editor.palette.used')}>
      ${used.map(hex => html`<button type="button" class="wb-editor-swatch" style=${`background:${hex}`} aria-pressed=${current?.toLowerCase() === hex ? 'true' : 'false'} title=${t('editor.swatch', { hex })} aria-label=${t('editor.swatch', { hex })} onClick=${() => onPick(hex)}></button>`)}
    </span>`}
  </div>
`;
