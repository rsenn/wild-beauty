# UX-REQUIREMENTS.md - open requirements, by use case

Source: the brainstorm of 2026-10-27 (`~/Desktop/wild-beauty-prompt.txt`) and the sessions after it.
Only what is **not built yet** is kept here. What was built and decided (test devices, landscape tryouts,
the collage workflow, clip and cut, edge decoration, server cutout, jobs, wand) is in `EDITOR.md` S2.12;
tasks are E104-E139 in `EDITOR.md` S9, open threads in `TODO.md`.

## How to read this

- Requirements are grouped by **use case** (what a person is trying to do), not by screen. Workflows
  are specified by use case first, screens follow (this was requirement G1).
- Every use case has the same two ends (former G2): a **simple path**, a few taps for the everyday
  user, which is the default; and an **expert path**, the full editor for someone who stays days in one
  piece. The same UI serves both.
- The user is free in how to structure the result (former G3, see UC4 and UC3).
- Requirement ids keep their old names (B2, E1, J1.4 ...) so `EDITOR.md`, `TODO.md` and the history
  still find them. The index at the end lists each id once.
- Status: `open` (to walk through), `agreed`, `postponed`, `rejected`. Nothing is decided until it is
  marked **agreed**; agreed items are merged into `EDITOR.md` and `TODO.md`.
- A use case marked **proposed** was not in the brainstorm: it is a suggestion for you to accept, change
  or drop. Its requirements are only pointers to existing ones.
- Column **needs**: `js` plain JS, `cv` opencv.js (12 MB WASM, lazy) or the server tool, `doc` data
  model change, `phone` a phone-specific problem.

---

## 0. Platform: applies to every use case

The device-agnostic rules (layout follows measurement, touch minimum, `dvh`, every gesture has a visible
button) are in `EDITOR.md` S2.12. Open here:

| # | Requirement | Status |
|---|---|---|
| B2 | **Paged uploads, fixed height.** The upload area shows as many cards as fit beside the drop zone in one screen height and pages through the rest (no long list, fast on 40-80+ uploads). | open |
| B3 | **Two screens instead of one scroll.** Uploads is screen 1, editor is screen 2 (one screen height each). | direction agreed, details open |
| B4 | **Navigation between the screens.** Buttons ("Add n photos" tile to the editor; "add photos" back), plus swipe: top middle of the editor back to uploads, lower middle of uploads to the editor. | open |
| B5 | **Locked editor.** No page scroll while the editor is shown; the stage owns every touch, also outside its rectangle. | open |
| B6 | Drag and drop and scrolling are kept; fewer cards per page (B2) should make drag fluent. | open (how drag works across two screens) |
| A1 | What if the `wb-session` cookie is lost (uploads unreachable until they expire)? The retention itself is shown (E111); there is no "keep" button, saving into a work keeps a photo. | open |
| H1 | The theme is light only while the test phone prefers dark (E110, TODO). | open |
| H2 | Fullscreen / an installed web app (`display: standalone`) would remove the address bar altogether; not tried. | open |
| H3 | Optional feedback link that attaches browser, viewport and orientation (no personal data). | open |

Touches: `EDITOR.md` S2.1, S2.2, S2.5; `TODO.md` E45-E47, M4/M7, E74; `client/ghostdrag.js`,
`UploadArea.js`, `UploadCard.js`, `Stage.js`.

---

## UC1. Collage: one picture composed of many pieces

**Who and why.** An artist arranges several photos, each moved, scaled, turned and clipped, until it
fits. Often a phone, often trial and error. Built: cascade placement, touch transform, freehand clip
and cut, edit clip in place, edge styles, background removal, export (`EDITOR.md` S2.12).

**Simple path:** pick photos, "Create from n selected", drag them apart, clip with a stroke, Save.
**Expert path:** shape-first clips with bezier handles, polygon combine, server cutout and wand.

