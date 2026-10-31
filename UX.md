# UX: button graphics needed

One line per graphic. "have" = a file already in `static/img/` that can be reused or
restyled. All are single-colour SVGs that take their colour from the theme
(`--wb-ink`, `--wb-accent-ink`), drawn on a 24-unit grid with at least a 44 px hit area;
a theme names each one through an `--wb-icon-*` token (`PLAN.md` S16.3).
Sources: `EDITOR.md` S2.2-S2.9, `GRAPH.md`, `GALLERY.md`.

## Upload list (cards)

| Graphic | Description |
|---|---|
| upload (have: `action-upload.svg`) | An arrow rising out of a tray, shown in the drop zone. |
| remove (have: `action-delete.svg`) | A red cross that deletes an upload from the list and the server. |
| rotate (have: `icon-rotate.svg`) | A circular arrow that turns a photo by 90 degrees. |
| add to node | A plus over a small frame, on a card, that puts the photo onto the open stage. |
| retry | A circular arrow with a gap that resends a failed upload. |
| error (have: `icon-error.svg`) | A warning mark shown on a card whose upload failed. |
| no preview (have: `no-image.svg`) | A crossed-out picture for a file the browser cannot show. |
| fit extend / crop | A whole photo inside a square versus a photo cropped to fill it, toggling the card's fit. |
| texture toggle | A small tile pattern that marks a photo as a 3D wall texture instead of a picture. |
| cutout | A scissors-and-dotted-outline mark that starts background removal (only when the tool exists). |
| select (checked) | A tick in a corner of a card to show it is selected. |

## Editor: tool column

| Graphic | Description |
|---|---|
| select / transform | An arrow cursor, the default tool for moving and scaling steps. |
| ink pen | A nib or pen tip that draws freehand strokes. |
| shape | A small closed outline with vertex dots, for placing vertices and bezier handles. |
| clip | A photo with a circular mask over it, for clipping a photo to a shape. |
| unclip | The same masked photo with a slash through the mask, to remove the clip. |
| text | A capital T inside a box, for placing a text box. |
| wall (3D gallery) | A brick-wall segment from above, for marking a shape as a gallery wall. |

## Editor: action column and page strip

| Graphic | Description |
|---|---|
| undo (have: `action-undo.svg`) | A curved arrow pointing back. |
| redo | The undo arrow mirrored. |
| add page (have: `action-page-new.svg`) | A sheet with a plus. |
| remove page | A sheet with a minus or a cross. |
| delete node (have: `action-delete.svg`) | A bin, kept apart from the per-step delete so the two are not confused. |
| save (have: `action-save.svg`) | A floppy disk. |
| save and close (have: `action-save-close.svg`) | A floppy disk with a small door arrow. |
| save as new (have: `action-save-new.svg`) | A floppy disk with a plus. |
| close editor | A cross in the title row that leaves the editor. |
| new node (have: `action-new.svg`) | A plus on a sheet, used by the "New node" tile. |
| theme | A palette or half-filled circle that opens the theme picker. |
| properties | A sliders or gear mark that opens the node properties popover. |
| drag handle | Six dots for reordering pages and film-strip entries. |

## Editor: context bar (selection)

| Graphic | Description |
|---|---|
| fit mode | A frame with inward and outward arrows that cycles extend, cover and free. |
| opacity | A half-transparent drop or checkerboard for the opacity slider. |
| blend mode | Two overlapping circles that open the blend list. |
| to front | A square stacked above another with an up arrow. |
| to back | A square stacked below another with a down arrow. |
| delete step (have: `action-delete.svg`) | A bin for the selected photo, stroke, shape or text box. |
| stroke width | A thick-to-thin line for the pen size slider. |
| fill on/off | A filled versus an empty shape, toggling a shape's fill. |
| stroke on/off | A shape outline, toggling its stroke. |
| open / closed path | A path with a gap versus a closed loop. |
| break symmetry | A bezier handle with two unequal arms. |
| join symmetry | A bezier handle with two equal arms. |
| align left / centre / right | Three lines of text with the usual alignment, for text boxes. |
| font face | A serif A next to a sans A, to choose fixed, serif or sans. |
| text background | A text line on a filled box. |
| corner radius | A square with one rounded corner. |
| padding | A square inside a square with arrows between them. |
| picture / texture role | A framed picture versus a tile pattern, for the photo's role. |

## Editor: colour palette

