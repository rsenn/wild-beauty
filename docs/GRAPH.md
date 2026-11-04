# GRAPH.md - graph rendering, graph transport, database options

Status: research, revised 2026-10-22 with the domain information (shallow rooted traversal, one editor at a time, ~100 nodes per user). Nothing here is built; it feeds a later milestone
(graph view) and decisions about the database. Related: `GALLERY.md` (a node's tile can host a walkable 3D gallery), `PLAN.md` S8 (current
SQLite schema, `node_links`), `DESIGN.md` S7.4 (graph look), S4.2 (old model),
the screenshots `docs/screenshots/graph-mobile-{overview,zoomed}.jpg`.

How to read the claims. Each fact carries how it was established:

- **[v]** verified first hand: npm registry, GitHub API / LICENSE file, a script
  run on this machine, or the library's own documentation page.
- **[s]** secondary: a blog, vendor comparison or aggregator; plausible, not checked.
- **[?]** not researched or not found; do not rely on it.

Vendor blogs (ArcadeDB, Galaxy, Vela, ...) argue for their own product; they were
used for pointers only. Dates are as of 2026-10-22.

---

## 0. Summary and recommendations

1. **Renderer.** Start with **Preact SVG + `d3-force` + `d3-zoom` + `d3-drag`**
   (d3 as small ISC modules, not the d3 bundle). It matches the project: CSS
   tokens (`--wb-*`) style SVG directly, so graph nodes are themable per theme
   and per node; it can be server-rendered; touch pinch/pan/drag come from
   `d3-zoom`/`d3-drag`. Measured on this machine: SVG holds about **60 fps up to
   ~500 nodes and ~40 fps at 2 000** while zooming, and 57 fps at 2 000 nodes
   while every node moves (S2.2). Keep the model and the renderer
   separate so a **canvas** renderer (about 5000 nodes) or **Sigma.js (WebGL)**
   can replace the SVG one when the graph outgrows it. Fallback if we want
   edge-drawing, compound nodes and many layouts "for free": **Cytoscape.js**.
2. **Transport.** The cost is not "many queries". For 10 000 nodes / 15 000
   links SQLite builds the whole graph JSON in **7-13 ms** in one or two
   queries (S3.1). What grows is **payload** (1.8 MB raw, 411 KB brotli at 10k
   nodes) and **layout time** (d3-force: 56 ms per tick at 10k nodes, 5 ms at
   1k). So: one `GET /api/graph` returning a compact **skeleton** (no node
   documents), cached by revision with an ETag and served pre-compressed;
   live changes as small **operations** over a Bun WebSocket (pub/sub verified).
   Persist node positions so the browser does not have to run the layout.
3. **Database.** A **graph database is not needed** for the sizes in scope. Plain
   relational tables with recursive CTEs answer every traversal we need in
   microseconds (S4.2). Decision proposed: **stay on SQLite for the PoC, keep all
   SQL in one module, and plan PostgreSQL as the scale-out step** (users,
   sessions and profiles in the same database; Bun has a built-in Postgres
   client). If native graph traversal is wanted later: Postgres + Apache AGE,
   or SurrealDB (accept its BSL licence), or ArcadeDB / Dgraph (Apache-2.0).
   Avoid products whose licence restricts normal use (FalkorDB SSPL, ArangoDB
   Community cap and BUSL, Neo4j NVL).
4. **Surprises worth knowing.** SQL/PGQ (standard graph queries in SQL) was
   **reverted from PostgreSQL 19** shortly before release (S4.3); the embedded
   graph database Kuzu was **archived** in Oct 2025 (forks exist); Neo4j's
   visualisation library may **only be used with Neo4j products**.

5. **Domain facts (2026-10-22) that reshape the answer.** The graph is traversed
   **shallowly from a root** (a user sees their root and adjacent lists/trees to
   some depth), only **one node is edited at a time** (all other tiles are
   read-only), and a user owns about **100 nodes** (4 albums, 20 projects, 50
   articles, 2 galleries, a few shop items). So the scale is *many users x ~100
   nodes*, not one giant graph: the **visible set is tens to a few hundred
   nodes** and SVG is clearly enough; the transport is a **rooted,
   depth-limited neighbourhood fetch** (2 ms and 13 KB at depth 2 with 1 M nodes
   in the database, S3.1b), not a whole-graph snapshot. Canvas/WebGL is only
   needed for a zoomed-out "landscape" of many roots.

Open questions that change the answer are in S5.

---

## 1. What the graph has to do

From `PLAN.md`, `DESIGN.md` S7 and the screenshots:

| Need | Detail |
|---|---|
| Look | Rounded-square nodes, 3 px black outline, flat saturated fill (from the node palette), pixel-font label; thin straight edges; node size follows zoom (`DESIGN.md` S7.8) |
| Interaction | zoom, pan, **reorder**, **relink**, select, open a node; on phones (touch, pinch) as in the screenshots |
| Theming | every colour/font/shape is a `--wb-*` token; a **node can wear its own theme** (`PLAN.md` S16); the graph chrome must follow |
| Stack | Bun server, Preact without JSX/bundler, vendored ES modules, no CDN (`PLAN.md` S2); SSR where it helps |
| Data | `nodes` (id, title, palette, doc, ...) and `node_links(from, to, label NOT NULL)`; photos separate (`PLAN.md` S8) |
| Scale | **per user ~100 nodes** (S1.1); the database holds many users (10 000 users = 1 M nodes is the test size). The browser never needs all of it: it shows a **rooted neighbourhood** (tens to ~200 nodes). 1k/10k/100k browser-side figures below stay as the safety margin |
| Editing | **one** node editor at a time; every other tile is a read-only rendering (cheap: no tools, no listeners) |
| Traversal | shallow: root + adjacent lists/trees to depth 1-3, **expand on demand** by tapping a node/list |

### 1.1 The typical user's space (brainstorm, 2026-10-22)

```
root
 +-- 4 albums            (1 node each; photos inside the node)
 +-- projects list       (20 nodes, one per project)
 +-- blog list           (50 nodes, ordered: sequential articles)
 +-- gallery public      (10 exhibits, 1 node each)
 +-- gallery hidden      (10 exhibits, visible to the owner only)
 +-- shop list           (auction / fleamarket / checkout items, 1 node each;
                          each has a `sells` link to a gallery exhibit)
```

About 105 nodes and 158 links per user. Two kinds of edge appear: **ordered
`child` edges** (list membership, carry `sort`) and **cross-links** such as
`sells` (any node to any node, no order). A node may have several parents
(an exhibit is a child of its gallery and the target of a shop item). The user
also arranges the wider "landscape" of their virtual space. The shared
landscape is a graph too (decided 2026-10-22): one **overall-root** with a child
`user-profiles` (ordered `ref` edges to every user's profile node, which is a
direct child of that user's root) and a child `featured` (curated `ref`/`child`
edges to articles, galleries and seller marketplaces). Everyone starts there and
walks down; there is no plane on which roots are placed freely.

"Reorder" and "relink" mean (decided): **move** a node, **pin** it in place,
**order** it among siblings, and **add/remove edges**.

### 1.2 Edge kinds (decided)

All edges are directed (`from` -> `to`), the label is a small vocabulary, not free text.

