# Wild Beauty - Rewrite Plan (minimal PoC)

Status: draft, 2026-10-21. Supersedes the stack choices in `DESIGN.md` S4.1
(Astro, Postgres, Prisma, object storage, auth) **for the PoC only**; the data
model ideas in `DESIGN.md` S4.2.1 (tiles, photos, tile_links, palette as an
ordered array) and the visual language in S7 stay valid. The old code is
frozen, see `CLAUDE.md` and Phase 0.

## 1. Scope

The PoC implements **one page, `/new`**, and everything it needs:

1. multi-file drag-and-drop upload with per-file progress
2. server-side ingestion: hash, metadata sidecar, dominant-colour palette
3. list of previously uploaded files (on disk, not yet in the DB), deletable
4. "new node" button -> a square node editor below the upload area
5. drag a photo into the node, transform it with multi-touch
6. film-strip navigation when a node has more than one photo
7. two vector tools (ink pen, shape tool) and clip-path compositing
8. saving a node: used photos move from `uploads/` to `data/` and into SQLite

Out of scope: login/sessions (anyone can upload and create), the graph view,
browse pages, user/group tables, migration of the old data.

## 2. Constraints and decisions

| Topic | Decision |
|---|---|
| UI library | Preact, no JSX, no bundler, no Next.js |
| Components | `h('tag', props, children)` or `` html`<a href=${href}>..</a>` `` (htm bound to `h`) |
| Modules | plain ES modules served as files; an import map maps `preact`, `preact/hooks`, `htm`; vendored under `static/vendor/` (no CDN at runtime) |
| Server | **Bun only**: `Bun.serve()`, written directly against Bun's APIs (S2.1) |
| DB | `bun:sqlite` directly, a few small helper functions in `db.js` (not an abstraction layer) |
| SSR | `preact-render-to-string`; same component tree as the client |
| Languages | de, fr, en; adding one = adding one JSON file |
| Auth | none for the PoC; hard limits instead (size, count, type), see S9 |
| Tools | `mediainfo`, `exiv2` or `exiftool`, ImageMagick (`magick`, or `convert` on IM6 as installed here) for pixels, spawned with argv arrays, never via a shell |

### 2.1 Bun is the target; no runtime abstraction

Bun is stable and it is the only runtime this project targets. There is **no
adapter layer, not even a thin one**, and no `Bun <-> qjsm` portability
code: the server calls `Bun.serve`, `Bun.spawn`, `Bun.file`, `Bun.write`,
`Bun.CryptoHasher` and `bun:sqlite` directly, and uses the global
`Request`/`Response`/`Headers`/`FormData`/`URL`, no import indirection.

- Do not write `if (typeof Bun ...)` branches, runtime detection, or wrappers
  whose only purpose is to let a second runtime plug in.
- If qjsm happens to run a file unchanged (its `serve` is Bun-shaped and it
  ships a `Bun` shim), that is a bonus, never a requirement, and it never
  shapes the code. Anything the shim lacks (`bun:sqlite`, `Bun.CryptoHasher`,
  `Intl`) is simply used.
- Consequences: `Intl` is available (plural rules and date/number formatting
  use `Intl.PluralRules`, `Intl.NumberFormat`, `Intl.DateTimeFormat`);
  SHA-256 is `Bun.CryptoHasher`; no `sha256sum` subprocess.
- Optional QuickJS-only tooling (background removal, S10) is a **separate
  program run as a subprocess** from the Bun server (`qjsm tools/rembg.js`),
  detected through `/api/capabilities`; it is not a second server runtime.

## 3. Phase 0 - housekeeping (before any code)

- [x] Archive: old code moved to `attic/`, also tag and branch
      `before-rewrite`; `CLAUDE.md` scoped to `attic/`.
