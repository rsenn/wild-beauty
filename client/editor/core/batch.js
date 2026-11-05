// The document side of the batch editor (docs/BATCH.md): list the photos of a
// node, move photos inside and between nodes, switch photos off. Pure: documents
// in, new documents out, the input is never touched.
import { allIds, countPhotos, findStep, isTexture, newId, photoLimit } from './model.js';
import { decompose, multiply } from '../geometry/matrix.js';

// how far a photo is turned, in degrees clockwise (0 to 359)
const turnOf = m => (Array.isArray(m) ? (((Math.round((decompose(m).rotation * 180) / Math.PI) % 360) + 360) % 360) : 0);

// the picture photos of a document in page order, step order
// -> [{ id, hash, page, off, clip, desc }]
export const photoRefs = doc =>
  doc.pages.flatMap(page => page.steps.filter(step => step.op === 'photo' && !isTexture(step)).map(step => ({ id: step.id, hash: step.photo, page: page.id, off: step.off === true, clip: step.clip !== undefined, desc: step.desc ?? '', rot: turnOf(step.m) })));

// switch the photo steps `ids` off or on (the key goes away when on)
export function setOff(doc, ids, off) {
  const set = new Set(ids);
  let changed = false;

  const pages = doc.pages.map(page => {
    if(!page.steps.some(step => set.has(step.id) && step.op === 'photo' && (step.off === true) !== off)) return page;

    changed = true;

    return {
      ...page,
      steps: page.steps.map(step => {
        if(!set.has(step.id) || step.op !== 'photo' || (step.off === true) === off) return step;

        const { off: _gone, ...rest } = step;

        return off ? { ...rest, off: true } : rest;
      }),
    };
  });

  return changed ? { ...doc, pages } : doc;
}

// turn the photo steps `ids` by `quarters` quarter turns clockwise (negative: anticlockwise) about the centre of
// each photo, the way the node editor's turn buttons do. Exact for quarter turns.
export function rotatePhotos(doc, ids, quarters = 1) {
  const set = new Set(ids);
  const q = ((quarters % 4) + 4) % 4;

  if(!q) return doc;

  const [cos, sin] = [[1, 0], [0, 1], [-1, 0], [0, -1]][q];
  let changed = false;

  const pages = doc.pages.map(page => {
    if(!page.steps.some(step => set.has(step.id) && step.op === 'photo')) return page;

    changed = true;

    return {
      ...page,
      steps: page.steps.map(step => {
        if(!set.has(step.id) || step.op !== 'photo') return step;

        const m = step.m;
        const c = [m[0] * 500 + m[2] * 500 + m[4], m[1] * 500 + m[3] * 500 + m[5]]; // the photo's centre on the stage
        const turn = [cos, sin, -sin, cos, c[0] - cos * c[0] + sin * c[1], c[1] - sin * c[0] - cos * c[1]];

        return { ...step, m: multiply(turn, m).map(v => Math.round(v * 1e6) / 1e6 + 0) };
      }),
    };
  });

  return changed ? { ...doc, pages } : doc;
}

// give the photo steps `ids` the description `text` (empty: remove it)
export function setDesc(doc, ids, text) {
  const set = new Set(ids);
  const next = text.slice(0, 500);
  let changed = false;

  const pages = doc.pages.map(page => {
    if(!page.steps.some(step => set.has(step.id) && step.op === 'photo' && (step.desc ?? '') !== next)) return page;

    changed = true;

    return {
      ...page,
      steps: page.steps.map(step => {
        if(!set.has(step.id) || step.op !== 'photo' || (step.desc ?? '') === next) return step;

        const { desc: _gone, ...rest } = step;

        return next ? { ...rest, desc: next } : rest;
      }),
    };
  });

  return changed ? { ...doc, pages } : doc;
}

// the generated description of a photo from `{ place, taken }` (docs/BATCH.md S6a):
// "Place, 15 April 2026" in the language `lang`, or just one of the two, or ''
export function describeText({ place, taken } = {}, lang = 'en') {
  const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(taken ?? '');
  let date = '';

  if(m) {
    try {
      date = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
    } catch {
      date = `${m[1]}-${m[2]}-${m[3]}`;
    }
  }

  return [place, date].filter(Boolean).join(', ');
}