| Label | Meaning | Order | Example |
|---|---|---|---|
| `child` | containment: the target is a member of the source list/album/gallery | yes (`sort`) | blog -> article 17; album -> photo node; gallery -> exhibit |
| `sells` | an offer points at the thing sold | no | shop item -> gallery exhibit |
| `at` | a node was made at / belongs to a place (S1.5); target is a node under `places`; no order | no | photo node -> place "Zürich" |
| `ref` | any other reference ("see also"), possibly across users; ordered (`sort`) when the source is a list | list: yes | project -> related article; `user-profiles` -> profile; `featured` -> gallery |

Decided 2026-10-22: `child`, `sells`, `ref`; `at` added 2026-10-29 for places (S1.5). Candidates for later, only when a feature needs them: `cover` (list -> its
representative node), `series` (project -> its next part), `reply` (comment).
A node may have several `child` parents (an exhibit is also reachable from the
shop). An edge is visible to a viewer only when **both** ends are visible to them
(S3.6). Cross-user edges are allowed when the editor may see the target.

### 1.3 Visibility

Edit rights: the **owner**, or an **admin or curator of the node's group** (`group_members.role`: `member` < `curator` < `admin`; curators arrange links and order, admins also edit content and members);
members and the public only read. Three visibility levels per node: **hidden** (owner only), **group** (every member of one
invite-only group named on the node), **public**. Groups are owned by a user;
membership is by invitation. This is a per-row filter in every traversal.

### 1.4 Seeded structure (decided 2026-10-29)

`tools/seed.js` creates the starting landscape; running it twice changes nothing
(nodes are found by title below their parent). "Group" in this file means an
**access group** (S1.3); the three below are **category nodes** (kind `list`) under
the overall-root, not groups.

```
overall-root
 +-- user-profiles, featured     (12.6)
 +-- art exhibition   list  -child-> gallery -child-> exhibition (list, or kind gallery = 3D walk)
 +-- fleamarket       list  -child-> seller -child-> item (kind shop)   (item -sells-> exhibit when it is one)
 +-- places           list  -child-> place (one node per locality)
```

Seeded nodes are owned by nobody (`owner_id` NULL) and public; with accounts the
admin user takes them over. The seed holds only the skeleton and a few sample places,
real galleries, sellers and items come from users.

### 1.5 Places and photo location (decided 2026-10-29)

Interlinking nodes by where their photos were taken, without ever publishing a
position.

1. **The photo stays clean.** `bake` strips all metadata (EDITOR.md S4); a
   published photo carries no GPS. The position is read once, at ingest, from the
   EXIF that `probe.js` already puts in the sidecar, and is used only to *suggest* a
   place. Camera captures in the app (`getUserMedia`, canvas) have no EXIF; a
   capture through a file input may, and is treated like any upload. A location for
   a camera photo is asked for with `navigator.geolocation` when the user turns on
   "tag location", then it feeds the same suggestion. Stripping is the same on every
   path.
2. **Suggest, never auto-link.** The **node editor** shows a non-modal chip when a
   photo of the open node has a position ("taken near Zürich - link to place") and
   makes the edge only when accepted (`POST /api/graph/ops`, op `link`, label `at`).
   The **graph editor** has the bulk form: a "suggest places" view listing every
   node of the user with a pending suggestion, accept or dismiss each. Edges are
   made in one place (the ops endpoint), whichever view asks.
3. **Places are coarse.** A place node stands for a named locality or a rounded cell
   (about 1 km); exact coordinates are never stored.
   A place is titled `Name (KT)` by the **municipality** the federal geoportal says the
   rounded position lies in (`identify` on swissBOUNDARIES3D at `api3.geo.admin.ch`,
   free, no key; the canton in the title tells apart the many municipalities of one
   name). The request goes from the server, never from the browser, carries only the
   position already rounded to ~1 km, and is made once per cell: the answer is kept in
   `place_names` (migration 3; a cell outside Switzerland is kept as "none"). Without an
   answer (offline, `WB_GEO_API=off`) the offline gazetteer names the place, and
   failing that the cell, titled by its coordinates. Deployments that do not want any
   outside request set `WB_GEO_API=off`; a mirror's URL goes in the same variable. Place nodes are found or
   created below `places` when a suggestion is accepted. The sidecar position is
   dropped from `uploads/` when the node is saved or the upload expires. At save the rounded positions of the node's uploads are kept as
   **suggestions** in `place_suggestions(node_id, lat, lon)` (migration 2) until the owner
   links or dismisses them in the graph editor (`/api/places/suggestions`); a row goes with
   its answer or with its node, and nothing else stores a position.
4. **Privacy.** An edge is visible only when both ends are (S1.2), so a public node
   linked to a public place would announce where it was made. Therefore an `at`
   edge is **owner-only until the owner publishes it** (a per-edge `visibility`,
   default `hidden`; migration 5, with accounts). In the PoC, without accounts, the
   chip is shown but the edge stays out of the public graph view.
5. **Dismissed suggestions are remembered** (per node and place) so the chip does not
   come back.
6. **Housekeeping (decided 2026-10-29).**
   - Places that a cell title names ("47.27, 8.01") are one place with the cells that touch
     them (about 1.6 km, diagonals included), so a village on a cell edge does not split;
     a place named by municipality or gazetteer is never snapped.
   - Migration 4 renamed the places the old gazetteer had made ("Zürich") to `Zürich (ZH)`,
     merging into an existing one where both existed.
   - Nodes saved before migration 2 have **no suggestions and will not get any**: the
     position was stripped from the baked photo (point 1), so nothing is left to read.
     Uploading the original again brings it back.
   - The chip (E137) is a prompt of the moment, its *Not now* is per browser. The panel
     (E140) is the durable list: what was not linked in the editor is still there.
   - A suggestion whose node is already linked to the place is deleted when the panel is
     opened, so no row outlives its answer.


### 1.6 Swiss data sources (researched 2026-10-29)

What the federal geoportal and the open-data catalogues offer for venues, culture and
places. **Verified** = called live on 2026-10-29; **unverified** = from documentation or
search results only. All federal geodata is open government data (free, attribution);
the KGS and ISOS collections are marked "proprietary" in STAC, so read their terms
before storing or republishing (ISOS plans, texts and photos are (c) BAK).

| Source | What it gives | Status |
|---|---|---|
| `api3.geo.admin.ch/rest/services/all/MapServer/identify` | features of a layer at a point; needs `mapExtent` and `imageDisplay`; `tolerance` is in **pixels**; layers `all:<id>` | verified |
| layer `ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill` | municipality, canton, BFS number; also returns boundaries of earlier years, keep `is_current_jahr: true`; ambiguous names already carry the canton (`Buchs (SG)`) | verified, **used** (S1.5) |
| layer `ch.babs.kulturgueter` (KGS inventory) | about 3,400 cultural objects of national importance (buildings, museum, archive and library collections): `kgs_nr`, `beschreibung`, `gemeinde`, `kanton`, `kgs_kategorie`, `x`, `y`; the map shows only the A objects | verified, not used |
| `api/SearchServer?type=locations&origins=gazetteer` | swissNAMES3D names (Kunsthaus Zürich, Aargauer Kunsthaus), typed coarsely ("Leisure park"); the default origins return only municipalities and cantons | verified, not used |
| `api/MapServer?searchText=` | layer catalogue by keyword | verified |
| `height?easting=&northing=&sr=2056` | elevation in metres | verified, not used |
| layer `ch.bak.bundesinventar-schuetzenswerte-ortsbilder` (ISOS) | federal inventory of heritage sites with photos | listed in STAC; an `identify` on this id returned nothing, the working layer name is **unknown** |
| `data.geo.admin.ch` STAC API | bulk downloads: swissNAMES3D (400k+ names), swissBOUNDARIES3D | unverified |
| opendata.swiss (CKAN) | museum statistics (BFS), museums and sights of the Zürich region (Zürich Tourismus), Geneva museums, event calendar of the Basel museums (RSS) | unverified |
| MySwitzerland open data API | about 4,000 destinations and 5,000 experiences, up to 16 languages | unverified, source from 2020 |
| swisscollections, Memobase (`api.memobase.ch`) | library and archive metadata, audiovisual archives | unverified |

