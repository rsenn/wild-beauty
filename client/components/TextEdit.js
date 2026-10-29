import { useEffect, useRef } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { FONTS, LINE_HEIGHT, firstBaseline } from '../editor/text.js';

// The in-place editor of a text box (EDITOR.md E91): a transparent textarea laid
// exactly over the box, so the caret and the selection are the browser's (IME and
// right-to-left text work natively) while the drawn text under it is the box.
// `scale` is screen pixels per stage unit. Esc and leaving the field end it.
export const TextEdit = ({ step, m, scale, label, onText, onDone, onGrip }) => {
  const field = useRef(null);

  useEffect(() => {
    field.current?.focus();
    field.current?.setSelectionRange(field.current.value.length, field.current.value.length);
  }, []);

  const [a, b, c, d, e, f] = m;
  const pad = step.padding ?? 0;
  const face = FONTS[step.font] ?? FONTS.sans;
  const lines = Math.max(1, (step.text ?? '').split('\n').length, step.lines?.length ?? 1);
  // the textarea's first baseline lies half-leading + ascent under its content top: pad so it meets the drawn one
  const topPad = Math.max(0, firstBaseline(face, lines, step.size, step.h) - face.asc * step.size - (step.size * (LINE_HEIGHT - face.asc - face.desc)) / 2);
  const style = [
    `width:${step.w}px`,
    `height:${step.h}px`,
    `padding:${topPad}px ${pad}px ${pad}px`,
    `font:${step.bold ? (FONTS[step.font] ?? FONTS.sans).bold : 400} ${step.size}px/1.2 ${(FONTS[step.font] ?? FONTS.sans).stack}`,
    `text-align:${step.align === 'center' ? 'center' : step.align === 'end' ? 'end' : 'start'}`,
    `caret-color:${step.color}`,
    `transform:matrix(${a * scale},${b * scale},${c * scale},${d * scale},${e * scale},${f * scale})`,
  ].join(';');

  return html`<textarea
    ref=${field}
    class="wb-text-edit"
    style=${style}
    value=${step.text}
    dir="auto"
    spellcheck="false"
    aria-label=${label}
    onInput=${event => onText(event.target.value)}
    onPointerDown=${onGrip}
    onBlur=${onDone}
    onKeyDown=${event => {
      event.stopPropagation();

      if(event.key === 'Escape') {
        event.preventDefault();
        onDone();
      }
    }}
  />`;
};
