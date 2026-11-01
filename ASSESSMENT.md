# Project assessment, 2026-11-01

A snapshot of Wild Beauty (the rewrite outside `attic/`): where it stands, what was left half done
when work moved on, and what the documents no longer say truthfully. Built from the git log
(52 commits on `master`, 2026-10-29 to 2026-11-01, plus 2 on `claude/pensive-lovelace-omjgl4`),
`TODO.md`, `PLAN.md`, `EDITOR.md`, `WAND.md`, the code, the test run and the other Claude sessions.
Nothing here was measured in a browser or on a device: this sandbox has none. "Verified" below
means read in code or run in `bun test`.

How sure each statement is: **[code]** read in the repository, **[test]** run here,
**[docs]** only stated by a document, **[guess]** my inference.

---

## 1. Snapshot

| | |
|---|---|
| Code | client 19.6k lines, server 4.6k, tools 0.9k, tests 12.6k (80 files) [code] |
| Tests | `bun test`: 967 tests, 966 pass, **1 fails** (`api-nodes` "a photo-less node is fine and gets a server-rendered tile (E82)"); it fails identically without this session's changes [test]. Cause not investigated; probably the environment (fonts / Inkscape) [guess] |
| Docs | 7.5k lines of Markdown; `TODO.md` 591, `EDITOR.md` 1210, `WAND.md` 713 |
| Open checkboxes | `TODO.md` 95, `EDITOR.md` 32, `PLAN.md` 4 (many stale, see section 4) |
| Activity | 36 commits on 10-29, 3 on 10-30, 5 on 10-31, 8 on 11-01. Four days; nothing is old enough to rot, but a lot was started in parallel |
| Branches | `master` and `claude/pensive-lovelace-omjgl4` (2 commits ahead: magnetic lasso, TODO). **No pull request, not merged** |
| Tags | none (`before-rewrite` is mentioned in `CLAUDE.md` but is not a tag in this clone) [code] |

## 2. What exists (implementation)

Working and covered by tests [test]/[code]:

- **Server (Bun)**: uploads with progress and ingest (metadata, palette, EXIF position), SQLite
  nodes with revisions, accounts, ownership, visibility, `/api/login` and `/api/register`, node
  locks, places and municipality names, graph API, session replay, usage events, admin panel,
  push notifications, the personal site (jánosch), raster tiles on the server.
- **Editor**: pen, shapes, clip / unclip, text boxes with curves and RTL, colour selector with
  dropper, multiple selection, align, clipboard (also SVG), undo with grouping, jobs with cancel,
  slides and grid layouts, loupe, drafts, four languages.
- **Magic wand**: select first, then Cut out / Take out / Erase, with inpainting; background
  removal; tool groups. **Magnetic lasso** (this session, section 5).
- **3D gallery**: builder, auto plan, auto-hang, walking, guided tour, flyby with a full flight
  take-over (pilot, gear, sound, voice, medal). This is by far the most elaborated part.
- **Graph view** exists in code (`server/api/graph.js`, `client/components/GraphPage.js`,
  `client/graph/layout.js`) even though its TODO tasks are unchecked.

## 3. Started, then left (the detours)

Things where the work moved on before the item closed. Ordered by how likely they are to bite.

### 3.1 Needs a real browser or device first (built, never seen)
- The whole wand pass of 2026-11-01: select / apply, Fill the hole, Exclude subtracts the object,
  first tap adds, overlay clipped to the window, recording box, wand on the current image, select
  tool after Take out, the faster fill. (`TODO.md` "Browser pass", `WAND.md` E2.)
- Multi-outline cut and its highlight, cutout outlines as clip, alpha hit test, per-piece boxes,
  select-tool ghost, opacity slider and hex field. (`TODO.md` "Built, waiting for a device".)
- E124 loupe (only on touch), real clipboard, a real phone (touch, swipe, keyboard), Firefox,
  very large photos, Arabic / Hebrew / Japanese IME, E147 phone check.
- **The magnetic lasso** (section 5).

### 3.2 Half-built features marked `[~]` or "first version"
- **E130 curved text**: slider version only. Missing: drag handles on the stage, double-tap
  reset, the limit arc, following width changes.
- **E82 server tiles**: photo-only documents with several photos and group nodes still use the
  first photo's thumbnail; fonts are not a setup step (production needs TTFs in `~/.fonts`);
  `latin-ext` not installed; curved text goes through Inkscape. Composite tiles of nodes saved
  before E82 need a re-save.
