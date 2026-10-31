# GALLERY.md - walkable 3D galleries (and other canvas nodes) inside a node

Status: research, revised 2026-10-22 with the scope decisions of S0a. Nothing is built. Related: `GRAPH.md` (node tiles S3.7,
branch view S2.7, lock S5), `EDITOR.md` (node document model, vector editor), S16 (theming), `DESIGN.md`.

How to read the claims (same legend as `GRAPH.md`):

- **[v]** verified first hand: npm registry, GitHub API, a CDN file, or a script run
  on this machine.
- **[s]** secondary: a search result, forum or bug tracker; plausible, not checked
  against the primary source.
- **[?]** not researched or not found; do not rely on it.

Dates are as of 2026-10-22.

---

## 0a. Decided (2026-10-22)

- Walls are a **layer with a height in the 2D vector editor** (no separate 3D tool).
- Pictures are **hung automatically** for now.
- The 3D scene has **only walls, a floor and a starfield sky**: no ceiling, no
  objects, no doors as objects (an opening is a gap between wall polylines).
- **Lighting is made for displaying art** (S3.4): dim ambient, a pool of light on
  each picture.
- **Texturing is customisable.** A photo of the content node can be marked as a
  **texture**; a texture photo is not hung as a picture. One texture image can
  deliver separate textures for **north, east, south and west facing walls** and
  for **two floor types** (exhibit rooms; corridors and ramps) (S3.3).
- **Ramps**: a floor polygon with an **entry height and an exit height**, slope at
  most **1:12**; walls standing on a ramp **tilt** with it (S3.1).
- **Texture toggle in the editor** (2026-10-31): the button that marks a photo as a texture is shown in the film-strip only for a node of kind `gallery`, because a texture is only used there (`EDITOR.md` E149).
- **Texture set** (one per gallery): up to **three images**. Image 1 is for the
  walls and is either **split in four** (a different texture per compass direction)
  or **not split** (all walls alike); image 2 is the **room floor** and also the
  corridor floor unless an optional image 3 supplies the **corridor floor**. The
  owner may move the points of each region freely, each a **convex 4-point
  polygon** over its image (S3.3).
- **Floors overlap**: the later polygon in the list wins.
- **Seamless textures**: the editor **warns** when a tile is not seamless and
  **offers to make it seamless**; joins that still show (a curved wall crossing a
  compass boundary) get a short **cross-fade** (S3.3).
- **Rooms are closed polygons, corridors are lines** that lead from one room into
  another; **no corner is sharper than 45 degrees** (interior angle between 45 and
  315 degrees; relaxed from 90 on 2026-10-29 for the room aid, EDITOR.md E136), and every wall run is long enough for at least 2-3 pictures
  before a corner (S5).
