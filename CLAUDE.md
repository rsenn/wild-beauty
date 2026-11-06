# Project Status: legacy code ARCHIVED in `attic/`, rewrite in progress

The original Next.js/Hasura implementation is a frozen historical artifact and lives in `attic/` (also pinned by the git tag and branch `before-rewrite`). The rewrite is a minimal PoC described in `docs/PLAN.md`; library choices and the design source of truth are in `docs/DESIGN.md`; `TODO.md` is the working task list and the authority for the directory layout; `docs/EDITOR.md` specifies the node editor (UX, node data, server, granular tasks E1-E97, incl. the colour palette and text boxes); `docs/GRAPH.md` (graph view, transport, databases, visibility, groups, locks) and `docs/BATCH.md` (batch editor of the graph view: table, photo tiles, reorder and move across nodes, disable photos) `docs/PROFILE.md` (user profile page: details, username, artist pseudonym, avatar = root node, title and description patterns) and `docs/GALLERY.md` (walkable 3D gallery node) and `docs/ALBUM.md` (photo book: a node or gallery printed like a photo album, with a server PDF) and `docs/SEO.md` (search engines and link previews: what is findable, robots.txt, sitemap, Open Graph) and `docs/VEREIN.md` (the intent to run Wild Beauty as a Swiss association owned by its active users; nothing decided) and `docs/MAKERS.md` (editor functionality for people who make and sell small goods: stage formats, templates, brand kit, export; plan only) and `docs/THEMES.md` (the second, quiet theme "Linen": palette accent from the work; spec only) and `docs/FIELD.md` (field records: revisit the places of plants and map species; exact positions are already stored privately; plan only) and `docs/GUESTS.md` (guest accounts: try without registering, keep by claiming; ends the open public area; designed, not built) are research and decision records for the work after the PoC; `docs/opencv-imgproc.md` specifies the optional background-removal tool; `docs/WAND.md` is the design of the magic wand, background removal and take out (UI and server backend); `attic/HISTORIC.md` is the structural reference for the old code (its paths predate the move, read `components/…` as `attic/components/…`); `attic/README.md` is the old readme.

## Hard rule: no changes inside `attic/`

**Do not create, edit, or delete any file under `attic/`, except the documentation files `attic/*.md` (see below).** It is read-only reference material. This includes (non-exhaustive) `*.js`, `*.json`, `*.yaml`/`*.yml`, `.babelrc`, `.env`, and everything under `attic/pages/`, `attic/components/`, `attic/stores/`, `attic/service/`, `attic/assembly/`, `attic/public/`, `attic/build/`.

Do not:
- Fix bugs in it, even ones documented in `docs/DESIGN.md` (e.g. the exposed Hasura admin secret, the `browse.js` schema drift, the query-injection path).
- Refactor, clean up, or remove dead code there (e.g. `attic/components/forceGraph.js`, `attic/tmp.js`, `attic/data.js`, `attic/service/next/`, `attic/webpack.config.js`).
- Upgrade, add, or remove its dependencies, or run its build/install/dev-server commands (e.g. `next build`, `yarn install`).
- Reformat or reorganize it.

If asked to change anything under `attic/`, explain that it is archived and do not proceed without explicit override from the user. Reading it, and copying ideas or assets out of it into the new tree, is fine.

## Outside `attic/`

Source, configuration, build and asset files outside `attic/` (the rewrite, `static/`, `lib/`, `scripts`) may be created and changed as the work in `docs/PLAN.md` requires. `lib/` is a git submodule: do not commit changes inside it without being asked.

## Dev server (runit)

During development the server runs under runit as `/etc/service/wild-beauty` (service dir `/var/service/wild-beauty`, with a `log/` child service), started as `bun server.js --dev --host 0.0.0.0 --port 3001 --no-keys` in the project root. Do not start a second copy by hand on port 3001.

- Status: `sudo svstat /etc/service/wild-beauty{,/log}`
- Control: `sudo sv <command> wild-beauty` (e.g. `restart`, `stop`, `start`, `hup`; see `man 8 sv`)
- Log: `/var/service/wild-beauty/log/main/current`

## Storage (moved 2026-11-01)

