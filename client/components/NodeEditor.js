import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { UPLOAD_MIME } from '../files.js';
import { FITS, LIMITS, allIds, emptyNode, findStep, photoSteps, unique } from '../editor/model.js';
import { apply } from '../editor/commands.js';
import { createGesture } from '../editor/gesture.js';
import { aboutPoint } from '../editor/gestures.js';
import { multiply } from '../editor/matrix.js';
import { ADD_EVENT, takePending } from '../editor/pending.js';
import * as history from '../editor/history.js';
import { DRAFT_INTERVAL, browserStorage, clearDraft, isDirty, loadDraft, saveDraft } from '../editor/draft.js';
import { centreOf, hitTest, matrixOf, outlineOf } from '../editor/hit.js';
import { oneEuroPoint, resample, strokePath, strokeWidths } from '../editor/pen.js';
import { renderNode } from '../editor/render.js';
import { orderFor, shortcutFor, transformFor } from '../editor/shortcuts.js';
import { DEFAULT_TOOL, TOOLS, toolForKey } from '../editor/tools.js';
import { editorStore } from '../editor/useEditor.js';
import { swatches } from '../editor/palette.js';
import { ContextBar } from './ContextBar.js';
import { Filmstrip } from './Filmstrip.js';
import { PageStrip } from './PageStrip.js';
import { Palette } from './Palette.js';
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
const SLOP_PX = 6; // a pointer must travel this far before a gesture moves the step
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 24;
const round = (v, k) => Math.round(v * k) / k;

