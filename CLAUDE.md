# Project Status: legacy code ARCHIVED in `attic/`, rewrite in progress

The original Next.js/Hasura implementation is a frozen historical artifact and lives in `attic/` (also pinned by the git tag and branch `before-rewrite`). The rewrite is a minimal PoC described in `PLAN.md`; library choices and the design source of truth are in `DESIGN.md`; `TODO.md` is the working task list and the authority for the directory layout; `EDITOR.md` specifies the node editor (UX, node data, server, granular tasks E1-E97, incl. the colour palette and text boxes); `GRAPH.md` (graph view, transport, databases, visibility, groups, locks) and `GALLERY.md` (walkable 3D gallery node) are research and decision records for the work after the PoC; `opencv-imgproc.md` specifies the optional background-removal tool; `attic/HISTORIC.md` is the structural reference for the old code (its paths predate the move, read `components/…` as `attic/components/…`); `attic/README.md` is the old readme.

## Hard rule: no changes inside `attic/`

**Do not create, edit, or delete any file under `attic/`, except the documentation files `attic/*.md` (see below).** It is read-only reference material. This includes (non-exhaustive) `*.js`, `*.json`, `*.yaml`/`*.yml`, `.babelrc`, `.env`, and everything under `attic/pages/`, `attic/components/`, `attic/stores/`, `attic/service/`, `attic/assembly/`, `attic/public/`, `attic/build/`.

Do not:
- Fix bugs in it, even ones documented in `DESIGN.md` (e.g. the exposed Hasura admin secret, the `browse.js` schema drift, the query-injection path).
- Refactor, clean up, or remove dead code there (e.g. `attic/components/forceGraph.js`, `attic/tmp.js`, `attic/data.js`, `attic/service/next/`, `attic/webpack.config.js`).
- Upgrade, add, or remove its dependencies, or run its build/install/dev-server commands (e.g. `next build`, `yarn install`).
- Reformat or reorganize it.

If asked to change anything under `attic/`, explain that it is archived and do not proceed without explicit override from the user. Reading it, and copying ideas or assets out of it into the new tree, is fine.

## Outside `attic/`

Source, configuration, build and asset files outside `attic/` (the rewrite, `static/`, `lib/`, `scripts`) may be created and changed as the work in `PLAN.md` requires. `lib/` is a git submodule: do not commit changes inside it without being asked.

## Dev server (runit)

During development the server runs under runit as `/etc/service/wild-beauty` (service dir `/var/service/wild-beauty`, with a `log/` child service), started as `bun server.js --dev --host 0.0.0.0 --port 3001 --no-keys` in the project root. Do not start a second copy by hand on port 3001.

- Status: `sudo svstat /etc/service/wild-beauty{,/log}`
- Control: `sudo sv <command> wild-beauty` (e.g. `restart`, `stop`, `start`, `hup`; see `man 8 sv`)
- Log: `/var/service/wild-beauty/log/main/current`

## Mail and login (2026-10-31)

The host runs Postfix and Dovecot for `transistorisiert.ch` and `jános.ch`; registration mail is to be sent as `noreply@transistorisiert.ch` (ports 25, 465, 587 for smtp, 143 and 993 for imap; details and open points in `PLAN.md` S17). The login dialog is UI only: `POST /api/login` does not exist yet. Do not put mail passwords in the repository.

## Documentation

`*.md` and `*.txt` notes are always in scope: analysis, findings, plans, historical context.

## attic/HISTORIC.md maintenance

`attic/HISTORIC.md` is a living structural reference for the old codebase (project summary, db-structure/migration, build files, library sources, server sources, frontend sources, assets, dead code). Whenever you discover a new fact about how the old code is structured or how it works - a function's real location, a previously-unnoticed dependency, an additional piece of dead code, a corrected line reference - **update `attic/HISTORIC.md` immediately**. Cite exact `file:line` locations (function/class names, not just file names), written with the `attic/` prefix. Treat this as an ongoing archival responsibility for every conversation touching this project.