- **Wand latency** (`WAND.md` B8): decoder, fill and filter wins landed, but the persistent
  `opencv-imgproc serve` worker, cropping `cutFromSoft`, cropped cuts with an offset and the
  no-fill rest as WebP are all still open. 
- **SAM on the GPU** was approved ("go given 2026-11-01"), then postponed for the latency pass,
  which itself is half done. The venv is ready, models are not downloaded.
- **Complete the subject** (A8): `excluded` is only a count; the masks are not kept.
- **E154b** "Mark as texture" button in the gallery pane: postponed; related E154 open points
  (pane does not refresh linked children; walls split by compass direction not rendered).
- **E147 multiple selection**: concerns (a) to (l) and its test list; the group bar is long,
  popover CSS never seen, big copies, "More" popover.
- **E150 / E152 small ones**: text Background popover with the background on; dropper hint;
  ingest palette of about 16 colours. **E148** auto-scroll on a phone.

### 3.3 Specified but not started
- **Motors** E141 to E146 (`motor` step, `doc.motion`, `motionAt`, UI, "Hung as", viewer
  playback): there is no `client/editor/motion.js` [code].
- **E94 fill editor** (UI not drawn), **E110 dark theme** (colours undecided), **E103** text boxes
  in grid and slides, **E129** text as clip, **E120** Voronoi pick clip, **E117 / E118**
  opencv.js in the browser (superseded by the server-side wand? [guess]).
- **Themes (M2b)**: only `kraft` and `janos` exist; `blueprint`, theme switcher, scoped themes,
  the token sanitiser `server/theme.js` and the per-node theme picker (E70) are open [code].
- **M11 extras**: `imgproc` server glue, palette via imgproc, image embeddings (DINOv2) for
  duplicates and search. The wand bypasses this with its own route.
- **M12 / M13 remainder**: live updates (WebSocket), branch view, run presentations, edit
  gestures, groups with accounts, overall root, venues from KGS, heritage names, server-side
  tiles.
- Grid / viewer follow-ups: page size, dots, autoplay, swipe indicator, editor preview.
- **Copy several steps at once**, **desktop file drop onto the stage** (wished 2026-11-01),
  **promo video** from a session recording, **one English word for "node"**, Spanish check with
  DeepL.
- Usage-log findings (25 px remove button, undo granularity, upload failures, right-edge missed
  taps, per-drag logging, touch gesture cancels, crop grab area); merging the three report tools.

## 4. The documents disagree with the code

These make the plan unreliable as a to-do list; each is a quick fix.

| Where | Says | The code says |
|---|---|---|
| `PLAN.md` S17, `TODO.md` "Open from 2026-10-31" | `/api/login` does not exist | `server.js` serves `/api/login` and `/api/register`; `CLAUDE.md` says login exists since 2026-10-31 |
| `TODO.md` M12 (12.1, 12.2, 12.3, 12.5, 12.6b ...) | all open | `server/api/graph.js`, `server/api/locks.js`, `client/editor/lock.js`, `GraphPage.js`, tests for graph and locks exist |
| `EDITOR.md` E75 to E78 | open | `client/editor/walls.js`, the whole `client/gallery/` tree and `scene3d` handling exist |
| `EDITOR.md` E114, E121, E124 | open | `clipping.js`, `clipstroke.js` cite them; the loupe is in `Stage.js` |
| `TODO.md` "Done 2026-10-31 (uncommitted; ask before committing)" | uncommitted | committed in `3552fad`, `4aba6bf` and later |
| `TODO.md` "State: ... last: `d2ae0104`" | | 27 commits later |
| `WAND.md` E item 8 "Later: magnetic lasso" | later | built (section 5) |
| `PLAN.md` Phase 0 | housekeeping unchecked | long done [guess] |

Registration: the route exists, but I found **no code that sends mail** [code]. The registration
mail, SPF / DKIM / DMARC / reverse DNS, inbound port 25 and the four-language texts are still open.

## 5. This session's own debts

- **Magnetic lasso is not browser-tested.** Pure logic and the polygon cut are tested; the editor
  wiring (pointer events, overlay, closing, apply) is not. Known gaps: touch has no hover (no live
  segment before a tap); a hole needs a second outline (server accepts it, editor does not offer
  it); handing a lasso to the wand as `region` and back.
- **A Python stand-in on the server.** `tools/polycut.py` does the cut; the intended tool is
  qjs-opencv `cutpoly` (written, **unrun**, branch `claude/affectionate-mendel-2oniyf` of
  `rsenn/qjs-opencv`, commit 2f2859a). Until the user tests and installs it, both paths exist.