- [ ] Update `attic/HISTORIC.md` paths to the `attic/` prefix.
- [ ] Generate the **design source of truth** (S4) into `DESIGN.md`.
- [x] QuickJS modules surveyed (`DESIGN.md` S9); now background information
      only, since Bun is the sole target (S2.1).
- [ ] Check `Bun.serve` request-body streaming and `maxRequestBodySize`
      for 40 MB uploads.
- [ ] Library choices: done in `DESIGN.md` S9; `tools/vendor.sh` still to write.

## 4. Design source of truth (DESIGN.md update)

Derive, do not invent. Inputs: `components/`, `pages/`, `static/` (css, fonts,
img, html), `public/`, and the screenshots already analysed in `DESIGN.md` S7.

Output sections to add or replace in `DESIGN.md`:

1. **Tokens**: colours (with where each is used), font stacks and sizes,
   spacing, borders, radii, shadows, z-index layers, transitions, breakpoints.
   Expressed as a single `:root { --wb-... }` block that the new
   `static/css/tokens.css` copies verbatim.
2. **Asset inventory**: every image/font/texture in `static/`, its size,
   dimensions, where it is referenced, and keep / drop / regenerate.
3. **Component catalogue**: each old component's markup structure, class
   names, states, and which rules in which CSS file style it (`file:line`).
4. **Texture recipe**: the kraft-paper ground (S7.1) as CSS layers so it can
   be reproduced without hand-copying screenshots.
5. **Dead styles**: rules that no component references.

Method: grep every class/id used in `components/` and `pages/`, join against
selectors in `static/css/*` and `static/style.css`, list unmatched on both
sides. Tooling: `extract-c`-style scanners do not apply to CSS; a short
throw-away script in the scratchpad is enough and is not committed.

## 5. Repository layout (new tree)

```
server/
  main.js                 entry: Bun.serve({ fetch: router })
  core/
    router.js             (Request) -> Response, path params, method table
    ssr.js                renderPage(component, props, ctx) -> full HTML
    i18n.js               locale negotiation, t(), plural, fallback chain
    config.js             paths, limits, tool names
  api/
    uploads.js            list / create / delete uploads, serve originals
    nodes.js              create node, move photos to data/
    capabilities.js
  media/
    ingest.js             hash, extension, sidecar orchestration
    probe.js              mediainfo + exiv2/exiftool -> normalised JSON
    palette.js            ImageMagick histogram -> ordered palette
    bake.js               final crop/extend/strip/resample into data/
    rembg.js              spawns `qjsm tools/rembg.js` (qjs-opencv grabCut), optional
  db/
    db.js                 wrapper: open(), exec(), run(), get(), all(), tx()
    schema.sql
client/                   served as-is under /app/
  app.js                  hydrate entry
  components/             Upload*, NodeEditor, Toolbar, Filmstrip, ...
  editor/
    model.js              node document model (S7)
    render.js             model -> SVG vnode tree (shared with SSR)
    gestures.js           pointer-events multitouch -> matrix
    pen.js                stroke capture, smoothing, width profile
    shapes.js             polyline / bezier editing
  i18n.js                 client t(), same JSON files
static/                   css/tokens.css, fonts, img (from the old assets)
locales/                  en.json de.json fr.json
uploads/                  <hash>.<ext>, <hash>.json         (gitignored)
data/                     photos/<hash>.<ext>, wb.sqlite3   (gitignored)
PLAN.md DESIGN.md CLAUDE.md   (old README.md and HISTORIC.md live in attic/)
```

No `package.json` scripts that build. Vendored files are copied once by a
documented shell snippet (`tools/vendor.sh`), checked in, and pinned by version.

## 6. Server

### 6.1 Routes

