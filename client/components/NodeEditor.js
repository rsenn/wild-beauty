import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { UPLOAD_MIME } from '../files.js';
import { LIMITS, allIds, emptyNode, findStep, unique } from '../editor/model.js';
import { apply } from '../editor/commands.js';
import * as history from '../editor/history.js';
import { DRAFT_INTERVAL, browserStorage, clearDraft, isDirty, loadDraft, saveDraft } from '../editor/draft.js';
import { hitTest, outlineOf } from '../editor/hit.js';
import { oneEuroPoint, resample, strokePath, strokeWidths } from '../editor/pen.js';
import { renderNode } from '../editor/render.js';
import { shortcutFor } from '../editor/shortcuts.js';
import { DEFAULT_TOOL, TOOLS, toolForKey } from '../editor/tools.js';
import { editorStore } from '../editor/useEditor.js';
import { ContextBar } from './ContextBar.js';
import { Properties } from './Properties.js';
import { Stage } from './Stage.js';

// Editor frame (EDITOR.md S2.2): title row, tool column, square stage, action
// column, context bar and page strip. Everything that changes the node is a
// command through `dispatch`, so there is one history (undo, redo, keys) and
// one place that knows what is dirty. The page strip and the node-level
// actions stay inert until their tasks.
const ACTIONS = ['undo', 'redo', 'page', 'delete', 'save'];
const SPACING = 4;
const HANDLE_PX = 10; // a selection handle's side on screen
const TAP_PX = 12; // how far from a thin line still counts as a tap on it
const round = (v, k) => Math.round(v * k) / k;

// what the editor needs to draw an upload: where it is and how big
const photoInfo = p => ({ href: `/files/uploads/${p.display}`, width: p.width, height: p.height, padding: p.padding });
const isPayload = p => p && /^[0-9a-f]{64}$/.test(p.hash) && typeof p.display === 'string' && p.width > 0 && p.height > 0;

// the outline and corner handles of the selection, in the stage overlay
const Selection = ({ outline, scale }) => {
  const side = HANDLE_PX / scale;

  return html`<g class="wb-editor-selection">
    <polygon class="wb-editor-outline" points=${outline.map(p => p.join(',')).join(' ')} />
    ${outline.map(([x, y]) => html`<rect class="wb-editor-handle" x=${x - side / 2} y=${y - side / 2} width=${side} height=${side} />`)}
  </g>`;
};

