import { useEffect, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { pushState, pushSupported, setPush } from '../push.js';

// "Notify me about new pages" at the foot of a personal site: one button that follows the browser's state
export const PushToggle = () => {
  const { t } = useI18n();
  const [state, setState] = useState(null);

  useEffect(() => {
    if(pushSupported()) pushState().then(setState, () => {});
  }, []);

  if(!state) return null;

  const change = async () => setState(await setPush(state !== 'on').catch(() => state));

  return html`<div class="site-push"><button type="button" class="site-push-button" aria-pressed=${state === 'on' ? 'true' : 'false'} disabled=${state === 'denied'} onClick=${change}>${t(state === 'on' ? 'push.on' : state === 'denied' ? 'push.denied' : 'push.off')}</button></div>`;
};
