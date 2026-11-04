import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';

const HOLD_MS = 450;
const GAP = 4;

// One button of the tool column (docs/EDITOR.md E37). A tool group (tools.js SLOTS) shows the
// member used last and a corner mark; a long press, a right click or ArrowRight / ArrowDown
// pops the members out beside it (GIMP's tool groups). Picking one makes it the tool and the
// face of the button. `last` is the member shown when none of the group is active.
export const ToolSlot = ({ t, slot, tool, last, disabled, onPick }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const menu = useRef(null);
  const hold = useRef(null);
  const members = slot.members;
  const shown = members.find(m => m.id === tool) ?? members.find(m => m.id === last) ?? members[0];
  const grouped = members.length > 1;
  const pick = id => (setOpen(false), onPick(id));

  // placed beside the button when there is room, else under it; closed by a tap elsewhere or Escape
  useEffect(() => {
    const el = menu.current;

    if(!open || !el) return;

    const a = wrap.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const beside = a.right + GAP + el.offsetWidth <= vw - GAP;

    el.style.left = `${Math.round(beside ? a.right + GAP : Math.max(GAP, Math.min(a.left, vw - GAP - el.offsetWidth)))}px`;
    el.style.top = `${Math.round(beside ? Math.max(GAP, Math.min(a.top, vh - GAP - el.offsetHeight)) : a.bottom + GAP)}px`;
    el.querySelector('[aria-checked="true"]')?.focus();

    const away = e => !wrap.current?.contains(e.target) && setOpen(false);

    window.addEventListener('pointerdown', away, true);

    return () => window.removeEventListener('pointerdown', away, true);
  }, [open]);

  const stopHold = () => (clearTimeout(hold.current), (hold.current = null));
  const down = e => {
    if(!grouped || e.button !== 0) return;

    stopHold();
    hold.current = setTimeout(() => ((hold.current = 'fired'), setOpen(true)), HOLD_MS);
  };
  // a long press opened the group: the release that follows is not a pick
  const click = () => {
    if(hold.current === 'fired') return stopHold();

    stopHold();
    onPick(shown.id);
  };
  const key = e => {
    if(grouped && !open && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) return e.preventDefault(), setOpen(true);
    if(!open) return;

    if(e.key === 'Escape') return e.stopPropagation(), setOpen(false), wrap.current.querySelector('.wb-editor-tool')?.focus();

    const items = [...menu.current.querySelectorAll('[role="menuitemradio"]')];
    const at = items.indexOf(document.activeElement);

    if(e.key === 'ArrowDown' || e.key === 'ArrowUp') e.preventDefault(), items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
  };
  const label = id => t('editor.tool.' + id);

  return html`
    <div class=${'wb-editor-slot' + (grouped ? ' wb-editor-slot-group' : '')} ref=${wrap} onKeyDown=${key}>
      <button
        type="button"
        class=${'wb-editor-button wb-editor-tool wb-editor-tool-' + shown.id}
        disabled=${disabled(shown.id)}
        aria-pressed=${tool === shown.id ? 'true' : 'false'}
        aria-keyshortcuts=${shown.key}
        aria-haspopup=${grouped ? 'menu' : undefined}
        aria-expanded=${grouped ? (open ? 'true' : 'false') : undefined}
        onPointerDown=${down}
        onPointerUp=${() => hold.current !== 'fired' && stopHold()}
        onPointerLeave=${() => hold.current !== 'fired' && stopHold()}
        onClick=${click}
        onContextMenu=${e => grouped && (e.preventDefault(), stopHold(), setOpen(true))}
        title=${`${label(shown.id)} (${shown.key})${grouped ? ' · ' + t('editor.tool.group') : ''}`}
        aria-label=${label(shown.id)}
      >
        <span class="wb-editor-tool-icon" aria-hidden="true"></span>
        <span class="wb-editor-tool-key" aria-hidden="true">${shown.key}</span>
      </button>
      ${open &&
      html`<div class="wb-editor-toolmenu" ref=${menu} role="menu" aria-label=${t('editor.tool.group')}>
        ${members.map(
          m => html`<button type="button" key=${m.id} role="menuitemradio" aria-checked=${m.id === shown.id ? 'true' : 'false'} class=${'wb-editor-toolmenu-item wb-editor-tool-' + m.id} disabled=${disabled(m.id)} onClick=${() => pick(m.id)}>
            <span class="wb-editor-tool-icon" aria-hidden="true"></span>
            <span class="wb-editor-toolmenu-name">${label(m.id)}</span>
            <kbd>${m.key}</kbd>
          </button>`,
        )}
      </div>`}
    </div>
  `;
};
