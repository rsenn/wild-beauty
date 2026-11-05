import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { Layout } from './Layout.js';

// /:lang/profile (docs/PROFILE.md): the details of the account, the artist's pseudonym, the
// patterns for generated titles and descriptions, and the avatar (the user's root node,
// edited in the node editor; its Close brings the user back here)
export const ProfilePage = () => {
  const { t, lang } = useI18n();
  const { profile: first } = useBoot();
  const [profile, setProfile] = useState(first);
  const [form, setForm] = useState(() => (first ? { username: first.username, name: first.name, pseudonym: first.pseudonym, ...first.prefs } : null));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if(!profile) return html`<${Layout} active="profile" hrefFor=${code => `/${code}/profile`}><div class="wb-profile"></div><//>`;

  const set = key => e => setForm({ ...form, [key]: e.target.value });

  const save = async e => {
    e.preventDefault();
    setBusy(true);
    setNote('');

    const { username, name, pseudonym, titlePattern, descPattern, visibility } = form;
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, name, pseudonym, prefs: { titlePattern, descPattern, visibility } }) }).catch(() => null);

    if(res?.ok) {
      setProfile((await res.json()).profile);
      setNote(t('profile.saved'));
    } else {
      const code = res ? (await res.json().catch(() => ({}))).error : null;

      setNote(code === 'invalid_username' || code === 'username_taken' ? t(`profile.error.${code}`) : t('profile.error'));
    }

    setBusy(false);
  };

  // the avatar: made when first wanted, then opened in the node editor, Close coming back here
  const avatar = async () => {
    const res = await fetch('/api/profile/avatar', { method: 'POST' }).catch(() => null);

    if(!res?.ok) return setNote(t('profile.error'));

    const { id } = await res.json();

    location.assign(`/${lang}/node/${id}?edit=1&back=${encodeURIComponent(`/${lang}/profile`)}`);
  };

  return html`
    <${Layout} active="profile" hrefFor=${code => `/${code}/profile`}>
      <form class="wb-profile" onSubmit=${save}>
        <h1>${t('profile.title')}</h1>
        <section class="wb-profile-avatar" aria-label=${t('profile.avatar')}>
          ${profile.tile ? html`<img src=${`/files/photos/${profile.tile}.thumb.jpg`} alt="" width="96" height="96" />` : html`<span class="wb-profile-noavatar" aria-hidden="true">?</span>`}
          <div>
            <p>${t('profile.avatar.hint')}</p>
            <button type="button" class="wb-editor-chip" onClick=${avatar}>${t(profile.rootId ? 'profile.avatar.edit' : 'profile.avatar.make')}</button>
          </div>
        </section>
        <label>${t('profile.email')}<input type="email" value=${profile.email} readonly aria-describedby="wb-profile-email" /><small id="wb-profile-email">${t('profile.email.hint')}</small></label>
        <label>${t('profile.username')}<input type="text" value=${form.username} maxlength="30" autocomplete="username" onInput=${set('username')} /><small>${t('profile.username.hint')}</small></label>
        <label>${t('profile.name')}<input type="text" value=${form.name} maxlength="100" autocomplete="name" onInput=${set('name')} /></label>
        <label>${t('profile.pseudonym')}<input type="text" value=${form.pseudonym} maxlength="100" onInput=${set('pseudonym')} /><small>${t('profile.pseudonym.hint')}</small></label>
        <label>${t('profile.titlePattern')}<input type="text" value=${form.titlePattern} maxlength="200" onInput=${set('titlePattern')} /></label>
        <label>${t('profile.descPattern')}<input type="text" value=${form.descPattern} maxlength="200" onInput=${set('descPattern')} /><small>${t('profile.pattern.hint')}</small></label>
        <label>${t('profile.visibility')}
          <select value=${form.visibility} onChange=${set('visibility')}>${['hidden', 'public'].map(v => html`<option value=${v} selected=${form.visibility === v}>${t(`profile.visibility.${v}`)}</option>`)}</select>
        </label>
        <p class="wb-profile-bar"><button type="submit" class="wb-editor-chip" disabled=${busy}>${t('profile.save')}</button><span role="status">${note}</span></p>
      </form>
    <//>
  `;
};
