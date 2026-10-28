// Editor commands (EDITOR.md S2.6, E40): everything that changes the node goes
// through here as a plain object, `apply(snapshot, command)`, so the editor
// has one way to change anything and one history (history.js). A snapshot is
// `{ doc, kind }`: the document plus the node metadata that is saved next to
// it. Pure: a command that changes nothing (unknown id, same value) returns
// the same snapshot, which history.push then ignores.
import * as model from './model.js';
import { clipPolygon, cutPhoto, duplicatePhoto } from './clipping.js';
import { combineOutline, setClipPolygons, splitClip } from './multiclip.js';
import { pasteSteps } from './clipboard.js';
import { effective } from './render.js';
import { invert, multiply } from './matrix.js';

// A clipped photo and its mask move together (EDITOR.md S2.7): whatever takes
// the photo from its matrix to `m`, the same move is applied to the clip
// shape, so the window stays where it is on the photo. `move(doc, id, m)` does
// the change for one step.
function withMask(doc, id, m, move) {
  const next = move(doc, id, m);
  const at = model.findStep(doc, id);

  if(next === doc || at?.step.op !== 'photo' || !Array.isArray(m)) return next;

  const by = effective(doc.pages[at.page].steps).by;
  const now = by.get(id);
  const inverse = now?.clip && invert(now.m ?? at.step.m);

  if(!inverse) return next;

  const shape = by.get(now.clip)?.m ?? [1, 0, 0, 1, 0, 0];

  return move(next, now.clip, multiply(multiply(m, inverse), shape));
}

// Commands that repeat while a control is dragged or typed into carry a key,
// so history.push folds a run of them into one undo step.
const KEYED = {
  setOpacity: c => `opacity:${c.id}`,
  setTitle: () => 'title',
  setBg: () => 'bg',
  setColor: c => `color:${c.id}:${c.field ?? 'color'}`,
  setStrokeWidth: c => `strokeWidth:${c.id}`,
  setMatrix: c => `matrix:${c.id}`,
  recordMove: c => `matrix:${c.id}`,
  setVertices: c => `vertices:${c.id}`,
  setCrop: c => `crop:${c.id}`,
  setWall: c => `wall:${c.id}`,
  // the preview and the full-resolution outline of the magic wand are one undo step
  // the preview and the final cutout of a photo are one undo step
  // typing in a text box is one undo step until something else happens
  resizeText: c => `resize:${c.id}`,
  updateText: c => (c.keyed ? `text:${c.id}:${c.keyed}` : null),
  setClipPolygons: c => `clipedit:${c.id}`,
  setEdge: c => `edge:${c.id}`,
  setBox: c => (c.cutout ? `cutout:${c.id}` : c.wand ? `wand:${c.id}` : null),
  replacePhoto: c => (c.cutout ? `cutout:${c.id}` : c.wand ? `wand:${c.id}` : null),
  unclip: c => (c.wand ? `wand:${c.id}` : null),
  clipPolygon: c => (c.wand ? `wand:${c.id}` : null),
};

// the colour fields of each op a setColor may write
const COLOUR_FIELDS = { stroke: ['color'], shape: ['fill', 'stroke'], text: ['color', 'bg'] };

export const commandKey = command => KEYED[command.type]?.(command) ?? null;

