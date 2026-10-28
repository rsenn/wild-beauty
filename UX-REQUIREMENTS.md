# UX-REQUIREMENTS.md - brainstorm of 2026-10-27, broken into requirement changes

Source: `~/Desktop/wild-beauty-prompt.txt`. Nothing here is decided until an item is
marked **agreed**. Each item is walked through with the author: my reading, the
current implementation, what it touches in `EDITOR.md` / `TODO.md`, gain and loss,
my recommendation, and the questions that are still open. Only agreed items are
merged into `EDITOR.md` and `TODO.md` (item "Merge" at the end).

Status keys: `done` (already built this session), `open` (to walk through),
`agreed`, `postponed`, `rejected`.

Test devices (measured 2026-10-27 with the probe page, `/var/www/html/index.html`):

- phone: Android 10, Chrome 156, **360 x 669 CSS px** visible in portrait (screen 360 x 800,
  DPR 3 = 1080 x 2400 physical, 1 cm = 38 CSS px, `100vh` = 725 but `100dvh` = 669: the
  browser bar takes 56 px, so `vh` would push the bottom row off screen), `pointer: coarse`,
  `hover: none`, `any-pointer: fine` is also true (do not use `any-pointer` to find a mouse),
  `prefers-color-scheme: dark`, no safe-area insets, all modern CSS features present.
  The first numbers (980 x 1822) came from the old probe page that had no viewport meta
  tag (980 is the legacy fallback width); they were wrong.
- phone landscape: **725 x 280 CSS px** (browser bar and system bars take 80 px of 360; `100vh` = 336 is wrong again).
- desktop: 1920 x 1080.

Testers' devices are unknown, so the design is device-agnostic:

- layout follows measurement (orientation, free width and height), never a device guess
- card size has a **touch minimum**: on the test phone 3 columns (about 110 CSS px per
  card at 360 px, 2.9 cm) is the most that keeps the card buttons (add, rotate)
  accurately tappable, so columns = floor(width / min card width), the same
  minimum for every pointer; the phone gets 3 columns, a 1920 px desktop 6+
- page size of the upload grid is computed from the free space (resize observer)
  and capped (performance was the original complaint)
- input follows capability (`pointer: coarse|fine`); every gesture has a visible button
- `dvh`, not `vh`; each risky feature (scroll lock, whole-screen drop) degrades gracefully
- optional: a feedback link that attaches browser, viewport and orientation (no personal data)

---

## A. Already built this session (to be confirmed, not discussed again)

| # | Requirement | State |
|---|---|---|
| A1 | Uploads belong to the `wb-session` cookie; an upload and the cookie expire together (7 days, `WB_UPLOAD_TTL_MS`); the client sees only its own uploads | done, tested (`tests/uploads-owner.test.js`) |
| A2 | Editor invariant to orientation: portrait = stage full width, tool rows above/below; landscape = stage square, full height, centred, tools column left, actions column right | done, not yet seen on a device |
| A3 | Landscape: film-strip is an upright strip | tried, replaced by the tabbed panel (see H) |
| A4 | Usage recording with who (owner / claude / tester), no consent notice (friends consented), report by script | done (`PLAN.md` S6.4, E107) |
| A4b | Richer recording (2026-10-28): tap with the control's box and position inside it, `miss` taps with the nearest control, whole pointer `gesture`s (30 Hz path, pressure, contact size, pointer count), editor `cmd` stream (type and id only), `layout` dump of all control boxes, an editor state snapshot (`st`) and open panels on each | done (`client/events.js`) |

Follow-ups to ask (A1): show the expiry date to the user? "keep" button that renews?
What if the cookie is lost (uploads unreachable until expiry)?

---

## B. Upload screen and editor screen

| # | Requirement (my reading) | Status |
|---|---|---|
| B1 | **Selection = batch.** The photos with the blue border in the upload area are the set that goes into the editor. | postponed (author needs to think; revisit after B2-B6) |
| B2 | **Paged uploads, fixed height.** The upload area shows as many cards as fit beside the drop zone in one screen height and pages through the rest (no long list, no scrolling, fast on 40-80+ uploads). | open |
| B3 | **Two screens instead of one scroll.** Uploads is screen 1, editor is screen 2 (one screen height each). | direction agreed ("basically good"), details open |
| B4 | **Navigation between the screens.** Buttons ("Add n photos" tile goes to the editor; an "add photos" action goes back), plus swipe: from the top middle of the editor back to uploads, from the lower middle of uploads to the editor. | open |
| B5 | **Locked editor.** No page scroll while the editor is shown; the stage owns every touch, also outside its rectangle (you can move something that is partly outside the viewport). | open |
| B6 | ~~Flow replaces drag~~ **revised:** drag and drop and scrolling are not dropped. Fewer cards per page (B2) should make drag fluent; the cause of the sluggishness was the number of cards. | open (how drag works across two screens) |

