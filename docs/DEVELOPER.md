# Wild Beauty developer notebook

Start here when you are new. One page, kept current.
Whoever changes the structure, a convention or a gotcha updates this file in the same commit.
Details live in the big spec files at the root. This file only says where to look.

Last full review: 2026-11-05 (the batch editor, profile, /tree visitor mode, /view and grid fill stage were added since; the rest was not re-read)
Paths are relative to the project root. The spec files live in docs/. No build step anywhere.


## What it is

A site of nodes. A node is a document of photos, drawings and text on pages.
Visitors view nodes, the owner edits them in the node editor.
Runs on Bun only. Server renders pages with preact, the browser takes over.
The old Next.js and Hasura version sleeps in attic/ and is read only.

notes:


## Where the words are

- CLAUDE.md          rules for working here, read first
- TODO.md            open work and the authority for the directory layout
- docs/PLAN.md            the rewrite plan, server side and infrastructure
- docs/DESIGN.md          library choices, design source of truth
- docs/EDITOR.md          the node editor, UX, node data, tasks E1 to E154
- docs/WAND.md            magic wand, background removal, take out
- docs/opencv-imgproc.md  contract with the image tool of qjs-opencv
- docs/GRAPH.md           graph view, groups, locks, visibility
- docs/BATCH.md           batch editor of the graph view: table, photo tiles, reorder across nodes, disable photos
- docs/PROFILE.md         user profile: account details, username, artist pseudonym, avatar (root node), title and description patterns
- docs/GALLERY.md         the walkable 3D gallery, and the Show page /view
- docs/SITES.md           personal sites, jános.ch and transistorisiert.ch hosting
- docs/UX.md and docs/UX-REQUIREMENTS.md  what feels right on touch and mouse
- docs/DARKROOM.md   the tone curve feature
- attic/HISTORIC.md  map of the old code

notes:


## Map of the tree

- server.js          entry. Routes, static roots, startup sweeps
- server/            everything that runs only on the server
- client/            modules the browser loads, some also run on the server
- static/            css, fonts, textures, themes, images
- vendor/            preact, htm, three, bezier-js, perfect-freehand, rrweb
- locales/           en de es fr json
- tests/             bun test
- tools/             one-off scripts, python helpers, reports
- lib/               git submodule, do not commit inside without being asked
- data/ uploads/     symlinks to /mnt/data/wild-beauty
- attic/             frozen old code, never touch

notes:


## Server

server.js routes by hand, no framework. Add a route there and import its handler.

- server/api/uploads.js   upload, sidecar json, display files, storeFile for derived images
- server/api/nodes.js     save and load nodes, bakes the photos a node uses
- server/api/segment.js   magic wand, streams NDJSON from opencv-imgproc
- server/api/cutout.js    background removal, same pattern
- server/api/edges.js     edge map for the magnetic lasso
- server/api/photos.js    serves baked photos, thumb, large, small
- server/api/graph.js places.js locks.js   graph view, place names, edit locks
- server/auth.js session.js guard.js   login, cookies, who may write
- server/db/              sqlite through bun, schema.sql has numbered migrations
- server/node/            validate.js checks a document, view.js feeds the viewer, reconcile.js repairs after crashes
- server/media/           everything pixel related, see next section
- server/events.js replaylog.js   usage recording
- server/ssr.js site.js sites.js   page rendering and personal sites

Never edit an applied migration block in schema.sql. Append a new one.

notes:


## Server media pipeline

Photos go through three stages.
- upload   the original plus a sidecar json in uploads/, a display file if the browser cannot show the original. Palette, size, exif, place are read at ingest.
- bake     on node save. Oriented, stripped, at most 2048 on the long edge, lands in data/photos/hash.ext. A jpeg that needs no shrinking goes through jpegtran, lossless.
- tile     the node thumbnail and the large render.

Files:
- server/media/run.js      run any external tool, argv array, never a shell, timeout, output cap
- server/media/tools.js    which tools exist, detected once at start. ImageMagick here is 6.9.12 Q16, so convert and identify, no magick
- server/media/ingest.js probe.js palette.js color.js
- server/media/bake.js     the bake, keeps non sRGB icc profiles
- server/media/thumb.js    square thumbnail with ImageMagick distort
- server/media/raster.js   draws a whole document through rsvg-convert from the same svg the editor uses
- server/media/lines.js    reads a process stdout line by line

