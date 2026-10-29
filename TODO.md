# TODO - Wild Beauty rewrite

Source of truth: this file for the **directory layout** (PLAN S5 mirrors it), `EDITOR.md`
for the node editor, `PLAN.md` for everything else, then `DESIGN.md`. A content item is a **node** (not tile). Videos and
handwriting recognition are out of the PoC. After the PoC: M12 graph view (`GRAPH.md`) and
M13 3D gallery (`GALLERY.md`). Target is
**Bun only**, no runtime abstraction (`PLAN.md` S2.1). Old code is read-only in
`attic/` (`CLAUDE.md`).

Conventions: `[ ]` open, `[x]` done. Each task is small enough for one commit
and ends in something you can run or look at ("done when"). Do tasks in order;
a milestone is finished when all its tasks are. Section references: `P` =
PLAN.md, `D` = DESIGN.md.

## Open threads (2026-10-29)

Work that was started, offered or decided but not finished, so a detour does not lose it.
Detail lives in `EDITOR.md` (E-numbers) and `UX-REQUIREMENTS.md`. Update this list when one closes.
State: all of the work below is committed and pushed (last: `d2ae0104`). The camera / place work (E137, E139) is done in another session and not listed here.

### Closed today (2026-10-29)
- [x] E128 jobs (Cancel, `job.js blocked`, auto-cancel, leave confirm); E96 round trip tests; E97 right-to-left; fixed-height text box; SVG clipboard in and out; palette of a selected photo; E109 landscape dimming.
- [x] Committed earlier: graph demo and group nodes, shared colour selector with dropper, node-size rules, raster spacing and columns, drawings and text in slides (E133), text padding (E134, confirmed on the live site), viewer flows (E135).
- [x] Colour selector: opacity slider and hex field (text colour, outline, background); E87 and E95 closed.
- [x] E130 curved text, slider version (see below).
- [x] E82 server rasteriser, first version (see below).
- [x] Clip tool: a background removal makes the subject outlines the photo's multi-outline clip (one photo, one outline each); a cut across a multi-outline clip splits the crossed outline (the others go to their side); that outline lights up while drawing; clip outlines are coloured by nesting depth; the select tool ghosts what a clip cuts away; an unclipped cutout is cut along its visible box.
- [x] Tight selection: clicks go through transparent padding (alpha map), the box hugs the content, and each piece of a cut gets its own box once, at cut time.
- [x] Usage recording works again (`fetch` with keepalive instead of `sendBeacon`, which privacy extensions drop); `tools/events-sessions.js` reports the heavy sessions, findings in the next section.

### Built, waiting for a device (tests pass, never seen on real hardware)
- [ ] E124 loupe (`Stage.js`): shown only on `pointer: coarse` while a finger draws or drags in the pen, shape, clip, unclip and text tools; not on a phone yet. Not shown for the select tool's handle drags (needs a flag from the editor).
- [ ] Not tried in a browser: the multi-outline cut and its highlight, the cutout outlines as clip, the alpha hit test, per-piece boxes after a cut, the select-tool ghost, the opacity slider and hex field.
- [ ] Real system clipboard, a real phone (touch, swipe, keyboard), Firefox, very large photos, a real cut-out and wand job, the viewer's touch swipe, SVG clipboard formats in other apps, Arabic / Hebrew text and a Japanese IME.
- [ ] Composite node tiles need a re-save for nodes saved before E82 existed.

### Open, can be built
- [~] **E130 curved text**: drag handles on the stage, double-tap reset, the faint limit arc, the curve following width changes; browser check of the slider.
- [~] **E82 server tiles**: photo-only documents with several photos and group nodes still use the first photo's thumbnail; the fonts directory should be a config/setup step (production needs the TTFs in `~/.fonts`, `fc-cache -f`); `latin-ext` subsets not installed; curved text goes through Inkscape (librsvg draws no `<textPath>`).
- [ ] **Usage-log items** (next section): 25 px remove button, undo granularity, upload failures, right-edge missed taps, log only a summary per drag, touch gesture cancels, crop grab area.
- [ ] Tight box is the clip's bounding box limited to the picture's content; a smaller box inside a clip could be refined later if needed.
- [ ] Two reports exist: `tools/events-report.js` (E107) and `tools/events-sessions.js`; merge them.

### Needs a specification before it can be built
- [ ] **Copy several steps at once**: needs selecting several steps first (Shift-tap, box select, "select all"?); the clipboard payload already holds up to 8 items.
- [ ] **E110 dark theme**: the colours of a dark kraft (ground, ink, accent, cards) are not decided.
- [ ] **One word for "node" / "work" in English** (German Werk, French pièce, Spanish pieza).
- [ ] **E94 fill editor** (none / solid / linear / radial gradient, 2-5 stops, alpha) for the text background: the UI is not drawn.
- [ ] **11.3 Image embeddings** (duplicates at upload, related nodes, search): runtime decided 2026-10-29 (DINOv2 via dnn), see M11.
- [ ] **Magnetic lasso** replacing the wand: client side (edge map plus shortest path in a worker, clip polygon out). Needs your go.
- [ ] Wand follow-ups: `sam` for the final pass, choosing which subject Remove background keeps.
- [ ] Verify Spanish with DeepL (needs `DEEPL_API_KEY`, target ES-419) and the tester.

### Decided, not built (large)
- [ ] E74 / E108 device pass, stage zoom (postponed: the loupe covers it), E114 simple clip, the `UX-REQUIREMENTS.md` list.
- [ ] **E129 text as clip** (postponed).

