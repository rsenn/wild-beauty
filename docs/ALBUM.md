# Photo book: a node or a gallery printed like a real photo album (asked 2026-11-05, version 1 built 2026-11-06, see S4c)

Wish (the owner): a photo album like the carousel, with the photos and the notes beside them (`docs/GALLERY.md` S5c), can be printed and looks like a real photo album. Use case: the Garden Route trip (a gallery of trip nodes of 74 to 161 photos each, notes written per picture, U9 in `docs/BATCH.md`) as a book to hold.

Name: the masonry view of the gallery is already called "Album" in the buttons (`docs/GALLERY.md` S5a); this feature is the **photo book** (en), to keep the two apart. Strings to be chosen for de, fr, es.

## 0a. Use case 2 (the owner, 2026-11-05): the Garden Route as a book for the owner's son, only the annotated photos

The Garden Route gallery has about 800 photos; printed whole it would be a book far too big. The owner annotates the pictures that tell the story (`docs/GALLERY.md` S5c) and wants a book of **only those**. So writing a note is also the way to choose a picture for the book.

Proposed rule (not decided): the book has the option **"Only pictures with a note"**, a plain filter on `desc`, no new data. It is on by default when at least one picture of the node or gallery has a note, off otherwise (a node without any note prints whole, or the page says so). A chapter without any note gets no title page and is left out of the table of contents (with a line in the options: "3 chapters have no notes"). The page tells how many pictures and pages the book has with the option on and off before the print is started ("62 pictures, about 62 pages; all: 805 pictures, about 205 pages"). Open: whether the owner can also set the book's default per node (a field in the document, `layout.book`) so that visitors who print a public node get the owner's choice, and whether the same filter ("only pictures with a note") belongs in the carousel and album views as a switch; both are separate decisions. The owner also wants a **PDF** of that book (to keep, to send to the son, to take to a print shop). With the decision "browser print only" (S4) the PDF is what the browser makes at "Save as PDF" in the print dialog: the same A4 pages, no server part. A **download button that makes the PDF on the server** (B in S2: headless Chrome of this host) is parked, and this use case is the reason to take it up again if "Save as PDF" proves too fiddly (a visitor's browser, 60 to 200 big images, no bleed). To ask the owner: is "Save as PDF" in the print dialog enough, or a one-click PDF download wanted? Not a way to choose the pictures: the `off` flag (it hides the picture from every viewer). It does work the other way round (owner, 2026-11-06): **disabling an annotated photo takes it out of the book** (and everywhere else), because the server leaves disabled photos out before the book is built; a placeholder note (`docs/BATCH.md` S6a2) puts a picture in without text.

A candidate for the batch editor, to be gated as in `docs/BATCH.md` S9: a filter "with a note / without a note" in the photo view, to find the pictures still to be annotated.

## 1. What a real album has (to pick from, not all at once)

- **Pages in spreads**: two facing pages, odd pages on the right, a gutter in the middle; on screen shown as a spread, in print as single pages or as spreads.
- **Chapters**: a gallery's child nodes are chapters, each with a title page (title, date range, place: the node's title is already "Place, date"), a table of contents at the front, page numbers.
- **Several photos per page** by a template chosen from the pictures' proportions (1, 2, 3, 4, 6 per page; landscape and portrait mixed), in the order of the node.
- **The notes** (`desc`) under or beside their photo, in a handwriting-like face, small.
- **The look of the paper and the mounts**: kraft or cream page, thin white border or a polaroid frame, photo corners, a slight turn of a few degrees, a soft shadow. Skins as themes (the project already has token themes, `docs/PLAN.md` S16), so the plain print is the base and a skin is a choice.
- **A cover** with the title, the dates and a picture.

## 2. How to get it onto paper (options)

- **A. A print page in the browser (cheapest, first).** A page `/:lang/node/:id/book` laid out with CSS paged media (`@page` size, page breaks, `break-inside: avoid`), shown on screen as spreads, with a "Print / Save as PDF" button. No new server parts. Weakness: browsers differ in how they print 100 big images and no bleed or crop marks.
- **B. A PDF made on the server by a headless browser (dropped 2026-11-06, see S4d: no headless Chrome on the server).** The same page rendered by a headless browser to a PDF (this host has `/usr/bin/google-chrome`, so `--headless --print-to-pdf` would give the same pages as on screen), a download link. Print shops and the owner's printer get a file that does not depend on the visitor's browser. Weakness: a Chrome dependency on the server, time and memory for 160 photos (to be measured), and an RGB PDF (no CMYK).
- **C. SVG pages by `rsvg-convert` or Inkscape** (the tools of the tile render): exact control, but a second layout engine next to the CSS one; only if A and B fall short.

