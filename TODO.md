# TODO - Wild Beauty rewrite

Source of truth: this file for the **directory layout** (PLAN S5 mirrors it), `docs/EDITOR.md`
for the node editor, `docs/PLAN.md` for everything else, then `docs/DESIGN.md`. A content item is a **node** (not tile). Videos and
handwriting recognition are out of the PoC. After the PoC: M12 graph view (`docs/GRAPH.md`) and
M13 3D gallery (`docs/GALLERY.md`). Target is
**Bun only**, no runtime abstraction (`docs/PLAN.md` S2.1). Old code is read-only in
`attic/` (`CLAUDE.md`).

Conventions: `[ ]` open, `[x]` done. Each task is small enough for one commit
and ends in something you can run or look at ("done when"). Do tasks in order;
a milestone is finished when all its tasks are. Section references: `P` =
docs/PLAN.md, `D` = docs/DESIGN.md.

## Open threads (2026-10-29, updated 2026-11-05)

Work that was started, offered or decided but not finished, so a detour does not lose it.

- [ ] **Guest accounts: try first, keep later** (decided 2026-11-06, design in `docs/GUESTS.md`, nothing built; replaces item (1) and (2) of the post checklist below): a visitor's first save makes a private guest user, claiming needs only a user name and a password, login merges the guest's work, guests expire after 30 days, the open public area ends. Order of work in `docs/GUESTS.md` S6; confirm the numbers of G4 and G7 first.
- [ ] **ORDER OF WORK for the wide post and the next weeks** (agreed 2026-11-06; update as items close; each item's detail is in its own entry or doc):
  1. **Guest accounts** (`docs/GUESTS.md` S6): **server and client built 2026-11-06, 1151 tests green, dev service restarted with it, not committed**; to do: check in a private window (first save, claim, login with merge, banner), `tools/guests.js`, admin list of guests, upload cap, the owner's wording check of the 3 translations. First, because without it a curious visitor meets a login and stranger content lands in the open area.
  2. **User control**: export and full deletion (entry "User control of photos and content" below), then the privacy sentence with the backup retention, the contact address and legal notice, nightly backup, upload caps (guest quotas cover guests), `WB_PUBLIC_URL` (the old pre-post checklist below).
  3. **Editor features for makers** (plan in `docs/MAKERS.md` S3-S4): stage formats (4:5, 9:16, cards; the stage is square today, decide the data shape first), copy-text-for-posting, contact line, events, print-quality cards (`docs/MAKERS.md` S3b), script font role and text styles, ground presets, starter templates, brand kit with logo stamp, node duplicate, page export as zip, link and QR, later photo light fix and align/snap. Text-box pill backgrounds already exist.
  4. **Theme "Linen"** (`docs/THEMES.md`, steps in S3): tokens, theme file, palette accent, profile choice, browser check.
  5. **Social post with the making-of video** (entry below): recorded after 1 and 2 are live, ideally 3 so the video can show the template; the owner posts it himself.
  5b. **Catalogue maker** (idea, `docs/ALBUM.md` S6): the photo book as a product catalogue for makers (item name/price/description fields, item layouts, cover and contact page); PARKED by the owner: not before a real user needs it, then built together with them and their requirements.
  5c. **Verein with Statuten** (the owner and a co-founder, `docs/VEREIN.md`; **important for funding**, long lead time and no code, so it runs in parallel with 1-5; an intent, not code): write the purpose with the co-founder, draft the Statuten, decide licence and rights, founding assembly, then move domains/host/backups into the Verein and mention it publicly. Needs real legal advice; nothing is decided.
  6. Later: jewellery maker as a tester (the owner knows her; ask her first, never use her work without asking, `docs/DESIGN.md` S3 goal 9).
- [ ] **User control of photos and content** (principle `docs/DESIGN.md` S3 goal 9, 2026-11-06; check what exists first, a grep found no account deletion or export): (1) export: all of a user's originals plus nodes as a zip (documents as JSON, photos as the uploaded originals, notes as text); (2) delete account: nodes, node_photos, photos no one else uses, sidecars in `uploads/`, `data/photos`, books in `data/books`, replay and event lines of the user, sessions, the row; (3) unpublish and delete remove the work from the sitemap and front page at once, and the cached `/large` and book files; (4) state the backup retention in the privacy sentence; (5) the same for guests (`docs/GUESTS.md`, the 30-day sweep already deletes); (6) never use a user's work in a demo, post or template without asking (practice).
- [ ] **Mobile nav shows only icons** (owner, 2026-11-06, a detour while building "Nothing is lost" below; NOT started): the owner does not like the tab strip on a phone with icons only; decide a labelled mobile nav (text under or beside the icons, or a bottom bar with labels), keep the tab strip's fixed height (`docs/DESIGN.md` S7.2a), check `static/css/layout.css` small-screen rules and the "Guest" and account entries; record the decision in `docs/DESIGN.md` S7.2a first.
- [ ] **Nothing is lost: continuous draft, restore without a question, resume at launch** (decided 2026-11-06, spec `docs/EDITOR.md` S2.8b; BUILT 2026-11-06, 1167 tests green; to do: check on the phone (kill the app mid-edit, call interruption, restart: editor open at the same scroll, no flash of the upload area, banner), list scrolls beyond the film-strip, undo history, the logout question): (1) draft v2 with the editor state, written 250 ms after each change and synchronously on hide/pagehide/freeze, restored without the question (banner with Discard changes), `/new` resumes a never-saved node; (2) resume at launch of the installed app (`wb-resume`, 12 hours); (3) viewer: node and photo only; (4) retention (30 days, 10 drafts), failing-storage warning; tests per the spec. Graph view state is not persisted.
- [ ] **Social post with a making-of video** (planned 2026-11-06, not started; the post goes out after the guest accounts are live and the checklist below is done; the owner posts it himself, I never publish). Material goes to `~/Desktop/WildBeauty-Post/`, style as the existing slides (1080x1080, kraft #e6d9ca, ink #7a1f2b, Liberation Sans Bold captions). Idea: show the making, not only results, so everyone sees what it is and wants to try.
  - Carousel, 8-9 slides: 1 hook with the favourite collage (node 4); 2 results (nodes 5 and 1); 3 raw photos then the wand cut-out; 4 free-hand drawing; 5 text boxes ("Chlini Wunder"); 6 background removal before/after; 7 wild flowers as gallery or slideshow; 8 closing "Try it, no registration" (needs guest accounts, so it waits for them). Slide 04 (editor screenshot) is replaced by a real capture from the run below.
  - Video: one 15-20 s clip, square, no sound, short burned-in captions: pick photos, wand cut-out, drag into place, draw a stroke, add a text box, finished collage. Instagram as first carousel item or Reel, Facebook as normal video.
  - How: script the editor in headless Chrome (CDP, as the scratchpad `shot.js`) on a throwaway node, record frames, encode with ffmpeg; the same run yields the stills for slides 3-6. Never touch the owner's nodes; delete the throwaway node afterwards. Photos: wild flowers unless the owner names others (nothing private).
  - Open: which demo photos; real tool run (recommended) or edited stills; check ffmpeg is installed; caption wording in the Swiss, passionate tone, de first.
- [ ] **Before the wide Instagram/Facebook post** (2026-11-06, the owner has a big reach; decisions open): (1) require a login to create or upload, so strangers cannot publish into the open public area (recommended, small change); (2) a daily upload cap per user (there is none, only 40 MB per file); (3) a nightly backup of `data/` (only manual backups exist); (4) a contact / report address and a legal notice; (5) a privacy sentence about the usage recording; (6) set `WB_PUBLIC_URL` in the runit service. The post material is in `~/Desktop/WildBeauty-Post/` (slide 04, the editor screenshot, is still missing).
- [ ] **Server render of a node's large image cuts off text** (found 2026-11-06 on node 4, `/api/nodes/4/large` clips the title at the top; the browser render is right): the lazy server render (`largeRoute`, rsvg) differs for text boxes; a node saved from the editor stores the client's large image, an older one does not. Check `server/media/raster.js` text handling, or let the client store a large image when the node is first viewed by its owner.
- [ ] **A test fails now and then** (seen twice on 2026-11-06 in a full `bun test`, green on the next run): find it by running the suite in a loop and note the name here.
- [ ] **Offline-capable PWA with the node editor** (idea of the owner 2026-11-06, not started, nothing decided): make collages without a network, the work kept in the browser and saved to the server when a connection is there; tools that need the server (the wand, background removal, the place lookup) are the exception. To decide: what is cached (the app files, the editor), where the unsaved nodes and uploads wait (IndexedDB), how a save with a changed `rev` is merged (`docs/EDITOR.md` S4), the install prompt. Related and smaller, **done 2026-11-06**: tracking installs of the PWA (`pwa` usage events and `standalone` on the session event, `client/events.js`, `tools/events-report.js`); a browser test on a real install (Chrome desktop, Android, iOS home screen) is still open.
- [x] **Basic SEO** (asked 2026-11-06, built the same day, `docs/SEO.md`): privacy first, a node is findable only by the default rule (a public collage) or the owner's setting (`tools/findable.js`); robots.txt, sitemap.xml, description, canonical, hreflang, Open Graph, no photo in image search. Still open: a button for the findable setting in the node editor or the batch editor; JSON-LD; Search Console (set `WB_SITE_VERIFICATION`, set `WB_PUBLIC_URL` to the public address in the runit service so canonical links never use a guessed host); look at the Telegram and WhatsApp previews of a new link.
- [ ] **Guggenheim-style 3D gallery: atrium with a helix ramp** (asked 2026-11-06, POSTPONED by the owner, nothing built): idea and open points in `docs/GALLERY.md` ("Guggenheim atrium", in the list of later decisions). Start from the existing wall generation of the 3D gallery (`client/gallery/`), when the photo book and the open browser checks are done.
- [ ] **Detour trail of 2026-11-06** (written down when the owner asked what had been interrupted). The session began with the **NodeEditor split / shared UI** question (thread below, still DECIDING, nothing built) and went, one detour from the other: nav redesign (done) -> save freeze fix E64b (done) -> in-place notes in the carousel `docs/GALLERY.md` S5c (built) -> photo book design -> Garden Route journey photos ingested, nodes 64 (outbound, first) and 65 (return, last) are still **hidden: publish them**; 64 removed photos re-added as `off` -> server leaves `off` photos out for non-writers `docs/BATCH.md` S5 (done) -> photo book v1 `docs/ALBUM.md` S4c (built, real print not checked) -> placeholder notes `docs/BATCH.md` S6a2 (built and seen in the browser). **Browser checks done 2026-11-06 on the live site:** carousel note field with the Place/Date/Time buttons (values as captions, insert at the cursor, Escape discards), batch popover with the same buttons, Find placeholder notes (0 found, then 1 after a local edit, Revert clean), nav in en/fr/es, phone width (iframe of 390 px: icon-only nav, note field under the picture), visitor view by request (not the owner, no `rev`, notes visible, hidden nodes 64/65 and `off` photos absent, PATCH answers 401). **Interrupted and still open:** decide the NodeEditor split and which parts the batch editor shares (candidates decided one by one); not built from S5c: node properties popover, day report per node, the 1 MiB budget message while typing, phone / visitor / 423 checks; browser checks that need real edits (the save fix on a real node, the editor's tools after the regroup, the lock 423 in a second session); the print of the book in Firefox and Brave (margins, long notes, strings in de/fr/es); `exports.ttxt` in the root is untracked and not mine to judge.

- [ ] **Garden Route trip gallery: all photos except the flowers, in balanced trip nodes** (asked 2026-11-05, IN PROGRESS): the 942 files of `/mnt/data/Pictures/Garden-Route` that are not in `gr.selected` (the 305 flower photos already in nodes 42-54 under gallery 41). Decided: (1) `tools/ingest.js` is not bound by the photos per node (validate/saveNew take `maxPhotos`, the tool passes Infinity), the limit of a free node stays 40 (layers of one composite, the editor never loads more as layers), a slides or grid node may hold 1000 (`LIMITS.photosSequence`, `photoLimit(mode)`; QuickAdd and the gallery pane follow the mode; switching a node over 40 to free is refused). (2) Nodes are trips told in time order: a stay at a base (Plettenberg Bay, first week), a multi-day trip away from it is a node of its own, then the return. Rule: sort by capture time, cut where the position leaves the running centre of the stay (about 15 km) for more than a few hours, or at a gap of more than 1.5 days; merge segments under about 25 photos into the neighbour with the nearest place; split segments over about 120 at their biggest gaps into equal parts, so counts stay within a factor of 2 to 3 (no 400 next to 20). (3) Titles "Place, date range" like nodes 42-54, German date style as there (multilingual titles stay a separate open thread). (4) A new gallery node, hidden, made with `--groups` from a plan file that is shown to the user before anything is ingested. Postponed: publishing, multilingual titles, map view.
  Done 2026-11-05: the gallery is node 63 (trip nodes 55-62, hidden), all 942 photos with exact positions. Private photos: NudeNet 320n (huggingface deepghs/nudenet_onnx, through qjs-opencv dnn) found 64 files with exposed body parts in the 1247; they were taken out of every node and out of the app (rows, baked files, uploads), nodes 42-51 and 55-62 saved through `saveUpdate`. Their original paths and scores are in `/mnt/data/wild-beauty/removed-2026-11-05.lst` / `.tsv` (outside git, for `tools/ingest.js --list` to bring any back); a database copy from before is `/mnt/data/wild-beauty/wb.before-takeout-2026-11-05.sqlite3` (it still holds their rows, delete it when sure). Open: the detector is under-confident at 320 px, so some nudes may have scored below 0.1 (not reviewed by eye); the scan script is a scratch file, not yet a tool.
- [ ] **Batch editor in the graph view** (asked 2026-11-05, IN PROGRESS, a detour from the Garden Route task above, which is otherwise done): spec in `docs/BATCH.md`. Order: (1) spec (done); (2, done) `off` flag on photo steps in `model.js`, honoured by `render.js` photoSteps / renderNode, `firstPhotoStep`, gallery items; (3, done) `client/editor/core/batch.js` + `tests/editor/batch.test.js`; (4, written, not yet checked in a browser) `client/components/BatchEditor.js` (table, photo view, save), chip in `GraphPage.js`, `?edit=1` in `NodePage.js`, locale strings x4, CSS; (5) `docs/DEVELOPER.md`, browser check. (6) descriptions, `docs/BATCH.md` S6a, in this order: `desc` on photo steps + `setDesc` + gallery caption; `meta.taken` at upload/ingest + backfill with `tools/ingest.js --positions-only`; `tools/gazetteer.js` + `server/api/geoname.js`; `POST /api/photos/describe`; the description bar in the photo view. Done 2026-11-05 (6): all of it except the browser check and the backfill of `meta.taken` for the existing photos (`bun tools/ingest.js --positions-only /mnt/data/Pictures/Garden-Route/*.jpg`, slow: runs exiftool twice per file; the 305 flower photos live in other folders). Thumbnails fixed 2026-11-05 (`.small.jpg`, the `.thumb.jpg` only exists for node tiles). (7, asked 2026-11-05) manual node order: up/down per table row, op `order` on the parent's `child` sorts, `child` cycle refusal in the `link` op (`docs/GRAPH.md` S1.2, `docs/BATCH.md` S2a). Postponed: `loop: true` gallery option (wrap-around in the viewer, `docs/GALLERY.md` still to say so), dimming disabled photos in the node editor, dropping onto nodes outside the selection, showing `desc` in the node editor.
- [ ] **Shared editor UI, NodeEditor split strategy, batch editor from use cases** (asked 2026-11-05, DECIDING, nothing built; a detour from the batch editor's browser check, which stays open above). Agreed so far: (a) the batch editor grows from use cases, each feature decided singly by the gate in `docs/BATCH.md` S9 (real need, easy, obvious, convenient, light); the candidates (S9b) and draft use cases (S10) are written down, none is agreed; (b) pieces both editors need are shared components with plain props: `AnnotatePopover` (also gives the node editor `desc` and a `setDesc` command) and `PropertiesPanel` (S9a). Proposed, to decide: do these two before the NodeEditor split, then split with one thin composed hook `useNodeEditor(host)` (wiring only, logic stays in the feature hooks) plus a separate `NodeEditorView`, and let `BatchEditor` reuse `useNodeStore`. Next: the owner confirms or rewrites the use cases (S10); then pick the first candidates. (c, first slice BUILT 2026-11-06, see `docs/GALLERY.md` S5c for what is done and not done; use case U9 from the owner: documenting the Garden Route trip photo by photo in the carousel) a third consumer of the same two components: in-place caption editing beside the picture on the owner's node view, spec `docs/GALLERY.md` S5c (decided 2026-11-05: the column always to the right, notes of up to 5000 plain-text characters with paragraphs, a short form for alt/captions/tooltips; open: `PATCH /api/nodes/:id/captions` or the whole `PUT`, captions in the masonry view, the document's 1 MiB budget shown while typing), later the node properties in a popover; the full save no longer renders for grid and slides nodes (E64b), but a caption-only route would still spare a server tile render per caption. Postponed: all of the S9b candidates, the NodeEditor split steps 1-6 below (reorder them after this is decided), the open questions whether the batch Properties panel may touch bg, and whether annotating in the node editor needs a key.
- [x] **Save of a big node took tens of seconds and froze the page** (found and fixed 2026-11-05, `docs/EDITOR.md` E64b; found from the usage log `data/events/2026-11-05.jsonl`, session `82bdb60e`, and the runit log, reproduced on a sandbox server). Symptom: after Save and Close the "unsaved changes" dialog appeared and "Edit" of another saved node did not react. Cause: `save()` drew the tile and the large render of the whole node before it sent the `PUT` (17.9 s and two freezes of 8.6 s for a grid of 127 photos of 3 MP, the real nodes 60 and 61 never reached the server). Fix as decided by the owner: a free node's tile and large render stay in the browser (pixel exact), a grid or slides node is drawn by the server (the `PUT` goes out at once, 253 ms in the test; server tile 1.2 s, checked by eye), the large render of a free node runs after the save, Close and "Edit" wait for a running save (`store.js` `setSaving`, `idle`; `NewPage.js`; `closeAfterSave` in `NodeEditor.js`). Tests: `tests/editor/store.test.js`. Open: a free node of 40 big photos still takes 2.9 s to the `PUT` with a 2.5 s freeze (and another after the save for the large render), a progress state "Saving...", drawing in slices or in a worker, an `/api/nodes` check that a grid node's tile exists; no browser check on the real nodes 60 and 61 yet.
  Also done in this detour: `popfit.js` no longer throws when its panel is already out of the page (seen in the log as `popfit.js:18`, three times at 23:10, the new nav menus).
- [ ] **Photo book: print a node or gallery like a real photo album** (asked 2026-11-05, decided 2026-11-05: A4, single pages, browser print only, the whole gallery as chapters, plain white page with captions, every visitor of a public node can print; page: A4 portrait (decided 2026-11-06), white, no borders, the note below the photo (right of a tall one when short), several photos per page where possible (`docs/ALBUM.md` S4b; the chapter name only on the chapter's title page, never on every page; type like a Word document: sans-serif, proportional, bold larger titles, body 11 pt: decided 2026-11-06); use case 2 (the Garden Route as a book for the owner's son, only the annotated photos: the option "Only pictures with a note", `docs/ALBUM.md` S0a, proposed); version 1 built 2026-11-06, see `docs/ALBUM.md` S4c: page `/:lang/node/:id/book`, packing, print CSS; the **server PDF** is built 2026-11-06 (`docs/ALBUM.md` S4d, S4e: LuaLaTeX, login only, no headless Chrome; open: a picture limit per book, a wider inner margin for binding, a look at the whole 1,034-picture book and at a 100-page run for time and memory), check a real print/PDF in Firefox and Brave, margins, long notes across pages, strings checked by the owner, chapter printing); placeholder notes built 2026-11-06 (`docs/BATCH.md` S6a2: `{time}`, Place/Date/Time buttons with the values as captions, Generate keeps notes, Find placeholder notes): not yet checked in a browser (carousel and batch popover buttons, find button), and the Garden Route journey nodes 64 and 65 are still hidden (publish them): spec and the still open points (orientation, page templates, chapter title page, one document or per chapter) in `docs/ALBUM.md`; baked photos are at most 2048 px, about 17 cm at 300 dpi. Name: "photo book", because the masonry view is already the "Album" button.
- [ ] **User profile** (asked 2026-11-05, IN PROGRESS, another detour from the batch editor, whose items 1-7 are done and only wait for a browser check): spec `docs/PROFILE.md`. Done 2026-11-05: (1), (2), (3) and the page (client/components/ProfilePage.js); (4) done too (description pattern in Generate, `Titles from pattern` in the table view); open: the browser check of the profile, the menu link, the batch editor's tile buttons and the avatar round trip. Order: (1) migration 10 + `viewerOf` fields + `GET/PUT /api/profile` + `POST /api/profile/avatar` + tests; (2) `/:lang/profile` page and the "User profile" link in the nav; (3) `client/editor/core/pattern.js` (`fillPattern`) + tests; (4) batch editor: description pattern in Generate, "Titles from pattern" in the table view (`docs/BATCH.md` S6b); (5) `docs/DEVELOPER.md`, browser check. Postponed: title button in the node editor, password change, e-mail change, `user-profiles` list, attribution on the node page.
- [ ] **/tree for visitors** (asked 2026-11-05, IN PROGRESS): `docs/GRAPH.md` S2.8. Done 2026-11-05 (1) to (5) except the browser check. Order: (1) spec (done); (2) guard: graph ops on community nodes need an admin (+ test); (3) `client/graph/collapse.js` (pure, tested) + visitor mode in `GraphPage.js` (collapsed roots, `+n` badge, tap to expand, read-only, no drag, no recording box); (4) Edit button, toolbar tidied with a More popover; (5) calm edge styling, locale strings, `docs/DEVELOPER.md`, browser check. Postponed: the spine-and-branch navigation view (S2.7), windowed fetch.
- [ ] **/view, the Show page** (asked 2026-11-05, built, browser check open): `docs/GALLERY.md` S5b. Done: `viewCards` (`server/node/view.js`) and the `/:lang/view` page with `/gallery` redirecting (301) and `/` leading there, nav link, `GalleryPage.js` as a card grid (mosaic of up to six photos spread over the gallery, the title text box drawn as in the editor, picture count), CSS, strings x4, `tests/start.test.js`. Open: look at it with the real galleries (nodes 9, 11, 19, 41, 63), the order (newest first), a floor-plan preview of the room.
- [ ] **Grid fill `stage` ("Fill stage")** (asked 2026-11-05, built, browser check open): `docs/EDITOR.md` S4 point 9b, `coverCells` in `client/editor/geometry/grid.js`, third button in `ModeSwitch.js`. Look at it with 7, 24 and 115 photos; if the cropping of the outer tiles is too much, tune `SEEN` (0.3).
Detail lives in `docs/EDITOR.md` (E-numbers) and `docs/UX-REQUIREMENTS.md`. Update this list when one closes.
State 2026-11-01: everything below is committed (the 2026-10-31 work in `3552fad`, `4aba6bf`, `ef0983b`, `4960fd4`, `c334a91`, `1cf6919`); the branch `claude/pensive-lovelace-omjgl4` holds the magnetic lasso and the assessment (`docs/ASSESSMENT.md`) on top of `master`. The camera / place work (E137, E139) is done in another session and not listed here.

### Editor regroup and NodeEditor split (2026-11-04)

`client/editor/` was a flat directory of 56 files; it is now grouped (`client/editor/README.md`, map in `tools/editor-moves.map`, done with `qjs-modules/utilities/move-modules.js`). Tests pass (1016), the dev server serves the new paths. The split of `components/NodeEditor.js` (3282 lines) is planned but postponed.
- [x] Regroup `client/editor/` into `core/ geometry/ input/ tools/<tool>/ io/ view/ overlay/ hooks/` with a README per folder; `docs/EDITOR.md` S7 file list updated.
- [ ] **Commit the regroup** (not committed yet): the staged moves, the rewritten imports and mentions, `tools/editor-moves.map`, the folder READMEs, `docs/EDITOR.md`. One commit, no logic changes.
- [ ] **Browser check of the editor** after the move (only served and unit-tested so far): open the editor, try the select, wand, lasso, clip, shape and text tools, save and reload.
- [x] **Rename the four basename clashes** (done 2026-11-04, `tools/editor-renames.map`, tests green, dev server restarted): `core/scene.js` -> `galleryScene.js`, `view/palette.js` -> `swatches.js`, `io/places.js` -> `placeSuggestions.js`, `input/tools.js` -> `toolTable.js`.
- [ ] **Decide** whether to also rename `tools/wand/wand.js` -> `wandMaps.js` and `tools/lasso/lasso.js` -> `lassoWire.js` (a folder-then-same-name stutter, no clash today).
- [ ] **Duplicate test names**: `tests/hit.test.js` and `tests/editor/hit.test.js`, likewise `places` and `tools`; merge or rename.
- [ ] **Group `client/components/`** (about 45 flat files) with the same mover tool, after the split.
- [ ] **NodeEditor split** (postponed; order under review, see "Shared editor UI" above), in this order, tests and a browser check after each step, one commit per step:
  1. `editor/editorConstants.js`, the pure helpers (`wallRefusal` -> `core/walls.js`, `insideQuad` -> `geometry/polygon.js`, `moversOf` -> `core/model.js`, `photoInfo` and `isPayload` -> `io/preload.js`, `themeColours` -> `core/theme.js`, `KEYS` and `ACTIONS` -> `input/toolTable.js`) and the 11 pure overlay components -> `editor/overlay/` (about 190 lines).
  2. Generic hooks in `client/hooks/`: `useLatest`, `useMediaQuery`, `useWindowEvent`, `useInterval`, `useDebouncedEffect`, `useAbortable`, `usePersistedPref`, `useAsyncState`.
  3. Self-contained feature hooks in `editor/hooks/`: `useDraft`, `useLock`, `usePlayback`, `useScenePalette`, `useAlphaMaps`, `useDropper`, `useUsageContext`, `useLoupe`.
  4. `useSelection`, `useNodeStore` (load, save, conflict), `useClipboard`.
  5. Tool hooks (`tools/<tool>/useX.js`) and the tool table `{ down, move, up, keys }` replacing the `tool ===` chains in `down`, `move`, `up`; wand and lasso share one `useSelectionRun`, no cross-imports between tools.
  6. `deriveView.js` for the derived values, and the JSX split into `components/editor/EditorHead.js`, `EditorBody.js`, `EditorFooter.js`.
  Rules for the new files: every basename unique in the repo; hooks `useX.js`, components `PascalCase.js`, the rest `camelCase.js`; no `index.js`, `utils.js`, `helpers.js` or `constants.js`; dependencies point down `components -> hooks and tools -> overlay, view, input, io -> core -> geometry`. Every hook takes one `host` object (`latest`, `dispatch`, `announce`, `tr`, ...) and returns `{ state, actions }`.

### Carried over from MORNING.md (retired 2026-11-04)

`MORNING.md` was a one-off checklist from 2026-11-01. What is still open from it (the qjs-opencv side has its own `doc/morning-2026-11-01.md` there):
- [ ] **Lasso check on the desktop and the phone**: the line snaps and follows the pointer; the chip says "Kanten: OpenCV" after a moment (that is how you know the server's `edgemap` is in use; if it stays "einfach" with the tool installed, read the `/api/edges/` lines of the runit log); closing with Enter or the first dot; Cut out, Take out, Erase with and without "Lücke füllen" and Undo each; Ctrl+Z until the photo is gone must drop the selection without an error. On the phone: the line appears after each tap, the loupe shows above the finger, closing by tapping the first dot works, Take out on a large camera photo (timing). Screenshot every wrong edge.
- [ ] **Decide `WB_CUTPOLY=guided` as the lasso default**: set `export WB_CUTPOLY=guided` in `/var/service/wild-beauty/run`, restart, compare cuts of one outline on petals, hair, fur against the Python stand-in `tools/polycut.py`. If guided wins, make it the default and delete `polycut.py`.
- [ ] **Run the lasso benchmark** (`tools/lasso-bench.js`, simulated clicks every 20/40/80 px with 3 px aiming error): AIM-500 with `--split tune` to decide, `--split test` to confirm (no default changes without a held-out run); the flower photos with `--sheet` (no ground truth, contact sheets only). Variants: `local`, `clahe3='--clahe-clip 3'`, `noclahe='--clahe-clip 0 --smooth none'`.
- [ ] **Decide the lasso's next step**: add / subtract with the wand, holes (a second outline), touch dragging, or the benchmark first. Known gaps: no live line on touch before a tap, no holes, no add/subtract.
- [ ] **Deep edge detector for qjs-opencv**: HED or DexiNed ONNX export and which venv (see "Deep edges" under the magnetic lasso below).
- [ ] **GPU**: SAM encoder timings from this machine and the cuDNN question, see "SAM on the GPU" above and `WAND.md` B9.
      **In progress (2026-11-05): OpenCV 5.1 with CUDA + cuDNN.** Configured in `~/Sources/opencv/build/x86_64-linux-gnu`
      (`cfg-cuda` in `~/Sources/opencv/cfg.sh`; CUDA 12.0 + gcc-12, cuDNN 9.27, arch 7.5, NVCUVID/NVCUVENC on with
      Video Codec SDK 13.0.37 headers in `/usr/include`, matching driver 595 = NVENC API 13.0). The user runs `make` himself
      and reports back; `~/Sources/qjs-opencv/build-opencv.sh` does the same via `cuda_opencv()`. Postponed (user said "not yet"):
      (1) benchmark script: load each model on CPU / `DNN_TARGET_CUDA` / `CUDA_FP16`, record load errors, time, agreement with
      CPU (MobileSAM, U2-Net, LaMa, MI-GAN, Real-ESRGAN, YuNet); (2) after that decide per model OpenCV-GPU or onnxruntime-gpu
      (SAM ViT-H stays on onnxruntime-gpu: ViT ops and 2.4 GB external data are doubtful in dnn, and 8 GB is tight); (3) run
      `opencv_test_dnn` and `opencv_test_cudacodec` after the build; (4) `WAND.md` B9 says "rebuilding OpenCV with CUDA rejected":
      update it with the outcome.
- [x] **Garden Route flowers gallery** (2026-11-05, done): gallery node 41 with 13 child nodes by place and day ("Plettenberg Bay, 25. April", "The Crags, 2. Mai", "Knysna, 21.-24. April", "Garden Route, 19.-30. April" for the 12 stragglers), 305 photos with a flower-detect score of 0.78 or more, imported with `tools/ingest.js` (`--groups`, `--into`), named from GeoNames cities1000 (nearest town of each 5 km cluster, scratchpad `clusters.json`, `groups.json`). The first set of 8 date nodes was replaced. DB backups in `/mnt/data/wild-beauty/` (`wb-before-garden-route-...`, `wb-before-place-nodes-...`). You published the nodes. Titles are German date style, one string: **open** a title as data rendered per language (place + date), and a gazetteer inside the app for places outside Switzerland (GeoNames cities1000 is CC BY 4.0, not wired in).
- [x] **Exact photo positions** (2026-11-05, decided by you): `photos.meta.where` (6 decimals, private), from EXIF at ingest, from "Tag the photo with my location" (now exact, high accuracy) and from `tools/ingest.js --positions-only`; the 305 Garden Route photos are filled in. Clients still get only the rounded `pos`. The 207 photos of wild-flowers and wild-flowers 2 have none (no originals found). Documented in `docs/GRAPH.md` S1.5, `docs/EDITOR.md` E139, `docs/DEVELOPER.md`. **Open**: whether the owner should ever see or export the exact position, and what a public map view may show.
- [x] **Tree view: move a selected group by dragging** (2026-11-05): `GraphPage.js` carries the group as it lies, drop on empty space keeps it there (pinned, Undo), drop on a node still links, Alt on release lines up. Not tried in a browser yet.
- [ ] **Gallery presentations** (asked 2026-11-05): a gallery node shows as the 3D gallery today (`client/components/NodePage.js`, `GalleryView`). Add two more ways to show the same child items: carousel (the paged track of `NodeView`: snap, Previous / Next) and masonry ("album overview": all tiles at once, not bound to the square stage, the tiles themselves square). Open: where the choice lives (the owner's setting in the doc, a visitor switch in the node head, or both), see "Gallery presentations" in docs/GALLERY.md once written; also server rendering (the node page is rendered into the HTML), the four locales, tests, `docs/DEVELOPER.md`.
- [ ] **Unify wild-flowers (11) and wild-flowers 2 (19), split by time, sort all galleries by capture time** (asked 2026-11-05, postponed): the 207 photos have no capture time (no EXIF in `data/photos`, `photos.meta` empty, `created_at` is upload time), and matching them against `/mnt/data/Pictures/Garden-Route` found no originals (best cosine 0.936, different flowers). The nodes 14 to 18 already carry date range titles from some earlier tool. Needs a source for the time (originals in `Unsorted/`, USB stick, recovered files, found by CLIP similarity, about 10000 photos, better on the GPU) and a rule for the split (equal chunks of about 40, month, season). `LIMITS.photos` is 40 per node.
- [ ] **Map view of a collection** (asked 2026-11-05): where the photos were taken, with `pos` (rounded to about 1 km, kept in the sidecar, the exact GPS stays in the originals). swisstopo tiles cover Switzerland only, the 28 flower photos from the Garden Route need a world basemap (OSM). OpenLayers is vendored in `lib/`, `plot-cv/ol-map.js` is an OSM based example, not admin.ch.
- [ ] One test failed before the lasso work and may still: `POST /api/nodes > a photo-less node ... server-rendered tile (E82)` (fonts or Inkscape on this host). `tests/lasso.test.js` "the live wire returns on the cost window" has a 500 ms budget that fails under the load of a full `bun test` and passes alone; loosen it or move it out of the parallel run.

### Postponed (2026-10-31)
- [ ] **E154b "Mark as texture" button in the gallery pane** (`components/GalleryPane.js`): list the node's picture photos there with a button that marks one as texture (the `setRole` command, as the ▦ button of the film-strip does), so assigning a texture does not need the Photos tab. Decided to postpone; the pane for now says to use ▦ in the Photos tab. Related open points of E154 (`docs/EDITOR.md`): the pane does not refresh the linked children after linking in the tree; walls split by compass direction are not rendered.

### Done 2026-10-31 (committed since)
- [x] Dev server under runit (`/var/service/wild-beauty`, log child; two steps for you: `chown log:log .../log/main`, `ln -s` into `/etc/service`), note in `CLAUDE.md`.
- [x] Mail: Postfix `submission` (587) and `smtps` (465) enabled and restarted, router forwards seen, `ufw` allow rules added (ufw inactive). `docs/PLAN.md` S17.
- [x] Login dialog with the old tumbling overlay (`LoginDialog.js`), Login tab; `POST /api/login` missing.
- [x] Editor: scrolled into view (E148), texture toggle only in galleries (E149), text background toggle (E150), colours that fit the picture (E151), stable palette, dropper icon and outline, popover look (E152), box of a stroke turns with it (E153).
- [x] **E147 multiple selection**: rectangle, Shift, Select several, Ctrl+A, Shift+PageDown, group box with handles, drag by member or box, Align, order, properties by type, clipboard, duplicate, delete, scrubbed groups, `batch` and `recordMoves` commands.

### Open from 2026-10-31
- [ ] **E147 concerns (a) to (l) and its test list** (`docs/EDITOR.md`): phone check of the rectangle and the Select several button, the group bar is long, popover wrapping CSS never seen, big copies, a picture for a copied group, busy outlines, a "More" popover.
- [ ] **E150 / E152 small ones**: open the text Background popover with the background on; a visible hint while the dropper is armed and a second click cancelling it; the colour wheel button with the swatch hairline; ingest palette of about 16 colours.
- [ ] **E148**: should an editor that opens by itself scroll? Check on a phone.
- [~] **Login and registration** (`docs/PLAN.md` S17): built - `POST /api/login`, `/api/register`, `/api/logout`, `GET /api/me` in `server/auth.js` (argon2id, session cookie, rate limits: 5 failures per client, 5 sign-ups an hour; `WB_REGISTRATION=closed` switches sign-up off). Registration is deliberately minimal: the mail address is kept but **not verified**, no activation mail. Open: decide whether a password reset or an activation link is wanted (both need mail sent: no sender in the code, `nodemailer` under Bun is the plan), then SPF, DKIM, DMARC and reverse DNS (unchecked), inbound port 25 (unchecked from outside), texts in four languages.
- [ ] **Firewall**: `ufw` is inactive with allow rules for 25, 465, 587, 143, 993; enabling it needs rules for 22, 80, 443, 3001, the `anon` proxy and Docker first.
- [ ] **Housekeeping**: `i18n: missing key "editor.keys.\"` (the keys help has no text for the backslash key, and does not list the new shortcuts Ctrl+A, Shift+PageDown / PageUp, Shift+click either: `KEYS` in `NodeEditor.js` and four locale files); the test browser tool's Escape made the title placeholder read "null" (no page code wrote it, check with a real keyboard).
- [x] Commit this day's work (done: see the commits above).

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
- [ ] Three reports exist: `tools/events-report.js` (E107), `tools/events-sessions.js` and `tools/replay.js` (sessions, replay); merge them.

### Wished 2026-11-01
- [ ] **Drop image files from the desktop's file browser onto the stage.** Today the stage only accepts upload cards dragged from the upload area (`accepts` in `NodeEditor.js` checks `UPLOAD_MIME`); files dropped there do nothing, while the upload area takes them (`UploadArea.js` `add(e.dataTransfer.files)`). To do: the stage also accepts `Files`, hands them to the upload area's flow (same checks, sizes, progress, the card appears), and when each record arrives places the photo at the drop point (`addUpload` with the drop position), several files fanned out a little; a ring at the drop point while it uploads. Desktop only (phones have no file drag).

### Photo access: users stay in control of their photos (found 2026-11-01, next to build)
- [ ] **Today any file is served to anyone who knows its hash**, and published nodes give away hashes they should not:
  - `GET /files/uploads/<hash>[.display|.card].<ext>` (`serveUpload`) checks nothing, so an upload is reachable without the browser that owns it; marked `cache-control: public, immutable` (a proxy or CDN in front could keep it and hand it to others; nginx has no cache today).
  - `GET /files/photos/<hash>[.small|.thumb|.large].<ext>` (`servePhoto`) checks nothing either.
  - Saving bakes the **original behind a cut, erase or take out** (`step.orig`, kept for "Restore original") into the node's photos (`photosOf` in `server/node/validate.js`, role `picture`), and the node page and `GET /api/nodes/:id` hand every visitor the document with `orig` and its photo info (`photoInfos`): **anyone can download the uncut original of a published collage**, the detail erased with the wand included.
- [ ] **Rule (decided 2026-11-01): a picture is reachable over HTTP only for its owner, or when it belongs to a published node.** Design:
  - uploads: served only to the browser that owns them (`record.owners[session.owner]` not expired, like the upload list) and to admins (replays); otherwise 404;
  - baked photos: served when a node links the photo (`node_photos`) and the requester may see that node (`visibility = 'public'`, any space, or the owner); originals only to whoever may edit the node (`mayWrite`: the owner, or anyone for an unowned community node), as only they can restore it; tiles (`<tile>.thumb.jpg`, `<tile>.large.jpg`) when a node with that `tile` may be seen; admins everything; otherwise 404 (forbidden looks like missing);
  - `photosOf` gives a hash used only as `orig` the role `original`; existing rows are re-classified at start (`server/node/reconcile.js`, idempotent);
  - views for anyone who may not edit (node page, node API, gallery children, site pages) drop `orig` from the document and originals from `photoInfos`;
  - `cache-control: private, max-age=31536000, immutable` on both routes (browsers still cache, shared caches may not);
  - the server's own renderer reads files from disk (inkscape, ImageMagick), not over HTTP: unaffected;
  - tests: a visitor gets 404 for an upload, an original, a photo of a hidden node and its tile; the owner gets all; the existing `large`, `api-nodes`, `e2e` tests keep passing (they fetch photos of public nodes).
  - optional later: "Forget the original" (drop `orig` for good).

### Browser load and GUI responsiveness (idea 2026-11-01)
- [~] **Built 2026-11-01** (`client/events.js` `startLoad`, events `slow`, `frame`, `load`, device in `session`; `bun tools/replay.js show <id>` prints the summary, `server/replaylog.js` `loadOf`): slow interactions, long frames with their scripts, memory and pictures held per minute. Not built yet: frame times during gestures, `performance.mark` around our own phases, a cross-session report in `tools/events-sessions.js`. Use the recordings of the coming days to see which use cases get heavy on RAM (the editor's photos are 2048 px display copies, about 12 MB decoded each: a medium-size stage copy is the first candidate if that is it).
- [ ] **Measure how hard upload, editor and graph editor load the browser, and when the GUI gets sluggish**, as usage events (`client/events.js`), only above thresholds plus a summary per minute:
  - responsiveness: Event Timing (`PerformanceObserver` `event`, INP), every interaction over 200 ms with the control / command it belonged to;
  - the cause: Long Animation Frames (`long-animation-frame`, script and function attribution), `longtask` as the fallback;
  - smoothness during gestures (drag, pinch, graph pan / zoom, upload grid scroll): frame times from `requestAnimationFrame`, dropped frames per gesture;
  - memory: `performance.memory` (Chrome), growth over a session;
  - our own phases: `performance.mark` / `measure` around upload decode / resize, editor open, graph layout, image loads;
  - device class: `hardwareConcurrency`, `deviceMemory`, screen size.
  Report per page in `tools/events-sessions.js` (95th percentile, worst interactions with their cause); slow events line up with the rrweb replay of recorded sessions. Timings of our own code only, nothing personal.

### Magic wand and background removal (docs/WAND.md Part E has the details)
- [ ] **SAM on the GPU** (docs/WAND.md B9, postponed 2026-11-01): full SAM encoder (ViT-B, ViT-L, ViT-H) on the RTX 2070 SUPER via onnxruntime-gpu into the embedding cache; the tool exports its encoder input and the cache key, a Python script writes the `.emb`; harness against MobileSAM first. The venv `~/.local/share/wild-beauty/sam-gpu-venv` is ready, models not downloaded.
- [ ] Browser pass of the 2026-11-01 wand work (select / apply, Fill the hole, Exclude subtracts the object, first tap adds, overlay clipped, recording box on node pages, the wand on the current image, select tool after Take out, the faster fill).
- [ ] **Latency, what is left** (docs/WAND.md B8): persistent `opencv-imgproc serve` worker with a pool in the server (select 0.74 s to about 0.25 s); crop `cutFromSoft` to the subject (0.7 s); cropped cuts with an offset (editor change); no-fill rest as WebP or cropped. Done 2026-11-01: Cut out 6.5 s to 3.7 s, Take out 9.5 s to 6.0 s, Erase 9 s to 5.9 s, 4-tap select 2.4 s to 1.3 s.
- [ ] Encoder ahead of the tap (wand tool entry, whole galleries in the background).
- [ ] Flower gallery (200+ photos) as a real-world test set: one tap each, contact sheet, fixed for later changes.
- [ ] **Complete the subject** (amodal completion, docs/WAND.md A8): keep the excluded masks, guess the hidden shape, the user refines that outline, then fill only it. Spec, prototype 2026-11-01.
- [x] **Magnetic lasso** (2026-11-01, docs/WAND.md 0): the tool (L) in the wand's group. Built client-side instead of OpenCV `IntelligentScissors`: `client/editor/tools/lasso/lasso.js` (Sobel edge cost on a 640 px copy, click snapping, Dijkstra live wire in a bounded window, Douglas-Peucker), the outline is applied by `/api/segment` with `polygon` and `tools/polycut.py` (Pillow, even-odd, feathered), then the same fill / store path as the wand. **Not yet tried in a real browser**; to do: touch (no hover, so no live segment), drawing a hole (second outline), `region`-style hand-over to the wand.
  - [ ] **Better edges for the lasso (qjs-opencv `edgemap`, docs/WAND.md 0)**: CLAHE on the lightness, edge-aware smoothing, Sobel plus Canny fused into an 8-bit edge map per photo (cached), which the browser's live wire uses in place of its own JS Sobel (kept as the fallback while the map loads). Spec sent to the qjs-opencv session 2026-11-01.
  - [ ] **Deep edges are required, built second** (`edgemap --detector hed|dexined` through `dnn`, fused with Sobel / Canny): the first `edgemap` ships without a network, but the option, the models dir and the fusion are part of it and must work before the lasso counts as done. Needs the models (with checksums, as for MI-GAN and SAM), a licence check, and a measurement against the classical map on the flower gallery (docs/WAND.md, fur / foliage / clutter).
- [ ] Box drag as first prompt, grow / shrink the hole, fill variants for large holes; small objects fail with `E_METHOD`; choosing which subject Remove background keeps; `sam` for the final pass.
- [ ] qjs-opencv release: smoke tests of `segment` / `cutout`, models with checksums, install script.

### Needs a specification before it can be built
- [ ] **Copy several steps at once**: needs selecting several steps first (Shift-tap, box select, "select all"?); the clipboard payload already holds up to 8 items.
- [ ] **E110 dark theme**: the colours of a dark kraft (ground, ink, accent, cards) are not decided.
- [ ] **One word for "node" / "work" in English** (German Werk, French pièce, Spanish pieza).
- [ ] **E94 fill editor** (none / solid / linear / radial gradient, 2-5 stops, alpha) for the text background: the UI is not drawn.
- [ ] **11.3 Image embeddings** (duplicates at upload, related nodes, search): runtime decided 2026-10-29 (DINOv2 via dnn), see M11.
- [ ] **Promo video from a session recording** (docs/WAND.md E15) (idea 2026-11-01, "a Wild Beauty TV commercial"): render an rrweb recording (`tools/replay.js export`) in headless Chrome at 1920x1080 (rrvideo or Playwright), cut the highlights by the wand / editor events of the server log and usage events, speed up idle stretches, captions and music with ffmpeg. Needs a clean recorded session (fresh collage, no draft banner) and access to the uploads for the renderer.
- [ ] Verify Spanish with DeepL (needs `DEEPL_API_KEY`, target ES-419) and the tester.

### Decided, not built (large)
- [ ] E74 / E108 device pass, stage zoom (postponed: the loupe covers it), E114 simple clip, the `docs/UX-REQUIREMENTS.md` list.
- [ ] **E129 text as clip** (postponed).

### Postponed (decided 2026-10-29): grid and viewer follow-ups
- [ ] Grid: a page size other than cols x cols, row count separate from the column count.
- [ ] Viewer: page dots, autoplay, swipe indicator, remembering the page across reloads.
- [ ] Editor preview of the viewer flow (the editor stage shows everything at once).
- [ ] Text boxes and drawings in the grid (cells of their own); drawings in slides are built (E133).
- [ ] Graph: composite thumbnail for group nodes in the saved list (with E82), rename a group in the graph, add or remove members by drag, group of groups, owner checks on `/api/graph`.

### Housekeeping
- [ ] Leftover test cut-outs in `uploads/` expire on their own (7 days).
- [ ] Restart the dev server on port 3001 to see the latest work (the live site is this local server, deploying is a restart).

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
      committed and `docs/DESIGN.md` S7 links them.
- [ ] **0.2 Record what the screenshots show** in `docs/DESIGN.md` S7 (task H1 uses
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
- [x] **4.3 Extend preview (client-side)** (superseded: photos are always square crops, see 4.4 and `docs/EDITOR.md` E98-E101): `object-fit: contain` over a
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
      icon on touch, nothing for square photos; the yellow fit triangle goes. Tasks in `docs/EDITOR.md` E98-E103.
- [x] **7.6 Ownership and expiry (2026-10-28)**: uploads belong to the `wb-session` cookie and expire with it; list and delete only for the owner (`docs/EDITOR.md` E104, `docs/PLAN.md` S6.2).
- [ ] **7.7 Collage use case (2026-10-28)**: first placement, touch transform handles, simple/freehand clip, clip preview, edit clip (`docs/EDITOR.md` E112-E126, `docs/UX-REQUIREMENTS.md` section I); E117/E118: auto clip and grabCut with opencv.js, trimmed build.
- [ ] **7.5 Quota**: total `uploads/` size cap with a translated error (P S9).

**First deliverable ends here (M1-M7): `/new` with design, i18n, drop zone,
progress, metadata, palette, list, delete.**

## M8 - M10 - Node editor, save, vector tools: see `docs/EDITOR.md` S9

The editor's tasks moved to `docs/EDITOR.md` S9 (E1-E83, client and server, small and
ordered). Mapping from the old milestones:

| Old | Now (`docs/EDITOR.md` S9) |
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
      graph view (`docs/GRAPH.md`) with many nodes, or smooth playback of big pages (E58). The
      renderer (`client/editor/view/render.js`) would get a canvas backend next to the SVG one,
      same step model; SSR, thumbnails and the viewer keep SVG. Measure first. Needs a
      vendored copy under `vendor/` (served as-is, no build step).

- [ ] **11.0 `opencv-imgproc.js` in qjs-opencv** (spec: `docs/opencv-imgproc.md`; done in
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
      (`docs/EDITOR.md` E25; P S10 use 2).
- [ ] **11.3 Image embeddings at ingest** (`docs/opencv-imgproc.md` S16.5, S16.8, S16.10 item 1). One vector per
      baked photo, stored with the photo row, for three uses: (a) duplicate and near-duplicate warning while
      uploading and a "possible duplicate" list for a gallery (on 2026-10-29 this was done once by hand with a dHash
      script over node 11 and 19 and found 3 pairs in 214 photos; a stored vector makes it routine and also finds
      crops and re-exports a dHash misses); (b) "related nodes" in the graph view (`docs/GRAPH.md`); (c) search by
      content or text. Candidates: CLIP ViT-B/32 (MIT; text tower for search), DINOv2-small (Apache-2.0; similarity
      only, better for duplicates).
      **Decided 2026-10-29** (measured, `docs/opencv-imgproc.md` S16.8b): DINOv2-small fp32 (Xenova/dinov2-small,
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

## M12 - Graph view (after the editor's save phase; design and numbers in `docs/GRAPH.md`)

- [x] **12.0 Decide** (2026-10-22): shared landscape, visibility owner/group/public,
      positions owner-defined, server-side cached tiles later. Still open: `docs/GRAPH.md`
      S5 (edge kinds confirmation, who may link where, collaboration).
- [~] **12.1 Rooted neighbourhood API** (built in a smaller form: `GET /api/graph` lists all visible nodes and their links, `graphOf` in `server/api/graph.js`; open: root / depth, windows, `rev`, ETag, the 10 000-user timing) `GET /api/graph?root=<id>&depth=<n>`: nodes
      with child counts (`+N` badges), edges, `rev`, ETag/304, brotli; ordered
      children windowed (`?offset=&limit=`); visibility filter in the traversal
      (recursive CTE, measured ~2 ms/13 KB at 1 M nodes). Visible = owner, or
      `public`, or `group` with the viewer in `group_members`; an edge is sent only
      when both ends are visible. Done when a generated
      10 000-user data set answers depth 2 in under 5 ms.
- [~] **12.2 Ops** (built: `link`, `unlink`, `move`, `pin`, `visibility` in `applyOp`, one transaction, `server/guard.js` checks who may write; open: `order`, `retitle`, edge-label limit, `rev`, group admins) `POST /api/graph/ops`: `link`, `unlink`, `move`, `pin`, `order`
      (shift siblings), `retitle`; edge labels limited to `child`, `sells`, `ref`; one
      transaction, bumps `rev`; permission check: owner or group admin.
- [ ] **12.2b Vendor** (not done: `vendor/` has no d3; the graph runs on its own layout, `client/graph/layout.js`) `d3-force`, `d3-zoom`, `d3-drag`, `d3-quadtree` (ISC) via
      `tools/vendor.sh`, versions in `vendor/VERSIONS`, relative imports only.
- [~] **12.3 `GraphView`** (built as `client/components/GraphPage.js` on `client/graph/layout.js`, own force layout; open: expand-on-demand, semantic zoom, the vendored d3 of 12.2b)  (Preact SVG + vendored `d3-force`/`d3-zoom`/`d3-drag`):
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
      reorder; open a node = the single editor (`docs/EDITOR.md` E34).
- [ ] **12.5 Live updates**: Bun WebSocket pub/sub of ops, `rev` gap -> refetch.
- [ ] **12.6 Overall-root** (shared landscape): seed the `overall-root` node with
      children `user-profiles` and `featured`; on sign-up create the user's root, a
      profile node (direct child of the root) and append a `ref` edge to
      `user-profiles` (`sort` = append). `featured` is curated by the
      **curators** group (owner of `overall-root` and members with role `curator`); entries are `ref` edges to articles, galleries, marketplaces.
      Both lists are windowed (paged by `offset`/`limit`), never sent whole. Done
      when the view starts at `overall-root` and a user can walk to any public
      profile in three taps.
- [~] **12.6a Seed** (2026-10-29, `docs/GRAPH.md` S1.4): `tools/seed.js` makes `overall-root`, `art exhibition`, `fleamarket` and `places` with sample children; idempotent (found by title under the parent). `user-profiles` and `featured` stay with 12.6.
- [ ] **12.6c Places** (`docs/GRAPH.md` S1.5): `at` edges owner-only until published (migration 5, per-edge `visibility`, with accounts; migrations 2-4 hold `place_suggestions`, `place_names`, the rename); editor side is docs/EDITOR.md E136-E140.
- [ ] **12.6d Venues from KGS** (`docs/GRAPH.md` S1.6): suggest the cultural objects near a place (KGS
      `identify`, with a tolerance in pixels, not metres) as candidates for `art exhibition`
      galleries; check the licence ("proprietary" in STAC) and whether `kgs_kategorie` can pick out
      museums, archives and libraries. Done when a place node can list its nearby venues.
- [ ] **12.6e Heritage and names** (`docs/GRAPH.md` S1.6): find the working layer name of ISOS (the STAC id
      returns nothing from `identify`); try `SearchServer` with `origins=gazetteer` for named venues;
      evaluate the opendata.swiss museum sets, the MySwitzerland API (check it still exists) and
      swisscollections. Done when each is marked usable or dropped in `docs/GRAPH.md` S1.6.
- [x] **12.6f Places housekeeping** (2026-10-29, `docs/GRAPH.md` S1.5 point 6): (a) migration 4 renames the
      places of the old gazetteer to `Name (KT)` and merges duplicates; (b) cell-titled places snap to a
      cell that touches them (`titled()` in `server/api/places.js`); (c) decided: nodes saved before
      migration 2 get no suggestions, the position is gone; (d) decided: the chip's *Not now* stays per
      browser, the panel is the durable list; (e) answered suggestions are purged when the panel opens.
      Tests: `tests/place-housekeeping.test.js`.
- [x] **12.6b Node lock** (built: `server/api/locks.js`, `server/db/nodes.js`, `client/editor/io/lock.js`, `tests/locks.test.js`; **open: `canBreak` in `locks.js` still returns true for everybody** ("the PoC has no owners"), now that accounts exist only the owner should break a lock): `node_locks` table, `POST /api/nodes/:id/lock` (take/renew),
      `DELETE` (release), expiry after ~60 s without heartbeat, owner may break;
      the editor (`docs/EDITOR.md` E67) takes the lock on open, shows "locked by <name>" read-only when
      refused. Ops and saves are rejected without the lock.
- [ ] **12.7 Groups** (with accounts): create group, invite/accept/leave, promote to
      `admin`, set a node's visibility to `group` (one `group_id`); ops are allowed
      for the owner and the admins of the node's group only; the cache key includes the viewer's
      memberships.
- [ ] **12.8 Server-side tiles** (later): rasterise a node on the server, cache by
      `rev`, serve as the `tile`; until then the palette colour is the fallback.

## M13 - Canvas nodes: 3D gallery, version 1 (`docs/GALLERY.md` S0b, S10; after the editor's phase F and M12; editor parts: `docs/EDITOR.md` E75-E78)

Minimal on purpose; everything not listed is deferred (`docs/GALLERY.md` S0b).

- [~] **13.1 Document**: `scene3d` step (plan, style, start), validation, sanitiser; done 2026-10-29: `client/gallery/fromdoc.js` `planFromDoc` turns a gallery node's drawn `wall` shapes into the scene (stage units -> metres, y flipped, transforms applied, corridors cut back to the room walls, doorways cut in the walls, rooms counter-clockwise), used by `startGallery` for `kind: gallery` nodes before the auto plan (`tests/gallery-fromdoc.test.js`, fixture node 9); open: `scale`/`start` editing; photo
      role toggle (`docs/EDITOR.md` E71, E76, E77); texture photos are never hung.
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
      (`docs/GALLERY.md` S3.6). The host uses it for every gallery until `scene` (13.1) exists.
- [x] **13.9 Gallery of all nodes** (the "Show" tab; first built at `/:lang/gallery` as a link grid of every node with a tile plus a 3D gallery of them all, replaced 2026-11-05 by `/:lang/view`, the galleries as cards, `docs/GALLERY.md` S5b; `items.js` `nodeItems` is no longer used by the page).
- [x] **13.10 Stale tiles**: a node saved before server-side tiles (or as a plain photo collage) showed one
      photo in the graph and the gallery. `needsRender` (`server/media/raster.js`) now also covers photo-only collages
      (several photos on page 0, or one faded, blended or clipped); `bun tools/retile.js [--dry] [--force] [ids]`
      (`server/node/retile.js`) re-renders the stale ones, the node itself untouched. **Do not run it**: tiles are now rendered in the browser on save (WYSIWYG).
- [x] **13.11 Guided walk** (`stations.js`, `route.js` A* over the floor, `tour.js`, `controls.js` modes, `session.js`,
      HUD in `GalleryView.js`): the gallery starts guided at picture 1; arrows / Space / swipe / buttons go to the next or
      previous picture (a sideways glide along a wall, a routed walk across corners, doors and corridors), wheel / pinch /
      Up-Down zoom (field of view, 70 to 10 degrees), a tap on a picture goes to it and the next tap zooms to fill the stage,
      Open is a button, W A S D or Q E hand over to free walking, G or the button back. Zoomed in, the picture is swapped for
      a sharper one (`GET /api/nodes/:id/large`: the baked photo, or a 1600 px render cached as `<tile>.large.jpg`; 4 stay
      loaded). No automatic slide show (decided). Sky: shader stars with twinkle, colour temperatures and a Milky Way band.
- [ ] **13.12 Moving works, design** (decided 2026-10-29): a hung work may be an overhead projector with a slide show or a
      machine (Tinguely / Luginbuehl style) as a vector animation, besides the still canvas. Recorded in `docs/GALLERY.md` S5.2
      (kinds, prop, canvas renderer, budget, safety, guided walk), S9 and S10 (Q7-Q9), and in `docs/EDITOR.md` S2.3c (motors),
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
- [x] **13.7 Plan layer in the 2D editor** (`docs/EDITOR.md` E75; built: `client/editor/core/walls.js`, the acute-corner refusal in `model.js`, `shape.wall`): wall layer with height; rooms =
      closed, corridors = lines; refuse corners sharper than 90 degrees.

## Docs and housekeeping (do alongside, not blocking)

- [ ] **H1 Design source of truth** (P S4): extract tokens, asset inventory,
      component catalogue, paper-texture recipe, dead styles from `attic/`,
      `static/` and the screenshots (0.2) into `docs/DESIGN.md`, **as the `--wb-*`
      token list** plus the `kraft` theme values. Do it before M8 so tokens
      from 2.3 stay consistent.
- [ ] **H1b Theme authoring note** in `docs/DESIGN.md`: how to write a theme file,
      what a node may override, the sanitiser's whitelist.
- [ ] **H2 Update `attic/HISTORIC.md`** paths to the `attic/` prefix.
- [ ] **H3 `docs/DESIGN.md` S4.x vs PoC**: mark which parts the PoC replaces (done
      for S4.1; do S4.2.1 `tiles` -> `nodes` (decided: node, not tile), S4.3 image pipeline; S4.5 editor now points to `docs/EDITOR.md`).
- [ ] **H4 Tests**: `bun test` for router/ingest/palette/i18n parity; hostile
      inputs (traversal, extension mismatch, oversize, zero byte, tool missing)
      (P S13).
- [x] **H5 Resolve open questions** (P S15): all decided: SHA-256, upload formats
      (jpg/jpeg/png/heif/heic, HEIC extracted), baked JPEG without raising source quality (q99 only for non-JPEG sources; alpha: WebP/PNG), alpha on
      cutout, server-side clip, videos out, node naming, no handwriting.
- [ ] **H7 Keep the companion docs in step**: `docs/GRAPH.md`, `docs/GALLERY.md`, `docs/PLAN.md`,
      `docs/DESIGN.md` 4a/4.2.1/4.4/4.5 and this file must agree (decisions of 2026-10-22).
- [ ] **H6 Commit hygiene**: commit `docs/DESIGN.md`, `docs/PLAN.md`, `TODO.md`,
      `CLAUDE.md` and the `attic/` move as separate commits.
