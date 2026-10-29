# EDITOR.md - the node (content) editor: UX, data, server, tasks

Status: specification, 2026-10-22. This file is the single home of everything about
creating and editing a **node**: the user experience, the data a node carries,
the server side that stores it, and the step-by-step task list. It was assembled
from `PLAN.md` (old S7 document model, S8 "Saving a node", S11.2-S11.6 editor
client), `DESIGN.md` S4.5 (layout editor, named fields), `TODO.md` M8-M10 and the
decisions of 2026-10-22 (`GRAPH.md`, `GALLERY.md`). Those files now point here.

Related, and not repeated here: upload area and upload pipeline (`PLAN.md` S6, S11.1),
theming and the sanitiser (`PLAN.md` S16), the database engine and graph columns
(`PLAN.md` S8, `GRAPH.md`), the 3D `scene3d` step format (`GALLERY.md` S3.1),
optional background removal (`opencv-imgproc.md`).

Words: a content item is a **node** (never tile, never file); its pictures are
**photos**; a stored upload is an **upload**; the editor's drawing surface is the
**stage**; a unit of the node document is a **step**.

---

## 0. Summary

1. The editor is a **square stage** (SVG) between two **tool columns**, with a
   context bar, a film-strip and a page sequencer. It is touch-first: every action
   has a pointer-event path, a keyboard path and an on-screen button.
2. A node is **data**: a small JSON document of ordered **steps** (photo, stroke,
   shape, clip, blend, transform; later text) on a 0..1000 unit square, plus a few
   metadata columns (title, kind, visibility, position...). One renderer turns the
   document into SVG on the server (SSR, tiles) and in the browser (editor, viewer).
3. **Only one editor is open at a time**, enforced in the client (one instance) and
   on the server (a **lock** with heartbeat). Every other rendering of a node is a
   read-only tile.
4. Editing is **non-destructive**: crop/extend, clip and blend are values in the
   document; the original photo is never changed. Saving **bakes** each used upload
   into `data/photos/` (never raising the quality of a JPEG) and then deletes the
   upload.
5. The work is split into small tasks, client (`C`) and server (`S`), in S9. The
   pure parts (model, matrices, filters, validation) come first and are tested
   without a DOM.

---

## 1. Principles

- **Document first.** UI state (selected tool, selection, popovers) is separate
  from the document; only the document is saved, undone and rendered on the server.
- **One renderer.** `render.js` maps a document to Preact vnodes; SSR and the editor
  call the same function (`PLAN.md` S2). No canvas for content (SVG is SSR-able,
  resolution-independent and hit-testable); finished pages may be rasterised later.
- **Units.** Document coordinates are in a **unit square 0..1000** (x right, y
  down), independent of screen size. A photo's local space is its displayed pixels
  scaled so that its long edge is 1000; its matrix `m` maps local space to the stage.
- **Pointer Events only** (no mouse/touch duplicates); `touch-action: none` on the
  stage; a keyboard alternative for every command.
- **Themable.** The editor chrome uses only `--wb-*` tokens; a node is rendered
  inside a wrapper with its own `data-theme` and sanitised vars (`PLAN.md` S16.6).
  Colour inside the content (photos, strokes, shapes) is data and never themed.
- **Translated.** Every visible string and `aria-label` is a key in `locales/*.json`;
  the key-parity check must pass (`tools/check-locales.js`).
- **Honest failure.** A save either commits fully or not at all; the user's work
  survives a reload (local draft) and a crash between server steps (reconcile).

---

## 2. UX specification

### 2.1 Entry points

| From | Action | Result |
|---|---|---|
| `/new` | button "New node" (`action-new.svg`) under the upload area | an empty editor opens below the upload area, no photos needed |
| `/new` | drag/tap a photo card onto the stage, or the card's "add to node" button | a `photo` step is added (an editor opens first if none is open) |
| a node tile in a list, graph or branch view | "Edit" (owner or group admin/curator only) | the node is fetched and opened in the single editor; the lock is taken (S2.8) |
| an open editor + another "Edit" | the current editor is replaced | if it has unsaved changes: Save / Discard / Cancel prompt |
| not allowed to edit | no Edit button | the node stays a read-only tile |

There is never more than one editor. Opening a second replaces the first.

### 2.2 Layout

```
 +--------------------------------------------------------------+
 | title [______________________]   kind [node v]   (props ...) |
 +----+----------------------------------------------------+----+
 | V  |                                                    | undo|
 | P  |                                                    | redo|
 | S  |              S T A G E   (square, 1:1)             | page|
 | C  |                                                    | theme|
 | U  |                                                    | del |
 | T  |                                                    |SAVE |
 +----+-------------------------------------+--------------+----+
      | context bar: fit | opacity | blend | clip | z | del |
      | palette:  D D D D  /  T T T N      (S2.3a)        |
      +--------------------------------------------------+
      | pages:  [1] [2] [+]     steps: |----o----|  k/n  |
      +--------------------------------------------------+
                                           film-strip (>1 photo) -> right of stage on wide screens,
                                           below the stage on phones
```

- The stage has `aspect-ratio: 1`, `overflow: hidden`, `touch-action: none`,
  `contain: paint`, a 1 px outline token. The editor has **no frame, background or margin**
  of its own (decided 2026-10-28) and the layout follows the **orientation**, not a width
  breakpoint (S2.2a).
- Left column (tools, top to bottom): **V** select/transform, **P** ink pen,
  **S** shape, **C** clip, **U** unclip, **T** text boxes (S2.3b). Right column:
  undo, redo, add/remove page, theme (when themes exist), delete node, **Save**.
- Context bar: appears under the stage and shows controls for the current selection
  only (photo: fit, opacity, blend, clip/unclip, to front/back, delete; stroke:
  colour, width, delete; shape: fill, stroke, closed, delete; text box: font, size,
  colour, align, background, radius, padding, delete). Directly under it sits the
  small **colour palette** (S2.3a) whenever the tool or selection takes a colour.
- Title field and a "properties" popover sit above the stage (S2.9).
- Page sequencer under the context bar: page thumbnails, a step scrubber for the
  current page, a mode switch (free / slides / grid).
- Film-strip: vertical to the right of the stage on wide screens, a horizontal row
  below on phones; only when the node holds more than one photo.
- Phone portrait is the primary layout (360 px width must work); desktop adds hover
  states, wheel zoom, keyboard shortcuts and a wider stage.

### 2.2a Orientation layouts (decided 2026-10-28, tried on a 360 x 669 phone)

- **Portrait:** the stage is as wide as the screen (the editor goes edge to edge, the page's
  side padding is cancelled). Order: title row, banners, tools as a row, stage, actions as a
  row, film-strip, then the rest as before (context bar, palette, modes, scrubber, pages).
- **Landscape:** a surface exactly one window high (`100dvh`) that does not scroll, so the
  browser's address bar does not come back. From the left: the drawing tools (an upright
  strip), the square stage (as tall as the window), the actions (an upright strip), and a
  panel. The panel has the title row (title, properties, close), the banners and a tab row;
  **one section at a time**: *select* (context bar, pen options, palette), *photos*
  (film-strip), *sequence* (modes, scrubber, pages); it scrolls inside itself. Buttons in the
  strips shrink to 32 px to fit the height. The editor is full bleed.
- The shortcut-keys button is hidden when the pointer is coarse (touch).
- Sizes follow measurement (`dvh`, orientation, free space), never a device guess: `100vh` is
  wrong on phones (browser bar), 980 px was a missing viewport meta tag (see
  `UX-REQUIREMENTS.md`, device measurements).
- Not decided yet and listed in `UX-REQUIREMENTS.md`: two screens (uploads / editor), paged
  uploads, drag across the screens, the three-depth model of sequence / composition /
  animation.

### 2.3 Tools

| Tool | Key | Does | Notes |
|---|---|---|---|
| Select / transform | V | tap selects the top-most step under the pointer; drag moves; handles scale/rotate; gestures (S2.4) apply to the selection | tap on empty stage deselects; Delete removes the selection |
| Ink pen | P | freehand strokes; width from pressure and speed | colour from the palette (S2.3a); base width slider; mouse has no pressure (speed only) |
| Shape | S | click adds a vertex, click-drag pulls a symmetric bezier handle, Alt or second finger breaks symmetry, clicking the first vertex closes | toggles: open/closed, fill on/off, stroke colour and width; vertices and handles stay editable |
| Clip | C | with a photo selected, tap a shape: the shape becomes that photo's clip path and stops being drawn | **the mask moves with the photo** (decided 2026-10-23): moving, scaling or turning a clipped photo applies the same move to its mask shape (`commands.js` `withMask`), so the window stays where it is on the photo; to slide the picture under a fixed mask, unclip, move, clip again. A mask shared by several photos moves with whichever is moved |
| Unclip | U | with a clipped photo selected: removes the clip, the shape reappears as a normal object | |
| Text | T | places **text boxes**: font face, font colour, background colour (with alpha, or a gradient), border radius | S2.3b |
| Wall layer (3D gallery) | W | marks the selected shape as a wall with a height; a closed wall is a room, an open one a wall/corridor line | only for `kind: gallery`; refuses corners sharper than 90 degrees (`GALLERY.md` S0b) |

Photos have no tool: they are added by dropping (S2.5) and edited with Select.

### 2.3a Colour palette

A small palette is shown in the editor (under the context bar) whenever the active
tool or the selection takes a colour: pen colour, shape fill and stroke, text colour
and text-box background, gradient stops, stage ground. It has **eight swatches in
two rows of four**:

```
 dominant   D1 D2 D3 D4      four dominant colours of the reference photo
 derived    T1 T2 R  N       two tetradic completions, one triadic completion, N = complement of D1 (else black/white)
```

**Reference photo** (first match): the selected photo step; else the top-most photo
step visible on the current page at the scrubber position `k`; else the first photo
step of the node (any page). A node with no photo at all uses the theme's own colours
(`--wb-accent`, `--wb-ink`, `--wb-select`, `--wb-danger`) as D1-D4.

