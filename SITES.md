# SITES.md - personal sites rendered by wild-beauty (jános.ch), accounts and node scoping

Status: preliminary plan, 2026-10-31. Nothing here is built. To be refined,
decisions in S9, risks and open points in S10 and S11. Related: `GRAPH.md` S1.3 (visibility,
groups), `PLAN.md` S8 (schema), S9 (safety without accounts), S16 (theming),
`CLAUDE.md` (mail and login), `EDITOR.md` (editor, locks).

## 1. Goal

`/etc/nginx/sites-enabled/janos` hosts `jános.ch` (also `www.jános.ch`,
`xn--jnos-5na.ch`). It should become a personal portfolio / business card /
home page: some art, links to social media, contact.

- The content is made with the wild-beauty editor and stored as wild-beauty
  nodes, and rendered by wild-beauty, but with **its own theme**.
- The sitemap (which pages exist, their order and URLs) is built in the
  tree view (`client/graph/`).
- **The site's nodes must not show up in the wild-beauty tree / gallery**
  that other visitors see (and the wild-beauty nodes must not show up on the
  site). Today every node is public and every view lists all nodes
  (`listNodes`, the graph query in `server/db/nodes.js`), so this needs a
  scoping mechanism, and the proper one is user accounts.

## 2. Current state (verified 2026-10-31)

- nginx: static vhost, `root /var/www/janos` (empty), TLS from acme.sh, no
  proxy to wild-beauty. Port 80 redirects to 443.
- Server: Bun, `server.js` routes by pathname only; no Host-based routing.
  `/` redirects to `/<lang>/gallery`. Pages: `/:lang/node/:id`, `/gallery`,
  `/tree`, `/new`.
- Nodes: `nodes(id, title, doc, palette, ...)` plus planned/optional columns
  `owner_id`, `visibility`, `group_id`, `kind`, `x/y/pinned`, `tile`, `rev`
  (`PLAN.md` S8), all unused so far (NULL / default `public`).
- No accounts: `POST /api/login` does not exist; the login dialog is UI only.
  Seeded nodes are owned by nobody and are public.
- Themes: one file `static/themes/kraft.css`; `renderPage()` takes a `theme`
  argument; nodes can wear their own theme via `data-theme`.
- Graph: rooted, depth-limited neighbourhood fetch (`/api/graph`), edge
  kinds `child` (ordered by `sort`), `sells`, `ref`.

## 3. Principle: a site is a space, owned by an account

Introduce the idea of a **space**: the set of nodes reachable from one root
node and owned by one user. The wild-beauty community tree is the space of
the curators; `jános.ch` is the space of its owner. Every view filters by
space:

| View | Shows |
|---|---|
| wild-beauty `/tree`, `/gallery`, `/api/graph` (anonymous) | `visibility='public'` nodes in the community space only |
| same, logged in | the above plus the viewer's own nodes (any visibility) |
| `jános.ch` | the nodes of the site's space only, published ones only |

A node therefore needs two independent properties:

- **who owns it** (`owner_id`), decides who may edit and whose tree it
  appears in;
- **where it is published** (`visibility` plus a new `space`/`site`), decides
  which public front end may show it.

`visibility='public'` must stop meaning "show everywhere". Proposed: public
means "readable by anyone who has the link / sees the site that lists it";
the community tree lists only nodes with `listed=1` (or `space IS NULL`).
A node belongs to exactly one space (S9.5), so no cross-publishing case.

## 4. Phases

### Phase A - interim partition without accounts (small, unblocks the site)

Goal: content nodes exist and are hidden from the wild-beauty tree before
real accounts land.

1. Migration: `nodes.space TEXT NULL` (NULL = community). `jános.ch` nodes
   get `space='janos'`.
2. All community queries (`listNodes`, graph neighbourhood, gallery source,
   places suggestions, retile/bake lists) add `AND space IS NULL`. A link
   from a community node to a space node (and vice versa) is not followed.
3. `server.js`: Host to site config (`server/sites.js`, S5).
4. Editing stays on the dev instance (port 3001, `--no-keys`, not reachable
   from the internet); the public host is read-only.

Risk: the interim flag is a convention, not a permission. It is replaced by
phase B.

### Phase B - accounts

