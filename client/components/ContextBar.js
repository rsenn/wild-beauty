import { html } from '../html.js';
import { BLENDS } from '../editor/model.js';
import { FONT_IDS } from '../editor/text.js';
import { DEFAULT_EDGE, EDGE_STYLES } from '../editor/edge.js';
import { Popover } from './Popover.js';

// The context bar under the stage (EDITOR.md S2.2): the controls of what is
// selected, nothing else. `dispatch(command)` is the editor's one way to
// change the node; `photo` is the display info of a selected photo (needed to
// recompute its matrix when the fit changes).
const Button = ({ label, onClick, pressed, disabled, children }) => html`<button type="button" class="wb-editor-chip" aria-pressed=${pressed === undefined ? undefined : pressed ? 'true' : 'false'} disabled=${disabled} onClick=${onClick}>${children ?? label}</button>`;

// a colour field: the system picker, and a dropper that takes the colour of a spot on the stage
const Color = ({ t, label, value, onInput, dropper }) => html`<span class="wb-editor-colour">
  <label class="wb-editor-field">${label} <input type="color" value=${/^#[0-9a-f]{6}$/i.test(value ?? '') ? value : '#000000'} onInput=${e => onInput(e.target.value)} /></label>
  ${dropper && html`<button type="button" class="wb-editor-chip wb-editor-dropper" title=${t('editor.dropper')} aria-label=${t('editor.dropper')} onClick=${() => dropper(onInput)}>\u2316</button>`}
</span>`;

