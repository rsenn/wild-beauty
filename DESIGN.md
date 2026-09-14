# Wild Beauty - Design Document (Rewrite)

## 1. Purpose & Origin

Wild Beauty is an online platform where artists and everyday people publish visual content - photographs and short text - arranged as a **navigable graph** rather than a linear feed or folder tree. The unit of content is a **Tile**: a small article/post backed by one or more square photos (shown as a slideshow), a title, freeform text, and an arbitrary set of user-defined fields. Tiles can reference other tiles, and the whole content graph is explored visually via a force-directed graph view instead of (or alongside) conventional navigation.

The original implementation (2019-era Next.js + Hasura/Postgres, hosted as two free Heroku apps - `wild-beauty.herokuapp.com` for the frontend and `the-wild-beauty-company.herokuapp.com` for Hasura) is no longer viable to keep running as-is: Heroku ended its free tier, the stack is six years stale (Node 12, Next 9, MobX 5), a large fraction of its logic lives in an external personal library submodule, it has an unpatched critical secret-exposure vulnerability, and it exhibits intermittent rendering failures caused by schema/query drift. This document captures what the old system actually did (verified by reading its source), what it got right, what's broken, and what a rewrite should keep, fix, or replace.

## 2. What The Old System Actually Does (Reverse-Engineered)

### 2.1 Architecture

A custom Express server (`server.js`) wraps a Next.js app and exposes a thin REST API (`/api/login`, `/api/tree`, `/api/item*`, `/api/photo/*`) that itself talks to **Hasura** (auto-generated GraphQL over Postgres) using a hand-rolled query-string-building client. The client bundle *also* talks to Hasura directly for some pages. State is managed with MobX (`RootStore`, `EditorStore`) hydrated via Next's `getInitialProps` on the server and reused as a singleton in the browser.

A large amount of core logic - DOM/geometry primitives, color classes, a from-scratch force-directed graph/physics engine, generic utilities - lives outside the app repo entirely, in a personal shared library pulled in as a git submodule (`lib/` -> `libweb`). The rewrite should not repeat this: either vendor equivalents in-repo or depend on well-maintained public packages.

### 2.2 Data Model (as actually deployed)

Only five real tables exist behind the Hasura layer:

| Table | Key fields | Notes |
|---|---|---|
| `items` (= Tiles) | `id, name, type, data (JSON text), visible, parent_id -> items` | **Single-parent tree**, not a DAG. `data` is a schemaless JSON blob holding title/text/custom fields. |
| `photos` | `id, original_name, original_sha1, width, height, filesize, offset, colors (JSON text), exif (JSON text), data (base64 JPEG text!), uploaded, user_id` | The re-encoded JPEG itself is stored **inline as base64 text in Postgres**, not in object storage. |
| `users` | `id, username, password (hash), email, token, last_seen` | `token` is a bespoke bearer value, not a real session/JWT. |
| `items_photos` | join table `item_id <-> photo_id` | Many-to-many - one item can have many photos and (in principle) one photo could attach to many items, though the UI only ever attaches a photo to one new item. |
| `items_users` | join table `item_id <-> user_id` | Ownership/authorship linkage. |

**Critical finding:** the DAG concept - "tiles can be linked to other tiles" - is **not implemented at the data layer**. `items.parent_id` is a scalar single-parent foreign key, producing a strict tree. The graph *rendering* engine (`lib/fd-graph.js`, a genuine from-scratch spring/charge physics simulation) is graph-capable, but it's only ever fed a tree converted into graph shape (`treeToGraph()`), never real multi-parent/multi-target edges. **This is the single most important structural gap to close in the rewrite** if the DAG vision is to be real rather than aspirational.

### 2.3 Image Pipeline (verified, corrects the "BPG" assumption)

The deployed pipeline does **not** use BPG anywhere. What actually happens on upload (`imageConversion.js`):

1. Upload buffer -> EXIF extracted via `exifr`.
2. Resized (aspect-preserving, max 1024px long edge) and re-encoded as **JPEG** (quality 95) via `sharp`.
3. Re-encoded JPEG -> **16-color palette** extraction: convert to raw pixels via `sharp().raw()`, quantize with the `cquant` library, map each cluster to a hex color + pixel count.
4. Base64-encode the final JPEG and insert into `photos` (`data`, `colors` as JSON, `exif` as JSON, dimensions, filesize, sha1).
5. Rotation (`/api/photo/rotate`) re-runs the same encode step and overwrites `photos.data`/`width`/`height` in place - no version history.