| # | Requirement | Needs | Status |
|---|---|---|---|
| C1 | **Freehand clip as the simple path** (E114): clip tool with only a photo selected, a stroke closes into a polygon and becomes the clip; a rectangle / ellipse / lasso choice in the context bar. The stroke classification (E121) is built; the context bar choice is not. | js | open |
| E3 | Clip/warp a photo "outside the arrangement" without bringing it to front, by descending into it (needs the depths of UC3). | doc | open |
| J1.1 | Zoom and pan the stage view, separate from transforming the selection. A view-zoom button or a two-finger gesture when nothing is selected, plus a "fit view" button. The loupe (E124) covers "the finger hides the point". | phone | **postponed** |
| J1.4 | Multi-select and group (move, scale, rotate several together). Group = a step container (touches E1); TODO "copy several steps" needs it too. | doc | open |
| J1.5 | Layer list with drag reorder, hide, lock (the filmstrip is it partly; hide and lock are missing). | js | open |
| J1.6 | Align, distribute, snap to edges/centres/stage, snap guides. On the phone: snap only, no ruler UI. | js | open |
| J1.9 | Perspective / 4-corner warp, skew, with touch handles at the corners. | doc | open |
| J1.10 | Photo adjustments: brightness, contrast, saturation, hue, black and white, duotone/tint, non-destructive values in the step. | js | open |
| J1.12 | **Text as clip**: the photo shows through letters (E129). No FreeType in the opencv build; convert the letters to a path when the clip is made (opentype.js, not yet vendored) so editor, viewer and server render an ordinary polygon with no font dependency. | js | **postponed** |
| J1.14 | Save as copy, keep versions ("branch before I try this"). | doc | open |
| J2.3 | **Auto-arrange by criterion**: dominant colour (rainbow order), brightness, size, aspect, colour clusters; layouts cascade, grid, ring, spiral, pile, treemap/mosaic packing, along a drawn line. | cv/js | open |
| J2.4 | Colour harmony: match tone between photos, extract a palette, tint the background (palette extraction exists, E132). | cv/js | open |
| J2.5 | **Vector companions** from a photo: contour lines, silhouette fills, posterised regions, halftone dots, hatching, low-poly Voronoi/Delaunay, as editable steps of op `shape`/`stroke`. | cv/js | open |
| J2.6 | Repeat patterns: echo/trail copies with offset and turn, mirror symmetry (kaleidoscope), tiling (duplicate with a transform step). | js | open |
| J2.8 | "Surprise me": re-roll arrangement, rotation and style with a seed, undo steps back; deterministic per seed. | js | open |
| J2.9 | Remove an object / fill (inpaint); check the trimmed build before promising. | cv | open |
| J2.11 | Voronoi/Delaunay pick clip (E120): 6-24 seeds, tap the cells to keep, their union is the clip. Few cells on purpose. | js | open |
| J2.12 | Superpixel pick: tap or paint edge-following regions to keep, traced to a polygon. The model cutout is far better for fur (`EDITOR.md` S2.12); candidates for the one-button cutout are salient-object models (U2-Net, IS-Net, RMBG) and tap-to-segment (SAM). | cv | open |

Cross-cutting risk: on the phone J1.2 (loupe, built, waits for a device) without J1.1 leaves every clip
coarse. Anything that goes into a step (clip, shadow, rim) is rendered from the same document by
`render.js`, so no effect may need a browser filter.

---

## UC2. Gallery: a walkable 3D room for the pictures

**Who and why.** Someone shows a set of pictures as an exhibition: rooms and corridors drawn in the
editor (the shape and pen tools with the room aid, E136), pictures hung on the walls, visitors walk
through or take the guided tour (`GALLERY.md`). Not part of the brainstorm; `GALLERY.md` and `EDITOR.md`
S2.3c, E136 hold its requirements.

**Simple path:** a generated gallery from a batch of photos, the flyby preview, "Walk through".
**Expert path:** a drawn plan with rooms, corridors, alcoves and bridges, textures and looks.

| # | Requirement | Status |
|---|---|---|
| D1(b) | A batch can also become **one node that is a gallery** of the photos (see UC4 for the choice of outcome). | open |

A gallery that sells (exhibits for sale) would need F4 of UC5 and the viewer flows (E135). No further open requirements come from this document; see `GALLERY.md` S5 and `TODO.md`.

---

## UC3. Sequences: slideshows and rasters

**Who and why.** A set of photos shown one after the other (slides) or side by side (grid), with text
between them and a scrubber to move through them. Today: `pages[].steps[]` with the modes free /
slides / grid, grid options (E102), viewer flows (E135).

**Simple path:** pick photos, choose slides or grid, Save. **Expert path:** several pages, text
boxes as cells, animation through the steps.

| # | Requirement | Status |
|---|---|---|
| E1 | The document is a tree of at most **3 depths**; each level is read as sequence, composition or animation, the meaning is not fixed in the data, only in the view. | open |
| E2 | The editor and the film-strip are **views** into that tree: they show one depth, you can descend into a group (see its members one by one, switch with the film-strip) and ascend again. Viewing never changes the stored state. | open |
| E4 | Today's `pages[].steps[]` (2 depths), the modes free/slides/grid and the scrubber must map onto the tree; the graph model and what is persisted barely change. | open |
| D1(a,b) | From N selected photos the user chooses what is made: one node with one composition of all, or one node with a slideshow of the photos. | open |

