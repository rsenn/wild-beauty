# Darkroom: tone curves for photos

Developer notes for the curves feature. Read DEVELOPER.md first, this file leans on it.
Status: idea and plan, 2026-11-04. Nothing is built yet.
Update this file as decisions fall. Strike what turns out wrong, do not delete it.


## The idea in a few lines

A photo step gets a tone curve. One curve editor does all of this at once:
- contrast and brightness
- black point and white point, which is ranging
- threshold and posterize, which is steep steps
- inversion and solarisation
- per channel colour shifts
- later the same on HSL, HSV and Lab channels

The curve is drawn in front of a histogram.
The curve is the only thing the user edits. Everything else is a preset that writes the curve.

The name comes from the lab. Ilford Multigrade paper: magenta light hardens, yellow light softens.
We keep that as a grade slider with a yellow to magenta track.

notes:


## What is already there

Reuse these, do not rebuild them.

Document and history
- client/editor/core/model.js   STEPS table, validate, LIMITS, model functions. The edge field of a photo step is the closest sibling: optional, small, per photo, keyed for undo
- client/editor/core/commands.js   apply and KEYED. setEdge is the template for setTone
- client/editor/core/history.js   undo, folds keyed runs
- server/node/validate.js   server side check of a document

Rendering
- client/editor/view/render.js   renderPhoto draws an image in a nested svg. This is where a filter goes
- server/media/raster.js   the same svg through rsvg-convert, for tiles
- client/editor/io/export.js   svg to canvas to png

Pixels in the browser
- client/editor/tools/cutout/alphamap.js   loads an image into a small canvas, reads the pixels, caches by url
- client/components/NodeEditor.js wireWork   same thing for the lasso
- client/editor/tools/lasso/lasso.js workSize   picks the working size

Pixels on the server
- server/media/run.js   run ImageMagick or any tool safely
- server/media/tools.js   knows convert and identify, ImageMagick 6.9.12 Q16
- server/media/probe.js   identify and the pixel LIMITS for ImageMagick
- server/media/bake.js   the baked copy, jpeg quality estimate
- server/api/cutout.js   a complete example of a route that makes a new image from a photo
- server/api/uploads.js storeFile   turns a file into an upload record
- server/api/segment.js photoFile   finds the file of a photo hash