- **`edgemap`** (CLAHE + edge-aware smoothing + Sobel / Canny, cached) is written and **unrun**;
  its thresholds are unverified. **Deep edges (HED / DexiNed)** are required but have no model
  files, checksums, licence check or measured timings; the ONNX layouts in the code are guesses.
  The browser does not use `edgemap` yet (no route, no fetch); it still uses its own JS Sobel.
- **Node weight is unbounded.** Every Cut out / Take out / Erase stores a full-resolution cut
  and/or filled photo; `step.orig` keeps the uncut original. Limits are 40 photos, a 1 MB
  document and 40 MB per upload, with no per-node or per-user total [code]. Proposed fixes
  (crop cuts to the subject, cap size, WebP, count and refuse, share one `orig`) are not built.
  The better design discussed is **non-destructive masks**: keep the source photo and store the
  selection as data (clip polygon, or a small image mask; for Take out a patch plus hole mask).
  Not decided, not started; needs every renderer to apply masks.
- Not yet answered: the comparison harness for CLAHE on the user's badly lit photos
  (`tools/edge-sheet.js`), waiting for a go, a photo count and a few hand-traced outlines.
- The branch is unmerged and has no PR.

## 6. Privacy and safety

- **Photo access (decided 2026-11-01, "next to build", not built).** `/files/uploads/<hash>` and
  `/files/photos/<hash>` are served to anyone who knows the hash, marked `public, immutable`;
  published nodes expose `step.orig`, so **the uncut original of a published collage is
  downloadable**, including detail erased with the wand. The rule is decided (owner or published
  node only) but is a design, not code. The masks idea above makes this more important.
- **Firewall**: `ufw` inactive, with allow rules for the mail ports only; enabling needs rules for
  22, 80, 443, 3001, the `anon` proxy and Docker first.
- **Mail**: Postfix / Dovecot are running; deliverability unchecked; nothing sends yet.
- **Recording**: session recording and the admin panel exist; the consent box is built; keep the
  retention and the "who can see replays" rule in mind when the photo-access rule lands.
- `attic/` documents known problems (exposed Hasura secret, injection path) that are deliberately
  not fixed; fine as long as that code is never deployed.

## 7. Infrastructure and process

- Dev server runs under runit; two manual steps from 2026-10-31 (`chown log:log`, `ln -s` into
  `/etc/service`) are listed as the user's; the current state is unknown to me.
- "Deploying is a restart of the local server"; the live site is that server, so every unreviewed
  commit is live after a restart.
- `tools/retile.js` exists but the docs say it must not be run (tiles render in the browser on save); worth deleting or guarding so nobody runs it by accident.
- `lib/` is a submodule (do not commit in it); the qjs-opencv work happens in another repo and
  other sessions; the tool has to be installed by hand
  (`sudo install -m755 ... /usr/local/bin/opencv-imgproc`, then `sudo sv restart wild-beauty`).
- Documentation load: 7.5k lines, several with overlapping status lists (`TODO.md` "Open threads",
  each Part E of `WAND.md`, `EDITOR.md` checkboxes, `UX-REQUIREMENTS.md`). The same item is often
  tracked in two or three places and the copies drift (section 4).

## 8. Other sessions on this account

| Session | State |
|---|---|
| Magic wand tool (this) | running |
| Magnetic lasso contour tracing (qjs-opencv) | idle; `cutpoly` and `edgemap` pushed, unrun |
| OpenAI LLM support in http.h | running; unrelated to this project |
| Genmakefile matrix build ... (CLI bridge) | idle; the commit `8360901` trailer points at it, so it was the previous wand session [guess] |
| Older archived sessions | qjs-opencv-imgproc-tool archived with an open question (Italian / Romansh locales); SQLite WAL advice: `PRAGMA synchronous = NORMAL` missing [docs] |

## 9. Suggested order

1. **Make the docs true** (an hour): fix the stale rows of section 4, move finished items to
   done, so `TODO.md` can be trusted again. Merge or PR the branch.
2. **Browser pass** of wand + lasso on a real photo and a phone; fix what it shows. Everything
   else on the wand builds on that.
3. **Photo access rule** and the **node weight** limits: they share the same files and the same
   question (do we keep originals?). Decide the non-destructive mask question first.
4. Run the **qjs-opencv tests** (`cutpoly`, `edgemap`), install, switch `polygonArgs`, delete
   `polycut.py`, then the CLAHE comparison on the user's photos, then the models for deep edges.
5. Wand latency (persistent worker, cropped cuts), then SAM on the GPU.
6. Registration mail (sender, SPF / DKIM / DMARC), firewall.
7. Only then new features: motors, fill editor, dark theme, desktop file drop, M12 remainder.
