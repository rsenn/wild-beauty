# Batch editor (graph view), decided 2026-11-05

Select one or several nodes in the graph (`/tree`), press **Batch edit**: a panel opens over the graph with two views of the same nodes. It is the place to survey, order and thin out the photos of many nodes at once, without opening each one in the node editor (`docs/EDITOR.md`).

## 1. Entry and scope

- A chip "Batch edit" in the graph bar, enabled when one or more nodes are selected (a single selected node, or the multiple selection) and a user is logged in. Not on a personal site's read-only graph.
- Close returns to the graph with the selection kept. Unsaved changes ask before closing.
- Nodes the user may not edit (`mine` false) are listed and shown but locked: no drag in or out, no disable.
- The nodes are loaded one by one with `GET /api/nodes/:id` (document and `rev`). Nodes of kind `list` (groups) without photos are listed in the table but have no tiles.

## 2. Node order

The order of the nodes is the table order, and the tile list follows it. Default is ascending by id. A column header sorts the table by that column (click again: descending); the tile list follows the sort. Reason: one rule for both views, no second ordering to learn.

### 2a. Manual order (decided 2026-11-05)

Each table row has up and down buttons. Using one switches the sort to `manual`: the order of the rows is then the order the user made (starting from the order the table had), and the photo view follows it. A header click goes back to a column sort.

Saving the order: when the selected nodes are all `child` members of **one** parent (a gallery, list or album) that the user may change, **Save** also sends the graph op `order` `{ parent, ids }` (`docs/GRAPH.md` S1.2), so the order the batch editor shows becomes the order of that parent's members. With several different parents, or none, the order is only the editor's view and is not saved (a note says so). The order of nodes in a loop is not encoded in the nodes' own edges (S1.2).

### 2b. Round trip through the node editor (decided 2026-11-05)

The batch editor is addressable: `/:lang/tree?batch=1,2,3&bview=photos` opens the graph with the batch editor on those nodes and in that view (the address follows the editor with `history.replaceState`, so a reload keeps it). The pencil button opens the node editor **in the same tab**: `/:lang/node/:id?edit=1&back=<the tree address above>`; **Close** in the node editor then returns to that address (the batch editor, same nodes and view) instead of the node view. `back` is only honoured when it is a `/:lang/tree` address of this site. Unsaved batch changes would be lost by leaving the page, so the pencil asks first (discard or stay); the eye button still opens the viewer in a new tab.

## 3. Table view

One row per node. Columns: ID, title, type (`kind`), mode (free, slides, grid), photos (how many picture photos), pages, visibility, mine. Right of each row the up and down buttons (S2a) and two icon buttons:

- open in the node editor: an icon of a canvas with a pencil, same tab, see S2b (the node page opens the editor on `?edit=1`);
- open in the viewer: an eye icon, `/:lang/node/:id`.

## 4. Photo view

A very light tile list: thumbnails only (`/files/photos/<hash>.thumb.jpg`, lazy loaded), square tiles of one size in a wrapping grid, no node rendering, no editor code. "Masonry" here means the tight tile flow; the tiles are square because that is what thumbnails are.

- **Order**: node order (section 2), then the photo order inside the node: the photo steps in page order, step order (the same order slides, grid and the gallery use). Texture photos are not listed (they are not pictures, `photoSteps`). One tile per photo step.
- **Node boundaries are visible**: each node starts with a full-width header bar (id, title, count) in the tile flow, so the list reads as groups.
- **Select**: click or tap toggles a tile, Shift+click selects the range, Escape clears.
- **Reorder**: drag a tile (or, when the grabbed tile is selected, all selected tiles, keeping their order) and drop before another tile; a bar between tiles shows the place. Pointer events, so it works on touch. Dropping on a header puts the photos first in that node, dropping after the last tile puts them last in the last node.
- **Across the boundary**: a drop inside another node's range moves the photos to that node (an adjacent one or any other in the list), at that place. Rules: the destination must be editable and have room (`photoLimit(mode)`, counting distinct photos), else the drop is refused with a message and nothing moves. A photo with a `clip` (its cutout shape) stays in its node (it may be reordered inside it). Steps that point at the moved photo (`transform`, `blend`, `unclip`) travel with it, on the destination page the photo lands on. In a `free` node the photo keeps its matrix `m`; slides and grid ignore it.
- **Thumbnails** are `<hash>.small.jpg` (about 640 px, made on first request, `server/api/photos.js`), not `.thumb.jpg`: that one exists only for the tile of a node, not for every photo.
- **Buttons on each tile** (asked 2026-11-05): two small round buttons in the tile's top right corner, shown on hover or focus, on a selected tile, and always on touch screens. **Rotate** turns the photo a quarter turn clockwise about its own centre (`rotatePhotos`, the same matrix change as the node editor's turn buttons; on a selected tile it turns the whole selection); the tile's picture turns with it. **Annotate** opens a popover under the tile with a multi-line text area (up to 500 characters, so the line breaks stay) holding the photo's description (`desc`, S6a): OK saves it, Clear removes it, Cancel or Escape or a click outside closes it. Both are steps of the batch history and are missing on photos of nodes the user may not change.
- **Disable / enable**: a button toggles the selected photos. A disabled photo is dimmed with a slash on its tile. It stays in the node (and its baked file stays), but viewers skip it. Reason: unpublishing one picture without deleting it.