### Postponed (decided 2026-10-29): grid and viewer follow-ups
- [ ] Grid: a page size other than cols x cols, row count separate from the column count.
- [ ] Viewer: page dots, autoplay, swipe indicator, remembering the page across reloads.
- [ ] Editor preview of the viewer flow (the editor stage shows everything at once).
- [ ] Text boxes and drawings in the grid (cells of their own); drawings in slides are built (E133).
- [ ] Graph: composite thumbnail for group nodes in the saved list (with E82), rename a group in the graph, add or remove members by drag, group of groups, owner checks on `/api/graph`.

### Housekeeping
- [ ] Leftover test cut-outs in `uploads/` expire on their own (7 days).
- [ ] Restart the dev server on port 3001 (and deploy the live site) to see the latest work.

### Dropped on purpose
- Panorama stitching (2026-10-29).

## From the usage log (2026-10-28, `bun tools/events-sessions.js`)

Candidates, from your long session (about 27,000 events, 14 editing sessions on a phone, 360 px wide):

- [ ] **Remove button on upload cards is 25 x 25 px** (`Entfernen`): 59 taps, 13 rage taps (13 = 22 %), the most of any control. Make it at least 44 px (or a swipe / long press).
- [ ] **Undo is too fine-grained**: in the first session 43 % of all actions were undo, 17 of 21 undos came right after another undo, 4 rage taps on Undo. Ideas: undo-all / hold to repeat, or fewer steps per undo (group a gesture and what it changed).
- [ ] **Uploads fail a lot**: 12 of 39 upload events failed (5 of 8 in the first session). Find out why (size, network, timeout), add a retry that keeps the card.
- [ ] **Missed taps cluster at the right edge** (x > 270 of 360 px, all heights, 112 of 143 misses): something is expected there that is not (scroll bar, the tool column, the edge swipe?). Check which control sits there.
- [ ] **Event log is 90 % `setMatrix`** (24,255 of 27,270 lines, about 40 moves per drag): log one summary per drag instead (start, end, steps, duration), the file shrinks from 12 MB to well under 1 MB per day.
- [ ] Gestures are cancelled 17-54 % of the time on touch (the browser took the gesture over: scroll or zoom): check `touch-action` on the stage and the page strip.
- [ ] Crop: 64 `setCrop` commands in one session and 13 taps on the crop hint, the crop slide is fiddly on a phone; maybe a bigger grab area.

## Theming rule (applies to every task below)

The whole UI is **themable, and a theme can change per content node**. So:

- No component or stylesheet hard-codes a colour, font, background image,
  border width, radius or icon. They all read `--wb-*` custom properties
  (the token contract, task 2.3). Layout CSS and theme CSS are separate files.
- A theme is a CSS file `static/themes/<id>.css` that only sets tokens on
  `:root[data-theme=<id>]` and on any element carrying `data-theme=<id>`
  (so a node can wear a theme different from the page). Themes may swap
  background image, fonts, icon set and tab/button/node shapes.
- A node stores its look in its document (`style.theme` = id plus optional
  token overrides) and renders inside a wrapper with that `data-theme`, both
  in the editor and in SSR.
- Node-supplied overrides are user content: only whitelisted `--wb-*` names
  and value patterns (colour, length, number, `url(/static/...)`, font-family
  from a list) are accepted, on write and again on render. No raw CSS.
- Default theme `kraft` reproduces the historic look (screenshots, M0).

Assets already in `static/` (checked): `img/logo-transparent.png`,
`img/tile-background.png` (the kraft-paper ground), `img/favicon.png`,
`img/*.svg` (action-*, icon-*, flag-de/fr/gb, arrow-*), `fonts/stylesheet.css`.
Note: `static/style.css` (old, not linked) declares Jewel Hill and Manjari whose
`hinted-*` files are missing; `static/fonts/stylesheet.css` only declares Fixed, now
woff2/woff/ttf. Fonts are served from `/static/`.

---

## M0 - Reference material

- [x] **0.1 Copy the historic screenshots** from `~/Desktop/wild-beauty/`
      (5 JPEGs, 2022-08-25, phone) to `docs/screenshots/` with descriptive names:
      `graph-mobile-zoomed`, `new-dropzone`, `ios-photo-picker`,
      `new-upload-grid-selected`, `graph-mobile-overview`. Done when they are
      committed and `DESIGN.md` S7 links them.
- [ ] **0.2 Record what the screenshots show** in `DESIGN.md` S7 (task H1 uses
      it): drop zone is a **square-cornered ~4px black frame**, large black
      upload arrow icon (`action-upload.svg`), line "Drag and drop Images Here
      to Upload", line "Or", crimson **"Select Images to Upload"** button;
      thumbnails in a **5-column grid** with a thin black border, a red circular
      X and a blue circular rotate button overlapping the top-right, **selected =
      thick blue border with drop shadow**; a **black square with white arrow**
      at bottom right to continue; nav tabs are crimson blocks with big pixel
      text, the active "New" tab grows downward to show its caption; graph nodes
      are **rounded squares, ~3px black outline, flat saturated fill, centred
      pixel-font label, thin black edges**, node size shrinks with zoom. Known
      defect to not copy: tab labels are cut off on a 360 px phone ("Hom",
      "Sho", "Tre", "Log", "Lar").

## M1 - Minimal HTTP server (`server.js`)

- [x] **1.1 `server.js`**: `Bun.serve({ port: 3000, fetch })`. Routes: `GET /`
      -> 302 `/en/new`; `GET /static/*` -> file from `static/` (reject `..`, set
      content type by extension, 404 otherwise); everything else 404 text.
      Done when: `bun server.js` and `curl -I localhost:3000/static/img/favicon.png`
      returns 200 `image/png`. (Plain file at repo root as asked and it stays the entry;
      modules go into `server/` as it grows, P S5.)
