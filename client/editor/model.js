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
export const FONTS = ['fixed', 'caslon', 'opensans'];
export const ALIGNS = ['left', 'center', 'right'];

// --- validate, structure (E4) ---------------------------------------------
// Types and shapes only. Limits, finiteness and references are E5.
// validate(doc) -> [{ code, path }]; an empty list means valid. Codes:
//   not_object  bad_version  bad_style  bad_mode  bad_bg  bad_pages  bad_page
//   bad_steps   bad_step     unknown_op bad_id    bad_field

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumber = v => typeof v === 'number';
const isString = v => typeof v === 'string';
const isColour = v => isString(v) && /^(#[0-9a-f]{6}([0-9a-f]{2})?|(rgb|hsl)a?\([0-9a-z.,%\s/-]+\))$/i.test(v);
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

export function validate(doc) {
  const errors = [];

  if(!isObject(doc)) return [{ code: 'not_object', path: '' }];

  if(doc.v !== VERSION) errors.push({ code: 'bad_version', path: 'v' });
  if(!isObject(doc.style) || (doc.style.theme !== undefined && !isString(doc.style.theme)) || (doc.style.vars !== undefined && !isObject(doc.style.vars))) errors.push({ code: 'bad_style', path: 'style' });
  if(!MODES.includes(doc.mode)) errors.push({ code: 'bad_mode', path: 'mode' });
  if(doc.bg !== undefined && !isFill(doc.bg)) errors.push({ code: 'bad_bg', path: 'bg' });

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
