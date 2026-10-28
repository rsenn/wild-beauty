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
