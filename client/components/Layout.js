import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Nav } from './Nav.js';
import { navItems } from '../nav.js';

// page chrome: the tab strip and the content, the logo on the landing page and on special
// occasions only (`logo`); `hrefFor(code)` is the same page in another language; `bleed`
// drops the side padding of the content
export const Layout = ({ active, hrefFor, bleed, logo = false, children }) => {
  const { t, lang } = useI18n();

  return html`
    <div class=${logo ? 'wb-page' : 'wb-page wb-page-bare'}>
      <header class="wb-header">
        ${logo && html`<a class="wb-logo" href="/" aria-label="Wild Beauty"></a>`}
        <${Nav} items=${navItems(t, lang)} active=${active} hrefFor=${hrefFor} />
      </header>
      <main class=${bleed ? 'wb-content wb-content-bleed' : 'wb-content'}>${children}</main>
    </div>
  `;
};
