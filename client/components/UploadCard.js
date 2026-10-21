import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { formatSize } from '../files.js';

// one file of the upload grid: thumbnail (whole photo "extend" or "crop"),
// remove, rotate, select; `item.state` is queued until M5 uploads it
export const UploadCard = ({ item, onToggle, onRemove, onRotate, onFit }) => {
  const { t, lang } = useI18n();
  const [broken, setBroken] = useState(false);
  const cls = 'wb-card' + (item.selected ? ' wb-card-selected' : '') + ' wb-card-' + item.state;

  return html`
    <li class=${cls}>
      <div class="wb-card-box">
        <button type="button" class="wb-card-face" aria-pressed=${item.selected ? 'true' : 'false'} onClick=${onToggle} title=${item.file.name}>
          ${broken
            ? html`<span class="wb-card-nopreview">${t('upload.no-preview')}</span>`
            : html`<img class=${'wb-card-image wb-fit-' + item.fit} style=${`transform: rotate(${item.rotation}deg)`} src=${item.url} alt=${item.file.name} draggable="false" onError=${() => setBroken(true)} />`}
        </button>
        <button type="button" class="wb-round wb-card-remove" onClick=${onRemove} title=${t('upload.remove')} aria-label=${t('upload.remove')}></button>
        <button type="button" class="wb-round wb-card-rotate" onClick=${onRotate} title=${t('upload.rotate')} aria-label=${t('upload.rotate')}></button>
        <button type="button" class="wb-card-fit" onClick=${onFit} title=${t('upload.fit.toggle')} aria-label=${t('upload.fit.toggle')}>${t(item.fit === 'cover' ? 'upload.fit.crop' : 'upload.fit.extend')}</button>
      </div>
      <span class="wb-card-name">${item.file.name}</span>
      <span class="wb-card-size">${formatSize(item.file.size, lang)}</span>
    </li>
  `;
};