// Move the photos `picks` ([{ node, id }], in the order they should land) in
// front of the photo step `to.before` of node `to.node` (null: at its end).
//   docs      { [nodeId]: document }
//   editable  (nodeId) => boolean, which nodes may be changed
// -> { docs: { [nodeId]: document } (only the changed ones), refused: [{ id, reason }] }
// reasons: locked (node not editable), clip (a cutout shape cannot leave its
// page), full (the destination holds no more photos), missing.
// The steps that point at a photo (transform, blend, unclip) travel with it.
export function placePhotos(docs, picks, to, { editable = () => true } = {}) {
  const refused = [];
  const dest = docs[to.node];

  if(!dest) return { docs: {}, refused: picks.map(p => ({ id: p.id, reason: 'missing' })) };

  const ok = [];
  const moved = new Set(picks.map(p => p.id));
  const refs = photoRefs(dest);

  // the photo steps that stay put: `before` may itself be one of the moved ones
  let before = to.before ?? null;

  if(before && moved.has(before)) {
    const at = refs.findIndex(r => r.id === before);

    before = refs.slice(at + 1).find(r => !moved.has(r.id))?.id ?? null;
  }

  const landing = before ? (findStep(dest, before)?.page ?? dest.pages.length - 1) : dest.pages.length - 1;
  const landingPage = dest.pages[landing].id;

  for(const pick of picks) {
    const doc = docs[pick.node];
    const at = doc && findStep(doc, pick.id);

    if(!at || at.step.op !== 'photo') refused.push({ id: pick.id, reason: 'missing' });
    else if(!editable(pick.node) || !editable(to.node)) refused.push({ id: pick.id, reason: 'locked' });
    else if(at.step.clip !== undefined && (pick.node !== to.node || doc.pages[at.page].id !== landingPage)) refused.push({ id: pick.id, reason: 'clip' });
    else ok.push({ ...pick, step: at.step, page: at.page });
  }

  // the destination has to hold them: the distinct photos after the move
  const incoming = ok.filter(p => p.node !== to.node);
  const hashes = new Set(dest.pages.flatMap(page => page.steps.filter(s => s.op === 'photo').map(s => s.photo)));

  for(const p of incoming) hashes.add(p.step.photo);

  if(incoming.length && hashes.size > Math.max(photoLimit(dest.mode), countPhotos(dest))) {
    for(const p of incoming) refused.push({ id: p.id, reason: 'full' });

    ok.splice(0, ok.length, ...ok.filter(p => p.node === to.node));
  }

  if(!ok.length) return { docs: {}, refused };

  // take them out: the step and what points at it
  const work = { ...docs };
  const carried = [];

  for(const p of ok) {
    const doc = work[p.node];
    const page = doc.pages[findStep(doc, p.id).page];
    const deps = page.steps.filter(s => s.target === p.id);

    work[p.node] = { ...doc, pages: doc.pages.map(pg => (pg === page ? { ...pg, steps: pg.steps.filter(s => s.id !== p.id && s.target !== p.id) } : pg)) };
    carried.push({ step: p.step, deps, from: p.node });
  }

  // put them in, in order; an id that the destination already uses is renewed
  const taken = new Set(allIds(work[to.node]));
  const inserted = carried.flatMap(({ step, deps, from }) => {
    if(from === to.node || !taken.has(step.id)) {
      taken.add(step.id);

      return [step, ...deps];
    }

    let id;

    do id = newId();
    while(taken.has(id));

    taken.add(id);

    return [{ ...step, id }, ...deps.map(d => ({ ...d, target: id }))];
  });
  const target = work[to.node];
  const page = target.pages[landing];
  const index = before ? page.steps.findIndex(s => s.id === before) : page.steps.length;

  work[to.node] = { ...target, pages: target.pages.map((pg, i) => (i === landing ? { ...pg, steps: [...pg.steps.slice(0, index), ...inserted, ...pg.steps.slice(index)] } : pg)) };

  const changed = {};

  for(const id of new Set([to.node, ...ok.map(p => p.node)])) changed[id] = work[id];

  return { docs: changed, refused };
}