**Dominant colours D1-D4.** Taken from the photo's stored palette (8 colours, ordered
by weight, written by ingest; `PLAN.md` S6.2). Walk the palette in order and keep a
colour unless its OKLab distance to one already kept is below 0.08
(`distance` of `server/media/color.js`, moved to a shared module, task E84); if fewer
than four remain, fill from the skipped ones, then with lightness steps of D1. D1 is
the heaviest.

**Derived colours** (all computed in OKLCH, then gamut-clamped to sRGB by lowering
chroma):

1. **Tetradic pair.** Among the pairs of D1-D4 take the pair `(A, B)` whose hue
   difference is closest to 60 degrees (at least 20 degrees; if no pair qualifies
   use D1 and D2). The two colours that complete a tetradic (rectangular) wheel with
   them are the **complements** `T1 = A + 180 degrees` and `T2 = B + 180 degrees`; each keeps
   the lightness and chroma of its source. `A, B, T1, T2` are then the four corners
   of a rectangle on the hue circle.
2. **Triadic completion.** The two remaining dominants `(E1, E2)` get one more
   colour `R` that completes a triadic wheel with them: its hue is the **midpoint of
   the larger hue arc between E1 and E2** (exactly 120 degrees from each when they are
   120 degrees apart, the most even spread otherwise); its lightness and chroma
   are the mean of E1 and E2.
3. **Fourth colour `N`** (decided): the **complement of the heaviest dominant colour**
   (`D1 + 180 degrees`, keeping its lightness and chroma). If D1 is a **washed-out or
   dirty dark** colour, `N` is instead **black or white**, whichever has the higher
   contrast against D1. "Washed out" is OKLCH chroma below 0.05; "dirty dark" is
   lightness below 0.35 with chroma below 0.09 (thresholds to tune on real photos).
   Both cases are tested in `palette.js`.

An achromatic dominant colour (OKLCH chroma below 0.02) has no hue: its "complement"
is its lightness inverted (`L' = 1 - L`).

**Behaviour.** Tapping a swatch sets the colour of the active target (a small chip
beside the palette shows which: pen, fill, stroke, text, background, stop 1/2/3,
ground). A long press (or the "+" at the end) opens a full picker: hue/saturation
square, lightness, hex field and an **alpha slider**. The palette is recomputed
whenever the reference photo changes; it is derived, never stored: only the chosen
colour values go into the document. Swatches are at least 28 px with a 44 px hit area.
The computation is a pure function `palette(photoPalette, theme) -> {dominant, derived}`
in `client/editor/palette.js`, unit-tested without a DOM.

### 2.3b Text boxes

The **text tool** (T) places **text boxes**. A tap on the stage creates a box of
default size (60% of the stage width, one line high) with the caret in it; a drag
draws the box with the dragged size. Typing edits in place (a `textarea` overlay
aligned to the box; IME, selection and right-to-left text work natively and the text
direction is `auto`). Esc or a tap outside ends editing; an empty box is discarded.
A box is then an ordinary step: Select moves, scales and rotates it with the same
gestures as a photo; corner handles resize the box (text re-wraps).

Per box (context bar, with the palette under it):

| Property | Values | Notes |
|---|---|---|
| Font face | one of three, by role id: `fixed` (Fixed, the pixel UI face, in `static/fonts` already), `serif` (a book face, see below), `sans` (a smooth geometric/grotesque sans, see below) | ids name the role, not the font file, so the sanitiser is a whitelist and the faces can change later without touching stored documents; the font files (woff2, with their licences) are added to `static/fonts` in task E90 |
| Size | 8..400 units | in document units, scales with the stage |
| Font colour | any colour incl. alpha | palette or picker |
| Align | start / centre / end | logical, so it mirrors in right-to-left |
| Background | none, **solid colour with alpha**, or **gradient** | gradient: linear (angle 0..360) or radial, 2 to 5 stops, each stop a colour with alpha taken from the palette or the picker |
| Border radius | 0 .. half of the shorter side | in units; "pill" is the maximum |
| Padding | 0..100 units | space between the box edge and the text |

**Faces.** Three roles. `fixed` is the existing pixel UI face. `serif` should be a
beautiful, artistic serif with the look of printed books; `sans` a slick, smooth sans in
the Futura or Helvetica family. Futura and Helvetica themselves are commercial fonts
and may not be embedded on a web page without a licence, so the plan is a free (OFL)
face with the same character. Candidates, to be chosen before E90:

| Role | First choice | Alternatives | Why |
|---|---|---|---|
| `serif` | **EB Garamond** (OFL) | Cormorant Garamond (finer, more display-like, delicate below ~14 px), Crimson Pro, Libre Baskerville | a Garamond revival: the classic book-page texture, real italics and several weights |
| `sans` | **Jost** (OFL) | Inter or Albert Sans for a Helvetica-like neo-grotesque; Nimbus Sans is a Helvetica metric clone but has a more awkward licence | Jost is a Futura-inspired geometric sans: round, smooth, clean at any size |

**Your shortlist (to decide later):** Urbanist, Sour Gummy, Nunito, Questrial, Square Peg,
Radley, Habibi, Linden Hill, Forum. All are Google Fonts, believed to be OFL (to be
checked in E90). Where they would fit:

| Face | Kind | Fits role |
|---|---|---|
| Linden Hill | old-style book serif (Garamond-like) | `serif` |
| Radley | book serif with some calligraphic flavour | `serif` |
| Habibi | calligraphic serif, more decorative | `serif` |
| Forum | classical Roman display serif, strongest in capitals and headings | `serif` or a display role |
| Questrial | geometric sans, the closest of the list to Futura | `sans` |
| Urbanist | smooth geometric sans, variable | `sans` |
| Nunito | rounded sans, soft and friendly | `sans` |
| Sour Gummy | playful rounded display face | needs an extra role (`display`) |
| Square Peg | handwritten, scribble-like | needs an extra role (`hand`) |

Sour Gummy and Square Peg do not fit "one serif, one sans"; choosing either means a
fourth font id, which is cheap (the id list is a whitelist in `model.js` and the
sanitiser) but should be a conscious decision. Choosing several serifs or sans is
possible the same way, at the cost of more font files to load.

Each needs a woff2 file with a Latin and Latin-Extended subset (German and French accents
are required) and its licence file; a variable font is preferred so one file serves the
weights. Fallback stacks end in `serif` / `sans-serif`, so a missing file never breaks a
node, and the stored `lines` stay valid because wrapping is re-measured on edit only.

**Rendering is native SVG, not `foreignObject`**, so any SVG rasteriser can draw a
text-box node into a tile (librsvg/`rsvg-convert`, cairo, Inkscape or similar; none
of them renders `foreignObject`; on this machine only Inkscape is installed, so the
choice is made when the server-side tile is built). A box is a `<rect rx ry>` filled
with `<linearGradient>`/`<radialGradient>` (stops carry `stop-opacity`, so alpha works)
plus a `<text>` with one `<tspan>` per line. SVG has no automatic wrapping, so the
**client breaks the lines** (measuring with the real font via `canvas.measureText`)
when a box is committed or resized and stores them in the step (`lines`); every renderer
just draws the stored lines, so wrapping is identical in the browser, in SSR and in the
rasteriser. Editing re-wraps live in the browser. A rasterising server needs the three
fonts installed for fontconfig. Colour values use the sanitiser's patterns (`#rrggbbaa`,
`rgb()/hsl()` with alpha); gradients are data (`{type, angle, stops}`), never a CSS string.

### 2.4 Gestures and shortcuts