## 5. Disabled photos: data

An optional boolean `off` on a `photo` step (`client/editor/core/model.js` STEPS). `off: true` means: the viewer does not show it. `visibleDoc(doc)` (model.js) returns the document without the photos that are off and the steps that point at them (the same object when none is off); `NodeView`, the gallery items (`client/gallery/items.js`) and the server's `galleryChild` (`server/node/view.js`) use it, and `firstPhotoStep` (`server/media/thumb.js`) skips them, so a node's tile is never a disabled photo. The node editor is not changed: it keeps the flag when it edits the step and still shows and counts the photo (so slide numbers there match the stored order). Decided 2026-11-06: the server leaves the disabled photos out for everyone who may not write the node: `GET /api/nodes/:id`, the node page and its boot data send `visibleDoc(doc)` and `photoInfos` of that, so a disabled photo is not in the response at all, and the photo counter of the viewers ("x / N", carousel, masonry, 3D) counts only the shown photos and has no gaps (it always did, as the viewers drop `off` steps first; now the data is not there to be dropped). The owner (and an admin) gets the full document, the editors keep showing and counting every photo. Still not access control for the file itself: whoever knows a photo's hash can fetch the baked file.

## 6. Saving

Changes stay in the browser until **Save**; **Revert** drops them; Undo and Redo step through them. Save writes the changed nodes one by one with `PUT /api/nodes/:id` and their `rev`. A move between two nodes writes the destination first, then the source, so a failure in between leaves a photo twice, never lost. A 409 (changed elsewhere) marks that node, keeps the others saved and offers a reload of it. After the save the graph reloads (`tile` and titles may have changed).

## 6a. Descriptions (decided 2026-11-05)

Each photo can carry a short description, written by hand or generated from where and when it was taken.

- **Data**: an optional string `desc` (at most `LIMITS.desc`, 5000 plain-text characters with paragraphs, since 2026-11-06, `docs/GALLERY.md` S5c) on a `photo` step (`model.js` STEPS), so it belongs to the use of the photo in that node and travels with the step when it moves. The gallery shows it as the picture's caption (`client/gallery/items.js`: `title`). The node editor keeps it and does not show it yet.
- **UI** (photo view, shown while tiles are selected): a text field with the description of the selection (empty and with a "differs" placeholder when the selected photos disagree), **Apply** writes it to all selected photos, **Generate** fills the selected photos from place and date (below), **Remove** clears it. Every change is one step of the batch history (Undo). A tile with a description shows a mark and the text as its tooltip.
- **Generate**: `POST /api/photos/describe` with `{ hashes }` answers `{ [hash]: { place, taken } }` for the photos the user may see through a node of their own (a photo of others is left out). The server works from the exact position (`photos.meta.where`) and the capture time (`photos.meta.taken`); the position itself is never returned. The client writes `Place, 15 April 2026` (the date in the page language with `Intl.DateTimeFormat`); with only one of the two it writes that one; with neither, the photo is left as it is and counted in a message.
- **Place name** (decided: offline, nothing leaves the server): in Switzerland the cached municipality (`titleFor`, canton included), else the nearest city of the GeoNames `cities1000` list within 25 km (`server/api/geoname.js`, loaded on first use from `data/gazetteer/cities1000.tsv`, made by `tools/gazetteer.js` from `download.geonames.org`, public data, no photo information sent). Outside the list: no place.
- **Date**: `meta.taken` = the EXIF capture time as local text `YYYY-MM-DDTHH:MM:SS` (no zone: a camera's EXIF has none), written whenever the position is (upload bake, `tools/ingest.js`). Existing photos are backfilled from their originals with `tools/ingest.js --positions-only FILES` (the app's hash of a photo is the sha256 of the original file), which now records the time too. A photo without a time gets no date.

