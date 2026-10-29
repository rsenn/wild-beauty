// The node document (EDITOR.md S3.1): constants, ids and the empty node.
// Shared by the browser and the server, so no DOM and no Bun APIs.
import { pathFromVertices, verticesFromPath } from './shapes.js';
import { acuteCorner, defaultWall, isWall } from './walls.js';
import { textureHashes, validateScene } from './scene.js';
import { EDGE_STYLES } from './edge.js';
import { DEFAULT_FONT, FONT_IDS, LIMITS as TEXT, clampSize, clampWidth } from './text.js';

export const VERSION = 1;

export const MODES = ['free', 'slides', 'grid'];

// limits enforced by validate (client and server)
export const LIMITS = {
  docBytes: 1 << 20,
  pages: 50,
  steps: 500,
  points: 2000,
  pathChars: 20000,
  photos: 40,
  title: 200,
  textChars: 2000,
  textBoxes: 100,
  gradientStops: 5,
  number: 1e6,
};

const ID_CHARS = 8;

// 8 base-36 characters; unique inside a node is the caller's duty (see `unique`)
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_CHARS));

  return Array.from(bytes, b => (b % 36).toString(36)).join('');
}

// a fresh id that is not in `taken` (a Set or an array)
export function unique(taken) {
  const has = taken instanceof Set ? id => taken.has(id) : id => taken.includes(id);
  let id;

  do id = newId();
  while(has(id));

  return id;
}

export const emptyNode = () => ({ v: VERSION, style: {}, mode: 'free', pages: [{ id: newId(), steps: [] }] });

export const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];
// what a node is for (a hint for views, EDITOR.md S2.9); lives next to the document, not in it
export const KINDS = ['node', 'list', 'album', 'gallery', 'shop'];
// the legacy `fit` of a photo step (before the square crop, EDITOR.md S2.5): only read to migrate
export const FITS = ['extend', 'cover', 'free'];
export const FILLS = ['loose', 'tight'];
export const COLS_MAX = 12; // the most columns of a grid
export const FONTS = FONT_IDS;
export const ALIGNS = ['start', 'center', 'end'];