Fair use: one mirror's FAQ gives 20 requests a minute averaged (secondary source). No API
key. The tasks that build on this are TODO.md 12.6d-12.6f.

---

## 2. Graph renderers

### 2.1 The candidates

Versions, licences and sizes from the npm registry and GitHub on 2026-10-22 [v].
"Unpacked" is the npm tarball size (incl. sources and typings), not the
minified browser bundle.

| Library | Version | Licence | Draws with | Built-in interaction | Fit for us |
|---|---|---|---|---|---|
| **d3** (`d3-force`, `d3-zoom`, `d3-drag`, `d3-quadtree`) | d3 7.9.0 (2025-05); force/zoom/drag 3.0.0 (2022-06); 87 / 85 / 42 KB | ISC | nothing: layout and gesture maths; you draw (SVG, Canvas, DOM) | zoom incl. pinch, drag, quadtree hit-testing | **Best fit.** Tiny, stable (no releases since 2022 for the parts we need), ESM files that `tools/vendor.sh` can vendor. We write the node/edge rendering, which we want anyway for theming |
| **Cytoscape.js** | 3.34.4 (2026-10); 5.6 MB; extension `cytoscape-edgehandles` 4.0.1 | MIT | Canvas; **WebGL renderer is a preview** since 3.31 (Jan 2025) [v: project blog], not all styles supported | pan/zoom/drag/select, touch, layouts, ~70 extensions; `edgehandles` = drag-a-handle-to-create-edge [v: npm/README] | Best "batteries included" choice. Styling is its own JS stylesheet, not CSS vars; no SSR; heavier |
| **Sigma.js** + **graphology** | sigma 4.0.3 (2026-10-15), graphology 0.26.0; 3.3 MB / 2.7 MB | MIT | WebGL | camera zoom/pan, events; layouts in `graphology-layout-*` (ForceAtlas2 in a worker, 0.10.1) | Best scaling renderer that we do not have to write. Rounded squares and a pixel-font label need custom node/label programs; no edge-creation tooling; theming happens in JS/shaders |
| **force-graph** (vasturiano) | 1.52.0 (2026-09); 6.3 MB | MIT | Canvas, d3-force engine | zoom/pan, node drag, hover/click; custom nodes via `nodeCanvasObject`; no link-creation API; touch not documented [v: README] | Good for a one-day prototype of the look |
| **cosmos.gl** (`@cosmos.gl/graph`) | 3.5.1 (2026-10-16); 5.1 MB | MIT | WebGL2 (luma.gl), **GPU force layout** | drag, pinch-zoom, hover; typed-array input (`Float32Array`); no label rendering [v: README] | Only if we ever reach 100k+ nodes. WebGL caveats: older iOS (15.4+) lacked an extension for the many-body force (README says latest iOS works again); Android needs float textures. OpenJS incubating project [s] |
| **vis-network** | 10.1.2 (2026-08); 82 MB unpacked (!) | Apache-2.0 OR MIT | Canvas | physics, drag, clustering, a "manipulation" mode with add-edge [s: PkgPulse guide] | Works, old-style; large package, own look |
| **AntV G6** | 5.1.1 (2026-09); 7.4 MB | MIT | Canvas, SVG or WebGL via `@antv/g` | `create-edge` and `drag-element` behaviours built in [v: docs] | Feature-rich; large API; not checked against a no-bundler setup |
| **React Flow** (`@xyflow/react`) | 12.12.0; 1.2 MB | MIT | HTML/SVG | node-editor boxes with handles; depends on d3-zoom, d3-drag, zustand | React-specific; built for node editors, not force graphs. Preact compatibility not found [?] |
| **Reagraph** | 4.32.0 | Apache-2.0 | three.js (WebGL) | | React-only; no |
| **Orb** (Memgraph) | 1.1.0 (2026-09); 1.0 MB | Apache-2.0 | Canvas or WebGL | force-directed (CPU/GPU), hierarchical, circular, grid; plain `{nodes, edges}` arrays [v: README]; small project (about 430 stars) | Generic despite the owner; an option if we want a ready layout set |
| **Neo4j NVL** | 2.0.0 (2026-10-21) | **Neo4j licence: may only be used with Neo4j Aura or Neo4j's commercial products** [v: LICENSE.txt] | | | **Excluded** |
| yFiles, KeyLines/ReGraph, Ogma | | commercial | | | not researched [?] |

### 2.2 What the browser can draw: measured

Headless Chrome 155, software rendering (no GPU), 8 cores, an 800 x 600 view,
nodes drawn as rounded squares with a 1-character label; mean ms per frame over
35 frames (16.7 ms is the 60 fps cap). Indicative only: a GPU raises everything,
a phone lowers it. Script: scratchpad, see "Reproducing" at the end.

All nodes moving every frame (a running force simulation):

| Nodes | SVG `<g>` + rect + text | SVG rect only | Canvas 2D | Canvas 2D + labels |
|---:|---:|---:|---:|---:|
| 500 | 16.7 | 17.1 | 16.7 | 16.7 |
| 2 000 | 17.6 | 16.7 | 16.7 | 17.1 |
| 5 000 | 35.2 | 34.8 | 28.1 | 34.8 |
| 10 000 | 79 | 103 | 59.5 | 72.9 |

Static nodes, the view panned and zoomed every frame (what a user does most):

| Nodes | SVG (transform on a parent `<g>`) | Canvas 2D (full redraw) |
|---:|---:|---:|
| 500 | 18.1 | 16.7 |
| 2 000 | 24.3 | 16.7 |
| 5 000 | 65.2 | 33.3 |
| 10 000 | 150 | 91.4 |
| 20 000 | 342 | 126.7 |

Layout cost on the CPU (`d3-force`, link + many-body Barnes-Hut + centre, one
thread, Bun): **5.1 ms/tick at 1 000 nodes, 55.9 ms/tick at 10 000**; settling
takes about 300 ticks, so 1.5 s at 1k and **17 s at 10k**. This is why positions
should be stored (S3.5) and why the 100k case needs a GPU layout (cosmos.gl) or a
precomputed layout, not more clever rendering.

Reading the numbers:

- SVG is smooth to about **500-1 000 nodes** and usable (about 40 fps while
  zooming) at **2k**; Canvas holds 60 fps to 2k and about 30 fps at **5k**; beyond
  that WebGL (Sigma.js, cosmos.gl). The crossover is where the extra work of writing a canvas
  renderer pays off; on a GPU the SVG limit is likely a little higher.
- During pan/zoom SVG re-rasterises; do not animate all nodes while zooming.
  Stop the simulation when it has settled (`alpha` below a threshold).