- **Overview first** (2026-10-29): a `kind: gallery` node page shows its gallery at once from above, in real perspective (`client/gallery/overview.js`: the camera 58 degrees up, far enough back to show every wall); the pictures near the first station load meanwhile. "Walk through the 3D gallery" flies the camera down to the first picture (1.8 s, eased position, turn and field of view; `session.js` `blend`), the stage widens to 16:9 across the page (`.wb-gallery-wide`) and the guided tour starts; "Back to the overview" flies up and shrinks the stage. A browser without WebGL keeps the flat poster.
- **Sequence children** (2026-10-29): a child node that is a slide show or a grid of two or more photos hangs **each of its photos** (thumbnails, the baked photo on zoom, titled `Title i/n`, all opening the child's page) instead of one tile. Order is deterministic: the children in edge order (`sort`, then id), the photos of a child in the node's own order, repeats and missing photos left out (`server/node/view.js` `galleryChild`, `client/gallery/items.js` `childItems`).
- **Hanging**: automatic, on **one side of a wall only**: the inside of a room.
- **North** is the top of the editor view; the owner cannot rotate it.
- **Diagonal walls**: no shearing of textures; the textures are expected to be
  (nearly) **seamless** (S3.3).
- **Works may move** (2026-10-29, design only): a hung work is a still canvas by default,
  or an **overhead projector** with a slide show, or a **machine** (Tinguely / Luginbuehl
  style) as a vector animation. The tour (guided walk) still never advances by itself;
  the works move on their own (S5.2).

---

## 0b. Version 1: minimal scope (2026-10-22)

No more features for now. The decisions above stay as the **format** (so nothing
has to be redrawn later), but version 1 builds only this, with these defaults:

| Topic | Version 1 default |
|---|---|
| Plan | closed wall polygons = rooms; corridors = polylines of width 2 m with generated side walls 1 m high (a parapet: a low bridge under the sky; a drawn corridor keeps a height the owner set, the old default 3.2 m counts as not set); wall height 3.2 m, thickness 0.2 m; corners 90-270 degrees |
| Ramps | a corridor with `h0`, `h1`; slope at most 1:12; walls tilt |
| Pictures | auto-hung, inside of rooms, 1.0 m square, 1.5 m centre height, 0.8 m gap, in edge order, rooms in drawing order; no size setting |
| Texture set | up to 3 photos marked `texture` (walls split-in-4 or single / room floor / corridor floor); **default quads only** |
| Sky | stars only (seeded, 2 000 points) |
| Light | low ambient + warm spot per picture for the nearest 6; no shadows |
| Controls | desktop: pointer lock + WASD; phone: stick + drag-look; viewport-fill mode, Fullscreen API where it exists |
| Context | poster until entered, one live canvas, dispose on leave |

**Deferred** (written down, not built): the quad editor (custom texture regions),
seamless warning / "make seamless" / join cross-fade (v1: textures should be
seamless), the fake light wash and baked light, server-side tiles, picture size
setting, WebGPU, WebXR, audio, stairs, multiplayer, game and VM nodes.

---

## 0. Summary and recommendations

1. **There is no ready-made component that fits.** Searching GitHub and the web
   for walkable WebGL/three.js art galleries finds personal projects, theses and
   WordPress plugins; the most starred (`stfurkan/gez`, 56 stars, MIT) is a
   virtual-tour *directory*, not an engine, and none takes drawn polylines as
   walls [v: GitHub search]. The established open platforms (Mozilla Hubs) are
   whole social-VR stacks with their own server, not an embeddable room. So the
   gallery is **ours to build, on a general 3D engine**. It is smaller than it
   sounds: walls from polylines, a floor, a starfield sky, pictures on the walls, a
   first-person camera and 2D wall collision (S3, S4).
2. **Engine: three.js** (MIT, 116 k stars, pushed 2026-10-21) [v]. It is the only
   candidate that loads **without a bundler** as plain ES modules, which is our
   rule (`PLAN.md` S2). `three.module.min.js` 393 KB (90 KB gzip) plus
   `three.core.min.js` 416 KB (104 KB gzip) [v]; the first-person pieces
   (`PointerLockControls` 6 KB, `Octree` 18 KB, `Capsule` 4 KB) are separate
   add-on modules [v]. **Lazy-load it only when a gallery node is entered**, so
   it costs the rest of the site nothing. Alternatives: Babylon.js (Apache-2.0,
   more built in, much heavier), PlayCanvas (MIT), A-Frame (MIT, three.js with
   HTML tags) - S2.
3. **Input data**: the gallery is a node whose document holds the **floor plan as
   polylines** (the same `shape` steps the vector editor draws, `EDITOR.md` S6)
   plus a small `style` block (wall, floor, sky: colour, gradient, texture atlas,
   tiling). Walls are extruded from the polylines (heights come from the wall layer); measured on this machine
   (S3.2): **200 polylines x 50 points (9 800 wall segments) -> 78 k triangles in
   67 ms**, a typical gallery (50 x 20) in **10 ms**. Pictures on the walls are
   the gallery's **child nodes** (their tiles), which is exactly the graph model:
   gallery -> `child` -> exhibit (`GRAPH.md` S1.1).
4. **Collision needs no physics engine.** The walls are 2D segments; the player is
   a circle. A push-out against every segment costs **0.05 ms per frame for 950
   segments and 0.48 ms for 9 800** without any spatial grid [v: measured].
5. **Live canvases are scarce.** Browsers keep only about **16 live WebGL
   contexts** per page and drop the oldest [s]; phones fewer. So a tile is a
   *picture* until the user chooses to enter it, then **one** live context runs,
   full-screen. This matches the decision "one editor at a time" and the lock.
6. **Fullscreen is not available on iPhone for ordinary elements** [s: WebKit
   bug 206854, still open June 2026]; works on iPad and desktop. Plan for a
   "fills the viewport" mode (CSS, `100dvh`) that does not rely on the
   Fullscreen API, and use the API only as an enhancement. Pointer Lock is
   desktop-only anyway; phones use drag-to-look and a virtual stick.
7. **Other canvas nodes** (games, emulated VMs) share the same frame: a *runtime*
   that mounts into the tile, is entered on demand, and is **sandboxed in a
   cross-origin `<iframe>`** because it runs foreign code (S7). Candidates for
   VMs: `v86` (BSD-2-Clause, 23.6 k stars), `webvm` (Apache-2.0) [v].
8. **WebGPU**: use WebGL as the baseline. WebGPU ships in Chrome (Android 12+ from
   Chrome 121), Safari 26 and Firefox on Windows/Apple silicon, but Linux and
   Android Firefox lag [s]. three.js has a separate `three/webgpu` build (821 KB
   min, 205 KB gzip) [v]; take it only if a feature needs it.
   Pattern to watch: `WebGPURenderer` + TSL, one shader for both backends (S8).

---

## 1. What the gallery must do

| Need | Detail |
|---|---|
| Content | the tile of a gallery node shows a picture (baked tile, `GRAPH.md` S3.7); entering it starts a live 3D scene |
| Geometry | **walls from polylines** (a layer with a height in our vector editor; open or closed, any number); floor from the closed outline(s); **no ceiling**: a starfield sky |
| Style | walls (4 compass directions) and 2 floor types styled with **colour, gradient, texture**; a photo of the node can be marked as texture and then is not hung; follows the node's theme tokens where it can (`PLAN.md` S16) |
| Exhibits | child nodes hang on the walls as framed pictures (their square tiles), **placed automatically** along the walls |
| Walking | first person: WASD + mouse look on desktop, virtual stick + drag-look on phones, tap-to-walk as an option; no clipping through walls |
| Entering | tap/click the tile -> the scene goes **full-screen**; Esc/back leaves and returns to the tile |
| Light | art-display lighting: dim surroundings, each picture lit (S3.4) |
| Honest limits | works on a mid phone; degrades to a still picture when WebGL is missing or the context is lost |
| Reuse | the same host works for **other canvas content** (a game, a VM) |

Not required: multiplayer, voice, physics, avatars. They exist in Hubs-like stacks
(S2.1) and are left out on purpose; see S8 for the questions that would change this.

---

## 2. What exists

### 2.1 Gallery and "metaverse" projects

| Project | What it is | Licence / state | Fit |
|---|---|---|---|
| `stfurkan/gez` | virtual-tour directory (museums, zoos) [v] | MIT, 56 stars, pushed 2026-04-10 | not an engine |
| `theringsofsaturn/virtual-museum-tour-threejs` | three.js tour demo [v] | none stated, 50 stars, 2022 | demo, no licence: do not copy |
| `PaulleDemon/art-museum` | "virtual 3D art gallery and museum" [v] | NOASSERTION, 14 stars, 2024 | demo, licence unclear |
| Edel Museum Generator | WordPress plugin, three.js, WASD + mouse walkthrough [s] | licence not confirmed | PHP/WordPress product; shows the feature set (first-person, artworks per exhibition) |
| Mozilla Hubs / Spoke | social VR rooms on A-Frame; Spoke is the room editor [v: GitHub] | Hubs MPL-2.0 (2 222 stars, pushed 2026-08-23); Spoke licence NOASSERTION (679 stars) | whole stack with server (Reticulum), rooms are glTF; Mozilla shut its hosted service in 2024 and the repositories went to the community Hubs Foundation [s]. Too big to embed; useful as a reference for glTF rooms and navmesh |
| Hyperfy (`hyperfy-xyz/hyperfy`) | virtual-worlds engine [v] | GPL-3.0, 307 stars, pushed 2026-04-21 | GPL and a world server: not compatible with embedding |
| Webaverse | open metaverse engine [v] | no licence, last push 2023-03-25 | dormant |
| 3DStreet | street scene builder on A-Frame [v] | NOASSERTION, 335 stars, active | different domain; shows "drawn plan to 3D" in A-Frame |
| Artsteps, Spatial, Kunstmatrix, Oncyber | hosted gallery builders [?] | proprietary | not researched; they are services, not parts |

Reading: there is a lot of prior art in *looks* and almost none in *reusable code*.
What those projects have in common is the recipe in S3-S5: a plan, extruded walls,
a first-person controller, pictures on walls. We build that recipe ourselves.

### 2.2 Engines

| Engine | Version [v] | Licence [v] | Unpacked npm size [v] | Fit |
|---|---|---|---|---|
| **three.js** | 0.186.1 | MIT | 20 MB (src, examples, builds); runtime 393 KB + 416 KB min | **recommended**; runs as plain ES modules; huge ecosystem; `three/webgpu` and TSL available |
| Babylon.js (`@babylonjs/core`) | 9.31.3 | Apache-2.0 | 73 MB | batteries included (camera, collisions, navigation, GUI, WebGPU since 5.0 [s]); heavy for our "vendored modules" rule |
| PlayCanvas (`playcanvas`) | 2.23.3 | MIT | 90 MB | good engine, the editor-centred workflow does not fit |
| A-Frame | 1.8.0 | MIT | 39 MB | HTML entities over three.js; nice for markup, adds a layer we do not need; Hubs uses it |

Helpers [v, all MIT unless noted]: `three-mesh-bvh` 0.9.16 (fast raycast/collision
on meshes), `three-pathfinding` 1.3.0 and `recast-navigation` 0.43.1 (navmesh and
click-to-walk), `earcut` 3.2.4 (ISC; polygon triangulation, already inside
three.js), `polygon-clipping` 0.15.7 (boolean ops on polygons, e.g. doors cut
out of walls), `@dimforge/rapier3d-compat` 0.21.0 (Apache-2.0; physics, not needed
for walking). `clipper-lib` is BSL: avoid.

**Why three.js** and not the others: our stack has no bundler (`PLAN.md` S2).
three.js ships ready ES-module builds and addon modules that import each other by
relative path, so it can be vendored like Preact. It is also the engine whose
examples already contain what we need: `PointerLockControls`, an `Octree` + `Capsule`
character collision, `RoundedBoxGeometry`, shadows, lightmaps [v: files exist
in the 0.186.1 package].

---

## 3. From polylines to a gallery

### 3.1 The document

A gallery is a node (`kind: 'gallery'`) with a new document step type next to
`photo`, `stroke`, `shape` (`EDITOR.md` S3.1). Proposal (metres):

```json
{ "type": "scene3d", "kind": "gallery",
  "plan": { "walls": [ { "points": [[0,0],[10,0],[10,8],[0,8]], "closed": true, "height": 3.2 } ],
            "corridors": [ { "points": [[10,4],[16,4],[16,9]], "width": 2, "h0": 0, "h1": 0.4, "walls": true } ],
            "floors": [] },
  "thickness": 0.2,
  "style": { "texture": { "images": ["<walls>", "<rooms>", "<corridors>"], "walls": "split",
                          "quads": { "N": [[0,0],[0.5,0],[0.5,0.5],[0,0.5]] } },
             "wall":  { "color": "#f3efe8", "tile": 1 },
             "floor": { "color": "#cabaab", "gradient": ["#d9c9b5", "#b9a68f"], "tile": 2 },
             "sky":   { "stars": 3000, "seed": 17, "tint": "#ffffff" },
             "light": { "ambient": 0.15, "picture": "warm" } },
  "start": { "at": [1, 1], "look": 0 } }
```

- `plan.walls` are the polylines the vector editor produces (a `shape` step is a
  list of points, open or closed; `EDITOR.md` S6) **on a "wall" layer with a
  height property**. The wall layer is the only 3D-specific thing in the editor.
- **Rooms** are closed wall polylines (`closed: true`); the floor of a room is
  its interior (type `room`), no separate floor polygon needed. **Corridors** are
  **lines** (polylines) with a `width`; each one starts in one room and ends in
  another, leaving through a gap in the room wall. A corridor's floor is a ribbon
  of that width around its line (type `corridor`) and, with `walls: true`, its two
  side walls are generated by offsetting the line by half the width. A corridor
  that rises is a **ramp**: `h0` is the height at its first point, `h1` at its
  last, interpolated by distance along the line; the slope `|h1 - h0| / length`
  must be at most 1:12 (so the editor tells the owner how long a ramp must be).
- `plan.floors` are optional extra closed polygons with a **type**: `room` (exhibit rooms) or
  `corridor` (corridors **and ramps**; a ramp uses the corridor texture). `h` is the
  flat height (default 0). A **ramp** adds `ramp: { from, to, h0, h1 }`: the editor
  draws it as an arrow across the polygon and rejects a slope steeper than **1:12**
  (`|h1 - h0| / |to - from| <= 1/12`; the ramp must be long enough for its rise); the floor height at a point is `h0` plus
  `(h1 - h0)` times the point's position along `from -> to`, clamped to 0..1, so the
  polygon's entry edge is at `h0` and its exit edge at `h1`. Where floors overlap
  the later one in the list wins (decided). A wall's base follows the floor under each of its
  points and its top is `height` above that base, so **a wall on a ramp tilts with
  it** (decided). Wall segments are split where they cross a floor polygon border
  so the base follows the floor exactly.
  The visitor's eye height is the floor height at their position plus 1.6 m (a
  point-in-polygon and a plane evaluation, no physics). Where no floor polygon covers a spot there
  is no floor (void down to the sky): the owner draws the floor. If no floors are
  given, the outline of a closed wall polyline is used as one `room`.