## 6a2. Placeholder notes (decided by the owner 2026-11-06)

Use case: a picture should be in the photo book (`docs/ALBUM.md`, "only pictures with a note") although the owner has not written its note yet, or wants to write it later. The way in is the note itself: a **placeholder note** is a note made of the generated place, date and time, so no new data and no flag exist.

- **`{time}`**: a third placeholder for the patterns (`docs/PROFILE.md` S3) and for the buttons below: the capture time of the photo as `14:32` (24 hours, the camera's local time as recorded, `meta.taken`). Empty when the photo has no time. The default patterns stay as they are.
- **Generate leaves photos that already have a note alone** (it used to overwrite): only photos without a note are filled; the message says how many had a note and were kept.
- **Buttons in the annotation editors**: both the carousel's note field (`docs/GALLERY.md` S5c) and the batch editor's annotation popover get three small buttons, **Place**, **Date**, **Time**. The **caption of each button is the value itself** (the municipality, the real date, the time of day; the word Place, Date or Time only while it loads or when the photo has none), so the buttons are a clue for writing the note even when none is pressed (owner, 2026-11-06). Pressing one inserts that value of the photo at the cursor (the answer of `POST /api/photos/describe` for that photo, fetched when the editor opens; a button is disabled while it loads and when the photo has no such value). Two clicks make "Plettenberg Bay, 15 April 2026".
- **Findable**: a note is a placeholder when nothing is left of it after the photo's own place, date and time (and their separators) are taken out (`isPlaceholder` in `pattern.js`, pure). In the photo view of the batch editor, a tile with a placeholder note is marked differently from a tile with a written note, and a button **Find placeholder notes** selects them all (it asks the server for the photos' place and time first, as Generate does) and says how many it found; then ✎ opens each. A note the owner has edited by even one word is no longer a placeholder. Not in the carousel.

## 6b. Patterns from the profile (decided 2026-11-05)

The user's profile (`docs/PROFILE.md`) holds an artist pseudonym and two patterns. **Generate** (S6a) writes the description of a photo with the **description pattern** (default `{location}, {date}`), so the pseudonym can be part of it. In the table view a button **Titles from pattern** sets the title of the selected rows (all rows when none is selected) with the **title pattern** (default `{date} [{location}] {pseudonym}`): the date is the range of the node's photos, the place the commonest place among them, both from `POST /api/photos/describe` (which now takes up to 2000 hashes). A title change is a step of the batch history and is saved with the node (`doc.title`). Nodes whose photos have neither date nor place get only the pseudonym part; a node that would get an empty title keeps its own.

## 7. Code

- `client/editor/core/batch.js`: pure functions on documents: `photoRefs(doc)`, `placePhotos(docs, ids, to)`, `setOff(doc, stepIds, off)`, `setDesc(doc, stepIds, text)`; tested in `tests/editor/batch.test.js`.
- `server/api/graph.js`: the ops `order` and the `child` cycle check, `tests/graph.test.js` and `tests/graph-order.test.js`.
- `client/components/BatchEditor.js`: panel, table, photo view, save.
- Strings under `batch.*` in all four locales.

## 8. Open

- Dim disabled photos in the node editor.
- Drag onto a node that is not in the selection (add it to the batch on the fly).
- Photo-level properties beyond order and `off` (role, crop) are not part of this.

## 9. How features get in: use cases first (decided 2026-11-05)

The batch editor is built from use cases, not from what the node editor happens to offer. A feature is added only when **all** of these hold:

1. **A real need**: a named use case (S10) or something the owner actually hit, not "it would be possible".
2. **Easy**: the average user finds it without reading anything (one visible control, no mode, no hidden key as the only way).
3. **Obvious**: what it does to which photos or nodes is clear before it is done, and Undo takes it back.
4. **Convenient**: it saves clearly more effort than opening the node editor for each node.
5. **Light**: it needs no node rendering (S4 stays thumbnails only) and is a pure function in `client/editor/core/batch.js` with a test.