Touches: `EDITOR.md` S2.1 (entry points), S2.2 (layout), S2.5 (adding photos);
`TODO.md` E45, E46, E47 (drop, ghost drag, add button), M4/M7 (upload area), E74
(device checklist); `client/ghostdrag.js`, `UploadArea.js`, `UploadCard.js`, `Stage.js`.

---

## C. Drawing

| # | Requirement (my reading) | Status |
|---|---|---|
| C1 | **Freehand clip.** Clip tool active and only a photo selected (no shape): drawing on the photo records a freehand stroke that closes into a polyline and becomes that photo's clip path. | open |

Touches: `EDITOR.md` S2.3 (Clip), `commands.js` (`clip`, `withMask`), `pen.js`, E62.

---

## D. Outcome of a batch: node granularity (new requirement)

| # | Requirement (my reading) | Status |
|---|---|---|
| D1 | From N selected photos the user chooses what is made: (a) one node, one composition of all; (b) one node, a slideshow/gallery of the photos; (c) one node **per photo** (N nodes). | open |
| D2 | (c) is used to build a subgraph: the N nodes get a category/parent edge; also "add several new items to different categories". | open |
| D3 | The editor is conceptually decoupled from the graph node it edits (one editor instance, but a model of its own). | open |

Touches: `EDITOR.md` S3 (document), S4 (save API: one POST per node, batch?), S3.4
(links); `GRAPH.md` (edges, categories, positions).

---

## E. Editor model: three depths of grouping (biggest change)

| # | Requirement (my reading) | Status |
|---|---|---|
| E1 | The document is a tree of at most **3 depths**. Each level is read as sequence, composition or animation; the meaning is not fixed in the data, only in the view. | open |
| E2 | The editor and the film-strip are **views** into that tree: they show one depth, you can descend into a group (see its members one by one, switch with the film-strip) and ascend again. Viewing never changes the stored state. | open |
| E3 | Use case: collage. Clip/warp a photo "outside the arrangement" without bringing it to front, by descending into it. | open |
| E4 | Today's `pages[].steps[]` (2 depths), the modes free/slides/grid and the scrubber must map onto it. The graph model and what is persisted barely change. | open |

Touches: `EDITOR.md` S2.7 (pages, steps, modes), S3.1 (document), E55-E58
(pages, scrubber, modes, transform), E102/E103 (layout), `PageStrip.js`,
`SlideStrip.js`, `Scrubber.js`, `render.js`, `model.js`, `validate.js`.

---

## F. Text box extensions (phase K, E88-E97)

| # | Requirement (my reading) | Status |
|---|---|---|
| F1 | Active content in a box: embed a running web game (itch.io, Ludum Dare) or a retro emulator. | open |
| F2 | Paste HTML/SVG from the clipboard; it is broken apart and remixed into steps. | open |
| F3 | A caption rendered along/into a shape that can be warped. | open |
| F4 | Built-in embeds: currency conversion, shipping + VAT calculator, PayPal payment. | open |

Security-relevant (F1, F2, F4: sandboxing, sanitiser, payments). Recommendation to
be given when walked through; likely postponed behind the basic text box.

---

## G. Method

| # | Requirement | Status |
|---|---|---|
| G1 | Workflows are specified by **use cases** first (e.g. gallery of exhibits for sale; artist draws in the editor for days), before screens. A `USECASES.md` (or an `EDITOR.md` chapter) holds them. | open |
| G2 | Two ends of one spectrum: the everyday batch exhibitor needs a no-brainer path (few taps); the artist who stays days in one node needs the full editor. Same UI, the simple path is the default. | open |
| G3 | The user is free in how to structure the result (see D1). | open |

---

## H. Landscape editor: tryouts on the phone (2026-10-27/28)

What was built and what the phone showed (725 x 280 CSS px landscape):

1. Stage full height, tools left, actions right, film-strip upright, header in the
   right column: **too crammed**, tools wrapped into a second column, Save cut off.
2. Header and banners moved into the right column, actions as a wrapping row: usable,
   but the right column overflowed; the draft banner alone took 200 px.