- **Corner rule** (decided): rooms are closed polygons whose interior angles are
  between 45 and 315 degrees (was 90..270; relaxed 2026-10-29: the room aid turns by
  0, 45, 90 and 135 degrees). The editor refuses to close a corner sharper than
  45 degrees. That bounds the mitre length of a wall joint (at 90 degrees the mitre
  tip is 1.41 half-thicknesses from the corner), so joints need no special case,
  and keeps every wall run usable for hanging (S5).
- An opening (door, passage) is just a **gap between two wall polylines**; no door
  object.
- There is no `hang` list: **pictures are hung automatically** (S5). Per-picture
  positions can be added later without breaking the format.
- Style is data, not code. The sanitiser (`PLAN.md` S16.6) allows only known keys,
  colours, and a photo hash that belongs to this node and is marked as texture.

### 3.6 Auto plan for a node without one (decided 2026-10-29)

A node with children but no `scene` plan (a plain `list`) is shown as a gallery
anyway: `client/gallery/autoplan.js` generates the plan. A row of 12 x 8 m rooms
from west to east, each pair joined by a 6 m long, 2 m wide corridor leaving
through a 2 m gap in the room walls; the first room has no west door, the last no
east door, a single room is one closed polygon. The number of rooms is the
smallest one whose auto-hang slots (S5.1) fit all children. The start is the
middle of the first room, looking east. The plan is never stored; a drawn plan
replaces it.

Format refinements made while building (`client/gallery/`):

- An **open** wall hangs pictures on its **left** in the direction of travel
  (optional `side`: `left`, `right`, `none`), so a room with door gaps is several
  open polylines drawn counter-clockwise. Closed walls hang on the inside.
- `start.look` is in degrees, 0 = north, 90 = east.
- `plan.floors[]` entries are `{ type, points, h? }`; `h` is a flat height. A wall
  may carry `base` (default 0). Without `floors`, closed walls give the room floors.
- Output coordinates are y up and `z = -y_plan`; wall `uv` is metres along the
  wall and above its base.

### 3.2 Geometry, measured