Photo ingest from the command line: tools/ingest.js
  bun tools/ingest.js --user LOGIN --gallery TITLE [--per N] [--list FILE] [--dry-run] FILE...
  Files go through the server's own storeFile (upload) and saveNew (save and bake), nothing is written by hand.
  A gallery gets child nodes of up to --per photos (40 by default, no upper limit), oldest first, titled with their date range. All new nodes are hidden.
  The photo limit of a node (LIMITS.photos is 40 for a free node, LIMITS.photosSequence 1000 for slides and grid, since 2026-11-05) does not bind this tool: the nodes it saves may hold any number of photos
  (validate takes maxPhotos, saveNew passes it). The editor cannot save such a node again while it holds more than its limit.
  --groups FILE (nodes as { title, files }) and --into ID (link them under a gallery) build nodes by place or any rule.
  --positions-only records the exact position of photos the app has, from their originals (hash = sha256 of the file).
  Exact positions: photos.meta.where { lat, lon }, 6 decimals, private. Set from EXIF at ingest (upload record `where`,
  baked in bakePhoto), from "Tag the photo with my location" (X-Position, cleanWhere), or by this tool. Clients only ever
  get the rounded `pos`. Read it with photoWhere(h, hash) in server/db/nodes.js.
  It calls detectTools() like server.js, else baking fails with "ImageMagick not installed".
  Try it on a sandbox first: WB_DATA and WB_UPLOADS point it at other directories, with a user made by saveUser.
  A free node holds 40 photos at most (LIMITS.photos in client/editor/core/model.js: all are layers of one composite), a slides or grid node 1000 (LIMITS.photosSequence); only this tool may go beyond. photoLimit(doc.mode) gives the one that applies.

External tools in use: ImageMagick, exiftool, mediainfo, jpegtran, rsvg-convert, inkscape for curved text, qjsm, opencv-imgproc, python with onnxruntime for inpainting.

notes:


## Image tool opencv-imgproc

A qjsm script from the qjs-opencv project.
Source: ~/Sources/quickjs/qjs-opencv/tools/opencv-imgproc.js, installed as /usr/local/bin/opencv-imgproc.
Commands today: capabilities info palette clip cutpoly edgemap prepare segment cutout.
Options are name value or name=value. A job file gives the same keys as json.
Output is NDJSON on stdout, the last line is the result. Progress lines come with the progress flag.
The server spawns it, reads lines, kills it when the request closes.
Contract in docs/opencv-imgproc.md. The qjs-opencv copy must stay identical.
Env: WB_IMGPROC picks another binary, WB_MODELS_DIR points at the onnx models.

To add a command you edit the qjs-opencv repo, then update the contract, then call it from a route like cutout.js.

notes:


## Client

No bundler. Files are served as they are from /app/ and the browser imports them.
Cache control is no-cache with last-modified, so a reload shows edits.
Imports are always relative with the .js ending.
html comes from client/html.js, htm over preact.