The pieces already decided or sketched elsewhere: SQLite, `Bun.password`
(argon2id), groups/curators (`PLAN.md` S8, `GRAPH.md`), mail sent as
`noreply@transistorisiert.ch` (Postfix/Dovecot on this host, `CLAUDE.md`).

1. Tables: `users(id, email UNIQUE, name, pw_hash, created_at, verified_at)`,
   `sessions(token_hash PRIMARY KEY, user_id, created_at, expires_at, ua)`.
   Session cookie `wb-auth` (HttpOnly, Secure, SameSite=Lax), separate from
   the anonymous `wb-session` used for uploads.
2. Routes: `POST /api/register` (mail verification link), `POST /api/login`,
   `POST /api/logout`, `GET /api/me`, password reset by mail. Rate-limit per
   IP and per account. The login dialog already exists in the UI.
3. Ownership: `nodes.owner_id` set on create; migrate existing nodes to the
   first admin (or leave NULL = community). Permission check in one module:
   `canEdit(user, node)` (owner, or group admin/curator, `PLAN.md` S8),
   `canView(viewer, node)` (visibility rules). All node/graph/upload/lock
   routes go through it.
4. Replace `nodes.space` by ownership + site mapping: the site config names
   an owner and a root node; the space is "everything reachable from that
   root through `child`/`ref` edges that the owner owns".
5. Anonymous uploads (`wb-session`) stay as they are; saving a node needs an
   account once registration is open (or stays open in dev, `--no-keys`).

### Phase C - the site front end

1. nginx: replace the static `root` with `proxy_pass` to the wild-beauty
   process (port or unix socket), forwarding `Host`, `X-Forwarded-For`,
   `X-Forwarded-Proto`. Keep TLS, keep the 80 to 443 redirect. Serve
   `/static/`, `/vendor/`, `/files/` through the same proxy (or directly
   from nginx with caching).
2. `server/sites.js`: table `host -> { owner, rootNodeId, theme, lang,
   title }`. In `route(req)` a matching host switches to the site router; the
   editor/tree/gallery/upload routes return 404 on that host.
3. Site router: `/` renders the root node, `/<slug>/<slug>` the page found by
   walking `child` edges by slug. Single language (S9.3), no `/<lang>/` prefix.
4. Template `sitePage()` (own markup: header nav built from the root's
   children, footer with social links), reusing the node SVG interpreter
   (`client/editor/render.js`). The theme contract says themes do not change
   markup (`PLAN.md` S16.1), so the minimal public layout is a template, not
   a theme.
5. Theme `static/themes/janos.css`: the full token set (every theme is
   self-contained, S16.3), chosen by the site config. Possibly a few extra
   tokens (nav, hero) added to all themes and the sanitiser whitelist.
6. SEO/ops: `<title>`, description, Open Graph image from the baked `tile`,
   `/sitemap.xml`, `/robots.txt`, caching by `rev` ETag, 404 page, canonical
   host (punycode `xn--jnos-5na.ch` redirects to `jános.ch`).

### Phase D - sitemap in the tree view

1. Schema: `nodes.slug TEXT` (unique among the siblings of one parent; NULL
   = not routable), `kind='site'` for the root, `kind='page'` for pages.
2. Graph "site lens" in `client/graph/`: select a site root, draw its
   subtree with the URL path on each node, unpublished nodes dimmed,
   warnings for missing/duplicate slug, orphan pages, unreachable nodes.
3. Operations (already in `/api/graph/ops`): add child, reorder (`sort`),
   relink, set slug; permission check by owner.
4. Derived outputs from the same data: navigation menu, breadcrumbs,
   `sitemap.xml`.

### Phase E - content and extras

Home / about / contact pages with the editor; an art section as `gallery`
or `album` (3D gallery or plain grid); a "link" step (label, URL, icon) for
social media; contact via mail link or a form posting to Postfix (spam
protection needed); optional static export into `/var/www/janos`.

## 5. Site config (sketch)

```js
// server/sites.js
export const sites = {
  'jános.ch': { id: 'janos', owner: 'roman', root: 1234, theme: 'janos', lang: 'de' },
  'xn--jnos-5na.ch': { redirect: 'jános.ch' },
  'www.jános.ch': { redirect: 'jános.ch' },
};
```

