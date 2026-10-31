import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { isRecording, recordable, setRecording } from '../replay.js';

// The tick box for session recording (client/replay.js): off until the visitor ticks it, for a problem report
// or to help improve the app. Says what is recorded, how long it is kept and that nobody else gets it.
// `fold`: the text behind a link (a personal site's footer) instead of in the open
export const RecordConsent = ({ fold = false }) => {
  const { t } = useI18n();
  const boot = useBoot();
  const [on, setOn] = useState(isRecording);
  const [blocked, setBlocked] = useState(false);

  const change = async e => {
    const want = e.target.checked;
    const now = await setRecording(want);

    setOn(now);
    setBlocked(want && !now);
  };

  // only where a recording is made (replay.js recordable); the server renders it as it would, the browser checks
  if(boot.site ? !boot.site.owner : false) return null;

  const notes = html`
    ${on && html`<p class="wb-record-text" role="status">${t('record.on')}</p>`}
    ${blocked && html`<p class="wb-record-text wb-record-blocked" role="alert">${t('record.blocked')}</p>`}
  `;
  const box = html`<label id="wb-record-label"><input type="checkbox" checked=${on} onChange=${change} /> ${t('record.label')}</label>`;

  // on /new and /tree the label is one line, the rest is behind a triangle (like "what is stored?")
  if(!fold)
    return html`<section class="wb-record" aria-labelledby="wb-record-label">
      ${box}
      <details class="wb-record-more"><summary>${t('record.more')}</summary><p class="wb-record-text">${t('record.text')}</p></details>
      ${notes}
    </section>`;

  const body = html`${box}<p class="wb-record-text">${t('record.text')}</p>${notes}`;

  return html`<details class="wb-record wb-record-fold" open=${on || blocked}><summary>${t('record.summary')}</summary>${body}</details>`;
};