Touches: `EDITOR.md` S2.7, S3.1, E55-E58, E102/E103; `PageStrip.js`, `SlideStrip.js`, `Scrubber.js`,
`render.js`, `model.js`, `validate.js`. Grid and viewer follow-ups (page size other than cols x cols,
page dots, autoplay, swipe indicator) are in `TODO.md`.

---

## UC4. Exhibitor: a batch of exhibits, one piece each (proposed)

**Who and why.** Someone with 40 photos of things to show or sell wants one tidy piece per photo,
filed under categories, with the fewest taps. This is the everyday end of the spectrum; the collage
artist is the other end.

**Simple path:** pick the batch, choose "one piece per photo", name a category, done.
**Expert path:** open any piece in the editor and make it a composition.

| # | Requirement | Status |
|---|---|---|
| B1 | **Selection = batch.** The picked photos in the upload area are the set that goes into the editor. The "Create from n selected" tile is built (`EDITOR.md` S2.12); the rest is not decided. | postponed (revisit after B2-B6) |
| D1(c) | One node **per photo** (N nodes) as an outcome of a batch. | open |
| D2 | (c) builds a subgraph: the N nodes get a category/parent edge; also "add several new items to different categories". | open |
| D3 | The editor is conceptually decoupled from the graph node it edits (one editor instance, a model of its own). | open |

Touches: `EDITOR.md` S3, S4 (one POST per node, batch?), S3.4; `GRAPH.md` (edges, categories, positions).

---

## UC5. Story and active content: text with more than words (proposed)

**Who and why.** A piece where text carries the idea: captions, a story over several pictures, a
small shop. Text boxes exist (S2.3b, E88-E97, curved baseline E130, SVG clipboard E131).

| # | Requirement | Status |
|---|---|---|
| F1 | Active content in a box: a running web game (itch.io, Ludum Dare) or a retro emulator. Security: sandboxing. | open |
| F2 | Paste HTML/SVG from the clipboard, broken apart and remixed into steps (the SVG clipboard in and out is built, E131; the remix is not). Security: sanitiser. | open |
| F3 | A caption rendered along/into a shape that can be warped (curved baseline is E130; warping is open). | open |
| F4 | Built-in embeds: currency conversion, shipping + VAT calculator, PayPal payment. Security: payments. | open |

Likely postponed behind the basic text box.

---

## UC6. Field guide and journal: pieces tied to places and kinds (proposed)

**Who and why.** A collection like "wild-flowers": photos taken in the field, tagged with where they
were taken, grouped by kind, browsed on the graph or a map. Built: place from EXIF and the camera
upload with an optional location tag (E137-E139, `GRAPH.md` S1.5). The graph and map views belong to
`GRAPH.md`.

| # | Requirement | Status |
|---|---|---|
| D2 | Categories and parent edges for a batch (shared with UC4). | open |

---

## UC7. Print and share: the picture leaves the app (proposed)

**Who and why.** The artist wants the result outside the site: as an image to post or print.
Built: export as PNG/JPG (E125), server tiles (E82).

| # | Requirement | Needs | Status |
|---|---|---|---|
| J1.11 | Stage background and size: colour, paper/texture (the texture role exists), the size and aspect of the work. Today it is a square of 1000 units; portrait, landscape or square matters for printing and posting. | doc | open |

---

## Index of requirement ids

| Ids | Use case |
|---|---|
| B2-B6, A1, H1-H3 | 0 Platform |
| C1, E3, J1.1, J1.4, J1.5, J1.6, J1.9, J1.10, J1.12, J1.14, J2.3-J2.6, J2.8, J2.9, J2.11, J2.12 | UC1 Collage |
| D1(b) | UC2 Gallery |
| E1, E2, E4, D1(a,b) | UC3 Sequences |
| B1, D1(c), D2, D3 | UC4 Exhibitor |
| F1-F4 | UC5 Story |
| D2 | UC6 Field guide |
| J1.11 | UC7 Print and share |

Former G1-G3 (method) became "How to read this".

## Walk-through order

1. Platform B1-B6 (screens and selection: everything else sits on it)
2. UC4 and UC3 together (D and E: decide on real workflows)
3. UC1 C1, then the rest of UC1
4. UC5, UC7, UC6
5. Merge agreed items into `EDITOR.md` and `TODO.md`
