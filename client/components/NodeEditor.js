import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { UPLOAD_MIME } from '../files.js';
import { LIMITS, allIds, emptyNode, findStep, photoSteps, unique } from '../editor/model.js';
import { apply } from '../editor/commands.js';
import { createGesture } from '../editor/gesture.js';
import { aboutPoint } from '../editor/gestures.js';
import { apply as applyMatrix, invert, multiply } from '../editor/matrix.js';
import { ADD_EVENT, SAVED_EVENT, takePending } from '../editor/pending.js';
import { deleteNode, errorKey, loadNode, saveNode } from '../editor/save.js';
import { createLock } from '../editor/lock.js';
import * as history from '../editor/history.js';
import { DRAFT_INTERVAL, browserStorage, clearDraft, isDirty, loadDraft, saveDraft } from '../editor/draft.js';
import { centreOf, hitTest, matrixOf, outlineOf, selectableIds } from '../editor/hit.js';
import { breakVertex, drag as dragVertices, geometry, hitVertex, joinVertex, removeVertex, verticesOf } from '../editor/vertexedit.js';
import { emptyDraft, preview, press, pull, shapeStep, undoVertex } from '../editor/shapetool.js';
import { cascade, photosOnPage } from '../editor/cascade.js';
import { documentThumb, exportImage, sceneCanvas, stepImage } from '../editor/export.js';
import { boxOf, setContext, trackCommand } from '../events.js';
import { TextEdit } from './TextEdit.js';
import { measureText } from '../editor/measure.js';
import { LIMITS as TEXT_LIMITS, boxHeight, layout } from '../editor/text.js';
import { rasteriseSvg, svgFor, classify, copyPayload, fromEvent, htmlFor, plainFor, readClipboard, writeClipboard } from '../editor/clipboard.js';
import { sendFile } from '../upload.js';
import { uploadPayload } from '../files.js';
import { scenePalette } from '../editor/scenepalette.js';
import { eventUnits } from '../editor/stage.js';
import { fetchImage } from '../editor/preload.js';
import { visibleBox } from '../editor/alpha.js';
import { contentBox, loadAlpha } from '../editor/alphamap.js';
import { photoPoint, readLines, resultPolygon } from '../editor/wand.js';
import { clipFromStroke } from '../editor/clipstroke.js';
import { contains } from '../editor/polygon.js';
import { handlePoints, hitHandle, nudge, rotateDrag, scaleDrag } from '../editor/handles.js';
import { outlinesToStage, photoPolygon } from '../editor/clipping.js';
import { oneEuroPoint, resample, strokePath, strokeWidths } from '../editor/pen.js';
import { blocked } from '../editor/job.js';
import { photoSteps as allPhotoSteps, renderNode, renderPhoto, slideOf, slideView } from '../editor/render.js';
import { clipPolygonsOf, crossedOutline, cutOutlines, insertOnEdge, nearestVertex, outlineCount } from '../editor/multiclip.js';
import { orderFor, shortcutFor, transformFor } from '../editor/shortcuts.js';
import { CURSOR_START, cycleId, inEditor, moveCursor } from '../editor/keyboard.js';
import { DEFAULT_TOOL, TOOLS, inField, toolForKey } from '../editor/tools.js';
import { editorStore } from '../editor/useEditor.js';
import { acuteCorner } from '../editor/walls.js';
import { NEW } from '../editor/store.js';
import { swatches, usedColours } from '../editor/palette.js';
import { ContextBar } from './ContextBar.js';
import { Filmstrip } from './Filmstrip.js';
import { clampK, durationOf, positionAt } from '../editor/playback.js';
import { ModeSwitch } from './ModeSwitch.js';
import { PageStrip } from './PageStrip.js';
import { Palette } from './Palette.js';
import { Scrubber } from './Scrubber.js';
import { SlideStrip } from './SlideStrip.js';
import { Properties } from './Properties.js';
import { Popover } from './Popover.js';
import { Stage } from './Stage.js';

// Editor frame (EDITOR.md S2.2): title row, tool column, square stage, action
// column, context bar and page strip. Everything that changes the node is a
// command through `dispatch`, so there is one history (undo, redo, keys) and
// one place that knows what is dirty. The page strip and the node-level
// actions stay inert until their tasks.
const ACTIONS = ['undo', 'redo', 'page', 'delete', 'save'];
// the keys the help popover lists (EDITOR.md E73), each with `editor.keys.<name>`
// why a command that changed nothing was a wall refusal, or null: { key, params }
function wallRefusal(snap, command) {
  const step = findStep(snap.doc, command.id)?.step;

  if(step?.op !== 'shape') return null;

  if(command.type === 'setWall' && command.wall !== null) {
    if(snap.kind !== 'gallery') return { key: 'editor.wall.gallery' };

    const parsed = verticesOf(step);
    const acute = parsed && acuteCorner(parsed.vertices, step.closed);

    return acute ? { key: 'editor.wall.acute', params: { angle: Math.round(acute.angle) } } : null;
  }

  if(!step.wall) return null;

  const vertices = command.type === 'setVertices' ? command.vertices : command.type === 'updateShape' && typeof command.changes?.closed === 'boolean' ? verticesOf(step)?.vertices : null;
  const acute = vertices && acuteCorner(vertices, command.type === 'updateShape' ? command.changes.closed : step.closed);

  return acute ? { key: 'editor.wall.acute', params: { angle: Math.round(acute.angle) } } : null;
}

const KEYS = ['V P S C U T', 'PageDown PageUp', 'Escape', 'Arrows', '+ -', ', .', '[ ]', 'Delete', '\\', 'Space', 'Enter', 'Backspace', 'W', 'I', 'Ctrl+Z Ctrl+Y', 'Ctrl+S'];
const SPACING = 4;
const VERTEX_PX = 14; // how near a click picks a vertex or handle
const CLOSE_PX = 14; // how near the first vertex a click closes the shape
const HANDLE_PX = 10; // a selection handle's side on screen (a pointer you can use for fine work)
const HANDLE_PX_TOUCH = 32; // the same on a touch screen (E113)
const WAND_MAX_COVER = 0.6; // a wand mask over this share of the photo is taken for the background
const CUT_REACH_PX = 28; // how near the border a clip stroke may end and still be taken to it
const TAP_PX = 12; // how far from a thin line still counts as a tap on it
const SLOP_PX = 6; // a pointer must travel this far before a gesture moves the step
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_PX = 24;
const round = (v, k) => Math.round(v * k) / k;

