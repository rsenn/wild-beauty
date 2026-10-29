// The controls of a 3D gallery that live outside its stage (the title row, the row with the edit
// button): a small store the gallery view fills and the toolbars read. `state` is what to
// show, `actions` what the buttons do. No DOM here.
//   live       the gallery runs (the buttons make sense)
//   overview   a gallery node: it starts above the plan
//   walking    overview only: the visitor has flown down
//   full       the stage is fullscreen (the toolbars are not visible then: the stage has its own)
//   hud        { mode, index, total, title, ... } from session.js
//   help       the help note is open

export const createChrome = () => {
  let state = { live: false, overview: false, walking: false, full: false, hud: null, help: false };
  const subs = new Set();

  return {
    actions: {},

    get state() {
      return state;
    },

    // merge a change; listeners hear of it only when something differs
    set(patch) {
      if(Object.keys(patch).every(k => Object.is(state[k], patch[k]))) return;

      state = { ...state, ...patch };
      subs.forEach(f => f(state));
    },

    subscribe(f) {
      subs.add(f);

      return () => subs.delete(f);
    },
  };
};

// what the title row shows: the buttons that are of use now
export const toolsOf = s => ({
  fullscreen: s.live,
  help: s.live && (!s.overview || s.walking),
  leave: s.live && (!s.overview || s.walking),
});

// whether the picture-to-picture row shows
export const navOf = s => s.live && (!s.overview || s.walking) && s.hud?.mode === 'guide';