Later in a `sites` table so it is editable in the UI; a file is enough to
start. `Host` must be matched after lower-casing and punycode normalisation.

## 6. Security notes

- A site host serves only public, in-space nodes; never the editor,
  `/api/uploads`, locks or events. Check the space on every node, photo and
  tile request (`/files/photos/:hash` today serves any hash: a photo that is
  only used by a hidden node is currently reachable by hash; decide whether
  that matters, GRAPH.md S1.3).
- Slugs are user content: restrict to `[a-z0-9-]`, reserve `api`, `static`,
  `vendor`, `files`, `app`, `sitemap.xml`, `robots.txt`.
- Theme CSS stays in the sanitised token system; no user-supplied CSS on the
  site.
- Accounts: argon2id, constant-time compare, verification and reset tokens
  hashed in the database, single use, short expiry; never log credentials;
  mail credentials stay out of the repository (`CLAUDE.md`).
- CSRF: SameSite=Lax cookie plus an origin check on state-changing routes.

## 7. Testing

- Unit: `canView`/`canEdit` matrix (owner, curator, member, anonymous x
  hidden/group/public x community/site space).
- Integration: community `/api/graph` and `/tree` never return a node of
  another space; site host never returns a community node; the editor
  routes 404 on the site host.
- Slug routing: nested path, duplicate slug rejected, reserved slug rejected,
  unpublished page 404, renamed slug.
- nginx: `nginx -t`, curl with `--resolve` for `jános.ch` and the punycode
  name, redirect of `www`, HTTP to HTTPS.

## 8. Milestones (proposed)

| # | Deliverable | Needs |
|---|---|---|
| S1 | Phase A: `space` column, community queries filtered | nothing |
| S2 | Phase C steps 1-3, 5: proxy, Host routing, `janos.css`, root page | S1 |
| S3 | Phase D: slugs, nav from the tree, `sitemap.xml` | S2 |
| S4 | Phase B: accounts, ownership, permission module | mail setup (`PLAN.md` S17) |
| S5 | Replace `space` by ownership; site lens polish | S4 |
| S6 | Phase E: content, social links, contact, optional static export | S3 |

S4 can run in parallel with S2/S3; S1 is the only prerequisite for hiding
the site's nodes.

## 9. Decisions (2026-10-31, from the first round of questions)

1. **Live first.** The site is rendered live by wild-beauty behind nginx. A
   static export stays a possible later add-on (Phase E).
2. **Editing: open for now, accounts ASAP.** Everyone may edit, as today
   (`--no-keys`). See S10 R1: that must not extend to the site's nodes on the
   public host.
3. **Single language.** One doc per page, no `/<lang>/` prefix on the site,
   no per-language texts. `<html lang>` comes from the site config.
4. **Theme `janos`:** white background, neutral and minimal. Expected to
   change when the owner has artwork of their own; maybe an in-editor theme
   editor later (not planned now). Keep the token set complete so a restyle
   is a CSS-only change.
5. **A piece lives on one site only.** No publishing to both the site and
   the community tree, so no copy/`ref` case: a node belongs to exactly one
   space. The site has its own layout (`sitePage()`, S4 Phase C).
6. **Same mechanism for `transistorisiert.ch`** (`sites-enabled/default`);
   see S10 R3 for what is different there.
7. **Accounts: first a manually created user** for
   `janos.morzsinay@gmail.com` (row inserted by a CLI, no registration, no
   mail round trip). Registration with mail verification comes later.
8. **Contact by mail, WhatsApp and Facebook at least:** link nodes/steps
   (`mailto:`, `https://wa.me/<number>`, Facebook page URL), no contact form,
   so no spam protection and no outgoing-mail code for the site.
9. **Photos: yes, the photo route checks the site.** `/files/photos/<hash>`
   on a site host is served only if the photo is used by a published node
   of that site's space (and likewise the community host refuses photos used
   only by site nodes). Implementation: look the hash up in `node_photos`
   joined to `nodes.space` / visibility.
