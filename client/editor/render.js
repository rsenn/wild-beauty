// The one renderer (EDITOR.md S5): a node document -> Preact vnodes, used by
// SSR, the editor stage, thumbnails and the viewer. Pure: everything it
// needs comes from the document and the options.
import { html } from '../html.js';
import { cropWindow, isColour, isTexture } from './model.js';
import { gridLayout } from './grid.js';
import { lerpMatrix } from './matrix.js';
import { ease } from './playback.js';
import { sanitize, toAttr } from './theme.js';
import { outline, outlinePath } from './pen.js';

const STAGE = 1000;
const HEX = /^#[0-9a-f]{3,8}$/i;

// `photos(hash)` -> { href, width, height }, the display size in pixels
// (orientation applied); null when the photo is unknown.
// A photo's local space is the 1000 unit square of its crop window.

// a `photo` step: the picture cut to its square at `crop` along the long
// edge, under the step's matrix. Opacity and blend go to the group's style.
export function renderPhoto(step, info) {
  if(!info || !(info.width > 0) || !(info.height > 0)) return null;

  const { side, x, y } = cropWindow(info, step.crop);
  const k = STAGE / side; // photo pixels -> local units
  let style = step.opacity !== 1 ? `opacity:${step.opacity}` : '';

  if(step.blend && step.blend !== 'normal') style += `${style ? ';' : ''}mix-blend-mode:${step.blend}`;

  // the nested <svg> cuts the square (its overflow is hidden)
  return html`<g data-step=${step.id} data-op="photo">
    <g transform=${`matrix(${step.m.join(' ')})`} style=${style || undefined}>
      <svg x="0" y="0" width=${STAGE} height=${STAGE} viewBox=${`0 0 ${STAGE} ${STAGE}`} overflow="hidden">
        <image href=${info.href} x=${-x * k} y=${-y * k} width=${info.width * k} height=${info.height * k} preserveAspectRatio="none" />
      </svg>
    </g>
  </g>`;
}

const PATH = /^[MLCZmlcz0-9eE.,\s+-]*$/;
const IDENTITY = [1, 0, 0, 1, 0, 0];

const matrix = m => `matrix(${m.join(' ')})`;
const safeColour = c => (isColour(c) ? c : null);

// a fill or stroke value -> { paint, defs }: a colour as it is, a gradient as
// a <linearGradient>/<radialGradient> reference. Stops are bounding-box
// relative; the angle of a linear gradient is in degrees, 0 = left to right.
function paint(value, id) {
  if(typeof value === 'string') return { paint: safeColour(value) ?? 'none' };

  if(!value || !Array.isArray(value.stops)) return { paint: 'none' };

  const stops = value.stops.filter(s => safeColour(s.c) && Number.isFinite(s.at)).map(s => html`<stop offset=${s.at} stop-color=${s.c} />`);

  if(stops.length < 2) return { paint: 'none' };

  if(value.type === 'radial') return { paint: `url(#${id})`, defs: html`<radialGradient id=${id} cx="0.5" cy="0.5" r="0.5">${stops}</radialGradient>` };

  const a = ((Number(value.angle) || 0) * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a) / 2, Math.sin(a) / 2];

  return { paint: `url(#${id})`, defs: html`<linearGradient id=${id} x1=${0.5 - dx} y1=${0.5 - dy} x2=${0.5 + dx} y2=${0.5 + dy}>${stops}</linearGradient>` };
}

// a stroke: the filled outline polygon of its [x, y, width] points
export function renderStroke(step, m = IDENTITY) {
  const d = outlinePath(outline(step.pts.map(p => [p[0], p[1]]), step.pts.map(p => p[2])));
  const color = safeColour(step.color);

  return d && color ? html`<path data-step=${step.id} data-op="stroke" d=${d} fill=${color} transform=${matrix(m)} />` : null;
}

// a shape: its path with fill and stroke, both optional
export function renderShape(step, m = IDENTITY) {
  if(!PATH.test(step.path)) return null;

  const fill = paint(step.fill, `fill-${step.id}`);
  const stroke = paint(step.stroke, `stroke-${step.id}`);

  return html`<g data-step=${step.id} data-op="shape" transform=${matrix(m)}>
    ${(fill.defs || stroke.defs) && html`<defs>${fill.defs}${stroke.defs}</defs>`}
    <path d=${step.path} fill=${fill.paint} stroke=${stroke.paint} stroke-width=${step.stroke ? step.strokeWidth : undefined} />
  </g>`;
}

// What the steps of a page add up to, in list order: the clip, blend and
// matrix every step ends with after its clip/unclip/blend/transform ops, and
// the shapes that are used as a clip (they are not drawn, EDITOR.md S2.7).
// Ops that name a missing target are ignored.
export function effective(steps) {
  const by = new Map();
  const state = id => by.get(id) ?? by.set(id, {}).get(id);

  for(const step of steps) {
    switch(step.op) {
      case 'photo':
        by.set(step.id, { clip: step.clip, blend: step.blend, m: step.m });
        break;
      case 'clip':
        state(step.target).clip = step.shape;
        break;
      case 'unclip':
        delete state(step.target).clip;
        break;
      case 'blend':
        state(step.target).blend = step.mode;
        break;
      case 'transform':
        state(step.target).m = step.m;
        break;
    }
  }

  const clips = new Set([...by.values()].map(s => s.clip).filter(Boolean));

  return { by, clips };
}

// The photo steps of the whole node in page order: what `slides` and `grid`
// show, whatever pages the author drew.
export const photoSteps = doc => doc.pages.flatMap(page => page.steps.filter(step => step.op === 'photo' && !isTexture(step)));

// the steps a mode shows. `free`: the first `upTo` steps of page `page` (all
// when `upTo` is missing). `slides`: photo `page` alone, shown whole.
// `grid`: every photo, tiled by gridLayout. Both start from the photo steps,
// without clips, and give them the matrix of their layout.
function stepsOf(doc, { mode, page, upTo, photos }) {
  if(mode === 'free') {
    const steps = doc.pages[page]?.steps ?? [];

    if(upTo === undefined) return steps;

    // a fractional `upTo` shows a transform step part way through its move
    const whole = Number.isFinite(upTo) ? Math.max(0, Math.floor(upTo)) : 0;
    const shown = steps.slice(0, whole);
    const next = steps[whole];
    const frac = upTo - whole;

    if(frac > 0 && next?.op === 'transform') {
      const from = effective(shown).by.get(next.target)?.m ?? [1, 0, 0, 1, 0, 0];

      shown.push({ ...next, m: lerpMatrix(from, next.m, ease(next.ease, frac)) });
    }

    return shown;
  }

  const all = photoSteps(doc).map(({ clip, ...step }) => step);

  if(mode === 'slides') {
    const step = all[page];

    return step && photos(step.photo) ? [{ ...step, m: IDENTITY }] : [];
  }

  return gridLayout(all.length, doc.layout).map((m, i) => ({ ...all[i], m }));
}

// the document as an <svg> on the 0..1000 stage. `mode` defaults to the
// document's own; `page` is the page index (free) or the photo index
// (slides); `upTo` the number of steps shown (free).
export function renderStage(doc, { photos = () => null, mode = doc.mode, page = 0, upTo } = {}) {
  const steps = stepsOf(doc, { mode, page, upTo, photos });
  const { by, clips } = effective(steps);
  const shapes = new Map(steps.filter(s => s.op === 'shape').map(s => [s.id, s]));
  const defs = [...clips].filter(id => shapes.has(id) && PATH.test(shapes.get(id).path)).map(id => {
    const shape = shapes.get(id);

    return html`<clipPath id=${`clip-${id}`}><path d=${shape.path} transform=${matrix(by.get(id)?.m ?? IDENTITY)} /></clipPath>`;
  });

  const draw = step => {
    const st = by.get(step.id) ?? {};

    switch(step.op) {
      case 'photo': {
        if(isTexture(step)) return null; // for the 3D scene, not a picture

        const out = renderPhoto({ ...step, m: st.m ?? step.m, blend: st.blend ?? step.blend }, photos(step.photo));

        return out && st.clip && shapes.has(st.clip) ? html`<g clip-path=${`url(#clip-${st.clip})`}>${out}</g>` : out;
      }
      case 'stroke':
        return renderStroke(step, st.m);
      case 'shape':
        return clips.has(step.id) ? null : renderShape(step, st.m);
      default:
        return null; // clip, unclip, blend, transform act on others; text is phase K
    }
  };

  return html`<svg viewBox=${`0 0 ${STAGE} ${STAGE}`} xmlns="http://www.w3.org/2000/svg">
    ${defs.length > 0 && html`<defs>${defs}</defs>`}
    ${doc.bg && HEX.test(doc.bg) && html`<rect x="0" y="0" width=${STAGE} height=${STAGE} fill=${doc.bg} />`}
    ${steps.map(draw)}
  </svg>`;
}

// the stage inside the node's theme wrapper (PLAN.md S16.6): `data-theme` is
// the node's theme, else `theme` (the page's), else inherited; the style
// attribute carries only vars that pass the sanitiser. Same options as
// renderStage.
export function renderNode(doc, options = {}) {
  const { theme } = sanitize(doc.style);
  const id = theme ?? options.theme;

  return html`<div class="wb-node" data-theme=${id} style=${toAttr(doc.style) || undefined}>${renderStage(doc, options)}</div>`;
}