// the document part of a command
function onDoc(doc, c) {
  switch(c.type) {
    case 'addPhoto':
      return model.addPhoto(doc, c.page ?? doc.pages[0].id, c.hash, c.info, c.id, c.role, c.crop, c.m);
    case 'addStep':
      return model.addStep(doc, c.page ?? doc.pages[0].id, c.step, c.index);
    case 'updateStep':
      return model.updateStep(doc, c.id, c.patch);
    case 'removeStep':
      return model.removeStep(doc, c.id);
    case 'setEdge':
      return model.setEdge(doc, c.id, c.edge);
    case 'addText':
      return model.addText(doc, c.page ?? doc.pages[0].id, c);
    case 'resizeText': {
      // the box's width and wrapped lines, and its place when a left corner moved: one step
      const next = model.updateText(doc, c.id, c.patch);

      return Array.isArray(c.m) ? model.setMatrix(next, c.id, c.m) : next;
    }
    case 'updateText':
      return model.updateText(doc, c.id, c.patch);
    case 'pasteSteps':
      return pasteSteps(doc, c.page ?? doc.pages[0].id, c.payload, { shift: c.shift, ids: c.ids }).doc;
    case 'setBox':
      return model.setBox(doc, c.id, c.box);
    case 'replacePhoto':
      return model.replacePhoto(doc, c.id, c.hash);
    case 'moveStep':
      return model.moveStep(doc, c.id, c.to);
    case 'setRole':
      return model.setRole(doc, c.id, c.role);
    case 'setMode':
      return model.setMode(doc, c.mode);
    case 'addPage':
      return model.addPage(doc, c.index);
    case 'removePage':
      return model.removePage(doc, c.id);
    case 'movePage':
      return model.movePage(doc, c.id, c.to);
    case 'movePhoto':
      return model.movePhoto(doc, c.id, c.to);
    case 'setCrop':
      return model.setCrop(doc, c.id, c.crop);
    case 'setLayout':
      return model.setLayout(doc, c.changes ?? {});
    case 'setOpacity':
      return model.setOpacity(doc, c.id, c.value);
    case 'setBlend':
      return model.setBlend(doc, c.id, c.mode);
    case 'setClip':
      return model.setClip(doc, c.id, c.shape);
    case 'unclip':
      return model.unclip(doc, c.id);
    case 'clipPolygon':
      return clipPolygon(doc, c.id, c.polygon, c.shape, c.style);
    case 'clipOutline':
      return combineOutline(doc, c.id, c.polygon, c.mode, c.shape, c.style) ?? clipPolygon(doc, c.id, c.polygon, c.shape, c.style);
    case 'setClipPolygons':
      return setClipPolygons(doc, c.id, c.polygons);
    case 'splitClip':
      return splitClip(doc, c.id, c.ids);
    case 'cutPhoto':
      return cutPhoto(doc, c.id, c.pieces, c.ids, c.style);
    case 'duplicatePhoto':
      return duplicatePhoto(doc, c.id, c.ids);
    case 'setTitle':
      return model.setTitle(doc, c.title);
    case 'setBg':
      return model.setBg(doc, c.color);
    case 'setColor': {
      const field = c.field ?? 'color';
      const step = model.findStep(doc, c.id)?.step;

      return step && COLOUR_FIELDS[step.op]?.includes(field) && model.isColour(c.color) ? model.updateStep(doc, c.id, { [field]: c.color }) : doc;
    }
    case 'setWall':
      return model.setWall(doc, c.id, c.wall);
    case 'setVertices':
      return model.setVertices(doc, c.id, c.vertices);
    case 'updateShape':
      return model.updateShape(doc, c.id, c.changes);
    case 'recordMove':
      return withMask(doc, c.id, c.m, (d, id, m) => model.recordMove(d, id, m, c.k, c.ease));
    case 'setMatrix':
      return withMask(doc, c.id, c.m, model.setMatrix);
    case 'setStrokeWidth': {
      const step = model.findStep(doc, c.id)?.step;

      return step?.op === 'shape' && Number.isFinite(c.value) && c.value >= 0 && c.value <= 400 ? model.updateStep(doc, c.id, { strokeWidth: c.value }) : doc;
    }
    default:
      return doc;
  }
}

// -> { snap, key }: the new snapshot (the same one when nothing changed) and
// the coalescing key for history.push
export function apply(snap, command) {
  if(command.type === 'setKind') return { snap: model.KINDS.includes(command.kind) && command.kind !== snap.kind ? { ...snap, kind: command.kind } : snap, key: null };

  // the wall layer only exists in a gallery (the kind lives next to the document)
  if(command.type === 'setWall' && command.wall !== null && snap.kind !== 'gallery') return { snap, key: null };

  const doc = onDoc(snap.doc, command);

  return { snap: doc === snap.doc ? snap : { ...snap, doc }, key: commandKey(command) };
}

// what a snapshot is worth for dirty tracking: the saved fields only
export const fingerprint = snap => JSON.stringify([snap.doc, snap.kind]);
