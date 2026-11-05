# User profile (decided 2026-11-05)

A logged-in user has a profile page: the details of the account, a few defaults, the artist's pseudonym, and the **avatar**, which is their root node.

## 1. Entry

In the main menu the "Log out" tab of a logged-in user shows the mail address under its label. Under the address comes a second line, a link **User profile** to `/:lang/profile`. The tab grows to hold it (the link is not inside the logout button, so a click on the label logs out as before and a click on the link opens the page). A visitor who is not logged in gets the page with the login dialog open and not dismissable (`loginRequired`, as `/edit/` of a site), since a login is what the person needs there.

## 2. The form

Fields, all saved with one **Save** (`PUT /api/profile`):

| Field | Rule |
|---|---|
| E-mail | shown, not editable yet (it is not verified and no mail is sent; changing it needs the mail flow, `docs/PLAN.md` S17) |
| Username | an optional second name to log in with: letters, digits, dot, dash, underscore, 2 to 30 characters, starts with a letter or digit, unique without regard to case, no `@` (so a login is one or the other, `server/auth.js` USERNAME). Empty removes it |
| Name | the name shown to others, up to 100 characters |
| Artist pseudonym | the name the art is attributed to, up to 100 characters; used by the title and description patterns |
| Title pattern | how a node title is built, default `{date} [{location}] {pseudonym}` |
| Description pattern | how a photo description is built, default `{location}, {date}` |
| New nodes are | `hidden` (default) or `public`: the visibility a node gets when it is made |

Not part of this: a password change (open), language (it is the page's own), themes.

## 3. Patterns

Placeholders `{date}`, `{location}`, `{pseudonym}`. Text in square brackets is optional: it is left out, with its brackets, when a placeholder inside it is empty. A placeholder outside brackets that is empty is replaced by nothing, and the spaces and commas around the gap are tidied (no double space, no dangling comma). Examples with date "15 April 2026", location "Plettenberg Bay", pseudonym "Jane Doe":

- `{date} [{location}] {pseudonym}` gives "15 April 2026 Plettenberg Bay Jane Doe", and without a location "15 April 2026 Jane Doe";
- `{location}, {date}` gives "Plettenberg Bay, 15 April 2026".

`fillPattern(pattern, { date, location, pseudonym })` in `client/editor/core/pattern.js`, pure, tested. The date is written in the page language (a range for a node whose photos span days, `Intl.DateTimeFormat.formatRange`).

## 4. The avatar

The avatar is the user's root node (`users.root_id`): an ordinary node the user edits in the node editor, so it can be a picture, a drawing, text. It is made when first wanted: the **Edit avatar** button on the profile calls `POST /api/profile/avatar`, which creates the node if the user has none (title: the pseudonym, else the name, else the username, else the mail's local part; owned by the user, hidden like new nodes) and answers its id; the page then opens it in the node editor (`/:lang/node/:id?edit=1&back=/:lang/profile`; Close in the node editor returns to the profile). The profile shows its tile when it has one. A deleted avatar node clears `root_id` (foreign key, `ON DELETE SET NULL`), and the next click makes a new one.
Open: placing the root node under the overall root's `user-profiles` list (`docs/PLAN.md` S2, `docs/GRAPH.md` S1.1); publishing the avatar; showing it beside the user's name on their nodes.

## 5. Data

Migration 10 in `server/db/schema.sql`: `users.pseudonym TEXT NOT NULL DEFAULT ''`, `users.root_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL`, `users.prefs TEXT` (JSON `{ titlePattern, descPattern, visibility }`, missing keys mean the defaults). `viewerOf` returns `pseudonym` and `prefs` (so `boot.user` has them); `/api/me` too.

## 6. API

- `GET /api/profile` -> `{ profile: { email, username, name, pseudonym, prefs, rootId, tile } }` (login required, else 401).
- `PUT /api/profile` `{ username?, name?, pseudonym?, prefs? }` -> the profile, or 400 `invalid_username | invalid` / 409 `username_taken`. Only the given fields change.
- `POST /api/profile/avatar` -> `{ id }`.
Same-site cookie and the existing guard cover them; nothing else may change a user.

## 7. Where the pseudonym and patterns are used

- **Batch editor** (`docs/BATCH.md` S6a, S6b): the description of a photo is built from the description pattern, the title of a node from the title pattern (button "Titles from pattern" in the table view; the node's date is the range of its photos, its place the commonest place among them).
- **Node editor**: a button next to the title that applies the title pattern to the node: postponed, see `TODO.md`.
- Attribution on the viewer page of a node ("by <pseudonym>"): open.