// --- validate, structure (E4) ---------------------------------------------
// Types and shapes only; limits, numbers and references follow in `limits`.
// validate(doc) -> [{ code, path }]; an empty list means valid. Codes:
//   not_object  bad_version  bad_style  bad_mode  bad_bg  bad_title  bad_scene  bad_layout  bad_pages  bad_page
//   bad_steps   bad_step     unknown_op bad_id    bad_field

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumber = v => typeof v === 'number';
const isString = v => typeof v === 'string';
export const isColour = v => isString(v) && /^(#[0-9a-f]{6}([0-9a-f]{2})?|(rgb|hsl)a?\([0-9a-z.,%\s/-]+\))$/i.test(v);
const isMatrix = v => Array.isArray(v) && v.length === 6 && v.every(isNumber);
const isId = v => isString(v) && /^[0-9a-z]{8}$/.test(v);
const isHash = v => isString(v) && /^[0-9a-f]{64}$/.test(v);
const isFill = v => isColour(v) || (isObject(v) && ['linear', 'radial'].includes(v.type) && Array.isArray(v.stops) && v.stops.every(s => isObject(s) && isColour(s.c) && isNumber(s.at)));
const isPoints = v => Array.isArray(v) && v.every(p => Array.isArray(p) && p.length === 3 && p.every(isNumber));
const oneOf = list => v => list.includes(v);
const opt = check => Object.assign(v => v === undefined || check(v), { optional: true });

// field checks per op; a field not listed is rejected
const STEPS = {
  photo: { id: isId, photo: isHash, m: isMatrix, crop: opt(v => isNumber(v) && v >= 0 && v <= 1), fit: opt(oneOf(FITS)), opacity: isNumber, blend: oneOf(BLENDS), clip: opt(isId), role: opt(oneOf(['picture', 'texture'])), orig: opt(isHash), box: opt(v => Array.isArray(v) && v.length === 4 && v.every(n => isNumber(n) && n >= 0 && n <= 1000) && v[0] < v[2] && v[1] < v[3]), edge: opt(v => isObject(v) && EDGE_STYLES.includes(v.style) && isNumber(v.amount) && v.amount >= 0 && v.amount <= 1 && Number.isInteger(v.seed) && v.seed >= 0 && v.seed <= 1e9) },
  stroke: { id: isId, pts: isPoints, color: isColour, smooth: opt(v => typeof v === 'boolean') },
  shape: { id: isId, path: isString, closed: v => typeof v === 'boolean', fill: opt(isFill), stroke: opt(isFill), strokeWidth: isNumber, wall: opt(isWall) },
  clip: { target: isId, shape: isId },
  unclip: { target: isId },
  blend: { target: isId, mode: oneOf(BLENDS) },
  transform: { target: isId, m: isMatrix, ease: opt(isString) },
  text: { id: isId, text: isString, lines: v => Array.isArray(v) && v.every(isString), m: isMatrix, w: isNumber, h: isNumber, font: oneOf(FONTS), size: isNumber, color: isColour, align: oneOf(ALIGNS), padding: isNumber, radius: isNumber, bg: opt(isFill), bold: opt(v => typeof v === 'boolean'), outline: opt(v => isObject(v) && isColour(v.color) && isNumber(v.width) && v.width >= 0 && v.width <= TEXT.outline[1]) },
};

function validateStep(step, path, errors) {
  if(!isObject(step)) return errors.push({ code: 'bad_step', path });

  const fields = STEPS[step.op];

  if(!fields) return errors.push({ code: 'unknown_op', path: `${path}.op` });

  for(const [key, check] of Object.entries(fields)) {
    if(check(step[key])) continue;

    errors.push({ code: key === 'id' || key === 'target' ? 'bad_id' : 'bad_field', path: `${path}.${key}` });
  }

  for(const key of Object.keys(step)) if(key !== 'op' && !(key in fields)) errors.push({ code: 'bad_field', path: `${path}.${key}` });
}

function validateStructure(doc) {
  const errors = [];

  if(!isObject(doc)) return [{ code: 'not_object', path: '' }];

  if(doc.v !== VERSION) errors.push({ code: 'bad_version', path: 'v' });
  if(!isObject(doc.style) || (doc.style.theme !== undefined && !isString(doc.style.theme)) || (doc.style.vars !== undefined && !isObject(doc.style.vars))) errors.push({ code: 'bad_style', path: 'style' });
  if(!MODES.includes(doc.mode)) errors.push({ code: 'bad_mode', path: 'mode' });
  if(doc.bg !== undefined && !isFill(doc.bg)) errors.push({ code: 'bad_bg', path: 'bg' });
  if(doc.layout !== undefined && !(isObject(doc.layout) && (doc.layout.fill === undefined || FILLS.includes(doc.layout.fill)) && (doc.layout.gap === undefined || (isNumber(doc.layout.gap) && doc.layout.gap >= 0 && doc.layout.gap <= 100)) && (doc.layout.cols === undefined || (Number.isInteger(doc.layout.cols) && doc.layout.cols >= 1 && doc.layout.cols <= COLS_MAX)) && Object.keys(doc.layout).every(k => k === 'fill' || k === 'gap' || k === 'cols'))) errors.push({ code: 'bad_layout', path: 'layout' });

  if(doc.title !== undefined && !isString(doc.title)) errors.push({ code: 'bad_title', path: 'title' });
  if(doc.scene !== undefined) errors.push(...validateScene(doc.scene));

  if(!Array.isArray(doc.pages)) errors.push({ code: 'bad_pages', path: 'pages' });
  else
    doc.pages.forEach((page, i) => {
      const path = `pages[${i}]`;

      if(!isObject(page)) return errors.push({ code: 'bad_page', path });
      if(!isId(page.id)) errors.push({ code: 'bad_id', path: `${path}.id` });
      if(page.duration !== undefined && !isNumber(page.duration)) errors.push({ code: 'bad_field', path: `${path}.duration` });
      if(!Array.isArray(page.steps)) return errors.push({ code: 'bad_steps', path: `${path}.steps` });

      page.steps.forEach((step, j) => validateStep(step, `${path}.steps[${j}]`, errors));
    });

  return errors;
}

// --- validate, references and limits (E5) ----------------------------------
// Runs once the structure is sound. Codes: too_large  no_pages
// too_many_pages  title_too_long  too_many_steps  too_many_points  path_too_long
// too_many_photos  too_many_text_boxes  text_too_long  bad_stops
// bad_number  duplicate_id  dangling_ref

// every number in the document: finite and within +-LIMITS.number
function checkNumbers(value, path, errors) {
  if(typeof value === 'number') {
    if(!Number.isFinite(value) || Math.abs(value) > LIMITS.number) errors.push({ code: 'bad_number', path });
  } else if(value && typeof value === 'object') {
    for(const [key, child] of Object.entries(value)) checkNumbers(child, Array.isArray(value) ? `${path}[${key}]` : path ? `${path}.${key}` : key, errors);
  }
}

const stopsOk = fill => !isObject(fill) || (fill.stops.length >= 2 && fill.stops.length <= LIMITS.gradientStops);

function validateLimits(doc) {
  const errors = [];
  const ids = new Set();
  const photos = new Set();
  let texts = 0;

  if(new TextEncoder().encode(JSON.stringify(doc)).length > LIMITS.docBytes) errors.push({ code: 'too_large', path: '' });

  checkNumbers(doc, '', errors);

  if(doc.title !== undefined && doc.title.length > LIMITS.title) errors.push({ code: 'title_too_long', path: 'title' });
  if(doc.bg !== undefined && !stopsOk(doc.bg)) errors.push({ code: 'bad_stops', path: 'bg' });
  if(doc.pages.length === 0) errors.push({ code: 'no_pages', path: 'pages' });
  if(doc.pages.length > LIMITS.pages) errors.push({ code: 'too_many_pages', path: 'pages' });

  doc.pages.forEach((page, i) => {
    const path = `pages[${i}]`;
    const byId = new Map();

    if(ids.has(page.id)) errors.push({ code: 'duplicate_id', path: `${path}.id` });

    ids.add(page.id);

    if(page.steps.length > LIMITS.steps) errors.push({ code: 'too_many_steps', path: `${path}.steps` });

    page.steps.forEach((step, j) => {
      const at = `${path}.steps[${j}]`;

      if(step.id === undefined) return;

      if(ids.has(step.id)) errors.push({ code: 'duplicate_id', path: `${at}.id` });

      ids.add(step.id);
      byId.set(step.id, step);
    });

    // a reference must name a step of the right op on the same page
    const refers = (id, ops, at) => {
      if(!ops.includes(byId.get(id)?.op)) errors.push({ code: 'dangling_ref', path: at });
    };

    page.steps.forEach((step, j) => {
      const at = `${path}.steps[${j}]`;

      switch(step.op) {
        case 'photo':
          photos.add(step.photo);
          if(step.clip !== undefined) refers(step.clip, ['shape'], `${at}.clip`);
          break;
        case 'stroke':
          if(step.pts.length > LIMITS.points) errors.push({ code: 'too_many_points', path: `${at}.pts` });
          break;
        case 'shape':
          if(step.path.length > LIMITS.pathChars) errors.push({ code: 'path_too_long', path: `${at}.path` });
          for(const key of ['fill', 'stroke']) if(step[key] !== undefined && !stopsOk(step[key])) errors.push({ code: 'bad_stops', path: `${at}.${key}` });
          break;
        case 'clip':
          refers(step.target, ['photo'], `${at}.target`);
          refers(step.shape, ['shape'], `${at}.shape`);
          break;
        case 'unclip':
          refers(step.target, ['photo'], `${at}.target`);
          break;
        case 'blend':
        case 'transform':
          refers(step.target, ['photo', 'stroke', 'shape', 'text'], `${at}.target`);
          break;
        case 'text':
          texts++;
          if(typeof step.text !== 'string' || step.text.length > LIMITS.textChars) errors.push({ code: 'text_too_long', path: `${at}.text` });
          if(step.font !== undefined && !FONT_IDS.includes(step.font)) errors.push({ code: 'bad_font', path: `${at}.font` });
          if(step.size !== undefined && !(step.size >= TEXT.size[0] && step.size <= TEXT.size[1])) errors.push({ code: 'bad_size', path: `${at}.size` });
          if(step.lines !== undefined && !(Array.isArray(step.lines) && step.lines.length <= LIMITS.textChars && step.lines.every(line => typeof line === 'string'))) errors.push({ code: 'bad_lines', path: `${at}.lines` });
          if(step.bg !== undefined && !stopsOk(step.bg)) errors.push({ code: 'bad_stops', path: `${at}.bg` });
          break;
      }
    });
  });

  // the textures of a scene are photos of this node that are marked as texture (every use)
  for(const [i, hash] of textureHashes(doc.scene).entries()) {
    const uses = doc.pages.flatMap(page => page.steps.filter(step => step.op === 'photo' && step.photo === hash));

    if(!uses.length || !uses.every(step => step.role === 'texture')) errors.push({ code: 'dangling_ref', path: `scene.style.texture.images[${i}]` });
  }

  if(photos.size > LIMITS.photos) errors.push({ code: 'too_many_photos', path: 'pages' });
  if(texts > LIMITS.textBoxes) errors.push({ code: 'too_many_text_boxes', path: 'pages' });

  return errors;
}

// [{ code, path }]; empty when the document is valid. Structure first: the
// limit and reference checks need a well-formed document.
export function validate(doc) {
  const errors = validateStructure(doc);

  return errors.length ? errors : validateLimits(doc);
}

// --- commands (E6) ---------------------------------------------------------
// Pure: each takes a document and returns a new one, never touching the
// input. Unchanged parts are shared. A command that names an id or index
// that does not exist, or would break the document (removing the last page),
// returns the same document, so callers can compare by identity.

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const findPage = (doc, pageId) => doc.pages.findIndex(page => page.id === pageId);

export function findStep(doc, stepId) {
  for(let p = 0; p < doc.pages.length; p++) {
    const s = doc.pages[p].steps.findIndex(step => step.id === stepId);

    if(s >= 0) return { page: p, index: s, step: doc.pages[p].steps[s] };
  }

  return null;
}

const withPage = (doc, p, page) => ({ ...doc, pages: doc.pages.map((old, i) => (i === p ? page : old)) });
const withSteps = (doc, p, steps) => withPage(doc, p, { ...doc.pages[p], steps });

// `index` defaults to the end, the top of the stack
export function addStep(doc, pageId, step, index = Infinity) {
  const p = findPage(doc, pageId);

  if(p < 0) return doc;

  const steps = doc.pages[p].steps.slice();

  steps.splice(clamp(index, 0, steps.length), 0, step);

  return withSteps(doc, p, steps);
}

// merge `patch` into a step; its `op` and `id` cannot change
export function updateStep(doc, stepId, patch) {
  const at = findStep(doc, stepId);

  if(!at) return doc;

  const { op, id, ...changes } = patch;

  return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? { ...step, ...changes } : step)));
}