3. Editor frame (black border), own background and margin removed on every target
   (agreed: the frame only separated editor from uploads, the two-screen idea does
   that). Editor full bleed, one window high, film-strip as leftmost column: better
   use of the screen, **still crammed**.
4. Now: drawing tools left of the stage, slim actions strip right of it, film-strip
   below the stage, panel on the right, editor taller than the window (page
   scrolls). **Problem:** scrolling makes the browser address bar come back and the
   stage jumps; not usable.

Findings:
- The address bar shows and hides with *document* scrolling (Chrome Android). It cannot
  be switched off from the page. Ways around it: do not scroll the document (the editor
  is a fixed full-window surface, scrolling only inside its own panel), or ask for
  fullscreen / an installed web app (`display: standalone`, no bar at all).
- Buttons may shrink to about 32 CSS px high in strips to fit; below that they are
  hard to hit.
- The shortcut-keys button is hidden on `pointer: coarse` (done).
- Dark preference (`prefers-color-scheme: dark`) is set on the phone; the theme is
  light only (open question).

Proposal (not yet built, to be agreed): editor = fixed surface of exactly the window
(no document scroll in the editor); stage, tools and actions always visible; the panel
beside it has **one section visible at a time**, switched by a small tab row
(selection/context, photos = film-strip, sequence = modes, scrubber, pages); title,
properties and close in one compact row; banners as a short notice at the top of the
panel. Portrait keeps the stacked layout.

## I. Use case: collage artwork (first demo, 2026-10-28)

The first demo user makes collages: several photos, each moved, scaled, turned and
clipped, until it fits. Assessment of each step: **have** = already works,
**gap** = what a first-time phone user will hit. Touch size reference: 1 cm = 38 CSS px.

| # | Step | Have | Gap / proposal | Task |
|---|---|---|---|---|
| I1 | Add photos | upload, select, "Add n photos" tile | the purpose of the blue border is not explained; no hint for what comes next (see B1) | E112 |
| I2 | Photos land on the stage | each photo in its square cell, selectable by tap | all photos start stacked at the same place; the user does not know they can be dragged apart. Proposal: lay out as a loose scatter or grid, first selected | E112 |
| I3 | Move | one-finger drag on the selected photo | works; a photo that is not yet selected needs a tap first (not obvious) | - |
| I4 | Scale, rotate | two-finger pinch/rotate; corner handles (10 px) | pinch is hidden knowledge and the handles are 2.6 mm: not hittable on the phone. Proposal: touch handles at least 32 px, a visible rotate handle, and scale/rotate buttons or sliders in the context bar (every gesture has a button) | E113 |
| I5 | Clip | draw a shape with the shape tool (bezier handles), tool C, tap the shape | four steps, three tools, and bezier handles are impractical on the phone. Proposal: with the clip tool and a photo selected, drawing freehand on the photo closes into a polygon and becomes the clip (C1); a rectangle/ellipse/lasso choice in the context bar; shape tool stays for experts | E114 |
| I6 | See what is clipped | the clipped photo shows only inside the shape | while editing, the part outside is invisible, so the user cannot judge the fit. Proposal: show the clipped-away part ghosted (about 25 %) while the photo is selected | E115 |
| I7 | Change the clip afterwards | unclip returns the shape as an object; the mask moves with the photo (decided 2026-10-23) | it is not clear that the clip can be reshaped, and sliding the picture under a fixed mask needs unclip, move, clip. Proposal: "edit clip" button on a clipped photo: the mask outline gets vertex handles in place; a switch "move picture / move window" | E116 |
| I8 | Order | to front/back in the context bar | fine; after a clip the photo may sit below others without the user noticing | - |
| I9 | Undo | undo/redo, one entry per gesture | fine; must be reachable in all layouts (it is) | - |
| I10 | Finish | Save, node appears in the list | after Save there is no "what now"; propose a link to view the result | - |

Overall: moving works, **scale/rotate and clip are the two discoverability holes**; both
need a visible button path next to the gesture. Priority for the demo: I4, I5, I2, then
I6 and I7.

Decision (author): the shape-first clip (draw a bezier shape, then combine) stays as
the expert path, as in Inkscape; the collage path is the freehand/simple-shape clip.

## J. Collage artist: the complete wish list and what goes beyond (2026-10-29)

Question: what would leave a collage artist with nothing left to wish for, and what
could surpass that? Tools are by the artist's workflow. Status: all `wanted?` until
picked. Column **needs**: `js` = plain JS, `cv` = opencv.js (12 MB WASM, lazy), `doc` =
data model change, `phone` = a phone-specific problem to solve.

