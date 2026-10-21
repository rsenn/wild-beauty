# HISTORIC.md - Codebase Structure Reference (Archived Project)

Wild Beauty is a 2019-era Next.js 9 + Express server-rendered app backed by Hasura/Postgres, implementing a photo-tile content system with a force-directed graph browser. The Express server (`server.js`) wraps Next.js and exposes a REST API under `/api/*` (login, tree, item CRUD, photo upload/rotate/get) that talks to Hasura via a hand-rolled GraphQL string-building client (`stores/api.js`, `getAPI()` at `stores/api.js:1`-ish, used as `stores/api.cjs` from `server.js:11`). Core logic (DOM/geometry, color, the force-directed graph engine `Graph`/`Node`/`Edge` at `lib/fd-graph.js:22`, `lib/fd-graph.js:332`, `lib/fd-graph.js:392`) lives in the `lib/` git submodule (`libweb`, see `.gitmodules`). The five real DB tables - `items`, `photos`, `users`, `items_photos`, `items_users` - are confirmed present in `graphql-schema.json`. The Hasura admin secret is hardcoded and shipped to the browser at `stores/queries.js:17` and `pages/tree.js:151`/`pages/tree.js:350` (also present server-side, safely, at `server.js:51`). The upload/resize/palette pipeline lives in `imageConversion.js` (`loadFile` L37, `getImagePalette` L43, `imageImport` L80, `rotatePhoto` L131). Dead/orphaned code confirmed by grep: `components/forceGraph.js` (no imports anywhere in the tree; requires nonexistent `./simulation` and `./normal`), `webpack.config.js` (an unrelated AssemblyScript-compiler build config, not wired to this Next.js app's actual build, which uses `next build` per `package.json` `scripts.build`), `service/next/` (pm2/supervise-style runtime state: pid/lock/status files under `service/next/supervise/`, not source), and `tmp.js`/`data.js` (unrelated D3.js example datasets - "flare" hierarchy and "Les Miserables" character graph, respectively).

## 1. DB Structure / Migration

- No `migrations/` directory exists in this repo; schema is managed entirely through Hasura (metadata-driven), not SQL migration files.
- `graphql-schema.json` (491KB, root) is a full GraphQL introspection dump of the Hasura-generated API - the closest thing to a schema reference. Confirmed table names present: `items`, `items_photos`, `items_users`, `photos`, `users`.
- `docker-compose.yaml` defines the local dev stack: `postgres:15`, `hasura/graphql-engine:v2.42.0`, `hasura/graphql-data-connector:v2.42.0`. No admin secret is set in this compose file (commented out) - the hardcoded secret used by the app (`RUCXOZZjwWXeNxOOzNZBptPxCNl18H`, see Sec. 4) is a separate, deployed-environment secret not present in this file.
- Key columns/relations (from `server.js:58` `itemFields` and `server.js:211-226` queries): `items(id, type, name, parent_id -> items.id, data, photos -> items_photos -> photos, users -> items_users -> users, order, created)`. Note `server.js:226` queries `order_by: "{parent_id: asc, order: asc, created: asc}"` - matches DESIGN.md's finding that `pages/browse.js` referencing `order`/`created` fails against the live schema (fields not present in the current Hasura schema dump).
- No standalone migration script exists anywhere in the tree; DESIGN.md's proposed `items` -> `tiles` migration (Sec. 5) is prospective, not implemented.

## 2. Build Files

- `package.json` (root): `name: the-wild-beauty-company`, pinned `engines.node: 12.16.x`, `engines.yarn: 1.22.x`. Scripts: `dev`/`start` -> `node server.js` (custom server, not `next dev`/`next start`), `build` -> `next build`. Key deps: `next@^9.1.4`, `react@^16.12.0`, `mobx@^5.15.4`, `express@^4.17.1`, `sharp@^0.24.0`, `graphql@^14.1.1`, `d3@^5.15.0`, `webpack@^4.42.0` (devDep-adjacent but listed as a direct dependency).
- `next.config.js`: minimal - `reactStrictMode: true`, `basePath: ''`.
- `.babelrc`: `next/babel` preset + legacy-mode `@babel/plugin-proposal-decorators` (needed for MobX `@observable` decorator syntax used throughout `stores/`).
- `webpack.config.js` (root, 116 lines): **not used by the Next.js build** - it's a copy of the AssemblyScript compiler's own webpack config (builds `assemblyscript.js`/`asc.js` from `./src/glue/js`, `./src/index.ts`, `./cli/asc.js` - none of which exist in this repo). Confirmed dead/orphaned.
- `config.js` (root): Apollo client config (`withData`/`HttpLink` pointing at `http://localhost:8080/v1/graphql`) for the abandoned `next-apollo` integration - superseded by the hand-rolled `stores/api.js` client (Sec. 4). No import of `config.js` found from `pages/_app.js` or elsewhere active.
- `docker-compose.yaml`: local Postgres+Hasura stack (see Sec. 1).
- `heroku.yml`: `build.docker.web: Dockerfile` - references a `Dockerfile` that does **not exist** in the repo (confirmed via `ls Dockerfile*` -> not found). Deploy config is itself broken/incomplete as committed.
- `.env` (root, 44 bytes) and `secret.key` (root, 45 bytes) hold runtime secrets (not inspected further here; treat as sensitive, not committed-safe material to reference).

## 3. Library Sources (`lib/` submodule = `libweb`)

- `.gitmodules`: `lib` -> `git@github.com:rsenn/libweb.git` (branch `main`). Top-level `lib/` contains ~30 subdirectories (`async`, `color`, `dom`, `draw`, `eagle`, `eda`, `geom`, `gerber`, `svg`, `wasm`, `bpg`, etc.) - a general-purpose personal utility library, only a fraction of which pertains to this app.
- Actually-used files (confirmed via grep across `server.js`, `imageConversion.js`, `query.js`, and the `test-*.js` scratch scripts): `lib/jpeg.cjs`/`lib/jpeg.js` (`isJpeg`, `jpegProps` - used at `server.js:9,25` and `server.js:330`), `lib/util.cjs`/`lib/util.es5.js`/`lib/util.js` (`Util.camelize`, `Util.ucfirst` - `server.js:334-335`), `lib/dom.cjs`/`lib/dom.js` (`RGBA`, `HSLA` - imported `server.js:12-13` but not referenced again in the file body), `lib/alea.cjs`/`lib/alea.js` (seeded PRNG `Alea`, imported `server.js:20` for deterministic graph layout, per DESIGN.md Sec. 2.4), `lib/svg/path.js` and `lib/svg/path-parser.js` (used only from `test-path.js`, not from app code).
- `lib/fd-graph.js` (454 lines) - the from-scratch force-directed graph/physics engine referenced throughout DESIGN.md. Exports: `class Graph` at `lib/fd-graph.js:22`, `class Node extends Point` at `lib/fd-graph.js:332`, `class Edge` at `lib/fd-graph.js:392`, default export `fdgraph` at `lib/fd-graph.js:454`.
- `lib/bpg/` - contains BPG (Better Portable Graphics) related sources; corroborates DESIGN.md's finding of decoder-only prototype code (see Sec. 6 below for the actual compiled asset locations, which live under `static/`, not `lib/`).
- Not used by the app (present in submodule but no grep hits from app code): the `eagle/`, `eda/`, `gerber/`, `gcode/`, `assembly`-adjacent EDA-tooling subdirectories - unrelated to a photo/graph web app, evidence the submodule is a general personal toolkit pulled in wholesale rather than a scoped dependency.

## 4. Server Sources

`server.js` (411 lines) - Express server wrapping Next.js, single file, all routes defined inline inside the `nextApp.prepare().then(...)` callback:

| Method | Path | Line | Notes |
|---|---|---|---|
| POST | `/api/login` | `server.js:117` | bcrypt check, `jwt.sign(password, secret)` (signs the raw password, not claims) |
| GET | `/api/logout` | `server.js:176` | clears token, destroys session |
| POST | `/api/put` | `server.js:198` | `needAuth`-wrapped; writes arbitrary base64 data to `filename` from request body via `fs.writeSync` - unrestricted path, a file-write primitive exposed to any authenticated user |
| POST | `/api/tree/parents` | `server.js:208` | walks `parent` chain for one item id |
| POST | `/api/tree` | `server.js:223` | lists all items with `order_by` referencing `order`/`created` (see Sec. 1) |
| POST | `/api/item/new` | `server.js:239` | inserts new item + one photo link |
| POST | `/api/item*` (wildcard) | `server.js:256` | generic item select/update |
| POST | `/api/photo/rotate` | `server.js:272` | `needAuth`-wrapped; calls `rotatePhoto()` from `imageConversion.js` |
| POST | `/api/photo/list` | `server.js:299` | lists unattached photos |
| POST | `/api/photo/delete` | `server.js:309` | `needAuth`-wrapped |
| GET | `/api/photo/get/:id` | `server.js:319` | streams JPEG bytes decoded from base64 `photos.data` |
| POST | `/api/photo/upload` | `server.js:340` | `needAuth`-wrapped; calls `imageImport()`, inserts `photos` row |
| GET | `/browse/:category` | `server.js:396` | Next.js custom render |
| GET | `*` | `server.js:400` | Next.js catch-all handler |

Auth helpers: `getVar` (`server.js:154`), `getUser` (`server.js:155`), `needAuth` (`server.js:164`, a higher-order route wrapper).

Hardcoded Hasura admin secret (server-side, legitimate use): `server.js:51`, `const API = getAPI("http://127.0.0.1:8080/v1/graphql", { secret: "..." })`.

`stores/api.js` - hand-rolled GraphQL client. `getAPI` factory builds a callable `API` object; secret is injected into request headers as `X-Hasura-Access-Key` at `stores/api.js:18`. No parameterized-query support - call sites build query strings via raw interpolation (e.g. `server.js:212`, `server.js:280`, `server.js:321`).

`imageConversion.js` (root, 5011 bytes) - upload pipeline:
- `bufferToStream` - `imageConversion.js:17`
- `createMemoryStream` - `imageConversion.js:24`
- `loadFile` - `imageConversion.js:37`
- `getImagePalette` - `imageConversion.js:43` (sharp `.raw()` -> quantize)
- `calcDimensions` - `imageConversion.js:63`
- `imageImport` - `imageConversion.js:80` (the main upload-time pipeline: resize, re-encode JPEG, palette, EXIF)
- `rotatePhoto` - `imageConversion.js:131`

Client-bundle-exposed admin secret (the critical finding from DESIGN.md Sec. 2.5-1), confirmed by direct grep:
- `stores/queries.js:17` - `api = getAPI(apiURL, { secret: "..." })`
- `pages/tree.js:151` and `pages/tree.js:350` - same literal secret string, both inside a page component that compiles into the client bundle.

## 5. Frontend Sources

`pages/` (Next.js routing):
- `_app.js` - app shell/providers
- `_document.js` - custom HTML document
- `index.js` - home page
- `browse.js` - category browse view (references stale `order`/`created` fields per Sec. 1; DESIGN.md's "broken page" finding)
- `browse.old.js` - superseded prior version, kept alongside the current one
- `list.js` - list view
- `new.js`, `new/[photo_id].js` - new-tile creation flow, keyed by uploaded photo id
- `panes.js` - pane-based layout page
- `show.js`, `show/[id].js` - tile detail view
- `test.js` - scratch/dev page
- `tree.js` - the force-directed graph navigation page (contains the exposed admin secret, Sec. 4)

`components/` top level: `TouchCallback.js`, `forceGraph.js` (dead, see below), `gallery.js`, `graphContainer.js`, `layout.js`, `login.js`, `nav.js`, `siteMap.js` (site nav/i18n-key map, see Sec. 7), `upload.js`, `withQueryParam.js`.
`components/simple/` - small stateless UI primitives (`aspectBox.js`, `center.js`, `checkbox.js`, `circleSegment.js`, `cubeSpinner.js`, `editableField.js`, `editableText.js`, `icons.js`, `layer.js`, `logo.js`, `myLink.js`, `needAuth.js`, `svgText.js`, `table.js`, `wrapIf.js`).
`components/upload/` - in-tree fork of a React upload-gallery widget (`Context.js`, `DragArea.js`, `DropArea.js`, `Handle.js`, `PropTypes.js`, `RUG.js`, `Request.js`, `Utils.js`, `view/*`, plus `style.css`/`style.scss`).
`components/views/` (the app's actual "views" layer - no separate top-level `views/` directory exists): `addItemBar.js`, `article.js`, `draggableList.js`, `grid.js`, `imageUpload.js`, `itemEditor.js`, `itemTile.js`, `itemView.js`, `toastsContainer.js`, `treeGraph.js`, `treeView.js`.

`components/forceGraph.js` - confirmed dead/orphaned: `grep -rn "forceGraph" --include=*.js .` (excluding node_modules) returns zero import sites anywhere in the tree; the file itself `require`s `./simulation` and `./normal`, neither of which exists in `components/`. It imports `d3` directly (v5 default-import style) and `react-hyperscript`, an unrelated p2p-network-visualizer copy-paste per DESIGN.md.

`stores/`:
- `RootStore.js` - `export class RootStore extends Queries` at `stores/RootStore.js:25`; singleton exported at `stores/RootStore.js:441` (`export const singleton = new RootStore()`).
- `EditorStore.js` - `export class EditorStore` at `stores/EditorStore.js:3`; constructor seeds three default fields via `this.addField("Name")`/`"Title"`/`"Text"` (`stores/EditorStore.js:36-38`); the generic field-adder method is `addField(label, type, value)` at `stores/EditorStore.js:60`.
- `LocalStore.js`, `autoStore.js`, `createStore.js`, `functions.js`, `queries.js` (the `Queries` mixin `RootStore` extends, and site of the exposed admin secret at `queries.js:17`), `i18nStore.js`, `api.js` (Sec. 4).

## 6. Assets

`static/` (15MB total):
- `static/css/` (24K) - `grid.css`, `react-upload-gallery.css`, `react-dropdown-tree-select.css` (third-party widget styles vendored in).
- `static/fonts/` (240K).
- `static/html/` (720K) - standalone BPG decoder demo pages: `bpgdec.js`, `bpgdec8.js`, `bpgdec8a.js`, plus sample images `clock.bpg`, `lena512color.bpg`, and `index.html`.
- `static/img/` (3.8MB) - UI icon set (mostly a generic file-manager/editor icon pack: `table-*.svg`, `action-*.svg`, `icon-*.svg`), plus app-specific `tile-background.jpg`/`.png`, `logo.jpg`, `logo-transparent.png`, `favicon.ico`/`.png`, locale flags (`flag-gb.svg`, `flag-de.svg`, `flag-fr.svg`).
- `static/wasm/` (9.5MB, the bulk of `static/`) - multiple Emscripten build variants of the BPG decoder: `bpgdec.wasm`/`.asm.js`/`.js`/`.c`/`.h`/`.wat`, `bpgdec8.*`, `bpgdec8a.*`, `bpgdec.s.*` (a fourth "simplified" build variant). All decoder-only, confirming DESIGN.md's finding of no encoder anywhere in the codebase.

`public/` (328K) - just `favicon.ico`, `favicon.svg`, `favicon.xcf` (the source Gimp file for the favicon, unusual to ship but harmless).

## 7. Dead Code / Duplicate Dependencies

- **EXIF libraries** (`package.json` dependencies): `exif`, `exifr`, `fast-exif`, `get-exif`, `exif-cli` (devDep) - five overlapping libraries; only `exifr` is actually imported by `imageConversion.js` (per DESIGN.md Sec. 2.3/2.5-8; confirmed no other exif-lib import sites found in app code during this pass).
- **Color-extraction libraries**: `cquant`, `get-image-colors`, `img-to-palette` all present in `package.json`; only `cquant` is wired into the actual pipeline (`imageConversion.js:43` `getImagePalette`).
- **Apollo chain**: `apollo-cache-inmemory`, `apollo-client`, `apollo-link-http`, `apollo-mobx` all present in `package.json`; the only file importing any Apollo package is `config.js` (root), which is not imported from `pages/_app.js` or any active route - confirmed dead, superseded by `stores/api.js`.
- **i18n stub**: `react-i18nify-mobx` is a real dependency and `stores/i18nStore.js` does call its real `i18nStore.setTranslations(...)` with a full English translation table (home/gallery/show/tree/login/logout/lang keys). However, the actual `Translate` component used in `components/siteMap.js` is **not** the library's component - `components/siteMap.js:1` comments out the real import and `components/siteMap.js:2` replaces it with a local stub `const Translate = ({value}) => <div>{value}</div>` that renders the raw i18n key string (e.g. `nav.home_name`) instead of the looked-up translation. Confirms DESIGN.md's finding: the translation data exists but the rendering path is stubbed out, so users see raw keys, not translated text.
- **`tmp.js`/`data.js`** (root): both are unrelated D3.js example datasets, not project code - `tmp.js` is the classic "flare" package-hierarchy example (`children` tree starting `name: "flare"`), `data.js` is the "Les Miserables" character co-occurrence graph (`links`/`nodes` with entries like `"Napoleon"`, `"Myriel"`). Not imported by any app file found in this pass.
- **`service/next/`** - confirmed process-supervisor runtime state, not source: contains `env/PORT`, `env/HOST`, `env/ROOT`, `env/SKIP_PREFLIGHT_CHECK`, `env/NEXT` (plain env-var files) and `supervise/pid`, `supervise/stat`, `supervise/status`, `supervise/lock`, `run` - the layout of a `daemontools`/`runit`-style service supervisor directory, accidentally committed.
- **`webpack.config.js`** (root) - see Sec. 2: an unrelated AssemblyScript compiler build config, not used by this project's actual `next build` pipeline.

## 8. Ad Hoc Test/Scratch Scripts (root)

None of these constitute a real test suite (no test runner config, no `test` script in `package.json`); each is a standalone manual scratch script exercising one `lib/` utility or app feature:

- `test-alea.js` - exercises `lib/alea.js` (seeded PRNG) + `lib/util.es5.js`.
- `test-api.sh` - a `curl` one-liner posting hardcoded credentials to `/api/login` (contains a plaintext password).
- `test-color.js` - exercises `RGBA`/`HSLA` from `lib/dom.es5.js`.
- `test-date.js` - exercises `Util.parseDate` from `lib/util.es5.js` on one hardcoded ISO string.
- `test-jpeg.js` - exercises `isJpeg`/`jpegProps` from `lib/jpeg.js` against a file on disk.
- `test-path.js` - exercises `lib/svg/path.js` and `lib/svg/path-parser.js` SVG path parsing.
- `test-util.js` - dumps `lib/util.es5.js`'s default export to console.
- `test-wasm.js` - scratch harness for loading the BPG decoder WASM/asm.js build (partially commented out).
- `test.json` - data fixture (D3 force-graph sample: `nodes`/`links` with `group` fields), likely input for a `lib/fd-graph.js` or D3 experiment, not a test-framework fixture.
- `test.lua` - a single-line font-table snippet (`font.fonts[fontnumber]`), unrelated to the JS app; purpose/origin unclear from content alone.
- `imageTest.js` - manual harness exercising `imageConversion.js`/`lib/util.es5.js` against a file on disk.

## Directory Sizes (top level, excluding `node_modules`/`.git`)

```
15M  static/
11M  lib/          (git submodule)
336K components/
328K public/
148K pages/
64K  stores/
52K  service/      (accidental runtime-state commit, see Sec. 7)
12K  assembly/
8.0K build/
```
