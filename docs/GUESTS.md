# Guests: try first, keep later (owner 2026-11-06, design written the same day, nothing built)

## 0. Why

The owner posts Wild Beauty to a wide circle (Instagram, Facebook). Two things must hold at once:

1. **Nobody should have to register to try it.** A registration wall, or the fear of an activation mail, makes curious people postpone (owner: "if they see a registration they are more likely to postpone trying it out"). A friend opens the link, taps Create, makes a collage in two minutes.
2. **Nobody may edit anybody else's work, and strangers may not publish into the site.** Today a visitor's new node stays ownerless and public: everybody may change it (`docs/SITES.md` S13, the "open public area"). Their photos and works would be theirs to lose ("that's bad, because it is their photos and works").

Use cases: (a) a visitor makes and saves a collage without any form; (b) comes back the next day on the same phone and finds it; (c) wants to keep it for good or show it to others and takes one small step to do so; (d) already has an account and logs in after trying: the work comes along; (e) never returns: the data does not pile up.

## 1. Decisions

**G1. A guest is a real user row.** `users.guest = 1`. It is made **at the first save of a node** by a visitor (`POST /api/nodes` without a login), not on a page view and not at an upload. The uploads of a visitor stay owned by the browser session as today (`docs/EDITOR.md` S3.5); the node that uses them is saved under the guest. Nothing else changes in how nodes, locks, photos and the batch editor work: a guest is simply a user.

**G2. Identity is invisible.** The row has a placeholder address `guest-<random>@guest.invalid` (the column is `NOT NULL UNIQUE`), an unusable password hash, no username. The login cookie is the same `wb-auth` session as for every user; for a guest it is kept **30 days after the last visit** (sliding), for a registered user it stays as it is. `viewerOf` tells `guest: true`; the page shows "Guest", never the placeholder.

**G3. A guest's work is private and theirs.** A guest's node is owned by the guest and **hidden**: only that browser sees it, nobody can change it. A guest **cannot make anything public** (`POST /api/nodes/:id/visibility` answers 403 `account_required`; the profile default is ignored), cannot create pages of a personal site, is never an admin, and nothing of a guest is findable (`docs/SEO.md`). So a stranger cannot put anything on the site where others see it.

**G4. Limits** (proposed numbers, to confirm): 20 nodes per guest; 100 MB of uploads per guest and day and 500 MB alive; at most 20 new guests per client address and day; at most 2,000 live guests (beyond that: "the guest area is full, please create an account"; registration stays open). An answer `429`/`413` with `quota` and a line in the editor.

**G5. Keeping the work = claiming the guest.** The dialog **Create account** asks for a **user name and a password; no mail address is needed** (an address may be added, optional, for the later password reset). `POST /api/claim { username, password, email? }` turns the same row into a normal user (`guest = 0`, username, password hash, the address if given, else the placeholder stays); the session continues, **the nodes stay where they are** (no move, no copy). A taken name answers 409. The same rate limit as registration (5 per client and hour).

**G6. Registering or logging in while holding guest work does not lose it.**
- The existing registration form, used by a guest, behaves as a claim (the same row is upgraded).
- `POST /api/login` by a guest to an existing account: the page first asks "Take your N works along into this account?" (default yes); with `merge: true` the server **moves the guest's nodes to that account** (owner change, hidden stays hidden, locks dropped), then deletes the guest row and its sessions. Without it the guest's work is left to expire.

**G7. Expiry.** A sweep (at server start and then daily) removes every guest unseen for **30 days**: their nodes with node_photos, locks and links, then the photos nothing uses any more (`dropUnused`), their sessions and the user row. There is no address to warn by, so the editor says how many days are left from **7 days before** the end ("Your works on this device are kept until 12 December"). A visit renews the 30 days.

**G8. The open public area ends.** `mayWrite` (`server/guard.js`): a node without an owner and without a space can be changed by an **admin only**. Because every save creates a guest first (G1), no new ownerless node can exist. The old ownerless nodes (none public today) stay readable. `docs/SITES.md` S13 is corrected: "everybody may change an ownerless node" no longer holds.

**G9. Reading stays open for everybody**: the Show page, public nodes, galleries, the book page, search engines (`docs/SEO.md`). Only saving, uploading and publishing involve a guest or an account.

**G10. Usage events** carry `user: "guest:<id>"` for a guest (never the placeholder address). The admin panel lists guests apart and can purge one.

## 2. What the visitor sees

- **First save:** no dialog. The save line says "Saved on this device" with a small **Create account** button and, once, a plain sentence: "Clearing your browser data or using another device means the work is not there. Create an account to keep it."
- **Saved works list:** while the user is a guest, a line at the top: "Your works are kept on this device until <date>. [Create account]".
- **Publish** (the Visibility switch, the batch editor's Publish): for a guest it opens the Create-account dialog: "To publish you need an account. No mail address needed."
- **Account menu** (`client/components/Nav.js`): "Guest" with **Create account** and **Log in**.
- **Dialog "Create account"**: user name, password, optional mail address; the sentence "No e-mail needed." Strings `guest.*` in four languages.
- **Cookie:** the session cookie is technically necessary for saving; nothing else is added.

## 3. What changes in the code

- `server/db/schema.sql`, migration 12: `users.guest INTEGER NOT NULL DEFAULT 0`, `users.last_seen INTEGER`.
- `server/guests.js` (new): `createGuest`, `claimGuest`, `mergeGuest`, `sweepGuests`, `quotaFor`; the numbers of G4 as constants.
- `server/auth.js`: `viewerOf` adds `guest` and renews `last_seen` and the session; `registerRoute` and `loginRoute` follow G6; `POST /api/claim`.
- `server/api/nodes.js` `createNode`: without a viewer, make the guest and its session (`Set-Cookie`) first; the node is the guest's and hidden. `visibilityRoute` and the site-page routes refuse a guest (G3). Quotas in `createNode` and `server/api/uploads.js`.
- `server/guard.js`: ownerless nodes only for admins (G8).
- `client/`: the save line, the dialog, the list banner, the nav entries, the publish gate; `locales/*.json`.
- `tools/guests.js` (new): list, purge, sweep by hand. `docs/SITES.md` S13, `docs/EDITOR.md` S3.5, `docs/DEVELOPER.md`, `TODO.md` follow the code.
- Tests: guest creation on the first save only; privacy (another browser sees nothing, cannot write); no publishing; claim keeps the nodes; register-as-claim; merge on login; quotas; expiry sweep with a faked clock; ownerless nodes need an admin.

## 4. Not in the first version

Password reset and any mail; sign-in with Google or similar; moving a guest's work to another device without an account (a link or QR code); a captcha (the rate limits of G4 first, add one if they are not enough); sharing a guest's work with one person (a hidden-but-by-link state); showing guests a gallery of "community" work.

## 5. Open

The numbers of G4 and the 30 days of G7; whether the first **upload** (before any save) should already make the guest; the exact wording of the sentences in S2 (the owner's voice, Swiss tone) in de, fr, es; whether a guest's hidden node may be opened by link on a second device if the owner shares the cookie (no: it cannot).

## 6. Order of work

1. This document, and the corrections in `docs/SITES.md` S13 (done with the document).
2. Migration, `server/guests.js`, tests.
3. `viewerOf`, guard, visibility, `createNode`, claim and merge routes, quotas, with tests.
4. Client: save line, dialog, list banner, nav, publish gate, strings.
5. Sweep and `tools/guests.js`, admin list.
6. Browser check in a private window: save, reload, claim, merge, expiry; `docs/DEVELOPER.md`.
