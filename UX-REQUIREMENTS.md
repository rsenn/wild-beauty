# UX-REQUIREMENTS.md - open items of the brainstorm of 2026-10-27

Source: `~/Desktop/wild-beauty-prompt.txt`. Only what is **not built yet** is kept here. What
was built and decided (test devices, landscape tryouts, the collage workflow, clip and cut,
edge decoration, server cutout, jobs, wand) moved to `EDITOR.md` S2.12; the tasks are E104-E139
in `EDITOR.md` S9 and the open threads in `TODO.md`. Nothing here is decided until an item is
marked **agreed**; agreed items are merged into `EDITOR.md` and `TODO.md`.

Status keys: `open` (to walk through), `agreed`, `postponed`, `rejected`.
The device-agnostic rules (layout follows measurement, touch minimum, `dvh`, every gesture has a
button) are in `EDITOR.md` S2.12.

## A. Follow-up

- What if the `wb-session` cookie is lost (uploads unreachable until they expire)? The retention itself
  is shown (E111); there is no "keep" button, saving into a work keeps a photo.

## B. Upload screen and editor screen

| # | Requirement (my reading) | Status |
|---|---|---|
| B1 | **Selection = batch.** The picked photos in the upload area are the set that goes into the editor. (The "Create from n selected" tile is built, S2.12; the rest is not decided.) | postponed (revisit after B2-B6) |
| B2 | **Paged uploads, fixed height.** The upload area shows as many cards as fit beside the drop zone in one screen height and pages through the rest (no long list, fast on 40-80+ uploads). | open |
| B3 | **Two screens instead of one scroll.** Uploads is screen 1, editor is screen 2 (one screen height each). | direction agreed, details open |
| B4 | **Navigation between the screens.** Buttons ("Add n photos" tile to the editor; "add photos" back), plus swipe: top middle of the editor back to uploads, lower middle of uploads to the editor. | open |
| B5 | **Locked editor.** No page scroll while the editor is shown; the stage owns every touch, also outside its rectangle. | open |
| B6 | Drag and drop and scrolling are kept; fewer cards per page (B2) should make drag fluent. | open (how drag works across two screens) |

Touches: `EDITOR.md` S2.1, S2.2, S2.5; `TODO.md` E45-E47, M4/M7, E74; `client/ghostdrag.js`,
`UploadArea.js`, `UploadCard.js`, `Stage.js`.

## C. Drawing

| # | Requirement | Status |
|---|---|---|
| C1 | **Freehand clip as the simple path** (E114): clip tool with only a photo selected, a stroke closes into a polygon and becomes the clip; a rectangle / ellipse / lasso choice in the context bar. The stroke classification (E121) is built; the context bar choice is not. | open |

## D. Outcome of a batch: node granularity

| # | Requirement (my reading) | Status |
|---|---|---|
| D1 | From N selected photos the user chooses what is made: (a) one node, one composition; (b) one node, a slideshow/gallery; (c) one node **per photo** (N nodes). | open |
| D2 | (c) builds a subgraph: the N nodes get a category/parent edge; also "add several new items to different categories". | open |
| D3 | The editor is conceptually decoupled from the graph node it edits. | open |

Touches: `EDITOR.md` S3, S4 (one POST per node, batch?), S3.4; `GRAPH.md`.

## E. Editor model: three depths of grouping (biggest change)

| # | Requirement (my reading) | Status |
|---|---|---|
| E1 | The document is a tree of at most **3 depths**; each level is read as sequence, composition or animation, the meaning only in the view. | open |
| E2 | The editor and the film-strip are **views** into that tree: show one depth, descend into a group and ascend again. Viewing never changes the stored state. | open |
| E3 | Collage use: clip/warp a photo "outside the arrangement" without bringing it to front, by descending into it. | open |
| E4 | Today's `pages[].steps[]` (2 depths), the modes free/slides/grid and the scrubber must map onto it. | open |

Touches: `EDITOR.md` S2.7, S3.1, E55-E58, E102/E103; `PageStrip.js`, `SlideStrip.js`, `Scrubber.js`,
`render.js`, `model.js`, `validate.js`.

## F. Text box extensions (phase K, E88-E97)

| # | Requirement | Status |
|---|---|---|
| F1 | Active content in a box: a running web game (itch.io, Ludum Dare) or a retro emulator. | open |
| F2 | Paste HTML/SVG from the clipboard, broken apart and remixed into steps. (The SVG clipboard in and out is built, E131; the remix is not.) | open |
| F3 | A caption rendered along/into a shape that can be warped. (Curved baseline: E130.) | open |
| F4 | Built-in embeds: currency conversion, shipping + VAT calculator, PayPal payment. | open |

