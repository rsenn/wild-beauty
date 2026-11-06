# Search engines and link previews: basic SEO (asked 2026-11-06, built the same day)

Why: the site has been visited from Google (2026-11-04) and Googlebot reads the front page, but the pages say nothing for a search result (no description, no sitemap, no `robots.txt`) and chat apps draw bare previews. The owner wants a basic SEO and, above all, **no private photos published**.

## 1. Rule: nothing is findable unless the owner's rule says so (owner, 2026-11-06)

A page is offered to search engines only when all of these hold:
1. the node is **public** (`visibility = 'public'`), **owned by a user** (a node of the open public area, which nobody owns and everybody may change, is never offered: with a wide reach a stranger could put anything there) and not a page of a personal site (`space` empty; those sites have their own `robots.txt` and sitemap, `server/site.js`);
2. its **findable** setting allows it: `nodes.search` (NULL, 1 or 0):
   - `1` = the owner made it findable,
   - `0` = never findable,
   - NULL (the default) = the **default rule**: a **collage** (kind `node`, mode `free`) is findable; photo sets (modes `grid`, `slides`) and galleries, lists and albums are **not** (the owner: "the collages I made are all OK"; the private photos are in the photo sets and the trip galleries).

The **front page** (the Show page, `/:lang/view`) is findable too (owner, 2026-11-06, with the text of S5; it lists the titles of public galleries but no photo is offered to image search). Every other page carries `<meta name="robots" content="noindex, noimageindex">`: the graph, the editor, the profile, the admin, a photo set, a gallery. **No photo is offered to image search at all** (decided, first version): every `/files/photos/*` answer carries `X-Robots-Tag: noindex`, and every page `noimageindex`. A link preview in a chat app is not search and is not affected.

The setting is changed with `bun tools/findable.js ID... --on | --off | --default` (a button in the editor or the batch editor is a later step; listed in `TODO.md`). The tool also lists what is findable now (`--list`).

## 1b. The front page lists only what may be found (owner, 2026-11-06)

The front page lists the public galleries as cards (title, picture count, preview photos). A page cannot be findable in part, so a gallery that is not findable (the owner: "Garden Route is too private") must not be on it for a crawler. Rule: **a visitor who is not logged in sees only the findable galleries on the front page**; a gallery that is public but not findable is **unlisted**: it opens by its link (the testers, family), it just is not listed or found. A logged-in user sees every gallery they may see, as before. Same rule for the cards' preview photos (they are in the same list).

## 2. What a findable or shareable page says

- `<title>` as before (`Wild Beauty - <title>`), plus per page: `<meta name="description">` = the node's title and, with more than one picture, the number of pictures ("Garden Route: 1,034 pictures on Wild Beauty"), the first line of the first note added when there is one; at most 160 characters. Strings `seo.*` in four languages.
- `<link rel="canonical">` (the page in its own language), `<link rel="alternate" hreflang>` for the four languages and `x-default` (the default language).
- Open Graph and Twitter card: `og:site_name`, `og:title`, `og:description`, `og:type`, `og:url`, `og:locale`, `og:image` = the node's tile thumbnail (`/files/photos/<tile>.thumb.jpg`, absolute) and `twitter:card` = `summary_large_image`. These are written for every public node (they only help chat previews), also for the ones that are not findable: a public node is public, but a chat preview is made only for a link somebody shares.
- The server address is `WB_PUBLIC_URL` when set, else the scheme and host of the request.
- `WB_SITE_VERIFICATION` (optional) adds `<meta name="google-site-verification">` so the owner can use Search Console.
- A gallery's page lists its child nodes as plain links (visually hidden, `nav`), so a crawler can follow them (they are noindex or findable by their own rule).

## 3. `robots.txt` and `sitemap.xml` (the main host)

- `robots.txt`: `Allow: /`, `Disallow: /api/`, `/files/`, and the editor pages (`/*/new`, `/*/admin`, `/*/profile`, `/*/tree`), and the `Sitemap:` line. (`/app/` and `/static/` stay open: Google needs them to draw a page.)
- `sitemap.xml`: the front page and the findable nodes, each in the four languages with `xhtml:link` alternates and `lastmod` from `updated_at`, at most 50,000 entries. With nothing findable it is empty.

## 5. What the site says about itself (owner, 2026-11-06)

**Positioning (owner, 2026-11-06): Wild Beauty is advertised and marketed as "photo collages and galleries" and as an easy creative tool for everyone.** The text of the front page (`seo.home.title`, `seo.home.description` in `locales/*.json`): "Wild Beauty - photo collages and galleries. An easy creative tool for everyone: arrange your photos into collages and galleries, annotate them and show them to others." It says only what the site does today.

**Not stated yet, on purpose** (the owner's direction): Wild Beauty is also meant to be a **playground, a marketplace for artists and a flea market for anyone**, but that is not offered yet, so no page and no search snippet claims it. When it is, the text is changed here and in the locales. A second idea, not started: an **offline-capable PWA** with the node editor, so a collage can be made without a network (tools that need the server, such as the wand and the background removal, would need one); listed in `TODO.md`.

## 4. Not in the first version

JSON-LD structured data; an image sitemap and image search (the owner's privacy first); a button for the setting in the node editor (the CLI first); per-language descriptions written by the owner; a robots rule per node in the editor.
