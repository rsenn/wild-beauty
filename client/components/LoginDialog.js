import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useEffect, useRef, useState } from '../../vendor/hooks.js';

// how long the tumble lasts; the same value is --wb-login-time in the theme
export const TUMBLE_MS = 1000;

// a translucent two-stop gradient over the page, new at every opening (the old
// app's randomGradient): a random hue, dark at one end and light at the other
const gradient = () => {
  const hue = Math.floor(Math.random() * 360);
  const sat = Math.floor(50 + Math.random() * 50);
  const lum = Math.floor(60 + Math.random() * 25);
  const angle = Math.floor(((hue + sat + lum) % 360) - 180);

  return `linear-gradient(${angle}deg, hsl(${hue} ${sat}% ${lum / 2}% / 0.8) 0%, hsl(${hue} ${sat}% ${100 - (100 - lum) / 2}% / 0.8) 100%)`;
};

// The authentication modal. Opening tumbles the whole overlay (gradient and card)
// in from the top right corner, where the Login tab is, by a 3D rotate and zoom;
// closing tumbles it out to the bottom left. `phase` is the state of that motion:
// enter (start pose), open (resting), leave (end pose); the CSS does the rest.
// `onSubmit(username, password)` -> Promise<{ ok, error }>.
export const LoginDialog = ({ open, onClose, onSubmit }) => {
  const { t } = useI18n();
  const [phase, setPhase] = useState('closed');
  const [background, setBackground] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const first = useRef(null);
  const timer = useRef(0);

  useEffect(() => {
    clearTimeout(timer.current);

    if(open) {
      setBackground(gradient());
      setStatus(null);
      setPhase('enter');
      // two frames: the start pose must be painted before the transition begins
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));

      return () => cancelAnimationFrame(frame);
    }

    setPhase(p => (p === 'closed' ? p : 'leave'));
    timer.current = setTimeout(() => setPhase('closed'), TUMBLE_MS);

    return () => clearTimeout(timer.current);
  }, [open]);

  useEffect(() => {
    if(phase === 'open') first.current?.focus();
  }, [phase]);

  if(phase === 'closed') return null;

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    const result = await onSubmit(user, pass).catch(() => ({ ok: false }));

    setBusy(false);
    setStatus(result.ok ? { ok: true } : { error: result.error ?? t('login.failed') });
    if(result.ok) setTimeout(onClose, 1333);
  };

  return html`
    <div class=${`wb-login-overlay wb-login-${phase}`} style=${{ background }} onKeyDown=${e => e.key === 'Escape' && onClose()} onClick=${e => e.target === e.currentTarget && onClose()}>
      <form class="wb-login" role="dialog" aria-modal="true" aria-label=${t('login.label')} onSubmit=${submit}>
        <div class="wb-login-title">${t('login.title')}</div>
        <label class="wb-login-field">
          <span>${t('login.username')}</span>
          <input ref=${first} name="username" type="text" autocomplete="username" value=${user} onInput=${e => setUser(e.target.value)} />
        </label>
        <label class="wb-login-field">
          <span>${t('login.password')}</span>
          <input name="password" type="password" autocomplete="current-password" value=${pass} onInput=${e => setPass(e.target.value)} />
        </label>
        <button class="wb-login-button" disabled=${busy}>${t('login.submit')}</button>
        ${status && html`<div class=${status.ok ? 'wb-login-status' : 'wb-login-status wb-login-error'} role="status">${status.ok ? t('login.logged') : status.error}</div>`}
      </form>
    </div>
  `;
};