- [x] **1.2 `.gitignore`** for `uploads/`, `data/`, `node_modules/`. Done when
      `git status` ignores them after creating the dirs.

## M2 - `/new` page, SSR, our design

- [x] **2.1 Vendor Preact** (`vendor/`, served as `/vendor/`): `preact.js`, `hooks.js`, `htm.js`,
      `preact-render-to-string.js`, bare `preact` import rewritten to relative,
      pinned in `vendor/VERSIONS`, licences copied (D S9.2, S9.5). Script:
      `tools/vendor.sh`. Done when `bun -e "import('./vendor/htm.js')"` works and
      `vendor/VERSIONS` lists four packages.
- [x] **2.2 SSR shell**: `server/ssr.js` `renderPage(vnode, {lang, title})` ->
      `<!doctype html>` with head (charset, viewport, favicon, CSS links,
      import map for `/vendor/*`), body, boot JSON. `GET /:lang/new` renders a
      placeholder `<h1>`. Done when `curl localhost:3000/en/new` returns the page.
- [x] **2.3 Token contract + default theme**: `static/css/layout.css` (no
      colours) and `static/themes/kraft.css` defining the `--wb-*` tokens
      (contract: P S16.3; a distilled draft of `kraft.css` is already written,
      this task wires it to `layout.css` and checks it on a page): wallpaper image/colour (`tile-background.png` is the wallpaper of `kraft`), ink, accent (crimson
      `~#9c2b3c`), accent-text, border width/colour, radius, frame width (the
      drop-zone's 4px), font-ui, font-size, button/tab/node shapes, icon urls,
      selection colour (blue), danger colour (red), shadow. Values from the
      screenshots and D S7; only what `/new` needs now (full extraction is H1).
      Document each token in a comment. Done when the page shows the paper
      texture and changing `kraft.css` alone restyles it.
- [x] **2.4 Fonts**: fix `static/fonts/stylesheet.css` so every `src` points at an
      existing file (drop the dead `hinted-*` entries or the Jewel Hill/Manjari
      faces); set the pixel/terminal face (Fixed) for UI chrome (D S7.3). Done when
      the browser network tab shows no 404 for fonts.
- [x] **2.5 Chrome** (colours via tokens only): header with logo (`logo-transparent.png`) and the crimson
      tab strip (Home, Show, Tree, New active, Language) as `client/components/Nav.js`;
      active tab glow and the one-line caption under it (D S7.2). Tabs for
      unbuilt pages are plain links to `/`. Done when `/en/new` looks like the old
      app's chrome on desktop and phone width (no truncated tab text).
- [x] **2.6 Components dir + htm helper**: `client/components/`, one
      `client/html.js` (`html = htm.bind(h)`) shared by server and browser. Nav from 2.5 moves
      there. Done when the same file is imported by `ssr.js` and served at `/app/`.
- [x] **2.7 Static route for modules**: `GET /app/*` and `GET /vendor/*` in
      `server.js`; browser import map maps `preact`, `preact/hooks`, `htm`.
      Done when a `<script type="module" src="/app/app.js">` runs in the browser.

## M2b - Theming mechanism

- [ ] **2b.1 Theme loading**: `<html data-theme>` set in SSR from cookie
      `wb-theme` (default `kraft`); theme CSS linked with `<link id=theme>`.
      `GET /api/themes` lists `static/themes/*.css` (id + name from a first-line
      comment). Done when adding a file makes the id appear.
- [ ] **2b.2 Second theme to prove it** (P S16.5; `static/themes/blueprint.css`: dark
      blue wallpaper (flat colour or CSS gradient, no image), white ink, cyan
      accent, square tabs, different font-ui). Done when switching it restyles
      `/new` completely with no component change.
- [ ] **2b.3 Theme switcher** in the nav (next to Language): swaps the
      `<link>` and the cookie without reload. Done when a reload keeps it.
- [ ] **2b.4 Scoped themes**: `<div data-theme=...>` inside the page wears a
      different theme than the page. Test page `/en/themes` shows one swatch
      block per theme side by side (also the visual regression check).
- [ ] **2b.5 Token sanitiser** `server/theme.js`: validates a node's
      `style.theme` object (whitelist + value patterns), returns an inline
      `style` attribute string for the wrapper. Unit tests with hostile
      values (`url(javascript:...)`, `expression()`, `}` / `;` injection).

## M3 - i18n (de, fr, en)

- [x] **3.1 `locales/{en,de,fr}.json`** with the keys used so far (tab labels,
      page title, drop-zone text) and `meta.name`; `t(key, params)` with `en`
      fallback and `Intl.PluralRules` plurals (P S11.7). Used by SSR and client
      (same file). Done when `/de/new` and `/fr/new` show translated chrome.
- [x] **3.2 Locale negotiation**: URL prefix, `wb-lang` cookie, `Accept-Language`,
      `en`; `/` redirects accordingly. Language tab lists `locales/*.json`
      (flags from `static/img/flag-*.svg`). Done when adding `locales/xx.json`
      makes `xx` appear with no other edit. (Locales are read at start: restart after adding one.)
- [x] **3.3 `tools/check-locales.js`**: fails when key sets differ. Done when
      removing a key from `fr.json` makes it exit non-zero.

## M4 - Upload drop zone (client only, no server yet)

- [x] **4.1 `UploadArea` component** (SSR renders it empty, client adopts it),
      laid out like the historic screenshot: framed square-cornered zone
      (frame width/colour from tokens), big `action-upload.svg`, text "Drag and
      drop Images Here to Upload", "Or", accent button "Select Images to Upload"
      (all translated, M3), hidden `<input type=file multiple accept=image/*>`.
      Done when dropped files are listed by name and size under the zone.
- [x] **4.2 File cards**: square thumbnail (5 columns on phone width, more on
      wide screens) with thin border, round remove button (red X, token
      `--wb-danger`) and rotate button (blue, `icon-rotate.svg`) overlapping the
      top-right, state (queued), selected state (thick `--wb-select` border and
      shadow). Dragover highlight. Directories ignored for now. Done when 10
      dropped photos show as 10 cards and selecting one gives the blue frame.
- [x] **4.3 Extend preview (client-side)** (superseded: photos are always square crops, see 4.4 and `EDITOR.md` E98-E101): `object-fit: contain` over a
      neutral ground; toggle per card to `cover` (P S11.1). Colours come in M6.
      Done when the toggle flips one card without touching the others.

## M5 - Upload to server, with progress

- [x] **5.1 `POST /api/uploads`**: raw body, filename in `X-Filename`; stream to
      `uploads/.tmp/<rand>` while hashing (`Bun.CryptoHasher` sha256); enforce
      `maxBytes`; magic-byte sniff (main: jpg/jpeg/png/heif/heic; also webp/gif/avif/tiff; images only,
      anything else incl. video -> 415); rename to
      `uploads/<hash>.<ext>`; dedupe; respond JSON `{hash, ext, name, size}`
      (P S6.2 steps 1-3). Done when `curl --data-binary @a.jpg` creates the file.
- [x] **5.1b HEIC/HEIF extraction** (`server/media/heif.js`, P S6.2 step 3b): for
      `.heic`/`.heif` write `uploads/<hash>.display.jpg` (`.png` when alpha) with
      `heif-convert -q 99` (+ `heif-info` for alpha and the primary id; no ImageMagick
      fallback, same libheif); argv array, `--`,
      timeout, primary image only; undecodable file -> upload rejected. Hash stays
      that of the uploaded bytes. Done when an iPhone `.heic` shows a preview card
      and a corrupt one returns an error.
- [x] **5.2 Verify `Bun.serve` body handling**: 40 MB file does not sit in
      memory; set `maxRequestBodySize` explicitly (D S9.6). Done when a 40 MB upload
      works and a 41 MB one returns 413.
      Result (2026-10-21, Bun 1.4.2): passes; streamed, RSS ~45 MB; 413 also for chunked
      bodies; set the limit explicitly (default is 128 MiB); remove the temp file when
      the body iterator throws; no small `idleTimeout` (D S9.6, P S14). Re-check
      with a real slow client in 5.3.
- [x] **5.3 Client upload with progress**: `XMLHttpRequest` per file,
      `upload.onprogress` -> progress bar on the card, concurrency 3, states
      queued/uploading/done/failed + retry, abort on remove (P S11.1). Done when a
      large file shows a moving bar and a killed server shows "failed".
- [x] **5.4 Hash safety**: `hash` validated `^[0-9a-f]{64}$` everywhere, extension
      whitelist, no path built from user text (P S9). Done when
      `GET /files/uploads/../../etc/passwd` returns 400/404.

## M6 - Ingest: metadata and palette

- [x] **6.1 Tool detection** at start: `mediainfo`, `exiftool`/`exiv2`,
      `magick`/`convert`; `GET /api/capabilities`. Done when it lists what is
      installed here (`convert` IM6, `exiftool`, `mediainfo`).
- [x] **6.2 Probe**: `mediainfo --Output=JSON` and `exiftool -json -n` in
      parallel, each with timeout and output cap, argv arrays, `--` before the
      file (P S9). Done when a JPEG yields width, height, orientation.
- [x] **6.3 Palette**: `convert f[0] -auto-orient -resize 128x128 -colors 8
      -depth 8 -format %c histogram:info:-` -> ordered `{hex, weight}`; when
      `capabilities.imgproc` is present use `opencv-imgproc palette --in=<f>
      --count=8` instead (JSON `colors` hex list, argv form `--name=value`), falling
      back to ImageMagick (also for weights) (the imgproc path is task 11.1a; M6
      is ImageMagick only); `padding`
      = 2 colours, second far from the first in OKLab (own 15 lines) (P S6.2 step
      5). Done when a unit test with a two-colour PNG returns both, weighted.
- [x] **6.4 Sidecar**: write `uploads/<hash>.json` (temp + rename) with
      everything above; degrade to `errors: []` instead of rejecting. Upload
      response returns the sidecar. Done when the file appears next to the image.
- [x] **6.5 Cards use the palette**: extended preview gradient from the two
      `padding` colours (P S11.1). Done when a portrait photo shows colour
      padding left and right.

## M7 - Existing uploads (list, SSR, delete)

- [x] **7.1 `GET /api/uploads`**: read `uploads/*.json`, newest first.
- [x] **7.2 `GET /files/uploads/:hash.:ext`** (validated, `Cache-Control`).
- [x] **7.3 SSR the list**: `/:lang/new` renders cards for files already on
      disk and a `<script type=application/json id=boot>`; the client adopts
      them (no flash). Done when a reload keeps the cards.
- [x] **7.4 `DELETE /api/uploads/:hash`** removes image and sidecar; delete
      button on the card calls it. Done when the files vanish from `uploads/`.
- [x] **4.4 Square crop on the upload card (decided)**: every card shows the photo zoomed in to a square;
      dragging pans the crop along the long axis; cursor `ns-resize`/`ew-resize` on desktop, a double-arrow
      icon on touch, nothing for square photos; the yellow fit triangle goes. Tasks in `EDITOR.md` E98-E103.
- [x] **7.6 Ownership and expiry (2026-10-28)**: uploads belong to the `wb-session` cookie and expire with it; list and delete only for the owner (`EDITOR.md` E104, `PLAN.md` S6.2).
- [ ] **7.7 Collage use case (2026-10-28)**: first placement, touch transform handles, simple/freehand clip, clip preview, edit clip (`EDITOR.md` E112-E126, `UX-REQUIREMENTS.md` section I); E117/E118: auto clip and grabCut with opencv.js, trimmed build.
- [ ] **7.5 Quota**: total `uploads/` size cap with a translated error (P S9).

**First deliverable ends here (M1-M7): `/new` with design, i18n, drop zone,
progress, metadata, palette, list, delete.**

## M8 - M10 - Node editor, save, vector tools: see `EDITOR.md` S9

The editor's tasks moved to `EDITOR.md` S9 (E1-E83, client and server, small and
ordered). Mapping from the old milestones:

| Old | Now (`EDITOR.md` S9) |
|---|---|
| M8 Node editor shell (8.1-8.7) | phases A (model, pure code), C (shell), D (photos), E (pages) |
| M9 Save a node (9.1-9.4) | phase B (server storage, E18-E33) and G (save/update/open/lock, E64-E69) |
| M10 Vector tools (10.1-10.5) | phases A (E10-E13 pen and shapes pure code), F (E59-E63) |
| per-node theme (8.3b, 9.2b) | E17, E70 |
| (new) colour palette and text boxes | phase K (E84-E97), after phase F |

Milestones for orientation: **M8 = phases A+C+D**, **M9 = phases B+G**, **M10 = phase F**;
phase E (pages) and H (theme, i18n, a11y, devices) close the editor. One editor at a time;
the lock lives in E31/E67.

## M11 - Optional extras

- [ ] **11.x Option: NanoVG for faster graphics** (not needed yet). `../quickjs/qjs-nanovg/web/`
      is NanoVG compiled with Emscripten on WebGL2 (`nanovg-web.{js,wasm}`, 195 KB wasm,
      `nanovg.js` mirrors the native `nanovg` module, vector paths, fills, strokes, text).
      Consider it if the SVG stage gets too slow: many steps or photos on a page, the
      graph view (`GRAPH.md`) with many nodes, or smooth playback of big pages (E58). The
      renderer (`client/editor/render.js`) would get a canvas backend next to the SVG one,
      same step model; SSR, thumbnails and the viewer keep SVG. Measure first. Needs a
      vendored copy under `vendor/` (served as-is, no build step).