Decided: A only (S4). B stays here as a possibility.

## 3. Facts that limit it

- The baked photos are at most 2048 px on the long edge, metadata stripped (`server/media/bake.js` `MAX_EDGE`); the originals are deleted after 7 days. So about 17 cm on the long edge at 300 dpi, a full A4 landscape picture about 175 dpi: fine for a photo book, not for a poster. Printing more would need the originals kept.
- Notes are plain text of up to 5000 characters per photo, with paragraphs (`docs/GALLERY.md` S5c, built 2026-11-06): half an A4 page of notes beside a picture is possible, so a page template must let a long note take the room of its photo's page or flow onto a text page.
- Page count: a gallery of 8 trip nodes with 800 photos is 130 to 200 pages at 4 per page; the browser print of that is the weak point of A.

## 4. Decided by the owner (2026-11-05)

1. **Paper: A4.**
2. **Spreads** (a book open shows two pages side by side, the left and the right one, with the fold in the middle): the owner does not need the term. Proposed and simplest: **single A4 pages**. Printed double-sided they can get a wider inner margin on alternate pages (so the holes or the binding do not cut into the picture); to be switched on only if wanted. Orientation: **portrait** (decided 2026-11-06).
3. **Browser print only** (2026-11-05; changed 2026-11-06: a server PDF is added, made without a browser, see S4d). The print page stays.
4. **The whole gallery as chapters from the start**: every child node of a gallery is a chapter with its own title page; a node alone is a book of one chapter.
5. **Look: a plain white page with captions.** Skins (kraft, white-bordered photos) are later.
6. **Every visitor of a public node can print it** (it is their browser's print; the page needs no login, the owner's private nodes stay private).

## 4b. The page (owner, 2026-11-06)

- **White page, no borders** (no frame, no mount, no shadow around a photo; the photo runs to the margin of the text area). This is the plain look of S4 point 5.
- **The note goes right of the photo or below it.** With portrait pages (see below) the note is below the picture; a tall picture with a short note may have it on its right; the first line of the note is the heading (`docs/GALLERY.md` S5c).
- **The chapter name is printed once, at the start of the chapter** (owner, 2026-11-06), on the chapter's title page, not on every page: no running head and no footer with \"Plettenberg Bay, 15.-18. April\". The caption the carousel makes for a picture without a note (the node's title and \"14/96\", `childItems` in `items.js`) is **not** used in the book: a page shows a picture with a note as its first line (heading) and the text, and a picture without a note as the picture alone. Page numbers are the only thing repeated on a page.
- **Type** (owner, 2026-11-06): the book is set like a normal word-processor document, not in the site's monospace face. A **sans-serif, proportional** font (a system stack: Helvetica Neue, Arial, Liberation Sans, sans-serif, so any browser prints it and the PDF embeds what it used), **titles in bold and a little larger**, the notes as **flowing text at a normal size**. Proposed sizes: body 11 pt with a line height of 1.4 (the size of a Word document), the first line of a note as a photo's heading 14 pt bold, the chapter title on its title page 26 pt bold with the date range or the picture count below it in 12 pt, the page number 9 pt. Plain black on white, left-aligned (no justification: it makes gaps in narrow columns), paragraphs separated by a blank line's space. The print stylesheet sets these itself; it does not read the site theme's font tokens. To look at on a real print: the sizes.
- **More than one photo per page** (the owner is not sure, "good if possible"): proposed packing, so a page is never half empty: photos **without** a note go 2 to 6 on a page in a grid; with the filter "only pictures with a note" on, a picture with a **short** note (about 300 characters or less) may share the page with the next one, a picture with a long note has the page to itself. The packing is a pure function of the pictures' proportions and the note lengths (`bookPages`, S5 step 2), so it can be tested without printing.
- **Orientation: A4 portrait for every page** (decided by the owner 2026-11-06). One `@page { size: A4 portrait }` for the whole document, which every browser prints reliably. So the note goes **below** the picture by default (the title line as heading, then the text; half a page of note fits under a landscape picture). A tall picture with a short note may carry the note on its right inside the portrait page (the photo about 60 % of the width); that detail is proposed, not decided. A landscape option for the whole book is a later possibility, not part of the first version.

## 4a. Still open

