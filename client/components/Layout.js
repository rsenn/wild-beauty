import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Nav } from './Nav.js';
import { LoginDialog } from './LoginDialog.js';
import { navItems } from '../nav.js';
import { useState } from '../../vendor/hooks.js';

// page chrome: the tab strip and the content, the logo on the landing page and on special
// occasions only (`logo`); `hrefFor(code)` is the same page in another language; `bleed`
// drops the side padding of the content
export const Layout = ({ active, hrefFor, bleed, logo = false, children }) => {
  const { t, lang } = useI18n();
  const [loginOpen, setLoginOpen] = useState(false);

  // POST /api/login does not exist yet (PLAN.md: no accounts in the PoC); until it
  // does, the dialog reports the failure
  const login = (username, password) =>
    fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) })
      .then(res => ({ ok: res.ok }))
      .catch(() => ({ ok: false }));

  return html`
    <div class=${logo ? 'wb-page' : 'wb-page wb-page-bare'}>
      <header class="wb-header">
        ${logo && html`<a class="wb-logo" href="/" aria-label="Wild Beauty"></a>`}
        <${Nav} items=${navItems(t, lang)} active=${loginOpen ? 'login' : active} hrefFor=${hrefFor} onLogin=${() => setLoginOpen(o => !o)} />
      </header>
      <main class=${bleed ? 'wb-content wb-content-bleed' : 'wb-content'}>${children}</main>
      <${LoginDialog} open=${loginOpen} onClose=${() => setLoginOpen(false)} onSubmit=${login} />
    </div>
  `;
};