### J1. Baseline (the expected toolbox)

| # | Wish | Needs | Note |
|---|---|---|---|
| J1.1 | **Zoom and pan the stage view**, separate from transforming the selection | phone | today two fingers transform the selection; fine clipping needs a zoomed view. Likely a view-zoom button or a two-finger gesture when nothing is selected, plus a visible "fit view" button |
| J1.2 | **Loupe / offset cursor** while drawing or dragging handles | phone | the finger hides the point being placed; a magnifier above the finger (clip outline, handle drag) |
| J1.3 | Duplicate, flip horizontally/vertically | js | cheap, constantly used (mirror a piece, repeat a motif); not in the tool table today |
| J1.4 | Multi-select and group (move, scale, rotate several together) | doc | a collage is rarely one photo at a time; group = a step container (touches E, the 3 depths) |
| J1.5 | Layer list with drag reorder, hide, lock | js | the filmstrip is it partly; hide and lock are missing |
| J1.6 | Align, distribute, snap to edges/centres/stage; snap guides | js | on the phone: snap only, no ruler UI |
| J1.7 | **Torn edge, paper rim, soft edge, outline offset** of a clip | js | the collage look; "sticker" = white outline + shadow |
| J1.8 | Drop shadow per piece (depth) | js | SVG filter in `render.js`, same output in editor and viewer |
| J1.9 | Perspective / 4-corner warp, skew | doc | "warp" from the brainstorm; touch handles at the corners |
| J1.10 | Photo adjustments: brightness, contrast, saturation, hue, black and white, duotone/tint | js | non-destructive values in the step |
| J1.11 | Stage background: colour, paper/texture (texture role exists), size/aspect of the work | doc | today a square of 1000 units; portrait/landscape/square is a real choice for printing and posting |
| J1.12 | Text as clip: the photo shows through letters | js | no opencv needed: this build has no FreeType (`putText` is a Hershey ASCII font only). An SVG clip path can hold `<text>`, so the browser draws the letters with the text boxes' fonts. For the server render the font must match, so **convert the letters to a path when the clip is made** (a small font library such as opentype.js, not yet checked for being vendored): the clip is then an ordinary polygon that the editor, viewer and server render identically with no font dependency (recommended). The alternative, keeping the text as text, needs the font installed on the server |
| J1.13 | **Export as image** (PNG/JPG, share) | js | the artist wants the picture out; rasterise the SVG render in the browser, later the server (`opencv-imgproc.js` render) |
| J1.14 | Save as copy, keep versions | doc | collage is trial and error; "branch before I try this" |

### J2. Beyond: smart help from the photos

| # | Wish | Needs | Note |
|---|---|---|---|
| J2.1 | **Auto cutout** (background removal) of one, several or all photos, with accept/refine (wand add/subtract) | cv | grabCut; the review step matters more than the algorithm |
| J2.2 | **Cut apart foreground items**: connected parts of the cutout become separate clipped copies | cv | E122 |
| J2.3 | **Auto-arrange by criterion**: dominant colour (rainbow order), brightness, size, aspect, colour clusters | cv/js | layouts: cascade, grid, ring, spiral, pile (random turns), treemap/mosaic packing, along a drawn line |
| J2.4 | Colour harmony: match tone between photos, extract a palette, tint the background | cv/js | palette extraction already planned (`TODO.md` 11.1a) |
| J2.5 | **Vector companions** generated from a photo: contour lines, silhouette fills (solid shadow shapes), posterised colour regions, halftone dots, hatching, low-poly Voronoi/Delaunay in the photo colours | cv/js | steps of op `shape`/`stroke`, so they stay editable and render the same on the server |
| J2.6 | Repeat patterns: echo/trail copies with offset and turn, mirror symmetry (kaleidoscope), tiling | js | duplicate with a transform step |
| J2.7 | **Style presets** per work: polaroid frame, torn paper, sticker, tape strips, cut-out letters | js | one tap, all pieces; presets are data (clip + shadow + rim), no new model |
| J2.8 | "Surprise me": re-roll arrangement, rotation and style with a seed; undo steps back | js | for ideas, fun for demos; deterministic per seed |
| J2.9 | Remove an object / fill (inpaint) | cv | may not be in the trimmed build; check availability before promising |
| J2.10 | Magnetic lasso: freehand outline that snaps to edges (`Canny`/gradient) | cv | between freehand and wand; helpful on a phone |

