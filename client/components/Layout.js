import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Nav } from './Nav.js';
import { LoginDialog } from './LoginDialog.js';
import { mainTabs } from '../nav.js';
import { useBoot } from '../boot.js';
import { OPEN_ACCOUNT, useAccount } from '../account.js';
import { useEffect, useRef, useState } from '../../vendor/hooks.js';

// page chrome: the tab strip and the content, the logo (the way home) on the landing page and on
// special occasions only (`logo`), else a small home tab; `hrefFor(code)` is the same page in another language; `bleed`
// drops the side padding of the content
export const Layout = ({ active, hrefFor, bleed, logo = false, children }) => {
  const { t, lang } = useI18n();
  const { loginRequired } = useBoot();
  const user = useAccount();
  const [loginOpen, setLoginOpen] = useState(!!loginRequired);
  const loggedIn = useRef(false);

  // something asked for an account (a guest who wants to publish)
  useEffect(() => {
    const open = () => setLoginOpen(true);

    window.addEventListener(OPEN_ACCOUNT, open);

    return () => window.removeEventListener(OPEN_ACCOUNT, open);
  }, []);

  // a login that worked reloads the page, so the server renders it for the user;
  // a page that asked for a login (/edit/ of a site) cannot be dismissed without one
  const close = () => {
    if(loggedIn.current) return location.assign(location.pathname);
    if(!loginRequired) setLoginOpen(false);
  };

  const logout = () => fetch('/api/logout', { method: 'POST' }).finally(() => location.assign(location.pathname + location.search));

  const login = (username, password) =>
    fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password, ...(user?.guest && { merge: true }) }) })
      .then(res => {
        loggedIn.current = res.ok;

        return { ok: res.ok, error: res.status === 429 ? t('login.too_many') : undefined };
      })
      .catch(() => ({ ok: false }));

  // a new account is logged in at once, so it ends like a login: the page reloads
  const register = (email, password) =>
    fetch('/api/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      .then(async res => {
        loggedIn.current = res.ok;

        const code = res.ok ? null : (await res.json().catch(() => ({}))).error;

        return { ok: res.ok, error: code ? t(`register.error.${code}`) : undefined };
      })
      .catch(() => ({ ok: false }));

  // a guest keeps their account: a name and a password, no mail address needed (docs/GUESTS.md G5)
  const claim = (username, password, email) =>
    fetch('/api/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password, ...(email && { email }) }) })
      .then(async res => {
        loggedIn.current = res.ok;

        const code = res.ok ? null : (await res.json().catch(() => ({}))).error;

        return { ok: res.ok, error: code ? t(`claim.error.${code}`) : undefined };
      })
      .catch(() => ({ ok: false }));

  return html`
    <div class=${logo ? 'wb-page' : 'wb-page wb-page-bare'}>
      <header class="wb-header">
        ${logo && html`<a class="wb-logo" href="/" aria-label="Wild Beauty"></a>`}
        <${Nav} tabs=${mainTabs(t, lang)} active=${active} home=${!logo} user=${user} hrefFor=${hrefFor} loginOpen=${loginOpen} onLogin=${() => !loginRequired && setLoginOpen(o => !o)} onLogout=${logout} />
      </header>
      <main class=${bleed ? 'wb-content wb-content-bleed' : 'wb-content'}>${children}</main>
      <${LoginDialog} open=${loginOpen} onClose=${close} onSubmit=${login} onRegister=${register} onClaim=${claim} guest=${!!user?.guest} works=${user?.works ?? 0} />
    </div>
  `;
};
