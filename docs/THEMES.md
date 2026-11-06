# Themes: a second, quiet theme ("Linen", working name) (owner 2026-11-06, spec only, nothing built)

Mechanism: `TODO.md` "Theming rule" and `docs/PLAN.md` S16. A theme is `static/themes/<id>.css` that sets `--wb-*` tokens only; `layout.css` reads them and holds no colours. Existing: `kraft` (default, the historic paper look), `janos`.

## 1. Who it is for, and the brief

Artists and home makers (jewellery, cards, small goods) who already style their work with care, and who should **want to create and publish** here. Mood references from the owner: a bracelet on a kraft card with a caramel pill label in script type, a festival stall (warm wood, brass, soft light); two of the owner's own site designs (a six-colour block tab bar with pale illustrated ground, translucent white cards with a dark outline; small black label chips with colour bars). These are mood, not templates.

Decisions:

- **T1. The theme has little identity of its own.** The user's work dominates and sets the mood, like a gallery wall. No illustration, no mascot, no texture (kraft keeps the paper identity).
- **T2. Warm, not stark.** Ground a light warm neutral (linen/cream), ink a soft dark brown-grey, never pure white or black. Hairline frames, generous radii (soft buttons, pill chips), no hard shadows, a gentle sans for the chrome.
- **T3. Colour comes from the work.** The accent (active tab, selection, chips, hover) is taken from the palette of the node on screen (the server extracts 5-8 colours per photo and per node, `docs/EDITOR.md` S3 palette rules). Pages without a node (front page, lists): a fixed soft neutral accent, or the palette of the first visible works (open).
- **T4. Readable by rule.** The palette accent is clamped to a pleasant range (lightness and saturation limits, in OKLab as `server/media/color.js` does) and its text colour is chosen by contrast (WCAG AA, 4.5:1); too dull or too pale a palette falls back to the neutral accent. Tests with a warm, a cool and a black-and-white node.
- **T5. Tokens only.** New tokens: `--wb-accent-1..6` (tab/group blocks; kraft and janos set them all to their single accent so nothing changes there) and `--wb-accent-ink-1..6`. The per-node accent is set as an inline style on the page root by the server from the node palette (whitelisted names and value patterns, as the theming rule requires). No raw CSS from users.
- **T6. Per user first.** The theme is a profile preference (like `prefs`); a node wearing its own theme (`style.theme`, the rule above) comes later. Default for new users: open (kraft stays the default until Linen has been checked).
- **T7. A calm variant may follow** (a dark "gallery" one, which many photographers prefer); decide after Linen has been seen.

## 2. What the editor already has for this audience (checked in `docs/EDITOR.md`)

Text boxes: font face by role (`fixed`, `serif` EB Garamond, `sans` Jost), font colour, **background solid or gradient with alpha, radius up to "pill"**, padding, and a palette picker fed by the photos. So the caramel pill label is already specified; the gaps are:

- **A script/handwritten face** (shortlist in S2.4 has Square Peg; the stall card uses thin capitals plus a script): a fourth role id `script`, needs the font file and licence check.
- **A price/info tag** as a text-box style preset (name, price, contact), not a marketplace (not advertised yet).
- **A starter template** "product on a card": one photo, a pill label, a small logo spot; makes the first collage a matter of two minutes.

## 3. Build steps

1. Check `layout.css` for any colour or radius still not behind a token (the CSS test already forbids literals); add the `--wb-accent-1..6` tokens to kraft and janos with the old values.
2. `static/themes/linen.css`: warm neutrals, radii, frames, no shadows.
3. Palette accent: a function `accentOf(palette)` (clamp, contrast, fallback) in `server/media/color.js`, tests; set on the page root in `server/ssr.js` for node pages.
4. Theme choice in the profile (`prefs`), 4-language strings, `docs/PROFILE.md`.
5. Browser check: front page, editor, graph, book, with a warm, a cool and a black-and-white node; compare with kraft; adjust.
6. `docs/DEVELOPER.md`, `TODO.md`.

## 4. Open

Name; default theme for new users; accent on pages without a node; the script font; whether the six accents are six fixed hues of the palette or six tints of the node's palette.