- The margins (and the wider inner margin for double-sided printing, S4 point 2).
- How a note longer than the room goes on (a text page after the picture).
- The chapter title page and the table of contents (title, date range, number of pictures).
- Does a long gallery print as one document of 200 pages (the browser's weak point) or does the page offer "print this chapter" as well? Proposed: both, the chapter first.
- The strings for "photo book" in de, fr, es.

## 4c. Version 1, as built (2026-11-06)

The owner has written notes on the first 21 pictures of the Garden Route, so there is content to lay out. Decisions for v1 (everything else of S4a stays open):

- **Address and rendering**: `/:lang/node/:id/book`, rendered on the server into the HTML like the node page (the print needs no JavaScript; only the Print button does). The page has no site chrome: a screen-only bar (Back, the option, counts, Print / Save as PDF) above the sheets. The sheets are drawn as white A4 pages on a grey background on screen; in print only the pages remain.
- **Chapters**: the visible child nodes of a gallery (each one a chapter, in edge order, only those the viewer may see); a node without children is a book of one chapter. Disabled photos (`off`) are not in it (the server drops them first, `docs/BATCH.md` S5). A photo that two steps show counts once per chapter.
- **Option `?notes=1|0`**: "only pictures with a note" (S0a). Default: on when at least one picture of the book has a note, else off. A chapter without a note gets nothing then. The bar shows "N pictures, about P pages; all: M pictures, about Q pages".
- **Front page**: the node's title, the number of pictures and the list of chapters (title and number of pictures; no page numbers: the browsers cannot print them reliably, Firefox has no page margin boxes, and the print dialog's own footer can print them). Every chapter starts on a title page with its name once (S4b) and the number of pictures.
- **Packing** (`bookPages` in `client/gallery/book.js`, pure, tested): a picture with a note longer than 300 characters has a page to itself; a picture with a short note goes two to a page with the next picture when both have a short note (or none); pictures without a note go four to a page (2 by 2). Every page is listed with its pictures; the order of the chapter is never changed. A long note simply continues on the next page (the note text may break across pages, the picture does not).
- **A picture on a page** (changed 2026-11-06 after the first look): the pictures of a page share its height in equal cells and each picture is scaled to fill its cell (a lone picture gets the whole page minus its note, two pictures half each, four a 2 by 2 grid), at most the text width, never cropped; the note below it. A **short note (300 characters or less) is centred** under its picture, a longer one is left-aligned (centred paragraphs read badly). Heading = first line, bold 14 pt; body 11 pt. Margins 18 mm all round (the wider inner margin for double-sided printing stays open). Open: two pictures of different proportions get equal cells, not one common scale factor.
- **Type**: as S4b (sans-serif system stack, black on white).
- **Entry**: a "Photo book" link next to the view buttons of a gallery on the node page.

## 4d. The PDF on the server (owner, 2026-11-06: decided and built the same day)

Why: a book of 100 pages is 100 to 250 MB of photos; the browser's print can fail to render all of them (the owner has seen photos missing), and the browser PDF depends on the visitor's browser and settings. So the book gets a **PDF made on the server**, next to the print page (which stays).

**Decided: no headless Chrome on the server** (S2 B is dropped). The PDF is made by other means.

**Proposed engine: LuaLaTeX** (`/usr/bin/lualatex`, TeX Live 2023 on this host, with `fontspec`, `geometry`, `graphicx`, `parskip`). A spike on 2026-11-06 gave a PDF in 3.7 s with: the baked JPEGs embedded **unchanged** (1311 KB in, 1311 KB in the PDF, 332 ppi on the page), Liberation Sans and Liberation Sans Bold embedded as subsets, umlauts and accents right, A4. Tried and not chosen: `rsvg-convert` / Inkscape (cairo re-encodes the pictures, no text flow), ImageMagick (pictures only), `weasyprint`, `typst`, `pandoc` (not installed), a hand-written PDF writer in Bun (needs a font subsetter and a line breaker of its own). Ghostscript (`gs`) is there for an optional pass down to 300 ppi (about a third smaller).

