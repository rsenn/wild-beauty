# WAND.md: magic wand and background removal

Design of the two segmentation features of the node editor and of the server side that powers
them. It supersedes the E119 and E127 paragraphs of `EDITOR.md` where they differ (those stay as
the task list), and complements `opencv-imgproc.md` (the contract of the command-line tool) and
`qjs-opencv/doc/segment-tuning.md` (how the algorithm is measured and tuned).

Status words: **built** = in the tree and covered by tests; **built, untried in a browser** = code
and unit tests exist, nobody has driven it in the editor yet; **spec** = decided, not built.
Dated 2026-11-01 (select / apply redesign the same day).

The two parts are specified together on purpose. The UI is designed to use everything the backend
and its models can do (several candidate masks, groups of taps, a region, polygons with holes, a
filled-in rest picture) and the backend is shaped by what the UI needs to harness them (stateless
requests, a cheap selection first and one full-size apply at the end, outlines the editor can
draw at once). Part C says where the two meet.

---

## 0. Goals

1. **Select first, change the photo second.** Like the wand of Photoshop or GIMP: taps build a
   *selection*, shown as an outline over the photo; nothing in the document changes until the user
   chooses what to do with it. The selection answers in about a second, the full-size work runs
   once, at the end.
2. **Additive first, then take away.** A tap adds the thing under it; Exclude (or Alt-tap) takes a
   thing out of the selection (the water, the skin next to the subject). Smaller / Larger switch
   between the model's three outlines without a server round trip.
3. **Never a dead end.** When the model is wrong there is a way out that is not "undo and give
   up": add or exclude taps, step to a bigger or smaller outline, take the last tap back, clear, or
   guide the model with a rough manual clip first (A6).
4. **Three things to do with a selection** (A5). *Cut out*: the photo becomes the subject
   (soft-edged alpha). *Take out*: the subject becomes a photo of its own on top, the photo below
   keeps a hole, filled in or transparent. *Erase*: the subject is removed, the hole filled in or
   transparent.
5. **Fast enough to feel interactive.** Budgets in B8; nothing the user waits for may exceed 10 s.
6. **No path-handle mayhem.** The wand makes no clip at all. Background removal makes a loose,
   capped hull (A7).
7. **Honest about the model.** SAM-class models over-merge neighbours and miss thin structures
   (the lantern mast). The design assumes that and provides recovery instead of pretending it away.

Non-goals: matting of hair at studio quality (`--refine matting` exists, 20 s, not offered),
video, text prompts, automatic subject detection beyond the one-button background removal.

### Two workflows, two tools, not mixed

| Workflow | Tool | Good for |
|---|---|---|
| **Background removal, then split** | the *Remove background* button (A7), then the clip tool to separate several subjects into their own photos | one or a few clear subjects in front of a background; no taps |
| **Take things out** | the wand (A2 to A6) | one thing out of a busy photo, removing a thing, keeping only one thing |

A third selection tool, the **magnetic lasso** (edge-snapping freehand outline, OpenCV
`IntelligentScissors`: Canny and gradient cost, live-wire path between clicks), was built 2026-11-01 (see below). It
is a separate tool with its own icon, for thin or hard things SAM misses. Its outline
becomes the same kind of *selection* as the wand's, so Cut out / Take out / Erase and the fill
switch are shared. The two never mix within one gesture: the wand is taps and a model, the lasso
is a traced path. A lasso selection can be passed to the wand as its `region` (A6) and the other
way round, but that is an explicit step, not a mode.

**Built 2026-11-01.** Not OpenCV `IntelligentScissors` but the same idea in the browser, so no tool
install and no round trip while the pointer moves: `client/editor/lasso.js` (Sobel gradient of the
luma on a copy of the photo with the long side 640 px, scaled by its 98th percentile, turned into a
cost; a click snaps to the cheapest pixel within 6 px; the live wire is Dijkstra over 8 neighbours
inside the box of the two anchors grown by 24 px or half their distance; the outline is thinned by
Douglas-Peucker). Tool `lasso` (key L) in the wand's group; `NodeEditor.js` `wireDown`, `wireMove`,
`wireClose`, `wireUndo`. Clicks set anchors, the line follows the pointer; the first anchor (after
three) closes, as do Enter and the Close chip; Backspace takes an anchor back, Esc clears. Closing
makes `wand.current` a run with a `polygon` (fractions of the whole image) and `pick` 0, so Cut out,
Take out, Erase and the fill switch are the wand's own `wandApply`. Server: `POST /api/segment` with
`polygon` (up to 4 outlines, 2000 vertices, `cleanPolygon`) and an `action` runs `tools/polycut.py`
in place of the segment tool (Pillow, even-odd, drawn at 4x, feathered by 0.08% of the long edge,
answers with the same `result` line and `--mask-out` for the fill). Open: touch has no hover, so no
live segment before a tap; a hole needs a second outline (the server takes it, the editor does not
offer it yet); handing a lasso to the wand as `region` and back.

---

# Part A: the tool in the node editor

## A1. Where things live

| Piece | File | Role |
|---|---|---|
| tap geometry, selection drawing | `client/editor/wand.js` | stage point to image fraction (crop window aware: `imagePoint`, `regionOf`), NDJSON reader `readLines`, `selectionPath` (candidate outlines to an even-odd SVG path on the stage), `defaultPick` |
| wand run, overlay, chips | `client/components/NodeEditor.js` (`wandDown`, `wandSelect`, `wandApply`, `wandUndoTap`, `wandReset`, `wandStep`, component `WandSelection`) | state, requests, applying an action |
| background removal | same file (`removeBackground`, `clipToSubjects`) + `client/editor/clipping.js` `outlinesToStage` | E127 |
| undo grouping | `client/editor/commands.js` | commands flagged `wand` share the key `wand:<group>`: the steps of one action are one undo step |
| job rule | `client/editor/job.js` `blocked` | E128: while a *background removal* runs on a photo, deleting, cutting, clipping etc. of that photo is refused. The wand sets no job; Cancel, Esc, leaving the tool or a new tap stop it |
| look | `static/css/layout.css` `.wb-wand-*`, theme tokens `--wb-wand-light`, `--wb-wand-dark`, `--wb-select`, `--wb-danger` | tinted area, white edge under black running dashes, + / − tap markers |
| strings | `locales/{en,de,fr,es}.json` keys `editor.wand.*`, `editor.busy.{cut,take,erase}`, `editor.announce.{wandNothing,cutOut,takenOut,takenOutHole,erased,erasedHole,takeOutFailed,wandFailed}`, `editor.context.wand` | all four languages, `tools/check-locales.js` |