### J3. Observations

- The **magic wand and the contour trace need no opencv.js** in a first version: a flood fill with tolerance on a downscaled canvas plus marching squares and polygon simplification is plain JS (about 150 lines). That avoids the 12 MB download for the demo; opencv.js comes with auto cutout (J2.1).
- Cutting a photo apart (E121) and "cut apart foreground items" (J2.2) are the same operation: a polygon split, shared with the combine routine.
- **J1.1 and J1.2 are the hidden risks on the phone**: without zoom and a loupe every clip is a coarse clip.
- Everything in J1.7, J1.8, J1.12 and J2.7 is a value in the step (clip, shadow, rim), so the server and viewer render it from the same document (`render.js`).

### J4. Background removal: what "good" means (author, 2026-10-29)

- Plain grabCut from a rectangle (opencv.js demo `removeBackground`) is **not good
  enough**: specks, leftover background, hard edges, no notion of an object.
- Target quality: a clean subject cut like the superpixel article (a cat cut from a
  blanket, soft natural edge). Candidates, to be compared on the author's own photos:
  1. **Superpixel pick**: over-segment the photo into regions that follow its edges
     (SLIC); the user taps or paints regions to keep; their union is the mask, traced to
     a polygon. No model, no download, phone-friendly, works in plain JS or on the
     server. Same interaction as the Voronoi/Delaunay pick (E120), with edge-following
     cells instead of geometric ones.
  2. **Salient-object model** (U2-Net, IS-Net, RMBG class) for one-button cutout.
  3. **Tap-to-segment model** (SAM class): the wand that understands objects.
  4. grabCut with cleanup and user scribbles, only as the fallback.
- Where it runs: the photos live on the server, so the server can cut out the original
  and return a polygon (no 12 MB opencv.js, no model download on the phone). The author
  judges `opencv-imgproc.js` (spec only) not ready; the work belongs in qjs-opencv.
- opencv.js here has `dnn` (readNetFromONNX, blobFromImage), but no FreeType, and
  no `SuperpixelSLIC` (ximgproc is not in this build), so superpixels would be our own
  plain-JS SLIC (about 150 lines) or `watershed` on the gradient.

## Walk-through order

1. B1-B6 (screens and selection: everything else sits on it)
2. G1-G3 use cases (decide D and E on real workflows)
3. D1-D3
4. E1-E4
5. C1
6. F1-F4
7. A follow-ups
8. Merge agreed items into `EDITOR.md` and `TODO.md`

## Log of decisions

- Test phone measured: 360 x 669 CSS px, DPR 3 (the 980 x 1822 figure was a missing-viewport-meta artefact). Testers' devices unknown: device-agnostic rules above.
- B1 postponed, not decided. B3 direction accepted. B6 revised: keep drag and drop and some scrolling; paging (B2) is the cure for the sluggishness, not removing drag.
- Frame, own background and margin of the editor dropped on every target (agreed).
- Shortcut-keys button hidden on touch devices (agreed).
- Landscape: header in the panel, film-strip below the stage and an editor taller than the
  window were tried; the last one breaks on the address bar (see H). Next: fixed
  surface with a tabbed panel (proposed).
- B1 stays postponed; the walk-through restarts at A next time.
- Landscape editor built as the fixed surface with a three-tab panel (select, photos,
  sequence); checked in a desktop browser (landscape, portrait 400 and 800 px wide). The
  server must be restarted for the cookie-owned uploads and the new locale keys to
  take effect.
