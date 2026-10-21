import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Nav } from './Nav.js';
import { navItems } from '../nav.js';

// page chrome: logo, tab strip, content; `hrefFor(code)` is the same page in
// another language
export const Layout = ({ active, hrefFor, children }) => {
  const { t, lang } = useI18n();

  return html`
    <div class="wb-page">
      <header class="wb-header">
        <a class="wb-logo" href="/" aria-label="Wild Beauty"></a>
        <${Nav} items=${navItems(t, lang)} active=${active} hrefFor=${hrefFor} />
      </header>
      <main class="wb-content">${children}</main>
    </div>
  `;
};
