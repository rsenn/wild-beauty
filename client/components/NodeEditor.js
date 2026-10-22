import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { UPLOAD_MIME } from '../files.js';
import { FITS, LIMITS, allIds, emptyNode, findStep, photoSteps, unique } from '../editor/model.js';
import { apply } from '../editor/commands.js';
import { createGesture } from '../editor/gesture.js';
import { aboutPoint } from '../editor/gestures.js';
import { multiply } from '../editor/matrix.js';
import { ADD_EVENT, SAVED_EVENT, takePending } from '../editor/pending.js';
import { deleteNode, errorKey, loadNode, saveNode } from '../editor/save.js';
import { createLock } from '../editor/lock.js';
import * as history from '../editor/history.js';
import { DRAFT_INTERVAL, browserStorage, clearDraft, isDirty, loadDraft, saveDraft } from '../editor/draft.js';
import { centreOf, hitTest, matrixOf, outlineOf } from '../editor/hit.js';
import { breakVertex, drag as dragVertices, geometry, hitVertex, joinVertex, removeVertex, verticesOf } from '../editor/vertexedit.js';
import { emptyDraft, preview, press, pull, shapeStep, undoVertex } from '../editor/shapetool.js';
import { oneEuroPoint, resample, strokePath, strokeWidths } from '../editor/pen.js';
import { photoSteps as allPhotoSteps, renderNode } from '../editor/render.js';
import { orderFor, shortcutFor, transformFor } from '../editor/shortcuts.js';
import { DEFAULT_TOOL, TOOLS, toolForKey } from '../editor/tools.js';
import { editorStore } from '../editor/useEditor.js';
import { NEW } from '../editor/store.js';
import { swatches } from '../editor/palette.js';
import { ContextBar } from './ContextBar.js';
import { Filmstrip } from './Filmstrip.js';
import { clampK, durationOf, positionAt } from '../editor/playback.js';
import { ModeSwitch } from './ModeSwitch.js';
import { PageStrip } from './PageStrip.js';
import { Palette } from './Palette.js';
import { Scrubber } from './Scrubber.js';
import { SlideStrip } from './SlideStrip.js';
import { Properties } from './Properties.js';
import { Stage } from './Stage.js';

// Editor frame (EDITOR.md S2.2): title row, tool column, square stage, action
// column, context bar and page strip. Everything that changes the node is a
// command through `dispatch`, so there is one history (undo, redo, keys) and
// one place that knows what is dirty. The page strip and the node-level
// actions stay inert until their tasks.
const ACTIONS = ['undo', 'redo', 'page', 'delete', 'save'];
const SPACING = 4;
const VERTEX_PX = 14; // how near a click picks a vertex or handle
const CLOSE_PX = 14; // how near the first vertex a click closes the shape
const HANDLE_PX = 10; // a selection handle's side on screen
const TAP_PX = 12; // how far from a thin line still counts as a tap on it
const SLOP_PX = 6; // a pointer must travel this far before a gesture moves the step
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 24;
const round = (v, k) => Math.round(v * k) / k;

