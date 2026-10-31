// The draw order of a multiple selection (EDITOR.md E147): the commands that move several
// steps one place forward or backward, or to the very front or back, as a group. A step
// does not jump over another selected one (the group keeps its inner order). Pure.
import { findStep, moveStep } from './model.js';

// -> [{ type: 'moveStep', id, to }]; `to` is 'up' | 'down' | 'front' | 'back'
export function orderCommands(doc, ids, to) {
  const at = ids.map(id => findStep(doc, id)).filter(Boolean).sort((a, b) => a.index - b.index);
  const mine = new Set(at.map(f => f.step.id));
  const out = [];

  if(to === 'front' || to === 'back') {
    for(const f of to === 'back' ? at.slice().reverse() : at) out.push({ type: 'moveStep', id: f.step.id, to });

    return out;
  }

  let sim = doc;

  // forward: the topmost first, so a step meets only steps that are not yet moved
  for(const f of to === 'up' ? at.slice().reverse() : at) {
    const here = findStep(sim, f.step.id);
    const next = moveStep(sim, f.step.id, to);
    const after = findStep(next, f.step.id);

    if(!here || !after || after.index === here.index) continue;

    // the step it jumped over now sits where it was
    const jumped = next.pages[after.page].steps[here.index];

    if(jumped && mine.has(jumped.id)) continue;

    sim = next;
    out.push({ type: 'moveStep', id: f.step.id, to });
  }

  return out;
}