Each candidate below is decided on its own, with the owner, when its use case shows up. Nothing here is agreed yet, "candidate" means "may be worth a look".

### 9a. Shared with the node editor (decided: yes, the principle)

Pieces that exist in both editors are one component with plain props (no `dispatch`, no `host`, no `fetch` inside; the caller decides what a change does):

- **AnnotatePopover** `{ anchor, value, max, onSave, onClear, onClose }`: today inside `BatchEditor.js`; the node editor shows `desc` with it too (command `setDesc`, one undo step; button in the context bar when a photo is selected).
- **PropertiesPanel** `{ values, onChange, fields }`: from `Properties.js`; the node editor passes kind, visibility, bg; the batch editor passes only the fields that make sense for several nodes.
- **Node store** (load, save with `rev`, 409): the batch editor stops keeping its own copy once the NodeEditor split has `useNodeStore` (`TODO.md`).
- **Third consumer, proposed 2026-11-05 (owner's idea, not decided): the node view.** The owner of a node sees a small pencil on the photo shown in `/:lang/node/:id` (carousel, album, 3D) and opens the same `AnnotatePopover` right there; in a landscape window the annotation (`desc`) reads to the left and right of the exhibit for everyone, in portrait under it. The node properties (title, visibility, presentation) open in the same place as the `PropertiesPanel`. Constraints to settle first: the edit code is loaded only for the owner (visitors get the page as today); a caption-only change must not run the editor's heavy save (thumb and large render, see "Save of a big node" in `TODO.md`), so it needs a light save path with `rev` and the node lock; anything beyond caption, title, visibility, presentation and disabling a photo stays in the full editor behind the existing Edit button.

### 9b. Candidates, undecided

Table (nodes): properties for the selected rows (kind, visibility; bg only per node); mode switch free / slides / grid for several nodes (lossless, `m` is ignored there); place chip for a node; inline title edit (one history step); parent column and "move into gallery" (needs the `child` cycle check, so more than UI); bg colour for several nodes (minor).

Tiles (photos): role picture / texture for the selection (E154b in `TODO.md` wants this somewhere; the tile view may be the better home than the gallery pane); flip next to rotate (same matrix change, not for text boxes); fit (contain / cover) for the selection; delete the selected photos from their node (needs a confirm and Undo; a "trash" node may be safer); copy instead of move (modifier on drop, `photoLimit(mode)` applies); place of a single photo (needs a server route, `meta.where` stays private); copy and paste of steps between nodes.

Out on purpose (needs the renderer, against S4): opacity, blend, edge style, clip shapes, wand, lasso, crop.

## 10. Use cases (draft, to be confirmed or replaced by the owner)

Drawn from the real work so far (the Garden Route import, thinning out private photos, captions). Each one says what the user wants to get done; the requirement for the batch editor follows from it, never the other way round. Wording and priority are the owner's to correct.

- **U1 Tidy a fresh import**: after `tools/ingest.js` made many nodes, look at all photos in time order, drop the bad ones, move strays into the node they belong to. Needs: S4 as built (select, reorder, move, disable). Open: delete instead of disable? (candidate delete)
- **U2 Hide a few pictures from visitors without losing them**: S5, `off`. Built.
- **U3 Caption a series**: all photos of a day get "Place, date", a few get a hand-written line. Needs: S6a as built; the node editor must show the caption too (S9a).
- **U4 Name many nodes alike**: titles from date and place. Built (S6b). Open: fix a single title without leaving the table (candidate inline title).
- **U5 Publish or hide a set of nodes together**: one visibility change for the selected rows. Needs: candidate "properties for several rows".
- **U6 Turn a pile of nodes into slides or a grid**: candidate "mode for several rows".
- **U7 Pick the textures of a gallery**: candidate "role" on tiles.
- **U8 Fix the orientation of a batch of phone photos**: rotate is built; flip is the only missing half (candidate).

For each new use case: say who does it, how often, what they do today instead, and what the shortest path in the editor would be, then decide which candidate (if any) it earns.
- **U9 Document a trip while walking through it** (asked 2026-11-05, owner): in the carousel of a trip node (`docs/GALLERY.md` S5c) write a note for each picture where it stands, beside the picture, one picture after the other, fast; the note is what visitors read next to the picture. Needs: the in-place editing of S5c (and the shared `AnnotatePopover`); the batch editor stays the place for many at once (Generate, a note for a selection). Open: see the questions in S5c.