Security-relevant (F1, F2, F4: sandboxing, sanitiser, payments); likely postponed behind the basic text box.

## G. Method

| # | Requirement | Status |
|---|---|---|
| G1 | Workflows are specified by **use cases** first (gallery of exhibits for sale; an artist drawing for days), before screens: a `USECASES.md` or an `EDITOR.md` chapter. | open |
| G2 | Two ends of one spectrum: the everyday batch exhibitor needs a no-brainer path, the artist needs the full editor. Same UI, the simple path is the default. | open |
| G3 | The user is free in how to structure the result (see D1). | open |

## H. Open questions from the landscape tryouts

- The theme is light only while the test phone prefers dark (E110, TODO).
- Fullscreen / an installed web app (`display: standalone`) would remove the address bar altogether; not tried.
- Optional: a feedback link that attaches browser, viewport and orientation (no personal data).

## J. Collage artist wish list: what is still open

Column **needs**: `js` = plain JS, `cv` = opencv.js (12 MB WASM, lazy) or the server tool, `doc` = data model
change, `phone` = a phone-specific problem. Built from this list: J1.2 loupe (E124, waits for a device), J1.3
duplicate and flip (E126), J1.7/J1.8/J2.7 edge decoration and shadow (E123), J1.13 export (E125), J2.1/J2.2
cutout and cut apart (E127, E122), J2.10 magnetic lasso is in TODO.

| # | Wish | Needs | Note |
|---|---|---|---|
| J1.1 | Zoom and pan the stage view, separate from transforming the selection | phone | **postponed** (the loupe covers "the finger hides the point"); would need a view-zoom button or a two-finger gesture when nothing is selected and a "fit view" button |
| J1.4 | Multi-select and group (move, scale, rotate several together) | doc | group = a step container (touches E); TODO "copy several steps" needs it too |
| J1.5 | Layer list with drag reorder, hide, lock | js | the filmstrip is it partly; hide and lock are missing |
| J1.6 | Align, distribute, snap to edges/centres/stage; snap guides | js | on the phone: snap only, no ruler UI |
| J1.9 | Perspective / 4-corner warp, skew | doc | touch handles at the corners |
| J1.10 | Photo adjustments: brightness, contrast, saturation, hue, black and white, duotone/tint | js | non-destructive values in the step |
| J1.11 | Stage background: colour, paper/texture (texture role exists), size/aspect of the work | doc | today a square of 1000 units; portrait/landscape/square matters for printing |
| J1.12 | Text as clip: the photo shows through letters | js | E129, postponed. No FreeType in the opencv build; convert the letters to a path when the clip is made (opentype.js, not yet vendored) so the editor, viewer and server render an ordinary polygon with no font dependency |
| J1.14 | Save as copy, keep versions | doc | "branch before I try this" |
| J2.3 | **Auto-arrange by criterion**: dominant colour (rainbow order), brightness, size, aspect, colour clusters | cv/js | layouts: cascade, grid, ring, spiral, pile, treemap/mosaic packing, along a drawn line |
| J2.4 | Colour harmony: match tone between photos, extract a palette, tint the background | cv/js | palette extraction exists (E132) |
| J2.5 | **Vector companions** from a photo: contour lines, silhouette fills, posterised regions, halftone dots, hatching, low-poly Voronoi/Delaunay | cv/js | steps of op `shape`/`stroke`, editable and the same on the server |
| J2.6 | Repeat patterns: echo/trail copies, mirror symmetry (kaleidoscope), tiling | js | duplicate with a transform step |
| J2.8 | "Surprise me": re-roll arrangement, rotation and style with a seed; undo steps back | js | deterministic per seed |
| J2.9 | Remove an object / fill (inpaint) | cv | check the trimmed build before promising |
| J2.11 | Voronoi/Delaunay pick clip (E120): 6-24 seeds, tap the cells to keep | js | few cells on purpose |
| J2.12 | Superpixel pick: tap or paint edge-following regions to keep, traced to a polygon (the model cutout is far better for fur, see `EDITOR.md` S2.12) | cv | candidates for the one-button cutout: salient-object models (U2-Net, IS-Net, RMBG), tap-to-segment (SAM) |

Cross-cutting: the hidden risk on the phone is J1.2 without J1.1, so every clip is coarse until the loupe
is tried on a device. Anything that goes into a step (clip, shadow, rim) is rendered from the same
document by `render.js`, so no effect may need a browser filter.

## Walk-through order

1. B1-B6 (screens and selection: everything else sits on it)
2. G1-G3 use cases (decide D and E on real workflows)
3. D1-D3
4. E1-E4
5. C1
6. F1-F4
7. A follow-up
8. Merge agreed items into `EDITOR.md` and `TODO.md`
