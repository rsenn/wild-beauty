import { html } from '../html.js';
import { BLENDS, FITS } from '../editor/model.js';

// The context bar under the stage (EDITOR.md S2.2): the controls of what is
// selected, nothing else. `dispatch(command)` is the editor's one way to
// change the node; `photo` is the display info of a selected photo (needed to
// recompute its matrix when the fit changes).
const Button = ({ label, onClick, pressed, disabled, children }) => html`<button type="button" class="wb-editor-chip" aria-pressed=${pressed === undefined ? undefined : pressed ? 'true' : 'false'} disabled=${disabled} onClick=${onClick}>${children ?? label}</button>`;

const Color = ({ label, value, onInput }) => html`<label class="wb-editor-field">${label} <input type="color" value=${/^#[0-9a-f]{6}$/i.test(value ?? '') ? value : '#000000'} onInput=${e => onInput(e.target.value)} /></label>`;

export const ContextBar = ({ t, step, clipped, photo, dispatch }) => {
  if(!step) return html`<p class="wb-editor-context">${t('editor.context.empty')}</p>`;

  const id = step.id;
  const order = html`
    <${Button} onClick=${() => dispatch({ type: 'moveStep', id, to: 'front' })}>${t('editor.order.front')}<//>
    <${Button} onClick=${() => dispatch({ type: 'moveStep', id, to: 'back' })}>${t('editor.order.back')}<//>
  `;
  const remove = html`<${Button} onClick=${() => dispatch({ type: 'removeStep', id })}>${t('editor.step.delete')}<//>`;

  let controls;

  if(step.op === 'photo') {
    controls = html`
      <span class="wb-editor-group" role="group" aria-label=${t('editor.fit')}>
        ${FITS.filter(fit => fit !== 'free' || step.fit === 'free').map(fit => html`<${Button} pressed=${step.fit === fit} disabled=${fit !== 'free' && !photo} onClick=${() => dispatch({ type: 'setFit', id, fit, info: photo })}>${t('editor.fit.' + fit)}<//>`)}
      </span>
      <label class="wb-editor-field">${t('editor.opacity')} <input type="range" min="0" max="1" step="0.01" value=${step.opacity} onInput=${e => dispatch({ type: 'setOpacity', id, value: Number(e.target.value) })} /></label>
      <label class="wb-editor-field">${t('editor.blend')}
        <select value=${step.blend} onChange=${e => dispatch({ type: 'setBlend', id, mode: e.target.value })}>${BLENDS.map(mode => html`<option value=${mode} selected=${mode === step.blend}>${t('editor.blend.' + mode)}</option>`)}</select>
      </label>
      ${clipped && html`<${Button} onClick=${() => dispatch({ type: 'unclip', id })}>${t('editor.tool.unclip')}<//>`}
    `;
  } else if(step.op === 'stroke') {
    controls = html`<${Color} label=${t('editor.stroke.color')} value=${step.color} onInput=${color => dispatch({ type: 'setColor', id, color })} />`;
  } else if(step.op === 'shape') {
    controls = html`
      <${Color} label=${t('editor.shape.fill')} value=${step.fill} onInput=${color => dispatch({ type: 'setColor', id, field: 'fill', color })} />
      <${Color} label=${t('editor.shape.stroke')} value=${step.stroke} onInput=${color => dispatch({ type: 'setColor', id, field: 'stroke', color })} />
      <label class="wb-editor-field">${t('editor.shape.width')} <input type="range" min="0" max="60" value=${step.strokeWidth} onInput=${e => dispatch({ type: 'setStrokeWidth', id, value: Number(e.target.value) })} /></label>
    `;
  }

  return html`<div class="wb-editor-context wb-editor-context-bar" role="toolbar" aria-label=${t('editor.context.label')}>${controls}${order}${remove}</div>`;
};