- Collage use case (section I) assessed step by step; scale/rotate and clip are the holes. Shape-first clip stays for experts, a simple/freehand clip becomes the default path.
- I4 agreed: corner handles 32 CSS px on `pointer: coarse` (desktop keeps 10 px); round rotate handle above the selection on every device; scale -/+ and rotate left/right buttons in the context bar on every device (also desktop); pinch, wheel and Alt+drag stay. Task E113.
- I5 extended (author idea, 2026-10-28): besides rectangle, ellipse and freehand, the clip tool gets **auto** (root contour) and **cut out** (grabCut / background removal) using opencv.js in the browser (WASM), mirrored later by `qjs-opencv/tools/opencv-imgproc.js` on the server (`opencv-imgproc.md`). The result is always a polygon in the document, so the data model does not change and the server needs the algorithm only to repeat it, not to render. Runs on a downscaled copy (about 512 px), loaded on first use, with a "working" state and cancel. Not yet agreed: whether it is part of the first demo (my recommendation: after the simple clip).
- opencv.js check: `lib/opencv.js` -> `opencv-5.0.js` is a WASM build embedded as base64 (JS 16.2 MB, WASM 12.0 MB, 3.3 MB gzipped, no debug or name sections, so already stripped). The binary contains grabCut, watershed, findContours, approxPolyDP, floodFill, kmeans, GaussianBlur, resize, Canny, morphologyEx, contourArea (checked by symbol search only, not run; loading it in Bun timed out). Plan: later a trimmed custom build (core + imgproc, only the needed functions) served as a separate `.wasm` file, gzip on, loaded on first use.
- I5 more ideas (author, 2026-10-28), wanted: **magic wand** (tap, similar-colour area becomes the clip, `floodFill`, tolerance control); **Voronoi/Delaunay pick** (few seeds, not many shards: the user taps the cells to keep and their union becomes the clip); **one freehand mode with intent detection** (no separate scissor tool): a stroke that closes (turning angle sums to about 360 degrees and the end returns near the start) becomes a closed clip; a stroke that crosses the photo from edge to edge cuts it into two, each a copy of the photo with the clip of one side. Also wanted: **multi-outline clip** and **split clip** (each outline its own clip and photo copy), **colour segmentation** (regions as clips). Torn edge, smoothness slider, offset/feather and combine clips are on the list, not decided. Cut and combine need a polygon boolean routine (new, shared).
- I5 agreed: a freehand stroke that neither closes nor crosses the photo exactly twice is discarded with a hint ("close the shape or draw across the photo"), never auto-closed. Task E121.
- I6/I7 agreed: the clipped-away part is ghosted (about 25 %, thin outline on the clip edge) **only while the clip tool is active and a clipped photo is selected**, also while dragging clip handles; otherwise the view is WYSIWYG. Clip tool + clipped photo = edit mode: outline with vertex handles, edited in place (no unclip and re-clip), mode switch replace / add / subtract for new closed strokes, wand taps and cell picks, edge-to-edge stroke still cuts, unclip stays. No separate "edit clip" button. Default of the mode switch: open (replace proposed). Tasks E115, E116.
- I7 agreed: the clip mode switch defaults to **replace**; add and subtract are chosen explicitly. Still open: "move picture / move window" switch.
- I7 agreed: keep the move switch on a clipped photo, in the context bar next to the scale -/+ and rotate buttons: **both** (default, as now) / **picture** (clip fixed, picture slides) / **window** (clip moves, picture fixed). It applies to drag, pinch and the buttons, on every device.
- I2 agreed (author mockup, 2026-10-28): no "spread" button and no question after the upload. Photos of a batch arrive in **free mode as a diagonal cascade**: square photos at about half the stage, each stepped diagonally from the top left to the bottom right so that the last one just reaches the stage corner (step = (stage - size) / (n - 1), capped for large n), the last photo on top and selected, every edge visible. Deterministic. Today `addPhoto` covers the whole stage with an identity matrix, so only the top photo shows. Switching mode is non-destructive already (`setMode` changes only `doc.mode`; slides and grid are drawn from the photo list), so the cascade survives a round trip through slides or grid. The filmstrip shows the layer count of a page that holds several photos. Task E112.
- I2 revised and agreed: the cascade is a **fixed step**, not fitted to the count. Photo number i (0-based, order of adding, also when added later one by one) is a half-stage square at offset (i mod 6) x 10 % of the stage in x and y, from the top left, plus 3 % per completed round (wrap-around), the last on top. 2-3 photos stay a tight cascade; 6 reach the bottom right. Replaces the "(stage - size) / (n - 1)" rule above.
- I10 agreed: after Save a short "Saved" notice with a **View** button; View opens in the **same tab** (never a new tab), the editor state is kept so Back returns to it. Not built yet.
- I1 (blue border, agreed and built 2026-10-29): picked upload cards get a crimson and cream dashed border that slowly marches (static with `prefers-reduced-motion`) and a solid crimson disc with a bold light number, as big as the round card buttons (contrast at least 4.5:1). Crimson replaces blue on upload cards only; the stage selection stays blue. Tokens `--wb-pick`, `--wb-pick-ground`, `--wb-pick-ink` in `static/themes/kraft.css`.
- Wording (agreed 2026-10-29): users do not see "node". What the user makes in the upload area and the editor is a **Werk / Werke** in German (neuter) and a **pièce** in French (feminine). "Knoten" stays only for the graph (Tree view, links between things); in French the graph word is proposed as **point** (edge: **lien**), not yet confirmed. The German word for "edge" is still open (not Rand, not Kante). English still says "node": open. Applied to `locales/de.json` and `locales/fr.json` (25 and 26 strings); `tests/locales.test.js` passes. Caveat: French "pièce" also means a room, which may collide with the gallery's rooms (walls, `GALLERY.md`).
- I1 agreed and built (2026-10-29): with photos picked and the editor closed, the last tile reads "Create from n selected" (de "Neues Werk aus n Ausgewählten erstellen", fr "Créer une pièce avec n sélectionnées") and opens the editor with them in pick order (queued through `pending.js`; the existing listener in `NewPage.js` opens the editor). No photos picked: "+ New work" as before; editor open: "Add n selected" as before. Not yet seen on a screen.
- Magic wand (agreed 2026-10-29): a **superpixel grow**, not a pixel flood fill. The photo is over-segmented into edge-following regions (own plain-JS SLIC on a downscaled copy, about 512 px; opencv.js is not needed); a tap seeds a region and the fill grows across neighbouring regions whose mean colour is within a tolerance. Leak control: stop at the last tolerance step before the area jumps (about 3x in one step), or when the region reaches the photo border or most of the picture; opening to cut thin necks; keep only the part holding the tap; drop specks, fill small holes; simplify and lightly smooth the outline into the clip polygon. Phone interaction: tap, then drag up/down to change the tolerance with a live preview (a slider as the visible button path); add / subtract mode (the clip mode switch) fixes a leak by tapping the leaked region; an **invert** button (tap the flat background, invert to get the subject). Honest limit: good for flat colours, poor for textured subjects like fur (those use superpixel painting or the model cutout, J4). Shares the region-picking tool and the superpixels with E120 and the J4 superpixel pick. Task E119 (revised).
- J decisions (author, 2026-10-29): **J1.1 stage zoom/pan postponed** (not sure the stage should zoom; the loupe covers the "finger hides the point" problem); **J1.2 loupe approved**; **J1.13 export as image approved 100 %**; **J1.3 duplicate and flip approved**. Rule for J1.7/J1.8: no effect that cannot be reproduced exactly on the server, so no CSS box-shadow or browser filters; effects are plain geometry (see the edge proposal, not yet agreed).

