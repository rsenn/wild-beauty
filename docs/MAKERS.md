# Makers: what the editor needs for people who make and sell small goods (owner 2026-11-06, plan, nothing built)

Persona (the owner's reference, not a named person; her work is hers, `docs/DESIGN.md` S3 goal 9): a woman who makes jewellery, cards or other goods at home, styles her photos with care (a bracelet on a kraft card with a pill label in script type, a stall with warm wood), posts on Instagram and Facebook, works **on the phone**, in German. She should *want* to create and publish here. Theme: `docs/THEMES.md`. A catalogue maker is parked until a real user asks (`docs/ALBUM.md` S6); this plan is what she needs for single works, collages and galleries.

## 1. Her jobs, in her words

1. "Show this new piece nicely": one product photo, cleaned up, on a good ground, with a name and a short text.
2. "Make a card or post I can put on Instagram, Facebook or a print-out": the right shape and size, my look, my logo.
3. "Show the whole collection": a set of pieces as a gallery or slideshow, in an order I choose, with a caption each.
4. "Look like me every time": same colours, same logo, same fonts, without redoing it.
5. "Send people a link or a QR code at the market".
6. "Keep it mine": hide it, unhide, delete, take it with me (`docs/DESIGN.md` S3 goal 9).

## 2. What the editor already has (from `docs/EDITOR.md`, to confirm in the running app)

Photos dropped in with a square crop; wand, clip and background removal (cut a piece out of its busy background); pen, shapes, text boxes with font roles `fixed`/`serif`/`sans`, colour, **solid or gradient background with alpha and pill radius**, palette picked from the photos; stage ground colour or gradient; rim, torn edge, shadow and polaroid frames; duplicate and flip; modes free, grid and slides; pages; notes on photos; export as image (E125); undo; save; the batch editor for many photos; the book (print and server PDF).

## 3. Gaps, by what she needs first

**A. First work in two minutes (do first)**
- **A1. Stage formats.** The stage is square (`aspect-ratio: 1`). She needs **4:5 (Instagram post), 9:16 (story), 1:1, A6/A5 card portrait and landscape** as a per-node choice, with export at the right size (1080 x 1350 etc.). A big change to the model (`doc.stage`) and to every renderer: decide the data shape in `docs/EDITOR.md` first (open: a width/height pair with presets, or a ratio only).
- **A2. Starter templates.** A "new from template" step: "product on a card" (photo, pill label, small logo spot), "price tag", "collection of 4", "story with title". A template is a normal document (a node the owner of the site or the user marks as template); a copy is made, nothing special at runtime.
- **A3. A script face.** A fourth font role `script` (shortlist in `docs/EDITOR.md` S2.4 has Square Peg; check licence, one variable font file) and a few **text styles** (pill label, price tag, headline, small print) that set font, colour, background and radius in one tap.
- **A4. Ground presets.** Warm backgrounds that suit handmade goods: plain colours from the palette plus a few paper/linen/wood-like grounds (as images from `static/` or a user's own photo as ground, which works already if the stage can take a photo; to check).

**B. Look like me every time**
- **B1. Brand kit in the profile.** Saved colours (own swatches next to the photo palette), preferred fonts/text styles, and a **logo stamp**: one image the user uploads once and places in any work in a tap (corner, size, opacity). Stored under the user, deletable (`docs/DESIGN.md` S3 goal 9).
- **B2. Copy a work as the start of a new one** ("duplicate node"), and "paste style" between text boxes. Duplicate and flip of steps exist; the node duplicate must be checked.

**C. Out into the world**
- **C1. Export every page as an image, and all pages as a zip**, at the stage's size: a carousel for Instagram in one go (E125 exports one image).
- **C2. Share link and QR code** for a public work or gallery (a printable QR on a card); needs the SEO/unlisted rules (`docs/SEO.md`) respected: a link works for unlisted works, the QR never makes a hidden work public.
- **C3. Mobile ergonomics**: big tap targets, no hover-only controls, one-hand toolbar, a clear "Save and leave". Part of every item above; check on a phone (`docs/EDITOR.md` S6a phone notes).

**D. Care for the photos themselves (later, hard)**
- **D1. Light and colour fix** (brightness, warmth, auto-enhance). The editor rule: no effect that cannot be reproduced exactly on the server, so no browser filters. Do it as a **server-side baked variant** with provenance and one undo step, like the wand (`docs/WAND.md`); decide after A-C and after a real user says it matters.
- **D2. Align and distribute, snapping guides** for laying out many pieces evenly. To check whether anything exists; she will want it for catalogues too.
- **D3. Alt text for photos** (accessibility, and better previews): a field next to the note.

## 3b. Further requirements of the same use case (added 2026-11-06, after a second look at the reference posts)

- **E1. Caption text for other platforms.** Her posts carry a long caption with emoji and hashtags, and a series of 6 to 12 pictures. The notes of photos and the work's text must take any Unicode (emoji included) and long text, and a **"copy the text for posting"** button should give the captions of a work as one block (all of them or the chosen ones) to paste into Instagram or Facebook. Together with C1 (all pages as images) this makes Wild Beauty the place where a post is made, wherever it is published.
- **E2. Contact and "where to find me".** A maker wants visitors to reach her: a contact line on her profile (a mail address, a phone or messenger link, a link to her other pages), shown on her public works only when she chooses to, never taken from the account's mail address. This is not a shop and takes no orders (`docs/ALBUM.md` S6 is parked).
- **E3. Markets and events.** She shows where she will be (a festival, a market): a work of kind "event" with a place and a date, using the place names that exist (`docs/GRAPH.md`, place chips) and listed on her profile, optional and her choice.
- **E4. Printed cards.** Her products come on printed cards with a handwritten-style line: the stage formats of A1 must include small print sizes (A6 portrait and landscape, with bleed) and the export must be print quality (300 ppi), so a card made here can be sent to a printer.
- **E5. A series with one look.** Several works in the same style (same ground, label style, logo): B1 (brand kit) plus "copy a work" (B2) plus a **style copy** between works; test with 10 works in a row.
- **E6. Language and tone.** German first (Swiss usage), French and Spanish after; sample texts, template names and the empty states say what to do in a warm, plain voice, not in tool language.
- **E7. Findability by her choice.** Her works are only found by search engines when she says so (`docs/SEO.md` S1); a public gallery of her pieces is a good candidate for the "findable" switch, off by default.
- **Not wanted (non-goals).** Likes, follower counts, a feed or an algorithm: Wild Beauty is not a social network (`docs/DESIGN.md` S1 spirit). Comments on works are a possible later feature and are not planned.

## 4. Order

1. Decide A1 (stage formats) in `docs/EDITOR.md`; it touches everything, so first.
2. A3 script role and text styles; A4 grounds.
3. A2 templates (they need A1, A3, A4).
4. B1 brand kit and logo stamp; B2 node duplicate.
5. C1 page export and zip; C2 link and QR.
6. D items when asked for by a real user.

Each item: spec in the proper doc first (project rule), tests, `docs/DEVELOPER.md`, 4 languages. A real maker tries after step 3 and decides what comes next.

## 5. Open

Stage format data shape (A1); who may mark a template and whether users can share their own templates (later, with consent); script face and licence; whether the logo stamp is a node of its own (the avatar/root node idea in `docs/PROFILE.md` already gives every user a drawable node: a candidate); how much of a brand kit a guest gets (probably none until claimed).
