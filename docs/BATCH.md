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

An optional boolean `off` on a `photo` step (`client/editor/core/model.js` STEPS). `off: true` means: the viewer does not show it. `visibleDoc(doc)` (model.js) returns the document without the photos that are off and the steps that point at them (the same object when none is off); `NodeView`, the gallery items (`client/gallery/items.js`) and the server's `galleryChild` (`server/node/view.js`) use it, and `firstPhotoStep` (`server/media/thumb.js`) skips them, so a node's tile is never a disabled photo. The node editor is not changed: it keeps the flag when it edits the step and still shows and counts the photo (so slide numbers there match the stored order). It is a presentation switch, not access control: the baked file is reachable by its hash as before.

## 6. Saving

Changes stay in the browser until **Save**; **Revert** drops them; Undo and Redo step through them. Save writes the changed nodes one by one with `PUT /api/nodes/:id` and their `rev`. A move between two nodes writes the destination first, then the source, so a failure in between leaves a photo twice, never lost. A 409 (changed elsewhere) marks that node, keeps the others saved and offers a reload of it. After the save the graph reloads (`tile` and titles may have changed).

## 6a. Descriptions (decided 2026-11-05)

Each photo can carry a short description, written by hand or generated from where and when it was taken.

- **Data**: an optional string `desc` (at most 500 characters) on a `photo` step (`model.js` STEPS), so it belongs to the use of the photo in that node and travels with the step when it moves. The gallery shows it as the picture's caption (`client/gallery/items.js`: `title`). The node editor keeps it and does not show it yet.
- **UI** (photo view, shown while tiles are selected): a text field with the description of the selection (empty and with a "differs" placeholder when the selected photos disagree), **Apply** writes it to all selected photos, **Generate** fills the selected photos from place and date (below), **Remove** clears it. Every change is one step of the batch history (Undo). A tile with a description shows a mark and the text as its tooltip.
- **Generate**: `POST /api/photos/describe` with `{ hashes }` answers `{ [hash]: { place, taken } }` for the photos the user may see through a node of their own (a photo of others is left out). The server works from the exact position (`photos.meta.where`) and the capture time (`photos.meta.taken`); the position itself is never returned. The client writes `Place, 15 April 2026` (the date in the page language with `Intl.DateTimeFormat`); with only one of the two it writes that one; with neither, the photo is left as it is and counted in a message.
- **Place name** (decided: offline, nothing leaves the server): in Switzerland the cached municipality (`titleFor`, canton included), else the nearest city of the GeoNames `cities1000` list within 25 km (`server/api/geoname.js`, loaded on first use from `data/gazetteer/cities1000.tsv`, made by `tools/gazetteer.js` from `download.geonames.org`, public data, no photo information sent). Outside the list: no place.
- **Date**: `meta.taken` = the EXIF capture time as local text `YYYY-MM-DDTHH:MM:SS` (no zone: a camera's EXIF has none), written whenever the position is (upload bake, `tools/ingest.js`). Existing photos are backfilled from their originals with `tools/ingest.js --positions-only FILES` (the app's hash of a photo is the sha256 of the original file), which now records the time too. A photo without a time gets no date.

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