export const ContextBar = ({ t, kind, step, vertex, onVertex, clipped, photo, onNudge, onDuplicate, onCopy, onCut, onPaste, onDropper, onCutout, cutting, onText, onEditText, dispatch }) => {
  if(!step) return html`<div class="wb-editor-context wb-editor-context-bar"><p>${t('editor.context.empty')}</p>${onPaste && html`<${Button} onClick=${onPaste}>${t('editor.paste')}<//>`}</div>`;

  const id = step.id;
  const order = html`
    <${Button} onClick=${() => dispatch({ type: 'moveStep', id, to: 'front' })}>${t('editor.order.front')}<//>
    <${Button} onClick=${() => dispatch({ type: 'moveStep', id, to: 'up' })}>${t('editor.order.up')}<//>
    <${Button} onClick=${() => dispatch({ type: 'moveStep', id, to: 'down' })}>${t('editor.order.down')}<//>
    <${Button} onClick=${() => dispatch({ type: 'moveStep', id, to: 'back' })}>${t('editor.order.back')}<//>
  `;
  // larger, smaller, turn left, turn right: the buttons for what a pinch does (E113)
  const nudges = onNudge && html`<span class="wb-editor-nudge" role="group" aria-label=${t('editor.nudge')}>
    ${[['smaller', '\u2212'], ['larger', '+'], ['left', '\u21ba'], ['right', '\u21bb'], ...(step.op === 'text' ? [] : [['flipH', '\u21c6'], ['flipV', '\u21c5']])].map(([name, glyph]) => html`<button type="button" class="wb-editor-chip wb-editor-nudge-btn" aria-label=${t('editor.nudge.' + name)} title=${t('editor.nudge.' + name)} onClick=${() => onNudge(name)}>${glyph}</button>`)}
  </span>`;
  const duplicate = onDuplicate && step.op === 'photo' && html`<${Button} onClick=${onDuplicate}>${t('editor.duplicate')}<//>`;
  const remove = html`<${Button} onClick=${() => dispatch({ type: 'removeStep', id })}>${t('editor.step.delete')}<//>`;

  let controls;

  if(step.op === 'photo') {
    controls = html`
      ${photo && photo.width !== photo.height && html`<label class="wb-editor-field">${t('editor.crop.' + (photo.width > photo.height ? 'x' : 'y'))} <input type="range" min="0" max="1" step="0.01" value=${step.crop ?? 0.5} onInput=${e => dispatch({ type: 'setCrop', id, crop: Number(e.target.value) })} /></label>`}
      <${Popover} label=${t('editor.look')}>
        <label class="wb-editor-field">${t('editor.opacity')} <input type="range" min="0" max="1" step="0.01" value=${step.opacity} onInput=${e => dispatch({ type: 'setOpacity', id, value: Number(e.target.value) })} /></label>
        <label class="wb-editor-field">${t('editor.blend')}
          <select value=${step.blend} onChange=${e => dispatch({ type: 'setBlend', id, mode: e.target.value })}>${BLENDS.map(mode => html`<option value=${mode} selected=${mode === step.blend}>${t('editor.blend.' + mode)}</option>`)}</select>
        </label>
      <//>
      <${Button} pressed=${step.role === 'texture'} onClick=${() => dispatch({ type: 'setRole', id, role: step.role === 'texture' ? 'picture' : 'texture' })}>${t('editor.role.texture')}<//>
      ${clipped && html`<${Button} onClick=${() => dispatch({ type: 'unclip', id })}>${t('editor.tool.unclip')}<//>`}
      <${Popover} label=${t('editor.edge')}>
        <span role="group" aria-label=${t('editor.edge')}>${EDGE_STYLES.map(style => html`<${Button} pressed=${(step.edge?.style ?? 'plain') === style} onClick=${() => dispatch({ type: 'setEdge', id, edge: { ...DEFAULT_EDGE, ...step.edge, style } })}>${t('editor.edge.' + style)}<//>`)}</span>
        ${step.edge && html`<label class="wb-editor-field">${t('editor.edge.amount')} <input type="range" min="0" max="1" step="0.01" value=${step.edge.amount} onInput=${e => dispatch({ type: 'setEdge', id, edge: { ...step.edge, amount: Number(e.target.value) } })} /></label>
        <${Button} onClick=${() => dispatch({ type: 'setEdge', id, edge: { ...step.edge, seed: Math.floor(Math.random() * 1e6) } })}>${t('editor.edge.reroll')}<//>`}
      <//>
      ${onCutout && html`<${Button} disabled=${cutting} onClick=${onCutout}>${cutting ? t('editor.cutout.busy') : t('editor.cutout')}<//>`}
      ${step.orig && html`<${Button} onClick=${() => dispatch({ type: 'replacePhoto', id, hash: step.orig })}>${t('editor.cutout.restore')}<//>`}
    `;
  } else if(step.op === 'text') {
    controls = html`
      <${Button} onClick=${onEditText}>${t('editor.text.edit')}<//>
      <span role="group" aria-label=${t('editor.text.font')}>${FONT_IDS.map(id => html`<${Button} pressed=${step.font === id} onClick=${() => onText({ font: id })}>${t('editor.font.' + id)}<//>`)}</span>
      <${Button} pressed=${!!step.bold} onClick=${() => onText({ bold: !step.bold })}>${t('editor.text.bold')}<//>
      <span role="group" aria-label=${t('editor.text.align')}>${['start', 'center', 'end'].map(a => html`<${Button} pressed=${step.align === a} onClick=${() => onText({ align: a })}>${t('editor.text.align.' + a)}<//>`)}</span>
      <label class="wb-editor-field">${t('editor.text.size')} <input type="range" min="8" max="300" step="1" value=${step.size} onInput=${e => onText({ size: Number(e.target.value) })} /></label>
      <label class="wb-editor-field">${t('editor.text.width')} <input type="range" min="80" max="1000" step="10" value=${step.w} onInput=${e => onText({ w: Number(e.target.value) })} /></label>
      <${Color} t=${t} dropper=${onDropper} label=${t('editor.stroke.color')} value=${step.color} onInput=${color => dispatch({ type: 'setColor', id, field: 'color', color })} />
      <${Popover} label=${t('editor.text.outline')}>
        <${Color} t=${t} dropper=${onDropper} label=${t('editor.stroke.color')} value=${step.outline?.color ?? '#ffffff'} onInput=${color => onText({ outline: { color, width: step.outline?.width ?? Math.max(2, step.size / 12) } })} />
        <label class="wb-editor-field">${t('editor.text.outline.width')} <input type="range" min="0" max="40" step="1" value=${step.outline?.width ?? 0} onInput=${e => onText({ outline: { color: step.outline?.color ?? '#ffffff', width: Number(e.target.value) } })} /></label>
      <//>
      <${Popover} label=${t('editor.text.background')}>
        <${Button} pressed=${step.bg !== undefined} onClick=${() => dispatch({ type: 'updateStep', id, patch: { bg: step.bg === undefined ? '#ffffffcc' : undefined } })}>${t('editor.text.background')}<//>
        ${step.bg !== undefined && html`<${Color} t=${t} dropper=${onDropper} label=${t('editor.text.background')} value=${typeof step.bg === 'string' ? step.bg.slice(0, 7) : '#ffffff'} onInput=${color => dispatch({ type: 'setColor', id, field: 'bg', color })} />
        <label class="wb-editor-field">${t('editor.text.padding')} <input type="range" min="0" max="100" step="1" value=${step.padding ?? 0} onInput=${e => onText({ padding: Number(e.target.value) })} /></label>
        <label class="wb-editor-field">${t('editor.text.radius')} <input type="range" min="0" max="200" step="1" value=${step.radius ?? 0} onInput=${e => onText({ radius: Number(e.target.value) })} /></label>`}
      <//>
    `;
  } else if(step.op === 'stroke') {
    controls = html`<${Color} t=${t} dropper=${onDropper} label=${t('editor.stroke.color')} value=${step.color} onInput=${color => dispatch({ type: 'setColor', id, color })} />`;
  } else if(step.op === 'shape') {
    const change = changes => dispatch({ type: 'updateShape', id, changes });
    const tone = typeof step.stroke === 'string' ? step.stroke : typeof step.fill === 'string' ? step.fill : '#000000';

    controls = html`
      <${Button} pressed=${step.fill !== undefined} onClick=${() => change({ fill: step.fill === undefined ? tone : null })}>${t('editor.shape.hasFill')}<//>
      <${Button} pressed=${step.stroke !== undefined} onClick=${() => change({ stroke: step.stroke === undefined ? tone : null })}>${t('editor.shape.hasStroke')}<//>
      <${Button} pressed=${step.closed} onClick=${() => change({ closed: !step.closed })}>${t('editor.shape.closed')}<//>
      ${vertex?.broken && html`<${Button} onClick=${() => onVertex('join')}>${t('editor.vertex.join')}<//>`}
      ${vertex && html`<${Button} disabled=${!vertex.canDelete} onClick=${() => onVertex('delete')}>${t('editor.vertex.delete')}<//>`}
      ${kind === 'gallery' && html`<${Button} pressed=${!!step.wall} onClick=${() => dispatch({ type: 'setWall', id, wall: step.wall ? null : {} })}>${t('editor.wall')}<//>`}
      ${kind === 'gallery' && step.wall && html`<label class="wb-editor-field">${t('editor.wall.height')} <input type="number" min="0.5" max="10" step="0.1" value=${step.wall.height} onChange=${e => dispatch({ type: 'setWall', id, wall: { height: Number(e.target.value) } })} /></label>`}
      ${kind === 'gallery' && step.wall && !step.closed && html`<label class="wb-editor-field">${t('editor.wall.width')} <input type="number" min="0.5" max="10" step="0.1" value=${step.wall.width} onChange=${e => dispatch({ type: 'setWall', id, wall: { width: Number(e.target.value) } })} /></label>`}
      <${Color} t=${t} dropper=${onDropper} label=${t('editor.shape.fill')} value=${step.fill} onInput=${color => dispatch({ type: 'setColor', id, field: 'fill', color })} />
      <${Color} t=${t} dropper=${onDropper} label=${t('editor.shape.stroke')} value=${step.stroke} onInput=${color => dispatch({ type: 'setColor', id, field: 'stroke', color })} />
      <label class="wb-editor-field">${t('editor.shape.width')} <input type="range" min="0" max="60" value=${step.strokeWidth} onInput=${e => dispatch({ type: 'setStrokeWidth', id, value: Number(e.target.value) })} /></label>
    `;
  }

  return html`<div class="wb-editor-context wb-editor-context-bar" role="toolbar" aria-label=${t('editor.context.label')}>${controls}${nudges}${duplicate}${onCopy && html`<${Button} onClick=${onCopy}>${t('editor.copy')}<//>`}${onCut && html`<${Button} onClick=${onCut}>${t('editor.cut')}<//>`}${onPaste && html`<${Button} onClick=${onPaste}>${t('editor.paste')}<//>`}${order}${remove}</div>`;
};