Walls: each segment becomes a box (4 side faces) with UVs that run along the wall
(`u` = distance in metres, so a texture tiles at a real scale). Floor: closed
outline -> `ShapeGeometry` (earcut). Prototype in Bun with three.js 0.186.1, no GPU
needed for geometry [v: scratchpad `gal/t/walls.mjs`]:

| Plan | Segments | Walls build | Triangles | Buffers | Collision (circle vs all segments) |
|---|---:|---:|---:|---:|---:|
| 10 polylines x 10 points | 90 | 5.7 ms | 720 | 32 KB | 0.011 ms/frame |
| 50 x 20 (a rich gallery) | 950 | 10.0 ms | 7 600 | 341 KB | 0.053 ms/frame |
| 200 x 50 (extreme) | 9 800 | 67 ms | 78 400 | 3.9 MB | 0.48 ms/frame |
| floor from a 200-point outline | - | 5.5 ms | 198 | - | - |

Reading: building is a one-off at entering (well below a frame budget for normal
galleries; first call includes JIT warm-up), and a mid phone draws 8 k triangles
trivially. The prototype joins segments by overlap (no mitre); the production
builder should mitre joints and merge all walls with the same material into **one
mesh** (one draw call per material). Openings are gaps between wall polylines (no door
objects), so no cutting is needed.

### 3.3 Texturing: a set of up to three images, six regions

**Marking a texture.** In the node's photo list (`node_photos`) each photo has a
`role`: `picture` (default, hung in the gallery) or `texture` (never hung, only
referenced by `style.texture`). The role is a property of the photo *in this
node*, so the same upload can be a picture elsewhere. Schema: `node_photos.role
TEXT NOT NULL DEFAULT 'picture'` (`PLAN.md` S8).

**The texture set: up to three images, six regions.** A gallery has one texture set
(decided: one is enough, no per-wall or per-room override). It has up to three
images, all photos marked `texture`:

| Image | Used for | Detail |
|---|---|---|
| 1 | **walls** | either `walls: "split"` - the image is split in four, one region per compass direction (north, east, south, west) - or `walls: "single"` - not split, every wall face uses the whole image |
| 2 | **room floor** | exhibit rooms; also the corridor/ramp floor when there is no image 3 |
| 3 (optional) | **corridor floor** | corridors and ramps |

So the six regions are N, E, S, W (from image 1 when split), room and corridor.
Without an image 2 the floor falls back to the colour/gradient of the style; the
same for walls without an image 1.

**Regions are convex 4-point quads.** Each region is four points (image fractions
0..1) in its image, ordered top-left, top-right, bottom-right, bottom-left of the
texture as it should appear, so the order also rotates or mirrors a region. The
default of a split wall image is a 2 x 2 grid (N E over S W); an unsplit image,
and floor images, use the whole frame. The owner can move any point (below).
The quads are stored only where they differ from these defaults
(`style.texture.quads`, keyed `N E S W room corridor`).

**The owner edits the quads.** Each slot's four points can be dragged anywhere on
its image (the editor shows the image with six coloured polygons and a live
preview). The editor and the sanitiser reject a quad that is not **convex** (a
bow-tie or a dent), has less than a minimum area, or points outside 0..1. A
skewed quad corrects perspective (a photographed wall that is not square-on), a
rotated one rotates the texture.

**How a quad becomes a texture.** A rectangle can be cropped; an arbitrary convex
quad must be **warped** to a square tile by a projective (homography) map. The
tile is then an ordinary texture with `RepeatWrapping` and mipmaps, so tiling,
filtering and anisotropy work as usual. Measured on this machine (a 2048 x 2048
source, six skewed quads, CPU, bilinear; `tools/gallery-warp.mjs`) [v]:

| Tile size | 6 regions |
|---|---:|
| 256 x 256 | 19 ms |
| 512 x 512 | 66 ms |
| 1024 x 1024 | 248 ms |

So the warp can run **once at load on the CPU** (512 px tiles: 66 ms desktop; a
phone is several times slower, still well under a second); a fragment shader
render-to-texture would do it on the GPU in about a millisecond and is the later
optimisation. Server-side `convert -distort Perspective` (ImageMagick) could bake
the six tiles once and cache them by hash of (image, quad), which also gives the
gallery six small files instead of up to six large photos; not needed first.
The convexity test (cross products of the four corners have one sign) and the
homography are in the same script [v].

