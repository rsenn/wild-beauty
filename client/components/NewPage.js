import { useEffect } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Layout } from './Layout.js';
import { UploadArea } from './UploadArea.js';
import { NewNodeTile } from './NewNodeTile.js';
import { NodeEditor } from './NodeEditor.js';
import { NEW } from '../editor/store.js';
import { ADD_EVENT } from '../editor/pending.js';
import { editorStore, useEditor } from '../editor/useEditor.js';

// /:lang/new: upload area, then the node editor once the "New node" tile has
// opened it. Whether an editor is open lives in the editor store (E34).
export const NewPage = () => {
  const { t } = useI18n();
  const { open: editing, target, openEditor, closeEditor } = useEditor();

  // an upload card's "add to node" opens the editor when none is open; the
  // editor picks the queued photo up when it mounts
  useEffect(() => {
    const on = () => {
      if(!editorStore.state.open) openEditor(NEW);
    };

    window.addEventListener(ADD_EVENT, on);

    return () => window.removeEventListener(ADD_EVENT, on);
  }, []);

  // replacing an open editor asks first
  useEffect(() => {
    editorStore.setConfirm(() => window.confirm(t('editor.replace.confirm')));
  }, [t]);

  return html`
    <${Layout} active="new" hrefFor=${code => `/${code}/new`}>
      <h1 class="wb-sr-only">${t('page.new.heading')}</h1>
      <${UploadArea} extra=${html`<${NewNodeTile} open=${editing} onToggle=${() => (editing ? closeEditor() : openEditor(NEW))} />`} />
      ${editing && html`<${NodeEditor} key=${target} target=${target} onClose=${closeEditor} />`}
    <//>
  `;
};
