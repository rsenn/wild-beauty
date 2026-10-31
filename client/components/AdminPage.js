import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { Layout } from './Layout.js';

// /:lang/admin (server/admin.js): for an admin user. Tabs: the summary of the system, the user accounts (read
// only for now), the logs with their recordings. The panel is for the operator, so its words are English.
const get = async url => {
  const res = await fetch(url, { headers: { accept: 'application/json' } });

  if(!res.ok) throw new Error(String(res.status));

  return res.json();
};

const when = ts => (ts ? new Date(ts).toISOString().slice(0, 16).replace('T', ' ') : '-');
const span = ms => {
  const s = Math.round(ms / 1000);

  return s >= 5400 ? `${(s / 3600).toFixed(1)} h` : s >= 90 ? `${Math.round(s / 60)} min` : `${s} s`;
};
const device = ua => (/iPhone|Android.*Mobile/.test(ua ?? '') ? 'phone' : /iPad|Tablet/.test(ua ?? '') ? 'tablet' : ua ? 'desktop' : '-');

// loads once, and again with the Refresh button
const useLoad = (url, deps = []) => {
  const [state, setState] = useState({ loading: true });
  const [again, setAgain] = useState(0);

  useEffect(() => {
    let alive = true;

    setState(s => ({ ...s, loading: true }));
    get(url).then(
      data => alive && setState({ data }),
      error => alive && setState({ error: error.message }),
    );

    return () => {
      alive = false;
    };
  }, [url, again, ...deps]);

  return [state, () => setAgain(n => n + 1)];
};

const Status = ({ state }) => (state.loading && !state.data ? html`<p class="wb-admin-note">Loading…</p>` : state.error ? html`<p class="wb-admin-note wb-admin-error" role="alert">Failed (${state.error})</p>` : null);

const Summary = () => {
  const [state, refresh] = useLoad('/api/admin/summary');

  return html`
    <div class="wb-admin-bar"><button type="button" class="wb-editor-chip" onClick=${refresh}>Refresh</button></div>
    <${Status} state=${state} />
    <div class="wb-admin-cards">
      ${(state.data?.groups ?? []).map(
        group => html`<section class="wb-admin-card" key=${group.title}>
          <h3>${group.title}</h3>
          <dl>${group.items.map(([label, value]) => html`<div key=${label}><dt>${label}</dt><dd>${String(value)}</dd></div>`)}</dl>
        </section>`,
      )}
    </div>
  `;
};

const Users = () => {
  const [state, refresh] = useLoad('/api/admin/users');

  return html`
    <div class="wb-admin-bar"><button type="button" class="wb-editor-chip" onClick=${refresh}>Refresh</button><span class="wb-admin-note">Read only.</span></div>
    <${Status} state=${state} />
    ${state.data &&
    html`<div class="wb-admin-scroll"><table class="wb-admin-table">
      <thead><tr><th>id</th><th>mail</th><th>username</th><th>admin</th><th>nodes</th><th>published</th><th>sessions</th><th>last login</th><th>created</th></tr></thead>
      <tbody>${state.data.users.map(u => html`<tr key=${u.id}><td>${u.id}</td><td>${u.email}</td><td>${u.username ?? ''}</td><td>${u.admin ? 'yes' : ''}</td><td>${u.nodes}</td><td>${u.published}</td><td>${u.sessions}</td><td>${when(u.last_login)}</td><td>${when(u.created)}</td></tr>`)}</tbody>
    </table></div>`}
  `;
};

// the recording of a session in the player (vendor/session/player.min.js, loaded when first needed)
let playerLoad = null;
const loadPlayer = () =>
  (playerLoad ??= new Promise((resolve, reject) => {
    const css = document.createElement('link');
    const script = document.createElement('script');

    css.rel = 'stylesheet';
    css.href = '/vendor/session/player.css';
    script.src = '/vendor/session/player.min.js';
    script.onload = () => resolve(window.rrwebPlayer.default ?? window.rrwebPlayer);
    script.onerror = () => reject(new Error('player'));
    document.head.append(css, script);
  }));

const Player = ({ id }) => {
  const box = useRef(null);
  const [note, setNote] = useState('Loading the recording…');

  useEffect(() => {
    let alive = true;
    let player = null;

    (async () => {
      try {
        const [{ events }, Player] = await Promise.all([get(`/api/admin/recording/${encodeURIComponent(id)}`), loadPlayer()]);

        if(!alive) return;

        const meta = events.find(e => e.type === 4)?.data ?? {};
        const room = Math.min(box.current.clientWidth || 800, 1400);
        const k = Math.min(1, room / (meta.width || 1280), (innerHeight * 0.8) / (meta.height || 800));

        box.current.replaceChildren();
        setNote(`${events.length} events`);
        player = new Player({ target: box.current, props: { events, width: Math.round((meta.width || 1280) * k), height: Math.round((meta.height || 800) * k), autoPlay: false, skipInactive: true } });
      } catch(error) {
        alive && setNote(`Could not load the recording (${error.message})`);
      }
    })();

    return () => {
      alive = false;
      player?.$destroy?.();
    };
  }, [id]);

  return html`<div><p class="wb-admin-note" role="status">${note} · <a href=${`/api/admin/recording/${encodeURIComponent(id)}/page`}>download as one HTML file</a></p><div ref=${box} class="wb-admin-player"></div></div>`;
};

const FIELDS = [['user', 'user / mail'], ['ip', 'IP address'], ['who', 'who'], ['url', 'page'], ['ua', 'browser']];