// remove a step together with everything that points at it: clip, unclip,
// blend and transform steps aimed at it, and the `clip` of a photo that used
// it as a shape
export function removeStep(doc, stepId) {
  const at = findStep(doc, stepId);

  if(!at) return doc;

  const steps = doc.pages[at.page].steps
    .filter(step => step.id !== stepId && step.target !== stepId && step.shape !== stepId)
    .map(step => (step.clip === stepId ? Object.fromEntries(Object.entries(step).filter(([key]) => key !== 'clip')) : step));

  return withSteps(doc, at.page, steps);
}

// where a step taken out of `steps` at `from` lands when it passes the next
// step with an id in direction `dir` (1: later, drawn above; -1: earlier)
function neighbour(steps, from, dir) {
  let i = dir > 0 ? from : from - 1;

  for(; i >= 0 && i < steps.length; i += dir) if(steps[i].id !== undefined) return dir > 0 ? i + 1 : i;

  return dir > 0 ? steps.length : 0;
}

// to: 'front' (drawn last, on top), 'back' (drawn first), 'up' / 'down' (past
// the next / previous drawn step, the ones with an id), or an index
export function moveStep(doc, stepId, to) {
  const at = findStep(doc, stepId);

  if(!at) return doc;

  const steps = doc.pages[at.page].steps.slice();
  const [step] = steps.splice(at.index, 1);
  const index = to === 'front' ? steps.length : to === 'back' ? 0 : to === 'up' || to === 'down' ? neighbour(steps, at.index, to === 'up' ? 1 : -1) : clamp(Math.trunc(to), 0, steps.length);

  if(!Number.isFinite(index)) return doc;
  if(index === at.index) return doc;

  steps.splice(index, 0, step);

  return withSteps(doc, at.page, steps);
}

