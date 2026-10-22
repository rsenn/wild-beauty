import { html } from '../html.js';
import { I18n, makeI18n } from '../i18n.js';
import { Boot } from '../boot.js';
import { NewPage } from './NewPage.js';
import { NodePage } from './NodePage.js';

// root of every page; `boot` is the JSON the server embeds
// ({ lang, messages, fallback, languages, limits }, plus `node` and `photos`
// on the page of a saved node)
export const App = ({ boot }) => html`
  <${Boot.Provider} value=${boot}>
    <${I18n.Provider} value=${makeI18n(boot)}>
      ${boot.node ? html`<${NodePage} />` : html`<${NewPage} />`}
    <//>
  <//>
`;
