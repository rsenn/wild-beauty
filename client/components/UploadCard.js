import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { formatSize, paddingStyle } from '../files.js';

// file name and size under the thumbnail are switched off for now
const SHOW_FILE_INFO = false;

// one file of the upload grid: thumbnail (whole photo "extend" or "crop"),
// remove, rotate, select, upload state; the thumbnail is the local file until
// the server has it, then the server's display file
export const UploadCard = ({ item, onToggle, onRemove, onRotate, onFit, onRetry }) => {
  const { t, lang } = useI18n();
  const { limits } = useBoot();
  const [brokenSrc, setBrokenSrc] = useState(null);
  const src = item.record ? `/files/uploads/${item.record.display}` : item.url;
  const busy = item.state === 'uploading' || item.state === 'processing';
  const cls = 'wb-card' + (item.selected ? ' wb-card-selected' : '') + ' wb-card-' + item.state;
  const percent = Math.round(item.progress * 100);

  const status = {
    queued: () => t('upload.state.queued'),
    uploading: () => t('upload.state.uploading', { percent }),
    processing: () => t('upload.state.processing'),
    failed: () => t('upload.error.' + item.error, { max: formatSize(limits.maxBytes, lang) }),
  }[item.state]?.();

  return html`
    <li class=${cls}>
      <div class="wb-card-box" style=${paddingStyle(item.record)}>
        <button type="button" class="wb-card-face" aria-pressed=${item.selected ? 'true' : 'false'} onClick=${onToggle} title=${item.file.name}>
          ${brokenSrc === src
            ? html`<span class="wb-card-nopreview">${t('upload.no-preview')}</span>`
            : html`<img class=${'wb-card-image wb-fit-' + item.fit} style=${`transform: rotate(${item.rotation}deg)`} src=${src} alt=${item.file.name} draggable="false" onError=${() => setBrokenSrc(src)} />`}
        </button>
        <button type="button" class="wb-round wb-card-remove" onClick=${onRemove} title=${t('upload.remove')} aria-label=${t('upload.remove')}></button>
        <button type="button" class="wb-round wb-card-rotate" onClick=${onRotate} title=${t('upload.rotate')} aria-label=${t('upload.rotate')}></button>
        <button type="button" class="wb-card-fit" onClick=${onFit} title=${t('upload.fit.toggle')} aria-label=${t('upload.fit.toggle')}>${t(item.fit === 'cover' ? 'upload.fit.crop' : 'upload.fit.extend')}</button>
        ${busy && html`<div class="wb-card-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${percent}><div class="wb-card-progress-bar" style=${`width: ${percent}%`}></div></div>`}
      </div>
      ${SHOW_FILE_INFO && html`<span class="wb-card-name">${item.file.name}</span>`}
      ${SHOW_FILE_INFO && html`<span class="wb-card-size">${formatSize(item.file.size, lang)}</span>`}
      ${status && html`<span class="wb-card-status" role=${item.state === 'failed' ? 'alert' : null}>${status}</span>`}
      ${item.state === 'failed' && item.error !== 'too-large' && html`<button type="button" class="wb-card-retry" onClick=${onRetry}>${t('upload.retry')}</button>`}
    </li>
  `;
};
