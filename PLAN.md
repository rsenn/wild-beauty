# Wild Beauty - Rewrite Plan (minimal PoC)

Status: draft, 2026-10-21, updated 2026-10-22 (graph and gallery decisions). Supersedes the stack choices in `DESIGN.md` S4.1
(Astro, Postgres, Prisma, object storage, auth) **for the PoC only**; the data
model ideas in `DESIGN.md` S4.2.1 (tiles - called **nodes** from now on -, photos, links, palette as an
ordered array) and the visual language in S7 stay valid. The old code is
frozen, see `CLAUDE.md` and Phase 0.

Companion documents: `EDITOR.md` (the node editor: UX, data, server, tasks; the old
S7 and S11.2-S11.6 moved there), and, for the work **after** the PoC:
`GRAPH.md` (graph view, API, database, visibility, groups, locks), `GALLERY.md`
(walkable 3D gallery as a node, version 1 scope), `opencv-imgproc.md` (optional
background-removal tool), `TODO.md` (task list, M0-M13).

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

Items 4-8 are specified in `EDITOR.md`.

Out of scope: login/sessions (anyone can upload and create), the graph view and
the 3D gallery (designed in `GRAPH.md` / `GALLERY.md`, TODO M12-M13),
browse pages, user/group tables, migration of the old data, **videos** (images
only, anything else is rejected at upload), handwriting recognition.

Vocabulary: a content item is a **node** (never "tile", never "file"); a
node's pictures are **photos**; a stored upload is an **upload**. `DESIGN.md`
still says "tile" in places; read it as "node".

## 2. Constraints and decisions

| Topic | Decision |
|---|---|
| UI library | Preact, no JSX, no bundler, no Next.js |
| Theming | CSS custom properties `--wb-*`; a theme is one CSS file that only sets tokens; a node can wear its own theme (S16) |
| Components | `h('tag', props, children)` or `` html`<a href=${href}>..</a>` `` (htm bound to `h`) |
| Modules | plain ES modules served as files; an import map maps `preact`, `preact/hooks`, `htm`; vendored under `vendor/`, served as `/vendor/` (no CDN at runtime) |
| Server | **Bun only**: `Bun.serve()`, written directly against Bun's APIs (S2.1) |
| DB | `bun:sqlite` directly, a few small helper functions in `db.js` (not an abstraction layer) |
| SSR | `preact-render-to-string`; same component tree as the client |
| Languages | de, fr, en; adding one = adding one JSON file |
| Auth | none for the PoC; hard limits instead (size, count, type), see S9 |
| After the PoC | graph view: Preact SVG + vendored `d3-force`/`d3-zoom`/`d3-drag`, rooted depth-limited API, one editor at a time (`GRAPH.md`); 3D gallery: vendored three.js loaded only when a gallery is entered (`GALLERY.md`) |
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
- Optional QuickJS-only tooling (background removal and server-side clip
  paths, S10) is a **separate program run as a subprocess** from the Bun
  server (`qjsm opencv-imgproc.js`, specified in `opencv-imgproc.md`, lives in
  the `qjs-opencv` project), detected through `/api/capabilities`; it is not a
  second server runtime.

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

`TODO.md` is the authority for this layout; this section mirrors it.

```
server.js                 entry: Bun.serve({ port: 3000, fetch }), routing
server/                   modules the entry imports; created as they are needed
  ssr.js                  renderPage(vnode, {lang, title}) -> full HTML
  theme.js                theme list, token sanitiser (S16.6)
  i18n.js                 locale negotiation, t(), plural, fallback chain
  config.js               paths, limits, tool names
  api/
    uploads.js            list / create / delete uploads, serve originals
    nodes.js              node CRUD, bake (EDITOR.md S4); locks.js: node locks
    capabilities.js
    graph.js              (M12) GET /api/graph, POST /api/graph/ops, node locks
    themes.js             GET /api/themes
  media/
    ingest.js             hash, extension, sidecar orchestration
    probe.js              mediainfo + exiv2/exiftool -> normalised JSON
    palette.js            `opencv-imgproc palette` when present, else ImageMagick histogram -> ordered palette
    bake.js               final crop/extend/strip/resample into data/
    imgproc.js            spawns `qjsm opencv-imgproc.js` (S10): cutout, clip; optional
    heif.js               HEIC/HEIF -> display jpg/png at ingest (S6.2 step 3b)
  db/
    db.js                 helpers: open(), run(), get(), all(), tx(); all SQL lives in server/db/
    schema.sql
    graph.js              (M12) rooted neighbourhood query, ops, locks, visibility filter
client/                   served as-is under /app/
  app.js                  hydrate entry
  html.js                 `html = htm.bind(h)`, shared by server and browser
  components/             Nav, UploadArea, UploadList, NodeEditor, Toolbar, Filmstrip, ...
  editor/
    model.js              node document model (EDITOR.md S3)
    render.js             model -> SVG vnode tree (shared with SSR)
    gestures.js           pointer-events multitouch -> matrix
    pen.js                stroke capture, smoothing, width profile
    shapes.js             polyline / bezier editing
  i18n.js                 client t(), same JSON files
  graph/                  (M12) GraphView (force graph), BranchView (spine + branches), ops client
  gallery/                (M13) build.js (polylines -> meshes), scene, walking, auto-hang; three.js loaded on enter
vendor/                   preact, hooks, htm, preact-render-to-string, ...; VERSIONS; served as /vendor/
static/                   served as /static/
  css/layout.css          layout only, no colours (S16)
  themes/<id>.css         tokens only: kraft.css, blueprint.css, ...
  fonts/ img/             from the old assets
locales/                  en.json de.json fr.json
tools/                    vendor.sh, check-locales.js, gallery-walls.mjs, gallery-warp.mjs (benchmarks)
docs/screenshots/         historic reference
uploads/                  <hash>.<ext>, <hash>.json         (gitignored)
data/                     photos/<hash>.<ext>, wb.sqlite3   (gitignored)
PLAN.md DESIGN.md TODO.md GRAPH.md GALLERY.md opencv-imgproc.md CLAUDE.md   (old README.md and HISTORIC.md live in attic/)
```