| Route | Purpose |
|---|---|
| `GET /` | redirect to `/<locale>/new` |
| `GET /:lang/new` | SSR page (S6.3) |
| `GET /app/*`, `/static/*` | module and asset files, `Cache-Control` by extension |
| `GET /api/capabilities` | `{ rembg, languages, limits, tools }` |
| `GET /api/uploads` | list uploads with sidecar JSON |
| `POST /api/uploads` | one file per request, raw body, name in header |
| `DELETE /api/uploads/:hash` | remove file and sidecar |
| `GET /files/uploads/:hash.:ext` | original, used by the editor |
| `GET /files/photos/:hash.:ext` | final stored photo |
| `POST /api/nodes` | create node (S8) |
| `POST /api/uploads/:hash/rembg` | optional, needs `qjsm` + qjs-opencv |

`:hash` is validated against `^[0-9a-f]{64}$` before it touches a path.

### 6.2 Upload ingestion

One request per file, so the browser reports real byte progress (XHR
`upload.onprogress`; `fetch` cannot) and one failure does not poison a batch.

1. Stream the body to `uploads/.tmp/<random>` while hashing (SHA-256).
   Reject above `maxBytes`.
2. Sniff the type from magic bytes (jpeg, png, webp, gif, avif, heic, tiff,
   plus mp4/mov if video is wanted later); the client-supplied extension is
   only used if it agrees. Extension is lower-cased and whitelisted.
3. Rename to `uploads/<hash>.<ext>`; if it already exists, drop the temp file
   and return the existing record (dedupe for free).
4. Probe, in parallel, with a timeout each:
   - `mediainfo --Output=JSON <file>`
   - `exiv2 -pa -b` or `exiftool -json -n -G1` (whichever is installed;
     detected once at start, reported in `/api/capabilities`)
5. Palette: `convert <file>[0] -auto-orient -resize 128x128 -colors 8 -depth 8
   -format %c histogram:info:-` (checked: ~0.1 s, gives weight and hex per
   colour). Parse, sort by weight, store the ordered `{hex, weight}` array
   `DESIGN.md` S4.2.1 asks for. No JS quantiser needed. Also store
   `padding: [hex, hex]`: the most dominant colour plus the next one far
   enough from it in OKLab (own 15-line conversion).
6. Write the sidecar `uploads/<hash>.json`:
   `{ hash, ext, name, size, mime, width, height, orientation, mediainfo,
   exif, palette, padding, uploadedAt }` via temp file + rename.
7. Respond with the sidecar.

Failures at steps 4-5 degrade (sidecar gets `"errors": [...]`), they do not
reject the upload.

### 6.3 SSR of `/new`

Minimal on purpose: the server renders the page chrome, the localized strings,
and the **upload area with the files already on disk** (so a reload shows them
without a flash). The editor is a stub (`<div id="editor" data-hydrate>`)
that the client mounts; it is not server-rendered because it only exists
after a click. The upload list is rendered by the same `UploadList` component
the client uses, so hydration is a no-op for it.

Initial state travels as `<script type="application/json" id="boot">`.

## 7. Node document model

A node is data, rendered by one interpreter, so SSR, the editor and later the
viewer all draw the same thing. Stored as JSON in `nodes.doc`.

```
node = { v: 1, style: {...}, mode: 'free'|'slides'|'grid',
         pages: [ page, ... ] }
page = { id, duration?, steps: [ step, ... ] }      // step-sequencer
step = one of
  { op: 'photo',  id, photo: <hash>, m: [a,b,c,d,e,f],
                  fit: 'extend'|'cover'|'free', opacity, blend, clip?: shapeId }
  { op: 'stroke', id, pts: [[x,y,w],...], color, smooth }   // pen result
  { op: 'shape',  id, path: 'M..C..Z', closed, fill, stroke, strokeWidth }
  { op: 'clip',   target: photoStepId, shape: shapeId }     // set clip-path
  { op: 'unclip', target: photoStepId }
  { op: 'blend',  target, mode }
  { op: 'transform', target, m, ease? }                      // animated move
```

