import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// The 3D gallery of a node (GALLERY.md, TODO 13.6): the node's own view is the
// poster; a button enters the walkable gallery in the same square, which can fill
// the screen. Everything of the gallery (three.js too) is loaded on entering.
//  items  what to hang (client/gallery/items.js)
//  overview  a gallery node: the gallery is shown at once from above (overview.js), the
//            button flies down into it, the stage widens and the visitor walks
//  doc    the node's document: a gallery node's drawn walls make the plan (fromdoc.js)
//  children  the poster, shown until entered
//  wide      a poster that is not square (a list): the button goes above it, not over it
export const GalleryView = ({ items, doc, label, overview = false, wide = false, children }) => {
  const { t } = useI18n();
  const [state, setState] = useState('poster'); // poster | loading | live | error
  const [fill, setFill] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [hud, setHud] = useState(null);
  const [walking, setWalking] = useState(false); // overview only: the visitor has flown down
  const [seen, setSeen] = useState(false); // the hint goes once the visitor has stepped or walked
  const box = useRef(null);
  const lens = useRef(null);
  const canvas = useRef(null);
  const live = useRef(null);
  const entered = state === 'loading' || state === 'live';

  // a gallery node shows its gallery at once; the poster stays for a browser without scripts
  useEffect(() => {
    if(overview) setState('loading');
  }, []);

  // enter: import the session, start it on the canvas; leave: dispose it
  useEffect(() => {
    if(!entered) return;

    let cancelled = false;

    import('../gallery/session.js')
      .then(({ startGallery }) =>
        startGallery(canvas.current, {
          items,
          doc,
          overview,
          onLock: setLocked,
          onLens: v => lens.current && ((lens.current.style.opacity = v), (lens.current.hidden = v < 0.01)),
          onState: s => {
            setHud(s);
            if(s.index !== 0 || s.mode === 'free' || s.moving) setSeen(true);
          },
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

    // back up above the gallery, the stage square again
    if(overview) {
      live.current?.command('overview');
      setWalking(false);
      setHud(h => h && { ...h, mode: 'overview' });
    } else setState('poster');
  };
  const walk = () => {
    live.current?.command('walk');
    setWalking(true);
  };

  if(overview && state === 'poster') return children;

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
    <div class=${`wb-gallery${cover ? ' wb-gallery-fill' : ''}${overview && walking ? ' wb-gallery-wide' : ''}`} ref=${box} role="application" aria-label=${label}>
      ${state !== 'error' && html`<canvas ref=${canvas} class="wb-gallery-canvas" tabindex="0"></canvas>`}
      <div ref=${lens} class="wb-gallery-lens" aria-hidden="true" hidden></div>
      <div class="wb-gallery-bar">
        ${state === 'live' && html`<button type="button" class="wb-editor-chip" onClick=${toggleFull}>${t(full ? 'gallery.fullscreen.exit' : 'gallery.fullscreen')}</button>`}
        ${(!overview || walking) && html`<button type="button" class="wb-editor-chip" onClick=${leave}>${t(overview ? 'gallery.overview' : 'gallery.leave')}</button>`}
      </div>
      ${overview && state === 'live' && !walking && html`<button type="button" class="wb-editor-chip wb-gallery-enter" onClick=${walk}>${t('gallery.enter')}</button>`}
      ${state === 'loading' && html`<p class="wb-gallery-note" role="status">${t('gallery.loading')}</p>`}
      ${state === 'error' && html`<p class="wb-gallery-note" role="alert">${error}</p>`}
      ${state === 'live' && hud && hud.mode !== 'overview' && html`
        <div class="wb-gallery-hud" role="toolbar" aria-label=${t('gallery.hud')}>
          ${hud.mode === 'guide' && html`
            <button type="button" class="wb-editor-chip" disabled=${hud.index <= 0} aria-label=${t('gallery.prev')} onClick=${() => live.current?.command('prev')}>◀</button>
            <span class="wb-gallery-count" role="status">${t('view.of', { n: hud.index + 1, count: hud.total })}${hud.title ? ` · ${hud.title}` : ''}</span>
            <button type="button" class="wb-editor-chip" disabled=${hud.index >= hud.total - 1} aria-label=${t('gallery.next')} onClick=${() => live.current?.command('next')}>▶</button>
            ${hud.canOpen && html`<button type="button" class="wb-editor-chip" onClick=${() => live.current?.command('open')}>${t('gallery.open')}</button>`}
          `}
          <button type="button" class="wb-editor-chip" onClick=${() => live.current?.command('guide')}>${t(hud.mode === 'guide' ? 'gallery.free' : 'gallery.guide')}</button>
        </div>
      `}
      ${state === 'live' && (!overview || walking) && !locked && !seen && html`<p class="wb-gallery-note wb-gallery-help">${t(hud?.mode === 'free' ? 'gallery.help' : 'gallery.help.guide')}</p>`}
    </div>
  `;
};
