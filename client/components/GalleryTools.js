import { useEffect, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { navOf, toolsOf } from '../gallery/chrome.js';

// the state of a gallery store, redrawn when it changes
export const useChrome = chrome => {
  const [state, setState] = useState(chrome.state);

  useEffect(() => {
    setState(chrome.state);

    return chrome.subscribe(setState);
  }, [chrome]);

  return state;
};

const paths = {
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  overview: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5M12 12v9',
  leave: 'M6 6l12 12M18 6L6 18',
  help: 'M9.2 9.3a2.9 2.9 0 1 1 4.1 2.6c-.8.4-1.3 1-1.3 1.9M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
};

// a button with an icon and no text: the name is for screen readers and a mouse's tooltip
export const IconButton = ({ icon, label, pressed, onClick, disabled }) => html`
  <button type="button" class="wb-editor-chip wb-icon-button" aria-label=${label} title=${label} aria-pressed=${pressed === undefined ? null : pressed ? 'true' : 'false'} disabled=${disabled} onClick=${onClick}>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d=${paths[icon]} /></svg>
  </button>
`;

// right of the node title: help, fullscreen, back to the overview
export const GalleryTools = ({ chrome, overview }) => {
  const { t } = useI18n();
  const s = useChrome(chrome);
  const show = toolsOf(s);

  if(!show.fullscreen) return null;

  return html`
    <div class="wb-gallery-tools" role="toolbar" aria-label=${t('gallery.hud')}>
      ${show.help && html`<${IconButton} icon="help" label=${t('gallery.help.button')} pressed=${s.help} onClick=${() => chrome.actions.help?.()} />`}
      <${IconButton} icon=${s.full ? 'shrink' : 'expand'} label=${t(s.full ? 'gallery.fullscreen.exit' : 'gallery.fullscreen')} onClick=${() => chrome.actions.fullscreen?.()} />
      ${show.leave && html`<${IconButton} icon=${overview ? 'overview' : 'leave'} label=${t(overview ? 'gallery.overview' : 'gallery.leave')} onClick=${() => chrome.actions.leave?.()} />`}
    </div>
  `;
};

// beside the edit button: the previous and next picture and where in the gallery that is
export const GalleryNav = ({ chrome }) => {
  const { t } = useI18n();
  const s = useChrome(chrome);

  if(!navOf(s)) return null;

  const { hud } = s;

  return html`
    <div class="wb-gallery-nav" role="toolbar" aria-label=${t('gallery.hud')}>
      <button type="button" class="wb-editor-chip wb-icon-button" disabled=${hud.index <= 0} aria-label=${t('gallery.prev')} onClick=${() => chrome.actions.prev?.()}>◀</button>
      <span class="wb-gallery-count" role="status" title=${hud.title || null}>${t('view.of', { n: hud.index + 1, count: hud.total })}${hud.title ? ` · ${hud.title}` : ''}</span>
      <button type="button" class="wb-editor-chip wb-icon-button" disabled=${hud.index >= hud.total - 1} aria-label=${t('gallery.next')} onClick=${() => chrome.actions.next?.()}>▶</button>
    </div>
  `;
};
