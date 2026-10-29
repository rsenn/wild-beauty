import { html } from '../html.js';
import { AXES, COLS_MAX, FLOWS, MODES } from '../editor/model.js';
import { gridOptions } from '../editor/grid.js';

// The mode switch of the page sequencer (EDITOR.md S2.7, E57): free (what the
// author drew), slides (one photo per page) or grid (photos auto-tiled).
export const ModeSwitch = ({ t, mode, onMode, layout, onLayout }) => {
  // how the viewer shows the node: a grid can also show everything at once
  const flows = mode === 'grid' ? FLOWS : FLOWS.filter(f => f !== 'fit');
  const flow = flows.includes(layout?.flow) ? layout.flow : mode === 'grid' ? 'fit' : 'page';
  const axis = AXES.includes(layout?.axis) ? layout.axis : flow === 'scroll' ? 'v' : 'h';

  return html`
  <span class="wb-editor-modes" role="group" aria-label=${t('editor.mode')}>
    ${MODES.map(m => html`<button type="button" class="wb-editor-chip" aria-pressed=${m === mode ? 'true' : 'false'} onClick=${() => onMode(m)}>${t('editor.mode.' + m)}</button>`)}
  </span>
  <span class="wb-editor-modes" role="group" aria-label=${t('editor.flow')} title=${t('editor.flow.hint')}>${flows.map(f => html`<button type="button" class="wb-editor-chip" aria-pressed=${flow === f ? 'true' : 'false'} onClick=${() => onLayout({ flow: f })}>${t('editor.flow.' + f)}</button>`)}</span>
  ${flow !== 'fit' && html`<span class="wb-editor-modes" role="group" aria-label=${t('editor.axis')}>${AXES.map(a => html`<button type="button" class="wb-editor-chip" aria-pressed=${axis === a ? 'true' : 'false'} onClick=${() => onLayout({ axis: a })}>${t('editor.axis.' + a)}</button>`)}</span>`}
  ${mode === 'grid' && html`<span class="wb-editor-modes" role="group" aria-label=${t('editor.layout')}>${['loose', 'tight'].map(fill => html`<button type="button" class="wb-editor-chip" aria-pressed=${(layout?.fill ?? 'loose') === fill && layout?.gap === undefined ? 'true' : 'false'} title=${t('editor.layout.' + fill + '.hint')} onClick=${() => onLayout({ fill, gap: null })}>${t('editor.layout.' + fill)}</button>`)}</span>
  <label class="wb-editor-field">${t('editor.layout.gap')} <input type="range" min="0" max="100" step="1" value=${gridOptions(layout).gap} onInput=${e => onLayout({ gap: Number(e.target.value) })} /> <output>${gridOptions(layout).gap}</output></label>
  <label class="wb-editor-field">${t('editor.layout.cols')} <select onChange=${e => onLayout({ cols: e.target.value === '' ? null : Number(e.target.value) })}><option value="" selected=${layout?.cols === undefined}>${t('editor.layout.cols.auto')}</option>${Array.from({ length: COLS_MAX }, (_, i) => i + 1).map(n => html`<option value=${n} selected=${layout?.cols === n}>${n}</option>`)}</select></label>`}
`;
};