// Record a move at the scrubber position `k` (E58): a `transform` step goes
// after the first k steps of the step's page, so playback animates the step to
// `m` at that point. A move right after one of the same step is the same move
// and only changes its matrix.
export function recordMove(doc, stepId, m, k, ease = 'inOut') {
  const at = findStep(doc, stepId);

  if(!at || !['photo', 'stroke', 'shape', 'text'].includes(at.step.op) || !Array.isArray(m) || m.length !== 6 || !m.every(v => Number.isFinite(v) && Math.abs(v) <= LIMITS.number)) return doc;

  const steps = doc.pages[at.page].steps;
  const index = clamp(Math.trunc(k), at.index + 1, steps.length);

  if(!Number.isFinite(index)) return doc;

  const before = steps[index - 1];

  if(before?.op === 'transform' && before.target === stepId) return withSteps(doc, at.page, steps.map((step, i) => (i === index - 1 ? { ...step, m } : step)));
  if(steps.length >= LIMITS.steps) return doc;

  return withSteps(doc, at.page, [...steps.slice(0, index), { op: 'transform', target: stepId, m, ease }, ...steps.slice(index)]);
}

// the photo steps of page `pageIndex` in draw order
export const photoSteps = (doc, pageIndex = 0) => doc.pages[pageIndex].steps.filter(step => step.op === 'photo');

