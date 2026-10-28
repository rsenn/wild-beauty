import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// A cell of the upload grid that deletes every upload not in a work (E111). It asks
// once, in place; photos of the open editor and of stored drafts stay (`held`).
export const SweepTile = ({ count, held, onSweep }) => {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if(asking)
    return html`<li class="wb-card wb-card-sweep">
      <div class="wb-card-box wb-sweep wb-sweep-ask" role="alertdialog" aria-label=${t('upload.sweep.title')}>
        <span class="wb-sweep-text">${t('upload.sweep.confirm', { count })}</span>
        <span class="wb-sweep-buttons">
          <button type="button" class="wb-button" disabled=${busy} onClick=${async () => (setBusy(true), await onSweep(), setBusy(false), setAsking(false))}>${t('upload.sweep.yes')}</button>
          <button type="button" class="wb-button wb-button-quiet" disabled=${busy} onClick=${() => setAsking(false)}>${t('upload.sweep.no')}</button>
        </span>
      </div>
    </li>`;

  return html`<li class="wb-card wb-card-sweep">
    <button type="button" class="wb-card-box wb-sweep" onClick=${() => setAsking(true)}>
      <span class="wb-sweep-icon" aria-hidden="true"></span>
      <span class="wb-sweep-title">${t('upload.sweep.title')}</span>
      <span class="wb-sweep-hint">${t('upload.sweep.hint', { count })}</span>
      ${held > 0 && html`<span class="wb-sweep-hint">${t('upload.sweep.editor', { count: held })}</span>`}
    </button>
  </li>`;
};