- Semantic zoom (label and thumbnail only when zoomed in, like the screenshots
  where node size follows zoom) lowers the work per node; it is cheap in both.

### 2.3 Theming and server rendering decide more than raw speed

- **SVG/HTML nodes** take the CSS tokens directly: `fill: var(--wb-node-fill)`,
  `rx: var(--wb-radius-node)`, `stroke-width: var(--wb-node-outline)`. A node with
  its own theme (`data-theme` wrapper) works with no extra code, and the first
  paint can be **server-rendered SVG** from stored positions (no flash, usable
  without JavaScript, links are real anchors, focus and screen readers work).
- **Canvas** cannot see CSS variables. The renderer must read them with
  `getComputedStyle` once per theme change and redraw; per-node themes need one
  lookup per theme.
- **WebGL** (Sigma, cosmos.gl) needs shaders or node programs for rounded squares
  with outlines and a bitmap font; theme values are passed as uniforms.

### 2.4 Interactions we need and who supports them

| Interaction | With `d3-zoom`/`d3-drag` on SVG | Cytoscape.js | Sigma.js | G6 |
|---|---|---|---|---|
| zoom / pan, wheel, pinch, double-tap | built in (`d3-zoom`; set `touch-action: none`) | built in | built in camera | built in |
| drag a node (touch included) | `d3-drag` | built in | via events (documented recipe) [?] | `drag-element` |
| **relink** (drag from a node to another to make an edge) | ours: pointer capture + quadtree hit test, preview line; about 100 lines | `edgehandles` extension | ours | `create-edge` |
| **reparent / reorder** (drop a node on another) | ours: drop target highlight, then an operation | ours | ours | `drag-element` link mode |
| delete an edge | click/tap on an edge (a wide transparent hit path) | built in | ours | built in |
| accessible focus, keyboard | native for SVG/HTML | no (canvas) | no (canvas) | partial |

### 2.5 Is there a bridge between the database and the renderer?

- **Nothing for SQLite or Postgres.** The universal exchange is two arrays:
  nodes and edges. Cytoscape takes `elements`; Orb takes `{nodes:[{id,label}],
  edges:[{id,start,end,label}]}` [v]; graphology has a documented serialisation:
  `{attributes, options, nodes:[{key,attributes}], edges:[{key,source,target,attributes}]}`
  with `export()`/`import()` [v: docs]; `force-graph` takes `{nodes, links}`.
  Converting our rows to any of them is a few lines.
- **Database vendors ship their own viewers**, aimed at administrators: Neo4j
  (Bloom, NVL, `neovis.js`), Memgraph (Lab, Orb), ArangoDB (built-in graph viewer),
  SurrealDB (Surrealist), Apache AGE (AGE Viewer) [s/?]. Only Orb is reusable
  as a generic Apache-2.0 library; NVL is not.
- **Streaming across a server.** Nobody offers a ready "stream the stored graph
  into the renderer" layer; the pattern is: snapshot over HTTP plus operations
  over WebSocket/SSE (S3). Cosmograph's engine takes typed arrays, which suits a
  binary snapshot if we ever need one.

### 2.6 Recommendation for the renderer

1. **PoC / graph view v1**: Preact components render SVG (`GraphView`, `GraphNode`,
   `GraphEdge`); `d3-force` computes positions off the render path (update `transform`
   attributes directly on each tick, not through Preact state); `d3-zoom` and
   `d3-drag` handle gestures. Vendor `d3-force`, `d3-zoom`, `d3-drag`,
   `d3-quadtree`, `d3-selection` (and their few d3 dependencies) via `tools/vendor.sh`.
2. **Keep the seam**: a plain graph model (`nodes`, `edges`, positions) plus a
   renderer interface (`mount`, `update`, `setTransform`, `hit-test`). Then:
   - 2k to 5k nodes: Canvas renderer reading tokens through `getComputedStyle`;
   - 5k and up: Sigma.js + graphology (positions from our layout), custom node program.
3. **Cytoscape.js** is the exit if we decide not to write interaction code
   ourselves (relink via `edgehandles`, compound nodes, algorithms); we would give
   up CSS theming and SSR for it.
4. Prototype first with `force-graph` if a look-and-feel demo is wanted within a day.

### 2.7 Two views: force graph to organise, branch view to navigate (decided 2026-10-22)

The force-directed graph (2.6) is for **organising** and overview: move, pin,
relink, see the shape. **Navigating content** is a second view on the same
rooted data, which shows only the **local graph** around a focus node:

- A **spine**: the focus node's run of siblings (an ordered list: articles,
  projects, a gallery) as square tiles on a straight line that starts at the
  top centre of the screen and runs down to the lower left at a fixed angle
  (about 33 degrees).
- **Branches**: the children of a tile leave the spine to the lower right at
  about 45 degrees, again as a run of tiles.
- **Touch**: a tile touched is zoomed in (opened read-only; editing is the single
  editor, 8.1). Touching toward the **lower left** walks along the spine (the
  outer edge of the branch, previous/next); touching toward the **right** descends
  into a branch, which becomes the new spine. Going back up is the reverse.
- Long runs and categories may instead be shown as a **filmstrip/carousel** or a
  **masonry** grid (a list divided into categories: one masonry block per
  category). Which presentation a list uses is a property of the list node
  (`kind`/style in its doc), not of the viewer.

Why this is cheap: the layout is **computed, not simulated**. Position `i` on
the spine is `origin + i * step * (cos a, sin a)`, a branch starts at its parent
tile and uses the second angle. There is no force layout, no ticks, no
dependency; it is deterministic, so it can be **server-rendered** and animated
by moving one CSS/SVG `transform` (the "camera") with a transition. Only a
window of the list around the focus is fetched and drawn (`offset`/`limit`,
S3.6), so a 50-article list costs about 10 tiles. Tiles are the read-only
renderings from S3.7 (palette colour until server tiles exist).

Decisions/assumptions to confirm: the two angles are `--wb-*` tokens
(`--wb-branch-spine-angle`, `--wb-branch-fork-angle`), measured from the
vertical (steep on a portrait phone; change the token if you meant from the
horizontal); the same data and the same API serve both views; a node with several
parents is shown under the parent the user came from; `sells`/`ref` edges appear
as a second branch kind (a different side or marker) so they stay distinct from
`child` order.

---

## 3. Getting the stored graph to the browser

### 3.1 What actually costs time (SQLite, `bun:sqlite`, in memory)

Graph with N nodes and about 1.5 N links; nodes have a 20-photo-step document
column of about 700 bytes that the graph does **not** need [v: scratchpad script].

| N nodes / E links | A: 2 queries + `JSON.stringify` | B: one `json_group_array` query | C: B with row arrays | D: cached string | payload A / C | C gzip / brotli | client `JSON.parse` | graphology build |
|---|---:|---:|---:|---:|---|---|---:|---:|
| 1 000 / 1 478 | 1.2 ms | 0.7 ms | 0.6 ms | ~0 | 176 KB / 131 KB | 54 / 42 KB | 0.3 ms | 7 ms |
| 10 000 / 15 135 | 13.1 ms | 8.4 ms | 6.5 ms | ~0 | 1.8 MB / 1.4 MB | 543 / 411 KB | 4.3 ms | 43 ms |
| 100 000 / 151 523 | 127 ms | 87 ms | 84 ms | ~0 | 18.7 MB / 14.1 MB | 5.6 MB / 4.0 MB | 76 ms | 329 ms |