// Move photo `stepId` to place `to` among the photos (0 = drawn first). The
// other steps keep their places: only the photo slots are refilled, so a stroke
// stays above or below the same slot.
export function movePhoto(doc, stepId, to) {
  const at = findStep(doc, stepId);

  if(!at || at.step.op !== 'photo') return doc;

  const steps = doc.pages[at.page].steps;
  const slots = steps.flatMap((step, i) => (step.op === 'photo' ? [i] : []));
  const photos = slots.map(i => steps[i]);
  const from = photos.indexOf(at.step);
  const target = clamp(Math.trunc(to), 0, photos.length - 1);

  if(!Number.isFinite(target) || target === from) return doc;

  photos.splice(target, 0, ...photos.splice(from, 1));

  const next = steps.slice();

  slots.forEach((slot, k) => (next[slot] = photos[k]));

  return withSteps(doc, at.page, next);
}

// a new empty page at `index` (default: the end)
export function addPage(doc, index = Infinity, page = { id: unique(allIds(doc)), steps: [] }) {
  const pages = doc.pages.slice();

  pages.splice(clamp(index, 0, pages.length), 0, page);

  return { ...doc, pages };
}

// every id in the node, pages and steps
export const allIds = doc => doc.pages.flatMap(page => [page.id, ...page.steps.map(step => step.id).filter(Boolean)]);

// the last page cannot be removed
export function removePage(doc, pageId) {
  const p = findPage(doc, pageId);

  return p < 0 || doc.pages.length === 1 ? doc : { ...doc, pages: doc.pages.filter((_, i) => i !== p) };
}

export function movePage(doc, pageId, index) {
  const p = findPage(doc, pageId);

  if(p < 0) return doc;

  const pages = doc.pages.slice();
  const [page] = pages.splice(p, 1);
  const to = clamp(Math.trunc(index), 0, pages.length);

  if(to === p) return doc;

  pages.splice(to, 0, page);

  return { ...doc, pages };
}

export const setMode = (doc, mode) => (MODES.includes(mode) && mode !== doc.mode ? { ...doc, mode } : doc);

// Set the matrix a step is drawn with (a gesture, a nudge). A `transform`
// step that already targets it is updated; else a photo or text box takes it
// in its own `m`;
// else (strokes, shapes) a transform step is added at the end of the page.
// A matrix that is not finite or beyond the document limits changes nothing.
export function setMatrix(doc, stepId, m) {
  const at = findStep(doc, stepId);

  if(!at || !Array.isArray(m) || m.length !== 6 || !m.every(v => Number.isFinite(v) && Math.abs(v) <= LIMITS.number)) return doc;
  if(!['photo', 'stroke', 'shape', 'text'].includes(at.step.op)) return doc;

  const steps = doc.pages[at.page].steps;
  const t = steps.findLastIndex(step => step.op === 'transform' && step.target === stepId); // the final move

  if(t >= 0) return withSteps(doc, at.page, steps.map((step, i) => (i === t ? { ...step, m } : step)));

  if(at.step.op === 'photo' || at.step.op === 'text') return updateStep(doc, stepId, { m });

  return withSteps(doc, at.page, [...steps, { op: 'transform', target: stepId, m }]);
}

// the stage ground: a colour, or null / '' to remove it
export function setBg(doc, bg) {
  if(bg === null || bg === '' || bg === undefined) {
    if(doc.bg === undefined) return doc;

    const { bg: gone, ...rest } = doc;

    return rest;
  }

  return isFill(bg) && bg !== doc.bg ? { ...doc, bg } : doc;
}

export const setTitle = (doc, title) => (title === doc.title ? doc : { ...doc, title: String(title).slice(0, LIMITS.title) });

// --- photo commands (E7) ---------------------------------------------------
// Same rules as the commands above. `info` is { width, height }, the photo as
// displayed (EXIF orientation applied; the upload record's width and height).

const STAGE = 1000;

// A photo's local space is a square of 1000 units, the largest square of the
// picture at the crop position (EDITOR.md S2.5); its matrix places that square
// on the stage. A new photo covers the stage.
const IDENTITY = [1, 0, 0, 1, 0, 0];