// what the editor needs to draw an upload: where it is and how big
const photoInfo = p => ({ href: `/files/uploads/${p.display}`, width: p.width, height: p.height, padding: p.padding, palette: Array.isArray(p.palette) ? p.palette.filter(c => /^#[0-9a-f]{6}$/i.test(c?.hex)).slice(0, 8) : [] });
const isPayload = p => p && /^[0-9a-f]{64}$/.test(p.hash) && typeof p.display === 'string' && p.width > 0 && p.height > 0;

// the theme's own colours, the palette of a node without photos
const themeColours = () => {
  try {
    const style = getComputedStyle(document.documentElement);

    return ['accent', 'ink', 'select', 'danger'].map(name => style.getPropertyValue('--wb-' + name).trim()).filter(c => /^#[0-9a-f]{6}$/i.test(c));
  } catch {
    return [];
  }
};

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
  const [current, setCurrent] = useState(0); // the page being edited
  const [aim, setAim] = useState('fill'); // which colour of a selected shape the palette sets
  const stroke = useRef(null);
  const gesture = useRef(null); // { g, id } while a move/scale/rotate gesture runs
  const lastTap = useRef({ time: 0, id: null, at: null });
  const saved = useRef(hist.present); // the last saved snapshot: what "dirty" is measured against
  const { doc, kind } = hist.present;
  const page = Math.min(current, doc.pages.length - 1); // undo can remove the page being shown
  const pageId = doc.pages[page].id;
  const located = selected ? findStep(doc, selected) : null;
  const selectedStep = located?.page === page ? located.step : null; // a step of another page is not selected
  const dirty = isDirty(hist.present, saved.current);

  // always the current state for handlers registered once
  const latest = useRef();

  latest.current = { snap: hist.present, doc, page, pageId, photos, selected: selectedStep?.id ?? null, scale, dirty, found, color, size };

  // every change of the node goes through here
  const dispatch = command => setHist(h => {
    const r = apply(h.present, command);

    return history.push(h, r.snap, r.key);
  });
  // pages (E55): switching drops the selection, adding shows the new page, a
  // page with steps is only removed after a yes
  const switchPage = i => {
    setCurrent(i);
    setSelected(null);
  };
  const addPage = () => {
    dispatch({ type: 'addPage' });
    switchPage(latest.current.doc.pages.length);
  };
  const removePage = id => {
    const victim = latest.current.doc.pages.find(p => p.id === id);

    if(victim?.steps.length && !window.confirm(t('editor.page.remove.confirm'))) return;

    const index = latest.current.doc.pages.indexOf(victim);

    dispatch({ type: 'removePage', id });
    switchPage(Math.min(index, latest.current.doc.pages.length - 2));
  };
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

  // the "add to node" button of an upload card queues the photo; an open editor
  // takes it at once, a freshly opened one when it mounts, and moves the focus in
  const addQueued = () => {
    const queued = takePending();

    queued.forEach(addUpload);

    if(queued.length) document.getElementById('wb-editor')?.focus();
  };

  useEffect(() => {
    addQueued();
    window.addEventListener(ADD_EVENT, addQueued);

    return () => window.removeEventListener(ADD_EVENT, addQueued);
  }, []);

  // the selection through a matrix change: keys and the wheel
  const transformSelection = (id, sim) => {
    const { doc, page } = latest.current;
    const m = matrixOf(doc, id, { page });

    if(m) dispatch({ type: 'setMatrix', id, m: multiply(sim, m) });
  };

  // keys: a tool key selects a tool; ctrl+z, ctrl+shift+z / ctrl+y, Delete
  useEffect(() => {
    const on = e => {
      const next = toolForKey(e);

      if(next) return setTool(next);

      const move = transformFor(e);
      const { selected: id, doc, page } = latest.current;

      if(move && id) {
        e.preventDefault();

        const centre = centreOf(doc, id, { photos: hash => latest.current.photos[hash], page }) ?? [500, 500];
        const turn = aboutPoint(move.scale ?? 1, move.rotate ?? 0, centre);

        return transformSelection(id, multiply([1, 0, 0, 1, move.dx ?? 0, move.dy ?? 0], turn));
      }

      const order = orderFor(e);

      if(order && latest.current.selected) {
        e.preventDefault();

        return dispatch({ type: 'moveStep', id: latest.current.selected, to: order });
      }

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
    if(tool === 'select') return selectDown(e, units);

    stroke.current = { filter: oneEuroPoint(1.5, 0.01), samples: [] };
    move(e, units);
  };

  // select tool: a tap selects, a drag moves the step, two fingers pinch it,
  // Alt-drag turns and scales it about its centre, a double tap cycles the fit
  const selectDown = (e, units) => {
    const { doc, photos, scale } = latest.current;

    // another finger joins the gesture that is running
    if(gesture.current) return gesture.current.g.down(e.pointerId, units);

    const id = hitTest(doc, units, { photos: hash => photos[hash], tolerance: TAP_PX / scale, page });

    setSelected(id);

    if(!id) return;

    const step = findStep(doc, id).step;
    const tap = lastTap.current;

    if(step.op === 'photo' && tap.id === id && e.timeStamp - tap.time < DOUBLE_TAP_MS && Math.hypot(units[0] - tap.at[0], units[1] - tap.at[1]) < DOUBLE_TAP_PX / scale) {
      lastTap.current = { time: 0, id: null, at: null };

      const info = photos[step.photo];
      const fit = FITS[(FITS.indexOf(step.fit) + 1) % FITS.length];

      if(info) dispatch({ type: 'setFit', id, fit, info });

      return;
    }

    lastTap.current = { time: e.timeStamp, id, at: units };

    const m = matrixOf(doc, id, { page });

    if(!m) return;

    const g = createGesture(m, { slop: SLOP_PX / scale });

    g.down(e.pointerId, units, { alt: e.altKey, centre: centreOf(doc, id, { photos: hash => photos[hash], page }) });
    gesture.current = { g, id };
  };

  const move = (e, [x, y]) => {
    if(gesture.current) {
      const m = gesture.current.g.move(e.pointerId, [x, y]);

      if(m) dispatch({ type: 'setMatrix', id: gesture.current.id, m });

      return;
    }

    const s = stroke.current;

    if(!s) return;

    const [fx, fy] = s.filter(x, y, e.timeStamp / 1000);

    s.samples.push([fx, fy, e.pointerType === 'mouse' ? 0 : e.pressure, e.timeStamp / 1000]);
    setLive(strokePath(s.samples, latest.current.size, SPACING));
  };

  const up = e => {
    if(gesture.current) {
      // the last pointer up ends the gesture: it is one undo step
      if(gesture.current.g.up(e.pointerId) === 0) {
        if(gesture.current.g.moved) setHist(history.seal);

        gesture.current = null;
      }

      return;
    }

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

  // the wheel zooms the selection about the pointer, with Shift it turns it
  const wheel = (e, units) => {
    const { selected: id } = latest.current;

    if(tool !== 'select' || !id) return;

    e.preventDefault();

    const amount = Math.max(-100, Math.min(100, e.deltaY));

    transformSelection(id, e.shiftKey ? aboutPoint(1, amount * 0.002, units) : aboutPoint(Math.exp(-amount * 0.0015), 0, units));
  };

  // --- the frame ---

  const inert = (key, label) => html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled title=${t('editor.' + key)} aria-label=${t('editor.' + key)}>${label}</button>`;

  const action = key => {
    if(key === 'page') return html`<button type="button" class="wb-editor-button wb-editor-add-page" onClick=${addPage} title=${t('editor.page.add')} aria-label=${t('editor.page.add')}>${t('editor.short.page')}</button>`;

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

  const empty = doc.pages[page].steps.length === 0 && !live;
  const outline = selectedStep && outlineOf(doc, selectedStep.id, { photos: hash => photos[hash], page });
  const title = doc.title ?? '';
  const strip = photoSteps(doc, page);

  // the palette (E54): shown while the pen or a stroke / shape is selected
  const paletteTargets = tool === 'pen' ? ['pen'] : selectedStep?.op === 'stroke' ? ['stroke'] : selectedStep?.op === 'shape' ? ['fill', 'outline'] : null;
  const paletteTarget = paletteTargets && (paletteTargets.includes(aim) ? aim : paletteTargets[0]);
  const reference = selectedStep?.op === 'photo' ? selectedStep : strip[strip.length - 1];
  const paletteColours = paletteTargets && swatches(photos[reference?.photo]?.palette ?? [], themeColours()).all;
  const paletteCurrent = paletteTarget === 'pen' ? color : paletteTarget === 'stroke' ? selectedStep.color : paletteTarget === 'fill' ? selectedStep.fill : paletteTarget === 'outline' ? selectedStep.stroke : null;
  const pick = hex => {
    if(paletteTarget === 'pen') setColor(hex);
    else dispatch({ type: 'setColor', id: selectedStep.id, color: hex, ...(paletteTarget === 'fill' ? { field: 'fill' } : paletteTarget === 'outline' ? { field: 'stroke' } : {}) });
  };

  return html`
    <section id="wb-editor" class="wb-editor" tabindex="-1" aria-label=${t('editor.label')}>
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
      <div class="wb-editor-work">
      <div class="wb-editor-body">
        <div class="wb-editor-tools" role="toolbar" aria-label=${t('editor.tools')}>${TOOLS.map(toolButton)}</div>
        <${Stage}
          label=${title || t('editor.stage')}
          class=${'wb-editor-cursor-' + tool + (over ? ' wb-editor-stage-over' : '')}
          content=${renderNode(doc, { photos: hash => photos[hash] ?? null, page })}
          overlay=${({ scale }) => html`${live && html`<path d=${live} fill=${color} />`}${outline && html`<${Selection} outline=${outline} scale=${scale} />`}`}
          interactive=${tool === 'select' || tool === 'pen'}
          onPointer=${{ down, move, up, cancel: up, wheel }}
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
      <${Filmstrip} t=${t} steps=${strip} photos=${photos} selected=${selectedStep?.id ?? null} onSelect=${setSelected} onMove=${(id, to) => dispatch({ type: 'movePhoto', id, to })} onRemove=${remove} />
      </div>
      ${tool === 'pen'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.color')} <input type="color" value=${color} onInput=${e => setColor(e.target.value)} /></label>
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
          </div>`
        : html`<${ContextBar} t=${t} step=${selectedStep} clipped=${selectedStep?.clip !== undefined} photo=${selectedStep && photos[selectedStep.photo]} dispatch=${command => (command.type === 'removeStep' ? remove(command.id) : dispatch(command))} />`}
      ${paletteTargets && html`<${Palette} t=${t} swatches=${paletteColours} target=${paletteTarget} targets=${paletteTargets} onTarget=${setAim} current=${paletteCurrent} onPick=${pick} />`}
      <${PageStrip} t=${t} doc=${doc} photos=${photos} current=${page} onSelect=${switchPage} onAdd=${addPage} onMove=${(id, to) => dispatch({ type: 'movePage', id, to })} onRemove=${removePage} />
    </section>
  `;
};
