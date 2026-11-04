# tools

One folder per tool. A tool folder holds its maths, its state machine and, once extracted, its hook (`useWand.js`, ...).

| Folder | Contents |
|---|---|
| `wand/` | the magic wand: stage <-> photo maps, selection path |
| `lasso/` | the magnetic lasso: edge cost, wire, snapping |
| `clip/` | clipping: `clipping`, `clipstroke`, `multiclip` |
| `shape/` | the shape tool: `shapetool`, `vertexedit`, `roomaid` |
| `cutout/` | background removal: `job`, `alpha`, `alphamap` |

A tool may import `core/`, `geometry/`, `input/`. Tools do not import each other; shared code moves to `core/` or `geometry/`.
