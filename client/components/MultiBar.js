import { html } from '../html.js';
import { Fragment } from '../../vendor/preact.js';
import { BLENDS } from '../editor/model.js';
import { DEFAULT_EDGE, EDGE_STYLES } from '../editor/edge.js';
import { FONT_IDS } from '../editor/text.js';
import { ColourPick } from './ColourPick.js';
import { Popover } from './Popover.js';

// The context bar of a multiple selection (two or more steps chosen with the
// rectangle or Shift): what they share, applied to each at once. `steps` are in
// draw order; `dispatch` takes the `batch` command; the other `on...` props are the
// editor's group actions (nudge, order, align, text, clipboard, delete).
const Button = ({ onClick, pressed, children }) => html`<button type="button" class="wb-editor-chip" aria-pressed=${pressed === undefined ? undefined : pressed ? 'true' : 'false'} onClick=${onClick}>${children}</button>`;

// the field a colour sets on a step: strokes and text have `color`, shapes a `fill`
const FIELD = { stroke: 'color', text: 'color', shape: 'fill' };
const ALIGN = ['left', 'centre', 'right', 'top', 'middle', 'bottom', 'distribute-h', 'distribute-v'];

export const MultiBar = ({ t, kind, limited, steps, onNudge, onOrder, onAlign, onText, onDuplicate, onCopy, onCut, onPaste, onDelete, onDropper, pal, used, dispatch }) => {
  const photos = steps.filter(s => s.op === 'photo');
  const texts = steps.filter(s => s.op === 'text');
  const shapes = steps.filter(s => s.op === 'shape');
  const colourable = steps.filter(s => FIELD[s.op]);
  const batch = (commands, key) => dispatch({ type: 'batch', commands, key });
  const paint = color => batch(colourable.map(s => ({ type: 'setColor', id: s.id, field: FIELD[s.op], color })), 'multi-colour');
  const allTexture = photos.length > 0 && photos.every(s => s.role === 'texture');
  const same = (list, field) => (list.every(s => s[field] === list[0][field]) ? list[0][field] : undefined);

  return html`<div class="wb-editor-context wb-editor-context-bar" role="toolbar" aria-label=${t('editor.context.label')}>
    <span class="wb-editor-multi-count" role="status">${t('editor.multi.count', { count: steps.length })}</span>
    <span class="wb-editor-nudge" role="group" aria-label=${t('editor.nudge')}>
      ${[['smaller', '−'], ['larger', '+'], ['left', '↺'], ['right', '↻'], ...(texts.length ? [] : [['flipH', '⇆'], ['flipV', '⇅']])].map(([name, glyph]) => html`<button type="button" class="wb-editor-chip wb-editor-nudge-btn" aria-label=${t('editor.nudge.' + name)} title=${t('editor.nudge.' + name)} onClick=${() => onNudge(name)}>${glyph}</button>`)}
    </span>
    <${Popover} label=${t('editor.multi.align')}>
      <span role="group" aria-label=${t('editor.multi.align')}>${ALIGN.map(a => html`<${Button} onClick=${() => onAlign(a)}>${t('editor.align.' + a)}<//>`)}</span>
    <//>
    ${!limited && html`<${Fragment}>
    ${photos.length > 0 && html`<${Popover} label=${t('editor.multi.photos')}>
      <label class="wb-editor-field">${t('editor.opacity')} <input type="range" min="0" max="1" step="0.01" value=${photos[0].opacity} onInput=${e => batch(photos.map(s => ({ type: 'setOpacity', id: s.id, value: Number(e.target.value) })), 'multi-opacity')} /></label>
      <label class="wb-editor-field">${t('editor.blend')}
        <select onChange=${e => batch(photos.map(s => ({ type: 'setBlend', id: s.id, mode: e.target.value })))}>${BLENDS.map(mode => html`<option value=${mode} selected=${mode === same(photos, 'blend')}>${t('editor.blend.' + mode)}</option>`)}</select>
      </label>
      <span role="group" aria-label=${t('editor.edge')}>${EDGE_STYLES.map(style => html`<${Button} pressed=${(same(photos.map(s => ({ style: s.edge?.style ?? 'plain' })), 'style')) === style} onClick=${() => batch(photos.map(s => ({ type: 'setEdge', id: s.id, edge: { ...DEFAULT_EDGE, ...s.edge, style } })))}>${t('editor.edge.' + style)}<//>`)}</span>
      ${(kind === 'gallery' || photos.some(s => s.role === 'texture')) && html`<${Button} pressed=${allTexture} onClick=${() => batch(photos.map(s => ({ type: 'setRole', id: s.id, role: allTexture ? 'picture' : 'texture' })))}>${t('editor.role.texture')}<//>`}
    <//>`}
    ${texts.length > 0 && html`<${Popover} label=${t('editor.multi.text')}>
      <span role="group" aria-label=${t('editor.text.font')}>${FONT_IDS.map(id => html`<${Button} pressed=${same(texts, 'font') === id} onClick=${() => onText({ font: id })}>${t('editor.font.' + id)}<//>`)}</span>
      <${Button} pressed=${texts.every(s => s.bold)} onClick=${() => onText({ bold: !texts.every(s => s.bold) })}>${t('editor.text.bold')}<//>
      <span role="group" aria-label=${t('editor.text.align')}>${['start', 'center', 'end'].map(a => html`<${Button} pressed=${same(texts, 'align') === a} onClick=${() => onText({ align: a })}>${t('editor.text.align.' + a)}<//>`)}</span>
      <label class="wb-editor-field">${t('editor.text.size')} <input type="range" min="8" max="300" step="1" value=${texts[0].size} onInput=${e => onText({ size: Number(e.target.value) })} /></label>
    <//>`}
    ${shapes.length > 0 && html`<${Popover} label=${t('editor.multi.shapes')}>
      <label class="wb-editor-field">${t('editor.shape.width')} <input type="range" min="0" max="60" value=${shapes[0].strokeWidth} onInput=${e => batch(shapes.map(s => ({ type: 'setStrokeWidth', id: s.id, value: Number(e.target.value) })), 'multi-width')} /></label>
    <//>`}
    ${colourable.length > 0 && pal && html`<${Popover} label=${t('editor.multi.colour')}>
      <${ColourPick} alpha t=${t} pal=${pal} used=${used} current=${colourable[0][FIELD[colourable[0].op]]} dropper=${onDropper} onPick=${paint} />
    <//>`}
    <${Button} onClick=${() => onOrder('front')}>${t('editor.order.front')}<//>
    <${Button} onClick=${() => onOrder('up')}>${t('editor.order.up')}<//>
    <${Button} onClick=${() => onOrder('down')}>${t('editor.order.down')}<//>
    <${Button} onClick=${() => onOrder('back')}>${t('editor.order.back')}<//>
    <${Button} onClick=${onDuplicate}>${t('editor.duplicate')}<//>
    <${Button} onClick=${onCopy}>${t('editor.copy')}<//>
    <${Button} onClick=${onCut}>${t('editor.cut')}<//>
    ${onPaste && html`<${Button} onClick=${onPaste}>${t('editor.paste')}<//>`}
    <${Button} onClick=${onDelete}>${t('editor.step.delete')}<//>
    <//>`}
    ${limited && html`<span class="wb-editor-hint">${t('editor.scrub.preview')}</span>`}
  </div>`;
};