// the square window into a photo: { side, x, y } in photo pixels, `crop` (0..1)
// the position along the long edge (a square photo has nothing to move)
export function cropWindow({ width, height }, crop = 0.5) {
  const side = Math.min(width, height);
  const at = clamp(Number.isFinite(crop) ? crop : 0.5, 0, 1);

  return width >= height ? { side, x: (width - side) * at, y: 0 } : { side, x: 0, y: (height - side) * at };
}

// a photo step on top of `pageId`, covering the stage unless a matrix `m` is given, crop centred unless given
export function addPhoto(doc, pageId, hash, info, id = unique(allIds(doc)), role, crop, m) {
  const matrix = Array.isArray(m) && m.length === 6 && m.every(v => Number.isFinite(v) && Math.abs(v) <= LIMITS.number) ? m : IDENTITY;

  return addStep(doc, pageId, { op: 'photo', id, photo: hash, m: matrix, crop: clamp(Number.isFinite(crop) ? crop : 0.5, 0, 1), opacity: 1, blend: 'normal', ...(role === 'texture' && { role }) });
}

// Replace the image of photo step `stepId` by `hash` (a cutout of it). The first
// image stays in `orig`, so it can be restored; `hash === orig` restores it.
export function replacePhoto(doc, stepId, hash) {
  const at = findStep(doc, stepId);

  if(at?.step.op !== 'photo' || typeof hash !== 'string' || hash === at.step.photo) return doc;

  const { orig, box, ...rest } = at.step;
  const next = hash === orig ? rest : { ...rest, photo: hash, orig: orig ?? at.step.photo };

  return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? { ...next, photo: hash } : step)));
}

// A text box (E91): `lines` are the client-wrapped lines of `text` and `h` the
// box height they need; `w` the width. The box's local origin is its top-left
// corner, `m` places it on the stage.
export function addText(doc, pageId, { id = unique(allIds(doc)), text = '', lines, m, w, h, font, size, color, align } = {}) {
  const matrix = Array.isArray(m) && m.length === 6 && m.every(v => Number.isFinite(v) && Math.abs(v) <= LIMITS.number) ? m : IDENTITY;
  const step = {
    op: 'text',
    id,
    text: String(text).slice(0, LIMITS.textChars),
    lines: Array.isArray(lines) ? lines.map(String).slice(0, LIMITS.textChars) : [String(text)],
    m: matrix,
    w: clampWidth(w),
    h: Number.isFinite(h) && h > 0 ? h : 60,
    font: FONT_IDS.includes(font) ? font : DEFAULT_FONT,
    size: clampSize(size),
    color: isColour(color) ? color : '#1a1a1a',
    align: ALIGNS.includes(align) ? align : 'start',
    padding: 0,
    radius: 0,
  };

  return addStep(doc, pageId, step);
}

// The fields of a text box that a patch may change, each checked; unknown
// keys, wrong types and values out of range are dropped.
const TEXT_FIELDS = {
  text: v => (typeof v === 'string' ? v.slice(0, LIMITS.textChars) : undefined),
  lines: v => (Array.isArray(v) && v.every(line => typeof line === 'string') ? v.slice(0, LIMITS.textChars) : undefined),
  w: v => (Number.isFinite(v) ? clampWidth(v) : undefined),
  h: v => (Number.isFinite(v) && v > 0 && v <= 20000 ? v : undefined),
  size: v => (Number.isFinite(v) ? clampSize(v) : undefined),
  font: v => (FONT_IDS.includes(v) ? v : undefined),
  align: v => (ALIGNS.includes(v) ? v : undefined),
  bold: v => (typeof v === 'boolean' ? v : undefined),
  padding: v => (Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : undefined),
  radius: v => (Number.isFinite(v) ? Math.min(1000, Math.max(0, v)) : undefined),
  outline: v => (v === null ? null : isObject(v) && isColour(v.color) && Number.isFinite(v.width) ? { color: v.color, width: Math.min(TEXT.outline[1], Math.max(0, v.width)) } : undefined),
};

export function updateText(doc, stepId, patch) {
  const at = findStep(doc, stepId);

  if(at?.step.op !== 'text' || !isObject(patch)) return doc;

  const next = {};

  for(const [key, check] of Object.entries(TEXT_FIELDS)) if(key in patch) {
    const value = check(patch[key]);

    if(value !== undefined) next[key] = value;
  }

  return Object.keys(next).length ? updateStep(doc, stepId, next) : doc;
}