Conclusions:

- **The number of queries is irrelevant** (two queries vs one: ms). The real
  mistakes to avoid are the **N+1 pattern** (one query per node) and sending the
  documents (`doc`) with the graph.
- The browser-side layout, not the transfer, is the slow part (S2.2).
- Up to about 10k nodes a single compressed JSON response is fine (411 KB brotli).
  At 100k it is 4 MB: then use level-of-detail (S3.3) or a binary format.
- Local traversal queries are cheap too (recursive CTE, same machine, 1 M nodes /
  1.5 M links): ancestors of a node 0.03 ms, 2-hop neighbourhood 0.05 ms; the
  **entire subtree** from the root: 17 ms at 10k nodes, 158 ms at 100k, 3.5 s at 1 M.

### 3.1b Measured for the real shape: many users x ~100 nodes

10 000 users x ~105 nodes = **1.05 M nodes, 1.58 M links** in one SQLite
database (per-user model of S1.1: root, 4 albums, 20 projects, 50 ordered
articles, two galleries of 10 exhibits, 5 shop items with a `sells` link).
Schema: `nodes(id, owner_id, title, color, tile, visibility, x, y, kind, doc)`,
`links(from_id, to_id, label, sort)`; indexes `links(from_id, sort)`,
`links(to_id)`, `nodes(owner_id)`. Query: recursive CTE from the root, depth
limited, visibility filtered, with the child count per node, returning JSON
[v: scratchpad `gbench/landscape.mjs`, `bun:sqlite`]:

| Request | Time | Nodes / edges | Payload raw / brotli |
|---|---:|---|---|
| owner, depth 1 (root + its lists) | 0.08 ms | 10 nodes | 1.1 KB / 0.4 KB |
| owner, depth 2 (+ list members) | 2.3 ms | 106 / 158 | 13.4 KB / 3.1 KB |
| owner, depth 3 | 2.6 ms | 174 | 19.4 KB |
| stranger (public only), depth 2 | 1.9 ms | 95 | 12.1 KB |
| window of 10 articles at offset 20 | 0.001 ms | 10 | - |
| reorder (shift 30 siblings) | 0.014 ms | - | - |
| node count of one owner | 0.004 ms | - | - |

Reading: a first screen costs **under 3 ms and 3 KB compressed** regardless of
the 1 M rows around it; the database size does not matter, only the
neighbourhood. Building the test data took 7.5 s. Ordered lists never need to be
sent whole: send the first window and the child count (`+40`), page on scroll.

### 3.2 Options

| Option | Idea | Verdict |
|---|---|---|
| a. One query per node/edge (N+1) | the "many queries" worry | never |
| b. Two queries, assembled in JS | `SELECT ... FROM nodes`, `SELECT ... FROM links`, `JSON.stringify` | fine to 10k nodes (13 ms); simplest; start here |
| c. One query that returns the JSON text | `json_object('nodes', (SELECT json_group_array(...)), 'edges', ...)` | 30-50% faster, zero JS assembly; SQLite-specific (Postgres: `jsonb_agg`/`json_build_object`) |
| d. **Cached snapshot** | build once per revision, keep the string (and its brotli/gzip) in memory, `ETag: "<rev>"`, answer `304` | **Recommended**: reads cost nothing; one writer path bumps `rev` |
| e. Compact format | row arrays `[id, title, colour, thumb, x, y]` and `[from, to, label]`, not objects | 25% smaller raw, and compresses better; recommended with (d) |
| f. Binary/typed arrays | `Uint32` ids, `Float32` positions, edges as index pairs, strings in a table | needed only at 100k+ (cosmos.gl wants `Float32Array` anyway); estimate, not measured |
| g. **Rooted neighbourhood (expand on demand)** | `GET /api/graph?root=&depth=` returns the nodes within depth n, with a child count per node; tapping a node/list fetches the next ring | **Recommended for this app** (S3.1b: 2 ms, 3 KB); replaces the snapshot as the main read. The snapshot (d) stays for the optional landscape view |
| g2. Viewport / LOD | send the cluster summary, fetch what is on screen | only for a huge flat graph (100k+); not our shape |
| h. Database in the browser | SQLite-wasm, DuckDB-wasm, Kuzu/Ladybug wasm, CozoDB, SurrealDB wasm engine | not for this app: ships the whole store and bypasses permissions |
| i. GraphQL / Hasura (the old stack) | nested query, the engine builds one SQL | worked before; adds a service; no advantage over (c)/(d) |

### 3.3 Skeleton, documents, and level of detail

(With the rooted fetch of S3.1b the skeleton below is the payload of one
neighbourhood, not of the whole database; "visible" below means "fetched".)

- **Graph skeleton** (always): id, title, colour (`padding`/palette), thumbnail
  hash, x, y, and edges `(from, to, label)`. About 130 bytes per node row.
- **Node documents and photos** never travel with the graph. The viewer fetches
  `GET /api/nodes/:id` when a node is opened and thumbnails from
  `/files/photos/<hash>.thumb.jpg` only for nodes that are on screen and large enough.
- **Semantic zoom** (zoomed out: coloured square only; mid: label; in: thumbnail)
  keeps both the work and the requests proportional to what is visible. With a
  quadtree (`d3-quadtree`) the visible set is found without scanning all nodes.
- If one day the graph exceeds ~20k nodes: send clusters first (precomputed
  community/subtree summaries), refine on zoom.

### 3.4 Live changes

Relink, reorder and rename are small. Send **operations**, not snapshots:

```
POST /api/graph/ops   { baseRev, ops: [ {op:'link', from, to, label}, {op:'unlink', id},
                                         {op:'move', id, x, y}, {op:'retitle', id, title} ] }
WS   /api/graph/live  -> { rev, ops }  (every connected client)
```

- Bun's WebSocket `subscribe`/`publish` was tested here: one `server.publish`
  reached all three subscribers, including the sender [v: scratchpad script]. SSE
  is the simpler alternative if clients only listen.
- One transaction per batch bumps `rev`; the cached snapshot is rebuilt lazily
  on the next read (or patched in place); `ETag` becomes the new `rev`.
- Client applies ops optimistically to its model; on a `rev` gap it refetches the
  snapshot. Conflict policy for the PoC: last writer wins per field.

### 3.5 Positions

**Positions, what "global" meant.** In the first draft the question was *where a
node's coordinates live*: (a) **global**, on the node itself, so every viewer
sees the same arrangement; (b) **per context**, on the edge or relative to a
parent (an exhibit sits at one place in its gallery and at another near the shop
item that sells it); (c) **per viewer**, an override only that viewer sees.
Given S1.1 the proposal is: coordinates are **owner-defined, stored on the node
in the owner's space** (`x, y, pinned`), viewers see the owner's arrangement;
members of ordered lists are not placed by hand at all, they are laid out from
`sort` (so only roots, lists, albums, galleries and free nodes carry
coordinates); per-viewer overrides are not needed yet. Decided: positions are
owner-defined, one per node (S5, question 5); a shared node with two parents has
one position.

Options: (1) run the force layout in every browser on load (1.5 s at 1k nodes,
17 s at 10k: no); (2) store **x, y per node** (server-side or computed once and
saved), start the browser from them and only run a few ticks for new nodes;
(3) a server job lays the whole graph out with the same `d3-force` code (Bun) when
it changes a lot; (4) pinned nodes (`fx`, `fy`) for what the user arranged by
hand. Recommended: (2) + (4); "reorder" then means "move and pin". Where positions
live (global, per user, per group) is open (S5).

