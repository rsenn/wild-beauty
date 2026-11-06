import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { accountName } from '../nav.js';
import { usePopFit } from './popfit.js';

// Small line icons that take the tab's colour, so they follow every theme.
const PATHS = {
  home: 'M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5',
  galleries: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  explore: 'M6 7a2 2 0 1 0 0 .01M18 6a2 2 0 1 0 0 .01M12 18a2.4 2.4 0 1 0 0 .01M7.7 8.2l3 7.6M16.6 7.9l-3.4 8.2M8 7h8',
  create: 'M12 4v16M4 12h16',
  user: 'M12 12a4 4 0 1 0 0-.01M4.5 21c.8-4 3.7-6 7.5-6s6.7 2 7.5 6',
};

const Icon = ({ name }) => html`
  <svg class="wb-tab-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d=${PATHS[name]} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
`;

// The flag of a language; a language without a flag file shows its code.
const Flag = ({ language }) => (language.flag ? html`<img class="wb-flag-img" src=${`/static/img/flag-${language.flag}.svg`} alt="" />` : html`<span class="wb-flag-code">${language.code}</span>`);

let serial = 0;

// A button that opens a list under it. It opens on a tap or Enter only (nothing opens by
// accident, and it works the same with a finger), closes on Escape, on a tap outside, when
// the focus leaves it and when an entry is chosen (`close` is passed to the children), and never
// moves anything below it: the list floats (popfit.js keeps it inside the window). The list is
// always in the page, hidden while closed, so the language links are in the server's HTML.
const NavMenu = ({ label, hint, active = false, expanded = false, class: className = '', children }) => {
  const [open, setOpen] = useState(false);
  const [id] = useState(() => `wb-nav-menu-${++serial}`);
  const root = useRef(null);
  const panel = usePopFit(open, { right: true });
  const close = () => setOpen(false);

  useEffect(() => {
    if(!open) return;

    const away = e => root.current && !root.current.contains(e.target) && close();

    document.addEventListener('pointerdown', away);

    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  return html`
    <li
      ref=${root}
      class=${'wb-tab wb-tab-menu ' + className + (active ? ' wb-tab-active' : '')}
      onKeyDown=${e => open && e.key === 'Escape' && (e.stopPropagation(), close(), root.current?.querySelector('button')?.focus())}
      onFocusOut=${e => open && !root.current?.contains(e.relatedTarget) && e.relatedTarget && close()}
    >
      <button type="button" class="wb-tab-button" title=${hint} aria-haspopup="true" aria-expanded=${open || expanded ? 'true' : 'false'} aria-controls=${id} onClick=${() => setOpen(!open)}>${label}</button>
      <div ref=${panel} id=${id} class="wb-nav-panel" role="group" aria-label=${hint} hidden=${!open}>${children(close)}</div>
    </li>
  `;
};

const LanguageMenu = ({ hrefFor }) => {
  const { t, lang, languages } = useI18n();
  const current = languages.find(language => language.code === lang) ?? { code: lang, name: lang };
  const hint = t('nav.lang.current', { name: current.name });

  return html`
    <${NavMenu} class="wb-tab-lang" hint=${hint} label=${html`<${Flag} language=${current} /><span class="wb-sr-only">${hint}</span>`}>
      ${() => html`<ul class="wb-nav-list">
        ${languages.map(language => html`
          <li>
            <a class="wb-nav-item" href=${hrefFor(language.code)} hreflang=${language.code} lang=${language.code} aria-current=${language.code === lang ? 'true' : null}>
              <${Flag} language=${language} /><span>${language.name}</span>
            </a>
          </li>
        `)}
      </ul>`}
    <//>
  `;
};

const AccountMenu = ({ user, active, onLogout }) => {
  const { t, lang } = useI18n();
  const name = accountName(user);

  return html`
    <${NavMenu} class="wb-tab-user" active=${active === 'profile' || active === 'admin'} hint=${t('nav.account', { name })} label=${html`<${Icon} name="user" /><span class="wb-tab-label">${name}</span>`}>
      ${close => html`<ul class="wb-nav-list">
        <li><a class="wb-nav-item" href=${`/${lang}/profile`} aria-current=${active === 'profile' ? 'page' : null} onClick=${close}>${t('nav.profile')}</a></li>
        ${user.admin && html`<li><a class="wb-nav-item" href=${`/${lang}/admin`} aria-current=${active === 'admin' ? 'page' : null} onClick=${close}>${t('nav.admin')}</a></li>`}
        <li><button type="button" class="wb-nav-item" onClick=${() => (close(), onLogout())}>${t('nav.logout')}</button></li>
      </ul>`}
    <//>
  `;
};

// The tab strip (docs/DESIGN.md S7.2a). Its height never changes and nothing in it moves the
// content below: no growing, no hover caption. `home` adds a small house tab, for a page that
// has no logo (the logo is the way home); `tabs` are the main entries; the language is a flag
// that opens a list of languages; the account is a "Log in" button, or the name of the user
// opening Profile, Admin and Log out.
export const Nav = ({ tabs, active, home = false, user = null, hrefFor, loginOpen = false, onLogin, onLogout }) => {
  const { t } = useI18n();

  return html`
    <nav class="wb-nav" aria-label=${t('nav.main')}>
      <ul class="wb-tabs">
        ${home &&
        html`<li class=${'wb-tab wb-tab-home' + (active === 'home' ? ' wb-tab-active' : '')}>
          <a href="/" title=${t('nav.home.caption')} aria-current=${active === 'home' ? 'page' : null}><${Icon} name="home" /><span class="wb-tab-label">${t('nav.home')}</span></a>
        </li>`}
        ${tabs.map(
          item => html`<li class=${'wb-tab' + (item.id === active ? ' wb-tab-active' : '')}>
            <a href=${item.href} title=${item.caption} aria-current=${item.id === active ? 'page' : null}><${Icon} name=${item.icon} /><span class="wb-tab-label">${item.label}</span></a>
          </li>`,
        )}
        <${LanguageMenu} hrefFor=${hrefFor} />
        ${user
          ? html`<${AccountMenu} user=${user} active=${active} onLogout=${onLogout} />`
          : html`<li class=${'wb-tab wb-tab-login' + (loginOpen ? ' wb-tab-active' : '')}>
              <button type="button" class="wb-tab-button" aria-haspopup="dialog" aria-expanded=${loginOpen ? 'true' : 'false'} onClick=${onLogin}><${Icon} name="user" /><span class="wb-tab-label">${t('nav.login')}</span></button>
            </li>`}
      </ul>
    </nav>
  `;
};