How it would work (proposed):
- The page plan stays the one function of S4c (`bookOf`, `bookPages`); a pure function turns it into the `.tex` source (text escaped, the note's first line bold 14 pt, body 11 pt, chapters with title pages, the same packing), so the print page and the PDF cannot drift apart and the generator is tested without TeX.
- What TeX gives that the print page cannot: **real page numbers**, a **table of contents with page numbers**, a **wider inner margin** for binding (`twoside`), chapters starting on a right-hand page, and long notes breaking across pages properly.
- A job, not a request: `POST` asks for the PDF of (node, options), the server runs `lualatex` in a temporary directory with the pictures linked from `data/photos`, one job at a time, the result is kept in `data/books/<key>.pdf` where the key is made of the node ids, their revs and the options (the same book is not made twice, a changed node makes a new key), the page shows progress and then a download link. Old files are swept.
- **Decided (owner, 2026-11-06): only a logged-in user may start a job** (it costs a minute and 100 to 250 MB); the print page stays open to every visitor of a public node. The 300 ppi pass is **not** done by default (the pictures are 330 to 470 ppi on the page, recompressing them costs a little quality for a smaller file nobody needs on a USB stick); it stays a possible option if a shop's upload limit asks for it.
- Open: a limit on the number of pictures, the exact wording and place of the button.
- Needs on the host: `texlive-luatex`, the `fontspec`, `geometry`, `graphicx`, `parskip` packages and the Liberation fonts; to be listed in `docs/DEVELOPER.md` when it is built.

## 5. Order if it goes ahead

1. Decide the questions above and write the layout rules here (templates, page numbers, chapters, notes).
2. A pure function `bookPages(items, options)` in `client/gallery/` (the page plan from the items and their proportions) with tests.
3. The page `/book` with the print CSS and the spread preview.
4. Skins.
5. The server PDF (B), measured on the Garden Route nodes.
6. `docs/DEVELOPER.md`, locales, browser check on a real print.

## 4e. The server PDF as built (2026-11-06)

- `server/book/tex.js` (pure, `tests/book-tex.test.js`): `bookTex(chapters, { title, onlyNoted, file, strings })` writes the LuaLaTeX source from the plan of S4c: front page with title, picture count and, for several chapters, a contents list with page numbers (two runs); a title page per chapter; page numbers at the bottom of the picture pages; pictures scaled to a part of the text height by how many share the page and how long the note is (alone: 92 % without note, 80 % with a short note, 55 % with a long one; two on a page 43 % each; four 2 by 2, 42 %); a short note centred, a long one left-aligned; the first line of a note with a body bold 14 pt. Text is escaped (`texEscape`).
- `server/book/make.js`: `startBook` (one job at a time, a queue), `bookKey` (sha256 of the title, language, option and the pictures with their notes in order), `bookStatus`, `sweepBooks` (files older than 14 days go). The result is `data/books/<key>.pdf`; the work directory holds links to the baked photos (a WebP, which TeX cannot embed, is converted to a JPEG first). `lualatex` runs with `-no-shell-escape`, its font cache in `data/books-tex/`.
- `server/api/book.js`: `POST /api/nodes/:id/book { notes?, lang? }` (202 with `{ key, status }`), `GET ...?key=K` (status), `GET ...?key=K&download=1` (the PDF). Logged-in users only (401 otherwise), the node must be visible to them (404), the book empty (422). The chapters are the ones the page shows (`chaptersFor`), so disabled photos and hidden nodes are not in it.
- The book page shows **Make a PDF** to a logged-in user (it polls every 3 s, then offers **Download the PDF**); a visitor sees "Log in to make a PDF". The print page stays.
- Checked 2026-11-06: the 17-picture Garden Route book makes a 10-page A4 PDF of 14.9 MB in under 10 s, the JPEGs unchanged.
- Not yet: a picture limit per book, a progress figure (only queued / running), the wider inner margin for binding, the 300 ppi pass (decided: not by default), sweeping `books-tex`.

## 6. Idea: the book as a catalogue maker (owner, 2026-11-06, idea only, not decided)

**Parked (owner, 2026-11-06): not built before a real user needs it.** It is developed together with that user and their requirements; the list below is only a starting guess to be replaced by what they say.

For makers (jewellery, cards, small goods; `docs/THEMES.md`) the photo book could also make a **product catalogue or lookbook** as a printable PDF to hand out at a market or send to a shop. What a catalogue needs beyond the album, to be decided one by one:

- **An item per picture**: name, price, a short description and a size/material line. The note of a photo (`desc`) is already the caption; a catalogue would give it structured fields (the "price/info tag" preset of `docs/THEMES.md` S2 is the same data), printed in a fixed place instead of as a free note.
- **Layouts for items**: one large item per page, 2 x 2 or 3 x 3 grids of small items, a cover with the maker's name and logo, a contact page at the end (the maker's profile: name, pseudonym, address the maker chooses to print).
- **Order of items = order in the node**, as in the album; chapters = child nodes (collections such as "Necklaces", "Earrings"); a table of contents when there are chapters.
- **Print and share**: the A4 PDF as built (`server/book/`, LuaLaTeX), plus a hand-out size (A5) and a screen-friendly PDF; the owner decides what is public, nothing is printed that the maker has not put in (`docs/DESIGN.md` S3 goal 9).
- **Open**: whether prices belong in the document model (photo step fields) or stay free text in the note; currency and language; a catalogue as a **mode** of the book (`?mode=catalogue`) or a separate page; which of the layouts above come first (suggestion: one item per page and a 2 x 2 grid, with cover and contact page).
- Not a shop: nothing here takes orders; the marketplace idea stays unadvertised.