### 3.6 Proposed first protocol

```
GET /api/graph?root=<id>&depth=2[&offset=&limit=]
                          -> 200  ETag: "<rev>/<viewer-class>"   Content-Encoding: br
{ "rev": 412, "root": 1,
  "nodes": [[id, title, "#rrggbb", "<tilehash>", x, y, flags, kind, childCount], ...],
  "edges": [[from, to, "label", sort], ...] }
GET /api/nodes/:id        -> the node document (when opened)
POST /api/graph/ops, WS /api/graph/live   (S3.4)
```

One SQL for it today (SQLite):

```sql
SELECT json_object(
  'rev',   (SELECT rev FROM meta),
  'nodes', (SELECT json_group_array(json_array(id, title, color, thumb, x, y)) FROM nodes WHERE visible = 1),
  'edges', (SELECT json_group_array(json_array(from_id, to_id, label)) FROM node_links)
);
```

Permissions change this: with `visibility` (`hidden` | `group` | `public`), the result
depends on the viewer: the traversal keeps a node when it is the viewer's own,
or `public`, or `group` with the viewer in `group_members` (S3.1b measured the
owner/public case: 2 ms either way). Cache per (root, depth, rev, viewer class)
where the class is the owner, a stranger, or a membership set; the ETag carries
the class and the viewer's membership version. In PostgreSQL the same rule becomes
row-level security.

### 3.7 Node tiles (what the graph shows inside a node)

Decided 2026-10-22: tiles will be **rasterised and cached on the server, at a
later point**; the PoC graph shows the palette colour. The options below stay as
the record of what was considered.

A tile is the **baked square raster of the rendered node** (what `PLAN.md` S8
calls the thumbnail rendition). It is what the read-only view loads lazily when
semantic zoom reaches "tile" level, so the graph never renders node documents
(only the one open editor does). (1) **Client**: on save,
the editor rasterises its own SVG to a canvas and uploads the PNG/WebP
(exact look, themes and fonts, but trusts the client; now second choice);
(2) **server** from the doc with ImageMagick/`opencv-imgproc` (photo-only nodes
work, vector steps need an SVG rasteriser); (3) **headless Chrome** (exact but
heavy). Until saved with a tile, the view falls back to the node's palette
colour.

---

## 4. Databases

### 4.1 What has to be stored and asked

- **Content graph**: nodes (JSON document), links with a label, positions, palette,
  photo metadata, hashes of files.
- **Identity**: users, credentials, profiles, groups/roles, sessions (the old app
  had users and groups in Hasura/Postgres; `DESIGN.md` S2.2).
- **Questions**: the whole graph (skeleton); a node's neighbours; ancestors/
  descendants (tree-like parts); who may see/edit what; recent nodes per user;
  relink/move writes (rare, small).

### 4.1b Shape of the data: partitioned by owner

Almost every link stays inside one user's ~100 nodes; cross-user links (a shop
item pointing at someone else's exhibit, a shared landscape) are sparse. That
makes the data **naturally partitioned by `owner_id`**: shard by user when one
server is no longer enough (Postgres: partition or Citus by `owner_id`; SQLite:
one file per user is conceivable), traversals rarely cross shards, and
visibility (`hidden` / `group` / `public`) is a per-row filter in the traversal (RLS in
Postgres). Estimate: 10 000 users = 1 M nodes / 1.6 M links = a few hundred MB;
S3.1b shows one SQLite file serves it at ~2 ms per first screen.

### 4.2 Do we need a graph database?

Measured in SQLite (S3.1): a localized traversal (ancestors, 2-hop neighbourhood)
takes tens of microseconds even at 1 M nodes; a full subtree of 100k nodes
takes 158 ms. Writes are rare. A graph database would buy: a traversal language
(Cypher/GQL, Gremlin, ...), variable-length path patterns, graph algorithms
(centrality, shortest path), and native distribution of a huge graph. The app
needs none of them yet. What it **does** need is transactions, constraints
(`UNIQUE(from, to, label)`), users and permissions next to the data, and cheap
operation: all strengths of a relational database.

The one scenario that changes this: user-facing queries such as "how are A and B
connected" or "everything within 4 hops of X filtered by label". Recursive CTEs
do these (S3.1) up to large sizes; below we list the graph-native options for when
they stop being pleasant to write.

### 4.3 Landscape

Licences and "latest release" are from each project's GitHub repository and LICENSE
file on 2026-10-22 [v]; clustering and auth statements are noted with [v]/[s].

**Relational, with or without a graph layer**

| Option | Licence | Latest | Distribution / scale | Graph support | Auth/profiles | Notes |
|---|---|---|---|---|---|---|
| **SQLite** (`bun:sqlite`) | public domain | built into Bun | single node; one writer (WAL) | recursive CTE | tables + `Bun.password` (argon2id, verified) | what the PoC uses |
| Turso Database / libSQL | MIT | Turso 0.8.3 (2026-10-12) | managed replicas; "embedded replicas" keep a local copy synced from a remote primary, writes go to the primary [s: Turso docs] | as SQLite | tables | keeps the SQLite dialect while adding replication; the Rust rewrite is 0.x |
| rqlite | MIT | 10.6.3 (2026-10-20) | Raft cluster of SQLite nodes | as SQLite | tables | HTTP API; not an embedded driver |
| LiteFS | Apache-2.0 | 0.5.14 (2025-04), last push 2026-05 | Fly.io-style read replicas | as SQLite | tables | slow-moving |
| Cloudflare D1 | managed | | read replicas (public beta in 2025; current status not checked) [s] | as SQLite | tables | locks us to one cloud |
| **PostgreSQL** (+ `Bun.sql`) | PostgreSQL licence | 19 RC1 on 2026-10-15; GA pending [v: release notes page] | replication, managed offerings everywhere; sharding via Citus etc. [?] | recursive CTE; **SQL/PGQ reverted from 19** (Beta 4); may return in 20, expected Sept 2027 [v: neon, postgresql.org] | tables, row-level security | Bun has a built-in client (Postgres, MySQL, SQLite) [v: docs]; the old app was on Postgres |
| Apache AGE (on Postgres) | Apache-2.0 | 1.8.0 for PG 18 (release candidate packages; EDB notes 2026-08) | as Postgres | openCypher inside SQL | as Postgres | managed on Azure, EDB [s] |
| DuckDB + `duckpgq` | MIT | DuckDB 2.0.0 (2026-10-21) | embedded, analytical | SQL/PGQ research extension | no | not a multi-user OLTP store |
| CockroachDB, YugabyteDB, TiDB | | | distributed SQL | recursive CTE | tables | not researched [?] |

**Graph-native and multi-model**