- [ ] **11.0 `opencv-imgproc.js` in qjs-opencv** (spec: `opencv-imgproc.md`; done in
      that project via the handoff prompt). Done when `qjsm opencv-imgproc.js
      capabilities` runs and the spec's acceptance tests pass.
- [ ] **11.1 Server glue** `server/media/imgproc.js`: detect the tool, write the job
      JSON, spawn with timeout and minimal env, parse the one-line JSON result,
      `GET /api/capabilities.imgproc`. Done when a cutout job returns the result
      object for a test image.
- [ ] **11.1a Palette via imgproc**: `server/media/palette.js` calls `opencv-imgproc
      palette` when detected (6.3), else ImageMagick. Done when both paths return an
      ordered 8-colour array for the same test image.
- [ ] **11.1b Cutout endpoint** `POST /api/uploads/:hash/cutout`: job in, derived
      upload out (new SHA-256, `derivedFrom`, `op`, alpha PNG/WebP, never JPEG), shown
      in the upload list; button hidden unless `capabilities.imgproc` (P S10).
- [ ] **11.1c Server-side clip**: `clip` job from a `shape` step (polygon or SVG path +
      the photo matrix) for a destructive cut-out and for the thumbnail rendition
      (`EDITOR.md` E25; P S10 use 2).
- [ ] **11.3 Image embeddings at ingest** (`opencv-imgproc.md` S16.5, S16.8, S16.10 item 1). One vector per
      baked photo, stored with the photo row, for three uses: (a) duplicate and near-duplicate warning while
      uploading and a "possible duplicate" list for a gallery (on 2026-10-29 this was done once by hand with a dHash
      script over node 11 and 19 and found 3 pairs in 214 photos; a stored vector makes it routine and also finds
      crops and re-exports a dHash misses); (b) "related nodes" in the graph view (`GRAPH.md`); (c) search by
      content or text. Candidates: CLIP ViT-B/32 (MIT; text tower for search), DINOv2-small (Apache-2.0; similarity
      only, better for duplicates).
      **Decided 2026-10-29** (measured, `opencv-imgproc.md` S16.8b): DINOv2-small fp32 (Xenova/dinov2-small,
      Apache-2.0, 84 MB, 384-d) through `opencv-imgproc` dnn; it loads and matches onnxruntime (cosine 0.9999) and
      separates copies from other photos far better than CLIP (median 0.71 against 0.90). No onnxruntime, no CLIP for
      now. int8 exports do not load in dnn. Text search (CLIP text tower, language question) stays open and is a
      separate later task; weights live in the models folder, outside the repo, licence noted in the sidecar.
      Steps: new tool command `embed --in FILE [--in FILE ...]` in qjs-opencv (batch, the model loads once; JSON line with
      the vectors, model name and version, so old vectors can be told from new); table `photo_embeddings(hash, model, vec BLOB)`; computed after the bake in
      `saveNew` / the ingest queue and by a backfill script for existing photos; `GET /api/photos/:hash/similar`
      (cosine, top N, threshold); editor and upload list show the warning, never block an upload.
      Done when: a re-saved, resized and slightly cropped copy of a test photo ranks first and an unrelated photo
      scores clearly lower, a test fixes the threshold; the 3 known pairs of 2026-10-29 are all found; a photo
      without a vector (tool or model missing) still uploads and the feature stays hidden, as with
      `capabilities.imgproc`.
