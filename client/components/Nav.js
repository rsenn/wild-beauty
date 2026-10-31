import { html } from '../html.js';
import { useI18n } from '../i18n.js';

const Flag = ({ language, href, current }) => html`
  <a class="wb-flag" href=${href} hreflang=${language.code} lang=${language.code} title=${language.name} aria-current=${current ? 'true' : null}>
    ${language.flag ? html`<img src=${`/static/img/flag-${language.flag}.svg`} alt=${language.name} />` : language.code}
  </a>
`;

// the language tab lists one flag per locales/*.json; it grows like the others
const LanguageTab = ({ item, hrefFor }) => {
  const { t, lang, languages } = useI18n();

  return html`
    <li class="wb-tab wb-tab-lang">
      <span class="wb-tab-label">${item.label}</span>
      <span class="wb-tab-caption" role="group" aria-label=${t('nav.lang.label')}>
        <span class="wb-flags">${languages.map(language => html`<${Flag} language=${language} href=${hrefFor(language.code)} current=${language.code === lang} />`)}</span>
      </span>
    </li>
  `;
};

// the tab strip; the active tab grows and shows its caption
export const Nav = ({ items, active, hrefFor, onLogin }) => {
  const { t } = useI18n();

  return html`
    <nav class="wb-nav" aria-label=${t('nav.main')}>
      <ul class="wb-tabs">
        ${items.map(item =>
          item.id === 'lang'
            ? html`<${LanguageTab} item=${item} hrefFor=${hrefFor} />`
            : item.id === 'login'
            ? html`
                <li class=${'wb-tab' + (active === 'login' ? ' wb-tab-active' : '')}>
                  <button type="button" class="wb-tab-button" onClick=${onLogin} aria-haspopup="dialog" aria-expanded=${active === 'login' ? 'true' : 'false'}>
                    <span class="wb-tab-label">${item.label}</span>
                    <span class="wb-tab-caption">${item.caption}</span>
                  </button>
                </li>
              `
            : html`
                <li class=${'wb-tab' + (item.id === active ? ' wb-tab-active' : '')}>
                  <a href=${item.href} aria-current=${item.id === active ? 'page' : null}>
                    <span class="wb-tab-label">${item.label}</span>
                    <span class="wb-tab-caption">${item.caption}</span>
                  </a>
                </li>
              `,
        )}
      </ul>
    </nav>
  `;
};
