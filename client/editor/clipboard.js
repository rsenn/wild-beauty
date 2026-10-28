// Clipboard (EDITOR.md E131): copy a step as an image, as text and as itself,
// paste an image, text or such a step. The step travels inside the `text/html`
// part (a data attribute), which every browser and the paste event carry, so a
// paste in another page or node gets it back exactly; other apps take the
// image or the text. The pure parts are here, the browser calls at the end.
import { LIMITS, addStep, allIds, findStep, isColour, setMatrix, unique, validate } from './model.js';
import { FONTS } from './text.js';
import { effective } from './render.js';

export const MARK = 'data-wb-clip';
const KINDS = ['photo', 'text', 'stroke', 'shape'];
const IDENTITY = [1, 0, 0, 1, 0, 0];
const MAX_ITEMS = 8;
const isMatrix = m => Array.isArray(m) && m.length === 6 && m.every(Number.isFinite);

// what a copy of step `id` holds: the step as drawn now (its matrix after the
// transform steps) and, for a clipped photo, its clip shape
export function copyPayload(doc, id) {
  const at = findStep(doc, id);

  if(!at || !KINDS.includes(at.step.op)) return null;

  const by = effective(doc.pages[at.page].steps).by;
  const item = { step: at.step, m: by.get(id)?.m ?? at.step.m ?? IDENTITY };

  if(at.step.op === 'photo' && at.step.clip) {
    const shape = findStep(doc, at.step.clip);

    if(shape?.step.op === 'shape') item.clip = { step: shape.step, m: by.get(shape.step.id)?.m ?? IDENTITY };
  }

  return { v: 1, items: [item] };
}

const escape = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// the text of a copy: a text box's words, nothing for the rest
export const plainFor = payload => payload.items.filter(i => i.step.op === 'text').map(i => i.step.text).join('\n');

// the html part: the payload in an attribute, and for a text box the words in
// its font, size, weight and colour (an app that takes html keeps the look)
export function htmlFor(payload) {
  const data = encodeURIComponent(JSON.stringify(payload));
  const body = payload.items
    .filter(i => i.step.op === 'text')
    .map(({ step }) => {
      const font = FONTS[step.font] ?? FONTS.sans;
      const style = `margin:0;font-family:${font.stack.replaceAll('"', "'")};font-size:${Math.round(step.size)}px;font-weight:${step.bold ? font.bold : 400};color:${isColour(step.color) ? step.color : '#000000'};text-align:${step.align === 'end' ? 'right' : step.align === 'center' ? 'center' : 'left'}`;

      return `<p style="${escape(style)}">${step.text.split('\n').map(escape).join('<br>')}</p>`;
    })
    .join('');

  return `<meta charset="utf-8"><div ${MARK}="${data}">${body}</div>`;
}

// the payload inside a html clipboard part, or null
export function payloadFromHtml(text) {
  const found = typeof text === 'string' && text.match(new RegExp(`${MARK}="([^"]*)"`));

  if(!found) return null;

  try {
    const payload = JSON.parse(decodeURIComponent(found[1]));

    return payload?.v === 1 && Array.isArray(payload.items) && payload.items.length > 0 && payload.items.length <= MAX_ITEMS ? payload : null;
  } catch {
    return null;
  }
}

// What a paste is: { kind: 'steps', payload } | { kind: 'image', file } |
// { kind: 'text', text } | null. A step of ours comes first, then a picture, then words.
export function classify({ html = '', text = '', files = [] } = {}) {
  const payload = payloadFromHtml(html);

  if(payload) return { kind: 'steps', payload };

  const file = [...files].find(f => /^image\//.test(f.type));

  if(file) return { kind: 'image', file };

  const words = (text || html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')).replace(/[ \t]+/g, ' ').trim();

  return words ? { kind: 'text', text: words.slice(0, LIMITS.textChars) } : null;
}

// the steps of `payload` added to page `pageId`, `shift` units down and right of where
// they were, each with a new id; a photo whose image `known(hash)` does not know
// is left out; `ids` are the ids to use first. -> { doc, ids } (the same doc when nothing was added or the result
// would be invalid)
export function pasteSteps(doc, pageId, payload, { shift = 50, known = () => true, ids: given = [] } = {}) {
  const page = doc.pages.find(p => p.id === pageId);

  if(!page || !payload?.items?.length || page.steps.length + payload.items.length * 2 > LIMITS.steps) return { doc, ids: [] };

  const taken = new Set(allIds(doc));
  const queue = [...given];
  const fresh = () => {
    const id = queue.shift() ?? unique(taken);

    taken.add(id);

    return id;
  };
  const moved = m => [m[0], m[1], m[2], m[3], m[4] + shift, m[5] + shift];
  let next = doc;
  const ids = [];

  for(const { step, m, clip } of payload.items) {
    if(!KINDS.includes(step?.op) || !isMatrix(m) || (step.op === 'photo' && !known(step.photo))) continue;

    const id = fresh();
    const copy = { ...step, id };

    delete copy.clip;

    if(step.op === 'photo' && clip?.step?.op === 'shape' && isMatrix(clip.m)) {
      const shape = fresh();

      next = addStep(next, pageId, { ...clip.step, id: shape });
      next = setMatrix(next, shape, moved(clip.m));
      copy.clip = shape;
    }

    next = addStep(next, pageId, copy);
    next = setMatrix(next, id, moved(m));
    ids.push(id);
  }

  return ids.length && validate(next).length === 0 ? { doc: next, ids } : { doc, ids: [] };
}

// --- the browser ---

// write `{ png, html, text }` (any may be missing) to the clipboard; rejects when
// the browser refuses (no permission, no secure page, no user gesture)
export async function writeClipboard({ png, html, text }) {
  const parts = {};

  if(png) parts['image/png'] = png;
  if(html) parts['text/html'] = new Blob([html], { type: 'text/html' });

  parts['text/plain'] = new Blob([text ?? ''], { type: 'text/plain' });

  await navigator.clipboard.write([new ClipboardItem(parts)]);
}

// the parts of a paste event
export const fromEvent = data => ({ html: data?.getData('text/html') ?? '', text: data?.getData('text/plain') ?? '', files: [...(data?.files ?? [])] });

// the parts of the clipboard now (the browser may ask the user once); rejects when refused
export async function readClipboard() {
  const out = { html: '', text: '', files: [] };

  for(const item of await navigator.clipboard.read()) {
    for(const type of item.types) {
      if(/^image\//.test(type)) out.files.push(new File([await item.getType(type)], `pasted.${type.split('/')[1].replace(/[^a-z0-9]/g, '') || 'png'}`, { type }));
      else if(type === 'text/html') out.html ||= await (await item.getType(type)).text();
      else if(type === 'text/plain') out.text ||= await (await item.getType(type)).text();
    }
  }

  return out;
}