10. **Host names and PWA.** `www.jános.ch` and `www.transistorisiert.ch` are
    CNAMEs that end at `enkilo.gotdns.ch`, the dyndns name that follows the
    server's IP (`www.jános.ch` -> `janos.transistorisiert.ch` ->
    `enkilo.gotdns.ch`; every `*.transistorisiert.ch` is a CNAME to
    `enkilo.gotdns.ch`); the apex names
    (`jános.ch`, `transistorisiert.ch`) are A records set by hand at the DNS
    provider and can be stale after an IP change. Therefore **`www.` is the
    canonical host**:
    - apex and `xn--jnos-5na.ch` redirect (301) to `https://www.xn--jnos-5na.ch/`
      (shown as `www.jános.ch`); the apex is only a convenience entry
    - manifest `id`, `start_url`, `scope`, `<link rel=canonical>`, Open Graph
      URLs, `sitemap.xml` and every absolute link use the `www.` host
    - the manifest and service worker are served per host (today
      `server/pwa.js` has a single fixed manifest "Wild Beauty",
      `start_url /new`, `scope /`); the site gets its own name, icons,
      colours and `start_url /`
    - certificate must cover `www.` names (the janos cert from acme.sh
      covers `jános.ch`; check that SANs include `www.` and the punycode
      forms, and issue one for `transistorisiert.ch` / `www.`)
    - the redirect from the apex only helps if the apex resolves; that is
      the owner's manual DNS job and is outside the code

## 10. Risks and new open points from these answers

R1. **"Everyone may edit" vs. a public site - solved with accounts
    (2026-10-31).** wild-beauty is reachable from the internet as
    `wild-beauty.transistorisiert.ch` and has no registration, so anyone may
    edit community nodes (`--no-keys` is only the terminal restart keys, Ctrl+R
    / "rs"). A node with an `owner_id` or a `space` is written by its owner
    only: `server/guard.js` runs before every write route (node routes, their
    `/lock` and `/large`, graph ops) and answers 403 otherwise. An interim
    shared edit key was built first and removed again.
R2. **Decided: the owner edits on the wild-beauty host**
    (`https://wild-beauty.transistorisiert.ch/de/new`), the site host stays
    read-only.
R3. **Postponed (2026-10-31): no transistorisiert.ch site for now.** Kept for the record - the vhost is not free. `sites-enabled/default`
    already serves other things on the same host (plot-cv upload server at
    `/` via `@upload-server`, `/ws`, `/uploads`, `/static`, `/tonnetz`,
    `/wild-beauty/`, …) and listens on port 80 only (TLS is not in that
    file). A site at `/` of `www.transistorisiert.ch` collides with those.
    Open: which hostname/path is the transistorisiert.ch site (the whole
    domain, or only e.g. `www.` while the apex keeps the current services),
    and who owns it (same janos user, or a different account)?
R4. **Host routing with a path prefix.** wild-beauty currently runs under
    the `/wild-beauty/` prefix on transistorisiert.ch; absolute URLs
    (`/static/…`, `/api/…`) must already work through that, or via
    `X-Forwarded-Prefix`. The site hosts serve at `/`, so they need no
    prefix, but the router must key on `Host` (and the forwarded header),
    not only the path.
R5. **Account for the janos user.** Needs `users` (Phase B step 1) before
    the guard in R1 can be per-user; until then a password in an
    environment/runit file, not in the repository.
R6. **Certificates - done 2026-10-31.** The acme.sh certificate
    `~/.acme.sh/jános.ch_ecc` (ZeroSSL, issued 2026-10-30, valid to
    2027-01-28) already covers the correct punycode names `xn--jnos-5na.ch`
    and `www.xn--jnos-5na.ch`, so it was not reissued. The vhost used
    `xn--jnos-koa.ch` (wrong) and UTF-8 names (nginx does not convert them,
    browsers send punycode), so it never matched and every request fell
    through to the `transistorisiert.ch` default server. Fixed: `sites-available/janos`
    now serves `www.xn--jnos-5na.ch`, redirects the apex and port 80 to it, uses the
    installed copy in `/etc/nginx/ssl/janos/` (acme.sh reload command
    `systemctl reload nginx`) and answers `/.well-known/acme-challenge/` from
    `/var/www/html` on port 80 for renewals. nginx reloaded (not restarted).
    The cert's next renewal is 2027-01-14.

## 11. Built 2026-10-31