**Seamless textures.** A tiled texture shows a seam where opposite tile edges
differ. The editor measures it when it warps a tile (mean absolute difference
between the first and last pixel row, and between the first and last column, over
the tile; a threshold is to be tuned on real photos) and **warns** with the value;
it then **offers "make seamless"**: the tile is cross-faded with a half-shifted copy
of itself through a soft mask so that its edges match (the standard offset-blend
trick; it softens detail at the borders and in the middle band, which is the price).
The result is the tile used in the gallery; the original photo is untouched. Joins
that still show where a curved wall changes compass region get a short **cross-fade**
(a blend over about 0.5 m of wall length between the two regions' textures).

**Which side is which.** Each wall segment has two faces, each with an outward
normal. A face is assigned to the compass direction its normal is closest to.
**North is the top of the editor view** (decided, fixed: the owner cannot rotate
it), so a plan point with a smaller y is further north. A closed room has its
inner north wall face textured with the N slot and its outer face with the S slot.
Diagonal walls take the texture of the nearest of the four directions and the
texture is **never sheared** (decided; textures should be nearly seamless, S9.2-9.3). End caps and wall tops use the wall colour.

**Materials.** Six materials (N, E, S, W walls; room floor; corridor floor), one
mesh per material, so a gallery costs about six draw calls plus pictures plus sky.

**Tiling is metric.** UVs are in metres (S3.2) and `tile` is "metres per repeat",
so a longer wall never stretches a texture. Floors use plan x/y as UV.

**Other sources.** No image at all: a gradient (a 1 x 256 canvas strip), a
procedural pattern (boards, plaster, checker), or a colour. A seamless image from
CC0 libraries (ambientCG, Poly Haven publish PBR materials under CC0 [s]) is
uploaded and marked as texture like any photo. The theme may supply defaults
(`var(--wb-...)` resolved at build time with `getComputedStyle`).

### 3.4 Light for displaying art

A gallery is lit by *contrast*: a dim space and lit pictures. Plan (proposal, not
measured on a phone):

- **Ambient**: low (`style.light.ambient`, about 0.1-0.2) so the walls recede; the
  starfield sky adds no light.
- **Picture lighting**: a warm (about 3 000-3 500 K) narrow **spot light** per
  picture, mounted above and in front, aimed at the picture centre, soft penumbra,
  so each picture gets an even wash that falls off onto the wall and floor
  (pools of light).
- **Cost control**: forward rendering pays for every light on every fragment, so
  only the **nearest 4-8 spots** to the camera are real `SpotLight`s; the others
  are a cheap fake (an additive soft-gradient quad on the wall, optionally a
  floor pool). The set is recomputed when the visitor moves between rooms. No
  shadows at first (0-2 shadow-casting lights at most, later).
- **Pictures** are slightly emissive (about 0.1-0.2) so a picture never goes black
  between lights, and use no tone-mapping tricks that shift their colours
  (`ACESFilmic` would change them; use `NoToneMapping` or `Neutral`) - colour
  fidelity of the art matters most.
- **Baked light** (a lightmap per wall and floor, computed server-side) would give
  the gallery look for free at runtime; a later step (Q8).

### 3.5 Starfield sky

No ceiling: the visitor walks under the stars. A `THREE.Points` cloud on a large
sphere (radius far beyond the plan, `depthWrite` off, follows the camera so it
never parallaxes), 1 000-5 000 points with a seeded random direction, size and
brightness (a seed in the doc, so every visitor sees the same sky). Colour from
`style.sky.tint`, optionally slightly warm/cool per star. One draw call; no image.
A vertical gradient (a big inside-out sphere or the page background colour) gives
a horizon glow. Cost is negligible next to the walls.

---

## 4. Moving through it

| Concern | Choice | Notes |
|---|---|---|
| Camera | `PerspectiveCamera`, eye height 1.6 m, FOV 70, `near 0.05` | portrait phones: raise FOV or use `Math.max` of horizontal FOV |
| Desktop input | `PointerLockControls` + WASD [v: add-on, 6 KB]; Esc leaves lock | pointer lock needs a user gesture |
| Touch input | left half: virtual stick (move), right half: drag to look; optional tap-to-walk to a floor point | needs `touch-action: none`; no extra library |
| Gyro look | `DeviceOrientationEvent` after a permission prompt (iOS) | optional |
| Collision | 2D circle (r = 0.3 m) against wall segments (half thickness added), push-out and slide along the wall | measured above: no physics engine; add a uniform grid only past ~10 k segments |
| Ground | flat floor polygons and **ramps** (S3.1: entry and exit height) | eye height = floor height at the position + 1.6 m (a plane lookup, no engine); no stairs, no second storey; `Octree` + `Capsule` (add-on, 18 + 4 KB) only if stairs come |
| Picture view | tap a picture -> camera eases to 1.5 m in front of it, the picture's node opens read-only (a normal tile zoom) | editing it is the single editor, outside the scene |
| Navmesh | not needed for a plan of walls; `three-pathfinding` if tap-to-walk through doors | |

The loop is `requestAnimationFrame`; render only while visible (`IntersectionObserver`,
`visibilitychange`) and **stop rendering when not entered** (S6).

---

## 4a. Atmosphere (2026-10-29)

Small additions that make the rooms feel built and the bridges feel like bridges.
All are shader or typed-array work with no textures to load; each can be left out
in the scene style (`style.contact`, `style.light.dust`, `style.sky.moon`,
`style.sky.clouds`, `style.trail` = `false`; `dust: 0`), and a phone (a coarse
pointer) gets fewer motes and simpler clouds.

| What | Where | How |
|---|---|---|
| **Contact shadows** | `contact.js`, `scene.js` | a soft strip on the floor along the foot of every wall face that has floor in front of it (faces looking into the void get none), and the wall material darkens toward its base (`uv.y` is the height over the base) |
| **Dust in the spots** | `dust.js` | 420 motes (140 on a phone) in one `Points`; each belongs to a spot and the vertex shader places it in that spot's cone from three uniforms per spot, so a spot that moves to another picture costs no geometry; its dust fades in over 0.9 s; motes catch the light now and then |
| **Moon** | `horizon.js` | a shaded disc with a halo on the stars' sphere, turning with the stars, and a cool directional light (0.32) from its direction |
| **Clouds below** | `horizon.js` | two layers 9 m and 17 m under the floor, noise sampled at world coordinates so they pass by as you walk, moon-lit edges, fading with distance; the bird's-eye view shows the building standing over a sea of cloud |
| **Footprints** | `trail.js` | a print every 0.66 m walked, left and right mirrored, in one ring of 480 instances that fade slowly; none in the bird's-eye view, none after a jump (a tour move). Walking backwards points the prints the way you look: a moonwalk |
| **Lens** | `session.js`, `GalleryView.js`, `layout.css` | while the camera glides from picture to picture or flies down into the plan, a vignette and a soft blur toward the edges close over the canvas (a page overlay with `backdrop-filter`, so it does not depend on the colour handling of the renderer) and open again on arrival; off for `prefers-reduced-motion` |
| **Flyby** | `flyby.js`, `session.js` | before anyone walks in, the bird's-eye view turns into a loop that flies like a bird: dive in a slanting swoop into a room, glide along a wall past its pictures looking at the next one ahead, pull up, a figure eight over the room, dive into the next wall, four walls in all (about 80 s), then back to the bird's-eye view. The path is one smooth spline with its own speed profile (fast up high, slow by the pictures); the gaze is smoothed as angles (so a reversal of heading is a turn of the head, never a snap), the roll follows the turn like a coordinated bank, with a slight sway; the ends of the loop settle into the still bird's-eye view, so it starts and repeats without a jump. *Walk* flies down from wherever the camera is; *back to the overview* returns to the start of the loop. Off for `prefers-reduced-motion` and for a plan without a wall of two pictures; no footprints from it |
| **Take the controls** | `flight/` (`takeover.js`, `pilot.js`, `ground.js`, `sound.js`, `callouts.js`, `voice.js`, `Medal.js`), `controls.js`, `session.js` | during the flyby a drag, the thumb stick or W A S D / arrow keys (while the pointer is over the stage) takes over and **pauses the loop until you let go**; then the bird flies on by itself (levelled; low over a floor at a walking pace, so one can stay in the flare indefinitely) and **only after a minute without any control** glides back onto the loop's path (2.4 s). On a touch screen **one finger anywhere is the flight stick**, steering by how far it is from where it touched down (right turns and banks, up climbs, down dives; a small ring shows it); on a desktop a mouse drag or A D / Q E turns, W dives, S climbs, Shift is faster; it levels itself when let go. Low over a floor it throttles back and flares (the retard) and, gentle (sink under 2.6 m/s, nose not below -0.4 rad), level and **with the gear down**, it touches down and *Walk freely* starts from there; **with the gear down the nose is kept from a steep descent low over a floor, so any approach that goes down to the floor lands softly** (easy landing). A **perfect landing earns a medal**: gear down, flaps 2 or more, no bounce on the way, sink under 1.0 m/s, wings level, nose within 0.2 rad of level (`flight/pilot.js deserves`); **sideslip** (a glider's way to lose height on the approach: hold **Z** or **X**, or the Slip chips on touch): the wing goes down on one side and the nose points off the other way, the track does not turn, the sink grows by 2.4 m/s and the speed drops; it eases out when let go and **has to be out (under 0.12) at touchdown**, otherwise it is a skid and bounces; the aids (top left): radar altimeter `RA`, vertical speed `VS`, `SPD`, red-flagged when the sink is too much for the height left; **an Airbus-style voice** (`flight/callouts.js`, `flight/voice.js`, the browser's speech synthesis, a flat English woman's voice when the device has one, always English as in the cockpit): "ONE HUNDRED, FIFTY, FORTY, THIRTY, TWENTY, RETARD, TEN" in feet on the way down, and the ground proximity warnings "SINK RATE", "PULL UP", "TOO LOW GEAR", "TOO LOW FLAPS"; a gold medal (`flight/Medal.js`, SVG, drops in with a shine) shows for 7 s and a bugle fanfare plays (`flight/sound.js fanfare`), then the bird **rolls out**: it brakes level on the floor, the **reverse thrust** spools up from idle (`flight/pilot.js rollout`, a roar and a whine that follow it, `flight/sound.js thrust`; the aids read `REVERSE TRANSIT / GREEN / IDLE`), stows when slow and the bird stops. Then the visitor walks, and **ground control** writes (no audio): "Welcome to <gallery name>. Taxi to gate <gate>", the gate being the first picture of the guided tour (its title, else n/total). The guided-tour button reads **Taxi** meanwhile: it walks the route to the gate (the same A* path as the tour), or one rolls there on foot; at the gate the last line is "Gate <gate>. Parking brake set" for 7 s. Too hard, or gear up (a belly landing), it bounces up. **F** cycles the flaps (0..3: slower, draggier), **G** the gear (5.5 s); both with synthesised sounds (hydraulic pump, air, clunks, three greens; Web Audio, no files), and as chips for touch. Everything of the take-over lives in `client/gallery/flight/`, the plain flyby stays in `gallery/`. The running gag |
| **Upright phone** | `fit.js`, `GalleryView.js`, `layout.css` | in portrait on a narrow screen the stage takes the whole height from the node title down to the edit button (measured into `--wb-fit` on load, resize and turning the phone), so the page does not scroll; landscape and desktop keep the 16:9 / square stage |
| **Controls outside the stage** | `chrome.js`, `GalleryTools.js`, `GalleryView.js`, `NodePage.js` | the stage shows only the picture and, inside it, *Open* and *Walk freely*. Right of the node title sit three icon buttons (help, fullscreen, back to the overview), beside the edit button the previous / next picture with its place (`1 / 96 · title`). A small store (`chrome.js`) carries the state from the gallery view to the toolbars; while the stage is fullscreen it shows its own icons and ◀ ▶ again. The help note opens by itself only the first time (`localStorage` `wb-gallery-help`), then with the ? button or a tap on the note. The all-nodes gallery page (no store) keeps the buttons in the stage |