| Graphic | Description |
|---|---|
| swatch | A square colour chip with a selected ring, eight to a palette. |
| more colours | A plus on a colour wheel that opens the full picker. |
| gradient stop | A small marker on a bar for adding and moving gradient stops. |
| eyedropper | A pipette that picks a colour from the stage. |

## Editor: scrubber and modes

| Graphic | Description |
|---|---|
| play | A right-pointing triangle that plays the page's steps. |
| pause | Two vertical bars. |
| step back / forward (have: `arrow-previous.svg`, `arrow-next.svg`) | Chevrons that move the scrubber one step. |
| mode free | Scattered frames, for the author's own layout. |
| mode slides | A single frame with a next arrow, for one photo per page. |
| mode grid | A 2 by 2 grid of squares, for auto-tiled photos. |

## Dialogs and status

| Graphic | Description |
|---|---|
| confirm (have: `icon-ok.svg`, `icon-apply.svg`) | A tick for accepting a dialog. |
| cancel (have: `icon-cancel.svg`) | A cross for dismissing a dialog. |
| locked | A padlock that shows a node is locked by someone else. |
| break lock | A broken padlock for the owner overriding a lock. |
| conflict | Two arrows colliding, for "changed elsewhere". |
| draft saved | A small page with a tick or dot, for a restored or autosaved draft. |
| warning (have: `icon-exclamation.svg`) | An exclamation mark for the non-fatal notices. |

## Editor tools (additions 2026-10-31)

| Graphic | Description |
|---|---|
| eyedropper (have: `tool-dropper.svg`) | A pipette at 45 degrees, bulb up right, tip down left, a drop under the tip. Shown on the dropper button of every colour selector; a mask, so it takes the text colour. |
| select several | No icon yet (a text button "Select several"); a dotted rectangle with two squares in it would do. |
| align / spread | No icons yet (text entries in the Align popover); six bars (left, centre, right, top, middle, bottom) and two spread marks would do. |

## Site chrome

| Graphic | Description |
|---|---|
| language (have: `flag-de.svg`, `flag-fr.svg`, `flag-gb.svg`) | Flags for the language picker. |
| theme switcher | The theme mark in the nav, next to language. |
| login (have: `login.svg`) | A person or key mark, for accounts later. The Login tab itself is text; its dialog is `LoginDialog.js`. |
| logo (have: `logo-transparent.png`) | The site mark in the header. |

## Graph view

| Graphic | Description |
|---|---|
| zoom in / out | A magnifier with a plus or a minus. |
| fit view | Four corner brackets that frame all nodes. |
| recentre on root | A crosshair or target on the root node. |
| pin node | A drawing pin that fixes a node in place. |
| unpin node | The same pin with a slash. |
| link | Two chain links, for dragging a child or reference edge. |
| unlink | A broken chain link. |
| edge kind: child / ref / sells | Three small arrow styles: solid, dashed and one with a coin or tag. |
| focus on node | A bullseye that makes a node the new root of the view. |
| branch view | A tree glyph that switches to the branch layout. |
| graph view | A node-and-edge glyph that switches back to the force graph. |
| film-strip / carousel | A row of frames, one larger, for the run presentation. |
| masonry | Uneven stacked tiles for the masonry run presentation. |
| list | Three bullet lines for the list view of children. |
| add node here | A plus on a node, creating a linked node from the graph. |

## Groups and visibility

| Graphic | Description |
|---|---|
| visibility hidden | A closed eye for owner-only nodes. |
| visibility group | Two or three heads for group-visible nodes. |
| visibility public | A globe for public nodes. |
| invite | A head with a plus, for inviting someone to a group. |
| leave group | A door with an arrow out. |

## 3D gallery

| Graphic | Description |
|---|---|
| enter gallery | A door or archway that starts the walkable view. |
| leave gallery | A cross or an exit arrow, always visible while walking. |
| fullscreen | Four outward corner arrows. |
| exit fullscreen | Four inward corner arrows. |
| move stick | A ring with a centre dot, the on-screen thumb stick for phones. |
| look | Two arrows around an eye, shown on the look area on phones. |
| walk in VR | A headset glyph, a later add-on. |
| hang photo | A picture on a nail, for placing a photo on a wall. |
| room / wall edit | A floor plan corner, for the wall layer in the editor. |

## Notes

- The existing `action-*` files are a different drawing style (they come from the old
  UI); each new graphic should be drawn as one set so the theme can swap the whole set.
- Every button also needs a text label (`aria-label` and tooltip from `t()`), so no
  graphic carries meaning by itself.