Ui
- client/editor/input/toolTable.js   tool ids and keys
- client/components/ContextBar.js   controls of the selected step
- client/components/Popover.js   small panels
- client/components/ColourPick.js   colour and dropper
- client/editor/input/loupe.js   magnifier for touch
- client/color.js   sRGB, linear light, OKLab, OKLCH
- locales/*.json   four languages
- client/editor/tools/wand/wand.js   stage point to photo pixel

Image tool
- opencv-imgproc, the qjs-opencv script. No tone command yet

Nothing for histograms, levels, curves or filters exists. Searched the client, server and css.

notes:


## What is missing

- a curve maths module
- a field on the photo step
- a way to draw the look in svg
- a histogram
- the curve widget
- a tool or panel to host it
- a server command that bakes the look into pixels
- tests and four translations

notes:


## Decision 1: non destructive first

Keep the original pixels. Store only the curve in the document.
- undo is free
- the same photo can be toned twice in one node
- the document grows by a few hundred bytes
- a later Develop button can still make it permanent

The step field is called tone. Sketch:

tone: {
  v: 1,
  space: rgb,
  grade: 2,
  curves: { v: points, r: points, g: points, b: points }
}

points is a list of triples x y corner, all 0 to 1, x ascending. Same triple shape the stroke step already uses.
corner is 0 for a smooth point and 1 for a corner point.
A channel that is missing means identity. A tone that is all identity is not stored at all.

Why space and a curves object now: HSL, HSV and Lab need only other channel names later. Channel names per space:
- rgb   v r g b      v is the master curve
- hsl   h s l
- hsv   h s v
- lab   L a b

Limits: at most 16 points per curve, 4 curves. Add them to LIMITS in model.js.

notes:


## Decision 2: the equation is a list of cubic segments

The idea of composing a mapping equation from the edited curve is right. Make it concrete.

Between two points the curve is a cubic polynomial. A line is a cubic with zero higher terms, so corner points give straight segments for free. A quadratic is the same with the top term zero. One segment is five numbers: start x, a, b, c, d. Then
y = a + b*t + c*t*t + d*t*t*t   with t = x minus start x

Slopes at the points come from the monotone cubic method of Fritsch and Carlson, also called PCHIP.
- it never overshoots between points, so no wild ringing as with a natural spline
- if the user draws a dip, the curve dips. Solarisation works
- a corner point uses the chord slope on both sides, so the segments touching it are straight
- outside the first and last point the curve is flat. Moving the first point right is the black point. Moving the last point left is the white point. That is ranging.
- a threshold is two corner points close together, one low one high

The result is clamped to 0 to 1.

The equation is the segment list. It is small and exact. But do not send it as the contract. Send the points. Both sides run the same code to get the segments.
Reason: one source of truth. A segment list from the client would need trust and validation. Points validate like every other field.

Put the code in client/editor/geometry/tonecurve.js. Pure. Exports something like
- segments of points
- evaluate of segments at x
- lut of points and size
- isIdentity of tone
- compose of master, channel and grade into one table per channel

The server imports it like thumb.js imports model.js. No DOM, no Bun apis in that file.

Name warning: client/editor/geometry/curve.js already exists. It bends text. Do not reuse that name. Basenames are unique repo wide.

notes:


## Composition order

For each channel c the final table is
T_c(x) = G( C_c( M(x) ) )

M is the master curve, C_c the channel curve, G the grade curve. Each is optional.
Fold them into one table per channel before drawing or sending. The svg filter and the server then do one lookup per pixel.

Grade: a number 0 to 5, neutral at 2 as on paper. It makes a symmetric s curve around the middle. Higher is harder. Lower is softer. Pick the exact function by looking at it. Keep it simple, a logistic blend is enough. Do not let it write into the points. Keeping it separate lets the slider be undone on its own and the curve stays editable.

notes:


## Preview in the client

Three options, in order of effort.

A. svg filter, rgb only. Best first step.
- feComponentTransfer with feFuncR, feFuncG, feFuncB of type table
- tableValues is the 256 entry table of that channel
- the filter goes on the image inside renderPhoto in render.js
- the svg stays the one renderer: stage, viewer, rsvg tiles, export all get the look for free
- filter id like tone-plus step id, same trick as edge-plus step id

Gotchas for A
- filters work in linearRGB by default. Set color-interpolation-filters to sRGB or every curve looks wrong
- give the filter an explicit region in user space, or the default region of minus 10 percent to 120 percent costs pixels and may clip
- filter on the image, not on the group that carries opacity and mix-blend-mode, or the order of operations changes
- tableValues interpolates linearly between entries, 256 is fine
- librsvg must support it. Test with raster.js and look at the png
- the filter runs again on every change. If dragging stutters on big photos, preview in the panel on the small working copy and apply to the stage on pointer release. Use requestAnimationFrame to throttle
- the id must be unique in the page. Several nodes on one page can reuse step ids, check the graph page

B. canvas on a working copy, any colour space.
- load the photo into a canvas of about 1024 px with the alphamap pattern
- map pixels in a loop with the tables
- show the result as the image href through a blob url while editing
- needed for HSL, HSV and Lab where no svg filter exists
- reuse the same pixel loop that the server will run, see below

C. WebGL. Not now. Maybe if B is too slow.

The user suggested an 8 bit preview. That is what A and B give. Fine for a preview. Banding shows up only on strong curves on smooth skies.

notes:


## Histogram

New file client/editor/tools/darkroom/histogram.js, pure counting, plus a loader that draws the photo to a canvas.

- work on a copy of at most 256 px long edge
- respect the crop window of the step, use cropWindow from model.js, count only what shows
- skip pixels with alpha under about 20, same rule as alphamap.js, cutouts are full of them
- bins for r, g, b and one for luma
- luma by Rec 709 weights, or the L of OKLab from client/color.js if the curve is on Lab
- cache by href, like alphamap.js does
- show linear and log scale, log is much more readable
- draw the input histogram filled and grey behind the curve
- draw the output histogram as a line. Do not read pixels again: push the input bins through the table
- mark clipped ends, a red tick when bin 0 or bin 255 holds more than half a percent

Shown behind the curve as in Photoshop, but also useful stand alone as a tiny strip in the context bar.

notes:


## Server: baking the look

Needed for: Develop, other colour spaces on final output, files that leave the svg world.

Where the pixels come from
- the original upload in uploads/, full resolution, not the 2048 baked copy
- photoFile in segment.js currently prefers the baked photo. For this job write a variant that prefers the original, or take the upload hash directly

Two ways to do it.

Way 1: ImageMagick with a lookup image. Easiest, no new tool.
- write the table as a 16 bit pgm, one line high, 4096 wide. The header is plain text: P5, width and height, 65535, then big endian 16 bit values
- convert in.jpg lut.pgm -clut out.png
- per channel curves need one clut per channel. Split with -separate, clut each, then -combine
- ImageMagick here is Q16, so the intermediate is 16 bit and the lookup interpolates. No banding from rounding between steps
- to be verified: how -clut treats a three channel lookup in version 6.9.12. If unclear, use the separate and combine route
- Lab and HSL: -colorspace Lab and HSL exist but are not the same Lab as OKLab. Pick one definition and use it on both sides

Way 2: raw pixels through Bun. Same code as the browser.
- convert in.jpg -depth 16 rgba:- and read stdout as 16 bit
- loop in js with the same shared function as the canvas preview
- write back with convert -size WxH -depth 16 rgba:- out.png
- check byte order with the endian option on the first test
- 4 million pixels in a typed array loop is well under a second for rgb tables. Colour space conversions take longer but still seconds
- result: preview and final are the same code, so they cannot disagree. This is the strongest reason for way 2
- put the pixel loop in client/editor/geometry/tonemap.js, pure, takes a typed array and the tables

Way 3: opencv-imgproc gets a tone command later.
- native speed, runs in the same family as cutout
- cv LUT is 8 bit only. Check if it is bound at all before planning on it
- needs a change in the qjs-opencv repo and the contract file docs/opencv-imgproc.md

Recommendation: way 2 first, way 3 only if time matters. Way 1 is a quick prototype to see a first result tonight.

About 16 bit: the baked photos are jpeg, so the final file is 8 bit anyway. 16 bit helps only to avoid rounding on the way, and for png or tiff sources. Say so in the ui text if anyone asks. Do not overpromise.

Colour profiles: bake.js keeps Display P3 and Adobe RGB profiles. Curves act on the encoded values, as in every editor. Nothing to do, but know it.

notes:


## Server: the route

POST /api/tone, modelled on server/api/cutout.js.
- body: photo hash and tone object
- validate the tone with the same function as the document uses, never trust the body
- find the original, run the job, store with storeFile, answer with the upload record
- plain json answer is enough. Add NDJSON progress only if it takes over a few seconds
- check the guard and the session as cutout does, look at how cutoutRoute is wired in server.js
- no temp file may outlive the request, clean in finally
- bound the pixel count, reuse LIMITS from probe.js
- add the route to server.js and a test with a small fixture

Client side of Develop
- button in the panel
- post the tone
- dispatch replacePhoto with the new hash and a flag like tone: true so history folds it
- set orig to the old hash if empty, so Restore works, the cutout flow does the same
- clear the tone field in the same undo step
- tools/cutout/job.js blocks commands while a job runs, add the same guard for this job

notes:


## Where it breaks if you forget it

The svg look does not reach everything.

- thumb.js builds the thumbnail of a one photo node from the file with ImageMagick. needsRender in raster.js says no for a plain single photo. Fix: needsRender returns true when a photo step has a tone, or thumb.js applies the table
- the 3D gallery hangs the photo files as textures. They show the untoned file until Develop. Accept it at first, note it in the ui, or tone the texture in three
- the wand, cutout and lasso servers read the file, so they see the original. That is right: selecting on the original is fine
- exports go svg to canvas. Filters inside an svg drawn as an image work in browsers, test it, also on Safari if you can
- clipboard copies steps. Check that tone is copied with a photo, and that pasting into another node keeps it
- duplicatePhoto in clipping.js copies a step. Check the field comes along
- the STEPS table rejects unknown fields. Add tone there first
- the one megabyte document limit. Tables are never stored, only points

notes:


## UX suggestions

Where it lives
- a tool of its own in toolTable.js, key D, name Darkroom. D is free, taken keys are V P S C U W L B T
- the panel opens under the stage in the context area, like the lasso group does
- on a phone the panel takes the lower half, the photo stays visible above
- not in the Look popover. A curve needs about 280 px square and the popover is small

The panel
- the square curve area with histogram behind it
- channel tabs on top: master, red, green, blue. Later a space selector
- below the square: input and output value of the selected point as number fields
- grade slider with a yellow to magenta track and the label of the paper grades
- reset, and a hold to see the original button
- presets: neutral, soft, hard, invert, threshold, posterize 4, sepia, solarise, bleach bypass look if you like
- Develop button, a clear label that it makes the change permanent

Curve interaction
- click on the line adds a point
- drag moves it, clamped between its neighbours in x
- drag out of the square, or double click, removes it
- shift click toggles corner and smooth
- arrow keys nudge the selected point, shift for bigger steps
- the end points move freely in both directions, that is the levels
- on touch use the loupe from input/loupe.js and bigger hit radius, 14 px or more
- live readout of x and y while dragging

On the stage
- with the tool active, a click on the photo puts a point on the curve at the tone of that pixel
- dragging on the photo up or down then moves that point. This is the targeted adjustment of other editors and it is very quick
- reuse the stage to photo point maths in tools/wand/wand.js and the dropper idea in ContextBar
- the photo shows the live look, so there is no separate preview box

Darkroom flavour
- test strip: a row of small copies of the photo at grades 0 to 5, click to take one. This is the classic test strip and it is a cheap loop over the working copy
- a safelight look for the panel: dark, a touch of amber. Optional, behind a theme variable, not required
- dodge and burn: no new feature needed. Duplicate the photo, clip the copy with the lasso, give it a tone and a lower opacity. That already works with the tools we have. Document it in the help text

Keys list
- the editor has a keys help, KEYS in NodeEditor.js, and it is already behind. Add the new keys and the missing old ones in all four languages

notes:


## Build order

Each step ends in something to run or look at. Commit after each.

D1 tonecurve.js with tests
- segments, evaluate, lut, isIdentity, compose
- test with fixed numbers: identity, a straight line, an s curve, a dip, a threshold, a flat extension
- done when bun test is green and you can print a table

D2 the document
- tone in STEPS photo, validator, limits
- model.setTone, command setTone, KEYED entry tone plus step id
- done when a hand made document with a tone saves and loads, and a bad one is rejected on both sides

D3 draw it
- filter in renderPhoto, sRGB interpolation, explicit region
- done when dispatching setTone from a test page changes the photo on the stage and in the viewer

D4 other renderers
- needsRender, thumb, raster test, export check
- done when a saved node shows the look in its tile

D5 histogram
- counting, loader, cache, output histogram from the bins
- done when numbers match a known image

D6 the widget
- svg curve editor as a component, pointer and keyboard
- done when you can edit a curve and watch the photo

D7 the tool
- toolTable entry, panel, context wiring, css, strings in en de es fr
- bun test locales passes
- done when the whole round trip works in the browser including undo

D8 stage targeting
- click and drag on the photo sets points
- done when it feels quick on a phone too

D9 develop
- tonemap.js, media/tone.js, route, client button, replacePhoto flow
- done when a developed photo survives save and reload and Restore returns the original

D10 other colour spaces
- channel maps, canvas preview, server loop
- choose OKLab or CIE Lab and write it down here
- done when preview and final agree to within one level

D11 extras
- presets, grade, test strip, copy tone, apply to all photos of a node
- batch command exists for the last one

notes:


## Tests to write

- tests/editor/tonecurve.test.js   maths with fixed numbers
- tests/editor/tonemap.test.js   pixel loop on a tiny buffer
- tests/editor/tone.test.js   command, validate, undo folding, render output contains the filter
- tests/editor/histogram.test.js   counts, alpha skip, crop window
- tests/api-tone.test.js   route with a small image, needs ImageMagick, skip when absent like the other media tests do
- a golden image test is worth it once: same tone through the filter and through the pixel loop, compare within one level

Style: see tests/editor/role.test.js.

notes:


## Open questions

- grade neutral at 2 or at 0? Paper says 2, a slider with the middle at neutral feels better
- is the master curve applied before or after the channel curves? Photoshop applies channel then composite. Decide and keep it
- CIE Lab or OKLab for the Lab space
- should Develop keep the tone in the document at zero strength, so it can be tuned later? Probably not, orig covers it
- time lapse: the node has a scrub timeline, transform steps animate. Should tone animate? Not now
- what happens to a photo with a tone when it becomes a texture in a gallery
- is 256 entries enough for the svg table on 10 bit screens. Probably yes

notes:


## Scratch

(use freely)