`static/style.css`, `static/css/grid.css`, `static/css/react-*.css` and
`static/wasm.html` are leftovers of the old app: read them, do not link them;
what is still needed moves into `layout.css`, the rest is dead (DESIGN.md H1).

`bun server.js --dev` (or the environment variable `WB_DEV=1`) logs every request
and response, every external command and every file written or removed
(`server/log.js`); without it the server prints only its start line.

`WB_GEO_API` sets the base URL of the federal geoportal that names the municipality of a
place (default `https://api3.geo.admin.ch`, `GRAPH.md` S1.5); `WB_GEO_API=off` asks nobody
and the offline gazetteer and cell coordinates name places instead. It is also off in `bun test`.
`WB_DATA` and `WB_UPLOADS` move the data and upload directories (`server/config.js`).

Options (`server/cli.js`, `bun server.js --help`): `--port`/`-p`, `--host`/`-H` (env `PORT`,
`HOST`), `--dev`, `--no-keys`. On a terminal the process supervises the server as a child:
Ctrl+R (or `rs` + Enter) restarts it, Ctrl+C quits; without a terminal (tests, pipes,
systemd) the server runs directly.

No `package.json` scripts that build. Vendored files are copied once by a
documented shell snippet (`tools/vendor.sh`), checked in, and pinned by version.
`server.js` stays the entry even when `server/` grows.

## 6. Server

### 6.1 Routes

| Route | Purpose |
|---|---|
| `GET /` | redirect to `/<locale>/new` |
| `GET /:lang/new` | SSR page (S6.3) |
| `GET /app/*`, `/vendor/*`, `/static/*` | `client/`, `vendor/` and `static/` files, `Cache-Control` by extension |
| `GET /api/themes` | list of `static/themes/*.css` (id, name) |
| `GET /api/capabilities` | `{ imgproc, languages, limits, tools }` |
| `GET /api/uploads` | list the uploads of this browser (cookie `wb-session`) with sidecar JSON, expired ones left out |
| `POST /api/events` | usage recording: batches of small events (S6.4) |
| `POST /api/uploads` | one file per request, raw body, name in header |
| `DELETE /api/uploads/:hash` | remove file and sidecar |
| `GET /files/uploads/:hash.:ext` | original, used by the editor |
| `GET /files/photos/:hash.:ext` | final stored photo |
| `GET/POST/PUT/DELETE /api/nodes[/:id]`, `POST/DELETE /api/nodes/:id/lock`, `GET /:lang/node/:id` | node CRUD, locks, read-only page (`EDITOR.md` S4.1) |
| `POST /api/uploads/:hash/cutout` | optional: background removal and/or clip (job JSON body, S10); creates a derived upload; needs `qjsm` + qjs-opencv |

`:hash` is validated against `^[0-9a-f]{64}$` before it touches a path.

### 6.2 Upload ingestion

One request per file, so the browser reports real byte progress (XHR
`upload.onprogress`; `fetch` cannot) and one failure does not poison a batch.

1. Stream the body to `uploads/.tmp/<random>` while hashing (SHA-256).
   Reject above `maxBytes`.
2. Sniff the type from magic bytes. Main types: `.jpg`, `.jpeg`, `.png`,
   `.heif`, `.heic`; also accepted without special handling: webp, gif, avif,
   tiff. Images only, no video. The client-supplied extension is only used if
   it agrees; it is lower-cased and whitelisted (`jpeg` is stored as `jpg`).
3. Rename to `uploads/<hash>.<ext>`; if it already exists, drop the temp file
   and return the existing record (dedupe for free). The hash is always of
   the bytes as uploaded.