// The edge decoration of a photo (E123): style, amount 0..1 and the seed that
// makes the same torn edge every time. `plain` removes it.
export function setEdge(doc, stepId, edge) {
  const at = findStep(doc, stepId);

  if(at?.step.op !== 'photo' || !isObject(edge)) return doc;

  if(edge.style === 'plain') {
    const { edge: _drop, ...rest } = at.step;

    return at.step.edge === undefined ? doc : updateStepReplace(doc, at, rest);
  }

  if(!EDGE_STYLES.includes(edge.style)) return doc;

  const amount = Math.min(1, Math.max(0, Number.isFinite(edge.amount) ? edge.amount : 0.5));
  const seed = Number.isInteger(edge.seed) ? Math.min(1e9, Math.max(0, edge.seed)) : 1;

  return updateStep(doc, stepId, { edge: { style: edge.style, amount: Math.round(amount * 100) / 100, seed } });
}

function updateStepReplace(doc, at, step) {
  return withSteps(doc, at.page, doc.pages[at.page].steps.map((s, i) => (i === at.index ? step : s)));
}

// a texture photo is for the 3D scene: not drawn as a picture (EDITOR.md S2.5)
export const isTexture = step => step?.op === 'photo' && step.role === 'texture';

// Mark the photo of step `stepId` as texture or picture (E71). The role belongs
// to the photo, not to a step (node_photos.role), so every step that shows
// the same photo changes with it.
export function setRole(doc, stepId, role) {
  const at = findStep(doc, stepId);

  if(!at || at.step.op !== 'photo' || (role !== 'texture' && role !== 'picture')) return doc;

  const change = step => {
    if(step.op !== 'photo' || step.photo !== at.step.photo || (role === 'texture') === (step.role === 'texture')) return step;

    const { role: _, ...rest } = step;

    return role === 'texture' ? { ...rest, role } : rest;
  };
  const pages = doc.pages.map(page => {
    const steps = page.steps.map(change);

    return steps.some((step, i) => step !== page.steps[i]) ? { ...page, steps } : page;
  });

  return pages.every((page, i) => page === doc.pages[i]) ? doc : { ...doc, pages };
}

const updatePhoto = (doc, stepId, patch) => (findStep(doc, stepId)?.step.op === 'photo' ? updateStep(doc, stepId, patch) : doc);

// move the crop window of a photo along its long edge (0..1)
export const setCrop = (doc, stepId, crop) => (Number.isFinite(crop) ? dropBox(updatePhoto(doc, stepId, { crop: clamp(crop, 0, 1) }), stepId) : doc);

// the box of the visible part of a photo (alpha.js); null forgets it
export function setBox(doc, stepId, box) {
  const at = findStep(doc, stepId);

  if(at?.step.op !== 'photo') return doc;

  const { box: old, ...rest } = at.step;

  return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? (Array.isArray(box) ? { ...rest, box } : rest) : step)));
}

// a moved crop window shows other pixels: the box no longer fits
const dropBox = (doc, stepId) => setBox(doc, stepId, null);

// the grid options of the document: { fill: 'loose'|'tight', gap }
export function setLayout(doc, changes) {
  const layout = { ...doc.layout, ...changes };

  for(const k of Object.keys(layout)) if(layout[k] === undefined || layout[k] === null) delete layout[k]; // back to automatic

  if(layout.fill !== undefined && !FILLS.includes(layout.fill)) return doc;
  if(layout.cols !== undefined && !(Number.isInteger(layout.cols) && layout.cols >= 1 && layout.cols <= COLS_MAX)) return doc;
  if(layout.gap !== undefined && !(Number.isFinite(layout.gap) && layout.gap >= 0 && layout.gap <= 100)) return doc;

  return JSON.stringify(layout) === JSON.stringify(doc.layout ?? {}) ? doc : { ...doc, layout };
}

// Documents from before the square crop: a photo step with `fit` and no `crop`
// had a local space with its long edge scaled to 1000 (extend, cover) and is
// converted so it shows the same picture through the new square window at the
// centred crop. `infoOf(hash)` -> { width, height } | null; unknown photos are
// left alone. Pure; returns the same object when nothing needs converting.
export function migrateDoc(doc, infoOf) {
  if(!Array.isArray(doc?.pages)) return doc;

  let changed = false;
  const pages = doc.pages.map(page => {
    const steps = page.steps.map(step => {
      if(step.op !== 'photo' || step.crop !== undefined) return step;

      const info = infoOf(step.photo);

      if(!info) return step;

      const k = 1000 / Math.max(info.width, info.height);
      const { side, x, y } = cropWindow(info);
      const u = (side * k) / 1000; // new local unit in old local units
      const [a, b, c, d, e, f] = step.m;
      const [ox, oy] = [x * k, y * k];
      const { fit: _, ...rest } = step;

      changed = true;

      return { ...rest, crop: 0.5, m: [a * u, b * u, c * u, d * u, a * ox + c * oy + e, b * ox + d * oy + f] };
    });

    return steps.some((step, i) => step !== page.steps[i]) ? { ...page, steps } : page;
  });

  return changed ? { ...doc, pages } : doc;
}