The writable directories live on the big disk: `data/` and `uploads/` in the project root are **symlinks** to `/mnt/data/wild-beauty/data` (SQLite database, `photos/`, usage logs `events/`, recordings `replay/`, `vapid.json`) and `/mnt/data/wild-beauty/uploads` (originals, sidecars, `.tmp`). Tools that default to `data/` keep working unchanged. If `/mnt/data` is not mounted the symlinks dangle and the server fails to start instead of creating empty directories on the root disk (check `mountpoint /mnt/data`; its `/etc/fstab` line must be active). The pre-move copies are `data.moved-2026-11-01/` and `uploads.moved-2026-11-01/` (git-excluded): delete them once the new location has proven itself, they hold about 1 GB of the root disk. The runit service writes its own log to `/var/service/wild-beauty/log/main` (small, rotated by svlogd).

## Mail and login (2026-10-31)

The host runs Postfix and Dovecot for `transistorisiert.ch` and `jános.ch`; registration mail is to be sent as `noreply@transistorisiert.ch` (ports 25, 465, 587 for smtp, 143 and 993 for imap; details and open points in `docs/PLAN.md` S17). `POST /api/login` and `POST /api/register` exist (`server/auth.js`; registration is minimal, the address is not verified and no mail is sent; `WB_REGISTRATION=closed` switches it off); the jános.ch users are made with `tools/janos-seed.js`, see `docs/SITES.md`. Do not put mail passwords in the repository.

## Documentation

`*.md` and `*.txt` notes are always in scope: analysis, findings, plans, historical context.

## Track detours in TODO.md

The global rule "Track detours" applies. Here the task list is `TODO.md`: put the entries under "Open threads", mark the one in progress, and say what is postponed.

## Record design decisions BEFORE implementing them

Every design decision or spec that is about to be implemented is written down in the project first,
and only then built. This covers behaviour, UX rules, data shapes, URLs, limits and defaults that the
user states or that we agree on in conversation (for example "buttons and keys change the slide at
once, only a touch drag slides it").

- Put it where it belongs: the spec doc of the feature (`docs/EDITOR.md`, `docs/GALLERY.md`,
  `docs/GRAPH.md`, `docs/WAND.md`, ...), or `docs/DESIGN.md` for cross-cutting choices. State the rule
  and the reason in a few lines, and mark open questions as open.
- If it is not clear which document it belongs to, ask, or suggest creating a new doc file under
  `docs/` (and list it in the doc overview above). Do not skip the record because no place exists.
- A decision that changes during the work is corrected in the doc in the same change; the doc must
  never describe something other than what the code does.
- Tests and `docs/DEVELOPER.md` follow the usual rules; this rule is about the decision itself, not
  only its description afterwards.

## attic/HISTORIC.md maintenance

`attic/HISTORIC.md` is a living structural reference for the old codebase (project summary, db-structure/migration, build files, library sources, server sources, frontend sources, assets, dead code). Whenever you discover a new fact about how the old code is structured or how it works - a function's real location, a previously-unnoticed dependency, an additional piece of dead code, a corrected line reference - **update `attic/HISTORIC.md` immediately**. Cite exact `file:line` locations (function/class names, not just file names), written with the `attic/` prefix. Treat this as an ongoing archival responsibility for every conversation touching this project.

## docs/DEVELOPER.md maintenance

`docs/DEVELOPER.md` is the developer notebook for someone new to the project: map of the tree, server, media pipeline, client, editor folders, document model, conventions, tests, dev server, gotchas. It must always be current. Whenever a change alters the structure (a new folder, route, tool, command, external program), a convention, or reveals a gotcha, **update `docs/DEVELOPER.md` in the same change** and bump its "Last full review" date when you re-check it as a whole. Style: plain notebook text, short lines, no tables, no backquotes, paths unquoted, a `notes:` stub at the end of each section for the developer's own additions (keep their notes). Feature notebooks like `docs/DARKROOM.md` build on it; keep them current the same way.

## Git commits

Do not add the `Co-Authored-By:` or `Claude-Session:` trailers (or any other
attribution lines) to commit messages in this project, even when Claude Code's
attribution guidance asks for them. This project's own rule overrides it.