// what the editor needs to draw an upload: where it is and how big
// the share of the busy ring the server's work takes; the rest is loading the new image
const SERVER_SHARE = 0.8;
const photoInfo = p => ({ href: `/files/uploads/${p.display}`, width: p.width, height: p.height, padding: p.padding, palette: Array.isArray(p.palette) ? p.palette.filter(c => /^#[0-9a-f]{6}$/i.test(c?.hex)).slice(0, 8) : [] });
const isPayload = p => p && /^[0-9a-f]{64}$/.test(p.hash) && typeof p.display === 'string' && p.width > 0 && p.height > 0;

// the keyboard cursor of the shape tool (E73): a cross, Space places a corner there
const KeyCursor = ({ at, scale }) => {
  const r = (HANDLE_PX * 1.6) / scale;

  return html`<g class="wb-editor-keycursor" aria-hidden="true">
    <line class="wb-editor-outline" x1=${at[0] - r} y1=${at[1]} x2=${at[0] + r} y2=${at[1]} />
    <line class="wb-editor-outline" x1=${at[0]} y1=${at[1] - r} x2=${at[0]} y2=${at[1] + r} />
  </g>`;
};

// the shape the clip tool would use, chosen with PageDown / PageUp
// the stroke being drawn with the clip tool
const ClipLine = ({ points }) => html`<polyline class="wb-editor-outline" stroke-dasharray="6 4" points=${points.map(p => p.join(',')).join(' ')} />`;

// a ring where the server is working (magic wand, background removal): the arc
// follows the tool's percent, which is written in the middle; a ring that spins
// while there is none
const Busy = ({ at, scale }) => {
  const r = 24 / scale;
  const known = Number.isFinite(at.percent);

  return html`<g class="wb-busy" transform=${`translate(${at.x} ${at.y})`} pointer-events="none">
    <circle class="wb-busy-track" r=${r} />
    <circle class=${'wb-busy-arc' + (known ? '' : ' wb-busy-spin')} r=${r} pathLength="100" stroke-dasharray=${known ? `${Math.max(2, at.percent)} 100` : '25 100'} transform="rotate(-90)" />
    ${known && html`<text class="wb-busy-text" font-size=${13 / scale} text-anchor="middle" dominant-baseline="central">${Math.round(at.percent)}%</text>`}
    ${at.label && html`<text class="wb-busy-label" y=${r + 16 / scale} font-size=${12 / scale} text-anchor="middle">${at.label}</text>`}
  </g>`;
};

// the clip tool on a clipped photo (E115, E116): the clipped-away part ghosted at
// a quarter strength with a thin outline of the whole photo, and a handle on
// every vertex of the clip outline
// clip outlines are coloured by nesting depth (how many other outlines contain
// them) round the hue wheel, so they differ from the blue selection box
// the outline a cut stroke would split (`lit`) is brighter
const depthColour = (polys, i, lit) => {
  const depth = polys.filter((other, j) => j !== i && contains(other, polys[i][0])).length;

  return `hsl(${(330 + depth * 70) % 360} ${lit ? 100 : 85}% ${lit ? 70 : 45}%)`;
};

const ClipGhost = ({ step, m, info, geo, scale, px, lit = -1 }) => {
  const side = px / scale;
  const corners = m ? [[0, 0], [1000, 0], [1000, 1000], [0, 1000]].map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]) : null;

  return html`<g class="wb-clip-ghost" pointer-events="none">
    ${info && m && renderPhoto({ ...step, m, clip: undefined, opacity: 0.25, blend: 'normal' }, info)}
    ${corners && html`<polygon class="wb-editor-outline" points=${corners.map(p => p.join(',')).join(' ')} />`}
    ${geo.polys.map((poly, i) => {
      const colour = depthColour(geo.polys, i, i === lit);

      return html`<polygon class="wb-editor-outline" style=${`stroke:${colour}`} points=${poly.map(p => p.join(',')).join(' ')} />${poly.map(([x, y]) => html`<rect class="wb-editor-handle" style=${`stroke:${colour}`} x=${x - side / 2} y=${y - side / 2} width=${side} height=${side} />`)}`;
    })}
  </g>`;
};

// the select tool on a clipped photo: the clipped-away part ghosted at a quarter
// strength, no handles (the clip tool has those)
const ClippedAway = ({ step, m, info }) => (info && m ? html`<g class="wb-clip-ghost" pointer-events="none">${renderPhoto({ ...step, m, clip: undefined, opacity: 0.25, blend: 'normal' }, info)}</g>` : null);

const Candidate = ({ outline }) => (outline ? html`<polygon class="wb-editor-outline wb-editor-candidate" points=${outline.map(p => p.join(',')).join(' ')} />` : null);

// focus a dialog's first button when it appears (a stable function: once)
const focusIt = el => el && el.focus();

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

// where the handles of an outline are, for a handle `px` wide on screen
const handleSet = (outline, scale, px) => ({ ...handlePoints(outline, { inset: px / 2 / scale, gap: (px * 1.8) / scale }), outline });

// the outline and the handles of the selection, in the stage overlay: four corners
// that scale and, with `grips`, a round handle above the top edge that turns
const Selection = ({ outline, scale, px, grips }) => {
  const side = px / scale;
  const set = handleSet(outline, scale, px);
  const top = [(outline[0][0] + outline[1][0]) / 2, (outline[0][1] + outline[1][1]) / 2];

  return html`<g class="wb-editor-selection">
    <polygon class="wb-editor-outline" points=${outline.map(p => p.join(',')).join(' ')} />
    ${set.corners.map(([x, y]) => html`<rect class="wb-editor-handle" x=${x - side / 2} y=${y - side / 2} width=${side} height=${side} />`)}
    ${grips && html`<line class="wb-editor-outline" x1=${top[0]} y1=${top[1]} x2=${set.rotate[0]} y2=${set.rotate[1]} />`}
    ${grips && html`<circle class="wb-editor-handle wb-editor-rotate" cx=${set.rotate[0]} cy=${set.rotate[1]} r=${side / 2} />`}
  </g>`;
};

export const NodeEditor = ({ onClose, target = 'new' }) => {
  const { t, lang } = useI18n();
  const [hist, setHist] = useState(() => history.create({ doc: emptyNode(), kind: 'node' }));
  const [photos, setPhotos] = useState({});
  const [panelTab, setPanelTab] = useState('select'); // landscape: which panel section shows
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
  const quiet = useRef(false); // the next tool change was announced by its own message
  const [wallNotice, setWallNotice] = useState(null); // the wall layer refused a change: { key, params }
  const [announce, setAnnounce] = useState(''); // read out by screen readers
  const [cursor, setCursor] = useState(null); // the keyboard cursor of the shape tool
  const [candidate, setCandidate] = useState(null); // the shape the clip tool would use, chosen by key
  const [opener] = useState(() => (typeof document === 'undefined' ? null : document.activeElement)); // where the focus goes back to on close
  const [vsel, setVsel] = useState(null); // the selected vertex of the selected shape
  const [shape, setShape] = useState(emptyDraft); // the shape being drawn (shape tool)
  const [aim, setAim] = useState('fill'); // which colour of a selected shape the palette sets
  const stroke = useRef(null);
  const tdrag = useRef(null); // a corner of a text box being dragged in the text tool: { id, base, m, index }
  const hdrag = useRef(null); // a selection handle being dragged: { kind, id, base, pivot | centre, down }
  const [wandMode, setWandMode] = useState('add'); // what a wand tap means: add the area, or exclude it
  const [wandPick, setWandPick] = useState(null); // { index, count } of the candidate shown
  const [clipMode, setClipMode] = useState('replace'); // what a new closed outline does to a clip: replace, add, subtract
  const cdrag = useRef(null); // a clip vertex being dragged: { id, polys, poly, vertex }
  const [typing, setTyping] = useState(null); // id of the text box being typed in
  const [busyAt, setBusyAt] = useState(null); // { x, y, percent } where the server is working, in stage units
  const [cutting, setCutting] = useState(null); // id of the photo whose background is being removed
  const cutRun = useRef(null);
  const wand = useRef(null); // { id, points, controller } of the magic wand run
  const clipStroke = useRef(null); // { points } while a clip-tool stroke is drawn
  const [clipLine, setClipLine] = useState(null);
  const [coarse] = useState(() => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  const handlePx = coarse ? HANDLE_PX_TOUCH : HANDLE_PX;
  const [hint, setHint] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false); // a short note in place of the clip tool's help text
  const latestT = useRef(t); // the handlers registered once speak the current language
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
  const { doc: realDoc, kind } = hist.present;
  const mode = realDoc.mode;
  const slides = allPhotoSteps(realDoc).length;
  const slideNow = Math.min(slide, Math.max(0, slides - 1));
  const slideInfo = mode === 'slides' ? slideOf(realDoc, slideNow) : null; // slides: the photo is laid out, the drawings after it are edited
  const doc = slideInfo ? slideView(realDoc, slideInfo) : realDoc; // what the editor reads: the slide's drawings alone on page 0
  const page = slideInfo ? 0 : Math.min(current, doc.pages.length - 1); // undo can remove the page being shown
  const pageId = doc.pages[page].id;
  const auto = mode === 'grid' || (mode === 'slides' && !slideInfo); // the grid lays the photos out itself: nothing to edit
  const count = doc.pages[page].steps.length;
  const shown = clampK(k, count);
  const scrubbed = !auto && !slideInfo && shown < count; // scrubbed back: moves are recorded as transform steps
  const previewing = auto || scrubbed; // everything else is read-only there
  const located = selected ? findStep(doc, selected) : null;
  const selectedStep = !auto && located?.page === page && located.index < shown ? located.step : null; // not one of another page, nor one not shown yet
  const editStep = previewing ? null : selectedStep;
  const dirty = isDirty(hist.present, saved.current);

  // always the current state for handlers registered once
  const latest = useRef();

  latestT.current = t;
  const tr = (key, params) => latestT.current(key, params);
  const readOnly = lockState.state === 'locked' || lockState.state === 'lost'; // someone else holds the node

  latest.current = { cursor, candidate, readOnly, tool, shape, vsel, editStep, snap: hist.present, doc, slideInfo, cutting, page, pageId, count, k, shown, scrubbed, previewing, photos, selected: selectedStep?.id ?? null, scale, dirty, found, color, size, typing, dropFor: null, startDropper: null };

  // In slides mode a new drawing goes right after the slide's last drawing, and
  // a move in the stack stays between the photo and the next one: the slide a
  // drawing belongs to is the photo before it
  const onSlide = (command, info) => {
    if(!info) return command;

    if((command.type === 'addStep' || command.type === 'addText') && command.index === undefined) return { ...command, index: info.insertAt };

    if(command.type === 'moveStep') {
      const lo = info.at + 1;
      const hi = info.insertAt - 1;
      const real = latest.current.snap.doc.pages[info.page].steps;
      const now = real.findIndex(step => step.id === command.id);
      const to = command.to === 'front' ? hi : command.to === 'back' ? lo : command.to === 'up' ? Math.min(hi, now + 1) : command.to === 'down' ? Math.max(lo, now - 1) : command.to;

      return { ...command, to };
    }

    return command;
  };

  // every change of the node goes through here
  const dispatch = raw => {
    if(latest.current?.readOnly) return;

    // a photo whose background is being removed cannot be taken away or changed meanwhile
    if(blocked(latest.current?.snap.doc, latest.current?.cutting, raw)) return setAnnounce(tr('editor.announce.busy'));

    const command = onSlide(raw, latest.current?.slideInfo);

    // a wall that would get a corner sharper than 90 degrees is refused: say so
    const was = latest.current?.snap;
    const probe = was && apply(was, command);

    trackCommand(command, probe ? probe.snap !== was : undefined);

    if(probe && probe.snap === was) {
      const problem = wallRefusal(was, command);

      if(problem) {
        setWallNotice(problem);
        setAnnounce(tr(problem.key, problem.params));
      }
    } else if(wallNotice) setWallNotice(null);

    setHist(h => {
      const r = apply(h.present, command);

      return history.push(h, r.snap, r.key);
    });
  };
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
  // what usage events say about the editor at the moment of a tap or gesture
  useEffect(() => {
    setContext(() => {
      const c = latest.current;
      const stage = document.querySelector('.wb-editor-stage');

      return { tool: c.tool, sel: c.editStep ? [c.editStep.op, c.editStep.id] : undefined, pg: c.page, pages: c.doc.pages.length, steps: c.doc.pages[c.page]?.steps.length, k: c.k, scale: Math.round(c.scale * 1000) / 1000, ro: c.readOnly || undefined, prev: c.previewing || undefined, stage: stage ? boxOf(stage) : undefined };
    });

    return () => setContext(null);
  }, []);

  // leaving the wand (or the editor) kills a run that is still going
  useEffect(() => {
    if(tool === 'wand') return;

    wand.current?.controller?.abort();
    wand.current = null;
    setWandPick(null);
  }, [tool]);
  useEffect(() => () => (wand.current?.controller?.abort(), cutRun.current?.abort()), []);

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
  const undo = () => latest.current.readOnly || (trackCommand({ type: 'undo' }), (inserted.current = null), setHist(history.undo));
  const redo = () => latest.current.readOnly || (trackCommand({ type: 'redo' }), (inserted.current = null), setHist(history.redo));

  // A photo lands as a half-stage square in a diagonal cascade (E112): `index` is
  // the number of photos the page already has (a batch counts up, the document
  // is not re-read between its photos), `batch` how many arrive together. One
  // photo alone on an empty page covers the stage, as before.
  const addUpload = (payload, { index = photosOnPage(latest.current.doc.pages[latest.current.page]), batch = 1 } = {}) => {
    if(!isPayload(payload)) return;

    setK(null);
    setPlaying(false);
    setPhotos(old => ({ ...old, [payload.hash]: photoInfo(payload) }));
    dispatch({ type: 'addPhoto', hash: payload.hash, info: payload, role: payload.role, crop: payload.crop, page: latest.current.pageId, id: unique(allIds(latest.current.doc)), m: index === 0 && batch === 1 ? undefined : cascade(index) });
  };

  const remove = id => {
    dispatch({ type: 'removeStep', id });
    setSelected(null);
  };

  // the "add to node" button of an upload card queues the photo; an open editor
  // takes it at once, a freshly opened one when it mounts, and moves the focus in
  const addQueued = () => {
    const queued = takePending();

    const start = photosOnPage(latest.current.doc.pages[latest.current.page]);

    queued.forEach((payload, k) => addUpload(payload, { index: start + k, batch: queued.length }));

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
    const thumb = await documentThumb(snap.doc, { photos: hash => latest.current.photos[hash], page: 0 });
    const r = await saveNode(snap, remote.current, undefined, { thumb });

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

  // what a screen reader is told: the selection, the tool, the corner
  useEffect(() => {
    const { doc: d, page: pg, shown: upTo } = latest.current;
    const found = selected ? findStep(d, selected) : null;

    if(!found) return setAnnounce(tr('editor.announce.none'));

    const ids = selectableIds(d, { page: pg, upTo });

    setAnnounce(tr('editor.announce.selected', { kind: tr('editor.step.' + found.step.op), n: ids.indexOf(selected) + 1, total: ids.length }));
  }, [selected]);

  useEffect(() => {
    setCursor(null);
    setCandidate(null);
    if(quiet.current) return void (quiet.current = false);
    setAnnounce(tr('editor.announce.tool', { tool: tr('editor.tool.' + tool) }));
  }, [tool]);

  useEffect(() => {
    const parsed = vsel !== null && latest.current.editStep ? verticesOf(latest.current.editStep) : null;

    if(parsed) setAnnounce(tr('editor.announce.vertex', { n: vsel + 1, total: parsed.vertices.length }));
  }, [vsel]);

  // the focus goes back to where the editor was opened from
  useEffect(
    () => () => {
      const back = opener && opener !== document.body && document.contains(opener) ? opener : document.querySelector('main a:not(.wb-sr-only), main button, main input');

      back?.focus?.({ preventScroll: true });
    },
    [],
  );

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
    setHint('');

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
      if(latest.current.readOnly || !inEditor(e.target)) return;

      const { tool: current, doc: d, page: pg, shown: upTo, selected: sel, editStep: step, vsel: vs, candidate: cand } = latest.current;
      const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
      const draftingNow = current === 'shape' && latest.current.shape.vertices.length;

      // W: the selected shape becomes a wall of the gallery, or stops being one
      if(plain && !inField(e.target) && !e.repeat && e.key.toLowerCase() === 'w' && current === 'select' && step?.op === 'shape') {
        e.preventDefault();
        dispatch({ type: 'setWall', id: step.id, wall: step.wall ? null : {} });

        return;
      }

      // I: the dropper for the colour the palette or the selection is setting
      if(plain && !e.shiftKey && !inField(e.target) && !e.repeat && e.key.toLowerCase() === 'i' && latest.current.dropFor) {
        e.preventDefault();
        latest.current.startDropper(latest.current.dropFor);

        return;
      }

      // PageDown / PageUp walk through the steps; in the clip tool, through the shapes that could mask
      if(plain && !inField(e.target) && (e.key === 'PageDown' || e.key === 'PageUp')) {
        e.preventDefault();

        const dir = e.key === 'PageDown' ? 1 : -1;

        if(current === 'clip' && step?.op === 'photo') {
          const next = cycleId(selectableIds(d, { page: pg, ops: ['shape'] }), cand, dir);

          setCandidate(next);
          setAnnounce(next ? tr('editor.announce.candidate') : '');
        } else {
          setSelected(cycleId(selectableIds(d, { page: pg, upTo }), sel, dir));
        }

        return;
      }

      // \ walks through the corners of the selected shape
      if(plain && !inField(e.target) && e.key === '\\' && step?.op === 'shape') {
        const n = verticesOf(step)?.vertices.length ?? 0;

        if(n) {
          e.preventDefault();
          setVsel(vs === null ? (e.shiftKey ? n - 1 : 0) : (vs + (e.shiftKey ? -1 : 1) + n) % n);
        }

        return;
      }

      // arrows move the selected corner instead of the whole shape
      if(plain && !inField(e.target) && vs !== null && step?.op === 'shape' && /^Arrow/.test(e.key)) {
        const parsed = verticesOf(step);
        const m = matrixOf(d, step.id, { page: pg });
        const by = e.shiftKey ? 10 : 1;
        const [dx, dy] = { ArrowLeft: [-by, 0], ArrowRight: [by, 0], ArrowUp: [0, -by], ArrowDown: [0, by] }[e.key];

        if(parsed && m) {
          e.preventDefault();
          dispatch({ type: 'setVertices', id: step.id, vertices: dragVertices(parsed.vertices, { kind: 'vertex', index: vs }, m, [0, 0], [dx, dy]) });
        }

        return;
      }

      // shape tool: arrows move the cursor, Space places a corner there
      if(current === 'shape' && plain && !inField(e.target)) {
        const at = latest.current.cursor ?? CURSOR_START;
        const moved = moveCursor(at, e);

        if(moved) {
          e.preventDefault();
          setCursor(moved);

          return;
        }

        if(e.key === ' ' && e.target?.tagName !== 'BUTTON') {
          e.preventDefault();
          setCursor(at);
          shapeDown(at);
          shaping.current = false; // no pointer is down: nothing to pull
          setAnnounce(tr('editor.announce.placed', { n: latest.current.shape.vertices.length }));

          return;
        }
      }

      // clip tool: Enter masks the selected photo with the chosen shape
      if(current === 'clip' && e.key === 'Enter' && cand && step?.op === 'photo' && plain && e.target?.tagName !== 'BUTTON') {
        e.preventDefault();
        dispatch({ type: 'setClip', id: step.id, shape: cand });
        setCandidate(null);
        quiet.current = true;
        setTool('select');
        setAnnounce(tr('editor.announce.clipped'));

        return;
      }

      // Escape with the select tool already active lets go of the selection
      if(e.key === 'Escape' && current === 'select' && !draftingNow && !e.repeat && !inField(e.target)) {
        setSelected(null);
        setCandidate(null);

        return;
      }

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

  // the upload list greys out the photos this node already uses
  // the colours of what is on the stage (E132), drawn small and counted once the document
  // has rested; only while something shows them (the palette, the properties)
  const [scenePal, setScenePal] = useState(null);
  const [, setAlphaReady] = useState(0);

  // the transparent parts of the photos (clicks go through them, the selection box hugs the content)
  useEffect(() => {
    let live = true;

    Object.values(photos).forEach(info => info?.href && loadAlpha(info.href).then(map => map && live && setAlphaReady(n => n + 1)));

    return () => {
      live = false;
    };
  }, [photos]);
  const [propsOpen, setPropsOpen] = useState(false);
  const wantsPalette = propsOpen || editStep?.op === 'text' || tool === 'pen' || tool === 'shape' || editStep?.op === 'stroke' || editStep?.op === 'shape';
  const loaded = Object.keys(photos).length;
  const photoId = editStep?.op === 'photo' ? editStep.id : undefined;

  useEffect(() => {
    if(!wantsPalette) return;

    let live = true;
    const timer = setTimeout(() => {
      // a selected photo offers its own colours (its visible part), else the page's
      scenePalette(realDoc, { photos: hash => photos[hash] ?? null, page: mode === 'slides' ? slideNow : page }, photoId).then(p => live && setScenePal(p.length ? p : null));
    }, 500);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [wantsPalette, realDoc, loaded, page, slideNow, photoId]);

  const usedKey = [...new Set(doc.pages.flatMap(p => p.steps.filter(s => s.op === 'photo').flatMap(s => [s.photo, s.orig].filter(Boolean))))].sort(); // a cutout's original counts as used

  useEffect(() => {
    editorStore.setUsed(usedKey);
  }, [usedKey.join()]);

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
    // a running server job is lost with the editor: ask even when nothing else is unsaved
    if((dirty || cutting !== null || busyAt !== null) && !window.confirm(t(dirty ? 'editor.close.confirm' : 'editor.close.job'))) return;

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
    if(tool === 'wand') return wandDown(e, units);
    if(tool === 'text') return textDown(units);
    if(tool === 'clip' || tool === 'unclip') return maskDown(units);

    stroke.current = { filter: oneEuroPoint(1.5, 0.01), samples: [] };
    move(e, units);
  };

  // select tool: a tap selects, a drag moves the step, two fingers pinch it,
  // Alt-drag turns and scales it about its centre, a double tap puts a photo back to covering the stage
  const selectDown = (e, units) => {
    const { doc, photos, scale } = latest.current;

    // another finger joins the gesture that is running
    if(gesture.current) return gesture.current.g.down(e.pointerId, units);

    // a handle of the selection comes before anything under it: a corner scales
    // about the opposite corner, the round one turns about the centre (E113)
    if(!previewing && editStep) {
      const set = (() => {
        const o = outlineOf(doc, editStep.id, { photos: hash => photos[hash], page, upTo: scrubbed ? shown : undefined, clipped: true });

        return o && handleSet(o, scale, handlePx);
      })();
      const grip = set && hitHandle(set, units, (handlePx / 2 + (coarse ? 6 : 3)) / scale);
      const base = grip && matrixOf(doc, editStep.id, { page, upTo: scrubbed ? shown : undefined });

      if(grip && base) {
        hdrag.current = grip.kind === 'rotate' ? { kind: 'rotate', id: editStep.id, base, centre: set.centre, down: units } : { kind: 'scale', id: editStep.id, base, pivot: set.outline[(grip.index + 2) % 4], down: units };

        return;
      }
    }

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

      dispatch({ type: 'setMatrix', id, m: [1, 0, 0, 1, 0, 0] }); // back to covering the stage

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
  // --- text boxes (E91, E93) ---

  const measureFor = bold => (text, font, size) => measureText(text, font, size, bold);

  // a tap with the text tool: end the box being typed in; else edit the box under the tap, else make a new one there
  // a corner of the selected text box, in the text tool: dragging it changes the box (its width,
  // the text wraps again), not the text. Claimed before the stage takes the focus, so typing goes on.
  const claimCorner = (e, units) => {
    const { doc, photos, scale, page: at, editStep: current, previewing: preview, tool: now } = latest.current;

    if(now !== 'text' || preview || current?.op !== 'text') return false;

    const o = outlineOf(doc, current.id, { photos: hash => photos[hash], page: at });
    const set = o && handleSet(o, scale, handlePx);
    const grip = set && hitHandle(set, units, (handlePx / 2 + (coarse ? 6 : 3)) / scale);
    const m = matrixOf(doc, current.id, { page: at });

    if(grip?.kind !== 'corner' || !m || !invert(m)) return false;

    tdrag.current = { id: current.id, base: current, m, index: grip.index };

    return true;
  };

  // the typing field lies over the box and its corner handles: a press on one reaches here
  const gripFromField = e => {
    const svg = document.querySelector('.wb-editor-stage svg.wb-editor-overlay');
    const units = svg && eventUnits(svg, e);

    if(units && claimCorner(e, units)) {
      e.preventDefault();
      svg.setPointerCapture?.(e.pointerId);
    }
  };

  const textDown = units => {
    const { doc, photos, scale, pageId, color: ink, page: at } = latest.current;

    if(latest.current.typing) return finishText();

    const hit = hitTest(doc, units, { photos: hash => photos[hash], tolerance: TAP_PX / scale, page: at, ops: ['text'] });

    if(hit) {
      setSelected(hit);
      setTyping(hit);

      return;
    }

    const id = unique(new Set(allIds(doc)));
    const size = 64;
    const w = 600;
    const x = Math.min(Math.max(0, units[0] - w / 2), 1000 - w);
    const y = Math.min(Math.max(0, units[1]), 1000 - size * 1.2);

    dispatch({ type: 'addText', id, page: pageId, text: '', lines: [''], m: [1, 0, 0, 1, x, y], w, h: boxHeight(1, size), font: 'sans', size, color: ink, align: 'start' });
    setSelected(id);
    setTyping(id);
  };

  // the box being typed in is done: an empty one is discarded
  const finishText = () => {
    const { typing: id, doc } = latest.current;

    if(!id) return;

    latest.current.typing = null;
    setTyping(null);

    const step = findStep(doc, id)?.step;

    if(!step || step.text.trim() === '') {
      if(step) remove(id);

      return;
    }

    setTool('select');
  };

  // new text for the box being typed in: re-wrapped and re-measured
  const changeText = (patch, key) => {
    const { doc, typing: id, editStep: current } = latest.current;
    const step = findStep(doc, id ?? current?.id)?.step;

    if(step?.op !== 'text') return;

    const next = { ...step, ...patch };
    const { lines, h } = layout(next, measureFor(next.bold));

    dispatch({ type: 'updateText', id: step.id, patch: { ...patch, lines, h }, keyed: key ?? Object.keys(patch)[0] });
  };

  // magic wand (E119): a tap sends the photo and all taps so far to the server;
  // the outline that comes back (a quick one, later a sharper one) becomes the
  // photo's clip. A new tap kills the run that is still going.
  const wandDown = (e, units) => {
    const { doc, photos, scale, editStep: step, page: at } = latest.current;
    const id = step?.op === 'photo' ? step.id : hitTest(doc, units, { photos: hash => photos[hash], tolerance: TAP_PX / scale, page: at, ops: ['photo'] });
    const photo = id && findStep(doc, id).step;

    if(!photo) return;

    setSelected(id);

    const corners = outlineOf(doc, id, { photos: hash => photos[hash], page: at });
    const uv = corners && photoPoint(corners, units);

    if(!uv) return;

    const run = wand.current?.id === id ? wand.current : { id, photo: photo.orig ?? photo.photo, points: [] };

    run.points = [...run.points, [uv[0], uv[1], e?.altKey || wandMode === 'sub' ? 0 : 1]];
    run.pick = undefined;
    run.adjusted = false;
    run.at = units;
    wand.current = run;
    runWand(run);
  };
  // send the run's taps (and the candidate chosen with bigger / smaller) to the server
  const runWand = run => {
    const { id } = run;

    run.controller?.abort();
    run.controller = new AbortController();
    setWandPick(null);
    setBusyAt({ x: run.at[0], y: run.at[1] });

    const { signal } = run.controller;

    const apply = event => {
      const { doc: now, photos: info, page: here } = latest.current;
      const corners = findStep(now, id) && outlineOf(now, id, { photos: hash => info[hash], page: here });
      const polygon = corners && resultPolygon(event, corners);

      if(!polygon) return;

      // the server starts with the largest candidate; one that is most of the photo is the background, so go one smaller
      const cover = event.candidates?.[event.picked]?.coverage;

      if(run.pick === undefined && !run.adjusted && cover > WAND_MAX_COVER && event.picked > 0) {
        run.adjusted = true;
        run.pick = event.picked - 1;

        return runWand(run);
      }

      // a sharper cut from an earlier tap replaced the image: go back to the original
      if(findStep(now, id).step.photo !== run.photo) dispatch({ type: 'replacePhoto', id, hash: run.photo, wand: true });

      const taken = new Set(allIds(now));

      run.picked = event.picked;
      setWandPick(Number.isInteger(event.picked) ? { index: event.picked, count: event.candidates?.length ?? 1 } : null);
      dispatch({ type: 'clipPolygon', id, polygon, shape: unique(taken), style: { color: latest.current.color, width: 1 }, wand: true });
      setAnnounce(tr('editor.announce.wand'));
    };

    // the final pass: the soft-edged cut becomes the photo's image, the quick outline is not needed
    const loading = [];
    const derived = event => {
      if(!findStep(latest.current.doc, id)) return;

      loading.push(
        arrived(event.record, true).then(info => {
          if(signal.aborted || !findStep(latest.current.doc, id)) return;

          setPhotos(old => ({ ...old, [event.record.hash]: info }));
          dispatch({ type: 'replacePhoto', id, hash: event.record.hash, wand: true });
          dispatch({ type: 'unclip', id, wand: true });
          fitBox(id, event.record, info, { wand: true });
          fadeIn(id);
        }),
      );
    };

    fetch('/api/segment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photo: run.photo, points: run.points, pick: run.pick }), signal })
      .then(res => (res.ok ? readLines(res.body, event => (event.event === 'progress' ? setBusyAt(b => b && { ...b, percent: event.percent * SERVER_SHARE }) : event.event === 'result' && !event.ok ? setAnnounce(tr('editor.announce.wandFailed')) : event.event === 'result' && event.phase === 'preview' && event.ok ? (setBusyAt(b => b && { ...b, label: tr('editor.busy.refining') }), apply(event)) : event.event === 'derived' ? derived(event) : apply(event))) : setAnnounce(tr('editor.announce.wandFailed'))))
      .then(() => Promise.all(loading))
      .catch(() => {})
      .finally(() => run.controller.signal === signal && setBusyAt(null));
  };
  // a new image for photo step `id`: its visible part becomes the selection box
  const fitBox = (id, record, info, flags) => {
    const crop = findStep(latest.current.doc, id)?.step.crop;

    visibleBox(info, crop).then(box => {
      if(box && findStep(latest.current.doc, id)?.step.photo === record.hash) dispatch({ type: 'setBox', id, box, ...flags });
    });
  };
  // the sharp image replaced the quick one: let it fade in, so the swap is noticed
  const fadeIn = id =>
    requestAnimationFrame(() => {
      const el = document.querySelector(`.wb-editor-stage [data-step="${id}"]`);

      if(el) (el.classList.remove('wb-fresh'), void el.getBoundingClientRect(), el.classList.add('wb-fresh'), el.addEventListener('animationend', () => el.classList.remove('wb-fresh'), { once: true }));
    });
  // the image of a derived upload: the quick one is shown as it is, the final one is loaded
  // first with the ring following the bytes, so the swap is instant
  const arrived = async (record, final) => {
    const info = photoInfo(record);

    if(!final) return info;

    try {
      return { ...info, href: await fetchImage(info.href, f => setBusyAt(b => b && { ...b, percent: 100 * (SERVER_SHARE + (1 - SERVER_SHARE) * f) })) };
    } catch {
      return info;
    }
  };
  // remove the background (E127): the server streams the cut twice, quick then sharp;
  // each is a new image for the same photo step, one undo step in all
  // stop the running removal; what arrived so far stays (it is on the undo stack)
  const cancelJob = () => {
    cutRun.current?.abort();
    cutRun.current = null;
    wand.current?.controller?.abort();
    setCutting(null);
    setBusyAt(null);
    setAnnounce(tr('editor.announce.jobCancelled'));
  };

  // the photo being worked on is gone (undone away): nothing to wait for
  useEffect(() => {
    if(cutting !== null && !findStep(hist.present.doc, cutting)) cancelJob();
  }, [cutting, hist]);

  // the subjects the server found become the photo's clip: one photo, one outline each
  const clipToSubjects = (id, event, info) =>
    // once the editor has drawn the new picture
    setTimeout(() => {
      const { doc: now, page: here } = latest.current;
      const at = findStep(now, id);
      const m = at && matrixOf(now, id, { page: here });
      const polygon = at?.step.photo === event.record.hash && outlinesToStage(event.outlines, info, at.step.crop, m);

      if(polygon) dispatch({ type: 'clipPolygon', id, polygon, shape: unique(new Set(allIds(now))), style: { color: latest.current.color, width: 1 }, cutout: true });
    }, 60);
  const removeBackground = async () => {
    const { editStep: step, readOnly } = latest.current;

    if(readOnly || step?.op !== 'photo') return;

    const id = step.id;

    cutRun.current?.abort();
    cutRun.current = new AbortController();

    const { signal } = cutRun.current;

    setCutting(id);

    const { doc, photos: info, page: here } = latest.current;
    const corners = outlineOf(doc, id, { photos: hash => info[hash], page: here });

    if(corners) setBusyAt({ x: corners.reduce((sum, c) => sum + c[0], 0) / 4, y: corners.reduce((sum, c) => sum + c[1], 0) / 4 });

    const loading = [];

    try {
      const res = await fetch('/api/cutout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photo: step.photo }), signal });

      if(!res.ok) throw new Error('cutout');

      await readLines(res.body, event => {
        if(event.event === 'progress') setBusyAt(b => b && { ...b, percent: event.percent * SERVER_SHARE });
        else if(event.event === 'derived') {
          loading.push(
            arrived(event.record, event.phase !== 'preview').then(info => {
              if(signal.aborted) return;

              setPhotos(old => ({ ...old, [event.record.hash]: info }));
              dispatch({ type: 'replacePhoto', id, hash: event.record.hash, cutout: true });
              fitBox(id, event.record, info, { cutout: true });
              clipToSubjects(id, event, info);

              if(event.phase === 'preview') setBusyAt(b => b && { ...b, label: tr('editor.busy.refining') });
              else fadeIn(id);
            }),
          );
        } else if(event.event === 'error') setAnnounce(tr('editor.announce.cutoutFailed'));
      });
      await Promise.all(loading);
    } catch {
      if(!signal.aborted) setAnnounce(tr('editor.announce.cutoutFailed'));
    } finally {
      if(cutRun.current?.signal === signal) (setCutting(null), setBusyAt(null));
    }
  };
  // bigger / smaller: the next candidate mask of the last taps (part, object, whole)
  const wandStep = delta => {
    const run = wand.current;

    if(!run || !wandPick) return;

    run.pick = Math.max(0, Math.min(wandPick.count - 1, wandPick.index + delta));
    runWand(run);
  };
  // clip tool: with a photo selected, tapping a shape makes it that photo's clip;
  // tapping a photo selects it. Unclip tool: tapping a clipped photo frees it.
  const maskDown = units => {
    // with a photo selected the clip tool draws: a tap acts as before, a closing
    // outline clips, a stroke across the photo cuts it in two (see clipUp)
    if(tool === 'clip' && editStep?.op === 'photo') {
      if(grabClipVertex(units)) return;

      clipStroke.current = { points: [units] };
      setHint('');
      setClipLine([units]);

      return;
    }

    maskTap(units);
  };
  // clip tool, clipped photo: a vertex of the outline is dragged; a tap on an edge adds one (E116)
  const grabClipVertex = units => {
    const { doc, scale, editStep: step } = latest.current;
    const geo = clipPolygonsOf(doc, step.id);

    if(!geo) return false;

    const near = nearestVertex(geo.polys, units, (handlePx * 0.9) / scale);

    if(near) {
      cdrag.current = { id: step.id, polys: geo.polys, poly: near.poly, vertex: near.vertex };

      return true;
    }

    const added = insertOnEdge(geo.polys, units, (handlePx * 0.6) / scale);

    if(!added) return false;

    cdrag.current = { id: step.id, polys: added.polys, poly: added.poly, vertex: added.vertex };
    dispatch({ type: 'setClipPolygons', id: step.id, polygons: added.polys });

    return true;
  };
  // one photo per outline of a clip with several (E122)
  const splitOutlines = () => {
    const { doc, editStep: step } = latest.current;
    const n = outlineCount(doc, step.id);
    const taken = new Set(allIds(doc));
    const ids = Array.from({ length: (n - 1) * 2 }, () => {
      const id = unique(taken);

      taken.add(id);

      return id;
    });

    dispatch({ type: 'splitClip', id: step.id, ids });
  };
  const maskTap = units => {
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
  // after a cut, each piece's selection box hugs the content inside its clip (once, here)
  const fitCutBoxes = (step, ids, pieces) => {
    const info = latest.current.photos[step.photo];

    if(!info?.href) return;

    // the cut is in the document once the editor has drawn it
    loadAlpha(info.href).then(map => setTimeout(() => {
      const now = latest.current.doc;
      const [first, second] = [step.id, ids[2]];

      [first, second].forEach((photo, i) => {
        const m = matrixOf(now, photo, { page });
        const back = m && invert(m);

        if(!back || findStep(now, photo)?.step.photo !== step.photo) return;

        const polys = (Array.isArray(pieces[i][0][0]) ? pieces[i] : [pieces[i]]).map(poly => poly.map(q => applyMatrix(back, q)));
        const box = contentBox(map, info, findStep(now, photo).step.crop, polys);

        if(box) dispatch({ type: 'setBox', id: photo, box });
      });
    }, 60));
  };
  const clipUp = () => {
    const s = clipStroke.current;
    const { doc, photos, scale, color, size, editStep: step } = latest.current;

    clipStroke.current = null;
    setClipLine(null);

    if(!s || step?.op !== 'photo') return;

    // adding or subtracting an outline is judged against the whole photo, not the part still clipped
    const reference = clipMode !== 'replace' && clipPolygonsOf(doc, step.id) ? outlineOf(doc, step.id, { photos: hash => photos[hash], page }) : photoPolygon(doc, step.id, { photos: hash => photos[hash] });
    const opts = { tap: TAP_PX / scale, reach: CUT_REACH_PX / scale, close: (CLOSE_PX * 2) / scale };
    let found = clipFromStroke(s.points, reference, opts);

    // a clip of several outlines (cut-out, wand): the stroke splits the outline it crosses
    const outlines = clipPolygonsOf(doc, step.id);

    if((found.kind === 'none' || found.kind === 'cut') && outlines?.polys.length > 1) {
      const pieces = cutOutlines(outlines.polys, s.points, opts.reach);

      if(pieces) found = { kind: 'cut', pieces };
    }
    const style = { color, width: Math.max(1, size / 3) };
    const taken = new Set(allIds(doc));
    const fresh = () => {
      const id = unique(taken);

      taken.add(id);

      return id;
    };

    if(found.kind === 'tap') return maskTap(s.points[0]);

    if(found.kind === 'closed') dispatch({ type: 'clipOutline', id: step.id, polygon: found.polygon, mode: clipMode, shape: fresh(), style });
    else if(found.kind === 'cut') {
      const ids = [fresh(), fresh(), fresh()];

      dispatch({ type: 'cutPhoto', id: step.id, pieces: found.pieces, ids, style });
      fitCutBoxes(step, ids, found.pieces);
    }
    else {
      setHint(tr('editor.clip.none'));
      setAnnounce(tr('editor.clip.none'));

      return;
    }

    quiet.current = true;
    setTool('select');
    setAnnounce(tr(found.kind === 'cut' ? 'editor.announce.cut' : 'editor.announce.clipped'));
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
    if(tdrag.current) {
      const d = tdrag.current;
      const local = applyMatrix(invert(d.m), [x, y]);
      const right = d.index === 1 || d.index === 2;
      const bottom = d.index === 2 || d.index === 3;
      const w = Math.min(TEXT_LIMITS.width[1], Math.max(TEXT_LIMITS.width[0], right ? local[0] : d.base.w - local[0]));
      // a fixed-height box follows the corner on both axes, an automatic one only in width
      const h = d.base.fixed ? Math.min(20000, Math.max(Math.max(20, d.base.size), bottom ? local[1] : d.base.h - local[1])) : d.base.h;
      const next = layout({ ...d.base, w, h }, measureFor(d.base.bold));
      const shift = [1, 0, 0, 1, right ? 0 : d.base.w - w, d.base.fixed && !bottom ? d.base.h - next.h : 0];

      return dispatch({ type: 'resizeText', id: d.id, patch: { w, lines: next.lines, h: next.h }, ...(shift[4] || shift[5] ? { m: multiply(d.m, shift) } : {}) });
    }

    if(hdrag.current) {
      const d = hdrag.current;

      return commitMatrix(d.id, d.kind === 'rotate' ? rotateDrag(d.base, d.centre, d.down, [x, y]) : scaleDrag(d.base, d.pivot, d.down, [x, y]));
    }

    if(cdrag.current) {
      const d = cdrag.current;

      d.polys = d.polys.map((poly, i) => (i === d.poly ? poly.map((q, j) => (j === d.vertex ? [x, y] : q)) : poly));

      return dispatch({ type: 'setClipPolygons', id: d.id, polygons: d.polys });
    }

    if(vdrag.current) {
      const d = vdrag.current;

      return dispatch({ type: 'setVertices', id: d.id, vertices: dragVertices(d.base, d.hit, d.m, d.from, [x, y], { alt: e.altKey }) });
    }

    if(shaping.current) return setDraft(pull(latest.current.shape, [x, y], { alt: e.altKey }));

    if(clipStroke.current) {
      clipStroke.current.points.push([x, y]);

      return setClipLine(clipStroke.current.points.slice());
    }

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
    if(tdrag.current) {
      tdrag.current = null;
      setHist(history.seal);

      return;
    }

    if(hdrag.current) {
      hdrag.current = null;
      setHist(history.seal);

      return;
    }

    if(cdrag.current) {
      cdrag.current = null;
      setHist(history.seal);

      return;
    }

    if(vdrag.current) {
      setHist(history.seal);
      vdrag.current = null;

      return;
    }

    if(shaping.current) {
      shaping.current = false;

      return;
    }

    if(clipStroke.current) return clipUp();

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

  // the buttons of the context bar: larger, smaller, turn left or right about the
  // centre of the selection, one undo step each (E113)
  const nudgeSelection = kind => {
    const c = latest.current;
    const id = c.selected;

    if(!id || c.previewing) return;

    const sim = nudge(kind, centreOf(c.doc, id, { photos: hash => c.photos[hash], page: c.page }) ?? [500, 500]);

    if(!sim) return;

    transformSelection(id, sim);
    setHist(history.seal);
  };

  // save the page on show as a picture (E125): the same drawing the viewer makes
  const exportAs = async format => {
    if(exporting) return;

    setExporting(true);
    setExportFailed(false);

    try {
      await exportImage(realDoc, { photos: hash => photos[hash] ?? null, page: mode === 'slides' ? slideNow : page }, { format, background: typeof doc.bg === 'string' ? doc.bg : '#ffffff', title: doc.title });
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  };

  // duplicate the selected photo: the copy lands one cascade step down and right,
  // selected, with a clip of its own (E126)
  const duplicateSelection = () => {
    const c = latest.current;
    const id = c.selected;

    if(!id || c.previewing || c.editStep?.op !== 'photo' || c.doc.pages[c.page].steps.length > LIMITS.steps - 2) return;

    const taken = new Set(allIds(c.doc));
    const copy = unique(taken);

    taken.add(copy);
    dispatch({ type: 'duplicatePhoto', id, ids: [copy, unique(taken)] });

    setSelected(copy);
    setHist(history.seal);
  };

  // --- dropper (E133): the next tap on the stage gives its colour to `apply` ---
  const [dropping, setDropping] = useState(false);
  const dropper = useRef(null); // { apply, canvas }

  const startDropper = async apply => {
    const { doc: d, photos: p, page: at, readOnly } = latest.current;

    if(readOnly) return;

    dropper.current = { apply, canvas: null };
    setDropping(true);
    setAnnounce(tr('editor.announce.dropper'));

    const mine = dropper.current;

    try {
      mine.canvas = await sceneCanvas(d, { photos: hash => p[hash] ?? null, page: at }, 1024, /^#[0-9a-f]{6}$/i.test(d.bg ?? '') ? d.bg : '#ffffff');
    } catch {
      if(dropper.current === mine) stopDropper();
    }
  };

  const stopDropper = () => {
    dropper.current = null;
    setDropping(false);
  };

  useEffect(() => {
    if(!dropping) return;

    const down = e => {
      const mine = dropper.current;
      const svg = document.querySelector('.wb-editor-stage svg.wb-editor-overlay');

      if(!mine || !svg?.contains(e.target)) return stopDropper();

      e.preventDefault();
      e.stopPropagation();

      if(!mine.canvas) return;

      const r = svg.getBoundingClientRect();
      const size = mine.canvas.width;
      const x = Math.max(1, Math.min(size - 2, Math.round(((e.clientX - r.left) / r.width) * size)));
      const y = Math.max(1, Math.min(size - 2, Math.round(((e.clientY - r.top) / r.height) * size)));
      const px = mine.canvas.getContext('2d').getImageData(x - 1, y - 1, 3, 3).data;
      const mean = c => Math.round([0, 1, 2, 3, 4, 5, 6, 7, 8].reduce((sum, i) => sum + px[i * 4 + c], 0) / 9);

      mine.apply('#' + [0, 1, 2].map(c => mean(c).toString(16).padStart(2, '0')).join(''));
      stopDropper();
    };
    const key = e => e.key === 'Escape' && (e.stopPropagation(), stopDropper());

    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key, true);

    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key, true);
    };
  }, [dropping]);

  // --- clipboard (E131) ---
  const pasted = useRef(0); // pastes since the last copy: each lands a little further on

  // copy (or cut) the selected step: its picture, its words and itself
  const copySelected = async cut => {
    const c = latest.current;
    const id = c.selected;
    const payload = id && !c.previewing ? copyPayload(c.doc, id) : null;

    if(!payload) return false;

    pasted.current = 0;

    try {
      const png = await stepImage(c.doc, id, { photos: hash => c.photos[hash], page: c.page }).catch(() => null);

      await writeClipboard({ png, svg: svgFor(payload), html: htmlFor(payload), text: plainFor(payload) });
    } catch {
      setAnnounce(tr('editor.announce.clipboardDenied'));

      return false;
    }

    setAnnounce(tr(cut ? 'editor.announce.cutDone' : 'editor.announce.copied'));

    if(cut && !c.readOnly) remove(id);

    return true;
  };

  // paste what `data` ({ html, text, files }) holds: a step of ours, an image, or words
  const pasteData = async data => {
    const c = latest.current;
    const what = classify(data);

    if(c.readOnly || c.previewing || c.slideInfo) return; // a paste lands at the end of a page: not on a slide
    if(!what) return setAnnounce(tr('editor.announce.pasteNothing'));

    const n = ++pasted.current;

    if(what.kind === 'steps') {
      const items = what.payload.items.filter(item => item.step?.op !== 'photo' || c.photos[item.step.photo]);
      const taken = new Set(allIds(c.doc));

      if(!items.length) return setAnnounce(tr('editor.announce.pasteNothing'));

      const fresh = [];

      for(let i = 0; i < items.length * 2; i++) {
        const id = unique(taken);

        taken.add(id);
        fresh.push(id);
      }

      dispatch({ type: 'pasteSteps', page: c.pageId, payload: { ...what.payload, items }, shift: 50 * n, ids: fresh });
      setSelected(fresh[0]);
      setHist(history.seal);

      return setAnnounce(tr('editor.announce.pasted'));
    }

    if(what.kind === 'image' || what.kind === 'svg') {
      setAnnounce(tr('editor.announce.pasting'));

      try {
        // an SVG becomes a raster first: the server takes pictures, not markup
        const asSvg = what.kind === 'svg' || what.file.type === 'image/svg+xml';
        const file = asSvg ? new File([await rasteriseSvg(what.kind === 'svg' ? what.source : what.file)], 'pasted.png', { type: 'image/png' }) : new File([what.file], what.file.name || 'pasted.png', { type: what.file.type });
        const record = await sendFile(file, { onProgress: () => {} }).done;

        addUpload(uploadPayload(record));
        setAnnounce(tr('editor.announce.pasted'));
      } catch {
        setAnnounce(tr('editor.announce.pasteFailed'));
      }

      return;
    }

    const id = unique(new Set(allIds(c.doc)));
    const base = { text: what.text, font: 'sans', size: 48, w: 600, bold: false, padding: 0 };
    const { lines, h } = layout(base, measureFor(false));
    const step = 30 * (n % 8);

    dispatch({ type: 'addText', id, page: c.pageId, text: what.text, lines, m: [1, 0, 0, 1, 150 + step, 200 + step], w: base.w, h, font: base.font, size: base.size, color: c.color, align: 'start' });
    setSelected(id);
    setHist(history.seal);
    setAnnounce(tr('editor.announce.pasted'));
  };

  // the paste button: ask the clipboard (the browser may ask the user once)
  const pasteClipboard = async () => {
    try {
      await pasteData(await readClipboard());
    } catch {
      setAnnounce(tr('editor.announce.clipboardDenied'));
    }
  };

  // Ctrl+C, X and V come as events; they are ours unless a field has the focus or text is selected
  useEffect(() => {
    const mine = e => !inField(e.target) && !window.getSelection?.()?.toString();
    const copy = e => {
      if(!mine(e) || !latest.current.selected) return;

      e.preventDefault();
      copySelected(e.type === 'cut');
    };
    const paste = e => {
      if(inField(e.target)) return;

      e.preventDefault();
      pasteData(fromEvent(e.clipboardData));
    };

    document.addEventListener('copy', copy);
    document.addEventListener('cut', copy);
    document.addEventListener('paste', paste);

    return () => {
      document.removeEventListener('copy', copy);
      document.removeEventListener('cut', copy);
      document.removeEventListener('paste', paste);
    };
  }, []);

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
    if(key === 'page') return html`<button type="button" class="wb-editor-button wb-editor-add-page" onClick=${addPage} title=${t('editor.page.add')} aria-label=${t('editor.page.add')}><span class="wb-editor-tool-icon" aria-hidden="true"></span></button>`;

    if(key === 'undo' || key === 'redo') {
      const can = key === 'undo' ? history.canUndo(hist) : history.canRedo(hist);

      return html`<button type="button" class=${'wb-editor-button wb-editor-' + key} disabled=${!can} onClick=${key === 'undo' ? undo : redo} title=${t('editor.' + key)} aria-label=${t('editor.' + key)}><span class="wb-editor-tool-icon" aria-hidden="true"></span></button>`;
    }

    if(key === 'delete') return html`<button type="button" class="wb-editor-button wb-editor-delete" disabled=${nodeId === null || busy || readOnly} onClick=${removeNode} title=${t('editor.delete')} aria-label=${t('editor.delete')}><span class="wb-editor-tool-icon" aria-hidden="true"></span></button>`;

    if(key === 'save') return html`<button type="button" class="wb-editor-button wb-editor-save" disabled=${busy || !dirty} onClick=${save} title=${t('editor.save')} aria-label=${busy ? t('editor.saving') : t('editor.save')}><span class="wb-editor-tool-icon" aria-hidden="true"></span></button>`;

    return inert(key, t('editor.short.' + key));
  };

  // every tool can be picked; the key is in the label and in aria-keyshortcuts
  const toolButton = ({ id, key }) => html`
    <button type="button" class=${'wb-editor-button wb-editor-tool wb-editor-tool-' + id} disabled=${!!slideInfo && ['clip', 'unclip', 'wand'].includes(id)} aria-pressed=${tool === id ? 'true' : 'false'} aria-keyshortcuts=${key} onClick=${() => setTool(id)} title=${`${t('editor.tool.' + id)} (${key})`} aria-label=${t('editor.tool.' + id)}>
      <span class="wb-editor-tool-icon" aria-hidden="true"></span>
      <span class="wb-editor-tool-key" aria-hidden="true">${key}</span>
    </button>
  `;

  const empty = !slideInfo && doc.pages[page].steps.length === 0 && !live;
  const outline = selectedStep && outlineOf(doc, selectedStep.id, { photos: hash => photos[hash], page, upTo: scrubbed ? shown : undefined, clipped: true });
  const title = doc.title ?? '';
  const strip = auto || slideInfo ? [] : photoSteps(doc, page);
  const parsedShape = editStep?.op === 'shape' && tool === 'select' ? verticesOf(editStep) : null;
  const clipGeo = tool === 'clip' && !previewing && editStep?.op === 'photo' ? clipPolygonsOf(doc, editStep.id) : null; // the clip outlines to ghost and edit
  const vertexGeo = parsedShape && matrixOf(doc, editStep.id, { page }) ? geometry(parsedShape, matrixOf(doc, editStep.id, { page })) : null;
  const vertexInfo = vertexGeo && vsel !== null && vertexGeo[vsel] ? { index: vsel, broken: vertexGeo[vsel].broken, canDelete: !!removeVertex(parsedShape.vertices, vsel, editStep.closed) } : null;

  // the palette (E54): shown while the pen or a stroke / shape is selected
  const paletteTargets = tool === 'pen' || tool === 'shape' ? ['pen'] : editStep?.op === 'stroke' ? ['stroke'] : editStep?.op === 'shape' ? ['fill', 'outline'] : null;
  const paletteTarget = paletteTargets && (paletteTargets.includes(aim) ? aim : paletteTargets[0]);
  const reference = editStep?.op === 'photo' ? editStep : strip[strip.length - 1];
  const pal = (paletteTargets || propsOpen || editStep?.op === 'text') && swatches(scenePal ?? photos[reference?.photo]?.palette ?? [], themeColours());
  const usedNow = pal ? usedColours(doc).filter(hex => !pal.all.includes(hex)) : [];
  const paletteCurrent = paletteTarget === 'pen' ? color : paletteTarget === 'stroke' ? editStep.color : paletteTarget === 'fill' ? editStep.fill : paletteTarget === 'outline' ? editStep.stroke : null;
  const pick = hex => {
    if(paletteTarget === 'pen') setColor(hex);
    else dispatch({ type: 'setColor', id: editStep.id, color: hex, ...(paletteTarget === 'fill' ? { field: 'fill' } : paletteTarget === 'outline' ? { field: 'stroke' } : {}) });
  };

  // the colour the dropper key sets: the palette's target, else the colour of a selected text box
  latest.current.startDropper = startDropper;
  latest.current.dropFor = paletteTarget ? pick : editStep?.op === 'text' ? hex => dispatch({ type: 'setColor', id: editStep.id, field: 'color', color: hex }) : null;

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
    <section id="wb-editor" class=${'wb-editor' + (dropping ? ' wb-editor-dropping' : '')} data-tab=${panelTab} tabindex="-1" aria-label=${t('editor.label')}>
      <div class="wb-sr-only" role="status" aria-live="polite" aria-atomic="true">${announce}</div>
      <p id="wb-editor-keys-hint" class="wb-sr-only">${t('editor.keys.hint')}</p>
      <div class="wb-editor-head">
        <label class="wb-editor-title" inert=${readOnly}>
          <span class="wb-sr-only">${t('editor.title.label')}</span>
          <input type="text" maxlength=${LIMITS.title} autocomplete="off" value=${title} placeholder=${t('editor.title.placeholder')} onInput=${e => dispatch({ type: 'setTitle', title: e.target.value })} />
        </label>
        <span class="wb-editor-head-fields" inert=${readOnly}><${Properties} t=${t} kind=${kind} bg=${doc.bg} pal=${pal} used=${usedNow} dropper=${startDropper} onOpen=${setPropsOpen} dispatch=${dispatch} /></span>
        <${Popover} label=${t('editor.export')} class="wb-editor-export" align="right">
          <button type="button" class="wb-editor-chip" disabled=${exporting} onClick=${() => exportAs('png')}>${t('editor.export.png')}</button>
          <button type="button" class="wb-editor-chip" disabled=${exporting} onClick=${() => exportAs('jpg')}>${t('editor.export.jpg')}</button>
          ${exporting && html`<p role="status">${t('editor.export.busy')}</p>`}
          ${exportFailed && html`<p role="alert">${t('editor.export.error')}</p>`}
        <//>
        <${Popover} label=${t('editor.keys')} class="wb-editor-keys" align="right">
          <dl class="wb-editor-keylist">${KEYS.map(k => html`<dt><kbd>${k}</kbd></dt><dd>${t('editor.keys.' + k)}</dd>`)}</dl>
        <//>
        <button type="button" class="wb-editor-close" onClick=${close}>${t('editor.close')}</button>
      </div>
      <div class="wb-editor-banners">
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
        <button type="button" ref=${focusIt} class="wb-editor-chip" disabled=${busy} onClick=${keepMine}>${t('editor.conflict.mine')}</button>
        <button type="button" class="wb-editor-chip" disabled=${busy} onClick=${takeTheirs}>${t('editor.conflict.theirs')}</button>
        <button type="button" class="wb-editor-chip" onClick=${() => (setConflict(null), setSaveError(null))}>${t('editor.conflict.cancel')}</button>
      </div>`}
      ${saveError && !conflict && !(readOnly && saveError.code === 'locked') &&
      html`<p class="wb-editor-banner wb-editor-banner-error" role="alert">
        <span>${t(errorKey(saveError.code), { max: '1 MB' })}</span>
        <button type="button" class="wb-editor-chip" disabled=${busy} onClick=${save}>${t('editor.save.retry')}</button>
        <button type="button" class="wb-editor-chip" onClick=${() => setSaveError(null)}>${t('editor.save.dismiss')}</button>
      </p>`}
      ${savedId !== null && !dirty && !saveError && html`<p class="wb-editor-banner" role="status"><span>${t('editor.saved')} ${t('editor.saved.kept', { count: usedKey.length })}</span> <a href=${`/${lang}/node/${savedId}`}>${t('editor.saved.view', { id: savedId })}</a></p>`}
      ${wallNotice && html`<p class="wb-editor-banner wb-editor-banner-error" role="alert"><span>${t(wallNotice.key, wallNotice.params)}</span> <button type="button" class="wb-editor-chip" onClick=${() => setWallNotice(null)}>${t('editor.save.dismiss')}</button></p>`}
      </div>
      <div class="wb-editor-tabs" role="tablist" aria-label=${t('editor.panel')}>${['select', 'photos', 'sequence'].map(id => html`<button type="button" role="tab" class="wb-editor-chip" aria-selected=${panelTab === id ? 'true' : 'false'} onClick=${() => setPanelTab(id)}>${t('editor.tab.' + id)}</button>`)}</div>
      <div class="wb-editor-frame" inert=${readOnly}>
      <div class="wb-editor-work">
      <div class="wb-editor-body">
        <div class="wb-editor-tools" role="toolbar" aria-label=${t('editor.tools')}>${TOOLS.map(toolButton)}</div>
        <${Stage}
          label=${title || t('editor.stage')}
          tabindex="0"
          aria-describedby="wb-editor-keys-hint"
          class=${'wb-editor-cursor-' + tool + (over ? ' wb-editor-stage-over' : '')}
          content=${renderNode(realDoc, { photos: hash => photos[hash] ?? null, page: mode === 'slides' ? slideNow : page, upTo: auto ? undefined : playing ? pos : previewing ? shown : undefined })}
          overlay=${({ scale }) => html`${live && html`<path d=${live} fill=${color} />`}${tool === 'shape' && cursor && html`<${KeyCursor} at=${cursor} scale=${scale} />`}${clipLine && html`<${ClipLine} points=${clipLine} />`}${busyAt && html`<${Busy} at=${busyAt} scale=${scale} />`}${tool === 'clip' && clipGeo && html`<${ClipGhost} step=${editStep} m=${matrixOf(doc, editStep.id, { page })} info=${photos[editStep.photo]} geo=${clipGeo} lit=${clipLine ? (crossedOutline(clipGeo.polys, clipLine, CUT_REACH_PX / scale)?.i ?? -1) : -1} scale=${scale} px=${handlePx} />`}${tool === 'select' && !previewing && editStep?.op === 'photo' && editStep.clip !== undefined && html`<${ClippedAway} step=${editStep} m=${matrixOf(doc, editStep.id, { page })} info=${photos[editStep.photo]} />`}${tool === 'clip' && candidate && html`<${Candidate} outline=${outlineOf(doc, candidate, { photos: hash => photos[hash], page, clipped: true })} />`}${vertexGeo && html`<${VertexEdit} geo=${vertexGeo} sel=${vsel} scale=${scale} />`}${shape.vertices.length > 0 && html`<${ShapeDraft} draft=${shape} color=${color} width=${Math.max(1, size / 3)} scale=${scale} />`}${outline && html`<${Selection} outline=${outline} scale=${scale} px=${handlePx} grips=${tool === 'select' && !previewing} />`}`}
          loupe=${coarse && tool !== 'select' && tool !== 'wand'}
          interactive=${!auto && (tool === 'select' || ((tool === 'pen' || tool === 'shape' || tool === 'clip' || tool === 'unclip' || tool === 'wand' || tool === 'text') && !previewing))}
          onPointer=${{ down, move, up, cancel: up, wheel, claim: claimCorner }}
          onSize=${({ width }) => setScale(width > 0 ? width / 1000 : 1)}
          onDragEnter=${e => accepts(e) && (e.preventDefault(), setOver(true))}
          onDragOver=${e => accepts(e) && (e.preventDefault(), (e.dataTransfer.dropEffect = 'copy'))}
          onDragLeave=${() => setOver(false)}
          onDrop=${drop}
        >
          ${empty && !typing && html`<span class="wb-editor-stage-hint">${t('editor.stage.hint')}</span>`}
          ${typing && findStep(doc, typing)?.step.op === 'text' && html`<${TextEdit} step=${findStep(doc, typing).step} m=${matrixOf(doc, typing, { page }) ?? findStep(doc, typing).step.m} scale=${scale} label=${t('editor.text.edit')} onText=${value => changeText({ text: value }, 'text')} onDone=${finishText} onGrip=${gripFromField} />`}
        <//>
        <div class="wb-editor-actions" role="toolbar" aria-label=${t('editor.actions')}>${ACTIONS.map(action)}</div>
      </div>
      <div class="wb-editor-side">
      <div class="wb-editor-sec" data-sec="select">
      ${(tool === 'clip' || tool === 'unclip' || tool === 'wand' || tool === 'text') && html`<p class="wb-editor-context" role="status">${tool === 'clip' && hint ? hint : t('editor.context.' + tool)}</p>`}
      ${tool === 'clip' && clipGeo && html`<div class="wb-editor-context" role="group" aria-label=${t('editor.clip.mode')}>${['replace', 'add', 'subtract'].map(mode => html`<button type="button" class="wb-editor-chip" aria-pressed=${clipMode === mode ? 'true' : 'false'} onClick=${() => setClipMode(mode)}>${t('editor.clip.' + mode)}</button>`)}${outlineCount(doc, editStep.id) > 1 && html` <button type="button" class="wb-editor-chip" onClick=${splitOutlines}>${t('editor.clip.split')}</button>`}</div>`}
      ${tool === 'wand' && html`<div class="wb-editor-context">${busyAt && html`<button type="button" class="wb-editor-chip" onClick=${cancelJob}>${t('editor.job.cancel')}</button> `}<button type="button" class="wb-editor-chip" aria-pressed=${wandMode === 'add' ? 'true' : 'false'} onClick=${() => setWandMode('add')}>${t('editor.wand.add')}</button> <button type="button" class="wb-editor-chip" aria-pressed=${wandMode === 'sub' ? 'true' : 'false'} onClick=${() => setWandMode('sub')}>${t('editor.wand.subtract')}</button>${wandPick && wandPick.count > 1 && html` <button type="button" class="wb-editor-chip" disabled=${wandPick.index <= 0} onClick=${() => wandStep(-1)}>${t('editor.nudge.smaller')}</button> <button type="button" class="wb-editor-chip" disabled=${wandPick.index >= wandPick.count - 1} onClick=${() => wandStep(1)}>${t('editor.nudge.larger')}</button>`}</div>`}
      ${tool === 'shape'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
            <button type="button" class="wb-editor-chip" disabled=${shape.vertices.length < 2} onClick=${() => commitShape(shape)}>${t('editor.shape.finish')}</button>
            <button type="button" class="wb-editor-chip" disabled=${!shape.vertices.length} onClick=${() => setDraft(emptyDraft())}>${t('editor.shape.cancel')}</button>
            <span class="wb-editor-hint">${t('editor.shape.hint')}</span>
          </div>`
        : tool === 'pen'
        ? html`<div class="wb-editor-pen-options">
            <label>${t('editor.pen.size')} <input type="range" min="2" max="40" value=${size} onInput=${e => setSize(Number(e.target.value))} /></label>
          </div>`
        : html`<${ContextBar} t=${t} kind=${kind} step=${editStep} vertex=${vertexInfo} onVertex=${editVertex} clipped=${editStep?.clip !== undefined} photo=${editStep && photos[editStep.photo]} onNudge=${nudgeSelection} onDuplicate=${duplicateSelection} onCopy=${() => copySelected(false)} onCut=${() => copySelected(true)} onPaste=${pasteClipboard} onDropper=${startDropper} pal=${pal} used=${usedNow} onCutout=${removeBackground} onCancelJob=${cancelJob} cutting=${cutting !== null} onText=${patch => changeText(patch)} onEditText=${() => editStep?.op === 'text' && setTyping(editStep.id)} dispatch=${command => (command.type === 'removeStep' ? remove(command.id) : dispatch(command))} />`}
      ${paletteTargets && html`<${Palette} t=${t} pal=${pal} used=${usedNow} dropper=${startDropper} target=${paletteTarget} targets=${paletteTargets} onTarget=${setAim} current=${paletteCurrent} onPick=${pick} />`}
      </div>
      <div class="wb-editor-sec" data-sec="photos">
        <${Filmstrip} t=${t} steps=${strip} photos=${photos} selected=${editStep?.id ?? null} onSelect=${setSelected} onMove=${(id, to) => dispatch({ type: 'movePhoto', id, to })} onRole=${(id, role) => dispatch({ type: 'setRole', id, role })} onRemove=${remove} />
      </div>
      <div class="wb-editor-sec" data-sec="sequence">
      <${ModeSwitch} t=${t} mode=${mode} onMode=${setMode} layout=${doc.layout} onLayout=${changes => dispatch({ type: 'setLayout', changes })} />
      ${auto
        ? html`<p class="wb-editor-context" role="status">${t('editor.mode.auto')}</p>`
        : html`<${Scrubber} t=${t} count=${count} k=${shown} playing=${playing} onScrub=${scrub} onPlay=${togglePlay} />
            ${previewing && !playing && html`<p class="wb-editor-context" role="status">${t('editor.scrub.preview')}</p>`}`}
      ${mode === 'slides'
        ? html`<${SlideStrip} t=${t} doc=${realDoc} photos=${photos} count=${slides} current=${Math.min(slide, Math.max(0, slides - 1))} onSelect=${setSlide} />`
        : mode === 'free' && html`<${PageStrip} t=${t} doc=${doc} photos=${photos} current=${page} onSelect=${switchPage} onAdd=${addPage} onMove=${(id, to) => dispatch({ type: 'movePage', id, to })} onRemove=${removePage} />`}
      </div>
      </div>
      </div>
      </div>
    </section>
  `;
};