| Option | Licence | Latest | Distribution / scale | Query language | Auth/profiles | Notes |
|---|---|---|---|---|---|---|
| **SurrealDB** | **BSL 1.1** (change date 2030-01-01 to Apache-2.0); additional grant: any use except offering a *Database Service* to third parties [v: LICENSE]; SDKs Apache-2.0 | 3.3.4 (2026-10-19) | single node or cluster on **TiKV** [s: Railway docs] | SurrealQL; `RELATE a->edge->b`; graph traversal with `->` | **built in**: record users, `$auth`, row permissions; live queries [v: README] | multi-model; JS SDK 2.1.1 with Node/Deno/WASM engines (Bun not named) |
| **ArcadeDB** | Apache-2.0 | 26.10.2 (2026-10-15) | leader-follower HA with automatic failover in the open source edition [s: vendor docs] | SQL, Cypher, Gremlin; speaks PostgreSQL/Mongo/Redis/Bolt wire protocols [s] | own users | multi-model; JVM (embedded or server); a JS driver was not found [?] |
| **Dgraph** | Apache-2.0 | 25.5.0 (2026-10-13) | distributed, horizontally scalable [s] | GraphQL, DQL | ACL in Enterprise features [?] | sold by Hypermode to Istari Digital in Oct 2025; Istari says it will keep it open source [s] |
| NebulaGraph | Apache-2.0 | 3.8.0 (2024-05); repo active | distributed, Raft, storage/compute split [s] | nGQL, openCypher | users/roles | releases have stalled |
| JanusGraph | Apache-2.0 + CC-BY | 1.1.0 (2024-11) | on Cassandra/HBase/Bigtable | Gremlin | none | you operate a second distributed store |
| TypeDB | **MPL-2.0** | 3.14.0-rc1 (2026-10-17) | clustering only in Cloud/Enterprise, rewrite in alpha [s: TypeDB roadmap] | TypeQL | | strongly typed model; Rust since 3.0 |
| Neo4j | GPL-3.0 (Community) | | clustering, fine-grained auth in the commercial edition [s] | Cypher (a main source of ISO GQL) | DB users only | **NVL visualisation library is licence-restricted** (S2.1) |
| Memgraph | **BSL 1.1** + enterprise licence | 3.14.0 (2026-10-21) | in-memory; HA and multi-tenancy in Enterprise [s] | Cypher | | Orb is the reusable part |
| FalkorDB | **SSPL v1** | 6.0.2 (2026-10-08) | Redis-module architecture; clustering is a paid tier [s] | Cypher | | SSPL is not OSI open source |
| ArangoDB | **BUSL 1.1** + a **Community licence: internal use, 100 GiB cap, then read-only** [v: docs] | 3.12.x | cluster | AQL | | not a free choice for a public site |
| Kuzu | MIT | **archived 2025-10-10** at 0.11.3 [v: GitHub] | embedded | Cypher | | forks: LadybugDB (MIT, 0.21.2, 2026-10-01), RyuGraph, a Vela fork [s] |
| CozoDB | MPL-2.0 | 0.7.6 (2023-12); last push 2024-12 | embedded, runs in the browser | Datalog | | appears dormant |
| Amazon Neptune, Azure Cosmos DB (Gremlin) | managed | | managed scale | Gremlin/openCypher/SPARQL | cloud IAM | lock-in; not researched [?] |
| PocketBase | MIT | 0.40.5 (2026-10-08) | single node (SQLite) | | users, OAuth built in | an app server, not a scalable database |

**Standards.** GQL (ISO/IEC 39075) was published in April 2024 and is a close sibling
of Cypher; Neo4j was a main contributor [s]. SQL/PGQ is the SQL:2023 part that lets
SQL query property graphs; PostgreSQL's implementation was withdrawn from 19, and DuckDB's
is a research extension. Practically: Cypher is the most portable graph language
today; GQL support is still arriving.

### 4.4 Authentication and profiles in the database

- Everything relational stores users, password hashes, sessions and profiles
  trivially. Bun ships `Bun.password.hash/verify` (argon2id; verified: it produced
  an `$argon2id$v=19$m=65536...` hash and verified it).
- Putting identity **in the same database as the content** keeps ownership and
  visibility checks in one query/transaction (and row-level security in Postgres).
- SurrealDB is the only candidate with application-level users built into the
  database (record access, `$auth`, row permissions). Neo4j, Memgraph and
  ArangoDB users are database administrators, not app users: identity would sit in a
  separate store or as ordinary nodes plus hashing in the app.
- Whatever we choose, credentials stay out of the graph skeleton and the snapshot.

### 4.5 Scalability: what "scalable" can mean here

1. **Read scale**: the app's dominant read is the graph snapshot. A cached, ETagged,
   compressed snapshot behind any HTTP cache/CDN scales reads without touching the
   database. Photos are static files (object storage + CDN).
2. **Availability / geography**: replicate the database (Postgres streaming
   replicas, Turso/rqlite/D1 for SQLite).
3. **Write scale**: relinks and uploads are rare; one primary suffices far
   beyond our sizes.
4. **Graph size**: a single node handles millions of nodes (S3.1); distributed graph
   engines are for billions of edges.

So "clustered in the cloud" is a deployment choice, not a graph-model choice. The
smallest step that gives it, with the least lock-in: **PostgreSQL** (managed by any
provider; same tables; `Bun.sql`).

### 4.6 Decision matrix

| Criterion | SQLite now | PostgreSQL | Postgres + AGE | SurrealDB | ArcadeDB / Dgraph |
|---|---|---|---|---|---|
| Fits PoC today | best | good | good | good | heavy (JVM / Go service) |
| Traversal ergonomics | CTE | CTE | openCypher | native `->` | native |
| Users/auth in the DB | tables | tables + RLS | tables + RLS | built in | tables / ACL |
| Multi-server / cloud | via Turso, rqlite, D1 | everywhere | where AGE is offered | TiKV cluster | built in |
| Licence risk | none | none | none | BSL (no DBaaS) | none (Apache-2.0) |
| Maturity / ecosystem | highest | highest | medium (1.8 RC) | young, fast-moving (v3) | medium |
| Bun client | built in | built in (`Bun.sql`) | via SQL | SDK (Bun unlisted) | HTTP or wire protocols |
| Switching cost later | | low (same SQL, `json_*` -> `jsonb_*`) | low | high (new model) | high |

Proposal: **SQLite -> PostgreSQL**; evaluate a native graph engine only when a
product requirement (S5, questions 1 and 10) shows it. Keep the door open by
keeping every SQL statement in `server/db/` and avoiding SQLite-only features in
anything but the graph snapshot query (which has a one-line Postgres equivalent).

---

## 5. Open questions

Decided 2026-10-22: "reorder" and "relink" = move, pin, order, add/remove edges
(not just reparent); the graph is traversed shallowly from a root; one editor at a
time; per-user layout as in S1.1.

1. **Users and scale**: how many users and concurrent viewers in the first year?
   (S3.1b tests 10 000 users; one SQLite file handles it for reads.)
2. ~~Landscape shared or islands?~~ **Decided: shared** across users. Left to
   nothing: a user's root is reached through the **overall-root** > `user-profiles`
   list (S1.1), `featured` is curated; both are ordered lists, paged in windows
   (TODO 12.6). The earlier idea of loading roots by viewport is dropped.
3. ~~Visibility rules~~ **Decided**: hidden (owner only), invite-only group,
   public (S1.3); **one `group_id` per node** for now. A link to a node that other readers cannot see is
   simply not shown to them (decided).
4. ~~Edge kinds~~ **Decided**: `child` (ordered), `sells`, `ref`, `at` (S1.2, S1.5).
5. ~~Positions~~ **Decided: owner-defined**, on the node (S3.5). Left: shared nodes
   with two parents have one position, not one per parent.