- **Accounts (Phase B, minimal):** migration 6 (`users`, `sessions`,
  `nodes.slug`); `server/auth.js` (argon2id via `Bun.password`, session cookie
  `wb-auth` as hash in the database, 10 failed logins per quarter hour and
  client, `POST /api/login`, `/api/logout`, `GET /api/me`). No registration:
  users are made with `JANOS_PASSWORD=... bun tools/janos-seed.js [email]`
  (the password is never in a file).
- **Visibility:** `canView`: a node with a `space` is seen by its owner only
  (tree, gallery, saved nodes, node page, API). Anonymous visitors of the
  wild-beauty host never see the site's nodes.
- **Site host:** `server/sites.js` maps `www.xn--jnos-5na.ch` to the site
  `janos`; `server/site.js` builds the sitemap (root node of kind `site`, its
  `child` links in order, first page at `/`, others at `/<slug>`);
  `server.js siteRoute` answers pages, `/edit/` (302 to
  `https://wild-beauty.transistorisiert.ch/de/new?site=janos`), `robots.txt`,
  `sitemap.xml`, a per-site manifest, and lets `/static`, `/vendor`, `/app`,
  `/files/photos` and `/sw.js` through. Everything else on that host is 404
  (no `/api`, no editor).
- **Login on /edit/:** `/de/new?site=janos` without a session opens the login
  dialog and it cannot be dismissed; a successful login reloads the page, which
  then lists the site's nodes under "Saved nodes".
- **Layout:** `client/components/SitePage.js`, `static/css/site.css`, theme
  `static/themes/janos.css` (white, neutral). Navigation above the stage:
  lower-case links separated by a middle dot, underline on hover, the current
  page at full opacity. The stage has no border and no background, and a
  page colour (`doc.bg`) is not painted either.
- **Content:** root `jános.ch` (id 24) with `Start` (`/`), `Über` (`/about`),
  `Kontakt` (`/contact`), owned by janos.morzsinay@gmail.com, `space='janos'`.
  Contact lines are placeholders (see S12).
- **nginx:** `sites-available/janos` proxies `www.xn--jnos-5na.ch` to
  127.0.0.1:3001; the apex redirects to `www.`.

- **Logout and ownership (later the same day):** a logged-in user sees
  "Abmelden" with their address instead of the login tab (it calls
  `POST /api/logout` and reloads). A node created by a logged-in user gets
  their `owner_id` (`saveNew`), so only they change it; it stays a community
  node (no `space`), visible to all.
- **Contact data in text boxes (`client/editor/links.js`):** `detect(text)`
  finds mail addresses, phone numbers (`+`/`00`/national, 8-15 digits, dates
  and prices excluded), `mailto:`/`tel:`/`sms:`/`geo:`, WhatsApp (`wa.me`,
  `whatsapp://send?phone=`, `chat.whatsapp.com`), Telegram, Signal, Threema,
  fediverse handles (`@user@host`) and the profile/page links of Facebook,
  Instagram, YouTube, TikTok, X/Twitter, LinkedIn, GitHub, Bluesky, Threads,
  Pinterest, Snapchat, Spotify, SoundCloud, Bandcamp, Vimeo, Twitch, Reddit,
  Discord, Behance, Dribbble, Flickr, Medium, Tumblr, Patreon, Ko-fi, PayPal.me,
  Linktree, maps (Google, OSM, Apple, `geo:`), and any other web page (with a
  scheme or `www.`); platform hosts also without a scheme. Only http(s),
  mailto, tel, sms and geo links are ever made. In a viewer (`NodeView`,
  hence the site and the node page) a text box draws them as SVG `<a>`
  (underline on hover); the editor, the tiles and the 3D gallery do not.
  `normalizeShared` / `htmlWords` / `vcardLines` tidy what a paste brings (used by
  `classify` in `clipboard.js`): a vCard as lines, `text/uri-list`, the target
  of an HTML link kept, `mailto:`/`tel:` as the plain address/number, WhatsApp
  deep links as `wa.me`, sharer parameters (`igsh`, `si`, `fbclid`, `utm_*`, ...)
  removed. The Kontakt page holds placeholders for mail, phone, WhatsApp,
  Facebook, Instagram and YouTube as plain text lines.

