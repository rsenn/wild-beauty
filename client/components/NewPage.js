import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Layout } from './Layout.js';
import { UploadArea } from './UploadArea.js';
import { NewNodeTile } from './NewNodeTile.js';
import { NodeEditor } from './NodeEditor.js';

// /:lang/new: upload area, then the node editor once the "New node" tile has
// opened it (E35; the open state moves to the editor store in E34)
export const NewPage = () => {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  return html`
    <${Layout} active="new" hrefFor=${code => `/${code}/new`}>
      <h1 class="wb-sr-only">${t('page.new.heading')}</h1>
      <${UploadArea} extra=${html`<${NewNodeTile} open=${editing} onToggle=${() => setEditing(!editing)} />`} />
      ${editing && html`<${NodeEditor} onClose=${() => setEditing(false)} />`}
    <//>
  `;
};
