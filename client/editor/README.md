# client/editor

The node editor's logic (the component is `client/components/NodeEditor.js`; the spec is `EDITOR.md`). Every file belongs to exactly one folder, grouped by responsibility. Put new files in the folder that fits; do not add files to this directory.

| Folder | Responsibility | Depends on |
|---|---|---|
| `core/` | the document, commands, history, store, draft | `geometry/` only |
| `geometry/` | pure maths: matrices, polygons, curves, layout | nothing |
| `input/` | what pointers and keys mean: gestures, handles, hit testing, shortcuts, tool table | `core/`, `geometry/` |
| `tools/<tool>/` | one folder per tool: its maths, state machine and hook | `core/`, `geometry/`, `input/` |
| `io/` | server, storage, files, clipboard, export | `core/`, `geometry/` |
| `view/` | rendering and presentation: renderer, palette, edge, playback | `core/`, `geometry/` |
| `overlay/` | stateless SVG overlay components of the stage | `view/`, `geometry/` |
| `hooks/` | feature hooks (state, refs and effects of one concern) | anything above |

Rules: dependencies point down the table (a folder never imports from one below it). A hook returns `{ state, actions }` and takes one `host` object. Generic hooks that know nothing about the editor live in `client/hooks/`.