Not done yet: registration and password change, photos are served to anyone with
the hash (S9.9 half done), the sitemap "site lens" in the tree (Phase D),
a Web Share Target (`share_target` in the manifest, so "share to wild-beauty"
from a phone's share sheet lands in a text box), a detected-link chip in the
editor (what was recognised, with its type).

## 12. Pages and next questions

Pages of `www.jános.ch` (2026-10-31): **home**, **about**, **contact**, and
optionally **art**. Contact by mail, WhatsApp and Facebook, with
placeholders for now (`mailto:janos@example.invalid`, `https://wa.me/0000000000`,
`https://www.facebook.com/placeholder`) until the owner gives the real values.
Sitemap: root node (`kind='site'`) with children `home` (`/`), `about`
(`/about`), `contact` (`/contact`), later `art` (`/art`).

Open:

- The site root answers 404 until Phase C (the Host router and `sitePage()`)
  exists; `/var/www/janos` is empty. Put a neutral placeholder page there
  meanwhile?
- Phase A step 2: filter the community queries (`listNodes`, graph, gallery)
  by `space IS NULL`, so the site's nodes stay out of the tree.
- Art: one gallery page or one page per work?
- Which mail address is the contact address (janos.morzsinay@gmail.com?)
- Manual user for `janos.morzsinay@gmail.com` (Phase B step 1) and editing
  the site from the wild-beauty host once the user exists.

## 13. Registration, ownership and visibility (2026-10-31)

Decided: the app keeps an **open public area** (nodes nobody owns: everybody may
create and change them, logged in or not) next to the **accounts**.

- **Registration (minimal):** the login dialog has a second mode, "Neu hier? Konto
  erstellen": a mail address and a password of 6 characters or more, nothing else
  (`POST /api/register`, `server/auth.js`). No activation mail; the address is
  kept for a later password reset (not built; mail would go out as
  `noreply@transistorisiert.ch`). The new user is logged in at once and the page
  reloads. At most 5 accounts per client and hour; `WB_REGISTRATION=closed`
  switches it off. A taken address answers 409 (it says the address exists;
  acceptable while there is no mail round trip).
- **Who changes a node** (`server/guard.js`, before every write route): the owner
  of an owned node; everybody for a node without owner and without space. 401
  `login_required` when a visitor touches an owned node, 403 for someone else's.
  A logged-in user's new node (`POST /api/nodes`, or a group made in the graph
  view) gets their `owner_id` and is **hidden**; a visitor's stays ownerless and
  public, as before. Graph ops change only what they name: the `from` of a link,
  the node of a move; they may point at any node the user can see.
- **Who sees a node** (`canView`): the owner always; everybody else if it is
  `public` and not a node of a site. So a user's nodes appear in the tree, the
  gallery and on the node page of others once made public, and nobody but the
  owner can change them. The node page offers "Edit" only to those who may.
- **Visibility:** `POST /api/nodes/:id/visibility { visibility }` (owner only, rev
  unchanged); in "Saved nodes" a Public/Private chip on the user's own nodes.
  The pages of a site need `public` (a hidden page is a draft).
- **Publish / unpublish (2026-10-31):** in the editor the Visibility select of the
  Properties panel (Public / Private) works for a saved node of the user's (it calls
  the visibility route; a new node of a logged-in user is private until published).
  In the graph editor a *Publish* / *Unpublish* button acts on the selected nodes
  that are the user's (graph op `visibility`; private nodes are drawn dimmed with a
  dashed frame). A node nobody owns has no visibility to change.
- **The site is not in the tree:** the nodes of a site (`space`) are left out of the
  tree and the "Show" gallery for everybody, their owner included; they are in the
  owner's "Saved nodes" list. (So the sitemap cannot be built in the tree yet; the
  Phase D site lens would have to show them on purpose.)
- **The editor's list (Saved nodes):** a logged-in user sees their own nodes; a
  visitor sees the open public area. `GET /api/nodes` is the same list.
- **Legacy nodes** (23 from before accounts, ownerless, public) stay in the open
  public area. `bun tools/adopt.js <email> <id...|--all>` gives some of them to a
  user, after which only that user changes them.

Not done: password reset (needs the mail), profile data, "group" visibility,
a per-user quota on nodes and uploads (open registration invites abuse), a
visibility filter ("mine / all") on the tree and gallery.

