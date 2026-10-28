import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';

// A button that opens a small panel under it (EDITOR.md S2.9 pattern, shared by
// the properties and the opacity/blend popovers). Escape closes it and gives the
// focus back to the button.
let serial = 0;

export const Popover = ({ label, class: className = '', align = 'left', children }) => {
  const [open, setOpen] = useState(false);
  const [id] = useState(() => `wb-pop-${++serial}`);
  const panel = useRef(null);

  // keep the panel inside the window: shifted sideways when it would run off an edge
  useEffect(() => {
    const el = panel.current;

    if(!open || !el) return;

    const fit = () => {
      el.style.transform = '';

      const r = el.getBoundingClientRect();
      const room = document.documentElement.clientWidth - 8;
      let shift = Math.min(0, room - r.right);

      if(r.left + shift < 8) shift = 8 - r.left;

      el.style.transform = shift ? `translateX(${Math.round(shift)}px)` : '';
    };

    fit();
    window.addEventListener('resize', fit);

    return () => window.removeEventListener('resize', fit);
  }, [open]);

  return html`
    <div class=${'wb-editor-props ' + className} onKeyDown=${e => open && e.key === 'Escape' && (e.stopPropagation(), setOpen(false), document.getElementById(id + '-button')?.focus())}>
      <button type="button" class="wb-editor-chip" id=${id + '-button'} aria-expanded=${open ? 'true' : 'false'} aria-controls=${id} onClick=${() => setOpen(!open)}>${label}</button>
      ${open &&
      html`<div ref=${panel} id=${id} class=${'wb-editor-popover wb-editor-popover-' + align} role="group" aria-label=${label}>${children}</div>`}
    </div>
  `;
};