export const NodeEditor = ({ onClose, target = 'new' }) => {
  const { t, lang } = useI18n();
  const [hist, setHist] = useState(() => history.create({ doc: emptyNode(), kind: 'node' }));
  const [photos, setPhotos] = useState({});
  const [tool, setTool] = useState(DEFAULT_TOOL);
  const [selected, setSelected] = useState(null);
  const [color, setColor] = useState('#1a1a1a');
  const [size, setSize] = useState(8);
  const [live, setLive] = useState('');
  const [over, setOver] = useState(false);
  const [found, setFound] = useState(null); // a stored draft waiting for "restore" or "discard"
  const [scale, setScale] = useState(1);
  const stroke = useRef(null);
  const saved = useRef(hist.present); // the last saved snapshot: what "dirty" is measured against
  const { doc, kind } = hist.present;
  const pageId = doc.pages[0].id;
  const selectedStep = selected ? findStep(doc, selected)?.step : null;
  const dirty = isDirty(hist.present, saved.current);

  // always the current state for handlers registered once
  const latest = useRef();

  latest.current = { snap: hist.present, doc, pageId, photos, selected: selectedStep?.id ?? null, scale, dirty, found, color, size };

  // every change of the node goes through here
  const dispatch = command => setHist(h => {
    const r = apply(h.present, command);

    return history.push(h, r.snap, r.key);
  });
  const undo = () => setHist(history.undo);
  const redo = () => setHist(history.redo);

  const addUpload = payload => {
    if(!isPayload(payload)) return;

    setPhotos(old => ({ ...old, [payload.hash]: photoInfo(payload) }));
    dispatch({ type: 'addPhoto', hash: payload.hash, info: payload, page: latest.current.pageId, id: unique(allIds(latest.current.doc)) });
  };

  const remove = id => {
    dispatch({ type: 'removeStep', id });
    setSelected(null);
  };

  // the "add to node" button of an upload card
  useEffect(() => {
    const on = e => addUpload(e.detail);

    window.addEventListener('wb:add-photo', on);

    return () => window.removeEventListener('wb:add-photo', on);
  }, []);

  // keys: a tool key selects a tool; ctrl+z, ctrl+shift+z / ctrl+y, Delete
  useEffect(() => {
    const on = e => {
      const next = toolForKey(e);

      if(next) return setTool(next);

      const action = shortcutFor(e);

      if(!action) return;

      e.preventDefault();

      if(action === 'undo') undo();
      else if(action === 'redo') redo();
      else if(latest.current.selected) remove(latest.current.selected);
    };

    window.addEventListener('keydown', on);

    return () => window.removeEventListener('keydown', on);
  }, []);

  // --- dirty tracking and the local draft (E43) ---

  // a draft of this target from an earlier session is offered once
  useEffect(() => {
    const storage = browserStorage();
    const d = storage && loadDraft(storage, target);

    if(d) setFound(d);
  }, [target]);

  useEffect(() => {
    editorStore.setDirty(dirty);
  }, [dirty]);

  // the draft follows the document every 3 s and when the page is hidden; a
  // clean editor has none. Nothing is written while an old draft is waiting.
  useEffect(() => {
    const storage = browserStorage();

    if(!storage) return;

    const write = () => {
      const { snap, photos, dirty, found } = latest.current;

      if(found) return;

      if(dirty) saveDraft(storage, target, snap, photos);
      else clearDraft(storage, target);
    };
    const hidden = () => document.visibilityState === 'hidden' && write();
    const timer = setInterval(write, DRAFT_INTERVAL);

    window.addEventListener('pagehide', write);
    document.addEventListener('visibilitychange', hidden);

    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', write);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [target]);

  // leaving the page with unsaved changes asks first
  useEffect(() => {
    if(!dirty) return;

    const on = e => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', on);

    return () => window.removeEventListener('beforeunload', on);
  }, [dirty]);

  const restore = () => {
    setPhotos(old => ({ ...old, ...found.photos }));
    setHist(history.create(found.snap));
    setSelected(null);
    setFound(null);
  };

  const discard = () => {
    const storage = browserStorage();

    if(storage) clearDraft(storage, target);

    setFound(null);
  };

  // closing a dirty editor asks; its draft stays so the work can be picked up again
  const close = () => {
    if(dirty && !window.confirm(t('editor.close.confirm'))) return;

    if(!dirty) {
      const storage = browserStorage();

      if(storage) clearDraft(storage, target);
    }

    onClose();
  };

  const accepts = e => [...(e.dataTransfer?.types ?? [])].includes(UPLOAD_MIME);

  const drop = e => {
    setOver(false);

    if(!accepts(e)) return;

    e.preventDefault();

    try {
      addUpload(JSON.parse(e.dataTransfer.getData(UPLOAD_MIME)));
    } catch {}
  };

  // --- pointer: select with the select tool, draw with the pen ---

  const down = (e, units) => {
    if(tool === 'select') {
      const id = hitTest(latest.current.doc, units, { photos: hash => latest.current.photos[hash], tolerance: TAP_PX / latest.current.scale });

      setSelected(id);

      return;
    }

    stroke.current = { filter: oneEuroPoint(1.5, 0.01), samples: [] };
    move(e, units);
  };

  const move = (e, [x, y]) => {
    const s = stroke.current;

    if(!s) return;

    const [fx, fy] = s.filter(x, y, e.timeStamp / 1000);

    s.samples.push([fx, fy, e.pointerType === 'mouse' ? 0 : e.pressure, e.timeStamp / 1000]);
    setLive(strokePath(s.samples, latest.current.size, SPACING));
  };

  const up = () => {
    const s = stroke.current;

    stroke.current = null;
    setLive('');

    if(!s || !s.samples.length) return;

    // few enough points for the limit: widen the spacing until they fit
    let spacing = SPACING;
    let points = resample(s.samples, spacing);

    while(points.length > LIMITS.points) points = resample(s.samples, (spacing *= 1.5));

    const widths = strokeWidths(points, latest.current.size);
    const pts = points.map((p, i) => [round(p[0], 10), round(p[1], 10), round(widths[i], 100)]);
    const { doc, color } = latest.current;

    dispatch({ type: 'addStep', page: latest.current.pageId, step: { op: 'stroke', id: unique(allIds(doc)), pts, color, smooth: true } });
  };

  // --- the frame ---

  const inert = (key, label) => html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled title=${t('editor.' + key)} aria-label=${t('editor.' + key)}>${label}</button>`;

  const action = key => {
    if(key === 'undo' || key === 'redo') {
      const can = key === 'undo' ? history.canUndo(hist) : history.canRedo(hist);

      return html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled=${!can} onClick=${key === 'undo' ? undo : redo} title=${t('editor.' + key)} aria-label=${t('editor.' + key)}>${t('editor.short.' + key)}</button>`;
    }

    return inert(key, t('editor.short.' + key));
  };

  // every tool can be picked; the key is in the label and in aria-keyshortcuts
  const toolButton = ({ id, key }) => html`
    <button type="button" class=${'wb-editor-button wb-editor-tool wb-editor-tool-' + id} aria-pressed=${tool === id ? 'true' : 'false'} aria-keyshortcuts=${key} onClick=${() => setTool(id)} title=${`${t('editor.tool.' + id)} (${key})`} aria-label=${t('editor.tool.' + id)}>
      <span class="wb-editor-tool-icon" aria-hidden="true"></span>
      <span class="wb-editor-tool-key" aria-hidden="true">${key}</span>
    </button>
  `;

  const empty = doc.pages[0].steps.length === 0 && !live;
  const outline = selectedStep && outlineOf(doc, selectedStep.id, { photos: hash => photos[hash] });
  const title = doc.title ?? '';

  return html`
    <section id="wb-editor" class="wb-editor" aria-label=${t('editor.label')}>
      <div class="wb-editor-head">
        <label class="wb-editor-title">
          <span class="wb-sr-only">${t('editor.title.label')}</span>
          <input type="text" maxlength=${LIMITS.title} autocomplete="off" value=${title} placeholder=${t('editor.title.placeholder')} onInput=${e => dispatch({ type: 'setTitle', title: e.target.value })} />
        </label>
        <${Properties} t=${t} kind=${kind} bg=${doc.bg} dispatch=${dispatch} />
        <button type="button" class="wb-editor-close" onClick=${close}>${t('editor.close')}</button>
      </div>
      ${found &&
      html`<p class="wb-editor-banner" role="status">
        <span>${t('editor.draft.found', { time: new Date(found.savedAt).toLocaleString(lang) })}</span>
        <button type="button" class="wb-editor-chip" onClick=${restore}>${t('editor.draft.restore')}</button>
        <button type="button" class="wb-editor-chip" onClick=${discard}>${t('editor.draft.discard')}</button>
      </p>`}
      <div class="wb-editor-body">
        <div class="wb-editor-tools" role="toolbar" aria-label=${t('editor.tools')}>${TOOLS.map(toolButton)}</div>
        <${Stage}
          label=${title || t('editor.stage')}
          class=${'wb-editor-cursor-' + tool + (over ? ' wb-editor-stage-over' : '')}
          content=${renderNode(doc, { photos: hash => photos[hash] ?? null })}
          overlay=${({ scale }) => html`${live && html`<path d=${live} fill=${color} />`}${outline && html`<${Selection} outline=${outline} scale=${scale} />`}`}
          interactive=${tool === 'select' || tool === 'pen'}
          onPointer=${{ down, move, up, cancel: up }}
          onSize=${({ width }) => setScale(width > 0 ? width / 1000 : 1)}
          onDragEnter=${e => accepts(e) && (e.preventDefault(), setOver(true))}
          onDragOver=${e => accepts(e) && (e.preventDefault(), (e.dataTransfer.dropEffect = 'copy'))}
          onDragLeave=${() => setOver(false)}
          onDrop=${drop}
        >
          ${empty && html`<span class="wb-editor-stage-hint">${t('editor.stage.hint')}</span>`}
        <//>
        <div class="wb-editor-actions" role="toolbar" aria-label=${t('editor.actions')}>${ACTIONS.map(action)}</div>
      </div>
      ${tool === 'pen'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.color')} <input type="color" value=${color} onInput=${e => setColor(e.target.value)} /></label>
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
          </div>`
        : html`<${ContextBar} t=${t} step=${selectedStep} clipped=${selectedStep?.clip !== undefined} photo=${selectedStep && photos[selectedStep.photo]} dispatch=${command => (command.type === 'removeStep' ? remove(command.id) : dispatch(command))} />`}
      <div class="wb-editor-pages">${inert('page.1', '1')}${inert('page.add', '+')}</div>
    </section>
  `;
};
