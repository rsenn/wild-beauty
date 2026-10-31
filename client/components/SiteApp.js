import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { LoginDialog } from './LoginDialog.js';
import { NodeEditor } from './NodeEditor.js';
import { GraphPage } from './GraphPage.js';
import { RecordConsent } from './RecordConsent.js';

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });

// The owner's buttons on every page of a personal site, in the corner a thumb reaches: edit this
// page, the list of pages, the tree, log out. A visitor never gets them.
export const OwnerBar = ({ edit }) => {
  const { t } = useI18n();
  const logout = () => post('/api/logout').finally(() => location.assign('/'));

  return html`
    <nav class="site-owner" aria-label=${t('site.edit')}>
      ${edit && html`<a class="site-owner-button site-owner-main" href=${edit}>${t('site.edit')}</a>`}
      <a class="site-owner-button" href="/edit">${t('site.pages')}</a>
      <a class="site-owner-button" href="/graph">${t('site.graph')}</a>
      <button type="button" class="site-owner-button" onClick=${logout}>${t('site.logout')}</button>
    </nav>
  `;
};

// the navigation of the site above a tool page
export const SiteHead = () => {
  const { site } = useBoot();

  return html`
    <header class="site-head">
      <nav class="site-nav" aria-label=${site.title}>
        ${site.nav.map((item, i) => html`${i > 0 && html`<span class="site-dot" aria-hidden="true">·</span>`}<a class="site-link" href=${item.href}>${item.title}</a>`)}
      </nav>
    </header>
  `;
};

// /edit as a visitor: the login of the site, which cannot be dismissed
const SiteLogin = () => {
  const { t } = useI18n();
  const login = (username, password) =>
    post('/api/login', { username, password })
      .then(res => ({ ok: res.ok, error: res.status === 429 ? t('login.too_many') : undefined }))
      .catch(() => ({ ok: false }));

  return html`<div class="site"><${SiteHead} /><${LoginDialog} open=${true} onClose=${() => location.assign(location.pathname)} onSubmit=${login} /></div>`;
};

// /edit as the owner: the pages, each with its state and a switch to publish it, and a new page
const SitePages = () => {
  const { t } = useI18n();
  const { site } = useBoot();
  const [list, setList] = useState(site.list.filter(n => n.kind === 'page' || n.kind === 'site'));
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async event => {
    event.preventDefault();
    setBusy(true);

    const res = await post('/api/pages', { title }).catch(() => null);

    if(res?.ok) location.assign(`/edit/${(await res.json()).slug}`);
    else setBusy(false);
  };

  const toggle = async node => {
    const visibility = node.visibility === 'public' ? 'hidden' : 'public';
    const res = await post(`/api/nodes/${node.id}/visibility`, { visibility }).catch(() => null);

    if(res?.ok) setList(l => l.map(n => (n.id === node.id ? { ...n, visibility } : n)));
  };

  return html`
    <div class="site">
      <${SiteHead} />
      <main class="site-stage site-tool">
        <h1 class="site-h1">${t('site.pages')}</h1>
        ${list.length === 0 && html`<p>${t('site.empty')}</p>`}
        <ul class="site-pages">
          ${list.map(
            node => html`<li class="site-page" key=${node.id}>
              <span class="site-page-title">${node.title || t('node.untitled')}</span>
              <span class=${node.visibility === 'public' ? 'site-state site-live' : 'site-state'}>${t(node.visibility === 'public' ? 'site.live' : 'site.draft')}</span>
              ${node.slug !== null && html`<a class="site-owner-button" href=${`/edit/${node.slug}`}>${t('site.edit')}</a>`}
              ${node.kind !== 'site' && html`<button type="button" class="site-owner-button" onClick=${() => toggle(node)}>${t(node.visibility === 'public' ? 'site.unpublish' : 'site.publish')}</button>`}
            </li>`,
          )}
        </ul>
        <form class="site-new" onSubmit=${create}>
          <input type="text" name="title" placeholder=${t('site.new.title')} aria-label=${t('site.new.title')} value=${title} onInput=${e => setTitle(e.target.value)} />
          <button class="site-owner-button site-owner-main" disabled=${busy}>${t('site.new')}</button>
        </form>
      </main>
      <footer class="site-foot"><${RecordConsent} fold=${true} /></footer>
      <${OwnerBar} />
    </div>
  `;
};

// /edit/<slug>: the node editor on the page of the site; closing returns to the page
const SiteEditor = () => {
  const { t } = useI18n();
  const { site } = useBoot();
  const { node } = site;

  return html`
    <div class="wb-page wb-page-bare site-editing">
      <header class="wb-header"><a class="site-link" href=${node.path}>${t('site.back')}</a></header>
      <main class="wb-content">
        <${NodeEditor} key=${node.id} target=${node.id} onClose=${() => location.assign(node.path)} viewHref=${node.path} quickBar=${true} />
      </main>
    </div>
  `;
};

// the app on a site host: a page, or a tool of the owner (/edit, /edit/<slug>, /graph)
export const SiteTool = ({ page }) => {
  const { site } = useBoot();

  if(site.tool === 'graph') return html`<${GraphPage} />`;
  if(site.tool === 'edit') return !site.owner ? html`<${SiteLogin} />` : site.node ? html`<${SiteEditor} />` : html`<${SitePages} />`;

  return page;
};