Photo coordinates. A photo step is drawn as a 1000 x 1000 square window into its image
(`cropWindow`: the short side, moved along the long side by `crop`). The server works on the
whole image. Every conversion therefore goes through the crop window: `imagePoint` (stage tap to
fraction of the whole image), `regionOf` (stage polygons to fractions), `stagePolygon(…, crop)`
(pixels of the whole image to stage). Taps outside the visible window are ignored.
*(Fixed 2026-11-01: the first version mapped through the square as if it were the image, which
was only right for square photos.)*

## A2. Controls (context bar of the wand tool)

| Control | Shown | Meaning |
|---|---|---|
| **Add area** | always; pressed by default (`wandMode = 'add'`) | a tap adds the thing under it (label 1) |
| **Exclude area** | always (`wandMode = 'sub'`), or Alt held on a tap | a tap takes the thing under it out (label 0). Until a tap added something every tap adds, whatever the mode; Clear and every action set the mode back to Add (2026-11-01: a stale Exclude from the photo before swallowed the first two taps on the next one) |
| **Smaller / Larger** | with a selection | switch between the non-empty candidate outlines, ordered by coverage; local, instant |
| **Undo tap** (Backspace) | with a selection | removes the last tap and selects again; with no tap left it clears |
| **Clear** (Esc) | with a selection | drops the selection and the taps; the photo was never changed |
| **Cut out**, **Take out**, **Erase** | when the selection is not empty | apply it (A5); disabled while busy |
| **Fill the hole** | next to the actions; on by default (`wandFill`) | Take out and Erase fill the hole with MI-GAN; off, the hole stays transparent |
| **Cancel** | while busy | aborts the request (kills the server processes) |

A status line under the bar says what is selected: "{taps} taps, outline {index} of {count}" with
the keys, or "Nothing found at those spots" with the way out. The tool's context text
(`editor.context.wand`) states the model in one sentence: tap to select, nothing changes yet, tap
more to add, Exclude to take away, then an action. All chips are real buttons, toggles carry
`aria-pressed`, hints are `title`s. Announcements go through the editor's live region.

## A3. The interaction model: a selection

A *run* is the list of taps on one photo plus the choices on it,
`wand.current = { id, photo, points, taps, region, pick, controller, applying }`; what is drawn is
the state `wandSel = { id, taps, candidates, output, pick }`. Leaving the tool, Clear, an applied
action or tapping another photo ends it.

1. **First tap on a photo.** `photo` is the image the photo step shows now (`step.photo`): a
   second action builds on the first, like in any image editor. (Until 2026-11-01 it was
   `step.orig`, a leftover of the first wand that changed the photo on every tap: an Erase on the
   filled hole of a Take out brought the taken-out subject back.) `region` is taken once from a clip the user drew by
   hand (A6). The tap becomes a fraction of the whole image.
2. **Every tap** (add or exclude) is appended and the **whole list** is sent as a *select*
   request (B2). A newer tap aborts the older request. The server answers with up to three
   candidate outlines at 1024 px in about a second (warm); no file is written.
3. **What a tap means** is decided by the server's groups (B3.3): an add tap on or next to the
   selection refines it, an add tap elsewhere adds another thing, an exclude tap removes what it
   falls in. The UI only labels taps 0 or 1.
