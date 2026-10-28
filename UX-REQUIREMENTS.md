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