| Input | Result |
|---|---|
| one pointer drag on a selected photo | translate |
| two pointers on the stage | similarity transform (pinch zoom + rotate + translate) of the selection, solved from the two start and two current points and composed onto the start matrix (drift-free) |
| mouse wheel over the stage | zoom the selection around the pointer (Shift: rotate) |
| double-tap / double-click on a photo | (was: cycle fit; with the square crop it resets the matrix to the photo's square cell) |
| Alt+drag (desktop) | scale around the centre |
| Delete / Backspace | delete the selection |
| Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z or Ctrl+Y | undo, redo |
| Ctrl/Cmd+S | save |
| Esc | cancel the current drawing; else deselect; else close popovers |
| V P S C U T W | switch tool |
| Arrow keys | nudge the selection 1 unit (Shift: 10) |
| [ ] | to back / to front |

Every gesture ends in exactly **one history entry** (S2.6), so a pinch is one undo.

### 2.5 Photos

- **Adding.** Drag a card from the upload list onto the stage (HTML5 drag where it
  works; a pointer-based "ghost" drag on touch, where HTML5 drag is unreliable),
  or press the card's "add to node" button (accessible path). Result: a `photo`
  step, `fit: extend`, centred.
- **Square crop (decision, replaces the fit modes extend/cover/free).** A photo is
  always clipped to a square: the largest square that fits the picture, whose
  position along the long axis is `crop` (0..1, default 0.5 = centred; nothing to move
  on a square photo). The crop is chosen **on the upload card** (drag the photo in the
  card; the cursor shows `ns-resize`/`ew-resize`, on touch a small up-down or left-right
  double-arrow icon sits on the card) and travels with the photo into the node, where
  it can still be adjusted (non-destructive: the full photo is kept, the step stores
  `crop`). The `extend` ground made from the padding colours, the fit toggle on the
  card (yellow triangle) and the `fit` values `extend|cover|free` are removed; moving,
  scaling and rotating a photo on the stage still change its matrix, as before. Old
  documents with `fit` load with `crop: 0.5` (`fit: cover` and `free` keep their matrix).
  Phases and tasks: E98-E103 (E103 waits for text boxes). Documents saved before the crop are converted when they are read from the database (`migrateDoc`).
- **Order.** Steps are drawn in list order; "to front/back" moves a step. The
  film-strip lists photo steps in that order; dragging in the strip reorders them
  without changing strokes and shapes relative to each other.
- **Opacity and blend.** Popover: opacity 0..1 and a short list of blend modes
  (`normal multiply screen overlay darken lighten`).
- **Texture photos.** For a 3D gallery, a photo can be marked **texture**; it is
  then not drawn as a picture and not hung (`GALLERY.md` S3.3). The toggle is on
  the upload card and in the film-strip entry.
- **Uploads belong to a cookie** and expire with it (`PLAN.md` S6.2): the list only shows the
  uploads of this browser.
- **Upload cleanup.** After a successful save the used uploads leave the upload
  list (they now live baked in `data/photos/`).

### 2.6 Undo / redo

- A stack of document snapshots (structural sharing, so cheap), at most 100.
- One entry per completed user action: a gesture, a stroke, a finished shape edit,
  a property change (slider commits on release), add/delete/reorder.
- Undo/redo never touch tool, selection or popover state; after undo the selection
  is cleared if its step no longer exists.
- The stack is cleared on save? **No**: undo works across saves within one editor
  session; it is dropped when the editor closes.

### 2.7 Pages, steps, modes

- A node has one or more **pages**; page N shows its steps `0..k`. The scrubber
  sets `k` (also used for playback: press play, `k` advances by `duration`).
  `duration` is in seconds (default half a second per step, at most 60); while the
  scrubber is before the end only moving is possible: moving or turning a step there records a
  `transform` step after the first `k` steps (a repeat right after only changes it), and playback
  eases the step from its matrix at that point to the new one (`ease`: linear, in, out, inOut).
- `mode: free`: the pages are what the author drew. `slides`: one photo step per
  page, auto-generated from the photo list, with simple transitions. `grid`:
  photos auto-tiled in a grid, no manual transforms. Both modes also take **text boxes**
  (S2.3b) and have **layout options** (`doc.layout`): grid has `fill: 'tight'|'loose'`
  (tight: as much of the stage as possible is covered, as little background as possible
  shows; the cells grow, the gap shrinks to `gap`), `gap` and `columns` (auto or n); slides
  has the transition and where a text box sits (own page or caption). Details and open
  questions in S10 points 7-9.
- Add/remove page buttons in the right column; pages reorder by drag in the
  sequencer. Removing a page with steps asks for confirmation.
- `transform` steps animate a target step to a new matrix with an easing; they are
  authored by moving something while the scrubber is not at the end of the page.

### 2.8 Save, drafts, locks

- **Save** (button, Ctrl+S): disabled while there is nothing to save or a request
  runs; shows a progress state; on success the title shows "saved", the dirty mark
  clears, and `rev` is updated. On failure an inline translated error with a retry;
  nothing is lost.
- **Dirty** = the document or metadata differs from the last saved version. The
  window `beforeunload` guard asks before leaving a dirty editor.
- **Draft.** While dirty, the client writes the document to `localStorage`
  (`wb-draft:<id|new>`) every 3 s and on page hide (in a try/catch; works without
  storage). On opening an editor with a newer draft: "Restore draft / Discard".
- **Lock.** Opening an existing node asks `POST /api/nodes/:id/lock`. Granted: the
  client heartbeats every 20 s, the lock expires after 60 s without a heartbeat and
  is released on close/save. Refused: the node opens read-only with a banner
  "locked by <name> until <time>", and the owner sees "Break lock". If the lock is
  lost while editing (expired, broken) the editor turns read-only at once and offers
  to keep the draft. A new unsaved node needs no lock.
- **Conflict.** `PUT` carries the loaded `rev`; a `409` shows "changed elsewhere":
  keep mine (overwrite after re-fetching the new rev), take theirs (discard mine
  into a draft), or cancel. With locks this should be rare.
- **Cancel / close.** Close asks if dirty; closing releases the lock.

### 2.9 Node properties (popover above the stage)

| Field | Values | Notes |
|---|---|---|
| Title | text, max 200 chars | shown on the tile; empty = "Untitled" |
| Kind | `node` `list` `album` `gallery` `shop` | a hint for views (`GRAPH.md`); `gallery` enables the wall layer and the 3D settings |
| Visibility | `hidden` (owner only), `group`, `public` | with accounts only; in the PoC the field is shown disabled with `public` |
| Group | one group | only when visibility is `group`; with accounts only |
| Theme | theme id + sanitised overrides | needs M2b; the stage and tile wear it |
| Position | x, y, pinned | set in the graph view, not here |
| Links | add/remove `child` / `ref` / `sells` edges to other nodes | search-and-pick; ordered `child` edges get a drag handle (graph/ops are `GRAPH.md` 12.2) |

### 2.10 Later (documented, not first)

- **Text boxes** are specified in S2.3b (phase K); not part of the first save/photos
  milestone. (`DESIGN.md` S4.5 decided a layout editor with fonts and free text placement.)
- **Fields.** `fields`: an ordered list of `{label, value}` for structured metadata
  ("Location: Berlin"), edited in the properties popover, shown beside the node.
- **Handwriting recognition / gesture snapping** (`$1`/`$P` shape snapping): deferred
  past the PoC.
- **Cutout and server-side clip**: the "Cut out" button on an upload card and the
  destructive clip (`opencv-imgproc.md`), only when `capabilities.imgproc`.

### 2.11 Accessibility, i18n, errors

- Every tool and button is a real `<button>` with an `aria-label` and a tooltip from
  `t()`; the stage has `role="img"` plus a text alternative built from the title;
  focus moves into the editor on open and back to the opener on close; all colour
  contrasts come from tokens.
- Errors are translated keys, never raw server text (`editor.error.<code>`):
  `invalid`, `too_large`, `missing_photo`, `locked`, `conflict`, `network`,
  `forbidden`, `quota`, `bake_failed` (500, a photo could not be baked).
- RTL: the tool columns mirror with `dir` (logical properties in `layout.css`).

---

## 3. Data specification

### 3.1 The node document (`nodes.doc`, JSON, version 1)

```
node = { v: 1,
         style: { theme?: string, vars?: { "--wb-...": string } },     // PLAN S16.6
         mode:  'free' | 'slides' | 'grid',
         bg?:   string,                                                  // stage ground colour
         title?: string,                                                 // <= 200; copied to nodes.title on save; in the doc so title edits are undoable (E41)
         pages: [ page, ... ],                                           // 1..50
         fields?: [ { label, value } ],                                  // later
         scene?: scene3d }                                               // kind 'gallery', GALLERY S3.1
page = { id, duration?: number, steps: [ step, ... ] }                   // 0..500 steps
step = one of
  { op: 'photo',     id, photo: <sha256>, m: [a,b,c,d,e,f],
                     fit: 'extend'|'cover'|'free', opacity: 0..1, blend: 'normal'|..., clip?: shapeId,
                     role?: 'picture'|'texture' }                         // role mirrors node_photos.role
  { op: 'stroke',    id, pts: [[x,y,w],...], color, smooth }              // <= 2000 points
  { op: 'shape',     id, path: 'M..C..Z', closed, fill?, stroke?, strokeWidth,
                     wall?: { height } }                                  // wall: 3D gallery layer
  { op: 'clip',      target: photoStepId, shape: shapeId }
  { op: 'unclip',    target: photoStepId }
  { op: 'blend',     target, mode }
  { op: 'transform', target, m, ease? }
  { op: 'text',      id, text, lines, m, w, h, font, size, color, align,  // phase K, S2.3b
                     padding, radius, bg?: fill }       // font: 'fixed'|'serif'|'sans'; lines: client-wrapped
fill     = colour | { type: 'linear'|'radial', angle?: 0..360,
                      stops: [ { c: colour, at: 0..1 }, ... ] }           // 2..5 stops
colour   = '#rrggbb' | '#rrggbbaa' | 'rgb(...)' | 'hsl(...)'              // alpha allowed
```

The same `colour` and `fill` forms are used by `stroke.color`, `shape.fill/stroke`
and `bg`.

Rules:

- `id`s are 8-character base-36 strings generated on the client, unique inside the
  node; references (`clip`, `target`, `shape`) must resolve inside the same page.
- `m` is `[a,b,c,d,e,f]` = SVG `matrix(a b c d e f)` from local to stage space.
  All numbers finite, `|value| <= 1e6`.
- Photos reference baked or uploaded photos by hash; the server resolves the
  hash to `data/photos/<hash>.<ext>` (saved) or `uploads/<hash>[.display].<ext>`
  (not yet saved).
- **Limits** (enforced by `validate`, client and server): document <= 1 MB,
  <= 50 pages, <= 500 steps per page, <= 2000 points per stroke, path string
  <= 20 000 characters, <= 40 photos per node, colours matching the sanitiser
  patterns, `title` <= 200, text box <= 2000 characters, <= 100 text boxes per
  node, gradients <= 5 stops, `font` an id from the curated list.
- Unknown `op`s are rejected on save and ignored on render (forward compatibility
  for old viewers).

### 3.2 Node metadata (columns of `nodes`)

`id`, `title`, `doc`, `palette` (ordered `[{hex, weight}]` derived from the photos),
`kind`, `owner_id` (NULL until accounts), `visibility`, `group_id`, `x`, `y`,
`pinned`, `tile` (hash of the baked square raster; later), `rev`, `created_at`,
`updated_at`. `nodes.rev` increments on every change and is the optimistic-lock
value for `PUT`. Full DDL: `PLAN.md` S8.

### 3.3 Photos and their roles

`photos(hash, ext, width, height, bytes, palette, meta, created_at)` is one row
per baked photo. `node_photos(node_id, photo_hash, sort, role)` ties photos to
nodes (`role`: `picture` | `texture`); `sort` mirrors the film-strip order. A photo
file is shared by every node that uses it (same hash). The upload sidecar JSON
(`uploads/<hash>.json`, written by ingest) supplies width, height, palette,
padding colours, EXIF, `hasAlpha`; the baked photo keeps what the node needs
(`width`, `height`, `palette`, `padding`).

### 3.4 Links (edges) edited from the editor

`node_links(from_id, to_id, label, sort)` with `label` in `child` (ordered), `sells`,
`ref`, `at` (a place, `GRAPH.md` S1.5; offered by the editor, never made on its own). The editor lists, adds and removes them for the open node; the graph
operations (reorder siblings, relink) are in `GRAPH.md` (12.2); the editor uses the
same endpoint (`POST /api/graph/ops`). An edge is only shown to viewers who can see
both ends.

### 3.5 Locks

`node_locks(node_id PRIMARY KEY, holder TEXT, user_id, acquired_at, expires_at)`.
`holder` is the session token (cookie) so locks work before accounts exist.

### 3.6 Client-only state

Selected tool, selection (step ids), popover state, pointer state, history stack,
draft timer. Never sent to the server; never in the document.

### 3.7 Files

| Where | What | Lifetime |
|---|---|---|
| `uploads/<hash>.<ext>`, `.display.<ext>`, `.json` | uploads (S2.5 of `PLAN.md` S6.2) | until saved into a node or deleted |
| `data/photos/<hash>.<ext>` | baked photo (no metadata, long edge <= 2048, orientation applied) | while referenced by `node_photos` |
| `data/photos/<hash>.thumb.jpg` | square rendition with the node's own crop/extend applied: the node **tile** until server-side tile rasterising exists (`GRAPH.md` S3.7) | regenerated on save |
| `data/wb.sqlite3` | tables of `PLAN.md` S8 | |

---

## 4. Saving a node: the server algorithm

`POST /api/nodes` (create) and `PUT /api/nodes/:id` (update, with `rev`) run in one
SQLite transaction. This section was `PLAN.md` S8 "Saving a node".

1. **Validate** the document (S3.1 limits, references, unknown ops), the title and
   the metadata; run the theme **sanitiser** on `style` (`PLAN.md` S16.6); check every
   referenced photo hash exists in `uploads/` or `data/photos/`; check permissions
   (owner or group admin; none in the PoC) and, for `PUT`, the lock and `rev`.
2. For each used upload **bake** into `data/photos/<hash>.<ext>`: auto-orient, strip
   all metadata, resample to a long edge of at most 2048. The encoding rule is
   **never raise the quality of a JPEG**:
   - JPEG source (the upload, or the HEIC display file) with long edge <= 2048:
     **no re-encode**, a lossless transform: `jpegtran -copy none` with the EXIF
     orientation applied as `-rotate`/`-transpose`/`-flip` (`-perfect`, else
     `-trim`), which also strips metadata;
   - JPEG source that must be shrunk: re-encode with ImageMagick at the source's
     own estimated quality (`identify -format %Q`, never higher; 90 if it cannot be
     estimated);
   - any other opaque source (png, tiff, webp, gif, avif; the display file of a HEIC
     is already a JPEG): JPEG at **quality 99** (default 4:2:0);
   - with an alpha channel (e.g. after a cutout): WebP q99 or PNG, never JPEG.
   The baking source is the display file; the crop/extend stays a non-destructive
   transform in the document. A non-sRGB ICC profile is kept (E24, S10 point 1).
3. Additionally write `<hash>.thumb.jpg`: a square rendition of the node with its
   own crop/extend applied (same quality rule: at most the source's quality for JPEG
   sources, 99 otherwise).
4. Insert/update `photos`, `nodes` (bump `rev`, set `palette`), `node_photos`
   (including `role`), release the lock.
5. **After the commit**, delete the upload and its sidecar.

If the process dies between 2 and 5 the photo exists in both places; the next start
reconciles (anything in `data/photos` also in `uploads` is removed from `uploads`).
Baking is idempotent.

### 4.1 HTTP API

| Method and path | Purpose | Success | Errors |
|---|---|---|---|
| `GET /api/nodes/:id` | node metadata + document (viewer's visibility applied) | 200 `{node, rev}` | 404, 403 |
| `POST /api/nodes` | create | 201 `{id, rev}` | 400 invalid, 413, 422 missing photo |
| `PUT /api/nodes/:id` | update, body carries `rev` | 200 `{rev}` | 409 conflict, 423 locked, 403 |
| `DELETE /api/nodes/:id` | delete node, its `node_photos`, edges; orphan photos garbage-collected | 204 | 423, 403 |
| `POST /api/nodes/:id/lock` | take/renew the lock | 200 `{expires_at}` | 423 `{holder, expires_at}` |
| `DELETE /api/nodes/:id/lock` | release (owner may break another's) | 204 | 403 |
| `GET /files/photos/<hash>[.thumb].<ext>` | baked photo | 200 | 404 |
| `GET /:lang/node/:id` | read-only page, SSR | 200 HTML | 404 |

Bodies are JSON; `Content-Type` is checked; the body is capped (1.2 MB). All
errors are `{error: <code>}` with the codes of S2.11.

---

## 5. Rendering

- `client/editor/render.js` exports `renderNode(doc, { upTo, mode, theme })` ->
  vnode; it is a pure function of the document, used by SSR (`/:lang/node/:id`, the
  tile rasteriser later), the editor stage, the film-strip thumbnails and the
  viewer.
- Photo step -> `<g transform>` containing the square-cropped `<image href>` (a nested
  `<svg viewBox>` or `clip-path` cuts the square at `crop`; no ground rect any more); a clip is a `<clipPath>` in the
  page `<defs>` made from the shape path; `blend` is `mix-blend-mode` in `style`.
  Stroke -> filled `<path>` (the outline polygon). Shape -> `<path>`.
- Mode `slides` shows one page per photo; `grid` lays photos out with
  `gridLayout(n)` (pure function); the editor draws exactly what the viewer draws.
- The wrapper is `<div data-theme=ID style="sanitised vars">` in SSR and browser.
- Selection handles, guides and the pen's live stroke are an editor overlay `<g>`
  above the rendered node, never part of it.

---

## 6. Pen, shapes and clip: algorithms

**Ink pen** (`pen.js`). Input samples `(x, y, pressure, t)`. Width
`w = base * f(pressure) * g(speed)`, `g` decreasing, with a low-pass filter on speed.
Smoothing: **One-Euro filter** on the points; then resample at a fixed arc length;
then the closed outline polygon from the vendored `perfect-freehand` 1.2.3 (MIT, ~6 KB;
`DESIGN.md` S9.2) fed with our resampled points and widths. One-Euro, resampler and the
width model are ours (`DESIGN.md` S9.3). The stroke stores the already-smoothed
points so replay is exact. Mouse input has no pressure (speed only).

**Shape tool** (`shapes.js`). Vertices with optional symmetric bezier handles;
output an SVG path string; closed/open, fill, stroke. Pure functions
`pathFromVertices(v, closed)` and `verticesFromPath(d)` round-trip (vertex `{x, y, hin?, hout?, broken?}`,
handles are offsets, mirrored unless `broken`; only `M L C Z` absolute); hit-testing, nearest point and
bounding boxes use the vendored `bezier-js` 6.1.4 (MIT, `DESIGN.md` S9.2).

**Gestures** (`gestures.js`). `solveSimilarity(p0, q0, p1, q1)` returns the
similarity (scale, rotation, translation) mapping the two start points onto the two
current points; composed onto the start matrix. One pointer: translate only.

**Clip.** `clip` sets `photo.clip = shapeId`; the shape stops being drawn; `unclip`
reverses. The clip is a shape in stage space that follows its photo: a move of the photo is applied to the mask too.

---

## 7. Files this adds

```
client/editor/            model.js  history.js  matrix.js  render.js  gestures.js
                          pen.js    shapes.js   grid.js    draft.js   lock.js
                          palette.js (S2.3a)  text.js (box model, fills)
client/color.js           OKLab/OKLCH helpers shared with server/media/color.js
client/components/        NodeEditor.js  Stage.js  Tools.js  ContextBar.js  Filmstrip.js
                          Sequencer.js   Properties.js  SavePanel.js  Overlay.js
                          Palette.js  ColorPicker.js  TextBox.js  FillEditor.js
server/node/              validate.js (imports client/editor/model.js)  bake.js
server/api/nodes.js       routes S4.1
server/api/locks.js
server/db/nodes.js        node/photo/link/lock statements (all SQL in server/db/)
tests/editor/             model, history, matrix, gestures, pen, shapes, render, validate, bake
```

The server imports `client/editor/model.js` for `validate` (the same module the
browser runs; relative imports, no build), so a document is validated by identical
code on both sides.

---

## 8. Testing

- **Pure units (`bun test`, no DOM):** `model` (validate, commands), `history`,
  `matrix`, `solveSimilarity`, One-Euro, resampler, width model, outline, `pathFrom/
  verticesFrom`, `gridLayout`, `render` snapshots via `preact-render-to-string`.
- **Server:** router with synthetic `Request`s; save transaction (fixtures: portrait
  JPEG with EXIF rotation, PNG with alpha, corrupt file), bake rules (output bytes
  equal input bytes for an in-range JPEG; quality never raised; alpha never JPEG),
  reconcile after a simulated crash, lock expiry with a fake clock, `409` on stale
  `rev`, hostile inputs (huge doc, unknown op, dangling ids, traversal in hash).
- **Browser by hand / headless-Chrome scripts:** touch emulation for gestures; a real
  phone for pressure and multitouch; the checklist in task E64.

---

## 9. Task list

Conventions: `[ ]` open. **C** = client, **S** = server, **C+S** = both. Each task
is one small commit and ends in something you can run, test or look at ("done when").
Do them in order inside a phase; phases A and G (pure code and server storage) can
proceed in parallel. `P` = `PLAN.md`, `G` = `GRAPH.md`, `Y` = `GALLERY.md`.

### Phase A - model and pure code (C+S, no DOM, all unit-tested)

- [x] **E1 `matrix.js`**: `identity, multiply, invert, apply, fromSimilarity, decompose`.
      Done when tests cover identity/inverse/compose and a rotation by 90 degrees.
- [x] **E2 `gestures.solveSimilarity`**: two point pairs -> similarity; one pair ->
      translate. Done when it maps both start points to the current ones within 1e-9.
- [x] **E3 `model.js` constants and ids**: version, limits, `newId()`, `emptyNode()`.
      Done when two thousand ids are unique and the empty node validates.
- [x] **E4 `model.validate`, structure**: `v`, `mode`, pages, step shapes, unknown `op`.
      Done when each malformed fixture returns its specific error code.
- [x] **E5 `model.validate`, references and limits**: dangling `clip/target/shape`,
      >500 steps, >2000 points, path too long, non-finite numbers.
- [x] **E6 `model` commands (pure)**: `addStep, updateStep, removeStep, moveStep(to front/back/index),
      addPage, removePage, movePage, setMode, setTitle`. Each returns a new document.
      Done when tests show the input is never mutated.
- [x] **E7 `model` photo commands**: `addPhoto(doc, hash, info)` (centres, fit extend),
      `setFit`, `setOpacity`, `setBlend`, `setClip/unclip` (removes dangling references on delete).
- [x] **E8 `history.js`**: `create, push, undo, redo, canUndo, canRedo`, max 100,
      coalescing for slider drags. Done when undo after redo after undo restores exact snapshots.
- [x] **E9 `grid.js`**: `gridLayout(n, aspect)` -> matrices for the `grid` mode. Done
      when 1, 2, 5, 9 photos give non-overlapping cells.
- [x] **E10 `pen.js` One-Euro filter**: `oneEuro(minCutoff, beta)`. Done when a noisy
      line is visibly smoothed (test: variance drops) and a fast move is not lagged.
- [x] **E11 `pen.js` resampler and width model**: fixed arc-length resampling;
      `width(pressure, speed)`. Done when output spacing is within 1% of the target.
- [x] **E12 `pen.js` outline**: vendor `perfect-freehand` (`tools/vendor.sh`, `vendor/VERSIONS`);
      points+widths -> outline polygon -> path string. Done when a straight stroke gives an outline
      of the right length with round caps.
- [x] **E13 `shapes.js`**: vendor `bezier-js`; `pathFromVertices`, `verticesFromPath`, vertex ops
      (insert, move, delete, break symmetry), `hitTest(path, point, tolerance)`. Done when the round
      trip is stable for lines and curves and a point near a curve is hit.
- [x] **E14 `render.js` photo step**: ground rect (padding colours) + image + matrix.
      Done when `renderToString` of a one-photo node matches a snapshot (extend and cover).
- [x] **E15 `render.js` stroke, shape, clip, blend, transform ops**. Done when each op
      has a snapshot and a clipped photo yields a `<clipPath>`.
- [x] **E16 `render.js` pages, steps `upTo`, modes** (`free`, `slides`, `grid`). Done
      when `upTo=k` shows exactly the first k steps.
- [x] **E17 `render.js` theme wrapper**: `data-theme` + sanitised `style` attribute (stub
      whitelist until `server/theme.js` exists, then use it). Done when hostile vars are dropped.

### Phase B - server storage (S)

- [x] **E18 `server/db/db.js` + `schema.sql`**: open `data/wb.sqlite3`, WAL, foreign keys,
      `user_version` migrations, tables of `P` S8 incl. graph columns, `node_photos.role`,
      `node_locks`. Done when a fresh start creates the file and a second start is a no-op.
- [x] **E19 `server/db/nodes.js`**: prepared statements `insertNode, getNode, updateNode(rev),
      deleteNode, upsertPhoto, setNodePhotos, links`. Done when unit tests round-trip a node.
- [x] **E20 `server/node/validate.js`**: server validation = `model.validate` + metadata +
      photo existence check. Done when a doc naming a missing hash returns `missing_photo`.
- [x] **E21 `bake.js`, JPEG pass-through**: orientation as lossless `jpegtran`, metadata
      stripped. Done when the output decodes equal pixels to the oriented input and EXIF is gone.
- [x] **E22 `bake.js`, shrink**: long edge > 2048 -> ImageMagick at own `%Q` (90 fallback).
      Done when output quality estimate <= source and long edge = 2048.
- [x] **E23 `bake.js`, non-JPEG and alpha**: opaque -> JPEG q99; alpha -> WebP q99/PNG.
      Done when a PNG with alpha never becomes JPEG.
- [x] **E24 `bake.js`, HEIC display source and ICC note**: baking reads the display
      file; keep non-sRGB ICC if present (decide with `jpegtran -copy icc`). Done when
      a HEIC fixture bakes to JPEG.
- [x] **E25 thumbnail rendition**: square `<hash>.thumb.jpg` with the node's fit applied
      (PoC: first photo step). Done when the file is square and uses the padding colours.
- [x] **E26 `POST /api/nodes`**: validate -> bake -> transaction -> delete uploads after
      commit; error mapping. Done when a node with two uploads appears in the DB and
      the uploads are gone.
- [x] **E27 crash reconcile at start**: remove uploads that also exist in `data/photos`.
      Done when a test that kills the process between steps 2 and 5 ends consistent.
- [x] **E28 `GET /api/nodes/:id`, `/files/photos/...`**: visibility check (PoC: all), cache
      headers by hash. Done when curl returns the document and the baked photo.
- [x] **E29 `PUT /api/nodes/:id` with `rev`**: 409 on mismatch; re-bake only new uploads;
      photos no longer referenced are garbage-collected. Done when two stale puts yield one 409.
- [x] **E30 `DELETE /api/nodes/:id`**: node, `node_photos`, edges, orphan photos. Done when
      no orphan file remains.
- [x] **E31 `server/api/locks.js`**: take/renew/release/break, expiry 60 s, `holder` from a
      session cookie. Done when a fake clock test shows expiry and takeover.
- [x] **E32 SSR read-only page `GET /:lang/node/:id`** using `renderNode`. Done when the
      HTML shows the node without JavaScript.
- [x] **E33 hostile and limits tests**: oversize doc/body, unknown op, dangling ids, bad
      hash/extension, theme injection, zero-byte, tool missing. Done when all return the
      documented codes and leave no stray files.

### Phase C - editor shell (C)

- [x] **E34 single-editor store** `editorStore`: one open editor, `open(id|new)`,
      `close()`, replace-with-prompt hook. Done when opening a second request raises the prompt hook.
- [x] **E35 `NodeEditor` skeleton + "New node" button** in `NewPage`: mounts below the
      upload area, no photos needed. Done when the button opens/closes an empty frame.
      (Mockup exists: `NewNodeTile` as the last upload-grid cell, inert `NodeEditor` frame,
      open state in `NewPage`; E34 replaces the state, E36-E42 fill the frame.)
- [x] **E36 `Stage`**: square SVG `viewBox 0 0 1000 1000`, resize observer, pointer-to-unit
      conversion `toUnits(event)`. Done when a click logs the right unit coordinates at two sizes.
- [x] **E37 tool columns**: buttons with token icons, tool state, keyboard keys, `aria-label`s.
      Done when switching tools highlights the button and the cursor changes.
- [x] **E38 render the document in the stage** via `renderNode` (empty -> blank ground with
      `bg`). Done when changing `bg` in the console redraws.
- [x] **E39 selection model + overlay**: tap selects the top-most step (hit test), outline
      and handles drawn in an overlay `<g>`. Done when tapping two overlapping photos selects the upper.
- [x] **E40 history wiring**: all commands go through `dispatch(command)` that pushes history;
      undo/redo buttons and keys. Done when 10 actions can be undone and redone.
- [x] **E41 title field + properties popover** (title, kind; visibility/group disabled in
      the PoC). Done when title edits are undoable.
- [x] **E42 context bar** (selection-dependent controls). Done when selecting a photo shows fit,
      opacity, blend, order, delete.
- [x] **E43 dirty tracking + draft** (`draft.js`): `localStorage` autosave 3 s, restore/discard
      prompt, `beforeunload`. Done when a reload offers the draft and discarding clears it.
- [x] **E44 editor CSS tokens** in `layout.css`/`kraft.css` (columns, stage outline, handles,
      context bar). Done when no literal colour appears in `layout.css`.

### Phase D - photos (C)

- [x] **E45 drop a card onto the stage** (HTML5 drag): creates a `photo` step, extend, centred.
      Done when dragging a card adds a visible photo.
- [x] **E46 touch drag fallback**: pointer-based ghost drag from card to stage. Done when it works
      on a phone emulation where HTML5 drag does not fire.
- [x] **E47 "add to node" card button** (no drag; opens an editor if none). Done when it works with keyboard only.
- [x] **E48 move/scale/rotate gestures** on the selection: one pointer translate, two pointers
      similarity, wheel zoom, Alt-drag. Done when pinch on the emulator is stable without drift.
- [x] **E49 fit modes** (superseded by the square crop, E98-E101): extend/cover/free, double-tap cycle, ground from `padding`. Done when
      toggling shows the padding gradient and the cropped fill.
- [x] **E50 opacity and blend popover**. Done when blend `multiply` visibly darkens an overlap.
- [x] **E51 z-order** (`[ ]` keys, buttons). Done when a photo goes behind a stroke.
- [x] **E52 delete step** with cleanup of clips pointing at it. Done when undo restores both.
- [x] **E53 film-strip**: appears at >1 photo, select, reorder by drag, remove; scrolls with the
      page. Done when reordering changes draw order and survives undo.
- [x] **E54 palette strip** (UI of S2.3a, after E85-E87): eight swatches under the context bar,
      target chip, tap sets the colour of the active target. Done when a swatch sets the pen colour.

### Phase E - pages, steps, modes (C)

- [x] **E55 pages**: add/remove/reorder, current page, thumbnails. Done when two pages keep separate steps.
- [x] **E56 step scrubber**: `k` slider, play button using `duration`. Done when scrubbing shows steps 0..k.
- [x] **E57 modes**: free / slides / grid switch and rendering. Done when `slides` shows one photo per page.
- [x] **E58 transform steps**: authoring while scrubbing back, animated playback with easing.
      Done when a recorded move replays smoothly.

### Phase F - vector tools (C)

- [x] **E59 pen tool UI**: pointer capture, live stroke in the overlay, commit on up, one history entry;
      colour and base width controls. Done when a stroke from a stylus differs in width from a mouse stroke.
- [x] **E60 shape tool UI**: add vertex, drag handle, close, open/closed, fill/stroke toggles.
      Done when a heart can be drawn with curves.
- [x] **E61 vertex editing** (select/move/delete vertex, handle break). Done when moving a vertex keeps handles.
- [x] **E62 clip / unclip tools**. Done when a photo is masked by a circle (it was first built as a fixed window, the mask now moves with the photo).
- [x] **E63 erase**: select + delete for strokes and shapes. Done when undo brings it back.

### Phase G - save, update, open, lock (C+S)

- [x] **E64 Save button -> `POST`**: busy state, success clears dirty and sets `rev`, uploads leave
      the list, translated errors with retry. Done when a drawn node round-trips to the DB.
- [x] **E65 update -> `PUT`** with `rev`; conflict dialog (keep mine / take theirs / cancel).
      Done when two tabs produce the dialog.
- [x] **E66 open existing node** (`GET`), fill the editor, replace-with-prompt when dirty.
      Done when a saved node reopens identically (pixel snapshot of the stage).
- [x] **E67 lock client** (`lock.js`): take on open, 20 s heartbeat, release on close, lost-lock
      read-only state, banner and owner "break lock". Done when a second tab opens read-only.
- [x] **E68 saved nodes list** on `/new` (SSR, read-only tiles with "Edit"). Done when a saved node appears after reload.
- [x] **E69 delete node** with confirm. Done when files and rows are gone.

### Phase H - theme, texture role, i18n, accessibility, devices

- [ ] **E70 per-node theme picker** (after `TODO` M2b): wrapper changes; sanitiser on save. Done when the
      stage and the saved tile wear `blueprint` while the page wears `kraft`.
- [x] **E71 texture role toggle** in the editor (film-strip entries and the context bar; the upload cards have no texture button, decided 2026-10-23: which photos are textures is decided in the editor); `node_photos.role` saved.
      Done when a texture photo is not drawn as a picture.
- [x] **E72 i18n**: all editor keys in `en`, `de`, `fr`; parity check passes. Done when `check-locales` is green.
- [x] **E73 keyboard and a11y pass**: every command reachable by keyboard, focus order, labels, `role=img`. PageDown/PageUp select steps (or pick the clip mask), `\` cycles corners, arrows move selection/corner/shape cursor, Space places a corner, Enter applies; a live region announces changes, the Keys popover lists them, focus returns to the opener on close. Pointer-only by design: the freehand pen and dragging curve handles.
      Done when the editor is usable without a pointer.
- [ ] **E74 device checklist**: touch emulation, real phone pressure and multitouch, 360 px width, RTL.
      Done when each item is ticked in a short notes file.

### Phase I - 3D gallery additions (C+S, after the PoC; `Y`)

- [ ] **E75 wall layer tool**: flag a shape as wall with a height; closed = room, open = line; corridor
      width; refuse corners sharper than 90 degrees. Done when the editor rejects an acute corner.
- [ ] **E76 `scene3d` validation** in `model.validate` and the sanitiser. Done when bad styles are rejected.
- [ ] **E77 texture set UI**: three slots (walls split/single, room floor, corridor floor) choosing texture photos.
      Done when the chosen photos are stored in `scene.style.texture`.
- [ ] **E78 gallery poster**: the tile of a gallery node is its plan drawn flat. Done when a gallery shows a poster in lists.

### Phase K - colour palette and text boxes (C, with a little S; after phase F)

Colour first (E84-E87 can start any time after E3), then text.

- [x] **E84 shared colour module** `client/color.js`: move `toOklab`, `distance` and friends out of
      `server/media/color.js` (server imports the client module), add `toOklch`, `fromOklch`,
      `clampToSrgb`, hex/rgba parse and format with alpha. Done when the existing server tests still
      pass and round trips hex -> OKLCH -> hex are within 1 unit per channel.
- [x] **E85 `palette.js` dominant colours**: reference-photo choice and D1-D4 with the 0.08 distance rule
      and fill-up. Done when fixtures (a 2-colour photo, an 8-colour photo, a grey photo) give 4 distinct colours.
- [x] **E86 `palette.js` derived colours**: tetradic pair choice and complements T1/T2, triadic completion R,
      neutral N, achromatic rule, gamut clamp. Done when tests check T1/T2 are exactly 180 degrees from
      their sources, R is 120 degrees from both when E1/E2 are 120 apart, and every result is inside sRGB.
- [ ] **E87 `Palette.js` + `ColorPicker.js` components** (swatch grid, long-press picker with hex and alpha).
      Done when the picker returns `#rrggbbaa` and works with touch and keyboard.
- [x] **E88 model: `text` step + `fill`/`colour` validation** (`model.validate`, sanitiser patterns, limits of
      S3.1). Done when invalid fills, too many stops and unknown fonts are rejected.
- [x] **E89 `render.js` text box**: native SVG: `<rect rx>` with `linearGradient`/`radialGradient`
      (`stop-opacity` for alpha) and `<text>`/`<tspan>` per stored line; font by id, size, colour, align,
      padding. Done when `renderToString` snapshots show solid, linear and radial boxes with alpha and the
      output contains no `foreignObject`.
- [x] **E89b line breaking** in `text.js`: `wrap(text, font, size, width)` using `canvas.measureText`
      (injectable measure function so it is unit-testable); stores `lines`. Done when a test with a fake
      fixed-width measure wraps at the right columns and keeps explicit newlines.
- [x] **E90 fonts**: add the `serif` and `sans` faces (woff2 + licence files; candidates in S2.3b "Faces")
      next to Fixed in `static/fonts`, declare in `stylesheet.css`, ids `fixed serif sans` in `text.js`,
      `font-display: swap`; check the licences. Done when a box shows each face.
- [x] **E91 text tool: create** (tap = default box, drag = sized box), in-place `textarea` overlay, commit/discard
      on Esc or tap outside, one history entry. Done when typing in a new box and undoing removes it.
- [ ] **E92 text box handles**: move/scale/rotate by gesture, corner resize that re-wraps. Done when a resize keeps
      the font size and changes the wrap.
- [x] **E93 text context bar**: font, size, align, padding, radius slider. Done when each control changes the box
      live and is one undo step on release.
- [ ] **E94 `FillEditor.js`**: none / solid / linear / radial, angle control, 2-5 stops with position, each stop
      from the palette or picker with alpha. Done when a three-stop gradient with a transparent end is saved.
- [ ] **E95 palette targets for text**: font colour and background take colours from the palette. Done when a
      swatch tap sets the text colour and a long-press sets a background with alpha.
- [ ] **E96 server round trip**: text boxes survive `POST`/`GET`, the sanitiser runs on render. Done when a stored
      box with an injected `font` or `bg` string is dropped.
- [ ] **E97 IME, right-to-left and device pass for text** (Arabic/Hebrew sample, Japanese IME, mobile keyboard
      resize). Done when each sample can be typed, wrapped and saved.

### Phase L - square photos and layout options (decided; implement after E73-E74)

- [x] **E98 crop model**: upload record and photo step get `crop` (0..1, along the long axis); `fit` is dropped
      from the schema (`validate` accepts old `fit`, `load` migrates it); `model.setCrop`; `addPhoto` takes the
      card's crop. Done when a landscape and a portrait photo save and reload with their crop and an old node
      with `fit: cover` still validates.
- [x] **E99 renderer: square crop**: `renderNode` cuts each photo to its square at `crop`; ground rect and
      `extend` removed; same output in SSR, editor, viewer and the thumbnail rendition. Done when snapshots show
      a portrait and a landscape photo as squares at crop 0, 0.5, 1.
- [x] **E100 upload card crop pan**: the card shows the square crop; once the card is selected, drag moves it (an unselected card scrolls the page) (pointer events, one
      axis), `ns-resize`/`ew-resize` cursor on desktop, a double-arrow icon on touch, none for square photos;
      keyboard: arrows on the focused card; the yellow fit triangle is removed; the card's "add" button is the HTML5 drag handle now (dragging the photo pans). Crops are remembered per hash in `localStorage` until uploads carry them. Done when dragging a portrait
      card moves only vertically and the crop reaches the card's "add to node".
- [x] **E101 crop in the editor**: the context bar of a selected non-square photo has a crop slider (left-right or
      top-bottom), one undo step per drag; double-tap puts a photo back to covering the stage. Done when the crop of an added photo can be changed and
      undone.
- [x] **E102 grid layout options**: `doc.layout` `{ fill, gap, columns }`, `gridLayout(n, options)`;
      `fill: 'tight'` covers as much of the stage as possible. Done when 5, 7 and 12 photos with `tight`
      show less background than with `loose` (numbers in the test).
- [ ] **E103 text boxes in grid and slides**: a text box is a cell of the grid (its own square or a spanning
      cell) and a slide page or caption; options in the properties popover. Done when a node with 4 photos and
      2 text boxes lays out in grid and in slides without overlaps. Needs E88+ (text boxes) first.

### Phase M - phone layouts, ownership, recording (2026-10-28)

- [x] **E104 uploads owned by the cookie, with expiry** (`PLAN.md` S6.2): `owners`, `claim`, sweep, list and delete for
      the owner, cookie with the upload lifetime. Done when two browsers see only their own uploads
      (`tests/uploads-owner.test.js`).
- [x] **E105 orientation layouts** (S2.2a): portrait full-width stage with tool rows; landscape one-window surface with tool
      strips, stage and a three-tab panel; no frame, background or margin. Done on a 360 x 669 phone and a desktop.
- [x] **E106 keys button hidden on touch.**
- [x] **E107 usage recording** (`PLAN.md` S6.4): client events, `POST /api/events`, `data/events/*.jsonl`, `tools/events-report.js`.
- [ ] **E108 device pass of the new layouts** on the phone in both orientations and 2-3 other browsers (part of E74).
- [ ] **E109 read-only dimming in landscape** (the `inert` frame uses `display: contents`, so the opacity rule has no effect).
- [ ] **E110 dark theme or dark-aware tokens** (the test phone prefers dark; the theme is light only).
- [x] **E111 upload retention shown to the user** (2026-10-29): a note under the drop zone (days kept, who sees what, what happens on save) with a details list; an expiry badge on a card when it has 3 days or less left; a sweep tile (`DELETE /api/uploads` with `keep`: the photos of the open editor and of stored drafts stay; asked once in place); the saved banner says how many photos are now kept and that the work is public. The server also removes orphaned upload files and old job leftovers (`sweepOrphans`, hourly with the expiry sweep). No "keep" button: saving into a work is the way to keep a photo.
- [x] **E112 first placement** (agreed): photos added from a batch in free mode arrive as a diagonal cascade of half-stage squares: photo i (0-based, also when added later) at (i mod 6) x 10 % of the stage in x and y plus 3 % per completed round (wrap-around), last on top; no spread button, no question; layer count on the page thumbnail (`UX-REQUIREMENTS.md` I2). Pure function `cascade(i)` in `client/editor/`, tested. Done 2026-10-29: `client/editor/cascade.js` `cascade(i)` and `photosOnPage`, `addPhoto` takes a matrix (`model.js`, command `addPhoto` field `m`), `NodeEditor.addUpload` counts up through a batch. A single photo alone on an empty page still covers the stage (author did not decide; cascade starts with the second photo). Page-thumbnail layer count not built (the cascade shows the layers). Checked in a browser with two photos; 6 tests in `tests/cascade.test.js`.
- [x] **E113 touch transform** (agreed 2026-10-28): corner handles 32 CSS px on `pointer: coarse` (desktop 10 px); round rotate handle above the selection and scale -/+, rotate left/right buttons in the context bar, on every device (I4). Done 2026-10-29: `client/editor/handles.js` (handle positions kept inside the stage, hit test, `scaleDrag` about the opposite corner, `rotateDrag` about the centre, `nudge` steps of 10 % and 15 degrees; 11 tests), corner handles are draggable and 32 px on `pointer: coarse` (10 px otherwise), the round turning handle above the top edge (moved inside the stage for a photo that fills it), the buttons smaller / larger / turn left / turn right in the context bar for every step type, one undo step per button press or drag. Checked in a desktop browser (button, corner drag, turning drag); the 32 px touch size is only the media query, not yet seen on the phone.
- [ ] **E114 simple clip**: clip tool with only a photo selected: freehand drawing closes into a polygon and becomes the clip; rectangle/ellipse choice in the context bar; shape-first clip stays (I5, C1; supersedes the open question in S2.3 Clip).
- [x] **E115 clip preview** (agreed): the clipped-away part ghosted (about 25 %, thin outline) only while the clip tool is active and a clipped photo is selected, also while dragging clip handles; otherwise WYSIWYG (I6).
- [x] **E116 edit clip in place** (agreed): clip tool + clipped photo = edit mode: outline with vertex handles, no unclip needed; mode switch replace / add / subtract for new closed strokes, wand taps and cell picks (default replace, agreed); unclip stays. Move switch on a clipped photo (agreed): both (default) / picture / window, applies to drag, pinch and the E113 buttons.
- [ ] **E117 auto clip and cut out in the browser** (idea 2026-10-28): contour and grabCut via opencv.js WASM on a downscaled copy, result stored as a clip polygon; load on first use, working state and cancel. Server mirror in `opencv-imgproc.js` (`opencv-imgproc.md`). Needs a browser test with real photos first (`lib/opencv.js` was only checked by symbol search).
- [ ] **E118 trimmed opencv.js build**: custom build (core + imgproc, needed functions only), separate `.wasm`, gzip, lazy load. The current `lib/opencv-5.0.js` is 16 MB (WASM 12 MB, 3.3 MB gzipped).
- [~] **E119 magic wand** (revised 2026-10-29; first version built: tool W, `POST /api/segment` streams the tool's NDJSON, `client/editor/wand.js` maps taps and the returned outline, the result becomes the photo's polygon clip, one undo step for preview + final; waiting for the tool's `--view-size` / `--phases preview,final`; Alt-tap = negative point; the models dir comes from `WB_MODELS_DIR`): uses only `opencv-imgproc.js` tap-to-segment (`prepare` after upload, `segment --point ...` per tap, candidates for "bigger / smaller"), no browser engine; needs E128 (job progress and cancel) and E127 (apply the result: vector clip from the returned outline, or the soft cut); add / subtract / invert taps send all points again (stateless). Blocked on the tool. Replaces the plain-JS superpixel plan (`client/editor/superpixels.js`, `wand.js` are not written).
- [ ] **E120 Voronoi/Delaunay pick clip** (wanted): 6-24 seeds, tap cells to keep, their union is the clip polygon. Few cells on purpose (no tiny fragments).
- [ ] **E121 freehand intent detection** (wanted, replaces a scissor tool): clip tool, photo selected: closing stroke = closed clip, edge-to-edge stroke = cut into two photo copies with one side each, anything else (not closed, or not exactly two crossings) = discarded with a hint, never auto-closed (agreed). Cut is tolerant (author 2026-10-29): a stroke at a corner is valid (nudged to either side), a piece under 2 % (`MIN_PIECE`) is refused; `cutByStroke(poly, stroke, reach)` extends ends that tend to the border along their heading (reach about 24 px), so a photo fitted to the stage can be cut by a stroke wholly inside it. Step 1 done (2026-10-29): `client/editor/polygon.js` `splitByLine(poly, stroke)` (exactly two crossings, the part between inside and not tangled, a crossing at a vertex is ambiguous and gives null; tests in `tests/polygon.test.js`). Step 2 done (2026-10-29), wired into the clip tool: `client/editor/clipstroke.js` `clipFromStroke` classifies a stroke (tap / closed / cut / none; closing = about 300 degrees of turning and the end back near the start), `client/editor/clipping.js` `clipPolygon` and `cutPhoto` (commands `clipPolygon`, `cutPhoto`, one undo step each), `NodeEditor.js` draws the stroke live (dashed) and shows the hint "Close the shape, or draw across the photo" for anything else. Tapping a shape still masks as before. A cut makes a photo copy right above the original, each with the clip of one side; an old clip shape nobody uses any more is removed. Checked in a browser with a real stroke from edge to edge: two photos, two clips sharing the cut line. The closed loop is covered by tests (a loop could not be drawn with the test tool). Still to do: the polygon booleans for add/subtract clip modes, the clip-mode switch (replace/add/subtract), E115 ghost preview, E116 clip handles.
- [x] **E122 multi-outline clip, split clip, colour segmentation clips** (wanted): a clip with several closed outlines; "split" makes one clip and photo copy per outline.
- [x] **E123 edge decoration** (agreed 2026-10-29): `edge: { style: plain|paper|sticker|torn|polaroid, amount, seed }` on a photo step; pure `edgeShapes(step)` in `client/editor/` (polygon offset, seeded tear, stepped shadow), used by `render.js` so the editor, the viewer and the server render the same; validated in `validate.js`; Edge popover in the context bar (presets, size slider, new tear, all pieces). Polygons with fill and opacity only, no filters. Tests: same seed gives the same polygon, offset keeps the clip, `validate` bounds.
- [ ] **E124 loupe** (approved 2026-10-29): a magnifier above the finger while drawing a clip or dragging a handle on touch (`UX-REQUIREMENTS.md` J1.2).
- [x] **E125 export as image** (approved 2026-10-29): PNG/JPG of the work from the render, in the browser (SVG rasterised) and later on the server (`opencv-imgproc.js`); a button after Save (J1.13). Done 2026-10-29 (browser part): header button "Export" with PNG and JPG, `client/editor/export.js` (`documentSvg` = `renderStage` through the vendored preact-render-to-string, `inlineImages` because an SVG drawn as an image may not load files, `withSize` 2000 px, `exportImage` draws on a canvas and saves via a link, file name from the title; JPG paints the document background first). Checked in a browser without saving a file (a 2000 x 2000 PNG of 1.5 MB with the expected pixels). Still open: the server render of the same picture (`opencv-imgproc.js`), a share action, an export size choice, and an Export entry after Save. 7 tests in `tests/export.test.js`.
- [x] **E126 duplicate and flip** (approved 2026-10-29): context bar buttons: duplicate a photo (offset by one cascade step), flip horizontally and vertically (J1.3). Done 2026-10-29: context bar button "Duplicate" (photos) and flip left-right / top-bottom buttons (photos, strokes, shapes; not text) next to the E113 buttons; `duplicatePhoto` in `client/editor/clipping.js` (command `duplicatePhoto`; the copy sits right above the photo, one cascade step down and right, selected, with a clip shape of its own; nothing when the page is full); flips are mirror matrices about the selection centre (`nudge('flipH'|'flipV')` in `handles.js`), one undo step each. Checked in a browser. Tests in `tests/clipstroke.test.js`, `tests/handles.test.js`.
- [~] **E127 apply a server cutout** (first version built: Remove background button, `POST /api/cutout` streams `derived` uploads for the quick and the sharp cut, `replacePhoto` swaps the photo's image and keeps `orig` so Restore original works and the node keeps the original photo; one undo step; open: wand final pass as soft cut, choosing a subject): (proposal, `UX-REQUIREMENTS.md` J5, tool contract `opencv-imgproc.md` S14): command `cutout` replaces a photo step with a `rest` step and one `cut` step per subject at the same matrix plus offset; derived uploads with provenance on the server; one undo step; tap-to-segment preview with add/subtract/bigger-smaller. Blocked on the tool (`opencv-imgproc.js` models, `prepare`/`segment`).
- [ ] **E129 text as clip** (postponed 2026-10-29): glyph outlines from the same font files the text uses (opentype.js, vendored), converted to one compound path when the clip is made (needs E122: several outlines, holes by even-odd), and used as the clip of a photo. Letters on a curved baseline (E130) are placed glyph by glyph along the curve.
- [~] **E130 curved text baseline** (agreed 2026-10-29; slider version built, handles open): a `text` step may carry `curve: { p0, c0, c1, p1 }` (stage-local units); the text is drawn with `<textPath>`, one line only. Default is symmetric (one bend gesture: handles mirror each other), free handles are an advanced mode. Rules: total tangent turning at most 180 degrees; each handle points towards the other end and is no longer than the distance between the ends (no loops or cusps); radius of curvature at least 1.5 x font size (the text would collide on the inside); one bend only (no S) for now; text longer than the curve scales down to fit (minimum font size) instead of being cut off; the curve is not shorter than a fraction of the text; while dragging a handle is clamped to the nearest allowed position with a faint limit arc; snaps to straight within a few degrees; double-tap on a handle resets. No general warp (arch/wave envelopes) is planned. Check that the server's rasteriser draws `<textPath>` (thumbnails).
- [~] **E128 server jobs: progress and cancel** (2026-10-29: the background removal has a Cancel button, the pure rule `client/editor/job.js blocked` refuses delete, cut, duplicate, clip, crop, role and replace on the photo while it runs, and the job is dropped when the photo is undone away; open: the wand job, a leave-editor confirm, one runner for both) (agreed 2026-10-29, `UX-REQUIREMENTS.md` J6): streaming NDJSON endpoint (server forwards `opencv-imgproc.js --progress`, aborts kill the tool), client job runner (`client/editor/job.js`: one job at a time, progress state, AbortController), status-line progress with Cancel, busy outline on the photo, a pure `busy(doc, job)` rule that disables the blocked commands on the target photo (delete, cut, clip, crop, role, duplicate, another job) while everything else stays editable; auto-cancel when the target is undone away; leave-editor confirm. Tests: the blocked-command rule, the stale-result check.
- [ ] The requirements of `UX-REQUIREMENTS.md` (B paged uploads and two screens, C freehand clip, D batch to nodes, E three
      depths, F text box extensions) are **not tasks yet**: they are agreed one by one, then added here.

### Phase J - later (not scheduled)

- [ ] **E79 text boxes**: now phase K (E88-E97).
- [ ] **E80 fields** (`fields` list in the properties popover).
- [ ] **E81 cutout and server-side clip buttons** (`opencv-imgproc.md`, only with `capabilities.imgproc`).
- [ ] **E82 server-side tile rasterisation** (`G` S3.7) replacing the thumbnail rendition.
- [ ] **E83 `$1`/`$P` shape snapping**, handwriting recognition.

---

## 10. Open points

7. **Crop zoom - DECIDED 2026-10-23**: no zoom. The crop window is always the largest square and is only
   panned along the long axis (`crop` is one number). Scaling a photo up is done on the stage with its matrix.
8. **Text box in grid mode - DECIDED 2026-10-23**: its own cell (size 1 or a span of 2), styled like any text
   box: a card with background and border, or borderless and without background so it works as a caption
   next to or between photos.
9. **Grid `tight` - DECIDED 2026-10-23**: cells stay squares; the best column count (least wasted stage),
   centred, gap as small as `gap`. Cells never stretch.

1. **ICC profiles** (decided at E24): a non-sRGB profile is kept, an sRGB one or none is
   dropped. This `jpegtran` has no `-copy icc`, so the profile is put back with `exiftool`.
2. **Undo across saves** is allowed (S2.6); confirm that is what you want.
3. **Slides/grid transitions**: which simple transitions? (fade only, proposed.)
4. **Fonts**: roles decided - Fixed, one artistic book serif, one slick smooth sans (not Caslon/Open Sans
   any more). The exact faces are open, see S2.3b "Faces" for the candidates; licences and woff2 sources are
   checked in E90.
5. **Palette thresholds** (washed out C < 0.05, dirty dark L < 0.35 and C < 0.09) need tuning on real photos.
6. **Server-side tile rasteriser**: rsvg, cairo or Inkscape (only Inkscape is installed here); decide when
   E82 is built. Text is native SVG so any of them works.
5. **Photo ordering vs z-order**: the film-strip order mirrors step order for photos only;
   confirm that dragging in the strip must not move strokes.
7. **Stage maximum size** on very large screens (90 vmin proposed).

- [x] **E131 clipboard** (2026-10-29): Copy, Cut, Paste in the context bar and Ctrl+C/X/V. A copy writes the visible part of the step as a transparent PNG, a text box's words as `text/plain` and styled `text/html`, and the step itself (matrix and clip shape included) as JSON in a `data-wb-clip` attribute of the html part, so a paste in another page or node gets it back exactly. Paste takes our own step, else an image (uploaded like a chosen file, added as a photo), else text (a new text box). A payload is checked by the document validator before it is applied. Later: SVG out (`image/svg+xml`, PNG fallback) for shapes and strokes, SVG in as a picture, several steps at once.

- [x] **E132 scene palette** (2026-10-29): the swatches of the palette and of Properties / Background come from the colours of the page as drawn (96 px canvas, visible pixels counted, look-alikes merged, redrawn 0.5 s after the document rests and only while something shows them), not from one photo's stored palette, which includes removed backgrounds and covered parts. A second row offers the colours the node already uses. Properties / Background offers the swatches plus black, white and "Other colour" (the system picker). Open: the palette for text colour, the palette of a selected photo alone (`scenePalette(doc, options, id)` exists), a tap-to-sample eyedropper (undecided).
- [x] **E133 drawings and text in slides** (2026-10-29): in `slides` mode the pen, shape and text tools and the select tool work on the drawings of a slide; the photo is laid out by the mode and cannot be picked. A drawing belongs to the photo before it on its page (up to the next photo, `render.js slideOf`); a new drawing is inserted right after the slide's last one, so it stays on that slide, and the order buttons stay inside it. The editor works on `slideView(doc, slide)` (the slide's drawings alone on page 0, everything else behind them so ids stay unique); rendering, export and the slide strip use the real document. No schema change: in `free` the same steps are ordinary steps over their photo, and `grid` still shows photos only. Clip, unclip and wand are disabled on a slide; paste is off there (it appends to a page). Open: a drawing belongs to the photo before it even when that photo sits elsewhere in `free`.
- [x] **E134 text box vertical padding** (2026-10-29): the text block, from the top of the first capitals to the last baseline, is centred in the box (`text.js firstBaseline`, per-face `asc` `desc` `cap` in em), so the space above equals the space below whatever the face's line metrics (EB Garamond's ascent plus descent is more than the line height, which left almost nothing under the last line). Stored boxes need no change: the text moves inside the stored height; the editing textarea pads its top to meet the drawn text.
- [x] **E135 viewer flows** (2026-10-29): `layout.flow` (`fit` | `page` | `scroll`) and `layout.axis` (`h` | `v`), both optional, say how the viewer (`NodeView.js`, used by `/node/:id`) shows a node; the editor stage still shows everything at once. `free`: one stage per page, `slides`: one per photo, as a track that **pages** (scroll-snap, Previous / Next and "n / count") or **scrolls**, horizontally (default for pages) or vertically (default for scrolling). `grid`: `fit` is the old square with all photos, `page` pages of cols x cols (3 x 3 when automatic), `scroll` one long stage with `cols` photos across (axis `v`) or high (axis `h`) and as many rows or columns as needed (`grid.js gridPlan`, `renderStage(..., { part })` with a non-square viewBox). The viewer used to show page 1 only of a multi-page free node: it pages now. Editor: Viewer (All / Pages / Scroll) and Direction chips next to the mode. Open: swipe-driven page indicator dots, a grid page size other than cols x cols, autoplay.
- [x] **E136 location from EXIF** (2026-10-29, `GRAPH.md` S1.5): `probe.js` reduces the GPS tags (exiftool numeric, exiv2 degrees or rationals) to `pos = { lat, lon }` rounded to two decimals (about 1 km) on the ingest record next to `exif`; every GPS tag is dropped from the `exif` dump, so the exact position is not kept anywhere Test: a fixture with GPS gives `pos`, one without gives none, `bake` output has no GPS tag.
- [x] **E137 place chip** (2026-10-29): `client/components/PlaceChip.js` under the context bar, helpers in `client/editor/places.js`. For each distinct `pos` of the photos on the node's pages it asks `GET /api/places/near` and shows "taken near <place>" with *Link to place* and *Not now*; accepting runs `POST /api/places` then the `link` op with label `at`. Never a dialog or an automatic edge. Answers (link or dismiss) are remembered in `localStorage` per node id and place (`wb.places.answered`; an unsaved node counts as `draft`). On an unsaved node the accept is queued ("will be linked when the node is saved") and sent once the node has an id. A node loaded from the server has no `pos` (the baked photo is clean), so the chip only appears while the photo is an upload in this session.
- [x] **E138 place lookup** (2026-10-29): `server/api/places.js`; `GET /api/places/near?lat=&lon=` finds without creating (`{ id|null, title }`), `POST /api/places { lat, lon }` finds or creates (201 / 200); a position within 5 km of a gazetteer entry (starter list of Swiss cities in the file) is that locality, otherwise a cell titled by its rounded coordinates (`47.27, 8.01`); the node is a child of `places` and holds only its title. No `places` node: 409 `no_places_root` (run `tools/seed.js`). Cells are the fixed 0.01 grid, so two positions 300 m apart can still straddle a cell edge and give two places; the gazetteer radius hides this in towns.
- [x] **E139 camera photo location** (2026-10-29): the upload area has a *Take a photo* button (`<input capture=environment>`) and a *Tag the photo with my location* checkbox, off on every visit. With it on, `navigator.geolocation` (low accuracy, 8 s) is asked when the photo is taken, rounded to two decimals in the browser and sent as the `X-Position: lat,lon` header; the server (`cleanPosition`, `uploads.js`) validates and rounds again and stores it as the record's `pos`, so the chip (E137) works the same as for an EXIF position. The photo's own EXIF position wins; the tag only fills a gap; nothing is written into the image. Denied, unavailable or timed out: no `pos`, no message. A pick from the file dialog is never tagged.
- [x] **E140 bulk place links in the graph** (2026-10-29): *Suggest places* in the graph toolbar opens `PlaceSuggestions.js`: each saved node whose photos were taken at a place it is not linked to, with the place ("Photos of X were taken near Y"), *Link* / *Not now* per row and *Link all* / *Not now, all*. The source is `place_suggestions` (migration 2): `saveNew` / `saveUpdate` store the rounded `pos` of the node's uploads before the sidecars go; `GET /api/places/suggestions` lists the open ones (a node already linked to the place is left out); `POST` with `{ ops: [{ op: 'accept' | 'dismiss', node, lat, lon }] }` links with `at` (finding or creating the place, E138) or just drops the row, and answers with the new list and the graph. A row is deleted when answered, so a dismissed place is not suggested again unless a new upload brings the position back. The chip's own *Not now* (E137) is per browser and does not touch the rows. `at` edges are drawn dotted.