- Coordinates live in a unit square (0..1000), independent of screen size.
- The renderer maps steps to SVG: `<image>` with `transform`, `<clipPath>`
  from shapes, `mix-blend-mode` via style, strokes as filled `<path>`.
  SVG, not canvas, because it is SSR-able, resolution-independent and easy to
  hit-test. If it gets slow with many strokes, rasterise finished pages.
- "Free", "slide-show" and "tile-grid" are different `mode`s over the same
  steps (grid = auto-generated transforms, slides = one photo step per page).
- Page N shows steps `0..k` of that page; the sequencer UI scrubs `k`.

## 8. Database (SQLite, `data/wb.sqlite3`)

```sql
photos(hash TEXT PRIMARY KEY, ext TEXT, width INT, height INT, bytes INT,
       palette TEXT, meta TEXT, created_at INT);
nodes(id INTEGER PRIMARY KEY, title TEXT, doc TEXT, palette TEXT,
      created_at INT, updated_at INT);
node_photos(node_id INT REFERENCES nodes, photo_hash TEXT REFERENCES photos,
            sort INT, PRIMARY KEY(node_id, photo_hash));
node_links(id INTEGER PRIMARY KEY, from_id INT, to_id INT, label TEXT NOT NULL,
           UNIQUE(from_id, to_id, label));     -- created now, unused by the PoC
```

`PRAGMA journal_mode=WAL; foreign_keys=ON`. Schema version in
`PRAGMA user_version`, migrations as numbered statements in `schema.sql`.
Names follow `DESIGN.md` S4.2.1 where they overlap (`tile` is called `node`
here, since that is the term the editor uses; keep one name and rename the
other docs when the PoC lands).

### Saving a node (`POST /api/nodes`)

Body: the node doc. In one transaction:
1. validate the doc (size, step count, referenced hashes exist in `uploads/`
   or `data/photos/`);
2. for each used upload: **bake** into `data/photos/<hash>.<ext>`:
   auto-orient, strip all metadata (`magick -strip`), resample to a max long
   edge (2048), re-encode (JPEG q82 or WebP); the original crop/extend stays
   a *non-destructive transform in the doc*, so editing later is lossless;
   additionally a `<hash>.tile.jpg` square rendition with the node's own
   crop/extend applied for thumbnails;
3. insert `photos`, `nodes`, `node_photos`;
4. delete the upload and its sidecar only after the commit succeeded.

If the process dies between 2 and 4 the photo exists in both places; the next
start reconciles (anything in `data/photos` also in `uploads` is removed from
`uploads`). Baking is idempotent.

## 9. Safety without accounts

No login does not mean no limits:
- per-file max (e.g. 40 MB), per-request count, total `uploads/` quota with
  a clear error and a way to delete (the list already has delete);
- hash and extension whitelists, no path ever built from user text except the
  validated hash and the whitelisted extension;
- external tools get argv arrays, `--` before file names, a timeout, an
  output cap, and run with a minimal environment;
- ImageMagick `policy.xml` limits (memory, area, disallow `@` and
  `MVG`/`MSL`/`URL` coders); decode only the first frame;
- user-supplied names are shown through the component tree (escaped), never
  concatenated into HTML;
- documented plainly: the PoC is for a trusted network or behind a reverse
  proxy that rate-limits.

## 10. Optional QuickJS helper (background removal)

Not a server runtime. Background removal needs OpenCV, which exists as
`qjs-opencv`. If `qjsm` and the module are present, the Bun server runs
`qjsm tools/rembg.js <in> <out>` as a child process (argv array, timeout).

- grabCut seeded with the centre rectangle or a user-supplied rectangle;
  output is a PNG with alpha, saved as a new upload (new hash, `derivedFrom`
  in the sidecar).
- Availability is detected once at start and reported in
  `/api/capabilities`; the client hides the tool when `rembg` is false.
- Open: `grabCut` was not found in `qjs-opencv`'s `src/` or `include/`
  (`DESIGN.md` S9.6); confirm before promising the feature.

## 11. Client