6. ~~Collaboration~~ **Decided**: a space is edited by its owner or by the admins
   of its group; everyone else reads. One editor per node at a time, enforced by a **lock**
   (heartbeat, expiry, owner may break; TODO 12.6b).
7. ~~Tile rendering~~ **Decided**: server-side, cached, later (S3.7).
8. **Mobile floor**: the lowest device that must hold 60 fps? The visible set is
   small now, so this matters less than it did.
9. **Hosting and budget**: one VPS, managed Postgres, edge replicas? BSL
   products acceptable?
10. **Graph queries for users**: only "open a node and see neighbours", or paths
    and filters? Recursive CTEs cover depth-limited ones (S3.1b).
11. **Migration**: import the old Postgres/Hasura data (`attic/`)? Mildly argues
    for Postgres.
12. **Verification debt**: Cytoscape WebGL state, React Flow under Preact, G6
    without a bundler, TypeDB/ArcadeDB JS clients, Cloudflare D1 limits.

---

## 6. Plan

| Step | What | Done when |
|---|---|---|
| G0 | Decisions of 2026-10-22 (S5: shared landscape, visibility, edge kinds, positions, tiles, lock) | done; recorded here |
| G1 | `GET /api/graph?root=&depth=` rooted neighbourhood (S3.1b): recursive CTE with visibility filter and child counts, windowed ordered children, ETag/304, brotli; `rev`, `owner_id`, `visibility`, `kind`, `x`, `y`, `pinned`, `tile` columns and `links.sort` | on a generated 10 000-user / 1 M-node database depth 2 answers in under 5 ms cold, `304` works |
| G2 | `GraphView` (SVG): d3-force + d3-zoom + d3-drag vendored; tokens for node/edge/label; expand-on-demand; lists as windows; semantic zoom (colour, label, tile); SSR of the first paint from stored positions | looks like the screenshots on a phone; smooth at ~200 visible nodes |
| G3 | Edit gestures: move and pin, order within a list (drag), relink (drag handle to target), delete edge; ops endpoint; undo; opening a node mounts the single editor | gestures work with touch and mouse; every change is an operation |
| G4 | Live updates: Bun WebSocket pub/sub, `rev` gap recovery | two browsers stay in sync |
| G5 | Shared landscape: overall-root, `user-profiles` and `featured` as windowed lists; zoomed-out overview with a Canvas renderer behind a renderer seam if a list gets long; theme tokens via `getComputedStyle` | same model, same gestures, 5 000 nodes at 30+ fps |
| G6 | Database readiness: all SQL in `server/db/`, a Postgres run of the test suite (`Bun.sql`), the snapshot query in both dialects | tests pass on SQLite and Postgres |
| G7 | Evaluation spike, only if question 9 or 1 demands it: Postgres + AGE and SurrealDB on the same 100k-node data set | a one-page comparison with measurements |

These are `TODO.md` milestone M12 (tasks 12.0-12.6); remaining open items are in S5.

---

## 7. Sources

Verified first hand [v]:

- npm registry (versions, licences, sizes, dates) for d3, d3-force, d3-zoom, d3-drag,
  d3-quadtree, sigma, graphology, graphology-layout-forceatlas2, cytoscape,
  cytoscape-edgehandles, vis-network, force-graph, @cosmos.gl/graph, @antv/g6,
  @xyflow/react, reagraph, @neo4j-nvl/base, @memgraph/orb, surrealdb, preact.
- GitHub API and LICENSE files: surrealdb/surrealdb, dgraph-io/dgraph, vesoft-inc/nebula,
  JanusGraph/janusgraph, ArcadeData/arcadedb, LadybugDB/ladybug, FalkorDB/FalkorDB,
  memgraph/memgraph, neo4j/neo4j, typedb/typedb, apache/age, arangodb/arangodb,
  cozodb/cozo, tursodatabase/turso, rqlite/rqlite, superfly/litefs, pocketbase/pocketbase,
  duckdb/duckdb, cwida/duckpgq-extension, kuzudb/kuzu.
- [Neo4j NVL licence](https://cdn.jsdelivr.net/npm/@neo4j-nvl/base@2.0.0/LICENSE.txt)
- [SurrealDB licence](https://raw.githubusercontent.com/surrealdb/surrealdb/main/LICENSE) and [repository](https://github.com/surrealdb/surrealdb)
- [Sigma.js](https://github.com/jacomyal/sigma.js), [cosmos.gl](https://github.com/cosmosgl/graph),
  [force-graph](https://github.com/vasturiano/force-graph), [Orb](https://github.com/memgraph/orb),
  [graphology serialisation](https://graphology.github.io/serialization.html),
  [G6 create-edge](https://g6.antv.antgroup.com/en/manual/behavior/create-edge),
  [Cytoscape.js WebGL preview](https://blog.js.cytoscape.org/2025/01/13/webgl-preview/)
- [PostgreSQL 19 release notes (RC)](https://www.postgresql.org/docs/19/release-19.html),
  [PostgreSQL 19 Beta 4 announcement](https://www.postgresql.org/about/news/postgresql-19-beta-4-3386/),
  [SQL/PGQ status](https://neon.com/postgresql/postgresql-19/sql-pgq-graph-queries)
- [ArangoDB 3.12 licence change](https://docs.arango.ai/arangodb/3.12/release-notes/version-3.12/incompatible-changes-in-3-12/)
- [Bun SQL](https://bun.com/docs/runtime/sql)

Secondary [s]:

- [Cytoscape.js vs vis-network vs Sigma.js 2026 (PkgPulse)](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)
- [Introducing cosmos.gl (OpenJS Foundation)](https://openjsf.org/blog/introducing-cosmos-gl)
- [Kuzu archived: pin, fork or migrate](https://oneuptime.com/blog/post/2026-08-12-kuzu-archived-pin-0-11-3-fork-or-migrate/view)
- [Apache AGE 1.8.0 release notes (EDB)](https://www.enterprisedb.com/docs/pg_extensions/apache_age/rel_notes/apache_age_1.8.0_rel_notes/)
- [Dgraph acquired by Istari](https://www.istaridigital.com/resources/istari-acquires-dgraph)
- [TypeDB Summer '26 roadmap](https://typedb.com/blog/listening-to-bryan-adams-our-typedb-summer-26-roadmap)
- [ArcadeDB docs](https://docs.arcadedb.com/arcadedb/get-started) and
  [Neo4j alternatives (ArcadeDB blog, vendor)](https://arcadedb.com/blog/neo4j-alternatives-in-2026-a-fair-look-at-the-open-source-options/)
- [Turso embedded replicas](https://docs.turso.tech/features/embedded-replicas),
  [Cloudflare D1 read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/)
- [DuckPGQ](https://duckdb.org/community_extensions/extensions/duckpgq),
  [GQL (Wikipedia)](https://en.wikipedia.org/wiki/Graph_Query_Language)

### Reproducing the measurements

Scripts live in the session scratchpad (`gbench/bench.mjs` payload and layout,
`gbench/cte.mjs` traversals, `gbench/render.html` + `rcdp.mjs` rendering through the
Chrome DevTools protocol, `gbench/ws.mjs` WebSocket pub/sub); they use `bun:sqlite`,
`d3-force@3.0.0`, `graphology@0.26.0` and headless Google Chrome. Data are generated
(a random earlier node as parent, plus a second random link for about half the nodes). They are not in
the repository because they need `npm install`; say so if they should go under
`tools/bench/`.