- J1.7/J1.8/J2.7 edge decoration (agreed 2026-10-29): per photo `edge: { style, amount, seed }`, style one of **plain, paper, sticker, torn, polaroid**. All geometry, no filters or CSS shadows: the **rim** is the clip polygon (or the square crop) grown outward and drawn behind the photo; **torn** displaces the polygon points with a seeded PRNG of our own (same seed, same edge everywhere); the **shadow** is two or three offset copies of the polygon in dark low-opacity fills (stepped, no real blur); **polaroid** is a white frame, thicker at the bottom. Derived at render time by one shared pure function (used by the editor, the viewer and the server render), so a later clip change updates the rim and the tear; the clip itself is untouched. UI: an **Edge** button in the context bar of a photo opens a popover with the preset row, one size slider, a "new tear" button for torn, and an "all pieces" toggle that applies the style to every photo of the page. Presets: plain (nothing), paper (thin white rim, hard shadow offset), sticker (thick rim, stepped soft shadow), torn (torn edge, thin rim, shadow), polaroid (frame, shadow, for unclipped squares). Task E123.

### J5. Applying a cutout from the server back into the editor (proposal, 2026-10-29)

Handoff for the tool: `opencv-imgproc.md` S14 (also in `qjs-opencv/doc/`). Output is an RGBA PNG with a soft alpha, never only a polygon.