### 11.1 Upload area
- Drop zone (`dragenter/over/leave/drop`, plus a hidden `<input multiple>`
  for tap/click), accepts files and directories (`webkitGetAsEntry`).
- Each file is a card with: thumbnail (object URL while uploading, server
  file afterwards), a progress bar, state (queued, uploading, processing,
  done, failed + retry), a delete button.
- Concurrency 3. Cancel on delete while uploading (`xhr.abort()`).
- **Extend by default**: the card/preview uses `object-fit: contain` over a
  two-colour gradient background from `padding`, so the photo is shown whole
  with colour padding immediately, even before the server answered (until the
  palette arrives, a neutral ground). A per-photo toggle switches to
  `cover` (crop). Nothing is rasterised yet; it is CSS, then a `fit` value in
  the node doc.
- Existing uploads are in the SSR HTML; the client adopts them.

### 11.2 Node editor
- Button "new node" (always enabled, with or without photos). Pressing it
  mounts an editor **below** the upload area; several editors may stack.
- Layout: a square (`aspect-ratio: 1`) with `border: 1px solid`, a tool
  column on the left and one on the right. The square has
  `overflow: hidden; touch-action: none; contain: paint` so nothing escapes.
- Left column: pen, shape, select/transform, clip, unclip. Right column:
  undo/redo, page add/remove, delete node, save. (Final split decided while
  building; the requirement is just "tools on both sides".)
- Drag from an upload card (HTML5 drag, plus a pointer-based fallback for
  touch where HTML5 drag is unreliable) onto the square creates a `photo`
  step, initially `fit: extend`.
- Film-strip: vertical, on the right of the square, only when the node has
  more than one photo; click selects, drag reorders, scrolls with the page.

### 11.3 Gestures (`gestures.js`)
Pointer Events only. Track active pointers; one pointer = translate, two =
pinch-zoom + rotate + translate, solved as the similarity transform that maps
the two start points onto the two current points, composed onto the start
matrix (so it stays stable and drift-free). Double tap or a button cycles
`extend` -> `cover` ("zoom to fit all + crop") -> back. Wheel zoom and
modifier-drag on desktop. Result is always a 6-number matrix in model space.

### 11.4 Ink pen (`pen.js`)
- Input: pointer samples `(x, y, pressure, t)`; mouse has no pressure, so
  width then comes from speed alone.
- Width model: `w = base * f(pressure) * g(speed)`, `g` decreasing with a
  low-pass filter on speed so it does not flicker.