Not done: a true depth of field (blur by distance from the picture in focus)
needs the scene rendered to a texture, and the sRGB handling of the shader
materials (stars, dust, clouds write display values, the standard materials
linear ones) differs between a render target and the canvas; it would be a
follow-up with its own colour pass. The footprints are not kept between visits.

## 5. Pictures on walls = child nodes

A gallery node has `child` edges to its exhibits (`GRAPH.md` S1.1, 1.2). Each
exhibit appears as a **framed quad** textured with its tile (`GRAPH.md` S3.7); the
tile loads lazily by distance (low resolution far away, the baked tile near).
Tapping it walks up and opens the node. Photos marked `texture` are never hung.

### 5.1 Auto-hang rules (decided 2026-10-22)

- **One side of a wall only**: the **inside of a room** (the side facing the room
  interior of a closed wall polyline). Outer faces and corridor walls stay bare.
- **Eye level**: picture centre at 1.5 m above the local floor; pictures are
  square (a tile is square) with a default side of 1.3 m, spaced by a gap (default
  1.6 m; decided 2026-10-29: bigger and further apart).
- **Wall runs**: walk along each room wall polyline; a run ends at a corner. The
  run is long enough for at least 2-3 pictures before a corner (the editor warns on
  shorter runs: a picture needs its width plus a margin of half a picture + 0.3 m on
  both ends, so 1.3 m pictures need 3.2 m of free wall to hang one, and about 6.1 m
  for two, 9.0 m for three).
- **Fill**: along the run, evenly: `n = floor((L - 2*margin + gap) / (w + gap))`
  pictures, centred on the run; each is oriented to its local segment direction.
  Gentle bends inside a run are fine (pictures follow the segment); because no
  corner is sharper than 90 degrees, a picture never wraps a sharp corner.
- **Order**: the children in edge order (`sort`) fill the rooms in the order the
  rooms were drawn (the order of the closed walls in the plan), each room's walls
  from its first point around the polygon, a room before the next. Pictures that do
  not fit are not hung; the count is shown ("37 of 50 hung"). Gaps left by
  children the viewer may not see are skipped, not left empty (the next child moves
  up).
- **Picture size** may later come from the child's own `size` field; not now.

**The picture itself** (decided 2026-10-29): no frame. A canvas is a shallow box
(4 cm, "an inch") standing off the wall, the photo on its front and white canvas
sides, with a soft shadow on the wall (a little below it, since the light comes from
above). Below it hangs a **name plate** (0.6 x 0.17 m, serif lettering, shrunk to
fit, cut with an ellipsis) when the item has a title; a child node's title, a
photo has none, so no plate. The lettering is drawn onto the plate when the visitor
comes within 25 m.

Consequences:

- The graph and the gallery show the *same* data; reordering children in the branch
  view re-hangs the pictures.
- The visibility rules apply per exhibit: hidden or group-only children are not
  hung for viewers who may not see them (the following ones move up).
- Shop items linked by `sells` edges can show a small price tag beside the picture.

### 5.2 Moving works (decided 2026-10-29 as design; not built, TODO 13.12-13.15)

A hung work is a still canvas by default. A node may say it is something else
(`doc.motion`, `EDITOR.md` S3.1); the gallery then hangs it differently. The tour
(guided walk, S4) is unchanged: it never advances by itself, only the works move.
The tile, the poster, the graph and the link grid always show the **rest pose** (the
first slide, the machine at time 0); only the live 3D scene animates.

**Kinds**

