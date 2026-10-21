# TODO - Wild Beauty rewrite

Source of truth: this file for the **directory layout** (PLAN S5 mirrors it), `PLAN.md` for
everything else, then `DESIGN.md`. A content item is a **node** (not tile). Videos and
handwriting recognition are out of the PoC. Target is
**Bun only**, no runtime abstraction (`PLAN.md` S2.1). Old code is read-only in
`attic/` (`CLAUDE.md`).

Conventions: `[ ]` open, `[x]` done. Each task is small enough for one commit
and ends in something you can run or look at ("done when"). Do tasks in order;
a milestone is finished when all its tasks are. Section references: `P` =
PLAN.md, `D` = DESIGN.md.

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
Note: `stylesheet.css` declares Fixed, Jewel Hill and Manjari, but only
`Fixed-Medium.*` and `jewel-hill.ttf` exist on disk; the `hinted-*` files it
points to (Jewel Hill, Manjari) are missing. Fonts are served from `/static/`.

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

- [ ] **2.1 Vendor Preact** (`vendor/`, served as `/vendor/`): `preact.js`, `hooks.js`, `htm.js`,
      `preact-render-to-string.js`, bare `preact` import rewritten to relative,
      pinned in `vendor/VERSIONS`, licences copied (D S9.2, S9.5). Script:
      `tools/vendor.sh`. Done when `bun -e "import('./vendor/htm.js')"` works and
      `vendor/VERSIONS` lists four packages.
- [ ] **2.2 SSR shell**: `server/ssr.js` `renderPage(vnode, {lang, title})` ->
      `<!doctype html>` with head (charset, viewport, favicon, CSS links,
      import map for `/vendor/*`), body, boot JSON. `GET /:lang/new` renders a
      placeholder `<h1>`. Done when `curl localhost:3000/en/new` returns the page.