3b. **HEIC/HEIF extraction.** Browsers cannot show these, so the primary image
   is decoded out of the container right away into a display file next to the
   original: `uploads/<hash>.display.jpg` (or `.display.png` when the image
   has an alpha channel). Tool: `heif-convert -q 99` (libheif; installed here) and
   `heif-info` (alpha, id of the primary image); no ImageMagick fallback, it
   decodes HEIC through the same libheif; argv array, `--`, timeout; rotation (`irot`) and EXIF orientation applied once, metadata
   kept (S6.2 step 4 reads the original). Only the primary image is taken
   (no burst/Live-Photo frames, no depth or auxiliary images). The original
   stays in `uploads/` (so the extraction can be redone); everything
   downstream (palette, preview, editor, bake) uses the display file. For
   non-HEIF uploads `display` is the file itself. Failure to decode rejects
   the upload with a clear error (an undisplayable image is useless).
4. Probe, in parallel, with a timeout each:
   - `mediainfo --Output=JSON <file>`
   - `exiv2 -pa -b` or `exiftool -json -n -G1` (whichever is installed;
     detected once at start, reported in `/api/capabilities`)
5. Palette: `convert <file>[0] -auto-orient -resize 128x128 -colors 8 -depth 8
   -format %c histogram:info:-` (checked: ~0.1 s, gives weight and hex per
   colour). Parse, sort by weight, store the ordered `{hex, weight}` array
   `DESIGN.md` S4.2.1 asks for. No JS quantiser needed. Also store
   `padding: [hex, hex]`: the most dominant colour plus the next one far
   enough from it in OKLab (own 15-line conversion; distance >= 0.12, else the
   farthest; a one-colour image gets that colour twice). Transparent pixels
   (alpha < 128) do not count. `width`/`height` are the size as displayed, EXIF
   orientation applied (`orientation` keeps the raw 1-8).
   **Preferred source when `capabilities.imgproc` lists it**: `opencv-imgproc
   palette --in=<file> --count=8` (S10 use 5; `dominant_colors_grabber` through
   `cv.paletteGenerate`, one JSON line `{ ok, colors: ["#rrggbb", ...] }`, no weights
   yet). ImageMagick stays the fallback and the only source for the weights.
6. Write the sidecar `uploads/<hash>.json`:
   `{ hash, ext, display, name, size, mime, width, height, hasAlpha,
   orientation, mediainfo, exif, palette, padding, uploadedAt }` via temp
   file + rename. `display` is `<hash>.<ext>` or `<hash>.display.<jpg|png>`;
   `width`, `height`, `hasAlpha` describe the display file. Derived uploads
   (S10) add `derivedFrom: <hash>` and `op`.
7. Respond with the sidecar.

Failures at steps 4-5 degrade (sidecar gets `"errors": [...]`), they do not
reject the upload.

**Ownership and expiry (decided 2026-10-28).** An upload belongs to the `wb-session`
cookie that sent it: the sidecar has `owners: { <hash of cookie>: <expiry ms> }`, never
sent to clients. The same bytes sent again add the owner and renew the expiry. An upload
lives `uploadTtlMs` (default 7 days, `WB_UPLOAD_TTL_MS`) after its last upload by an owner; the
response sets the cookie with the same lifetime (`Max-Age`, `Expires`). `GET /api/uploads`, the
boot JSON of `/:lang/new` and `DELETE` only concern the owner; the files go with the last
owner. Expired uploads are removed at start and every ten minutes (`sweepUploads`); sidecars
from before owners existed age from `uploadedAt` and are shown to nobody.

### 6.3 SSR of `/new`

Minimal on purpose: the server renders the page chrome, the localized strings,
and the **upload area with the files already on disk** (so a reload shows them
without a flash). The editor is a stub (`<div id="editor" data-hydrate>`)
that the client mounts; it is not server-rendered because it only exists
after a click. The upload list is rendered by the same `UploadList` component
the client uses, so hydration is a no-op for it.

Initial state travels as `<script type="application/json" id="boot">`.

### 6.4 Usage recording (testing, 2026-10-28)

`client/events.js` batches small events (taps by button name, orientation changes, errors,
upload timings, rapid repeated taps, the stage touched) and posts them to `POST /api/events`;
`server/events.js` appends them to `data/events/<date>.jsonl` with who sent them: `claude`
(cookie `wb-who=claude` in the automated browser), `owner` (the client address, from
`X-Forwarded-For`, is in `WB_OWNER_IPS`), else `tester-<4 characters of the cookie hash>`.
No photo content, no typed text. `bun tools/events-report.js [who] [--days n]` summarises it.

## 7. Node document model

Moved to `EDITOR.md` S3 (document, steps, limits, files) and S5 (rendering).
In short: a node is JSON in `nodes.doc` (`v`, `style`, `mode`, `pages` of `steps`) on
a 0..1000 unit square, rendered by one SVG interpreter shared by SSR and client.

## 8. Database (SQLite, `data/wb.sqlite3`)