- [ ] **11.2 Handwriting recognition**: deferred past the PoC (decided 2026-10-21).

## M12 - Graph view (after the editor's save phase; design and numbers in `GRAPH.md`)

- [x] **12.0 Decide** (2026-10-22): shared landscape, visibility owner/group/public,
      positions owner-defined, server-side cached tiles later. Still open: `GRAPH.md`
      S5 (edge kinds confirmation, who may link where, collaboration).
- [ ] **12.1 Rooted neighbourhood API** `GET /api/graph?root=<id>&depth=<n>`: nodes
      with child counts (`+N` badges), edges, `rev`, ETag/304, brotli; ordered
      children windowed (`?offset=&limit=`); visibility filter in the traversal
      (recursive CTE, measured ~2 ms/13 KB at 1 M nodes). Visible = owner, or
      `public`, or `group` with the viewer in `group_members`; an edge is sent only
      when both ends are visible. Done when a generated
      10 000-user data set answers depth 2 in under 5 ms.
- [ ] **12.2 Ops** `POST /api/graph/ops`: `link`, `unlink`, `move`, `pin`, `order`
      (shift siblings), `retitle`; edge labels limited to `child`, `sells`, `ref`; one
      transaction, bumps `rev`; permission check: owner or group admin.
- [ ] **12.2b Vendor** `d3-force`, `d3-zoom`, `d3-drag`, `d3-quadtree` (ISC) via
      `tools/vendor.sh`, versions in `vendor/VERSIONS`, relative imports only.
- [ ] **12.3 `GraphView`** (Preact SVG + vendored `d3-force`/`d3-zoom`/`d3-drag`):
      tokens for node/edge/label, stored positions, expand-on-demand on tap, tiles
      read-only, semantic zoom (colour -> label -> tile). Looks like
      `docs/screenshots/graph-mobile-*.jpg`.
- [ ] **12.3b Branch view** `BranchView` (GRAPH S2.7): computed layout (spine +
      branches, angles from `--wb-branch-*` tokens), camera `transform` with CSS
      transition, window fetch around the focus, tap = zoom a tile, lower-left =
      walk the spine, right = descend, back = up; SSR of the first view. Done when
      the 50-article list is walked end to end on a phone with only ~10 tiles in the
      DOM at a time.
- [ ] **12.3c Run presentations**: filmstrip/carousel and masonry (per category) as
      alternatives to the straight spine, chosen by the list node.
- [ ] **12.4 Edit gestures**: drag to move/pin, drag handle to relink, drag in a list to
      reorder; open a node = the single editor (`EDITOR.md` E34).
- [ ] **12.5 Live updates**: Bun WebSocket pub/sub of ops, `rev` gap -> refetch.
- [ ] **12.6 Overall-root** (shared landscape): seed the `overall-root` node with
      children `user-profiles` and `featured`; on sign-up create the user's root, a
      profile node (direct child of the root) and append a `ref` edge to
      `user-profiles` (`sort` = append). `featured` is curated by the
      **curators** group (owner of `overall-root` and members with role `curator`); entries are `ref` edges to articles, galleries, marketplaces.
      Both lists are windowed (paged by `offset`/`limit`), never sent whole. Done
      when the view starts at `overall-root` and a user can walk to any public
      profile in three taps.
- [~] **12.6a Seed** (2026-10-29, `GRAPH.md` S1.4): `tools/seed.js` makes `overall-root`, `art exhibition`, `fleamarket` and `places` with sample children; idempotent (found by title under the parent). `user-profiles` and `featured` stay with 12.6.
- [ ] **12.6c Places** (`GRAPH.md` S1.5): `at` edges owner-only until published (migration 5, per-edge `visibility`, with accounts; migrations 2-4 hold `place_suggestions`, `place_names`, the rename); editor side is EDITOR.md E136-E140.
- [ ] **12.6d Venues from KGS** (`GRAPH.md` S1.6): suggest the cultural objects near a place (KGS
      `identify`, with a tolerance in pixels, not metres) as candidates for `art exhibition`
      galleries; check the licence ("proprietary" in STAC) and whether `kgs_kategorie` can pick out
      museums, archives and libraries. Done when a place node can list its nearby venues.
- [ ] **12.6e Heritage and names** (`GRAPH.md` S1.6): find the working layer name of ISOS (the STAC id
      returns nothing from `identify`); try `SearchServer` with `origins=gazetteer` for named venues;
      evaluate the opendata.swiss museum sets, the MySwitzerland API (check it still exists) and
      swisscollections. Done when each is marked usable or dropped in `GRAPH.md` S1.6.
- [x] **12.6f Places housekeeping** (2026-10-29, `GRAPH.md` S1.5 point 6): (a) migration 4 renames the
      places of the old gazetteer to `Name (KT)` and merges duplicates; (b) cell-titled places snap to a
      cell that touches them (`titled()` in `server/api/places.js`); (c) decided: nodes saved before
      migration 2 get no suggestions, the position is gone; (d) decided: the chip's *Not now* stays per
      browser, the panel is the durable list; (e) answered suggestions are purged when the panel opens.
      Tests: `tests/place-housekeeping.test.js`.
