// The loupe (EDITOR.md E124): a magnifier above the point a finger is placing, because the finger hides it.
// This is the policy, kept apart from the stage that draws it so it can be tested.
//
// Where it makes sense: tools that give feedback under a pointer that is down (strokes and outlines drawn
// under the finger, the lasso's live line) and, in the select tool, a handle or a vertex being dragged.
// Not where the tool acts at the moment of the tap (wand, background, unclip, text): nothing is left to see.
// When it is on: by default on small screens, for a finger or a pen (a mouse pointer hides nothing). On any
// other screen it is opt-in; the visitor's choice (this browser only) wins in both directions.
export const LOUPE_TOOLS = ['pen', 'shape', 'clip', 'lasso'];

// what counts as a small screen: a phone upright, or on its side (a short window)
export const SMALL = '(max-width: 700px), (max-height: 520px)';

const KEY = 'wb-loupe';

// 'on' | 'off' | 'auto' (nothing chosen: small screens only)
export function readPref(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(KEY);

    return value === 'on' || value === 'off' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

export function writePref(pref, storage = globalThis.localStorage) {
  try {
    if(pref === 'on' || pref === 'off') storage?.setItem(KEY, pref);
    else storage?.removeItem(KEY);
  } catch {}
}

// is the loupe enabled for this screen at all (what the toggle shows)
export const loupeEnabled = (pref, small) => pref === 'on' || (pref === 'auto' && !!small);

// the choice after the toggle was pressed; a choice that equals the default is stored as no choice, so
// the default keeps following the screen
export function toggled(pref, small) {
  const next = loupeEnabled(pref, small) ? 'off' : 'on';

  return next === (small ? 'on' : 'off') ? 'auto' : next;
}

// does this pointer event get a loupe: `fine` is a handle or vertex drag in progress (select tool)
export function loupeShows({ pref, small, tool, fine = false, pointerType }) {
  if(!(LOUPE_TOOLS.includes(tool) || (tool === 'select' && fine)) || pref === 'off') return false;

  return pref === 'on' ? true : !!small && pointerType !== 'mouse';
}
