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
export const Stage = ({ class: extra = '', label, content, overlay, interactive = false, className = '', onPointer = {}, onSize, children, ...rest }) => {
  const box = useRef(null);
  const svg = useRef(null);
  const [scale, setScale] = useState(1);

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
  };

  const down = event => {
    if(event.button > 0) return;

    svg.current.setPointerCapture?.(event.pointerId);
    wrap('down')(event);
  };

  return html`
    <div ref=${box} class=${'wb-editor-stage' + (extra ? ' ' + extra : '')} role="img" aria-label=${label} ...${rest}>
      ${content}
      <svg ref=${svg} class=${'wb-editor-overlay' + (interactive ? ' wb-editor-interactive' : '') + (className ? ' ' + className : '')} viewBox=${`0 0 ${STAGE} ${STAGE}`} onPointerDown=${interactive ? down : undefined} onPointerMove=${interactive ? moved : undefined} onPointerUp=${interactive ? wrap('up') : undefined} onPointerCancel=${interactive ? wrap('cancel') : undefined} onWheel=${interactive ? wrap('wheel') : undefined}>
        ${typeof overlay === 'function' ? overlay({ scale }) : overlay}
      </svg>
      ${children}
    </div>
  `;
};