```sql
photos(hash TEXT PRIMARY KEY, ext TEXT, width INT, height INT, bytes INT,
       palette TEXT, meta TEXT, created_at INT);
nodes(id INTEGER PRIMARY KEY, title TEXT, doc TEXT, palette TEXT,
      created_at INT, updated_at INT);
node_photos(node_id INT REFERENCES nodes, photo_hash TEXT REFERENCES photos,
            sort INT, role TEXT NOT NULL DEFAULT 'picture',  -- 'texture': not shown, used by the node's 3D scene
            PRIMARY KEY(node_id, photo_hash));
node_links(id INTEGER PRIMARY KEY, from_id INT, to_id INT, label TEXT NOT NULL,
           sort INT NOT NULL DEFAULT 0,        -- order among the children of from_id
           UNIQUE(from_id, to_id, label));     -- created now, unused by the PoC
node_locks(node_id INTEGER PRIMARY KEY REFERENCES nodes, holder TEXT NOT NULL,
           user_id INT, acquired_at INT, expires_at INT);   -- editor lock, EDITOR.md S2.8
place_suggestions(node_id INT REFERENCES nodes ON DELETE CASCADE, lat REAL, lon REAL,
                  PRIMARY KEY(node_id, lat, lon));  -- migration 2: rounded (~1 km) position of a saved
                                                    -- node's photo, until linked or dismissed (GRAPH.md S1.5)
place_names(lat REAL, lon REAL, name TEXT, PRIMARY KEY(lat, lon));  -- migration 3: municipality of a cell,
                                                    -- NULL outside Switzerland (GRAPH.md S1.5)
CREATE INDEX node_links_from ON node_links(from_id, sort);
CREATE INDEX node_links_to   ON node_links(to_id);
```