const Logs = () => {
  const [filters, setFilters] = useState({ days: '7', replay: false, by: '' });
  const [applied, setApplied] = useState(filters);
  const [pick, setPick] = useState(null);
  const query = new URLSearchParams(Object.entries(applied).filter(([, v]) => v !== '' && v !== false).map(([k, v]) => [k, v === true ? '1' : v])).toString();
  const [state, refresh] = useLoad(`/api/admin/sessions?${query}`);
  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const apply = e => (e?.preventDefault(), setPick(null), setApplied({ ...filters }));
  // a group row narrows the list to it
  const narrow = (by, key) => {
    const next = { ...filters, by: '', [by]: key.startsWith('(') ? '' : key };

    setFilters(next);
    setApplied(next);
  };
  const data = state.data;

  return html`
    <form class="wb-admin-bar wb-admin-filters" onSubmit=${apply}>
      ${FIELDS.map(([key, label]) => html`<label key=${key}>${label} <input type="text" value=${filters[key] ?? ''} onInput=${e => set(key, e.target.value)} /></label>`)}
      <label>days <select value=${filters.days} onChange=${e => set('days', e.target.value)}>${['1', '3', '7', '30', '90'].map(d => html`<option value=${d}>${d}</option>`)}</select></label>
      <label>group by <select value=${filters.by} onChange=${e => set('by', e.target.value)}><option value="">none</option><option value="ip">IP address</option><option value="user">user</option><option value="who">who</option></select></label>
      <label><input type="checkbox" checked=${filters.replay} onChange=${e => set('replay', e.target.checked)} /> recorded only</label>
      <button class="wb-editor-chip">Apply</button>
      <button type="button" class="wb-editor-chip" onClick=${refresh}>Refresh</button>
    </form>
    <${Status} state=${state} />
    ${data?.groups &&
    html`<div class="wb-admin-scroll"><table class="wb-admin-table">
      <thead><tr><th>${applied.by}</th><th>sessions</th><th>time</th><th>recorded</th><th>first</th><th>last</th><th>${applied.by === 'user' ? 'ip' : 'users'}</th></tr></thead>
      <tbody>${data.groups.map(g => html`<tr key=${g.key} class="wb-admin-click" onClick=${() => narrow(applied.by, g.key)}><td>${g.key}</td><td>${g.sessions}</td><td>${span(g.seconds * 1000)}</td><td>${g.replays}</td><td>${when(g.first)}</td><td>${when(g.last)}</td><td>${(applied.by === 'user' ? g.ips : g.users).slice(0, 3).join(', ')}</td></tr>`)}</tbody>
    </table></div>`}
    ${data?.sessions &&
    html`<p class="wb-admin-note">${data.total} sessions${data.total > data.sessions.length ? `, the newest ${data.sessions.length} shown` : ''}. Click one for the details.</p>
    <div class="wb-admin-scroll"><table class="wb-admin-table">
      <thead><tr><th>start</th><th>length</th><th></th><th>events</th><th>who</th><th>user</th><th>ip</th><th>device</th><th>page</th></tr></thead>
      <tbody>${data.sessions.map(s => html`<tr key=${s.id} class=${'wb-admin-click' + (pick?.id === s.id ? ' wb-admin-picked' : '')} onClick=${() => setPick(pick?.id === s.id ? null : s)}><td>${when(s.start)}</td><td>${span(s.end - s.start)}</td><td>${s.replay ? 'REC' : ''}</td><td>${s.events}</td><td>${s.who}</td><td>${s.user ?? ''}</td><td>${s.ip ?? ''}</td><td>${device(s.ua)}</td><td>${s.url ?? ''}</td></tr>`)}</tbody>
    </table></div>`}
    ${pick &&
    html`<section class="wb-admin-detail" aria-label="Session">
      <h3>${pick.id}</h3>
      <p>${pick.who} · ${pick.user ?? 'not logged in'} · ${pick.ip ?? '-'} · ${device(pick.ua)} · ${when(pick.start)} (${span(pick.end - pick.start)}) · ${pick.url ?? ''}</p>
      <p class="wb-admin-note">${pick.ua ?? ''}</p>
      ${pick.replay ? html`<p>usage events in this time: ${pick.usage ?? 0} (commands ${pick.cmds ?? 0}, errors ${pick.errors ?? 0})</p><${Player} id=${pick.id} />` : html`<p class="wb-admin-note">Not recorded: only the ${pick.events} usage events exist.</p>`}
    </section>`}
  `;
};

const TABS = [['summary', 'Summary', Summary], ['users', 'User accounts', Users], ['logs', 'Logs and recordings', Logs]];

export const AdminPage = () => {
  const { t, lang } = useI18n();
  const first = () => {
    const wanted = typeof location === 'undefined' ? '' : location.hash.slice(1);

    return TABS.some(([id]) => id === wanted) ? wanted : 'summary';
  };
  const [tab, setTab] = useState('summary');

  // the tab of the address, after hydration (the server renders the first)
  useEffect(() => setTab(first()), []);

  const show = id => {
    setTab(id);
    history.replaceState(null, '', `#${id}`);
  };
  const Body = TABS.find(([id]) => id === tab)[2];

  return html`
    <${Layout} active="admin" hrefFor=${code => `/${code}/admin`}>
      <h1 class="wb-sr-only">${t('nav.admin')}</h1>
      <div class="wb-admin" lang="en">
        <div class="wb-admin-tabs" role="tablist" aria-label=${t('nav.admin')}>${TABS.map(([id, label]) => html`<button type="button" role="tab" class="wb-editor-chip" aria-selected=${tab === id ? 'true' : 'false'} onClick=${() => show(id)}>${label}</button>`)}</div>
        <${Body} />
      </div>
    <//>
  `;
};