- [ ] **12.6b Node lock**: `node_locks` table, `POST /api/nodes/:id/lock` (take/renew),
      `DELETE` (release), expiry after ~60 s without heartbeat, owner may break;
      the editor (`EDITOR.md` E67) takes the lock on open, shows "locked by <name>" read-only when
      refused. Ops and saves are rejected without the lock.
- [ ] **12.7 Groups** (with accounts): create group, invite/accept/leave, promote to
      `admin`, set a node's visibility to `group` (one `group_id`); ops are allowed
      for the owner and the admins of the node's group only; the cache key includes the viewer's
      memberships.
- [ ] **12.8 Server-side tiles** (later): rasterise a node on the server, cache by
      `rev`, serve as the `tile`; until then the palette colour is the fallback.

## M13 - Canvas nodes: 3D gallery, version 1 (`GALLERY.md` S0b, S10; after the editor's phase F and M12; editor parts: `EDITOR.md` E75-E78)

Minimal on purpose; everything not listed is deferred (`GALLERY.md` S0b).

- [~] **13.1 Document**: `scene3d` step (plan, style, start), validation, sanitiser; done 2026-10-29: `client/gallery/fromdoc.js` `planFromDoc` turns a gallery node's drawn `wall` shapes into the scene (stage units -> metres, y flipped, transforms applied, corridors cut back to the room walls, doorways cut in the walls, rooms counter-clockwise), used by `startGallery` for `kind: gallery` nodes before the auto plan (`tests/gallery-fromdoc.test.js`, fixture node 9); open: `scale`/`start` editing; photo
      role toggle (`EDITOR.md` E71, E76, E77); texture photos are never hung.
- [~] **13.2 Builder** `client/gallery/build.js`: walls, room and corridor floors, ramps
      (slope <= 1:12, walls tilt), texture set with default quads (`tools/gallery-warp.mjs`
      is the prototype); unit-tested without a DOM. Done: mitred walls grouped by compass
      face, room/corridor floors (ear clipping), ramps, collision segments, floor height,
      corner and slope warnings (`tests/gallery-build.test.js`). Open: the texture set /
      default quads (the scene maps `uv` metres to textures), room heights with ramps
      between rooms of different level.
- [~] **13.3 Scene**: three.js 0.186.1 vendored by `tools/vendor.sh` (`vendor/three/`: `three.core.js`,
      `three.module.js` minified with bun because the npm package ships none, `PointerLockControls.js`),
      loaded on enter. Done: `client/gallery/scene.js` `makeWorld` / `enterScene` (mesh per group,
      frameless canvases 1.3 m, 4 cm off the wall with a soft shadow and a name plate below (S5.1), placeholder colour, tiles fetched within 25 m, 6 warm spots on the nearest
      pictures, dim ambient, seeded starfield, dispose); `static/gallery-demo.html` (dev aid, `?n=40`
      tours the auto plan). Textures: `style.wall|floor|corridor.texture = { color, roughness?, tile }` (urls, metres per repeat) are applied; the auto plan has looks (`autoplan.js` LOOKS, `?look=warm|walnut|stone` on the node page): warm (default) = WoodFloor034 pine floors, tinted Plaster001 walls, Marble017 on the bridges; walnut = WoodFloor014; stone = marble and concrete (ambientCG, CC0, `static/textures/`). Open: the node's own texture photos as the source (13.1), fake light wash for
      the pictures beyond the 6 spots, context-loss handling in the host (13.6).
- [x] **13.4 Walking**: `client/gallery/walk.js` (circle vs wall segments, floor-only movement, eye follows the
      floor height, pitch limit) and `controls.js`: W A S D / arrows / Q E / shift, pointer lock and mouse look,
      touch: left half a stick, right half drag-look, tap a picture to open it. Tested (`tests/gallery-walk.test.js`).
