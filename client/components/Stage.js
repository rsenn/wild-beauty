import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { STAGE, eventUnits, pixelsPerUnit } from '../editor/stage.js';

// The square stage (EDITOR.md S2.2, E36): `content` (the rendered node) fills
// it, an overlay <svg> with the same 0..1000 viewBox lies on top for what is
// not part of the node (selection handles, the live stroke). Pointer events on
// the overlay come out as `onPointer.{down,move,up,cancel}(event, [x, y])`
// with the position already in stage units. A ResizeObserver keeps the
// on-screen size, so `overlay({ scale })` can size handles in pixels and
// `onSize({ width, height })` hears of changes. A wheel turn comes out as
// `onPointer.wheel` too; the handler calls preventDefault when it uses it.
//  interactive  the overlay takes pointer events (a tool is active)
//  className    extra class on the overlay (cursor); `class` goes on the stage box
export const Stage = ({ class: extra = '', label, content, overlay, interactive = false, loupe: wanted = false, className = '', onPointer = {}, onSize, children, ...rest }) => {
  const box = useRef(null);
  const svg = useRef(null);
  const [scale, setScale] = useState(1);
  const [look, setLook] = useState(null); // where a finger is, in stage units, while the loupe shows

  useEffect(() => {
    if(!box.current || typeof ResizeObserver === 'undefined') return;

    const watch = new ResizeObserver(() => {
      const { width, height } = svg.current.getBoundingClientRect();

      setScale(pixelsPerUnit(width));
      onSize?.({ width, height });
    });

    watch.observe(box.current);

    return () => watch.disconnect();
  }, []);

  // hand the handlers the event and its units; no units, no call
  const wrap = name => event => {
    const units = eventUnits(svg.current, event);

    // a finger hides the point it places: a magnifier shows it from above (E124)
    if(wanted && event.pointerType !== 'mouse') setLook(name === 'up' || name === 'cancel' ? null : units ? { x: units[0], y: units[1] } : null);

    if(units) onPointer[name]?.(event, units);
  };

  // a pen reports more positions than frames: every coalesced one is a point of
  // the stroke, so fast curves keep their shape
  const moved = event => {
    const all = event.getCoalescedEvents?.() ?? [];

    if(all.length < 2) return wrap('move')(event);

    for(const e of all) {
      const units = eventUnits(svg.current, e);

      if(units) onPointer.move?.(e, units);
    }

    const last = all[all.length - 1];
    const at = last && eventUnits(svg.current, last);

    if(wanted && at && event.pointerType !== 'mouse') setLook({ x: at[0], y: at[1] });
  };

  const down = event => {
    if(event.button > 0) return;

    // a handle that must not take the focus from a field (the corner of a text box being typed in)
    const units = eventUnits(svg.current, event);

    if(units && onPointer.claim?.(event, units)) {
      event.preventDefault();
      svg.current.setPointerCapture?.(event.pointerId);

      return;
    }

    box.current?.focus({ preventScroll: true }); // keys go to the stage from here on

    svg.current.setPointerCapture?.(event.pointerId);
    wrap('down')(event);
  };

  return html`
    <div ref=${box} class=${'wb-editor-stage' + (extra ? ' ' + extra : '')} role="img" aria-label=${label} ...${rest}>
      ${content}
      <svg ref=${svg} class=${'wb-editor-overlay' + (interactive ? ' wb-editor-interactive' : '') + (className ? ' ' + className : '')} viewBox=${`0 0 ${STAGE} ${STAGE}`} onPointerDown=${interactive ? down : undefined} onPointerMove=${interactive ? moved : undefined} onPointerUp=${interactive ? wrap('up') : undefined} onPointerCancel=${interactive ? wrap('cancel') : undefined} onWheel=${interactive ? wrap('wheel') : undefined}>
        ${typeof overlay === 'function' ? overlay({ scale }) : overlay}
      </svg>
      ${look && wanted && html`<${Loupe} look=${look} scale=${scale} content=${content} overlay=${overlay} />`}
      ${children}
    </div>
  `;
};

const LOUPE = 120; // the magnifier's diameter in pixels
const ZOOM = 3;

// A round magnifier above the finger (below it near the top edge): the stage
// again, ZOOM times larger, centred on the point being placed.
const Loupe = ({ look, scale, content, overlay }) => {
  const side = STAGE * scale;
  const x = look.x * scale;
  const y = look.y * scale;
  const below = y < LOUPE * 1.4;
  const left = Math.min(Math.max(x, LOUPE / 2), Math.max(LOUPE / 2, side - LOUPE / 2));

  return html`<div class="wb-loupe" aria-hidden="true" style=${`left:${left - LOUPE / 2}px;top:${below ? y + LOUPE * 0.45 : y - LOUPE * 1.45}px;width:${LOUPE}px;height:${LOUPE}px`}>
    <div class="wb-loupe-inner" style=${`width:${side}px;height:${side}px;transform:translate(${LOUPE / 2 - x * ZOOM}px,${LOUPE / 2 - y * ZOOM}px) scale(${ZOOM})`}>
      ${content}
      <svg class="wb-editor-overlay" viewBox=${`0 0 ${STAGE} ${STAGE}`}>${typeof overlay === 'function' ? overlay({ scale }) : overlay}</svg>
    </div>
    <span class="wb-loupe-dot"></span>
  </div>`;
};