// what the editor needs to draw an upload: where it is and how big
const photoInfo = p => ({ href: `/files/uploads/${p.display}`, width: p.width, height: p.height, padding: p.padding, palette: Array.isArray(p.palette) ? p.palette.filter(c => /^#[0-9a-f]{6}$/i.test(c?.hex)).slice(0, 8) : [] });
const isPayload = p => p && /^[0-9a-f]{64}$/.test(p.hash) && typeof p.display === 'string' && p.width > 0 && p.height > 0;

// the vertices and bezier handles of the selected shape (E61)
const VertexEdit = ({ geo, sel, scale }) => {
  const side = HANDLE_PX / scale;

  return html`<g class="wb-editor-vertices">
    ${geo.flatMap(g => [g.hin && [g.p, g.hin], g.hout && [g.p, g.hout]].filter(Boolean)).map(([a, b]) => html`<line class="wb-editor-outline" x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} /><circle class="wb-editor-handle" cx=${b[0]} cy=${b[1]} r=${side / 2} />`)}
    ${geo.map(g => html`<rect class=${'wb-editor-handle' + (g.i === sel ? ' wb-editor-handle-selected' : '')} x=${g.p[0] - side / 2} y=${g.p[1] - side / 2} width=${side} height=${side} />`)}
  </g>`;
};

// the shape being drawn: its path so far, its vertices and bezier handles
const ShapeDraft = ({ draft, color, width, scale }) => {
  const { path, handles, points } = preview(draft);
  const side = HANDLE_PX / scale;

  return html`<g class="wb-editor-shape-draft">
    ${path && html`<path d=${path} fill="none" stroke=${color} stroke-width=${width} stroke-linecap="round" />`}
    ${handles.map(([x, y, hx, hy]) => html`<line class="wb-editor-outline" x1=${x} y1=${y} x2=${hx} y2=${hy} /><circle class="wb-editor-handle" cx=${hx} cy=${hy} r=${side / 2} />`)}
    ${points.map(([x, y], i) => html`<rect class=${'wb-editor-handle' + (i === 0 ? ' wb-editor-handle-first' : '')} x=${x - side / 2} y=${y - side / 2} width=${side} height=${side} />`)}
  </g>`;
};

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
  const [k, setK] = useState(null); // steps of the page shown while scrubbing; null: all
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0); // the fractional position while playing: a move part way through
  const [slide, setSlide] = useState(0); // the slide shown in `slides` mode
  const [nodeId, setNodeId] = useState(null); // the id once the node is on the server
  const [lockState, setLockState] = useState({ state: 'idle', info: null }); // the lock on an open node (E67)
  const [loading, setLoading] = useState(target !== NEW); // an existing node is read first (E66)
  const [loadError, setLoadError] = useState(null);
  const [conflict, setConflict] = useState(null); // { rev }: the node changed elsewhere (E65)
  const [busy, setBusy] = useState(false); // a save is on its way
  const [saveError, setSaveError] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [vsel, setVsel] = useState(null); // the selected vertex of the selected shape
  const [shape, setShape] = useState(emptyDraft); // the shape being drawn (shape tool)
  const [aim, setAim] = useState('fill'); // which colour of a selected shape the palette sets
  const stroke = useRef(null);
  const lockRef = useRef(null);
  const loadingRef = useRef(target !== NEW);
  const remote = useRef(null); // { id, rev } once the node is on the server
  const saving = useRef(false);
  const vdrag = useRef(null); // a vertex or handle of the selected shape being dragged
  const shaping = useRef(false); // a vertex of the shape being drawn is being pulled
  const inserted = useRef(null); // the last recorded move: { id, at }
  const gesture = useRef(null); // { g, id } while a move/scale/rotate gesture runs
  const lastTap = useRef({ time: 0, id: null, at: null });
  const saved = useRef(hist.present); // the last saved snapshot: what "dirty" is measured against
  const { doc, kind } = hist.present;
  const page = Math.min(current, doc.pages.length - 1); // undo can remove the page being shown
  const pageId = doc.pages[page].id;
  const mode = doc.mode;
  const auto = mode !== 'free'; // slides and grid lay the photos out themselves: nothing to edit
  const slides = allPhotoSteps(doc).length;
  const count = doc.pages[page].steps.length;
  const shown = clampK(k, count);
  const scrubbed = !auto && shown < count; // scrubbed back: moves are recorded as transform steps
  const previewing = auto || scrubbed; // everything else is read-only there
  const located = selected ? findStep(doc, selected) : null;
  const selectedStep = !auto && located?.page === page && located.index < shown ? located.step : null; // not one of another page, nor one not shown yet
  const editStep = previewing ? null : selectedStep;
  const dirty = isDirty(hist.present, saved.current);

  // always the current state for handlers registered once
  const latest = useRef();

  const readOnly = lockState.state === 'locked' || lockState.state === 'lost'; // someone else holds the node

  latest.current = { readOnly, tool, shape, vsel, editStep, snap: hist.present, doc, page, pageId, count, k, shown, scrubbed, previewing, photos, selected: selectedStep?.id ?? null, scale, dirty, found, color, size };

  // every change of the node goes through here
  const dispatch = command => latest.current?.readOnly || setHist(h => {
    const r = apply(h.present, command);

    return history.push(h, r.snap, r.key);
  });
  // the scrubber (E56): dragging the slider stops playback; play starts at the
  // beginning unless the page is already part way
  const scrub = value => {
    setPlaying(false);
    setK(value >= latest.current.count ? null : value);
  };
  const togglePlay = () => {
    if(playing) return setPlaying(false);

    const from = clampK(k, count) >= count ? 0 : clampK(k, count);

    setK(from);
    setPos(from);

    setPlaying(true);
  };

  // playback: k follows the clock over the page's duration
  useEffect(() => {
    if(!playing) return;

    const { doc, page } = latest.current;
    const n = doc.pages[page].steps.length;
    const seconds = durationOf(doc.pages[page], n);
    const from = clampK(latest.current.k, n) >= n ? 0 : clampK(latest.current.k, n);
    const started = performance.now() - (from / n) * seconds * 1000;
    let frame;

    const tick = now => {
      const at = positionAt((now - started) / 1000, n, seconds);

      if(at >= n) {
        setK(null);
        setPlaying(false);

        return;
      }

      setPos(at);
      setK(Math.floor(at));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // the mode switch (E57): a change of mode ends scrubbing and playback
  const setMode = next => {
    setPlaying(false);
    setK(null);
    setSelected(null);
    dispatch({ type: 'setMode', mode: next });
  };

  // pages (E55): switching drops the selection, adding shows the new page, a
  // page with steps is only removed after a yes
  const switchPage = i => {
    setK(null);
    setPlaying(false);
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
  const undo = () => latest.current.readOnly || ((inserted.current = null), setHist(history.undo));
  const redo = () => latest.current.readOnly || ((inserted.current = null), setHist(history.redo));

  const addUpload = payload => {
    if(!isPayload(payload)) return;

    setK(null);
    setPlaying(false);
    setPhotos(old => ({ ...old, [payload.hash]: photoInfo(payload) }));
    dispatch({ type: 'addPhoto', hash: payload.hash, info: payload, role: payload.role, page: latest.current.pageId, id: unique(allIds(latest.current.doc)) });
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

  // Open an existing node (E66): GET it, make it the saved state. Photos queued
  // meanwhile (an upload card's "add") wait until it is in.
  // Delete the saved node (E69), after a yes: the server removes its rows, the
  // photos nobody else uses and the thumbnail. Then the editor closes (on a node
  // page, which would show a node that is gone, the page goes to /new).
  const removeNode = async () => {
    if(!remote.current || saving.current || latest.current.readOnly || !window.confirm(t('editor.delete.confirm'))) return;

    saving.current = true;
    setBusy(true);
    setSaveError(null);

    const r = await deleteNode(remote.current.id);

    saving.current = false;
    setBusy(false);

    if(!r.ok) return setSaveError(r);

    saved.current = latest.current.snap; // nothing left to lose: no leave prompt
    editorStore.setDirty(false);

    const storage = browserStorage();

    if(storage) clearDraft(storage, target);

    window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail: { hashes: [] } })); // the list of nodes changed

    if(/\/node\/\d+$/.test(location.pathname)) location.assign(`/${lang}/new`);
    else onClose();
  };

  // the lock: taken when an existing node opens (or a new one was saved),
  // renewed by the lock client, released on close and when the page goes
  const startLock = id => {
    if(lockRef.current) return;

    lockRef.current = createLock(id, {
      onChange: change => {
        setLockState(change);

        // a refused save because of the lock is answered by the lock banner
        if(change.state === 'held') setSaveError(e => (e?.code === 'locked' ? null : e));
      },
    });
    lockRef.current.start();
  };

  useEffect(() => {
    const release = () => lockRef.current?.stop();

    window.addEventListener('pagehide', release);

    return () => {
      window.removeEventListener('pagehide', release);
      release();
    };
  }, []);

  const load = async () => {
    loadingRef.current = true;
    setLoading(true);
    setLoadError(null);

    const r = await loadNode(target);

    if(!r.ok) {
      setLoadError(r);
      setLoading(false);

      return;
    }

    remote.current = { id: r.id, rev: r.rev };
    setNodeId(r.id);
    saved.current = r.snap;
    setHist(history.create(r.snap));
    setPhotos(old => ({ ...old, ...r.photos }));
    loadingRef.current = false;
    setLoading(false);
    startLock(r.id);
    setTimeout(addQueued, 0);
  };

  useEffect(() => {
    const queued = () => loadingRef.current || addQueued();

    if(target !== NEW) load();
    else addQueued();

    window.addEventListener(ADD_EVENT, queued);

    return () => window.removeEventListener(ADD_EVENT, queued);
  }, []);

  // the selection through a matrix change: keys and the wheel
  const transformSelection = (id, sim) => {
    const { doc, page, scrubbed, shown } = latest.current;
    const m = matrixOf(doc, id, { page, upTo: scrubbed ? shown : undefined });

    if(m) commitMatrix(id, multiply(sim, m));
  };

  // a new matrix for a step: at the end of the page it is the step's matrix, scrubbed
  // back it is a move recorded at that point, and the scrubber follows it
  const commitMatrix = (id, m) => {
    const c = latest.current;

    if(!c.scrubbed) return dispatch({ type: 'setMatrix', id, m });

    // a move right after a recorded move of the same step only changes it; the
    // document may not have re-rendered yet, so the last insertion is remembered too
    const before = c.doc.pages[c.page].steps[c.shown - 1];
    const again = (before?.op === 'transform' && before.target === id) || (inserted.current?.id === id && inserted.current.at === c.shown - 1);

    dispatch({ type: 'recordMove', id, m, k: c.shown });

    if(!again && c.doc.pages[c.page].steps.length < LIMITS.steps) {
      inserted.current = { id, at: c.shown };
      c.shown += 1; // the next event of the same gesture must see the new step
      c.count += 1;
      setK(c.shown);
    }
  };

  // Save (E64): POST the first time, PUT after. On success the editor is clean,
  // its photos are the baked ones, and the upload list drops the uploads the
  // node used; a failure keeps everything and offers a retry.
  const save = async () => {
    if(saving.current || latest.current.readOnly) return;

    saving.current = true;
    setBusy(true);
    setSaveError(null);

    const { snap } = latest.current;
    const r = await saveNode(snap, remote.current);

    saving.current = false;

    if(!r.ok) {
      setBusy(false);

      if(r.code === 'locked') lockRef.current?.retake();
      if(r.code === 'conflict' && remote.current && Number.isInteger(r.rev)) setConflict({ rev: r.rev });

      return setSaveError(r);
    }

    setConflict(null);

    const first = !remote.current;

    remote.current = { id: r.id, rev: r.rev };
    saved.current = snap;
    setPhotos(old => Object.fromEntries([...Object.entries(old), ...Object.entries(r.photos).map(([hash, info]) => [hash, { ...old[hash], ...info }])]));
    setSavedId(r.id);
    setNodeId(r.id);
    setBusy(false);

    // a save releases the lock on the server: take it back (a new node gets one now)
    if(first) startLock(r.id);
    else lockRef.current?.retake();

    const storage = browserStorage();

    if(storage) clearDraft(storage, target);

    window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail: { hashes: snap.doc.pages.flatMap(page => page.steps.filter(step => step.op === 'photo').map(step => step.photo)) } }));
  };

  // the node changed elsewhere (E65): keep mine saves over it on the newer
  // revision, take theirs replaces the editor with the stored node, cancel
  // leaves everything as it is
  const keepMine = () => {
    remote.current = { ...remote.current, rev: conflict.rev };
    setConflict(null);
    save();
  };
  const takeTheirs = async () => {
    const r = await loadNode(remote.current.id);

    if(!r.ok) return setSaveError(r);

    remote.current = { id: r.id, rev: r.rev };
    saved.current = r.snap;
    setHist(history.create(r.snap));
    setPhotos(old => Object.fromEntries([...Object.entries(old), ...Object.entries(r.photos)]));
    setSelected(null);
    setK(null);
    setCurrent(0);
    setConflict(null);
    setSaveError(null);

    const storage = browserStorage();

    if(storage) clearDraft(storage, target);
  };

  // a new selection starts without a selected vertex
  useEffect(() => setVsel(null), [selected]);

  // corner operations on the selected vertex of the selected shape
  const editVertex = op => {
    const { editStep, vsel } = latest.current;
    const parsed = editStep?.op === 'shape' && vsel !== null ? verticesOf(editStep) : null;

    if(!parsed) return;

    const vertices = op === 'delete' ? removeVertex(parsed.vertices, vsel, editStep.closed) : op === 'break' ? breakVertex(parsed.vertices, vsel) : joinVertex(parsed.vertices, vsel);

    if(!vertices) return;

    dispatch({ type: 'setVertices', id: editStep.id, vertices });

    if(op === 'delete') setVsel(null);
  };

  // leaving the shape tool finishes an open shape that has two corners, else drops it
  useEffect(() => {
    if(tool !== 'shape' && latest.current.shape.vertices.length) commitShape(latest.current.shape);

    // choosing unclip with a clipped photo already selected frees it at once
    const { editStep } = latest.current;

    if(tool === 'unclip' && editStep?.op === 'photo' && editStep.clip !== undefined) {
      dispatch({ type: 'unclip', id: editStep.id });
      setTool('select');
    }
  }, [tool]);

  // keys: a tool key selects a tool; ctrl+z, ctrl+shift+z / ctrl+y, Delete
  useEffect(() => {
    const on = e => {
      if(latest.current.readOnly) return;

      const next = toolForKey(e);

      if(next) return setTool(next);

      const drafting = latest.current.tool === 'shape' && latest.current.shape.vertices.length;

      if(drafting && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if(e.key === 'Enter') return e.preventDefault(), commitShape(latest.current.shape);
        if(e.key === 'Escape') return e.preventDefault(), setDraft(emptyDraft());
        if(e.key === 'Backspace') return e.preventDefault(), setDraft(undoVertex(latest.current.shape));
      }

      const move = transformFor(e);
      const { selected: id, doc, page } = latest.current;

      if(move && id) {
        e.preventDefault();

        const centre = centreOf(doc, id, { photos: hash => latest.current.photos[hash], page }) ?? [500, 500];
        const turn = aboutPoint(move.scale ?? 1, move.rotate ?? 0, centre);

        return transformSelection(id, multiply([1, 0, 0, 1, move.dx ?? 0, move.dy ?? 0], turn));
      }

      const order = orderFor(e);

      if(order && latest.current.selected && !latest.current.previewing) {
        e.preventDefault();

        return latest.current.previewing || dispatch({ type: 'moveStep', id: latest.current.selected, to: order });
      }

      if((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();

        if(latest.current.dirty) save();

        return;
      }

      const action = shortcutFor(e);

      if(!action) return;

      e.preventDefault();

      if(action === 'undo') undo();
      else if(action === 'redo') redo();
      else if(latest.current.selected && !latest.current.previewing) {
        if(latest.current.vsel !== null && latest.current.editStep?.op === 'shape') editVertex('delete');
        else remove(latest.current.selected);
      }
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
    if(tool === 'shape') return shapeDown(units);
    if(tool === 'clip' || tool === 'unclip') return maskDown(units);

    stroke.current = { filter: oneEuroPoint(1.5, 0.01), samples: [] };
    move(e, units);
  };

  // select tool: a tap selects, a drag moves the step, two fingers pinch it,
  // Alt-drag turns and scales it about its centre, a double tap cycles the fit
  const selectDown = (e, units) => {
    const { doc, photos, scale } = latest.current;

    // another finger joins the gesture that is running
    if(gesture.current) return gesture.current.g.down(e.pointerId, units);

    // a vertex or handle of the selected shape comes before anything under it
    const parsed = !previewing && editStep?.op === 'shape' ? verticesOf(editStep) : null;

    if(parsed) {
      const m = matrixOf(doc, editStep.id, { page });
      const hit = m && hitVertex(geometry(parsed, m), units, VERTEX_PX / scale);

      if(hit) {
        setVsel(hit.index);
        vdrag.current = { hit, base: parsed.vertices, from: units, m, id: editStep.id };

        return;
      }
    }

    const id = hitTest(doc, units, { photos: hash => photos[hash], tolerance: TAP_PX / scale, page, upTo: scrubbed ? shown : undefined });

    setSelected(id);

    if(!id) return;

    const step = findStep(doc, id).step;
    const tap = lastTap.current;

    if(!previewing && step.op === 'photo' && tap.id === id && e.timeStamp - tap.time < DOUBLE_TAP_MS && Math.hypot(units[0] - tap.at[0], units[1] - tap.at[1]) < DOUBLE_TAP_PX / scale) {
      lastTap.current = { time: 0, id: null, at: null };

      const info = photos[step.photo];
      const fit = FITS[(FITS.indexOf(step.fit) + 1) % FITS.length];

      if(info) dispatch({ type: 'setFit', id, fit, info });

      return;
    }

    lastTap.current = { time: e.timeStamp, id, at: units };

    const m = matrixOf(doc, id, { page, upTo: scrubbed ? shown : undefined });

    if(!m) return;

    const g = createGesture(m, { slop: SLOP_PX / scale });

    g.down(e.pointerId, units, { alt: e.altKey, centre: centreOf(doc, id, { photos: hash => photos[hash], page, upTo: scrubbed ? shown : undefined }) });
    gesture.current = { g, id };
  };

  // shape tool: a press adds a vertex (or closes the shape on the first one),
  // dragging pulls its handle
  const setDraft = next => {
    latest.current.shape = next;
    setShape(next);
  };
  // clip tool: with a photo selected, tapping a shape makes it that photo's clip;
  // tapping a photo selects it. Unclip tool: tapping a clipped photo frees it.
  const maskDown = units => {
    const { doc, photos, scale } = latest.current;
    const opts = { photos: hash => photos[hash], tolerance: TAP_PX / scale, page };

    if(tool === 'clip' && editStep?.op === 'photo') {
      const shape = hitTest(doc, units, { ...opts, ops: ['shape'] });

      if(shape) {
        dispatch({ type: 'setClip', id: editStep.id, shape });
        setTool('select');

        return;
      }
    }

    const id = hitTest(doc, units, { ...opts, ops: ['photo'] });

    setSelected(id);

    if(tool === 'unclip' && id && findStep(doc, id).step.clip !== undefined) {
      dispatch({ type: 'unclip', id });
      setTool('select');
    }
  };
  const shapeDown = units => {
    const { shape, scale, doc } = latest.current;
    const { draft, closed } = press(shape, units, { near: CLOSE_PX / scale });

    if(closed) return commitShape(draft);

    shaping.current = true;
    setDraft(draft);
  };
  const commitShape = draft => {
    const { doc, pageId, color, size } = latest.current;
    const step = shapeStep(draft, unique(allIds(doc)), { color, width: Math.max(1, size / 3) });

    shaping.current = false;
    setDraft(emptyDraft());

    if(step) dispatch({ type: 'addStep', page: pageId, step });
  };

  const move = (e, [x, y]) => {
    if(vdrag.current) {
      const d = vdrag.current;

      return dispatch({ type: 'setVertices', id: d.id, vertices: dragVertices(d.base, d.hit, d.m, d.from, [x, y], { alt: e.altKey }) });
    }

    if(shaping.current) return setDraft(pull(latest.current.shape, [x, y], { alt: e.altKey }));

    if(gesture.current) {
      const m = gesture.current.g.move(e.pointerId, [x, y]);

      if(m) commitMatrix(gesture.current.id, m);

      return;
    }

    const s = stroke.current;

    if(!s) return;

    const [fx, fy] = s.filter(x, y, e.timeStamp / 1000);

    s.samples.push([fx, fy, e.pointerType === 'mouse' ? 0 : e.pressure, e.timeStamp / 1000]);
    setLive(strokePath(s.samples, latest.current.size, SPACING));
  };

  const up = e => {
    if(vdrag.current) {
      setHist(history.seal);
      vdrag.current = null;

      return;
    }

    if(shaping.current) {
      shaping.current = false;

      return;
    }

    if(gesture.current) {
      // the last pointer up ends the gesture: it is one undo step
      if(gesture.current.g.up(e.pointerId) === 0) {
        if(gesture.current.g.moved) setHist(history.seal);

        inserted.current = null;

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

    if(key === 'delete') return html`<button type="button" class="wb-editor-button wb-editor-delete" disabled=${nodeId === null || busy || readOnly} onClick=${removeNode} title=${t('editor.delete')} aria-label=${t('editor.delete')}>${t('editor.short.delete')}</button>`;

    if(key === 'save') return html`<button type="button" class="wb-editor-button wb-editor-save" disabled=${busy || !dirty} onClick=${save} title=${t('editor.save')} aria-label=${t('editor.save')}>${busy ? t('editor.saving') : t('editor.short.save')}</button>`;

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
  const outline = selectedStep && outlineOf(doc, selectedStep.id, { photos: hash => photos[hash], page, upTo: scrubbed ? shown : undefined });
  const title = doc.title ?? '';
  const strip = auto ? [] : photoSteps(doc, page);
  const parsedShape = editStep?.op === 'shape' && tool === 'select' ? verticesOf(editStep) : null;
  const vertexGeo = parsedShape && matrixOf(doc, editStep.id, { page }) ? geometry(parsedShape, matrixOf(doc, editStep.id, { page })) : null;
  const vertexInfo = vertexGeo && vsel !== null && vertexGeo[vsel] ? { index: vsel, broken: vertexGeo[vsel].broken, canDelete: !!removeVertex(parsedShape.vertices, vsel, editStep.closed) } : null;

  // the palette (E54): shown while the pen or a stroke / shape is selected
  const paletteTargets = tool === 'pen' || tool === 'shape' ? ['pen'] : editStep?.op === 'stroke' ? ['stroke'] : editStep?.op === 'shape' ? ['fill', 'outline'] : null;
  const paletteTarget = paletteTargets && (paletteTargets.includes(aim) ? aim : paletteTargets[0]);
  const reference = editStep?.op === 'photo' ? editStep : strip[strip.length - 1];
  const paletteColours = paletteTargets && swatches(photos[reference?.photo]?.palette ?? [], themeColours()).all;
  const paletteCurrent = paletteTarget === 'pen' ? color : paletteTarget === 'stroke' ? editStep.color : paletteTarget === 'fill' ? editStep.fill : paletteTarget === 'outline' ? editStep.stroke : null;
  const pick = hex => {
    if(paletteTarget === 'pen') setColor(hex);
    else dispatch({ type: 'setColor', id: editStep.id, color: hex, ...(paletteTarget === 'fill' ? { field: 'fill' } : paletteTarget === 'outline' ? { field: 'stroke' } : {}) });
  };

  if(loading || loadError)
    return html`<section id="wb-editor" class="wb-editor" tabindex="-1" aria-label=${t('editor.label')}>
      ${loading
        ? html`<p class="wb-editor-context" role="status">${t('editor.loading')}</p>`
        : html`<p class="wb-editor-banner wb-editor-banner-error" role="alert">
            <span>${t(loadError.code === 'not_found' ? 'editor.save.error.not_found' : 'editor.load.error')}</span>
            <button type="button" class="wb-editor-chip" onClick=${load}>${t('editor.save.retry')}</button>
            <button type="button" class="wb-editor-chip" onClick=${onClose}>${t('editor.close')}</button>
          </p>`}
    </section>`;

  return html`
    <section id="wb-editor" class="wb-editor" tabindex="-1" aria-label=${t('editor.label')}>
      <div class="wb-editor-head">
        <label class="wb-editor-title" inert=${readOnly}>
          <span class="wb-sr-only">${t('editor.title.label')}</span>
          <input type="text" maxlength=${LIMITS.title} autocomplete="off" value=${title} placeholder=${t('editor.title.placeholder')} onInput=${e => dispatch({ type: 'setTitle', title: e.target.value })} />
        </label>
        <span class="wb-editor-head-fields" inert=${readOnly}><${Properties} t=${t} kind=${kind} bg=${doc.bg} dispatch=${dispatch} /></span>
        <button type="button" class="wb-editor-close" onClick=${close}>${t('editor.close')}</button>
      </div>
      ${found &&
      html`<p class="wb-editor-banner" role="status">
        <span>${t('editor.draft.found', { time: new Date(found.savedAt).toLocaleString(lang) })}</span>
        <button type="button" class="wb-editor-chip" onClick=${restore}>${t('editor.draft.restore')}</button>
        <button type="button" class="wb-editor-chip" onClick=${discard}>${t('editor.draft.discard')}</button>
      </p>`}
      ${readOnly &&
      html`<p class="wb-editor-banner wb-editor-banner-error" role="alert">
        <span>${lockState.state === 'lost'
          ? t(lockState.info?.gone ? 'editor.lock.gone' : 'editor.lock.lost')
          : t('editor.lock.locked', { holder: lockState.info?.holder ?? '?', time: lockState.info?.expires_at ? new Date(lockState.info.expires_at).toLocaleTimeString(lang) : '?' })}</span>
        ${!lockState.info?.gone && html`<button type="button" class="wb-editor-chip" onClick=${() => lockRef.current?.breakLock()}>${t('editor.lock.break')}</button>
        <button type="button" class="wb-editor-chip" onClick=${() => lockRef.current?.retake()}>${t('editor.lock.retry')}</button>`}
      </p>`}
      ${conflict &&
      html`<div class="wb-editor-banner wb-editor-banner-error wb-editor-dialog" role="alertdialog" aria-labelledby="wb-conflict-title" aria-describedby="wb-conflict-text">
        <strong id="wb-conflict-title">${t('editor.conflict.title')}</strong>
        <span id="wb-conflict-text">${t('editor.conflict.text')}</span>
        <button type="button" class="wb-editor-chip" disabled=${busy} onClick=${keepMine}>${t('editor.conflict.mine')}</button>
        <button type="button" class="wb-editor-chip" disabled=${busy} onClick=${takeTheirs}>${t('editor.conflict.theirs')}</button>
        <button type="button" class="wb-editor-chip" onClick=${() => (setConflict(null), setSaveError(null))}>${t('editor.conflict.cancel')}</button>
      </div>`}
      ${saveError && !conflict && !(readOnly && saveError.code === 'locked') &&
      html`<p class="wb-editor-banner wb-editor-banner-error" role="alert">
        <span>${t(errorKey(saveError.code), { max: '1 MB' })}</span>
        <button type="button" class="wb-editor-chip" disabled=${busy} onClick=${save}>${t('editor.save.retry')}</button>
        <button type="button" class="wb-editor-chip" onClick=${() => setSaveError(null)}>${t('editor.save.dismiss')}</button>
      </p>`}
      ${savedId !== null && !dirty && !saveError && html`<p class="wb-editor-banner" role="status"><span>${t('editor.saved')}</span> <a href=${`/${lang}/node/${savedId}`}>${t('editor.saved.view', { id: savedId })}</a></p>`}
      <div class="wb-editor-frame" inert=${readOnly}>
      <div class="wb-editor-work">
      <div class="wb-editor-body">
        <div class="wb-editor-tools" role="toolbar" aria-label=${t('editor.tools')}>${TOOLS.map(toolButton)}</div>
        <${Stage}
          label=${title || t('editor.stage')}
          class=${'wb-editor-cursor-' + tool + (over ? ' wb-editor-stage-over' : '')}
          content=${renderNode(doc, { photos: hash => photos[hash] ?? null, page: mode === 'slides' ? Math.min(slide, Math.max(0, slides - 1)) : page, upTo: auto ? undefined : playing ? pos : previewing ? shown : undefined })}
          overlay=${({ scale }) => html`${live && html`<path d=${live} fill=${color} />`}${vertexGeo && html`<${VertexEdit} geo=${vertexGeo} sel=${vsel} scale=${scale} />`}${shape.vertices.length > 0 && html`<${ShapeDraft} draft=${shape} color=${color} width=${Math.max(1, size / 3)} scale=${scale} />`}${outline && html`<${Selection} outline=${outline} scale=${scale} />`}`}
          interactive=${!auto && (tool === 'select' || ((tool === 'pen' || tool === 'shape' || tool === 'clip' || tool === 'unclip') && !previewing))}
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
      <${Filmstrip} t=${t} steps=${strip} photos=${photos} selected=${editStep?.id ?? null} onSelect=${setSelected} onMove=${(id, to) => dispatch({ type: 'movePhoto', id, to })} onRole=${(id, role) => dispatch({ type: 'setRole', id, role })} onRemove=${remove} />
      </div>
      ${(tool === 'clip' || tool === 'unclip') && html`<p class="wb-editor-context" role="status">${t('editor.context.' + tool)}</p>`}
      ${tool === 'shape'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.color')} <input type="color" value=${color} onInput=${e => setColor(e.target.value)} /></label>
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
            <button type="button" class="wb-editor-chip" disabled=${shape.vertices.length < 2} onClick=${() => commitShape(shape)}>${t('editor.shape.finish')}</button>
            <button type="button" class="wb-editor-chip" disabled=${!shape.vertices.length} onClick=${() => setDraft(emptyDraft())}>${t('editor.shape.cancel')}</button>
            <span class="wb-editor-hint">${t('editor.shape.hint')}</span>
          </div>`
        : tool === 'pen'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.color')} <input type="color" value=${color} onInput=${e => setColor(e.target.value)} /></label>
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
          </div>`
        : html`<${ContextBar} t=${t} step=${editStep} vertex=${vertexInfo} onVertex=${editVertex} clipped=${editStep?.clip !== undefined} photo=${editStep && photos[editStep.photo]} dispatch=${command => (command.type === 'removeStep' ? remove(command.id) : dispatch(command))} />`}
      ${paletteTargets && html`<${Palette} t=${t} swatches=${paletteColours} target=${paletteTarget} targets=${paletteTargets} onTarget=${setAim} current=${paletteCurrent} onPick=${pick} />`}
      <${ModeSwitch} t=${t} mode=${mode} onMode=${setMode} />
      ${auto
        ? html`<p class="wb-editor-context" role="status">${t('editor.mode.auto')}</p>`
        : html`<${Scrubber} t=${t} count=${count} k=${shown} playing=${playing} onScrub=${scrub} onPlay=${togglePlay} />
            ${previewing && !playing && html`<p class="wb-editor-context" role="status">${t('editor.scrub.preview')}</p>`}`}
      ${mode === 'slides'
        ? html`<${SlideStrip} t=${t} doc=${doc} photos=${photos} count=${slides} current=${Math.min(slide, Math.max(0, slides - 1))} onSelect=${setSlide} />`
        : mode === 'free' && html`<${PageStrip} t=${t} doc=${doc} photos=${photos} current=${page} onSelect=${switchPage} onAdd=${addPage} onMove=${(id, to) => dispatch({ type: 'movePage', id, to })} onRemove=${removePage} />`}
      </div>
    </section>
  `;
};