Columns added to `nodes` for the graph view (`GRAPH.md`; all optional in the
PoC, written as NULL/defaults): `owner_id INT` (NULL until accounts exist),
`visibility TEXT NOT NULL DEFAULT 'public'` (`hidden` = owner only | `group` |
`public`), `group_id INT` (set when `group`; **one group per node** for now), `kind TEXT`
(`node` | `list` | `album` | `gallery` | `shop`, a hint for the view, not a
type system), `x REAL, y REAL, pinned INT` (position in the owner's space),
`tile TEXT` (hash of the baked square raster of the rendered node, `EDITOR.md` S3.7)
and `rev INT` (bumped on every change; ETag source). Groups come with
accounts, not with the PoC: `groups(id, owner_id, name)` and
`group_members(group_id, user_id, role TEXT NOT NULL DEFAULT 'member', PRIMARY KEY(group_id, user_id))`
(`role`: `member` | `curator` | `admin`; invite-only: a member is added by invitation); index `group_members(user_id)`. Edge kinds
(the `label` of `node_links`, decided): `child` (ordered by `sort`), `sells`, `ref`
(`GRAPH.md` S1.2). **Who may edit** a node: its owner, or an `admin` or `curator` of its group (curators curate: they may change the node's links and order, `admin`s may also edit content and manage members). `overall-root` and `featured` belong to a **curators** group.

The graph is **shallow and rooted**: a user sees their root and its
neighbours to some depth, not the whole graph (`GRAPH.md` S1, S3). The graph
API is therefore a depth-limited neighbourhood fetch, not a snapshot of all
nodes. Child order (`sort`) is what makes "50 articles in sequence" and "20
projects" lists without extra tables.

`PRAGMA journal_mode=WAL; foreign_keys=ON`. Schema version in
`PRAGMA user_version`, migrations as numbered statements in `schema.sql`.
Names follow `DESIGN.md` S4.2.1 where they overlap, with `tile` renamed to
`node` (decided, S15); `DESIGN.md` is updated when the PoC lands (TODO H3).

### Saving a node

Moved to `EDITOR.md` S4 (validation, baking rules, quality rule, thumbnail rendition,
commit, upload cleanup, crash reconcile, HTTP API).

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

## 10. Optional QuickJS helper (background removal, clip paths)

Not a server runtime. The pixel work that ImageMagick one-liners cannot do
(segmentation, polygon masks) is done by one CLI script in the `qjs-opencv`
project, `opencv-imgproc.js`, specified in `opencv-imgproc.md` (the contract
between that project and this one). `cv.grabCut`, `fillPoly`, `floodFill`,
`watershed`, `kmeans`, `readNetFromONNX` and the background subtractors are
bound in `qjs-opencv` (verified 2026-10-21).

The Bun server runs `qjsm opencv-imgproc.js <command> --job job.json` as a
child process (argv array, timeout, minimal environment) from
`server/media/imgproc.js`, reads the one-line JSON result from stdout.

Uses:
1. **Background removal** (`POST /api/uploads/:hash/cutout`): methods are
   grabCut (centre or user rectangle, or a mask), border flood fill, chroma
   key, k-means, watershed, ONNX segmentation model, difference to a reference
   image, and `auto`; all in the spec. The result **always has an alpha
   channel**: if the source format has none (jpg, heic) it is written as PNG
   (or WebP), never as JPEG. It is saved as a **new upload** (new SHA-256, `derivedFrom`
   and `op` in the sidecar) and appears in the upload list; the original stays.
2. **Server-side clip**: a polygon or SVG path (the node doc's `shape`
   steps, `EDITOR.md` S3) is rasterised into a mask and applied as alpha. Used when a
   *destructive* cut-out is wanted (derive a new photo), when baking the
   square thumbnail rendition (`EDITOR.md` S4), and for flat exports of a node. In the
   editor, clipping stays non-destructive SVG `clipPath` (`EDITOR.md` S6); the server
   path exists for output that must not need an SVG renderer.
3. Availability is detected once at start (`qjsm opencv-imgproc.js
   capabilities`) and reported in `/api/capabilities` as `imgproc`
   (methods, models, limits); the client hides the tools when it is absent.
4. The server converts HEIC/HEIF to the display file first (S6.2 step 3b):
   the tool only reads formats OpenCV decodes (jpg, png, webp, tiff, ...).
5. **Palette generation**: `opencv-imgproc palette --in=FILE [--count=N]
   [--dist=cube|cie76|cie94|kmeans] [--hsv]` returns the dominant colours of an
   image (S6.2 step 5 uses it instead of the ImageMagick histogram when the tool
   is installed). Options on this tool are `--name=value` (it parses with
   `cv.CommandLineParser`), so the server builds argv as `--in=<path>` etc.

## 11. Client

### 11.1 Upload area
- Drop zone (`dragenter/over/leave/drop`, plus a hidden `<input multiple>`
  for tap/click), accepts files and directories (`webkitGetAsEntry`).
- Each file is a card with: thumbnail (object URL while uploading, server
  file afterwards), a progress bar, state (queued, uploading, processing,
  done, failed + retry), a delete button.
- Concurrency 3. Cancel on delete while uploading (`xhr.abort()`).
- **Square crop, always (design decision, supersedes "extend by default")**: every
  photo is a square. The card shows the photo zoomed in so it fills the square
  (`object-fit: cover`) and only part of it is visible; dragging the photo in the
  card moves the crop window along the long axis (portrait: up/down, landscape:
  left/right, square: nothing to move). The card says which way it can be panned: on
  desktop by the mouse cursor (`ns-resize` / `ew-resize`), on touch by a small
  double-arrow icon on the card. The chosen crop travels with the photo into the node
  (`crop`, EDITOR.md S2.5). The fit/crop toggle (yellow corner triangle) is gone, and so
  is the extend ground made from the `padding` colours; the `padding` palette stays
  recorded for later use (themes, text backgrounds). Nothing is rasterised yet: CSS
  for the card, a `crop` value in the node doc.
- Existing uploads are in the SSR HTML; the client adopts them.

### 11.2 - 11.6 Node editor, gestures, pen, shapes, clip

Moved to `EDITOR.md` (UX S2, algorithms S6, tasks S9). Decided there and here:
**one editor open at a time**, enforced in the client and by a server lock.

### 11.7 Multi-language
- `locales/<code>.json`: flat keys, plurals via `Intl.PluralRules` (categories
  `one`/`other`/... per language); `meta.name`, `meta.dir` ("ltr"/"rtl") and `meta.flag` (the `static/img/flag-<flag>.svg` name; `en` uses `gb`) inside.
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
| 1 | Skeleton | `bun server.js` serves `/en/new` SSR with the Preact chrome; strings in 3 languages |
| 1b | Theming | `kraft` and `blueprint` themes, switcher, scoped theme, sanitiser tests (S16; TODO M2b) |
| 2 | Upload | multi-file DnD with progress; files appear in `uploads/` with `<hash>.<ext>`; reload shows them (SSR); delete works |
| 3 | Ingest | sidecar JSON with mediainfo + exif + palette; cards show extended previews with the two padding colours |
| 4 | Node editor shell (`EDITOR.md` phases C, D) | "new node" mounts the square editor; photo drag-in; pinch/rotate/zoom; extend/cover toggle; per-node theme |
| 5 | Save (`EDITOR.md` phases B, G) | node saved, photos baked into `data/photos`, rows in SQLite, uploads cleaned up, survives a crash between steps |
| 6 | Film-strip + pages (`EDITOR.md` phases D, E) | strip appears at >1 photo, reorder; step-sequencer scrub; mode free/slides/grid |
| 7 | Vector tools (`EDITOR.md` phase F) | pen with pressure/speed width; shape tool; clip/unclip |
| 8 | Extras | optional `imgproc` helper (cutout, clip; S10) and button |
| 10 | 3D gallery node | `scene3d` document, builder, walking, auto-hang, enter/leave host (`GALLERY.md` S0b, TODO M13) |
| 9 | Graph view | rooted neighbourhood API, SVG view with expand-on-demand, move/pin/order/relink, live updates (`GRAPH.md` S6; TODO M12) |

Order is deliberate: SSR and the vendored-module setup are proven in M1,
before UI work piles on top. `TODO.md` splits these into finer milestones
(M0-M13; the editor phases are `EDITOR.md` S9) and is the working list.

## 13. Testing

- Server: a script that calls the router with synthetic `Request`s (no
  sockets), run with `bun test`.
- Ingest: three fixtures (portrait jpeg with EXIF rotation, png with alpha,
  corrupt file) with expected sidecar shapes.
- i18n: key-parity check across `locales/`.
- Hostile inputs: path traversal in hash, extension mismatch, oversize body,
  zero-byte file, tool missing from `PATH`.
- Client gestures and the editor's pure code: see `EDITOR.md` S8. Pure functions (`solveSimilarity(p0,q0,p1,q1)`, One-Euro,
  resampler) unit-tested without a DOM; the rest checked by hand in a browser
  with touch emulation, and on a real phone for pressure and multitouch.

## 14. Risks

| Risk | Mitigation |
|---|---|
| Large upload bodies | verified 2026-10-21 (Bun 1.4.2): set `maxRequestBodySize` explicitly, stream `req.body` to disk while hashing (RSS stayed ~45 MB for a 40 MB upload); oversize gets 413 from Bun; keep the idle timeout at its default or higher |
| No bundler -> many small module requests | fine for a PoC; HTTP/2 or a later concat step; import map versions in the URL for caching |
| bare imports in the browser | vendored files use relative paths; the import map aliases the same files |
| Pixel decoding without a library | ImageMagick subprocess is the one dependency; palette needs only 64x64 |
| Pointer-event pressure differs by device | width model works from speed alone, pressure optional |
| SVG performance with many strokes | rasterise finished pages, keep live strokes as SVG |
| Graph view size | rooted depth-limited fetch (2 ms / 3 KB brotli at 1 M nodes, `GRAPH.md` S3.1b), not a whole-graph snapshot |
| Many WebGL contexts | a 3D node is a poster until entered; one live canvas at a time (`GALLERY.md` S6) |
| iPhone has no element Fullscreen API | viewport-fill mode, Fullscreen API only as enhancement (`GALLERY.md` S7.1) |

## 15. Decisions and open questions

Decided 2026-10-21:
- Videos are out of the PoC; non-image uploads are rejected.
- A content item is a **node** (not tile, not file); docs and code use `node`.
- Handwriting recognition is deferred past the PoC.
- Directory layout: `TODO.md` wins, S5 mirrors it.
- Theming: S16.

- Hash: **SHA-256**, 64 lower-case hex (`^[0-9a-f]{64}$`), over the uploaded bytes.
- Upload formats: `.jpg`, `.jpeg`, `.png`, `.heif`, `.heic` mainly (S6.2); HEIC/HEIF
  are extracted to a display jpg/png at ingest.
- Background removal always yields an alpha format (PNG/WebP), never JPEG.
- Clip paths may also be applied server-side (S10).
- `grabCut` exists in `qjs-opencv`; the tool is specified in `opencv-imgproc.md`.

- Baked photo format: JPEG for opaque images, **never re-encoded at a higher
  quality than its source**: JPEG sources are passed through losslessly
  (`jpegtran`) or, when shrunk, re-encoded at their own quality; **quality 99**
  only for non-JPEG sources (checked with ImageMagick here: a 720x1280 q72 JPEG
  becomes 326 KB at q99 vs 159 KB at q82, so re-encoding only inflates).
  Alpha images: WebP or PNG. Open: `jpegtran -copy none` drops an ICC profile;
  keep it when present and not sRGB.
- `Bun.serve` upload bodies: verified, see S14 and `DESIGN.md` S9.6.

Decided 2026-10-22 (domain information, details in `GRAPH.md`):
- Only **one node editor is open at a time**; all other tile views are read-only.
- The graph is traversed **shallowly from a root**; the API fetches a rooted,
  depth-limited neighbourhood and expands on demand.
- A user typically owns ~100 nodes: ~4 albums (1 node each), ~20 projects, ~50
  articles (ordered list), 2 galleries (one public, one hidden; 1 exhibit per
  node), shop items (1 node each, linked to an exhibit).
- The **landscape is shared across users** and is itself a rooted graph: one
  **overall-root** node has a child `user-profiles` (an ordered list of `ref`
  edges to each user's profile node, itself a direct child of that user's root)
  and a child `featured` (a curated list whose entries are links to articles,
  galleries and seller marketplaces). A new user is added to `user-profiles`;
  there is no free placement of roots on a plane.
- **Concurrent editing uses a lock**: one editor per node, enforced by a lock
  (`node_locks(node_id PRIMARY KEY, user_id, expires_at)`), taken when the editor
  opens, renewed by heartbeat, released on close/save, expired when the
  heartbeat stops. The owner may break a lock.
- Visibility has three levels: **owner only** (`hidden`), **an invite-only group**
  (every member of the node's group), and **public**.
- **Positions are owner-defined**, stored on the node.
- Edge kinds: `child`, `sells`, `ref`. One `group_id` per node. A space/node is edited
  by its **owner or by the admins of its group**; members and the public only read.
- Two graph views on the same rooted data (`GRAPH.md` S2.7): the **force graph**
  to organise, and a **branch view** to navigate (a spine of square tiles at
  ~33 degrees from top-centre to lower-left, children branching to the lower right
  at ~45 degrees, filmstrip/carousel or masonry for long runs or categories;
  tap zooms a tile, lower-left walks the spine, right descends). Computed layout,
  angles are theme tokens.
- A node's tile may host a **live canvas** (walkable 3D gallery built from the
  node's polylines: walls from a height layer of the 2D editor, floors of two types,
  starfield sky, art lighting, texture set (up to 3 photos marked `texture`: walls split-in-4 or single, room floor, optional corridor floor; user-editable convex quads), ramps as floor polygons with entry/exit height (slope <= 1:12, walls tilt), north fixed to the editor's top, pictures
  hung automatically on the inside of rooms only (rooms are closed polygons, corridors are lines, no corner sharper than 90 degrees; `GALLERY.md` S5.1); later games/VMs): poster until entered, one live context at a
  time, full-screen on enter; research and plan in `GALLERY.md`.
- Tile rendering (raster of a node, `EDITOR.md` S3.7) will be done **on the server and cached**,
  at a later point; not in the PoC.
- "Reorder" and "relink" mean moving, pinning, ordering and adding edges; the
  user arranges part of the graph and the wider landscape of their space.

Still open: nothing blocking M1. Graph questions: `GRAPH.md` S5.

## 16. Theming

### 16.1 Goals
- The whole UI is themable, and **a node can wear a theme different from the
  page's**: one editor, or a page full of read-only nodes, each in its own look.
- Adding a theme = adding one CSS file. No component changes, no build.
- A theme changes colour, wallpaper, type, borders, radii, shadows, icons, tab
  and button sizes. It does not change markup or layout structure.
- A node's look is user content, so it is stored in the node doc and
  sanitised (S16.6).

### 16.2 Mechanism
1. **`static/css/layout.css`**: all structure (flex, grid, positioning,
   sizes in tokens, transitions). It contains **no literal colour, font,
   image, border width, radius or shadow**: only `var(--wb-...)`.
2. **`static/themes/<id>.css`**: only custom property declarations, scoped to
   `:root[data-theme=<id>], [data-theme=<id>]`. The second selector is what
   lets any element, such as a node wrapper, wear a theme.
3. Custom properties inherit, so the nearest `data-theme` ancestor wins and
   nothing leaks out of the wrapper. A node wrapper always sets both
   `data-theme` and the complete token set of its theme (themes are
   self-contained: each defines every token), so a node never half-inherits
   from the page.
4. Page theme: `<html data-theme>` set by SSR from the `wb-theme` cookie
   (default `kraft`), plus `<link id=theme href=/static/themes/<id>.css>` in
   `<head>` (no flash on reload). Other themes' files are loaded on demand,
   when a node or the switcher asks for them.
5. Switching without reload: swap the `<link>` href, set `data-theme` and the
   cookie. A node picker only changes that node's wrapper and doc.
6. Icons are `url(/static/...)` tokens drawn as CSS background images. Colour
   inside a node's *content* (photos, strokes, shapes, graph-node fill) is data
   and never themed; the theme only styles the chrome around it.
7. Responsive rules (phone vs desktop) use tokens too: the breakpoint lives in
   `layout.css`, the values (`--wb-card-columns-narrow`) in the theme.

### 16.3 Token contract
Every theme defines all of these; `layout.css` may use only these. Values
shown are the `kraft` ones. Names are a contract: adding one means adding it
to every theme and to the sanitiser whitelist.

| Group | Tokens | kraft | Source |
|---|---|---|---|
| wallpaper | `--wb-wallpaper-color`, `-image`, `-size` | `#cabaab`, `tile-background.png`, `auto 50vmin` | body in `_app.js`; sampled from the screenshots |
| ink | `--wb-ink`, `--wb-ink-soft` | `#000`, 25% black | text, frames, outlines |
| accent | `--wb-accent`, `-hover`, `-ink` | `rgb(138 0 16 / .8)`, `rgb(192 8 32 / .8)`, `#fff` | `li.menu-item`, `.upload-handle-button` |
| selection | `--wb-select`, `-fill`, `--wb-drop-fill` | `hsl(210 100% 55%)`, 50% of it | selection overlay in `imageUpload.js`; blue frame in the screenshot |
| state | `--wb-danger`, `--wb-error-frame` | `#f30208`, `rgb(160 0 16)` | red cross; `.upload-card.__error` |
| frames | `--wb-frame-width/-style/-drag-style`, `--wb-border-width`, `--wb-select-width` | 4px solid, dashed on drag, 1px, 4px | `.upload-handle:before` and the screenshots |
| shape | `--wb-radius-tab/-frame/-button/-round/-node`, `--wb-node-outline` | 0, 0, 5px, pill, 8px, 3px | `button` in `_app.js`; graph screenshot |
| type | `--wb-font-ui`, `--wb-font-size`, `-small/-button/-label/-lead/-tab` | Fixed; 13px (14px at <=375px), 14, 16, 17, 22, 40 | `_app.js`, `nav.js`, `imageUpload.js` |
| tabs | `--wb-tab-size/-size-open/-gap/-ease/-time/-glow` | 48px, 100px, 4px, `cubic-bezier(.165,.84,.44,1)`, 1s, white glow | `li.menu-item` in `nav.js` |
| cards | `--wb-card-columns/-wide`, `--wb-card-gap`, `--wb-card-ground` | 3 (4 from 480px, 6 from 700px), 8px, 40% white | `.upload-item` 20%; the phone screenshots show 5 columns |
| depth | `--wb-shadow-card/-select/-hover/-pop` | `0 0 4px .75`, `2px 2px 6px #000`, `0 2px 4px .5`, tooltip shadow | `imageUpload.js`, `style.css`, `_app.js` |
| round buttons | `--wb-button-round-bg/-border/-hover` | `#ffffff60`, `#cdcdcd`, `#ffdc20c0` | `.image-button` |
| raised buttons | `--wb-button-bg/-bg-active/-border` | grey gradient, reversed, `#555` | `button` in `_app.js` |
| tooltip | `--wb-tip-bg/-ink` | yellow gradient, black | `.tooltip:after` |
| logo | `--wb-logo-image`, `--wb-logo-height` | `logo-transparent.png`, 56px | header |
| icons | `--wb-icon-upload/-new/-delete/-rotate/-next` | `upload-tray` (arrow over a tray, as on the screenshots), `action-new`, `icon-error`, `icon-rotate`, `arrow-next` svgs | the screenshots |

The theme itself is `static/themes/kraft.css` (written, still to be checked
against a running page in TODO 2.3); this table is its documentation, not a
second copy.

What the screenshots fix, so no later restyle forgets it (details: `DESIGN.md` S7.8): paper wallpaper; black
square-cornered 4px frame around the drop zone; crimson square tab blocks with
big pixel type, the active one grown downward with a caption; 5-column grid of
thumbnails with a 1px black border and the two round buttons overlapping the
top-right (red cross on top, blue rotate below); selected card = 4px blue frame
plus a hard shadow; a black square with a white arrow bottom-right to continue;
graph nodes as rounded squares with a 3px black outline, flat saturated fill
and a pixel-font label.

Known defects not to copy: tab labels cut off at 360px ("Hom", "Sho", "Tre");
the old `body` and `a:hover` rules that apply a drop-shadow filter to every
link; `user-select: none` on every `a` and `button`.

### 16.4 Distilling rules (how the kraft values were chosen)
- Colours are the literal values in the old CSS where a rule exists; where
  only a screenshot shows it, the value was sampled and matched against the
  CSS (crimson `rgb(138 0 16 / .8)` over the sampled paper `#cabaab` computes
  to `rgb(151 37 47)`, the screenshot shows `rgb(149 35 45)`).
- Many tokens, few concepts: five colours (ink, accent, select, danger, wallpaper),
  three radii, three font sizes in use, one transition. A new theme can start
  from `kraft.css` and change those few.
- Old per-component one-off values (modal 3-D transform, flag flip, cube
  spinner) are not tokens; they are dropped or kept as `layout.css` rules until
  the component returns.

### 16.5 Second theme: `blueprint`
Exists to prove the mechanism (TODO 2b.2): dark blue flat wallpaper (no image),
white ink, cyan accent, square everything, a different `--wb-font-ui`.
Acceptance: switching it restyles `/en/new` and a node editor with no
component change, and `/en/themes` shows kraft, blueprint and a page where both
are side by side.

### 16.6 Per-node themes and the sanitiser
A node doc carries `style: { theme: "<id>", vars: { "--wb-accent": "#2a6" } }`.
- `theme` must be an id from `static/themes/`. Unknown id falls back to the
  page theme.
- `vars` keys must be in the token whitelist (S16.3). Values must match a
  pattern per token kind: colour (`#rgb[a]`, `#rrggbb[aa]`, `rgb()`, `hsl()`,
  plain names from a short list), length (`<number>(px|em|rem|vmin|%)` with a
  range), number, time, `url(/static/<path>)` for image tokens only,
  font-family from a list. No `;`, `{`, `}`, `\`, `@`, `expression`,
  `javascript:`, `data:`, external URLs, or comments.
- `server/theme.js` exports `sanitize(style) -> { theme, vars }` and
  `toAttr(style) -> string` (the inline `style` attribute). It runs **on save
  and again on render**, so a hand-edited database row cannot inject CSS.
- The editor and every viewer render the node inside
  `<div data-theme=ID style="...">`, in SSR and in the browser, so both agree.
- Unit tests feed hostile values (`url(javascript:...)`, `}` / `;` injection,
  `expression()`, huge lengths, unknown tokens) and expect them dropped.

### 16.7 Order of work
TODO M2 builds `layout.css` plus `kraft.css` for the `/new` chrome; M2b adds
loading, `blueprint`, the switcher, scoped themes and the sanitiser; the editor (EDITOR.md E17, E70)
adds the per-node wrapper in the editor (EDITOR.md E70); saving persists and
re-validates it (E26).

### 16.8 Not in the PoC
Per-user theme storage (cookie only), `prefers-color-scheme` auto-switching,
theme editor UI, theme-supplied fonts beyond the existing ones (a theme may
name a font that `static/fonts/stylesheet.css` already declares).
