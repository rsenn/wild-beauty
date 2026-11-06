import { useEffect, useRef } from '../../vendor/hooks.js';

const GAP = 8;

// Keeps a popover panel inside the window, whatever its size and wherever its button is: the panel is
// placed with `position: fixed` under its anchor (the parent element), shifted sideways to fit, put above
// the anchor when there is no room below, and scrolls inside itself when it is taller than the window.
// Placed again on resize, scroll and whenever the panel changes size. -> ref for the panel
export function usePopFit(open, { right = true } = {}) {
  const panel = useRef(null);

  useEffect(() => {
    const el = panel.current;

    if(!open || !el) return;

    const place = () => {
      // a scroll or resize that arrives while the panel is being taken out of the page
      if(!el.isConnected || !el.parentElement) return;

      const anchor = el.parentElement.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;

      el.style.position = 'fixed';
      el.style.maxWidth = `${vw - 2 * GAP}px`;
      el.style.maxHeight = `${vh - 2 * GAP}px`;
      el.style.overflow = 'auto';
      el.style.right = 'auto';
      el.style.transform = '';

      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = Math.max(GAP, Math.min(right ? anchor.right - w : anchor.left, vw - GAP - w));
      const below = anchor.bottom + 2;
      const top = below + h <= vh - GAP ? below : anchor.top - h - 2 >= GAP ? anchor.top - h - 2 : Math.max(GAP, vh - GAP - h);

      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(top)}px`;
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);

    const watch = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;

    watch?.observe(el);

    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      watch?.disconnect();
    };
  }, [open]);

  return panel;
}
