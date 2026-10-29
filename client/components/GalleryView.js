import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// The 3D gallery of a node (GALLERY.md, TODO 13.6): the node's own view is the
// poster; a button enters the walkable gallery in the same square, which can fill
// the screen. Everything of the gallery (three.js too) is loaded on entering.
//  items  what to hang (client/gallery/items.js)
//  children  the poster, shown until entered
//  wide      a poster that is not square (a list): the button goes above it, not over it
export const GalleryView = ({ items, label, wide = false, children }) => {
  const { t } = useI18n();
  const [state, setState] = useState('poster'); // poster | loading | live | error
  const [fill, setFill] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const box = useRef(null);
  const canvas = useRef(null);
  const live = useRef(null);
  const entered = state === 'loading' || state === 'live';

  // enter: import the session, start it on the canvas; leave: dispose it
  useEffect(() => {
    if(!entered) return;

    let cancelled = false;

    import('../gallery/session.js')
      .then(({ startGallery }) =>
        startGallery(canvas.current, {
          items,
          onLock: setLocked,
          onLost: () => {
            setError(t('gallery.lost'));
            setState('error');
          },
          onOpen: child => child.href && (globalThis.location.href = child.href),
        }),
      )
      .then(g => (cancelled ? g.dispose() : ((live.current = g), setState('live'))))
      .catch(e => {
        if(cancelled) return;

        setError(e?.message === 'webgl' ? t('gallery.unsupported') : t('gallery.failed'));
        setState('error');
      });

    return () => {
      cancelled = true;
      live.current?.dispose();
      live.current = null;
    };
  }, [entered]);

  // the Fullscreen API where there is one (not on an iPhone), else the page-filling class
  useEffect(() => {
    const change = () => setFill(document.fullscreenElement === box.current);

    document.addEventListener('fullscreenchange', change);

    return () => document.removeEventListener('fullscreenchange', change);
  }, []);

  const [cover, setCover] = useState(false); // page-filling fallback
  const full = fill || cover;
  const toggleFull = () => {
    if(full) return document.fullscreenElement ? document.exitFullscreen() : setCover(false);

    if(box.current?.requestFullscreen) box.current.requestFullscreen().catch(() => setCover(true));
    else setCover(true);
  };
  const leave = () => {
    if(document.fullscreenElement) document.exitFullscreen();

    setCover(false);
    setState('poster');
  };

  if(!entered && state !== 'error') {
    const enter = html`<button type="button" class=${`wb-editor-chip wb-gallery-enter${wide ? ' wb-gallery-enter-inline' : ''}`} onClick=${() => setState('loading')}>${t('gallery.enter')}</button>`;

    return wide
      ? html`<p>${enter}</p>${children}`
      : html`
          <div class="wb-gallery-poster">
            ${children}
            ${enter}
          </div>
        `;
  }

  return html`
    <div class=${`wb-gallery${cover ? ' wb-gallery-fill' : ''}`} ref=${box} role="application" aria-label=${label}>
      ${state !== 'error' && html`<canvas ref=${canvas} class="wb-gallery-canvas" tabindex="0"></canvas>`}
      <div class="wb-gallery-bar">
        ${state === 'live' && html`<button type="button" class="wb-editor-chip" onClick=${toggleFull}>${t(full ? 'gallery.fullscreen.exit' : 'gallery.fullscreen')}</button>`}
        <button type="button" class="wb-editor-chip" onClick=${leave}>${t('gallery.leave')}</button>
      </div>
      ${state === 'loading' && html`<p class="wb-gallery-note" role="status">${t('gallery.loading')}</p>`}
      ${state === 'error' && html`<p class="wb-gallery-note" role="alert">${error}</p>`}
      ${state === 'live' && !locked && html`<p class="wb-gallery-note wb-gallery-help">${t('gallery.help')}</p>`}
    </div>
  `;
};
