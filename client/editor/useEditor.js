// The page's editor store and its Preact hook. One store per browser page;
// on the server nothing ever opens it, so sharing the module is harmless.
import { useEffect, useState } from '../../vendor/hooks.js';
import { createEditorStore } from './store.js';

export const editorStore = createEditorStore();

// -> { open, target, dirty, openEditor(target), closeEditor() }, re-rendering on change
export function useEditor() {
  const [state, setState] = useState(editorStore.state);

  useEffect(() => {
    setState(editorStore.state);

    return editorStore.subscribe(setState);
  }, []);

  return { ...state, openEditor: target => editorStore.open(target), closeEditor: () => editorStore.close(), setDirty: dirty => editorStore.setDirty(dirty) };
}
