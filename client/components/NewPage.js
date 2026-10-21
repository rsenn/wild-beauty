import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Layout } from './Layout.js';
import { UploadArea } from './UploadArea.js';

// /:lang/new; the node editor is added in M8
export const NewPage = () => {
  const { t } = useI18n();

  return html`
    <${Layout} active="new" hrefFor=${code => `/${code}/new`}>
      <h1 class="wb-sr-only">${t('page.new.heading')}</h1>
      <${UploadArea} />
    <//>
  `;
};
