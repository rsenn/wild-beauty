import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// MOCKUP of the editor frame (EDITOR.md S2.2): title row, tool column, square
// stage, action column, context bar and page strip. Everything except the
// title field and the close button is inert until E36-E42 fill it in.
const TOOLS = [
  ['V', 'select'],
  ['P', 'pen'],
  ['S', 'shape'],
  ['C', 'clip'],
  ['U', 'unclip'],
  ['T', 'text'],
];
const ACTIONS = ['undo', 'redo', 'page', 'delete', 'save'];

export const NodeEditor = ({ onClose }) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');

  const inert = (key, label) => html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled title=${t('editor.' + key)} aria-label=${t('editor.' + key)}>${label}</button>`;

  return html`
    <section id="wb-editor" class="wb-editor" aria-label=${t('editor.label')}>
      <div class="wb-editor-head">
        <label class="wb-editor-title">
          <span class="wb-sr-only">${t('editor.title.label')}</span>
          <input type="text" maxlength="200" autocomplete="off" value=${title} placeholder=${t('editor.title.placeholder')} onInput=${e => setTitle(e.target.value)} />
        </label>
        <button type="button" class="wb-editor-close" onClick=${onClose}>${t('editor.close')}</button>
      </div>
      <div class="wb-editor-body">
        <div class="wb-editor-tools" role="toolbar" aria-label=${t('editor.tools')}>${TOOLS.map(([key, name]) => inert('tool.' + name, key))}</div>
        <div class="wb-editor-stage" role="img" aria-label=${title || t('editor.stage')}>
          <span class="wb-editor-stage-hint">${t('editor.stage.hint')}</span>
        </div>
        <div class="wb-editor-actions" role="toolbar" aria-label=${t('editor.actions')}>${ACTIONS.map(key => inert(key, t('editor.short.' + key)))}</div>
      </div>
      <p class="wb-editor-context">${t('editor.context.empty')}</p>
      <div class="wb-editor-pages">${inert('page.1', '1')}${inert('page.add', '+')}</div>
    </section>
  `;
};
