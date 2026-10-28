import { html } from '../html.js';

// the picker button is a colour wheel (a data colour, not a theme one)
const WHEEL = 'background:conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';

const same = (a, b) => !!a && !!b && a.slice(0, 7).toLowerCase() === b.toLowerCase();

const Swatch = ({ t, hex, current, onPick }) => html`<button type="button" class="wb-editor-swatch" style=${`background:${hex}`} aria-pressed=${same(current, hex) ? 'true' : 'false'} title=${t('editor.swatch', { hex })} aria-label=${t('editor.swatch', { hex })} onClick=${() => onPick(hex)}></button>`;

// The colour selector shared by the palette strip, the properties and the text
// popovers: the palette of the picture, colours that stand out from it
// (`pal.contrast`), the colours already used, then a tiny button for any colour
// and the dropper. `onPick(hex)` applies a colour; `current` is marked.
export const ColourPick = ({ t, pal, used = [], current, onPick, dropper }) => {
  const shown = new Set(pal.all);
  const row = (list, name) => list.length > 0 && html`<span class=${'wb-editor-swatches ' + name} role="group">${list.map(hex => html`<${Swatch} t=${t} hex=${hex} current=${current} onPick=${onPick} />`)}</span>`;

  return html`<span class="wb-colour-pick">
    ${row(pal.all, 'wb-colour-main')}
    ${row(pal.contrast.filter(hex => !shown.has(hex)), 'wb-colour-contrast')}
    ${row(used.filter(hex => !shown.has(hex) && !pal.contrast.includes(hex)), 'wb-editor-swatches-used')}
    <span class="wb-colour-free">
      <label class="wb-colour-other" style=${WHEEL} title=${t('editor.props.bg.other')}><input type="color" value=${/^#[0-9a-f]{6}/i.test(current ?? '') ? current.slice(0, 7) : '#808080'} aria-label=${t('editor.props.bg.other')} onInput=${e => onPick(e.target.value)} /></label>
      ${dropper && html`<button type="button" class="wb-editor-chip wb-editor-dropper" title=${t('editor.dropper')} aria-label=${t('editor.dropper')} onClick=${() => dropper(onPick)}>⌖</button>`}
    </span>
  </span>`;
};
