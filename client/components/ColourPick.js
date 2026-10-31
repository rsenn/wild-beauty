import { html } from '../html.js';

// the picker button is a colour wheel (a data colour, not a theme one)
const WHEEL = 'background:conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';

const same = (a, b) => !!a && !!b && a.slice(0, 7).toLowerCase() === b.toLowerCase();

const Swatch = ({ t, hex, current, onPick }) => html`<button type="button" class="wb-editor-swatch" style=${`background:${hex}`} aria-pressed=${same(current, hex) ? 'true' : 'false'} title=${t('editor.swatch', { hex })} aria-label=${t('editor.swatch', { hex })} onClick=${() => onPick(hex)}></button>`;

// The colour selector shared by the palette strip, the properties and the text
// popovers: the palette of the picture, colours that stand out from it
// (`pal.contrast`), the colours already used, then a tiny button for any colour
// and the dropper. `onPick(hex)` applies a colour; `current` is marked.
// With `alpha` there is an opacity slider too, and a hex field that takes #rrggbb or #rrggbbaa.
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
const hex2 = n => Math.round(n).toString(16).padStart(2, '0');
const alphaOf = c => (/^#[0-9a-f]{8}$/i.test(c ?? '') ? parseInt(c.slice(7), 16) / 255 : 1);

export const ColourPick = ({ t, pal, used = [], current, onPick, dropper, alpha = false }) => {
  const shown = new Set(pal.all);
  const row = (list, name) => list.length > 0 && html`<span class=${'wb-editor-swatches ' + name} role="group">${list.map(hex => html`<${Swatch} t=${t} hex=${hex} current=${current} onPick=${onPick} />`)}</span>`;

  return html`<span class="wb-colour-pick">
    ${row(pal.all, 'wb-colour-main')}
    ${row(pal.contrast.filter(hex => !shown.has(hex)), 'wb-colour-contrast')}
    ${row(used.filter(hex => !shown.has(hex) && !pal.contrast.includes(hex)), 'wb-editor-swatches-used')}
    <span class="wb-colour-free">
      <label class="wb-colour-other" style=${WHEEL} title=${t('editor.props.bg.other')}><input type="color" value=${/^#[0-9a-f]{6}/i.test(current ?? '') ? current.slice(0, 7) : '#808080'} aria-label=${t('editor.props.bg.other')} onInput=${e => onPick(e.target.value)} /></label>
      ${dropper && html`<button type="button" class="wb-editor-chip wb-editor-dropper" title=${t('editor.dropper')} aria-label=${t('editor.dropper')} onClick=${() => dropper(onPick)}><span class="wb-editor-tool-icon" aria-hidden="true"></span></button>`}
    </span>
    ${alpha && html`<span class="wb-colour-alpha">
      <label class="wb-editor-field">${t('editor.colour.alpha')} <input type="range" min="0" max="100" step="1" value=${Math.round(alphaOf(current) * 100)} aria-label=${t('editor.colour.alpha')} onInput=${e => onPick(`${/^#[0-9a-f]{6}/i.test(current ?? '') ? current.slice(0, 7) : '#808080'}${Number(e.target.value) >= 100 ? '' : hex2((Number(e.target.value) / 100) * 255)}`)} /></label>
      <label class="wb-editor-field">${t('editor.colour.hex')} <input type="text" class="wb-colour-hex" key=${current} defaultValue=${current ?? ''} maxlength="9" spellcheck="false" autocapitalize="off" aria-label=${t('editor.colour.hex')} onChange=${e => HEX.test(e.target.value.trim()) ? onPick(e.target.value.trim().toLowerCase()) : (e.target.value = current ?? '')} /></label>
    </span>`}
  </span>`;
};
