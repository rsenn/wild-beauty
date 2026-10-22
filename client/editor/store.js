// The single-editor store (EDITOR.md S2.1): at most one editor is open on a
// page. `open(target)` takes a node id or 'new'; asking for another while one
// is open raises the `confirmReplace` hook, and the editor is only replaced
// when it says yes (that is where "unsaved changes, discard?" lives). Plain
// state plus subscribers, no framework: the Preact hook is in useEditor.js.
export const NEW = 'new';

// confirmReplace(current, next, { dirty }) -> boolean | Promise<boolean>
export function createEditorStore({ confirmReplace = () => false } = {}) {
  let state = { open: false, target: null, dirty: false };
  const listeners = new Set();
  let hook = confirmReplace;

  const set = next => {
    state = { ...state, ...next };

    for(const fn of [...listeners]) fn(state);
  };

  return {
    get state() {
      return state;
    },

    // the function is called with the state on every change; returns unsubscribe
    subscribe(fn) {
      listeners.add(fn);

      return () => listeners.delete(fn);
    },

    // replace the hook (the page installs the translated prompt)
    setConfirm(fn) {
      hook = fn ?? (() => false);
    },

    // -> Promise<boolean>: true when `target` is open afterwards. The same
    // target again is a no-op that says yes; another one needs the hook's yes.
    async open(target) {
      if(!state.open) {
        set({ open: true, target, dirty: false });

        return true;
      }

      if(state.target === target) return true;

      const current = state.target;
      const ok = await hook(current, target, { dirty: state.dirty });

      // the editor may have changed while the prompt was up
      if(!ok || state.target !== current) return false;

      set({ target, dirty: false });

      return true;
    },

    // the editor reports unsaved changes so the hook can warn
    setDirty(dirty) {
      if(state.open && state.dirty !== !!dirty) set({ dirty: !!dirty });
    },

    close() {
      if(state.open) set({ open: false, target: null, dirty: false });
    },
  };
}