export const setOpacity = (doc, stepId, opacity) => (Number.isFinite(opacity) ? updatePhoto(doc, stepId, { opacity: clamp(opacity, 0, 1) }) : doc);

export const setBlend = (doc, stepId, blend) => (BLENDS.includes(blend) ? updatePhoto(doc, stepId, { blend }) : doc);

// clip a photo to a shape on the same page; unclip removes the reference
export function setClip(doc, stepId, shapeId) {
  const photo = findStep(doc, stepId);
  const shape = findStep(doc, shapeId);

  return photo && shape && photo.page === shape.page && shape.step.op === 'shape' ? updatePhoto(doc, stepId, { clip: shapeId }) : doc;
}

export function unclip(doc, stepId) {
  const at = findStep(doc, stepId);

  if(at?.step.op !== 'photo' || at.step.clip === undefined) return doc;

  const { clip, ...rest } = at.step;

  return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? rest : step)));
}

// Change a shape (E60): `fill` / `stroke` a colour, or null for none; `closed`
// opens or closes the path (the vertices and handles stay).
export function updateShape(doc, stepId, { fill, stroke, closed } = {}) {
  const at = findStep(doc, stepId);

  if(!at || at.step.op !== 'shape') return doc;

  const next = { ...at.step };
  const set = (key, value) => (value === null ? delete next[key] : value !== undefined && (next[key] = value));

  if(fill !== undefined && fill !== null && !isColour(fill)) return doc;
  if(stroke !== undefined && stroke !== null && !isColour(stroke)) return doc;

  set('fill', fill);
  set('stroke', stroke);

  if(typeof closed === 'boolean' && closed !== at.step.closed) {
    const parsed = verticesFromPath(at.step.path);

    if(!parsed) return doc;

    // a wall may not get a corner sharper than 90 degrees by being closed or opened
    if(at.step.wall && acuteCorner(parsed.vertices, closed)) return doc;

    next.closed = closed;
    next.path = pathFromVertices(parsed.vertices, closed);

    // a room has no width, a line has one
    if(next.wall) next.wall = closed ? { height: next.wall.height } : { height: next.wall.height, width: next.wall.width ?? defaultWall(next).width };
  }

  return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? next : step)));
}

// Replace the vertices of a shape (E61), the path follows. Fewer than two (open)
// or three (closed) vertices, or a non-finite coordinate, change nothing.
export function setVertices(doc, stepId, vertices) {
  const at = findStep(doc, stepId);

  if(!at || at.step.op !== 'shape' || !Array.isArray(vertices) || vertices.length < (at.step.closed ? 3 : 2) || vertices.length > LIMITS.points) return doc;

  const ok = n => Number.isFinite(n) && Math.abs(n) <= LIMITS.number;

  if(!vertices.every(v => ok(v.x) && ok(v.y) && [v.hin, v.hout].every(h => h === undefined || (Array.isArray(h) && h.length === 2 && h.every(ok))))) return doc;

  if(at.step.wall && acuteCorner(vertices, at.step.closed)) return doc;

  return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? { ...step, path: pathFromVertices(vertices, step.closed) } : step)));
}

// Flag a shape as a wall of the 3D gallery or take the flag off (`wall` null).
// `wall` is { height, width? } (metres); missing fields get the defaults. A shape
// with a corner sharper than 90 degrees is refused, so is a bad height or width.
// Whether the node is a gallery is the command layer's business (commands.js).
export function setWall(doc, stepId, wall) {
  const at = findStep(doc, stepId);

  if(!at || at.step.op !== 'shape') return doc;

  if(wall === null) {
    if(at.step.wall === undefined) return doc;

    const { wall: _, ...rest } = at.step;

    return withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? rest : step)));
  }

  const parsed = verticesFromPath(at.step.path);
  const next = { ...defaultWall(at.step), ...(at.step.wall ?? {}), ...wall };

  if(!parsed || !isWall(next) || acuteCorner(parsed.vertices, at.step.closed)) return doc;

  if(at.step.closed) delete next.width;

  return JSON.stringify(next) === JSON.stringify(at.step.wall) ? doc : withSteps(doc, at.page, doc.pages[at.page].steps.map((step, i) => (i === at.index ? { ...step, wall: next } : step)));
}
