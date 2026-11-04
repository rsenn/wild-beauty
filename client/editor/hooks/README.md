# hooks

Feature hooks of the editor: each owns the state, refs and effects of one concern (`useDraft`, `useLock`, `usePlayback`, `useDropper`, `useScenePalette`, ...) and returns `{ state, actions }`.

A hook takes one `host` object (`latest`, `dispatch`, `announce`, `tr`, ...). Hooks never read each other's refs; `NodeEditor` composes them. Hooks that know nothing about the editor belong in `client/hooks/`, not here.