4. **Drawing.** `WandSelection` draws the picked candidate over the photo, mapped through the crop
   window: the area tinted with `--wb-select`, a white edge and black running dashes on top
   (animated, still under `prefers-reduced-motion`), holes even-odd. The drawing is clipped to what
   is visible of the photo (crop window and the photo's own clip); the selection itself, and so
   the action, may reach into the cropped-away part, which a later crop change shows again. Every tap is a small disc
   with + or −. The photo itself is untouched, so there is never a leftover shape to delete.
5. **Default outline** (`defaultPick`): the largest non-empty candidate that covers at most 60%
   of the photo, else the largest non-empty one. Above 60% it is nearly always the background. A
   search over score and coverage rules on 100 photos found nothing better out of sample
   (`segment-tuning.md`). Smaller / Larger then move through the rest at once, no request.
6. **Busy feedback.** A ring at the last tap, labelled by what runs (selecting, cutting out,
   taking out, erasing), with the server's progress; Cancel in the bar.

## A4. Requests and what the user sees

| Step | Request | Editor does | User sees |
|---|---|---|---|
| tap | select (no `action`) | sets `wandSel` from `candidates` | the outline, about 1 s after the tap (2.3 s on the first tap of a 12 MP photo, which pays the encoder) |
| Smaller / Larger | none | changes `wandSel.pick` | another outline at once |
| action | apply (`action`, `pick`, `fill`) | waits for the `derived` records, then changes the document in one undo step (A5) | busy ring, then the result fades in |

## A5. Actions

All three use the candidate on screen (`pick`) at full size and are **one undo step**
(commands flagged `wand` with `group` = the photo's id).

| Action | Server returns | Document change |
|---|---|---|
| **Cut out** | `derived` role cut | `replacePhoto` with the soft-edged cut, box fitted to it |
| **Take out** | role cut and role rest | `duplicatePhoto` (offset 0) as the subject's copy right above, `replacePhoto` of the copy with the cut, `replacePhoto` of the photo with the rest, box of the copy fitted, the copy selected and the select tool active (it is there to be moved; Cut out and Erase keep the wand, more wand work tends to follow) |
| **Erase** | role rest | `replacePhoto` with the rest |

The *rest* is the photo with the subject's hole **filled** (MI-GAN, B5) or, with Fill the hole
switched off, **transparent**: the exact complement of the cut's alpha, so the cut laid back over
the rest is the original pixel for pixel. Use it when you want your own background behind, or when
the fill looks wrong (Undo, switch Fill off, apply again).

The photo step keeps the image it had before (`step.orig`) for "Restore original", and saving
keeps that original with the node. **Privacy gap, found 2026-11-01, not fixed yet:** a published
node hands its document (with `orig`) and the photo files to every visitor, so the uncut original,
an erased detail included, can be downloaded. The decided fix (originals only for who may edit,
files only for owners or published nodes, `TODO.md` "Photo access") is the next thing to build.

If the page's step limit does not allow two more steps, Take out does nothing and says so. If the
rest fails, nothing changes (`takeOutFailed`); a cut alone (Cut out) only needs the cut.

## A6. Recovery when the model is wrong

The ladder, cheapest first. "Nothing found" names the first ones.

| Situation | Way out |
|---|---|
| the outline is a little too small or too big | **Smaller / Larger** |
| part of the thing is missing | another **add** tap on it |
| a neighbour is swallowed (water, skin, the building around the mast) | **Exclude** tap on the neighbour |
| one tap was wrong | **Undo tap** / Backspace |
| nothing found (small objects) | tap elsewhere on it, or **clip roughly first** |
| everything is off | **Clear** / Esc |
| the thing is hard (thin, low contrast, clutter) | **guide with a manual clip**: draw a rough clip around it with the clip tool, then use the wand. The clip is read once at the first tap and sent as `region`: the matte is cut to it, so nothing outside can be selected. Later: the magnetic lasso (0) |

Spec: a box drag as the first prompt (`--box` exists in the tool); grow / shrink the hole.

Built 2026-11-01: **Exclude subtracts the object** (`--exclude object`). Before, an exclude tap was only a negative point in the SAM
prompt: a weak hint the model overrides on a large, contrasting neighbour (the front jet-bridge
cab in front of a plane stayed in after two exclude taps, 2026-11-01). A Photoshop user expects
"subtract this thing". The exclude tap is to be decoded *as an object of its own* (a positive
prompt alone, its own candidate by the same coverage rule) and that mask taken out of the
selection: pixel arithmetic on decodes that run anyway, about the cost of an add tap. Add and
exclude become symmetric. The tap *also stays* a negative point: without that hint SAM's "whole"
grows to everything around (a protea and its whole bush, first try), the subtraction removes what
the hint does not (the jet-bridge cab). The candidate of the excluded object is the largest that
holds no add tap, so excluding the skin cannot remove the whole woman; when every candidate holds
one, the tap is a negative point only. The result reports `excluded` (count); keeping the masks
for A8 is to do.

Measured (harness, same images as the baselines): two objects, mIoU after 2 / 3 taps 0.664 / 0.724
to 0.709 / 0.814, taps to 90% 3.32 to 3.22; single objects 0.882 / 0.863 / 0.883 to 0.862 / 0.857 /
0.881 after 2 / 3 / 4 taps, taps to 90% unchanged at 1.87. Adopted: exclude is mostly used against
a neighbour, the two-object case.

## A7. Background removal (E127)

Since 2026-11-01 the wand is the main way to isolate subjects and background removal its one-tap
fallback: it is the **Remove background tool (B)** in the wand's tool group (EDITOR.md E37), a tap
on a photo removes its background (`cutoutDown`, then `removeBackground(id)`). No shape is needed
on the photo; the clip is made by the removal. The *Remove background* button of a selected
photo's context bar does the same and stays.

One button on a selected photo, no taps. The server finds all salient subjects with a trained
model, cuts the photo in two passes (quick at 1024 px, sharp at full size) and returns the
subjects' outlines.

- The photo's image is replaced by the cut (`replacePhoto`, flagged `cutout`, one undo step).
- The **clip** becomes a *loose hull*: one polygon per subject, smoothed, **grown outwards by 1%
  of the long edge**, at most 48 vertices each. The alpha of the picture does the fine cutting,
  so the polygon only has to enclose the subject; this is what keeps the handles few and keeps the
  clip from ever cutting into the soft edge (the "dilated where the alpha masks correctly" rule).
  Specks under 0.04% of the photo are dropped, the largest outline is first, all wound alike
  (`outlinesToStage`).
- Cancel and the job rule of E128 apply (`blocked`): the photo cannot be deleted or re-clipped
  while the job runs.

## A8. Complete the subject (amodal completion), spec

Status: **spec**, prototyped by hand on one photo 2026-11-01, not built. Depends on A6 "Exclude
subtracts the object".

**What for.** A subject partly hidden by something in front (a plane behind jet bridges, a person
behind a railing, a record half in its sleeve) is taken out with bites in it. Completion invents
the hidden part so the taken-out subject is whole: a collage material, not a reconstruction.

**Interaction.** A fourth step between selecting and applying, only offered when the selection has
exclude taps (occluders):

1. *Select* as now: add taps on the subject, exclude taps on what is in front of it. The excluded
   objects are drawn in their own tint (occluders).
2. **Complete** (chip, next to Smaller / Larger): the server guesses the hidden outline: the
   subject's shape continued under the occluders. It is shown as a dashed outline of its own,
   with the guessed part tinted differently from the seen part.
3. **The user refines the guess.** The guessed outline is an editable polygon with vertex handles
   (the clip tool's `VertexEdit`: drag, insert on an edge, delete), limited to the occluders'
   area: only the hidden part is editable, the seen outline stays as SAM found it. Undo tap /
   Clear apply to the guess as well. This is the user's say on shape, which no model has: that a
   fuselage is a tube, where the tail ends.
4. *Apply* (Cut out, Take out) with the completed shape: the cut has alpha 1 in the guessed part,
   filled by inpainting; the rest is filled as before (Fill the hole).

**Backend.**
- `segment` returns the occluder masks (`excluded`) with the select result.
- Shape guess, first version: morphological closing of the seen subject across the occluders, cut
  to the occluders (prototype). Known weakness: it closes only the upper edge of a gap (an arch,
  no belly). Better: per gap, a hull of the subject parts on both sides (straight sides), or the
  convex hull locally; to be compared on composites made with `tools/tuning/mkpair.py` by laying a
  known occluder over a known subject (ground truth for free).
- The client sends the (possibly edited) hidden polygon with the apply request (`complete`:
  polygons in image fractions like `region`).
- Fill: MI-GAN on the hidden part only, with the **subject as the only context**: the background
  outside subject and hole replaced (e.g. by the subject's mean colour or a mirrored band) so the
  model continues the subject, not the tarmac. Prototype without that: the short front gap of the
  plane continued the paint well, the rear gap smeared tarmac grey into the fuselage.
- Time: the guess is pixel work at 1024 px (under 0.2 s); the fill 1.5 to 2 s more on the apply.

**Limits, said in the UI.** Good for short gaps over simple surfaces (fuselage, sleeve, wall,
fabric); it invents, it does not know. Large hidden parts would need a diffusion model
(pix2gestalt, SD inpainting): far over the 10 s budget on CPU, not planned.

**Prototype** (2026-11-01, plane through terminal glass, 1024 px): occluders = the two bridge
cabs (positive taps, candidate 1), seen plane = candidate 2 of the five taps minus the cabs,
closing radius 40 px, hidden part 2.2% of the photo, MI-GAN 1.4 s. Scripts were throwaway; the
steps above are the recipe.

---

# Part B: the server backend

## B1. Components

```
 browser (NodeEditor)                         Bun server (server/api)
 ┌───────────────────┐  POST /api/segment    ┌──────────────────────────────┐
 │ wand.js, wandApply│ ────────────────────► │ segment.js  (route)          │
 │ stateless request │ ◄──── NDJSON ──────── │  ├ spawn opencv-imgproc      │──► qjsm + OpenCV 5 (dnn)
 └───────────────────┘                       │  │   segment …               │      MobileSAM encoder+decoder
                                             │  ├ storeFile (uploads/)      │      (embedding cache on disk)
 ┌───────────────────┐  POST /api/cutout     │  └ spawn python inpaint.py   │──► onnxruntime, MI-GAN pipeline
 │ removeBackground  │ ────────────────────► │ cutout.js   (route)          │
 └───────────────────┘                       │   └ spawn opencv-imgproc     │──► u2netp (salient model)
                                             │       cutout …               │
                                             └──────────────────────────────┘
```

Everything heavy runs in **child processes** that die with the request (`proc.kill()` on abort,
`SIGKILL`). The Bun process holds no model and no state besides the uploads directory and the
embedding cache. That is a deliberate choice for isolation and for the 4 GB-class memory of the
hosts; the cost is process start, which the measurements in B6 show to be small for the models used
(MI-GAN loads in 0.4 s). A persistent worker is spec (B8).

## B2. `POST /api/segment` (E119)

Two kinds of request, same route, both stateless and streamed.

Request body (JSON):

| Field | Type | Meaning |
|---|---|---|
| `photo` | 64-hex hash | the **original** image: `data/photos/<hash>.<ext>` if the node was saved, else the upload (`<hash>.display.*`, or the original when no display copy exists) |
| `points` | `[[x, y, label], …]`, 1..32 | taps as fractions 0..1 of the **whole image**; label 1 add (default), 0 exclude |
| `region` | `[[[x, y], …], …]`, optional | manual clip in fractions of the whole image, at most 8 polygons, thinned to 600 vertices (one command-line argument); malformed means ignored |
| `action` | `cut` / `take` / `erase`, optional | absent: **select**. Present: **apply** |
| `pick` | 0..2, apply only | the candidate the user saw |
| `fill` | boolean, apply only, default true | `false`: the hole of take / erase stays transparent |

**Select** runs `segment --masks-only --view-size 1024 --candidates 3 --outline-smooth 0.003
--outline-vertices 120`. **Apply** runs `segment --out cut.png --refine guided --png 1 --candidates 1
--pick <pick>` at full size, then for take and erase `tools/inpaint.py` (with `--no-fill` when
`fill` is false), started from the cut file while the cut is being stored.

Response: `application/x-ndjson`, one JSON object per line, flushed as produced.

| Event | Fields | When |
|---|---|---|
| `progress` | `percent`, `stage`, … | the tool's own lines, passed on |
| `result` phase `select` | `ok`, `output {width,height}`, `candidates [{index, score, coverage, polygons:[{polygon, hole}]}]`, `groups`, `picked`, `best`, `timings` | select; polygons in pixels of `output` |
| `result` phase `final` | `ok`, `output {path,…}`, … | apply; `ok:false` carries `error {code, message}` |
| `derived` | `phase:'final'`, `role:'cut'`, `record` | cut, take: the soft-edged cut stored as an upload of the caller |
| `derived` | `role:'rest'`, `record` | take, erase: the photo with the hole filled (`rest.jpg`) or transparent (`rest.png`) |
| `failed` | `role:'rest'` | take, erase: the rest could not be made |

Rules the route keeps:

- **Stateless.** Nothing is remembered between requests except the embedding cache (a pure
  function of the image) and the uploads. The client resends all taps.
- **Cancellation is closing the request.** Abort or `cancel()` kills the running child.
- **No idle timeout** for the request (`server.timeout(req, 0)`).
- **Errors before streaming:** 400 `bad-json` / `bad-request`, 404 `no-photo`, 503 `no-tool`.
  After streaming has started errors are `result` lines with `ok:false` or the `failed` event.
- The scratch directory of a request is removed in `finally`.

Configuration: `WB_IMGPROC` (tool, default `opencv-imgproc`), `WB_MODELS_DIR`, `WB_PYTHON`
(default `~/.local/share/wild-beauty/inpaint-venv/bin/python`, else `python3`),
`WB_DATA` / `WB_UPLOADS` (tests run on scratch directories).

## B3. The segmentation tool (`opencv-imgproc segment`)

`qjs-opencv/tools/opencv-imgproc.js`, run by `qjsm` against OpenCV 5.1 (dnn, ximgproc, alphamat,
contrib). Contract in `opencv-imgproc.md` S14 and S15. Flow per request:

1. **Embedding.** MobileSAM image encoder, once per image, cached under
   `<cache-dir>/<sha256 of pixels>-mobilesam-<model hash>.emb` (4 MB). A repeat tap on the same
   photo skips the 1.2 s encoder.
2. **Decode.** The mask decoder turns the taps into three 256 x 256 logit maps with predicted
   IoU. With one tap the three are sub-part, part, whole; with several taps they are the
   multi-prompt mask and two larger ones.
3. **Groups** (`--groups auto`, the server default). Taps are walked in order. A tap on or within
   `--group-gap` (3% of the long edge) of a group's mask joins that group; a foreground tap
   elsewhere starts its own group; a background tap goes to the groups it falls in (and is
   dropped when it falls in none). Every group is decoded alone, candidate *i* of the result is the
   union of the groups' candidate *i*. This is what makes "tap another object" additive.
   `--groups single` sends all taps as one SAM prompt.
4. **Mask prompt** (`--mask-prompt on`, experimental): each decode gets the previous logits as
   SAM's mask input instead of starting from nothing. Off by default: it helps scenes with several
   objects and hurts single objects (Part D).
5. **Soft matte.** Logits to a probability (sigmoid, slope 2), upsampled to the image, then a
   guided filter against the photo (radius 0.6% of the long edge, **eps 0.01**: lifted boundary F
   from 0.60 to 0.64 on held-out photos), then contrast steepening.
6. **Region.** `--region` is rasterised and multiplies the matte.
7. **Subjects.** Connected components of the thresholded matte; those under a foreground tap are
   kept (else the largest). The union of the kept parts is the cut.
8. **Colour and edge.** Edge defringing and foreground colour estimation so the cut has no halo of
   the old background.
9. **Outlines**, tidied by `--outline-smooth` (close gaps, remove spurs), `--outline-grow`
   (outwards, share of the long edge), `--outline-vertices` (cap per contour; the tolerance of
   `approxPolyDP` is raised until it fits). `polygons` lists *every* contour with a `hole` flag.
10. **Masks only** (`--masks-only`, the select step): stops after 9 at `--view-size`, every
    candidate as polygons, no file. The apply step renders only the chosen candidate at full
    size; edge cleanup and colour estimation are cropped to the area around the alpha, which is
    what brought a 12 MP apply from 15 s (all candidates, whole picture) to 5.4 s.

Outputs of a run: `cut.png` (RGBA, 8-bit with soft alpha), one file per candidate
(`cut-N.png`, alpha is that candidate's mask), outlines, result JSON.

## B4. `POST /api/cutout` (E127) and the cutout tool

Same shape as B2 without taps. The tool runs `cutout --subjects all --refine guided`
with the salient model **u2netp** (320 x 320, about 0.2 s) in two phases. The route stores each
phase as an upload and sends `derived` with `outlines` as **fractions of the output picture**
(`subjects()`), already thinned and grown by the tool (`--outline-smooth 0.004 --outline-grow 0.01
--outline-vertices 48`). `subjects()` takes every non-hole contour of every outline, so several
subjects give several outlines. Errors are `{event:'error', code}`; `{event:'done'}` ends the stream.

## B5. Inpainting for take out and erase

`tools/inpaint.py --image --cut --out [--grow 0.008] [--work 1024] [--no-fill]`, spawned by the
segment route together with the tool for Take out and Erase with `--cut -`: it loads its model
and the photo, then waits for the path of the tool's 8-bit mask (`--mask-out`) on stdin; a closed
stdin without a path ends it (no cut). The hole is grown and the seam feathered on the window
only (B8).

- **Hole** = pixels where the cut's alpha is above 4/255, grown by 0.8% of the long edge (blur and
  threshold; PIL's rank filter took 100 s on 12 MP) so no fringe of the subject stays.
- **Window.** Only the hole's bounding box plus half its size on each side (at least 64 px) goes
  to the model, scaled to at most 1024 px; the filled window is scaled back and only the hole,
  feathered, is pasted into the full-size photo. This keeps the time independent of the photo size.
- **Model** = MI-GAN, the pre-converted pipeline ONNX (Picsart, MIT, 28 MB): uint8 RGB and a uint8
  mask (0 = hole) of any size in, uint8 RGB out. OpenCV's dnn computes a wrong output size for it,
  so it runs in onnxruntime.
- **Runtime** = Python with `onnxruntime`, `numpy`, `pillow` in a venv
  (`~/.local/share/wild-beauty/inpaint-venv`).
- **No fill** (`--no-fill`): no model; the photo gets the inverted alpha of the cut, not grown, and
  is written as PNG.
- **Why not LaMa** (same photo and hole): LaMa fp32 gives a similar picture but needs 11 s to load
  and 2.7 to 4 s to run, the zoo's quantized LaMa 10 s plus 5 s, and 30 s plus 7 s in OpenCV's dnn.
  MI-GAN is 1.0 to 1.7 s. The tool still has `--rest-fill lama|inpaint|fsr` for offline use.
- The result is stored as an upload with a display copy of at most 2048 px.
- **Large holes** (taking out the *background*, most of the photo): MI-GAN is trained for holes
  of a modest share of the picture. With only a strip of real context it invents the rest by
  repeating and stretching the textures at the edge, in bands, at 1024 px scaled up: a soft,
  "spectrally resynthesised" echo of the place. Seen 2026-11-01 and liked as a collage material.
  Keep it as it is; if sharper large fills are ever wanted, make it a choice (A5), do not
  replace this one.

## B6. Models and licences

| Model | File | Size | Licence | Used for |
|---|---|---|---|---|
| MobileSAM encoder + decoder | `mobile_sam_image_encoder.onnx`, `sam_mask_decoder_multi.onnx` | 27 + 16 MB | Apache-2.0 (weights), MIT (export) | tap segmentation |
| u2netp | `u2netp.onnx` | 4.4 MB | Apache-2.0 | background removal |
| MI-GAN pipeline v2 | `migan_pipeline_v2.onnx` | 28 MB | MIT code and weights; Places2 training-data terms apply | take out |
| LaMa (optional) | `inpainting_lama_2025jan.onnx` | 88 MB | Apache-2.0; Places2 terms apply | tool-only fill |

Weights are never bundled. They live in `qjs-opencv/models/` (checkout, git-ignored) or
`~/.local/share/opencv-imgproc/models/` (installed), or wherever `WB_MODELS_DIR` points.
The Places2 terms must be checked before a commercial release.

## B7. Error behaviour

| Condition | Result |
|---|---|
| tool not installed | 503 `no-tool`; the UI announces "could not find an outline" |
| model file missing / does not load | `result` `ok:false`, code `E_MODEL` |
| no subject above `--min-area` (small object, tap outside the region) | `result` `ok:false`, code `E_METHOD`; the UI announces the failure with the recovery hint |
| tap outside the image | `E_USAGE` (the client never sends one) |
| Python or the model missing for take out | `failed` role `rest`; the cut is kept |
| request aborted | children killed; nothing is stored after the abort |

Known gap, in `qjs-opencv/BUGS`: a small object tapped in its middle can fail with `E_METHOD`.

## B8. Performance budget and measurements

Measured 2026-11-01 on this host (8 cores, shared with a browser and other work, so +-20%) with a
4032 x 3024 upload, one tap on a subject covering 7% of the photo. "Before" is the morning's
select / apply version, "now" the evening's after the latency pass.

| Step | Target | Before | Now |
|---|---|---|---|
| select, first tap of a photo (encoder + decode + outlines) | under 3 s | 2.3 s | 2.3 s |
| select, further taps, 1 tap | under 1 s | 0.74 s | 0.74 s |
| select with 4 taps (2 add, 2 exclude) | under 1 s | 2.4 s | 1.3 s |
| Smaller / Larger | instant | local | local |
| Cut out, end to end (tool + storing) | under 3 s | about 6.5 s | 3.7 s |
| Take out with fill, end to end | under 6 s | about 9.5 s | 6.0 s |
| Erase with fill, end to end | under 6 s | about 9 s | 5.9 s |
| background removal, 12 MP, tool only | under 4 s | 4.5 s | not changed |

### Latency pass 2026-11-01: findings and changes

All changes below were checked to give the same output: alpha and visible colour of the cut, and
the filled photo, bit-identical before and after.

**Select (per tap).** Process start of `qjsm` with the OpenCV module: 0.2 s. Reading the 12 MP
JPEG: 0.12 s (a reduced decode by libjpeg would be 0.08 s; not done, small). The cache key is
the SHA-256 of the *file* (24 ms). The SAM decoder: one forward is 65 to 75 ms in OpenCV's dnn
(first ones up to 180 ms); `orig_im_size` 256 instead of 1024 does not help (8 ms, and the
coordinates would have to follow). Found: **the 16 MB decoder model was loaded again for every
decode** (125 to 175 ms each), and a selection with groups and exclude taps decodes several
times: 4 taps took 1.4 s of loading. Now loaded once per run (`nets` in the tool): 4 taps 2.4 s
to 1.3 s, results identical.

**Apply (the tool).** 4.3 s to 2.5 s:
- writing the cut PNG 1.8 s to 0.6 s: the colour under alpha 0 held the whole photo, 20 MB of
  deflate at level 1 (the server already asks for the fastest level, `--png 1`); it is zeroed
  now, 2.2 MB, which also makes storing and loading faster;
- the guided filter about 1.1 s to 0.4 s: cropped to where the matte is above 0.05 plus 3 radii
  (the contrast steepening zeroes everything below 0.375 anyway);
- left as they are: subjects 0.7 s and colour 0.4 s, several full-size passes over the photo in
  `cutFromSoft` (to crop next, E3), decode 0.25 s.

**Storing a result (server).** About 1.1 s: ImageMagick makes the 2048 px WebP display copy from
the 12 MP picture (0.83 s for the cut PNG), then identify, exiftool, mediainfo and the palette in
parallel (0.3 s). Tried: the tool writing the display copy itself. Not worth it: OpenCV's WebP
encoder needs 0.69 s for 2048 px (ImageMagick 1.15 s for decode, scale and encode together), so
it saves 0.1 to 0.4 s for a new option; dropped.

**Fill (`tools/inpaint.py`).** Was 3.9 s from start, now about 1.8 s after the cut is there:
- the script starts with the tool (`--cut -`): imports 0.33 s, MI-GAN load 0.5 s and the photo
  decode 0.27 s happen while the cut is made; the server writes the mask path to its stdin, or
  closes stdin when no cut came;
- the hole comes from the tool's 8-bit `--mask-out` (93 kB) instead of the 12 MP RGBA cut (decode
  0.6 s);
- growing the hole and the 3 x 3 maximum of the seam work on the window only (numpy for the
  maximum, edges repeated like PIL's `MaxFilter(3)`): 0.27 s and 0.3 s less;
- left: MI-GAN itself 1.4 s at 1024 px.

**Background removal.** Tool 4.5 s on 12 MP: preview 0.96 s (u2netp 0.5 s), final 3.2 s (write
1.5 s, the subject is large so zeroing helps less; subjects 0.85 s; colour 0.44 s; refine 0.38 s);
then both phases are stored. It shares the tool's improvements (net loading, zeroed PNG, cropped
guided filter where the subject is small).

**Bugs found on the way** (fixed): the wand worked on `step.orig` (an Erase on a filled hole
brought the taken-out subject back, A3); exclude taps alone made SAM invent a speck and Erase
then failed; a failed select left the old outline (and its actions) on screen; the first tap of
a selection could be an exclude (A2).

### What is left, by expected gain
1. **Persistent worker** for the tool: no process start (0.2 s), models loaded once (decoder
   0.15 s, encoder 0.4 s, u2netp 0.1 s), the photo decoded once per selection (0.12 s). Select
   would drop from 0.74 s to about 0.25 s. Needs a `serve` mode (NDJSON requests on stdin, errors
   that do not exit, `TUNE` reset per request) and a pool in the server; cancel = kill and respawn.
2. **Crop `cutFromSoft`** to the subject's box (parts gate, multiplications, outline): about 0.7 s
   of an apply with a small subject.
3. **Cropped cuts with an offset** (`--trim` exists): a small PNG to write, store and load. Needs
   the editor to place a picture that is smaller than the photo's window (box and crop of the
   photo step).
4. **Encoder ahead of the tap** (wand tool entry, galleries in the background): the first tap as
   fast as the others.
5. **SAM on the GPU** (B9): a better model at the same speed; the encoder only.
6. The no-fill rest is a 12 MP PNG (2.5 s to write and store): WebP lossless or a cropped rest.

## B9. SAM on the GPU (plan, 2026-11-01, postponed)

The host has an NVIDIA RTX 2070 SUPER (8 GB, driver 595). The OpenCV 5 build qjs-opencv uses
(`/opt/opencv-5.0.0-x86_64`, configured by `~/Sources/opencv/cfg.sh`) has no CUDA (all `cuda*`
modules "Unavailable"), and there is no CUDA toolkit on the host.

**Route chosen: only the encoder on the GPU, through onnxruntime.** SAM's image encoder is the
expensive half and runs once per photo; its output already goes to the embedding cache
(`<cache-dir>/<sha256 of pixels>-<model>-<model hash>.emb`) that every tap reads. A small Python
script (`tools/sam-encode.py`, like `inpaint.py`) with `onnxruntime-gpu` (it brings CUDA and cuDNN
as pip packages, no system install) computes the embedding on the GPU and writes that file; the
decoder stays in qjs-opencv on the CPU (about 0.25 s per tap). The tool needs: the model entries
for the encoders and their decoder, and the cache format documented so both sides write the same
bytes.

Rejected for now: rebuilding OpenCV 5 with CUDA and cuDNN (hours of build, and the CUDA path of the
new dnn engine is uncertain for SAM's graph).

Status: **postponed** by decision 2026-11-01 (the latency pass of the CPU pipeline first). Done so
far: the venv `~/.local/share/wild-beauty/sam-gpu-venv` with `onnxruntime-gpu[cuda,cudnn]`,
numpy and pillow. Model candidates, all one export family (Hugging Face `onnx-community` /
`Xenova`, the `hf` interface the tool's `sam` entry already speaks, decoder 15 MB each):
`sam-vit-base` encoder 342 MB (fp16 172 MB), `sam-vit-large` 1.2 GB (fp16 589 MB),
`sam-vit-huge` 2.4 GB (external data). Not downloaded yet.

The cache key is the SHA-256 of the photo *file* and the encoder input is the tool's own
preprocessing (resize, normalise, pad to 1024): so the tool, not Python, prepares the input. Plan:
`opencv-imgproc prepare --export-input FILE` writes the 1 x 3 x 1024 x 1024 float tensor and
prints the cache key and meta; `sam-encode.py` runs the encoder on the GPU and writes `<key>.emb`
and `<key>.emb.json` in the tool's format (float32 embeddings, then the positional embeddings for
the `hf` interface).

Steps:
1. venv with `onnxruntime-gpu` (CUDA 12 wheels), check `CUDAExecutionProvider` (venv done).
2. SAM ViT-B encoder ONNX (about 375 MB): time on the GPU; embedding into the cache; decoder of
   the same export; harness run against MobileSAM (`reg-auto-ex2`, `pairs-auto-ex2`).
3. ViT-H (about 2.5 GB, fp16 on the GPU) and SAM-HQ (finer edges): the same.
4. If it wins: the route runs the encoder script before `segment` when the cache misses (or on
   tool entry, E4), `--model` follows; MobileSAM on the CPU stays the fallback when the GPU or the
   venv is missing.

What it does not speed up: the apply (edge cleanup and colour at 12 MP, E3).

---

# Part C: how the two parts interact

## C1. Contract

| The UI may rely on | The backend may rely on |
|---|---|
| a select answer has *only* outlines and changes nothing; it can be thrown away | requests are cancelled by closing them, at any moment |
| `candidates` carry `coverage` and `polygons` in pixels of `output`, so the UI picks and switches locally | all taps are resent every time, in order |
| the apply step uses exactly the candidate `pick` of the same taps, so it matches what was shown (at full size, with soft edges) | taps and region are fractions of the **whole image**; the client does the crop-window conversion |
| `derived` carries stored uploads that can be shown like any upload | the client sends `action` only after a select answer with that `pick` |
| `failed role rest` means nothing is to be changed | the client never sends more than 32 taps or 8 region polygons |
| a no-fill rest stacks with the cut back into the original | `pick` is a hint: the tool clamps it |

## C2. Flows

**Select.**
```
tap ─► wandDown: image fraction, run.points += [x,y,1|0] ─► POST {photo, points, region}
        ◄ progress… ◄ result(select, candidates) ─► wandSel, defaultPick ─► outline drawn   (≈1 s)
Smaller/Larger ─► wandSel.pick ± 1 (no request)
```
Each tap aborts the running request and starts a new one with all taps.

**Apply.**
```
Cut out / Take out / Erase ─► POST {photo, points, region, pick, action, fill}
   server: segment (full size, one candidate) ─► cut.png
            ├─ store cut ─► derived(cut)                       (cut, take)
            └─ inpaint.py [--no-fill] ─► store ─► derived(rest) (take, erase)
   client: all needed records arrived ─► one undo step (A5) ─► selection cleared
```

**Manual clip first.**
```
clip tool: rough polygon ─► wand tool: first tap
   run.region = regionOf(clip polygons) ─► request.region ─► tool: matte × region
```

**Background removal.** `POST /api/cutout` ─► `derived(preview)` ─► `derived(final)` with
`outlines` (fractions) ─► `replacePhoto` ─► after 60 ms `clipPolygon` with the loose hull.

## C3. Where each side stretches for the other

- The **select / apply split** exists because the full-size cut is the slow part: the UI shows
  cheap outlines while the user decides, and pays the 5 s once.
- The backend returns **all three candidates** in one select answer so Smaller / Larger need no
  request.
- The backend's **groups** exist so the UI needs one gesture ("tap") for refine and add.
- The **region** exists so the UI can offer manual guidance with the clip tool it already has.
- The **no-fill rest** is the exact complement of the cut so a take out without fill is a lossless
  split into two layers.
- The **crop window** conversion lives in the UI because the backend is deliberately ignorant of
  how photos are framed.

---

# Part D: measuring and tuning

Method, datasets, harness and numbers live in `qjs-opencv/doc/segment-tuning.md`; in short:

- AIM-500 (natural photos with hand mattes, MIT mirror on Hugging Face) and synthetic two-object
  composites built from it; `tools/tuning/{run,report,sweep,mkpair}` replay simulated taps through
  the real tool and report mIoU per tap count, taps to reach IoU 0.9, boundary F, latency.
- **Adopted:** guided-filter eps 0.01 (held-out boundary F 0.598 to 0.641), groups (two-object
  mIoU after 3 taps 0.598 to 0.724, single-object cost a 0.016 dip at tap 3), outline tidying,
  region, MI-GAN for take out.
- **Rejected:** a learned candidate rule (does not beat the coverage rule out of sample), the
  SAM score as picker, any contrast change (cannot move a binary mask).
- **Measured, not adopted:** `--mask-prompt on` helps several objects (mIoU after 3 taps 0.724 to 0.787) and costs 0.03 at tap 2 on single objects, so it stays off; restricting it to groups with more than one tap is untried.

Rule for changes to the wand: no default changes without a harness run on a held-out half.

---

# Part E: open items

Ordered by what is next. Status 2026-11-01 (evening).

**Now**
1. **SAM on the GPU** (B9): the full SAM encoder (ViT-B, then ViT-H, SAM-HQ to compare) on the
   RTX 2070 SUPER through onnxruntime-gpu, writing the embedding cache the tool already reads.
   Goal: every tap under 1 s with a better model. Measure with the harness against MobileSAM
   before switching. Go given 2026-11-01, then postponed for the latency pass (B8); the venv is
   ready.
2. Browser pass of what landed today: select / apply, Fill the hole, Exclude subtracts the object,
   first tap always adds, the selection clipped to the visible window, the recording box on node
   pages, the wand on the current image, the select tool after Take out, the faster fill.

**Next**
3. **Latency, what is left** (B8 "What is left"): persistent worker (select 0.74 s to about
   0.25 s), crop `cutFromSoft` to the subject (0.7 s), cropped cuts with an offset (editor
   change), no-fill rest as WebP or cropped. Done 2026-11-01: decoder loaded once, zeroed hidden
   colour, cropped guided filter, fill script started early with a mask and windowed filters.
4. **Encoder ahead of the tap**: run it when a photo is first selected with the wand tool, and for
   all photos of a gallery in the background, so no first tap waits. With the GPU this is cheap.
5. **Persistent worker** for the tool and for Python (no process and model start per request).
6. **Real-world test set**: the flower gallery (over 200 photos of this year): one tap in the
   middle of each flower, a contact sheet of the outlines, kept as a fixed set to check every
   change against (no ground truth, judged by eye; AIM-500 stays the number).
7. **Complete the subject** (A8): keep the excluded masks in the result (`excluded` holds only a
   count today), shape guess with straight sides, the user refines the guessed outline, fill with
   the subject as the only context.

**Later**
8. Magnetic lasso as a separate selection tool (0), sharing the actions.
9. Box drag as first prompt (`--box` exists in the tool); grow or shrink the hole; fill variants
   for large holes (`--work` smaller or larger, a second pass) as a choice, the current look kept.
10. Small objects fail with `E_METHOD` (BUGS entry in qjs-opencv).
11. qjs-opencv from workshop to release: smoke tests of `segment` / `cutout` (each option once),
    a release with the models listed with their checksums, an install script for tool, models and
    venvs.
12. Mobile: the chips row must wrap on narrow screens (not checked).
13. Server tests for the route with a fake tool (today the route is tested by arguments and by
    hand end to end).
14. Licence check of the Places2 terms before shipping MI-GAN.
15. Promo video from a recorded session (`TODO.md`).

**Notes**
- Install after a tool change: `sudo install -m755 qjs-opencv/tools/opencv-imgproc.js
  /usr/local/bin/opencv-imgproc`, `sudo sv restart wild-beauty`; models in
  `~/.local/share/opencv-imgproc/models/`, the inpaint venv in
  `~/.local/share/wild-beauty/inpaint-venv` (`onnxruntime numpy pillow`).
- Older drafts may hold a black filled shape left by the first wand version; it has to be deleted
  by hand.