- A cutout (one-button or tap-to-segment) **replaces the photo step by two photo steps** with the same matrix: the `rest` image (original with the hole, optionally inpainted) underneath and each `cut` image on top at its `offset`. Nothing looks different until the user moves a piece; moving it reveals the hole or the filled background. Several subjects give several cut steps.
- The server registers `cut` and `rest` as **derived uploads** (same owner and expiry, provenance = original hash); the original stays in the upload list and untouched.
- One undo step restores the original photo step.
- The clip path stays for crisp, vector-shaped cuts (wand, freehand, Voronoi pick, cut stroke). Edge effects (E123) need an outline: the tool returns the alpha contour (`outlines`) so rim, shadow and torn edge also work on a raster cut.
- Tap-to-segment in the UI: tap an object, the cut appears as a preview; add and subtract taps refine it; "bigger / smaller" steps through the model's candidates; "Cut" applies it as above. The photo's embedding is prepared on the server right after upload so the first tap is quick.
- I5 cut, tolerant (author, 2026-10-29): the cutting stroke need not cross the border (a photo fitted to the stage cannot be crossed); it may lie wholly inside the photo as long as **both ends tend to the border**: each end inside the photo is extended **along its heading** (taken over the last few pixels, so finger jitter is ignored) to the border when that is within a **reach** of about 24 screen px (given in stage units as 24 / scale); an end that is already outside is left alone. A stroke whose ends do not reach the border, or whose end heads at a corner, is discarded with the hint. Built as `cutByStroke(poly, stroke, reach)` in `client/editor/polygon.js` (20 tests); a stroke along the border cuts off a thin sliver by design.
- I5 cut, two additions (author, 2026-10-29): a stroke **pointing at a corner is a valid cut** (the exact-vertex rejection is replaced by nudging the stroke a hair to either side, so the crossing is proper); a **minimum piece size** of 2 % of the photo's area (`MIN_PIECE`), a smaller piece (a sliver along an edge) is a slip and the stroke is discarded with the hint.

### J6. Server jobs: progress, cancel, and editing while one runs (agreed 2026-10-29)

The tool `opencv-imgproc.js --progress` prints NDJSON: `{ "event": "progress", "command", "stage", "message", "percent", "elapsedMs" }` lines and a final result line (spec S4, S14).

- **Transport:** one streaming request per job; the server starts the tool with `--progress` and forwards its lines; the client reads them as they arrive. Cancel aborts the request; the server kills the tool (it must exit on SIGTERM) and removes the temp files.
- **UI:** the editor's status line shows the stage message and percent with a **Cancel** button that is always visible; the processed photo gets a pulsing dashed outline. One server job at a time per editor; buttons that would start a second one are disabled.
- **Editing during a job (author: everything else stays editable):** allowed: move, scale, rotate the busy photo (the result is placed relative to its matrix when it arrives), opacity, blend, order, all other photos and steps, text, pen, pages, undo/redo, save. **Blocked on the busy photo only:** delete, cut, clip / unclip / edit clip, change of the crop window, texture/picture role, duplicate, another job. A blocked control is disabled with a short note ("being processed, cancel to change it").
- **Edge cases:** undo that removes the photo cancels the job with a note; a save during the job stores the state before the result and the result then makes the document dirty again; leaving the editor asks "Cancel the processing?"; the result is one history entry (undo returns to the original) and is discarded with a note if the photo's hash or crop changed meanwhile.

- Wand experiment on the duckling photo (2026-10-29, `uploads/1c37f248...cdc5.jpg`, 960 x 1280; SLIC superpixels of about 14 px at 512 px width, colour grow in Lab, simulated with OpenCV's Python `ximgproc`, not the browser code): the yellow body grows cleanly and **stops by itself** (area 8 % up to tolerance 44, 13 % at 48 and flat to 60). The orange beak and feet **leak into the skin of the hand** from tolerance 52 on (beak 3 % -> 21 %, foot 8 % -> 19 %), which the "stop before the jump" rule catches. Practical result: **four taps** (body, beak, both feet, add mode) with hand-picked tolerances give a usable silhouette (23 % of the picture, eyes filled by the hole fill, 128 outline corners) but with a **jagged edge** (superpixel-sized steps along the head), a few **skin fringes**, and **one leak tendril** at the left foot that needs a subtract tap or a stronger opening. Conclusion: the wand is a quick rough clip for flat-coloured things; for this duck the model cutout (J4) is far better, with soft natural edges in one step.

- **Magic wand decision (author, 2026-10-29): the wand uses only `opencv-imgproc.js`** (tap-to-segment, `prepare` + `segment`, `UX-REQUIREMENTS.md` J4 and `opencv-imgproc.md` S14, Mode B). It replaces the earlier "superpixel grow in plain JS" plan: no wand engine in the browser. Consequences: the wand needs the server (no offline wand); the first tap waits for `prepare` of the photo unless it was done after upload; progress, cancel and the editing rules of J6 apply; a result is applied as a vector clip (outline polygon) or as the soft cut (E127). The plain-JS superpixel code, the leak control and the tolerance drag are dropped; "add / subtract / invert" and "bigger / smaller" (SAM candidates) stay. The duckling experiment above is the reason: the model result is far better.
