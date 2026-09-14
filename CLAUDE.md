# Project Status: ARCHIVED / ABANDONED

This project is **archived**. It is a frozen historical artifact, not an active codebase. See `DESIGN.md` for the full rationale and reverse-engineering notes, and `HISTORIC.md` for a structural reference (file/line-level map of the codebase).

## Hard rule: no source code changes

**Do not create, edit, or delete any source code, configuration, dependency, build, or asset file in this project.** This includes (non-exhaustive): `*.js`, `*.jsx`, `*.ts`, `*.tsx`, `*.css`, `*.scss`, `*.json` (including `package.json`, `graphql-schema.json`), `*.yaml`/`*.yml`, `.babelrc`, `Dockerfile*`, anything under `pages/`, `components/`, `stores/`, `lib/`, `static/`, `public/`, `service/`, `assembly/`, `build/`, or the `lib/` submodule.

Do not:
- Fix bugs, even ones documented in `DESIGN.md` (e.g. the exposed Hasura admin secret, the `browse.js` schema drift, the query-injection path).
- Refactor, clean up, or remove dead code (e.g. `components/forceGraph.js`, `tmp.js`, `data.js`, `service/next/`, `webpack.config.js`).
- Upgrade, add, or remove dependencies.
- Run build, install, or dev-server commands that would write generated artifacts back into the tree (e.g. `next build`, `yarn install` producing a new lockfile).
- "Helpfully" apply unrelated formatting, linting, or reorganization.

If asked to do any of the above, explain that the project is archived and that only documentation changes are in scope; do not proceed without explicit override from the user.

## What IS allowed

Writing and updating **documentation only**: `*.md`, `*.txt`, and similar plain-text notes. This is for capturing analysis, findings, and historical context - not for reviving development.

## HISTORIC.md maintenance

`HISTORIC.md` is a living structural reference for this codebase (project summary, db-structure/migration, build files, library sources, server sources, frontend sources, assets, dead code). Whenever you discover a new fact about how the codebase is structured or how it works - a function's real location, a previously-unnoticed dependency, an additional piece of dead code, a corrected line reference - **update `HISTORIC.md` immediately** to keep it current. Cite exact `file:line` locations (function/class names, not just file names) whenever documenting where something is implemented. Treat this as an ongoing archival responsibility for every conversation touching this project, even ones focused on something else.