- [ ] **2.3 Token contract + default theme**: `static/css/layout.css` (no
      colours) and `static/themes/kraft.css` defining the `--wb-*` tokens
      (contract: P S16.3; a distilled draft of `kraft.css` is already written,
      this task wires it to `layout.css` and checks it on a page): wallpaper image/colour (`tile-background.png` is the wallpaper of `kraft`), ink, accent (crimson
      `~#9c2b3c`), accent-text, border width/colour, radius, frame width (the
      drop-zone's 4px), font-ui, font-size, button/tab/node shapes, icon urls,
      selection colour (blue), danger colour (red), shadow. Values from the
      screenshots and D S7; only what `/new` needs now (full extraction is H1).
      Document each token in a comment. Done when the page shows the paper
      texture and changing `kraft.css` alone restyles it.
- [ ] **2.4 Fonts**: fix `static/fonts/stylesheet.css` so every `src` points at an
      existing file (drop the dead `hinted-*` entries or the Jewel Hill/Manjari
      faces); set the pixel/terminal face (Fixed) for UI chrome (D S7.3). Done when
      the browser network tab shows no 404 for fonts.
- [ ] **2.5 Chrome** (colours via tokens only): header with logo (`logo-transparent.png`) and the crimson
      tab strip (Home, Show, Tree, New active, Language) as `client/components/Nav.js`;
      active tab glow and the one-line caption under it (D S7.2). Tabs for
      unbuilt pages are plain links to `/`. Done when `/en/new` looks like the old
      app's chrome on desktop and phone width (no truncated tab text).
- [ ] **2.6 Components dir + htm helper**: `client/components/`, one
      `client/html.js` (`html = htm.bind(h)`) shared by server and browser. Nav from 2.5 moves
      there. Done when the same file is imported by `ssr.js` and served at `/app/`.
- [ ] **2.7 Static route for modules**: `GET /app/*` and `GET /vendor/*` in
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

- [ ] **3.1 `locales/{en,de,fr}.json`** with the keys used so far (tab labels,
      page title, drop-zone text) and `meta.name`; `t(key, params)` with `en`
      fallback and `Intl.PluralRules` plurals (P S11.7). Used by SSR and client
      (same file). Done when `/de/new` and `/fr/new` show translated chrome.
- [ ] **3.2 Locale negotiation**: URL prefix, `wb-lang` cookie, `Accept-Language`,
      `en`; `/` redirects accordingly. Language tab lists `locales/*.json`
      (flags from `static/img/flag-*.svg`). Done when adding `locales/xx.json`
      makes `xx` appear with no other edit.
- [ ] **3.3 `tools/check-locales.js`**: fails when key sets differ. Done when
      removing a key from `fr.json` makes it exit non-zero.

## M4 - Upload drop zone (client only, no server yet)

- [ ] **4.1 `UploadArea` component** (SSR renders it empty, client adopts it),
      laid out like the historic screenshot: framed square-cornered zone
      (frame width/colour from tokens), big `action-upload.svg`, text "Drag and
      drop Images Here to Upload", "Or", accent button "Select Images to Upload"
      (all translated, M3), hidden `<input type=file multiple accept=image/*>`.
      Done when dropped files are listed by name and size under the zone.
- [ ] **4.2 File cards**: square thumbnail (5 columns on phone width, more on
      wide screens) with thin border, round remove button (red X, token
      `--wb-danger`) and rotate button (blue, `icon-rotate.svg`) overlapping the
      top-right, state (queued), selected state (thick `--wb-select` border and
      shadow). Dragover highlight. Directories ignored for now. Done when 10
      dropped photos show as 10 cards and selecting one gives the blue frame.
- [ ] **4.3 Extend preview (client-side)**: `object-fit: contain` over a
      neutral ground; toggle per card to `cover` (P S11.1). Colours come in M6.
      Done when the toggle flips one card without touching the others.

## M5 - Upload to server, with progress

- [ ] **5.1 `POST /api/uploads`**: raw body, filename in `X-Filename`; stream to
      `uploads/.tmp/<rand>` while hashing (`Bun.CryptoHasher` sha256); enforce
      `maxBytes`; magic-byte sniff (main: jpg/jpeg/png/heif/heic; also webp/gif/avif/tiff; images only,
      anything else incl. video -> 415); rename to
      `uploads/<hash>.<ext>`; dedupe; respond JSON `{hash, ext, name, size}`
      (P S6.2 steps 1-3). Done when `curl --data-binary @a.jpg` creates the file.
- [ ] **5.1b HEIC/HEIF extraction** (`server/media/heif.js`, P S6.2 step 3b): for
      `.heic`/`.heif` write `uploads/<hash>.display.jpg` (`.png` when alpha) with
      `heif-convert -q 99`, fallback ImageMagick `convert in[0]`; argv array, `--`,
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
- [ ] **5.3 Client upload with progress**: `XMLHttpRequest` per file,
      `upload.onprogress` -> progress bar on the card, concurrency 3, states
      queued/uploading/done/failed + retry, abort on remove (P S11.1). Done when a
      large file shows a moving bar and a killed server shows "failed".
- [ ] **5.4 Hash safety**: `hash` validated `^[0-9a-f]{64}$` everywhere, extension
      whitelist, no path built from user text (P S9). Done when
      `GET /files/uploads/../../etc/passwd` returns 400/404.

## M6 - Ingest: metadata and palette

- [ ] **6.1 Tool detection** at start: `mediainfo`, `exiftool`/`exiv2`,
      `magick`/`convert`; `GET /api/capabilities`. Done when it lists what is
      installed here (`convert` IM6, `exiftool`, `mediainfo`).
- [ ] **6.2 Probe**: `mediainfo --Output=JSON` and `exiftool -json -n` in
      parallel, each with timeout and output cap, argv arrays, `--` before the
      file (P S9). Done when a JPEG yields width, height, orientation.
- [ ] **6.3 Palette**: `convert f[0] -auto-orient -resize 128x128 -colors 8
      -depth 8 -format %c histogram:info:-` -> ordered `{hex, weight}`; when
      `capabilities.imgproc` is present use `opencv-imgproc palette --in=<f>
      --count=8` instead (JSON `colors` hex list, argv form `--name=value`), falling
      back to ImageMagick (also for weights); `padding`
      = 2 colours, second far from the first in OKLab (own 15 lines) (P S6.2 step
      5). Done when a unit test with a two-colour PNG returns both, weighted.
- [ ] **6.4 Sidecar**: write `uploads/<hash>.json` (temp + rename) with
      everything above; degrade to `errors: []` instead of rejecting. Upload
      response returns the sidecar. Done when the file appears next to the image.
- [ ] **6.5 Cards use the palette**: extended preview gradient from the two
      `padding` colours (P S11.1). Done when a portrait photo shows colour
      padding left and right.

## M7 - Existing uploads (list, SSR, delete)

- [ ] **7.1 `GET /api/uploads`**: read `uploads/*.json`, newest first.
- [ ] **7.2 `GET /files/uploads/:hash.:ext`** (validated, `Cache-Control`).
- [ ] **7.3 SSR the list**: `/:lang/new` renders cards for files already on
      disk and a `<script type=application/json id=boot>`; the client adopts
      them (no flash). Done when a reload keeps the cards.
- [ ] **7.4 `DELETE /api/uploads/:hash`** removes image and sidecar; delete
      button on the card calls it. Done when the files vanish from `uploads/`.
- [ ] **7.5 Quota**: total `uploads/` size cap with a translated error (P S9).

**First deliverable ends here (M1-M7): `/new` with design, i18n, drop zone,
progress, metadata, palette, list, delete.**

## M8 - Node editor shell

- [ ] **8.1 "New node" button** (`action-new.svg`) under the upload area;
      mounts `NodeEditor` below it, several may stack. No photos needed.
- [ ] **8.2 Square frame**: `aspect-ratio: 1`, 1px outline, tool columns left
      and right, `overflow: hidden; touch-action: none; contain: paint`.
- [ ] **8.3 Node document model** `client/editor/model.js` (v1; photo steps
      only) and `render.js` (model -> SVG vnodes, also used for SSR) (P S7).
      The model has `style: { theme, vars }` from the start (Theming rule).
- [ ] **8.3b Per-node theme**: the editor frame and the rendered node sit in a
      wrapper with the node's `data-theme` and sanitised vars (2b.5); a theme
      picker in the right tool column changes only that node. Done when two
      stacked editors wear different themes at once.
- [ ] **8.4 Drag a card into the frame** (HTML5 drag plus pointer fallback) ->
      `photo` step, `fit: extend`.
- [ ] **8.5 Gestures** `gestures.js`: one pointer translate, two pointers
      similarity transform, wheel zoom, double-tap cycles extend/cover/free
      (P S11.3). Unit test `solveSimilarity` without a DOM.
- [ ] **8.6 Undo/redo** for steps.
- [ ] **8.7 Film-strip**: vertical, right of the frame, only when >1 photo;
      select, reorder (P S11.2).

## M9 - Save a node

- [ ] **9.1 SQLite schema** (`bun:sqlite`, WAL, `user_version`): photos, nodes,
      node_photos, node_links (P S8). Done when the DB file is created at start.
- [ ] **9.2 `POST /api/nodes`**: validate doc, bake used uploads into
      `data/photos/<hash>.<ext>` (auto-orient, strip, max 2048 edge; JPEG sources are never
      re-encoded at a higher quality: lossless `jpegtran` pass-through, or own `%Q` when
      shrunk; non-JPEG opaque sources JPEG q99; P S8) plus a
      square thumbnail rendition (alpha photos baked as WebP/PNG, never JPEG), insert rows in one transaction, delete uploads only
      after commit; reconcile leftovers at start (P S8).
- [ ] **9.2b Theme in the DB**: `nodes.doc` keeps `style.theme`; on save the
      sanitiser runs again and rejects unknown theme ids. Done when a node saved
      with `blueprint` reloads with `blueprint`.
- [ ] **9.3 Save button** in the editor; saved photos disappear from the upload
      list.
- [ ] **9.4 Pages and modes**: multi-page nodes, step scrubber, `free` /
      `slides` / `grid` (P S7, S11.2).

## M10 - Vector tools

- [ ] **10.1 Vendor `perfect-freehand` and `bezier-js`** (extend 2.1).
- [ ] **10.2 Ink pen**: pointer samples -> One-Euro filter -> resample ->
      perfect-freehand outline -> `stroke` step; width from pressure and speed
      (P S11.4).
- [ ] **10.3 Shape tool**: click vertices, drag handles, open/closed/filled,
      `shape` step as SVG path (P S11.5).
- [ ] **10.4 Clip / unclip** a photo with a shape; blend mode and opacity
      popover (P S11.6).
- [ ] **10.5 Gesture snapping** (`$1`/`$P`) for scribbled shapes. Deferred past the PoC.

## M11 - Optional extras

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
      the photo matrix) for a destructive cut-out and for the thumbnail rendition in
      9.2 (P S10 use 2).
- [ ] **11.2 Handwriting recognition**: deferred past the PoC (decided 2026-10-21).

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
      for S4.1; do S4.2.1 `tiles` -> `nodes` (decided: node, not tile), S4.3 image pipeline, S4.5 editor).
- [ ] **H4 Tests**: `bun test` for router/ingest/palette/i18n parity; hostile
      inputs (traversal, extension mismatch, oversize, zero byte, tool missing)
      (P S13).
- [x] **H5 Resolve open questions** (P S15): all decided: SHA-256, upload formats
      (jpg/jpeg/png/heif/heic, HEIC extracted), baked JPEG without raising source quality (q99 only for non-JPEG sources; alpha: WebP/PNG), alpha on
      cutout, server-side clip, videos out, node naming, no handwriting.
- [ ] **H6 Commit hygiene**: commit `DESIGN.md`, `PLAN.md`, `TODO.md`,
      `CLAUDE.md` and the `attic/` move as separate commits.