- Smoothing: One-Euro filter on the points (adaptive: smooth when slow,
  responsive when fast), then resample at fixed arc length (the "rudimentary
  quantisation"), then output a closed outline polygon from left/right
  offsets with round caps, as a filled path (the perfect-freehand approach,
  written here, no dependency).
- Stored as `stroke` with the already-smoothed points so replay is exact.
- Handwriting recognition: **stretch goal, not PoC-blocking**. Start with the
  `$1`/`$P` recogniser for shapes (snap a scribbled circle/line/rect to a
  real shape); real text recognition via the browser Handwriting Recognition
  API where present (feature-detected), nothing server-side.

### 11.5 Shape tool (`shapes.js`)
Click adds a vertex, click-drag pulls a symmetric bezier handle, Alt/second
finger breaks symmetry, click first vertex closes. Output is an SVG path
string. Toggles: open/closed, fill on/off, stroke width/colour. Vertices and
handles are draggable after creation; Delete removes the vertex.

### 11.6 Clip compositing
"Clip": select a photo step, then a shape step -> emits `clip` (the shape
becomes the photo's `clipPath`, the shape itself is no longer drawn).
"Unclip": emits `unclip` and the shape reappears as a normal object. Blend
mode and opacity per photo from a small popover. The photo keeps its own
matrix; the clip is in node space, so moving the photo slides it *under*
the clip (masking), which is the useful behaviour.

### 11.7 Multi-language
- `locales/<code>.json`: flat keys, plurals via `Intl.PluralRules` (categories
  `one`/`other`/... per language); `meta.name` and `meta.dir` ("ltr"/"rtl") inside.
- Negotiation order: URL prefix, `wb-lang` cookie, `Accept-Language`, `en`.
- Missing key falls back to `en`, then to the key itself, and logs once in
  development. A test script compares key sets across files and fails on
  differences, which is the whole "extendable" workflow: copy `en.json`,
  translate, restart.
- The language list shown in the UI is built from the `locales/` directory,
  so nothing else needs editing to add a language.

## 12. Milestones

Each milestone ends in something runnable and checkable.

| M | Deliverable | Done when |
|---|---|---|
| 0 | Phase 0 items | archive done, override written, `DESIGN.md` has tokens |
| 1 | Skeleton | `bun server/main.js` serves `/en/new` SSR with the Preact chrome; strings in 3 languages |
| 2 | Upload | multi-file DnD with progress; files appear in `uploads/` with `<hash>.<ext>`; reload shows them (SSR); delete works |
| 3 | Ingest | sidecar JSON with mediainfo + exif + palette; cards show extended previews with the two padding colours |
| 4 | Node editor shell | "new node" mounts the square editor; photo drag-in; pinch/rotate/zoom; extend/cover toggle |
| 5 | Save | node saved, photos baked into `data/photos`, rows in SQLite, uploads cleaned up, survives a crash between steps |
| 6 | Film-strip + pages | strip appears at >1 photo, reorder; step-sequencer scrub; mode free/slides/grid |
| 7 | Vector tools | pen with pressure/speed width; shape tool; clip/unclip |
| 8 | Extras | optional `rembg` helper (S10) and button; handwriting stretch goal |

Order is deliberate: SSR and the vendored-module setup are proven in M1,
before UI work piles on top.

## 13. Testing

- Server: a script that calls the router with synthetic `Request`s (no
  sockets), run with `bun test`.
- Ingest: three fixtures (portrait jpeg with EXIF rotation, png with alpha,
  corrupt file) with expected sidecar shapes.
- i18n: key-parity check across `locales/`.
- Hostile inputs: path traversal in hash, extension mismatch, oversize body,
  zero-byte file, tool missing from `PATH`.
- Client gestures: pure functions (`solveSimilarity(p0,q0,p1,q1)`, One-Euro,
  resampler) unit-tested without a DOM; the rest checked by hand in a browser
  with touch emulation, and on a real phone for pressure and multitouch.

## 14. Risks

| Risk | Mitigation |
|---|---|
| Large upload bodies | verify `Bun.serve` streaming and `maxRequestBodySize`; stream to disk, never hold 40 MB in memory |
| No bundler -> many small module requests | fine for a PoC; HTTP/2 or a later concat step; import map versions in the URL for caching |
| bare imports in the browser | vendored files use relative paths; the import map aliases the same files |
| Pixel decoding without a library | ImageMagick subprocess is the one dependency; palette needs only 64x64 |
| Pointer-event pressure differs by device | width model works from speed alone, pressure optional |
| SVG performance with many strokes | rasterise finished pages, keep live strokes as SVG |

## 15. Open questions

1. Archive mechanism (tag, branch or `attic/`), and where the new tree lives
   (same repo, root level, as laid out in S5).
2. Hash: SHA-256 (64 hex, proposed) or SHA-1 (40 hex, as the old schema's
   `sha1`). Either is fine; pick once, the validation regex depends on it.
3. Baked photo format: JPEG for compatibility or WebP/AVIF for size (the old
   `DESIGN.md` S4.3 leans AVIF with fallbacks).
4. Are videos in scope? `mediainfo` suggests yes eventually; the PoC treats
   non-images as "stored, no preview" unless told otherwise.
5. `node` vs `tile` naming across the docs.
6. Ink recognition: acceptable to defer entirely past the PoC?