BPG (`bellard.org/bpg`) was clearly explored - both the app's `static/wasm/bpgdec*` assets and the submodule's `lib/bpg/` contain **decoder-only** WASM/asm.js builds (multiple Emscripten build variants) with **no encoder anywhere** in the codebase, and zero references to BPG from any active page/component/store. It was a prototyped-but-abandoned idea, not a shipped feature. The rewrite should decide fresh whether a modern format (AVIF/WebP, or BPG if there's still a case for it) is worth adopting for storage efficiency, independent of what the old code did.

Color extraction is genuinely used and is the real "initial tile color scheme" mechanism: a photo's 16-color palette (sorted by pixel count) seeds a tile's colors, though the old code was **inconsistent** about sorting - one call site (`stores/queries.js`) correctly sorts by count descending before picking a "dominant" color, another (`pages/tree.js`) reads the raw JSON and takes `Object.keys(colors)[0]`, relying on incidental key order. This inconsistency is a plausible cause of tiles occasionally showing the "wrong" dominant color.

### 2.4 Content Editor & Graph Navigation UI

- **Upload flow**: a drag-and-drop multi-file gallery (`components/upload/*`, `views/imageUpload.js` - a customized, in-tree fork of a "React Upload Gallery"-style widget) posts each file to `/api/photo/upload`, shows per-file progress rings, and supports delete/rotate on already-uploaded images before proceeding.
- **Content editor** (`views/itemEditor.js` + `EditorStore`): once photo(s) are chosen, the user picks a parent via a tree-select dropdown and fills in a dynamic set of fields (defaults: Name, Title, Text; more can be added ad hoc per item) before saving, which POSTs to `/api/item/new`.
- **Tile rendering** (`views/itemTile.js`, `views/itemView.js`): shows the attached photo(s) as a stacked/absolute-positioned slideshow area plus title/text pulled from the JSON `data` blob.
- **Graph navigation** (`pages/tree.js` + `lib/fd-graph.js` + `views/treeGraph.js`): server-side, the full (visible) item tree is loaded, converted into graph nodes/edges, and run through a seeded physics simulation (`Alea` PRNG for determinism) until it settles; the client then renders it as plain SVG (rounded-rect nodes + line edges + wrapped text labels) and layers a `react-dropdown-tree-select` sidebar plus a hand-built "zoom into the clicked tile" CSS-transform animation on top. This is the closest thing to the "rendered force-directed graph" the user described - it works, but today only ever visualizes a tree, and the zoom transition is fragile (hard-coded to specific class names/DOM structure).
- **Auth**: a bare login form posts credentials to `/api/login`; the server checks `bcrypt`, mints a token via `jwt.sign(password, secret)` (signs the raw password rather than user claims - a design smell, see S3), and sets non-`httpOnly`, non-`secure` cookies.

### 2.5 Known Bugs & Fragility (verified in source, not speculation)

These are concrete findings from reading the code, not general concerns - useful as regression cases / "must not repeat" items for the rewrite:

1. **Critical - admin secret shipped to the browser.** The Hasura admin secret is a literal string baked into `stores/queries.js` and `pages/tree.js`, both of which compile into the client bundle. Any visitor can extract it from devtools and get unrestricted read/write access to the entire database (including all users' password hashes and tokens), bypassing every Hasura permission rule.
2. **Critical - query injection.** The hand-rolled GraphQL client (`stores/api.js`) builds queries via raw string interpolation of user-supplied values with only ad hoc, incomplete escaping. Combined with #1 (admin-level connection), this is an exploitable injection path.
3. **Broken page in the current schema.** `pages/browse.js` (and other call sites) query `order`/`created` fields on `items` that don't exist in the current Hasura schema dump; the error is silently swallowed and the page renders empty - a concrete, reproducible instance of the reported "sometimes doesn't render" symptom.
4. **Weak auth.** JWTs sign the raw password instead of user identity claims; session cookies are explicitly non-`httpOnly`/non-`secure`; `req.session` is referenced throughout `server.js` but no session middleware is ever installed, so those code paths are silent no-ops.
5. **Images inline in Postgres rows** as base64 text, with no CDN/thumbnail strategy - a scalability and latency problem, and a likely contributor to slow page loads.
6. **Race-prone temp file.** Every upload writes to the same literal `tmp.jpg` path before EXIF parsing; concurrent uploads within a worker can clobber each other.
7. **Inconsistent dominant-color logic** between call sites (see S2.3).
8. **Dead/orphaned code** the rewrite must not mistake for real functionality: `components/forceGraph.js` (an unrelated p2p-network-visualizer copy-paste, missing its own dependencies, never imported anywhere - *not* the real graph view, despite the name), the entire Apollo/`next-apollo`/`apollo-mobx` dependency chain (abandoned in favor of the hand-rolled client), five overlapping EXIF libraries and three overlapping color-extraction libraries where only one of each is actually used, an i18n layer (`react-i18nify-mobx`) that's been stubbed out everywhere (`Translate` -> renders raw i18n keys instead of text), `tmp.js`/`data.js` (unrelated D3 example datasets), and a `service/next/...` directory that is accidentally-committed process-supervisor runtime state, not source.
9. **Data model is a tree wearing a graph's clothes** (S2.2) - the biggest gap between stated intent and shipped reality.

### 2.6 What Was Genuinely Good / Worth Preserving

- The **overall product concept** - Tiles with photo slideshows, palette-driven visual identity, graph-based browsing - is coherent and distinctive; it's the execution (secrets, injection, tree-not-DAG, base64-in-DB) that needs fixing, not the concept.
- **Palette-driven tile theming** (16-color extraction seeding a tile's design) is a nice, implementable idea and the quantization approach (`cquant`, or a modern equivalent) is sound.
- The **from-scratch force-directed graph engine** (`lib/fd-graph.js`) proves the visualization idea works technically; a modern rewrite can achieve the same effect with far less custom code (see S4.4).
- The **upload -> resize -> palette -> edit** flow ordering (upload photos first, then compose the tile around them) matches good UX practice for photo-centric content and should be kept.

## 3. Goals for the Rewrite

1. **Make the DAG real.** Introduce an explicit `tile_links` (edges) table - `(id, from_tile_id, to_tile_id, label?, created_at)` - decoupled from any ownership/authorship notion, supporting multiple parents and multiple children per tile, with cycle-prevention enforced at the application layer (a DAG, not a general graph) if that invariant matters for navigation semantics; otherwise allow cycles and treat it as a general graph if that better matches the product vision (needs a product decision - see Open Questions).
2. **No secrets in client code, no hand-rolled query strings.** Use a real GraphQL/ORM client with parameterized queries and a server-side-only admin/service credential; expose only a scoped, permission-checked API to the browser (either narrowed Hasura permissions with per-user JWTs, or a purpose-built application server with an ORM like Prisma/Drizzle over Postgres, bypassing Hasura's admin-secret model entirely).
3. **Store images in object storage, not Postgres.** Use S3-compatible storage (or a CDN-backed image service) with the DB holding only metadata + storage keys; generate multiple sizes (thumbnail, tile, full) at upload time.
4. **Consistent, correct palette extraction**, single source of truth (server-side, on upload), stored as ordered rows or an ordered JSON array (not an object relying on key order) so "dominant color" is unambiguous.
5. **Modern, boring stack** with long-term support: current Next.js/React, TypeScript throughout, no Node 12 pin, dependencies kept to one library per concern (drop the duplicate EXIF/color/graph libraries found in the audit).
6. **Proper auth**: standard session or JWT-with-claims (never sign the raw password), `httpOnly`+`secure` cookies, CSRF protection on state-changing routes.
7. **No self-built primitives where good libraries exist**: `d3-force` (or `react-force-graph`/`sigma.js`) for the graph view instead of a hand-rolled physics engine; `chroma-js` or `culori` for color math; a maintained upload widget (`react-dropzone` + `uppy`) instead of an in-tree fork.
8. **Remove the two-Heroku-app split** as a hard requirement - deploy as a single modern platform target (e.g., a Postgres-backed service on Fly.io/Render/Railway/self-hosted, with object storage for media), decided independent of any particular GraphQL engine.

## 4. Proposed Architecture

### 4.1 Stack

- **Frontend framework - decided (S8 Q9)**: Astro (SSR, islands architecture - ships near-zero JS for the mostly-static pages, hydrates only the interactive surfaces) with **Preact** as the UI library (same component API as React via `preact/compat`, much smaller runtime; official `@astrojs/preact` integration provides SSR + selective client hydration). React/Next.js was considered (see S4.1.1) and rejected in favor of this lighter stack, since most pages here (browse/tile view) are read-heavy and only a few surfaces are genuinely interactive (graph canvas, upload widget, layout editor).
- **State/data-fetching**: minimal client-side state per interactive island (e.g. a small store or plain hooks scoped to the graph canvas / editor) rather than a global singleton store - MobX's `RootStore` pattern (S2.1) is not needed once static pages carry no client JS by default.
- **API layer - decided (S8 Q5)**: app-server-only, no Hasura. A typed server (tRPC or a thin REST layer) with Prisma fronting Postgres directly, so there is exactly one place service-level credentials live and no separate GraphQL-engine process/admin-secret model to secure - this is the direct structural fix for the S2.5-1 secret-exposure bug, and keeps the self-hosted VPS (below) to one fewer moving part.
- **Runtime**: Bun (decided - S8 Q6). Astro runs on Bun (`bun create astro`, `bun run dev`/`build`) as a supported target, and `@astrojs/preact` explicitly accounts for Bun's JSX-transform import behavior.
- **Hosting**: self-hosted on a VPS (decided - S8 Q6), not a managed PaaS - drops the "Heroku isn't free anymore" problem by owning the box outright instead of trading one hosted platform for another.
- **Database**: Postgres by default, schema below (S4.2); a non-SQL/document store remains under consideration (S8 Q6) since `tiles.data`/`tiles.layout`/`tiles.fields` are already schemaless JSON in the proposed schema.
- **Object storage**: S3-compatible bucket (Cloudflare R2 / Backblaze B2 / AWS S3, or a self-hosted MinIO on the same VPS) for original + derived image sizes, served via CDN.
- **Auth**: standard email/password (or OAuth) with a real session mechanism (e.g., signed, `httpOnly`, `secure` cookies via a library like `iron-session`), bcrypt for password hashing (keep - it was already correct).

#### 4.1.1 Rejected alternative: Next.js + React

Considered and **not chosen** (S8 Q9 resolved in favor of S4.1's Astro/Preact/Bun stack): Next.js (current stable, App Router) + React + TypeScript, with Server Components for read-heavy pages and client components for the interactive editor/upload widget/graph canvas, React Query for data-fetching. This would have had a larger ecosystem (`react-force-graph`, `next-auth`, built-in `next/image` optimization) at the cost of a heavier default client bundle for pages that don't need one - not the right tradeoff for this app's mostly-static page shape. Kept here for the record rather than deleted, in case a future reconsideration wants the reasoning.

### 4.2 Data Model

#### 4.2.0 Old schema, exact (extracted from `graphql-schema.json` introspection dump)

The table below supersedes S2.2's approximate description with the literal field names/types Hasura exposes today (GraphQL scalar types shown; `!` = non-null). This is the ground truth the migration (S5) maps from - not the proposed schema itself, which follows below.

```
items (
  id: Int!
  name: String
  type: String
  data: String                -- schemaless JSON-as-text blob (title/text/custom fields)
  visible: Boolean!
  parent_id: Int
  parent: items                -- single FK, confirms the tree-not-DAG finding (S2.2)
  children: [items!]!          -- reverse of parent_id
  photos: [items_photos!]!
  users: [items_users!]!
)                               -- NOTE: no `order` or `created` field exists - confirms
                                -- the S2.5-3/browse.js "queries fields that don't exist" finding

photos (
  id: Int!
  original_name: String
  original_sha1: String
  width: Int!
  height: Int!
  filesize: Int
  offset: Int
  colors: String                -- JSON-as-text, object keyed by hex (S2.3's key-order bug)
  exif: String                  -- JSON-as-text
  data: String                  -- base64-encoded JPEG bytes, stored inline in Postgres
  uploaded: timestamptz
  user_id: Int
  user: users
  items: [items_photos!]!
)

users (
  id: Int!
  username: String!
  email: String
  password: String              -- bcrypt hash
  token: String                 -- bespoke bearer value, not a real session/JWT (S2.5-4)
  last_seen: timestamptz
)

items_photos (                  -- join table
  id: Int!
  item_id: Int!
  item: items!
  photo_id: Int!
  photo: photos!
)

items_users (                   -- join table
  id: Int!
  item_id: Int!
  item: items!
  user_id: Int!
  user: users!
)
```

#### 4.2.1 Proposed new schema

```
users        (id, username, email, password_hash, created_at, ...)
groups       (id, name, created_at, ...)                             -- real DB entity, not content (S8 Q7)
users_groups (user_id -> users, group_id -> groups)                  -- membership join
tiles        (id, owner_id -> users, title, body, tags text[], fields jsonb,
              layout jsonb, palette jsonb, visible boolean, created_at,
              updated_at, position/order)
tile_photos  (id, tile_id -> tiles, photo_id -> photos, sort_order)   -- ordered slideshow
photos       (id, owner_id -> users, storage_key, thumb_key, width, height,
              filesize, sha1, exif jsonb, palette jsonb, uploaded_at)
tile_links   (id, from_tile_id -> tiles, to_tile_id -> tiles, label text not null,
              created_at)                                            -- the real graph
```

Notes:
- `tiles.palette` is derived at tile-creation time from its photos' `photos.palette` (itself computed once at upload), stored as an **ordered** array of `{hex, weight}` so "dominant color" is unambiguous by construction, not by object-key-order accident.
- `tile_links` is the structural fix for S2.2/S2.5-9: many-to-many, directed, no implicit single-parent constraint. A `UNIQUE(from_tile_id, to_tile_id, label)` constraint prevents duplicate edges of the same label between the same pair. **Decided (S8 Q1)**: this is a general graph, not a strict DAG - cycles are allowed (no reachability check needed on writes), matching that mutual cross-links between tiles are a normal, expected pattern. **Decided (S8 Q2)**: `label` is required and carries semantic meaning (e.g. `"part of"`, `"inspired by"`, `"see also"`) rather than being purely structural - the graph view can style/filter edges by label, and a fixed enum (vs. free text) for the label set is a small follow-up decision at implementation time.
- Keep `tile_photos` as an explicit join (already correct in the old schema) so a tile can have an ordered slideshow of N photos, and in principle a photo could be reused across tiles.
- `tiles.layout` (decided - S8 Q8) holds the free-form per-tile layout the user composes in the editor: chosen font (from a fixed set of 2-3 offered faces), an ordered/positioned list of text blocks (paragraph/div-equivalent nodes with position + styling), and per-photo presentation parameters (mask shape, composite/blend mode, transform (position/scale/rotation), and animation) keyed by `tile_photos.id`. This replaces the old ad hoc `EditorStore.addField` dynamic-field system (S2.4) with a layout the user directly arranges rather than a form.
- `tiles.title`/`tiles.body`/`tiles.tags` are the small fixed schema, and `tiles.fields` (jsonb, ordered array of `{label, value}`) is a lightweight named-field system kept **alongside** the layout editor, not replaced by it (**decided - S8 Q3**): the layout editor covers free-form visual placement of text/photos, while `tiles.fields` covers structured metadata (e.g. "Location: Berlin") that isn't part of the visual composition - two distinct concerns, both kept.
- `groups` is a real entity (not a content/category node like the old "Boxes/Bags/Motiv" map, S8 Q7) - what a group is *for* (ownership/visibility scoping vs. just another browsable node type) is still open; `users_groups` is a plain membership join in the meantime.

### 4.3 Image Pipeline

1. Client uploads original file (drag-drop or file picker) directly to a signed object-storage URL (skip proxying the full binary through the app server).
2. A server-side job (or synchronous step for v1): extract EXIF, generate a square-cropped "tile" size + a small thumbnail + keep the original, compute a **5-8 color palette** (reduced from the old system's 16 - decided, S8 Q4, for a tighter "theme" feel per tile/photo) via a quantization library, store palette as an ordered array.
3. Persist `photos` row with storage keys for each derived size + palette + EXIF; return to the client so it can proceed to the tile editor.
4. Format decision: default to modern web formats (AVIF with WebP/JPEG fallback) for derived sizes; BPG is not recommended for a rewrite - it has poor browser/tooling support today and the old code never actually used it beyond a decoder prototype. If ultra-high compression at a given quality remains a real requirement, evaluate AVIF against BPG on real photos before deciding - but do not default back to BPG on the strength of the old prototype alone.

### 4.4 Graph Navigation

- Model: nodes = tiles (with palette-derived color + thumbnail) plus entity nodes for `users`/`groups` (S7.4/S8 Q7); edges = `tile_links` rows, a general graph (cycles allowed, S8 Q1) with a required semantic `label` per edge (S8 Q2) the view can style/filter by.
- Rendering: use `d3-force` for the physics simulation (battle-tested, replaces the 450-line hand-rolled `fd-graph.js`) with a canvas or SVG renderer - canvas recommended once the graph exceeds a few hundred nodes for performance. Since the frontend is Preact (S4.1), wire `d3-force` directly to a canvas/SVG Preact component rather than relying on a React-specific wrapper like `react-force-graph`.
- Interaction: click a node to navigate/zoom into that tile (a CSS view-transition, replacing the old hand-computed `DOMMatrix` animation - the View Transitions API is framework-agnostic and fits a Preact/Astro stack better than a React-specific animation library), pan/zoom the canvas, optionally filter by author/tag/edge-label.
- Since the underlying model is now a real graph, decide (Open Questions) whether the default view still roots itself at a single "home" tile and expands outward, or presents the whole graph - multi-parent tiles change what "rooted" navigation even means.

### 4.5 Content Editor

Keep the two-step flow (upload photos -> compose tile). Replace the old ad hoc `EditorStore.addField` dynamic-field system with a per-tile **layout editor** (decided - S8 Q8) plus a small kept-alongside named-field system (decided - S8 Q3), both stored on `tiles` (S4.2):

- **Typography**: the user picks one of a small, curated set of 2-3 fonts for the tile (not a free font picker) - keeps the visual identity coherent (S7.3) while giving some per-tile expression.
- **Text placement**: the user arbitrarily places one or more paragraph/text blocks on the tile's canvas (free positioning, not a fixed title/body template) - closer to a minimal page-builder than a form. Stored in `tiles.layout`.
- **Photo treatment**: each photo attached to the tile can be individually masked (clip to a shape), composited/blended (CSS `mix-blend-mode`/`mask-*` equivalents), transformed (position, scale, rotation), and animated - the user directly art-directs how their photos sit within the tile rather than getting a fixed slideshow-only presentation. Stored in `tiles.layout`.
- **Structured fields**: separately from the visual layout, the user can still add named metadata fields (e.g. "Location: Berlin") - stored in `tiles.fields`, an ordered array of `{label, value}`, distinct from the free-form layout (S8 Q3).
- This explicitly replaces the old raw `Id`/`Parent` debug-style card metadata (S7.6, S8 Q8) - the card's visible content is now entirely the user's own composed layout (plus any structured fields they chose to add), with no framework-generated ids/labels overlaid.
- Implementation note: the layout editor is a real (small) canvas/layout engine, not a CSS-only concern - budget for a dedicated editor surface (e.g., an absolutely-positioned canvas with drag/resize handles, serialized to `tiles.layout` JSON) rather than treating it as a minor styling add-on to S2.4's old flow.

## 5. Migration Considerations

- If any production data still exists in the old Postgres/Hasura instance, write a one-time migration script: `items` -> `tiles` (dropping the single-`parent_id` tree into `tile_links` edges, one edge per old parent/child pair, labeled e.g. `"part of"` since labels are now required (S8 Q2), so existing structure is preserved as a starting graph rather than lost), `photos.data` (base64) -> decode and upload to object storage, `photos.colors` (JSON object) -> ordered array by count descending.
- Recompute palettes on migration rather than trusting the old inconsistent extraction, to fix finding S2.5-7 retroactively - target the new 5-8 color size (S8 Q4), not the old 16.
- Old `items.data` (freeform JSON blob, S4.2.0) has no equivalent to the new `tiles.layout` - migrated tiles get an empty/default layout (title + body dropped into simple default text placement) rather than an attempt to reverse-engineer a visual layout from unstructured old data; users can re-lay-out migrated tiles afterward if desired.

## 7. Visual Design Language (from original screenshots)

The user supplied a set of screenshots of the deployed prototype (`/mnt/data/Dokumente/Wild Beauty/Webpage/`), covering the graph view (desktop + mobile), the categorical/tree "Motiv" graph, the login modal, the upload grid, and the content-editor grid. These establish a distinctive, consistent visual identity that the rewrite should reproduce closely, not just functionally replicate. Colors below are eyeballed from the screenshots (approximate hex) - sample the source images directly for pixel-exact values before finalizing a design-token file.

### 7.1 Background: textured "kraft paper" ground

Every page - graph view, login modal, upload grid, editor grid, on both desktop and mobile - sits on the same warm, low-contrast, mottled beige/tan texture (looks like crumpled kraft paper or a soft marble/stone wash, approx. `#c9bfae`-`#cfc6b4`, with darker cloudy patches ~`#b8ab95`). It's a full-bleed background image, not a flat color, and it's the single strongest "brand" cue tying every screen together. No page has a plain white or flat-color background. This texture should be recreated as a repeating/cover background image (subtle, non-distracting, low contrast against foreground elements) rather than approximated with a flat beige - the mottling is part of the identity.

### 7.2 Navigation chrome

- A horizontal strip of **tab buttons butted edge-to-edge** (no gaps/rounded outer corners visible as a group), each tab a solid **deep red/crimson block** (approx. `#9c2b3c`-`#a5333f`) with bold, all-caps-feeling white text.
- Labels seen: **Home, Show, Tree, New, Login, Language** (the last two abbreviate to "Log"/"Lan" or "Spr" for Sprache - German-language build also exists). On narrow mobile viewports the tabs are cropped/truncated (e.g., "Home"->"Hon", "Show"->"Sho", "Tree"->"Tre") - this is a genuine responsive bug in the original (tabs don't wrap or shrink text), **not** a style to keep; the rewrite should keep the flat, edge-to-edge crimson tab-bar look but make it responsive (wrap, shrink, or collapse to a menu on narrow widths).
- The **active tab** gets a soft white glow/highlight behind its label, and can expand to show a one-line description underneath the bar (seen: "New" tab active -> caption "Create a new tile" appears directly below the strip, left-aligned, same background texture).

### 7.3 Typography

A **blocky monospace / bitmap-style pixel font** (looks like a "terminal"/DOS-VGA style face) is used everywhere text appears as UI chrome: nav tab labels, graph node labels, button labels, modal titles, and metadata overlays on content cards. This is used consistently rather than a standard system sans-serif, and is a deliberate retro-terminal accent against the soft paper texture. Keep a single distinctive monospace/pixel display font for all UI labels and node text; body copy (tile title/text content itself) can reasonably use a normal readable font, but chrome and node labels should keep the pixel-font identity.

### 7.4 Graph view - node & edge styling

Two visually distinct graph renderings appear in the screenshots, which the rewrite should treat as two ends of one continuum (structural content graph vs. curated category map):

- **Live content graph** (desktop `tree.js`, image of orange/purple squares): nodes are **flat-filled rounded squares with a solid black outline** (~3-4px), two sizes/colors observed - larger **amber/orange** (`~#f5a623`) squares for tiles with content/children, smaller **purple/violet** (`~#5b2d8f`-`#6a1b9a`) squares for leaf items or unattached photos. No drop shadow, no gradient - flat and graphic. Edges are **thin black straight lines**, no arrowheads (undirected look, even though the underlying data may be a tree/DAG). Layout is clearly force-directed/spring - nodes settle into organic, non-grid clusters with a "hub" node showing many short spokes.
- **Categorical "Motiv" map** (mobile + desktop screenshots of "Boxes / Bags / Users / Groups / Objects / Subjects / The Wild Beauty Company / Motiv #1-4 / RGB color mixing / PIC Microcontroller / etc."): nodes are **rounded rectangles in varied, saturated flat colors** - one distinct hue per node/category (magenta, violet, indigo, blue, teal/mint, green, lime, yellow, orange, red, brown all appear across the two screenshots), each with a subtle drop shadow giving a "sticky note" / app-icon feel, black pixel-font label centered. A **focused/selected node** gets a **dashed white outline** overlay (seen on "Bags"). Edges here are **curved bezier lines in black**, converging on shared parents/roots - visually softer than the straight-line content graph. **Resolved (S8 Q7)**: this is not a distinct/curated feature or an earlier alternate view - "Boxes"/"Bags"/"Motiv #N"/etc. are ordinary content that lived in Hasura/GraphQL like any other item, i.e. they render through the same content-graph mechanism as everything else, not a hand-built taxonomy needing its own view. `Users` and `Groups` nodes seen in the same screenshots are different in kind, however: they are real DB entities (S4.2's `users`/`groups` tables), not content nodes, so the rewrite's graph view needs to represent at least two node kinds (content tiles vs. entity nodes) within one rendering, not one homogeneous content graph.
- In both variants, node **fill color is the design's primary carrier of identity/category** - this directly matches the "dominant palette seeds the tile's color scheme" requirement (S2.3/S4.3): a photo-backed tile's node color in the graph should come from its extracted palette, while non-photo/organizational nodes (categories, "boxes") can carry a manually chosen flat color, matching what's seen here (some nodes are clearly manual category colors, not derived from a photo).

### 7.5 Modals & buttons

- The **login modal**: white rounded-corner card, **crimson title bar** (`~#9c2b3c`, matching the nav) with bold white centered "authentication" text in the pixel font, plain form fields (simple bordered inputs, plain black labels "Username"/"Password"), and a **pill/rounded crimson button** ("Login") with a slightly darker red border and soft drop shadow - same crimson family as the nav and used consistently as the one call-to-action color across the app (also seen on "Select Images to Upload").
- A successful login shows a **terminal-style confirmation**: black background, bright green monospace text ("You're in!") - a deliberate retro-hacker easter egg/confirmation style, distinct from the rest of the UI's paper-and-crimson palette. Worth keeping as a small delight moment on successful auth.
- Behind the modal, the page content is visible **blurred and color-tinted** (a teal/seafoam overlay wash in the screenshot) rather than dimmed with plain black - a colored frosted-glass modal backdrop is part of the look, not a generic dark scrim.

### 7.6 Content editor & upload grid

- **Parent picker**: a plain white rounded-rect input styled like a tag/chip multi-select - chosen parent shown as a dark pill chip with label + white "X" remove button, followed by placeholder text "parent item" in a lighter gray, standard input-box border. Simple, not heavily styled - contrasts with the more graphic node/button styling elsewhere.
- **Editor grid cards**: each item is a plain **white square card**, the photo filling the square, with **black monospace metadata directly overlaid on the image** at the top-left ("Id: 98", "Parent: 4") and a label near the bottom ("Motiv #1"). This overlay-on-image, no-separate-caption-bar approach gives an "index card" / field-specimen-label feel. **Resolved (S8 Q8)**: the raw `Id`/`Parent` debug text is dropped entirely in the rewrite - it was leftover dev output, not intended final UI copy. In its place, the card shows the tile's own user-composed layout (S4.5): chosen font, freely placed text blocks, and masked/composited/transformed/animated photos - the "text directly on the photo" motif is kept, but the text and composition are now the user's own design rather than framework-generated metadata.
- **Upload grid**: a 5-column grid of square thumbnails, each with two small circular icon buttons overlapping its lower area - a **red circle with white "X"** (delete) and a **blue circle with a stylized "C"/rotate glyph** (rotate) - a compact icon-on-thumbnail pattern worth keeping as-is. Selected thumbnails (queued for the new tile) get a **blue outline border**. Above the grid, the drop-zone is a simple black-outlined rectangle with an upload-arrow glyph and the crimson "Select Images to Upload" button, same style as the login button.

### 7.7 Overall composition principles to preserve

- Minimal chrome: no sidebars or footers observed; a single top tab strip is the only persistent navigation.
- Content (graph canvas, upload grid, or editor grid) fills essentially the whole viewport below the nav.
- One accent color (crimson) is reserved strictly for interactive/brand chrome (nav, primary buttons, modal headers); the paper-texture beige is the constant "canvas"; all remaining color variety comes from content itself (photos, extracted/assigned node palettes) - i.e., the app's *own* chrome is deliberately restrained so that user-uploaded imagery and its derived palette supply the color richness. This is an important principle to state explicitly for the rewrite's design system: **the UI is a neutral frame; tiles and the graph are where color lives.**

## 8. Open Questions

All nine original questions are now resolved; only sub-questions raised while resolving them remain open (marked below). Kept as a historical decision log rather than deleted.

1. **True DAG or general graph? - RESOLVED**: general graph, cycles allowed. No reachability check needed on `tile_links` writes; mutual cross-links between tiles (A "see also" B and B "see also" A) are treated as a normal pattern, not an error case.
2. **Edge semantics - RESOLVED**: `tile_links.label` is required and carries semantic meaning (e.g. "part of", "inspired by", "see also"), not purely structural. Open sub-question: fixed enum vs. free-text label values - not yet decided, small enough to settle at implementation time.
3. **Custom per-tile fields - RESOLVED**: kept alongside the new layout editor, not replaced by it. `tiles.fields` (ordered `{label, value}` array) covers structured metadata; `tiles.layout` (S4.5) separately covers free-form visual composition. Two distinct concerns, both built.
4. **Palette size - RESOLVED**: reduced from 16 to **5-8** colors, for a tighter "theme" feel per tile/photo (S4.3).
5. **Hasura vs. app-server-only - RESOLVED**: app-server-only (tRPC/Prisma, S4.1). Hasura is dropped entirely - one fewer moving part on the self-hosted VPS (Q6) and the direct structural fix for the S2.5-1 admin-secret exposure bug.
6. **Hosting target - RESOLVED**: self-hosted on a VPS (not a managed PaaS), with Bun as the runtime (S4.1). Open sub-question: Postgres is the default (S4.2), but a non-SQL/document store remains under consideration since `tiles.layout`/`tiles.fields` are already schemaless JSON - not yet decided.
7. **Categorical "Motiv" map (S7.4) - RESOLVED**: not a distinct curated feature - it was ordinary GraphQL/Hasura content (Boxes/Bags/Motiv-style category tiles), rendered through the same content-graph mechanism as everything else. `Users`/`Groups` seen in the same screenshots *are* real DB entities, not content, so the graph view needs to distinguish content-tile nodes from entity nodes (S4.4). Open sub-question: what a `Group` is actually *for* (ownership/visibility scoping vs. just another browsable node type) is not yet decided.
8. **Card metadata overlay (S7.6) - RESOLVED**: raw `Id`/`Parent` debug values are dropped entirely. Replaced by the per-tile layout editor (S4.5) plus `tiles.fields` for any structured metadata the user chooses to add.
9. **Frontend framework - RESOLVED**: Astro + Preact + Bun (S4.1), not Next.js + React (kept as a rejected alternative in S4.1.1). Chosen for the smaller JS footprint on this app's mostly-static page shape.