- client/components/   pages and widgets, about 45 flat files
- client/components/NodeEditor.js   3300 lines, the editor shell, split is planned
- client/editor/       the editor logic, grouped by folder, see its README
- client/components/FlowTrack.js, GalleryViews.js   shared paged track; gallery carousel, masonry album, view switch
- client/gallery/presentation.js   view/at helpers (?view=&at=), album paging
- client/gallery/      3D gallery with three
- client/editor/geometry/grid.js   grid layouts: loose, tight, and stage (coverCells: squares that cover the whole stage and may stick out)
- /:lang/view is the Show page (cards of the gallery nodes, server/node/view.js viewCards, docs/GALLERY.md S5b); /gallery redirects there
- client/graph/        graph view; collapse.js: the visitor view's visible nodes (roots, unfold on tap), docs/GRAPH.md S2.8; /tree is calm and read-only until Edit; graph ops on community nodes need an admin (server/guard.js)
- client/components/BatchEditor.js   batch editor panel over the graph (loads nodes by GET /api/nodes/:id, saves by PUT, no new server route)
- client/editor/core/batch.js        its pure document functions: photoRefs, placePhotos, setOff
- server/api/describe.js geoname.js   POST /api/photos/describe (place + capture time of own photos), offline GeoNames list (tools/gazetteer.js fetches it into data/gazetteer/)
- docs/ALBUM.md            photo book (proposed): a node or gallery printed like a photo album
- docs/PROFILE.md          user profile; server/api/profile.js (GET/PUT /api/profile, POST /api/profile/avatar), client/components/ProfilePage.js, client/editor/core/pattern.js (fillPattern: titles and descriptions from the profile's patterns), users.pseudonym / root_id / prefs (migration 10)
- photos.meta: where (exact position, private) and taken (EXIF time, local text); tools/ingest.js --positions-only sets both from originals
- photo step flags: desc (caption, gallery title), off: the viewer skips it (visibleDoc in model.js); the node editor still shows it; the server leaves off photos out of what it sends to anyone who may not write the node (readNode, nodePage)
- placeholder notes (docs/BATCH.md S6a2): client/editor/core/pattern.js (timeText, partsOf, isPlaceholder), client/components/NoteParts.js (Place, Date, Time buttons of the carousel's NoteEdit and the batch editor's annotation popover), Generate keeps existing notes, batch button Find placeholder notes
- photo book: /:lang/node/:id/book (docs/ALBUM.md S4c): bookPage in server.js, bookChapters in server/node/view.js, packing in client/gallery/book.js (pure, tests/book.test.js), BookPage.js, print CSS at the end of layout.css; ?notes=1|0 = only pictures with a note
- notes of photos (docs/GALLERY.md S5c): photo step field desc, at most LIMITS.desc (5000) plain text; PATCH /api/nodes/:id/captions (saveCaptions, server/api/nodes.js) changes only the document and rev; client/editor/io/captions.js queues the changes; client/editor/core/caption.js has titleOf (first line), paragraphsOf, hasBody; components NoteText.js (everyone) and NoteEdit.js (owner, loaded on demand) inside GalleryCarousel
- client/*.js          upload, events recording, i18n, colour, nav, push
- client/nav.js        the three main tabs (mainTabs) and the account name; client/components/Nav.js is the tab strip: fixed height, the language is a flag menu, the account a menu or a Log in button, a small home tab where the page has no logo (docs/DESIGN.md S7.2a)

Shared code: model.js, render.js, color.js and others are imported by the server too. They must stay pure, no DOM, no Bun apis.

notes:


## Editor folders

client/editor/README.md has the dependency rule. Folders only import from folders above them in this list.
- geometry/   pure maths. matrix polygon curve pen shapes grid
- core/       document model, commands, history, store, draft
- input/      pointer and key meaning. hit testing, handles, gestures, toolTable
- tools/      one folder per tool. wand lasso clip cutout shape
- io/         save, clipboard, export, lock, preload
- view/       render.js turns a document into svg, plus edge, palette, playback
- overlay/    stateless svg overlays
- hooks/      feature hooks, still empty, filled by the NodeEditor split

New pure maths for a feature goes in geometry/. New tools get their own folder in tools/.
Every file basename is unique in the repo. No index.js, utils.js, helpers.js, constants.js.
Hooks are useX.js, components PascalCase.js, the rest camelCase.js.

notes:


## The document

Defined in client/editor/core/model.js. Read the top of that file once.
- a node has pages, a page has steps
- a step has an op. photo stroke shape clip unclip blend transform text
- every step has an 8 character base 36 id
- a photo step: photo is the sha256 hash of an upload, m is the matrix, crop, opacity, blend, clip, role, orig, box, edge
- a photo draws in its own square of 1000 units, crop picks the window along the long edge
- the stage is 1000 by 1000 units

Strict validation. The STEPS table in model.js lists the allowed fields per op. A field that is not listed is rejected, on the client and on the server. A new photo field needs an entry there or save fails.
Limits in LIMITS in model.js. A document may be one megabyte.
server/node/validate.js checks the same plus references like photo hashes.

Everything that changes the document is a command object.
- client/editor/core/commands.js   apply, one big switch, pure
- model.js                         the actual changes, pure
- history.js                       undo stack with coalescing keys
A command that repeats while a slider drags gets an entry in KEYED so undo folds the run into one step.

Adding a command: model function, case in onDoc, key in KEYED if it repeats, test in tests/editor/.

notes:


## Photos in the editor

- the browser shows uploads/hash.display.ext through /files/uploads/ before the first save
- after save the viewer uses /files/photos/hash.ext
- photoInfo in NodeEditor.js builds the info object href width height padding palette
- render.js photos callback maps a hash to that info
- replacePhoto swaps the hash of a step, this is how cutouts and wand results land
- derived images are stored with storeFile in server/api/uploads.js and come back as ordinary upload records
- orig keeps the original hash behind a cutout so it can be restored, it counts as used and is baked too

Working copies: tools read pixels by drawing the image into a small canvas.
- client/editor/tools/cutout/alphamap.js   128 px alpha map per image url
- NodeEditor.js wireWork and workSize in tools/lasso/lasso.js   lasso working copy
Reuse this pattern for histograms.

notes:


## Rendering

One renderer, three places.
- the editor stage draws svg from view/render.js
- the viewer draws the same svg on the server and hydrates in the browser
- server/media/raster.js draws the same svg through rsvg-convert for tiles

So an svg feature must work in the browser and in librsvg. Test both.
Export to png goes svg to canvas in io/export.js. Another place that must show a new look.

Places that do not use the svg and read the photo file directly:
- thumb.js, the thumbnail of a node with one plain photo
- the 3D gallery textures
- the wand, cutout and lasso servers
These ignore any look you only apply in the svg. See DARKROOM.md.

notes:


## Tools and the context bar

- client/editor/input/toolTable.js   tool ids, keys, groups. Keys taken: V P S C U W L B T
- NodeEditor.js has the down move up chains per tool, search for tool === to find them
- client/components/ContextBar.js    the controls under the stage for the selected step
- client/components/Popover.js       small floating panels, used for Look
- client/components/ColourPick.js    colour with dropper
- client/editor/input/loupe.js       magnifier for fine tools on touch

Stage points come in 1000 unit space. client/editor/tools/wand/wand.js converts stage to photo coordinates, reuse it.

notes:


## Server jobs from the editor

Pattern used by wand and cutout.
1 client posts json with the photo hash
2 route finds the file with photoFile in segment.js
3 route spawns the tool, streams NDJSON back
4 progress lines drive the busy bar
5 a derived line carries an upload record
6 client dispatches replacePhoto with a flag like cutout or wand
7 the flag lets history fold preview and final into one undo step
8 closing the request kills the tool

While a job runs on a photo, tools/cutout/job.js refuses commands that would change that photo.

notes:


## Text, language, colour

- locales/en de es fr .json, flat keys like editor.opacity
- every key must exist in all four, tests/locales.test.js and tools/check-locales.js check this
- client/i18n.js on the client, server/i18n.js on the server
- client/color.js has sRGB, linear, OKLab, OKLCH, distance. Reuse it
- server/media/palette.js gives the dominant colours of a photo

notes:


## Styles

static/css/layout.css is the big one. Class prefix wb-. Editor classes wb-editor-.
Themes in static/themes/. Fonts in static/fonts/.

notes:


## Tests

bun test from the root. About 1000 tests at the last count.
- tests/ for server, gallery, graph and mixed
- tests/editor/ for the editor modules, one file per module
- tests/fixtures/ small data files
Pure modules get a test next to the logic with fixed expected numbers. See tests/editor/role.test.js for the style: describe, test, small helper builders.
The dev server must not be running a second copy on port 3001.

notes:


## Dev server

Runs under runit. Do not start another by hand.
- status   sudo svstat /etc/service/wild-beauty
- restart  sudo sv restart wild-beauty
- log      /var/service/wild-beauty/log/main/current
Client files need only a browser reload. Server files need a restart.
Data lives on /mnt/data. If it is not mounted the server refuses to start, check mountpoint /mnt/data.

notes:


## Conventions

- two space indent, single quotes, semicolons, if( with no space, arrow functions
- comments start lowercase, 75 columns wide, short
- pure modules first, DOM and fetch only in components and io
- ids and hashes are validated with regex at the edge of the server
- user visible text always through the locale files
- commits without Co-Authored-By lines in this project
- docs go in markdown, notes and plans are always welcome

notes:


## Gotchas

- a photo step field not listed in STEPS is rejected on save
- shared client modules are also loaded by the server, no window or document at import time
- the thumbnail of a one photo node comes from ImageMagick, not from the svg
- do not run tools/retile.js, tiles render in the browser on save
- pointer events: touch needs the loupe and a bigger grab area, mouse does not
- svg filters default to linearRGB, set color-interpolation-filters to sRGB
- the hook that condenses command output sometimes eats output, rerun with rtk proxy
- attic/ is read only, copying ideas out is fine
- never put mail passwords in the repo
- uploads expire after 7 days unless a saved node uses them
- rsvg-convert only reads images below the folder of the svg, raster.js writes the svg next to the photos

notes:


## Open questions of the codebase

- the NodeEditor split, see TODO.md
- hooks/ is empty until then
- components/ is flat and wants grouping

- save (NodeEditor.js save, saveNow): a free node draws its tile in the browser before the PUT and its large render after it; a grid or slides node draws nothing, the server makes the tile (E64b). Close and Edit of another node wait for a running save through editorStore.setSaving and idle

- gotcha (2026-11-06): node 30 (a tall screenshot, a lighten blend and a cutout) showed in Brave as three repeated bands about 255 px high with the page header painted into each, a browser GPU tile glitch: the same data and code rendered correctly in a second server copy and in Firefox. If it comes back on other nodes: Brave's hardware acceleration, or flatten the blended layers of the node view; no code change was made

notes:
