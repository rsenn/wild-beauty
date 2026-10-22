import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { UPLOAD_MIME } from '../files.js';
import { allIds, addPhoto, addStep, emptyNode, unique, LIMITS } from '../editor/model.js';
import * as history from '../editor/history.js';
import { oneEuroPoint, resample, strokePath, strokeWidths } from '../editor/pen.js';
import { renderNode } from '../editor/render.js';

// Editor frame (EDITOR.md S2.2): title row, tool column, square stage, action
// column, context bar and page strip. Working so far: dropping or adding
// uploads as photo steps, the ink pen, undo and redo; the other buttons stay
// inert until E36-E42 fill them in.
const TOOLS = [
  ['V', 'select'],
  ['P', 'pen'],
  ['S', 'shape'],
  ['C', 'clip'],
  ['U', 'unclip'],
  ['T', 'text'],
];
const ACTIONS = ['undo', 'redo', 'page', 'delete', 'save'];
const STAGE = 1000;
const SPACING = 4;
const round = (v, k) => Math.round(v * k) / k;

// what the editor needs to draw an upload: where it is and how big
const photoInfo = p => ({ href: `/files/uploads/${p.display}`, width: p.width, height: p.height, padding: p.padding });
const isPayload = p => p && /^[0-9a-f]{64}$/.test(p.hash) && typeof p.display === 'string' && p.width > 0 && p.height > 0;

export const NodeEditor = ({ onClose }) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [hist, setHist] = useState(() => history.create(emptyNode()));
  const [photos, setPhotos] = useState({});
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState('#1a1a1a');
  const [size, setSize] = useState(8);
  const [live, setLive] = useState('');
  const [over, setOver] = useState(false);
  const stroke = useRef(null);
  const doc = hist.present;
  const pageId = doc.pages[0].id;

  // always the current doc for handlers registered once
  const latest = useRef();

  latest.current = { doc, pageId };

  const commit = next => setHist(h => history.push(h, next));

  const addUpload = payload => {
    if(!isPayload(payload)) return;

    const { doc, pageId } = latest.current;

    setPhotos(old => ({ ...old, [payload.hash]: photoInfo(payload) }));
    commit(addPhoto(doc, pageId, payload.hash, payload));
  };

  // the "add to node" button of an upload card
  useEffect(() => {
    const on = e => addUpload(e.detail);

    window.addEventListener('wb:add-photo', on);

    return () => window.removeEventListener('wb:add-photo', on);
  }, []);

  const accepts = e => [...(e.dataTransfer?.types ?? [])].includes(UPLOAD_MIME);

  const drop = e => {
    setOver(false);

    if(!accepts(e)) return;

    e.preventDefault();

    try {
      addUpload(JSON.parse(e.dataTransfer.getData(UPLOAD_MIME)));
    } catch {}
  };

  // pointer position in stage units
  const at = e => {
    const r = e.currentTarget.getBoundingClientRect();

    return [((e.clientX - r.left) / r.width) * STAGE, ((e.clientY - r.top) / r.height) * STAGE];
  };

  const penDown = e => {
    if(e.button > 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = { filter: oneEuroPoint(1.5, 0.01), samples: [] };
    penMove(e);
  };

  const penMove = e => {
    const s = stroke.current;

    if(!s) return;

    const [x, y] = at(e);
    const [fx, fy] = s.filter(x, y, e.timeStamp / 1000);

    s.samples.push([fx, fy, e.pointerType === 'mouse' ? 0 : e.pressure, e.timeStamp / 1000]);
    setLive(strokePath(s.samples, size, SPACING));
  };

  const penUp = () => {
    const s = stroke.current;

    stroke.current = null;
    setLive('');

    if(!s || !s.samples.length) return;

    // few enough points for the limit: widen the spacing until they fit
    let spacing = SPACING;
    let points = resample(s.samples, spacing);

    while(points.length > LIMITS.points) points = resample(s.samples, (spacing *= 1.5));

    const widths = strokeWidths(points, size);
    const pts = points.map((p, i) => [round(p[0], 10), round(p[1], 10), round(widths[i], 100)]);
    const { doc, pageId } = latest.current;

    commit(addStep(doc, pageId, { op: 'stroke', id: unique(allIds(doc)), pts, color, smooth: true }));
  };

  const inert = (key, label) => html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled title=${t('editor.' + key)} aria-label=${t('editor.' + key)}>${label}</button>`;

  const action = key => {
    if(key === 'undo' || key === 'redo') {
      const can = key === 'undo' ? history.canUndo(hist) : history.canRedo(hist);
      const run = () => setHist(h => (key === 'undo' ? history.undo(h) : history.redo(h)));

      return html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled=${!can} onClick=${run} title=${t('editor.' + key)} aria-label=${t('editor.' + key)}>${t('editor.short.' + key)}</button>`;
    }

    return inert(key, t('editor.short.' + key));
  };

  const toolButton = ([key, name]) => {
    if(name !== 'select' && name !== 'pen') return inert('tool.' + name, key);

    return html`<button type="button" class=${'wb-editor-button wb-editor-tool-' + name} aria-pressed=${tool === name ? 'true' : 'false'} onClick=${() => setTool(name)} title=${t('editor.tool.' + name)} aria-label=${t('editor.tool.' + name)}>${key}</button>`;
  };

  const empty = doc.pages[0].steps.length === 0 && !live;

  return html`
    <section id="wb-editor" class="wb-editor" aria-label=${t('editor.label')}>
      <div class="wb-editor-head">
        <label class="wb-editor-title">
          <span class="wb-sr-only">${t('editor.title.label')}</span>
          <input type="text" maxlength="200" autocomplete="off" value=${title} placeholder=${t('editor.title.placeholder')} onInput=${e => setTitle(e.target.value)} />
        </label>
        <button type="button" class="wb-editor-close" onClick=${onClose}>${t('editor.close')}</button>
      </div>
      <div class="wb-editor-body">
        <div class="wb-editor-tools" role="toolbar" aria-label=${t('editor.tools')}>${TOOLS.map(toolButton)}</div>
        <div
          class=${'wb-editor-stage' + (over ? ' wb-editor-stage-over' : '')}
          role="img"
          aria-label=${title || t('editor.stage')}
          onDragEnter=${e => accepts(e) && (e.preventDefault(), setOver(true))}
          onDragOver=${e => accepts(e) && (e.preventDefault(), (e.dataTransfer.dropEffect = 'copy'))}
          onDragLeave=${() => setOver(false)}
          onDrop=${drop}
        >
          ${renderNode(doc, { photos: hash => photos[hash] ?? null })}
          <svg class=${'wb-editor-overlay' + (tool === 'pen' ? ' wb-editor-pen' : '')} viewBox=${`0 0 ${STAGE} ${STAGE}`} onPointerDown=${tool === 'pen' ? penDown : undefined} onPointerMove=${penMove} onPointerUp=${penUp} onPointerCancel=${penUp}>
            ${live && html`<path d=${live} fill=${color} />`}
          </svg>
          ${empty && html`<span class="wb-editor-stage-hint">${t('editor.stage.hint')}</span>`}
        </div>
        <div class="wb-editor-actions" role="toolbar" aria-label=${t('editor.actions')}>${ACTIONS.map(action)}</div>
      </div>
      ${tool === 'pen'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.color')} <input type="color" value=${color} onInput=${e => setColor(e.target.value)} /></label>
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
          </div>`
        : html`<p class="wb-editor-context">${t('editor.context.empty')}</p>`}
      <div class="wb-editor-pages">${inert('page.1', '1')}${inert('page.add', '+')}</div>
    </section>
  `;
};
