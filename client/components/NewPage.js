import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Layout } from './Layout.js';

// /:lang/new; the upload area and node editor are added in M4 and M8
export const NewPage = () => {
  const { t } = useI18n();

  return html`
    <${Layout} active="new" hrefFor=${code => `/${code}/new`}>
      <h1>${t('page.new.heading')}</h1>
    <//>
  `;
};
