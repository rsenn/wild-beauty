// The node document (EDITOR.md S3.1): constants, ids and the empty node.
// Shared by the browser and the server, so no DOM and no Bun APIs.
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
export const FITS = ['extend', 'cover', 'free'];
export const FONTS = ['fixed', 'serif', 'sans'];
export const ALIGNS = ['left', 'center', 'right'];

// --- validate, structure (E4) ---------------------------------------------
// Types and shapes only; limits, numbers and references follow in `limits`.
// validate(doc) -> [{ code, path }]; an empty list means valid. Codes:
//   not_object  bad_version  bad_style  bad_mode  bad_bg  bad_title  bad_pages  bad_page
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
  photo: { id: isId, photo: isHash, m: isMatrix, fit: oneOf(FITS), opacity: isNumber, blend: oneOf(BLENDS), clip: opt(isId), role: opt(oneOf(['picture', 'texture'])) },
  stroke: { id: isId, pts: isPoints, color: isColour, smooth: opt(v => typeof v === 'boolean') },
  shape: { id: isId, path: isString, closed: v => typeof v === 'boolean', fill: opt(isFill), stroke: opt(isFill), strokeWidth: isNumber, wall: opt(v => isObject(v) && isNumber(v.height)) },
  clip: { target: isId, shape: isId },
  unclip: { target: isId },
  blend: { target: isId, mode: oneOf(BLENDS) },
  transform: { target: isId, m: isMatrix, ease: opt(isString) },
  text: { id: isId, text: isString, lines: v => Array.isArray(v) && v.every(isString), m: isMatrix, w: isNumber, h: isNumber, font: oneOf(FONTS), size: isNumber, color: isColour, align: oneOf(ALIGNS), padding: isNumber, radius: isNumber, bg: opt(isFill) },
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

  if(doc.title !== undefined && !isString(doc.title)) errors.push({ code: 'bad_title', path: 'title' });

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
          if(step.text.length > LIMITS.textChars) errors.push({ code: 'text_too_long', path: `${at}.text` });
          if(step.bg !== undefined && !stopsOk(step.bg)) errors.push({ code: 'bad_stops', path: `${at}.bg` });
          break;
      }
    });
  });

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

// to: 'front' (drawn last, on top), 'back' (drawn first), or an index
export function moveStep(doc, stepId, to) {
  const at = findStep(doc, stepId);

  if(!at) return doc;

  const steps = doc.pages[at.page].steps.slice();
  const [step] = steps.splice(at.index, 1);
  const index = to === 'front' ? steps.length : to === 'back' ? 0 : clamp(Math.trunc(to), 0, steps.length);

  if(!Number.isFinite(index)) return doc;
  if(index === at.index) return doc;

  steps.splice(index, 0, step);

  return withSteps(doc, at.page, steps);
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

export const setTitle = (doc, title) => (title === doc.title ? doc : { ...doc, title: String(title).slice(0, LIMITS.title) });

// --- photo commands (E7) ---------------------------------------------------
// Same rules as the commands above. `info` is { width, height }, the photo as
// displayed (EXIF orientation applied; the upload record's width and height).

const STAGE = 1000;

// the matrix of a fit mode. A photo's local space has its long edge scaled to
// 1000, so `extend` only has to centre it; `cover` scales the short edge up
// to the stage. `free` has no matrix of its own: null.
export function fitMatrix(fit, { width, height }) {
  const long = STAGE / Math.max(width, height);
  const w = width * long;
  const h = height * long;

  if(fit === 'extend') return [1, 0, 0, 1, (STAGE - w) / 2, (STAGE - h) / 2];

  if(fit === 'cover') {
    const k = STAGE / Math.min(w, h);

    return [k, 0, 0, k, (STAGE - w * k) / 2, (STAGE - h * k) / 2];
  }

  return null;
}

// a photo step on top of `pageId`, fit extend, centred
export function addPhoto(doc, pageId, hash, info, id = unique(allIds(doc))) {
  return addStep(doc, pageId, { op: 'photo', id, photo: hash, m: fitMatrix('extend', info), fit: 'extend', opacity: 1, blend: 'normal' });
}

const updatePhoto = (doc, stepId, patch) => (findStep(doc, stepId)?.step.op === 'photo' ? updateStep(doc, stepId, patch) : doc);

// `extend` and `cover` reset the matrix to the mode's fit; `free` keeps it
export function setFit(doc, stepId, fit, info) {
  if(!FITS.includes(fit)) return doc;

  const m = fitMatrix(fit, info);

  return updatePhoto(doc, stepId, m ? { fit, m } : { fit });
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