| `motion.kind` | What hangs | Source in the node | Settings |
|---|---|---|---|
| none (default) | the canvas of S5.1 | the node's tile | - |
| `projector` | an **overhead projector** and a screen | the node's picture photos in page order (at least two), as in `slides` mode | `dwell` seconds per slide (default 6), `fade` seconds of cross-fade (default 1.2), `shuffle` |
| `machine` | a canvas whose picture is **animated** | the node's page 0, with **motors** (`EDITOR.md` S2.3c) on its steps | `speed` factor (default 1), `start`: `always` or `tap` |

**Projector.** Two things are hung. The **screen** is a frameless rectangle flush with
the wall (a projection has no depth and no shadow), a little brighter than a canvas,
with a soft glow on the wall around it; it shows the slides, cross-fading by a shader
between two textures, and the next slide is fetched while the current one shows. The
**projector** is a simple prop (a low trolley, a glass stage, a head on an arm, a
mirror: boxes and a cylinder, no textures) standing on the floor 3.2 m in front of
the screen and 0.8 m off its axis, so the station (2.5 m, on axis) stays clear. A
faint additive cone with a few dust motes runs from its head to the screen. The prop has a
circle in the collision list (radius 0.35 m). **A projector takes two slots** in the hang order (the screen, and
the next one is skipped, so its place on the wall stays free for the beam to be seen
against). Keystone distortion is ignored (decided: the slides stay rectangular). When
zoomed in, the current slide is swapped for its sharp image (S4, `large`).

**Machine.** The work stays a canvas on the wall, but its texture is redrawn: a pure
function `motionAt(doc, page, t)` (`EDITOR.md` S5) gives every moving step a matrix
and an opacity for time `t`, and `client/gallery/machine.js` draws page 0 with the
2D canvas API into a `CanvasTexture`:

- Steps are z-ordered as in the editor. A run of steps without a motor and not under
  one (a **static layer**) is drawn once into an offscreen bitmap; each frame draws
  the static layers and, between them, the moving steps. Typical machine: one
  background photo, five or six moving parts.
- Photo steps use `drawImage` with the matrix, clips use `Path2D(path)`, `blend` maps to
  `globalCompositeOperation` (multiply, screen, overlay, darken, lighten), strokes
  are filled polygons, shapes `Path2D`, text boxes `fillText` on their box. Curved
  text (`textPath`) has no canvas counterpart: it is drawn once into a static layer
  (it does not move with a motor; the editor says so).
- Time is the gallery clock in seconds times `speed`, so all machines in one gallery
  keep their phase across visits to a station. `start: 'tap'`: the machine stands
  until the visitor taps its picture, again to stop it (a Tinguely "press the
  button" work); a tap on a machine therefore does what it says instead of the guided
  walk's "go to this picture", **once the visitor is at its station** (a tap from
  elsewhere still goes to the station first).
- **Budget.** Only the nearest two machines within 12 m **and in view** animate, at
  20 frames per second at 1024 px; the others show their rest pose. Zoomed in on one,
  it runs at 30 frames per second at 1600 px. A hidden tab or a lost context pauses
  everything. One draw per frame costs a few milliseconds on a phone for the usual
  six moving parts [?: not measured], which is why the cap is two.

**Safety.** Nothing flashes: a `blink` motor has a period of at least 0.5 s, the
cross-fade of a projector is at least 0.3 s, so no work flashes more than three
times a second (WCAG 2.3.1). With `prefers-reduced-motion` every moving work shows
its rest pose and the HUD says "motion off" with a button that starts it for this
visit.

**Guided walk.** A station in front of a moving work is the same station; zooming
in works the same (the machine's canvas grows to 1600 px, the projector shows the
sharp slide). Next and previous go by work, never by slide: the slide show is the
work's own behaviour, not the tour's. The Open button leads to the node's own page,
where the slides or the animation play in the normal viewer.

**Not decided / later:** sound (a Tinguely clatter, tied to `speed`, only after a tap, off
by default); a machine as a shallow box with parts at different depths (a shadow
box); a projector that throws on a wall without a screen frame at an angle (keystone);
a real 3D machine (this is a vector animation by decision).

---

## 6. Many canvases, one live context

- Browsers cap active WebGL contexts (about 16 per page, the oldest is lost with a
  console warning; fewer on phones) [s: Chromium code review of the limit, WebKit
  layout tests]. A page of gallery tiles must therefore **not** start a context
  per tile.
- Rule: a canvas node shows its **poster** (the baked tile, `GRAPH.md` S3.7) until
  **entered**. Entering creates the context and loads the engine; leaving
  **disposes** it (`renderer.dispose()`, `forceContextLoss()`), frees textures and
  returns to the poster. At most one is live at a time, the same rule as for
  editors.
- A lost context (`webglcontextlost`) is handled: show the poster, offer a reload.
- The engine is `import()`ed on the first enter, so unvisited galleries cost zero
  bytes of JavaScript beyond the poster.

## 7. Other canvas nodes: games and VMs

The node document can carry `"type": "runtime"` with a `kind` (`gallery`, `game`,
`vm`, ...) and a payload; the tile and the enter/leave/fullscreen behaviour are
common and only the module that mounts into the canvas differs.

- **Games**: any HTML5/WebAssembly game that renders into a canvas (Emscripten,
  Godot web export, PlayCanvas, three.js). Packaged as a folder of static files.
- **VMs**: `v86` (x86 emulator in WebAssembly/JS, BSD-2-Clause, 23.6 k stars,
  pushed 2026-10-18 [v]) and `webvm` (Linux VM in the browser on CheerpX,
  Apache-2.0 repository, 17.4 k stars [v]; the CheerpX engine itself has its own
  terms [?]). Both are heavy (megabytes of images) and run only after an explicit
  tap.
- **Security**: this is foreign code in our origin's neighbourhood. It must run in a
  **cross-origin `<iframe sandbox="allow-scripts">`** served from a different
  origin (a separate port or domain, `Content-Security-Policy` without our
  cookies); communicate only via `postMessage` (enter, leave, resize, the
  fullscreen request). A gallery built from our own plan needs no iframe (we
  control the code); user-uploaded programs always do. Untrusted uploads are a
  separate decision (`PLAN.md` S9 is "safety without accounts"; this widens it).
- **Fullscreen and phones**: see S6 and the next point.

### 7.1 Entering "fullscreen"

- `element.requestFullscreen()` works on desktop and Android Chrome and on iPad,
  but **not for non-video elements on iPhone** [s: WebKit bug 206854, open; a
  June 2026 comment says Safari 27 beta notes still list nothing]. The robust
  design is a **"fills the viewport" mode**: a fixed overlay with `100dvh/100dvw`,
  `overscroll-behavior: none`, safe-area insets; use the Fullscreen API on top
  where it exists.
- Leaving: an always-visible close control, the browser back button (push a
  history entry on enter), Esc.
- Orientation lock (`screen.orientation.lock`) works only in fullscreen on Android;
  do not depend on it.

