// The rule for a server job running on a photo (EDITOR.md E128, UX-REQUIREMENTS
// J6): while the background of a photo is being removed, what would take that
// photo away or change what the job works on is refused; everything else stays
// editable. Pure.
import { findStep } from './model.js';

// commands that act on a photo by `id`
const ON_PHOTO = new Set(['removeStep', 'cutPhoto', 'duplicatePhoto', 'clipPolygon', 'clipOutline', 'setClipPolygons', 'splitClip', 'setClip', 'unclip', 'setCrop', 'setRole', 'replacePhoto', 'movePhoto']);

// is `command` refused while a job runs on step `target`? The job's own results carry `cutout`.
export function blocked(doc, target, command) {
  if(target === null || target === undefined || command.cutout) return false;
  if(ON_PHOTO.has(command.type)) return command.id === target;
  if(command.type === 'removePage') return findStep(doc, target)?.page === doc.pages.findIndex(p => p.id === command.id);
  if(command.type === 'setMode') return false;

  return false;
}