- [x] **13.5 Auto-hang**: `hang.js` slots and `hang()`, `items.js` (child nodes with tiles in edge order,
      else the node's own photos, no textures); tap on a picture opens its node.
- [x] **13.6 Host**: `client/components/GalleryView.js` on the node page (`NodePage.js`): the node's own view is the
      poster with an "enter" button (offered for list/album/gallery nodes, nodes with child nodes, slide shows
      and grids with at least two pictures); `client/gallery/session.js` loads on enter (three.js with it),
      one live canvas, fullscreen (Fullscreen API, else a page-filling class), leave disposes, no WebGL or a
      lost context shows a message. The server adds the visible `child` edges to the node page's boot data.
      Tested in headless Chrome (software GL): enter, walk, fullscreen, leave. Open: stage-sized canvas
      resize while fullscreen on a phone, a per-node `scene` plan instead of the auto plan (13.1).
- [x] **13.8 Auto plan** `client/gallery/autoplan.js` (done, tested): a node without a
      drawn plan, e.g. a plain `list` such as "Sous-soul Vitrines", gets a generated one: a
      row of 12 x 8 m rooms joined by 6 m corridors, as many rooms as the children need
      (`GALLERY.md` S3.6). The host uses it for every gallery until `scene` (13.1) exists.
- [x] **13.9 Gallery of all nodes** (`/:lang/gallery`, the "Show" tab): `client/components/GalleryPage.js`
      lists every saved node with a tile as a link grid (works without JavaScript) and a button for the 3D gallery of
      them all (`items.js` `nodeItems`, auto plan, titles on the plates, a tap opens the node).
      Open: order (newest first for now), filters (a group's members only), a per-node `scene` plan.
- [x] **13.10 Stale tiles**: a node saved before server-side tiles (or as a plain photo collage) showed one
      photo in the graph and the gallery. `needsRender` (`server/media/raster.js`) now also covers photo-only collages
      (several photos on page 0, or one faded, blended or clipped); `bun tools/retile.js [--dry] [--force] [ids]`
      (`server/node/retile.js`) re-renders the stale ones, the node itself untouched. Run it once after deploying.
- [x] **13.11 Guided walk** (`stations.js`, `route.js` A* over the floor, `tour.js`, `controls.js` modes, `session.js`,
      HUD in `GalleryView.js`): the gallery starts guided at picture 1; arrows / Space / swipe / buttons go to the next or
      previous picture (a sideways glide along a wall, a routed walk across corners, doors and corridors), wheel / pinch /
      Up-Down zoom (field of view, 70 to 10 degrees), a tap on a picture goes to it and the next tap zooms to fill the stage,
      Open is a button, W A S D or Q E hand over to free walking, G or the button back. Zoomed in, the picture is swapped for
      a sharper one (`GET /api/nodes/:id/large`: the baked photo, or a 1600 px render cached as `<tile>.large.jpg`; 4 stay
      loaded). No automatic slide show (decided). Sky: shader stars with twinkle, colour temperatures and a Milky Way band.
- [ ] **13.12 Moving works, design** (decided 2026-10-29): a hung work may be an overhead projector with a slide show or a
      machine (Tinguely / Luginbuehl style) as a vector animation, besides the still canvas. Recorded in `GALLERY.md` S5.2
      (kinds, prop, canvas renderer, budget, safety, guided walk), S9 and S10 (Q7-Q9), and in `EDITOR.md` S2.3c (motors),
      S2.9 (Hung as), S3.1 (`motor` step, `doc.motion`), S5 (`motionAt`) and phase N (E141-E146). The tour itself never advances
      by itself (decided). Done when 13.13-13.15 and E141-E146 are done.
- [ ] **13.13 Projector** (`client/gallery/projector.js`, Q7): the prop (trolley, glass stage, head, mirror), the faint cone
      with dust, the screen flush with the wall, a cross-fade shader between two slide textures, the next slide fetched
      while one shows; pure `slideAt(t, n, dwell, fade, shuffleSeed) -> { from, to, mix }`; a projector takes two slots
      (`hang.js`) and a collision circle (`build.js`); `items.js` carries `slides`; zoomed in the sharp slide. Done when a slide
      node shows its photos one by one with the fade, and `tests/` cover `slideAt`, the two-slot rule and the collision.
- [ ] **13.14 Machine canvas** (`client/gallery/machine.js`, Q8; needs E141-E142): `CanvasTexture` redrawn from `motionAt`;
      static layers baked offscreen; photo, shape, stroke and text steps, clips by `Path2D`, `blend` by
      `globalCompositeOperation`; curved text stays static; `start: 'tap'` toggles on a tap at the station; the nearest two
      within 12 m and in view run at 20 fps and 1024 px, zoomed in 30 fps and 1600 px, the rest show the rest pose. Done
      when a node with motors turns on the wall and `tests/` cover the layer grouping, the frame scheduler and the budget
      choice without a DOM.
- [ ] **13.15 Motion safety and budget** (Q9): `prefers-reduced-motion` shows the rest pose with a HUD "motion off" button;
      no blink faster than 0.5 s and no cross-fade shorter than 0.3 s (WCAG 2.3.1); a hidden tab or a lost context pauses.
      Done when the system setting stands every moving work still, in a browser test.
- [ ] **13.7 Plan layer in the 2D editor** (`EDITOR.md` E75): wall layer with height; rooms =
      closed, corridors = lines; refuse corners sharper than 90 degrees.

## Docs and housekeeping (do alongside, not blocking)

- [ ] **H1 Design source of truth** (P S4): extract tokens, asset inventory,
      component catalogue, paper-texture recipe, dead styles from `attic/`,
      `static/` and the screenshots (0.2) into `DESIGN.md`, **as the `--wb-*`
      token list** plus the `kraft` theme values. Do it before M8 so tokens
      from 2.3 stay consistent.
- [ ] **H1b Theme authoring note** in `DESIGN.md`: how to write a theme file,
      what a node may override, the sanitiser's whitelist.
- [ ] **H2 Update `attic/HISTORIC.md`** paths to the `attic/` prefix.
- [ ] **H3 `DESIGN.md` S4.x vs PoC**: mark which parts the PoC replaces (done
      for S4.1; do S4.2.1 `tiles` -> `nodes` (decided: node, not tile), S4.3 image pipeline; S4.5 editor now points to `EDITOR.md`).
- [ ] **H4 Tests**: `bun test` for router/ingest/palette/i18n parity; hostile
      inputs (traversal, extension mismatch, oversize, zero byte, tool missing)
      (P S13).
- [x] **H5 Resolve open questions** (P S15): all decided: SHA-256, upload formats
      (jpg/jpeg/png/heif/heic, HEIC extracted), baked JPEG without raising source quality (q99 only for non-JPEG sources; alpha: WebP/PNG), alpha on
      cutout, server-side clip, videos out, node naming, no handwriting.
- [ ] **H7 Keep the companion docs in step**: `GRAPH.md`, `GALLERY.md`, `PLAN.md`,
      `DESIGN.md` 4a/4.2.1/4.4/4.5 and this file must agree (decisions of 2026-10-22).
- [ ] **H6 Commit hygiene**: commit `DESIGN.md`, `PLAN.md`, `TODO.md`,
      `CLAUDE.md` and the `attic/` move as separate commits.
