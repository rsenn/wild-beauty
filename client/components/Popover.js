import { useState } from '../../vendor/hooks.js';
import { html } from '../html.js';

// A button that opens a small panel under it (EDITOR.md S2.9 pattern, shared by
// the properties and the opacity/blend popovers). Escape closes it and gives the
// focus back to the button.
let serial = 0;

export const Popover = ({ label, class: className = '', align = 'left', children }) => {
  const [open, setOpen] = useState(false);
  const [id] = useState(() => `wb-pop-${++serial}`);

  return html`
    <div class=${'wb-editor-props ' + className} onKeyDown=${e => open && e.key === 'Escape' && (e.stopPropagation(), setOpen(false), document.getElementById(id + '-button')?.focus())}>
      <button type="button" class="wb-editor-chip" id=${id + '-button'} aria-expanded=${open ? 'true' : 'false'} aria-controls=${id} onClick=${() => setOpen(!open)}>${label}</button>
      ${open &&
      html`<div id=${id} class=${'wb-editor-popover wb-editor-popover-' + align} role="group" aria-label=${label}>${children}</div>`}
    </div>
  `;
};