## 8. WebGPU, WebXR

- **WebGPU** [s: web.dev, Khronos 2026 deck]: Safari 26 on all Apple platforms;
  Firefox from 141 on Windows and 145 on Apple silicon, Linux and Android still in
  progress; Chrome on Android 12+ with supported GPUs since 121. There is no
  reliable usage percentage here [?] (check caniuse/StatCounter before deciding).
  Conclusion: WebGL (WebGL2) is the baseline, which three.js renders everywhere.
  three.js has a separate WebGPU build (`three/webgpu`, 821 KB min / 205 KB gzip
  [v]) with a WebGL2 fallback inside it; we can swap it in for galleries later
  without changing the plan format. TSL (three's shading language) is the way to
  write one shader for both.
- **Pattern to watch: `WebGPURenderer` + TSL** (added 2026-10-22, from the project
  owner; not measured here). For a new gallery project the current practice is to use
  three.js's native `WebGPURenderer` together with TSL (Three Shading Language).
  Shaders are written once in TSL and target the high-performance WebGPU backend,
  with an automatic WebGL2 fallback for browsers without WebGPU. That fits the heavy
  parts of a gallery: architectural lighting (S3.4), reflection probes, and
  post-processing such as a bloom on picture frames, without losing frame rate.
  How it sits with the plan: the baseline stays WebGL (S0 point 8), so a gallery
  that needs one of those effects writes it in TSL from the start and loads
  `three/webgpu` for it; plain galleries keep the smaller WebGL build. The node
  format does not change either way. Before adopting: check the `three/webgpu`
  size against the vendored-module rule and measure the fallback path on the Android
  Firefox and Linux cases above.
- **WebXR**: three.js supports it; a "walk in VR" button is a small add-on later.
  Not for the first version.

---

## 9. Open questions

None block version 1; the defaults of S0b apply. Answered by default: corridors
are width-2 m lines with generated walls; picture size 1.0 m; rooms filled in
drawing order; stars only. Revisit after the first version works:

1. Corridors drawn as lines or as walls by the owner?
2. A picture size setting; rooms ordered by reach instead of drawing order.
3. Seamless tooling and its threshold (S3.3), the quad editor.
4. Moon/gradient in the sky; audio; large galleries (texture LOD); mobile floor
   (lowest phone at 30 fps); game/VM nodes and their sandbox; multiplayer.
5. Moving works (S5.2): sound; a shadow box for machines; keystone for the
   projector; whether two projectors may share a wall; the cost of a machine frame on
   a phone (cap of two animated machines is a guess).
6. **Verification debt**: frame rate on a phone (numbers here are CPU only); the
   spot light budget; Hyperfy/Hubs not run; WebGPU usage percentages.

---

## 10. Plan (version 1)

| Step | What | Done when |
|---|---|---|
| Q1 | `scene3d` document step (plan, style, start), validation and sanitiser; `node_photos.role` | a gallery doc round-trips through save/load; bad styles rejected |
| Q2 | `client/gallery/build.js`: wall meshes per compass face (mitred), room and corridor floors, ramps, texture set with default quads (homography warp); unit-tested without a DOM | 200 x 50 plan builds in under 100 ms; tests check triangles and UVs |
| Q3 | Vendor three.js 0.186.1 (`module`, `core`, `PointerLockControls`); lazy `import()` on enter; starfield; lights | nothing loads until a gallery is entered |
| Q4 | Walk: pointer lock + WASD, stick + drag-look, circle-segment collision, floor height | cannot walk through a wall on desktop or phone |
| Q5 | Auto-hang child nodes (S5.1) with tiles; tap to approach/open | the exhibits of a test gallery appear in edge order |
| Q6 | Enter/leave host: poster, one live context, dispose, context loss, viewport-fill | enter and leave 20 times without leaking contexts |

After version 1 (moving works, S5.2; editor side `EDITOR.md` phase N):

| Step | What | Done when |
|---|---|---|
| Q7 | `projector.js`: prop, beam, screen, cross-fade shader, two-slot rule, collision circle | a slide node shows a projector throwing its photos, one slide at a time |
| Q8 | `machine.js`: canvas renderer over `motionAt`, static layers, the budget of two, tap to start | a node with motors turns on the wall at 20 frames per second, the rest still |
| Q9 | motion budget, reduced motion, no flashing, hidden-tab pause | with the system setting on, every moving work stands still |

Later (not scheduled): the deferred list of S0b.

## 11. Sources

- three.js: <https://github.com/mrdoob/three.js> (MIT; version, size and add-on
  file facts from the npm registry and the jsDelivr package listing, 0.186.1).
- Babylon.js: <https://github.com/BabylonJS/Babylon.js> (Apache-2.0); PlayCanvas:
  <https://github.com/playcanvas/engine> (MIT); A-Frame:
  <https://github.com/aframevr/aframe> (MIT).
- Helpers on npm: `three-mesh-bvh`, `three-pathfinding`, `recast-navigation`,
  `earcut`, `polygon-clipping`, `@dimforge/rapier3d-compat`, `clipper-lib` (BSL).
- Projects: <https://github.com/Hubs-Foundation/hubs>,
  <https://github.com/Hubs-Foundation/Spoke>,
  <https://github.com/hyperfy-xyz/hyperfy>, <https://github.com/stfurkan/gez>,
  <https://github.com/PaulleDemon/art-museum>,
  <https://github.com/3DStreet/3dstreet>, <https://github.com/copy/v86>,
  <https://github.com/leaningtech/webvm> (stars, licences and push dates from the
  GitHub API).
- Mozilla Hubs shutdown notice: <https://hubs.mozilla.com/labs/sunset> [s].
- WebGL context limit: Chromium code review 14217005 and WebKit
  `LayoutTests/webgl/max-active-contexts-*` [s].
- iPhone Fullscreen API: WebKit bugs 206854 and 310661 [s].
- WebGPU support: <https://web.dev/blog/webgpu-supported-major-browsers> and the
  Khronos SIGGRAPH 2026 WebGL/WebGPU update [s].
- Edel Museum Generator: <https://wordpress.org/plugins/edel-museum-generator> [s].

### Reproducing the measurements

`tools/gallery-warp.mjs` (`bun tools/gallery-warp.mjs`) times the quad-to-square
warp of S3.3 and checks the convexity test.

`walls.mjs` (scratchpad `gal/t/`, `bun add three@0.186.1`) builds wall ribbons
from random polylines, a floor with `ShapeGeometry`, and times a circle-vs-segments
push-out for 1 000 frames; run with `bun walls.mjs`. Package sizes: `curl` of the
jsDelivr files for three@0.186.1 piped through `wc -c` and `gzip -9`. Numbers are
CPU-side on this machine; GPU frame rate on phones was **not** measured.
