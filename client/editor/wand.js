// The magic wand (EDITOR.md E119): maps between the stage and a photo's own
// 0..1 square, and reads the NDJSON the server streams from `opencv-imgproc
// segment`. A photo's outline is four stage corners [tl, tr, br, bl] (hit.js).

import { cropWindow } from './model.js';
import { area } from './polygon.js';

// the point `at` (stage units) as [u, v] of the photo (0..1 inside it, not clamped), or null
// when the outline is degenerate
export function photoCoords(corners, at) {
  const [[x0, y0], [x1, y1], , [x3, y3]] = corners;
  const ax = x1 - x0;
  const ay = y1 - y0;
  const bx = x3 - x0;
  const by = y3 - y0;
  const det = ax * by - ay * bx;

  if(Math.abs(det) < 1e-9) return null;

  const dx = at[0] - x0;
  const dy = at[1] - y0;

  return [(dx * by - dy * bx) / det, (ax * dy - ay * dx) / det];
}

// the tap `at` (stage units) as [u, v] in 0..1 of the photo, or null when it lies
// outside the photo or the outline is degenerate
export function photoPoint(corners, at) {
  const uv = photoCoords(corners, at);

  return uv && uv[0] >= 0 && uv[0] <= 1 && uv[1] >= 0 && uv[1] <= 1 ? uv : null;
}

// A photo is drawn as a square window into its image (cropWindow: the short side, moved along the
// long one by `crop`), the tool wants fractions of the whole image. `frame` is { width, height, crop }
// of the image; without it the photo is taken as square.
const imageFraction = ([u, v], frame) => {
  if(!frame) return [u, v];

  const { side, x, y } = cropWindow(frame, frame.crop);

  return [(x + u * side) / frame.width, (y + v * side) / frame.height];
};

// the tap `at` (stage units) as [x, y] in 0..1 of the whole image, or null when it lies outside the
// visible part of the photo or the outline is degenerate
export function imagePoint(corners, at, frame) {
  const uv = photoPoint(corners, at);

  return uv && imageFraction(uv, frame);
}

// like imagePoint, but a point outside the photo's visible window is moved to the nearest point of
// its edge instead of refused (the magnetic lasso goes on along the border when the pointer leaves
// the photo); null only when the outline is degenerate
export function clampedImagePoint(corners, at, frame) {
  const uv = photoCoords(corners, at);

  return uv && imageFraction([Math.min(1, Math.max(0, uv[0])), Math.min(1, Math.max(0, uv[1]))], frame);
}

// a manual clip (polygons in stage units) as the tool's `region`: polygons of [x, y] in 0..1 of the
// whole image, or null when it is not usable (degenerate photo, no polygon left)
export function regionOf(corners, polygons, frame) {
  const clamp = v => Math.min(1, Math.max(0, v));
  const list = (polygons ?? []).map(poly => poly.map(q => photoCoords(corners, q)))
    .filter(poly => poly.length >= 3 && poly.every(Boolean))
    .map(poly => poly.map(q => imageFraction(q, frame).map(v => Math.round(clamp(v) * 1e5) / 1e5)));

  return list.length ? list : null;
}

// a polygon in pixels of an image `width` x `height` as stage units; `crop` is the photo's
// (the drawn square is a window into the image), left out the image is taken as square
export function stagePolygon(polygon, { width, height }, corners, crop) {
  const [[x0, y0], [x1, y1], , [x3, y3]] = corners;
  const { side, x: ox, y: oy } = crop === undefined ? { side: 0 } : cropWindow({ width, height }, crop);

  return polygon.map(([px, py]) => {
    const u = side ? (px - ox) / side : px / width;
    const v = side ? (py - oy) / side : py / height;

    return [x0 + u * (x1 - x0) + v * (x3 - x0), y0 + u * (y1 - y0) + v * (y3 - y0)];
  });
}

// the clip of a `result` event of the tool, in stage units: the outlines of the
// first output (the picked cut), or null when the tool failed or found nothing.
// One plain outline is a polygon; several objects or holes are a list of
// polygons, an object wound positively and a hole the other way round (the
// non-zero fill of a multi-outline clip, multiclip.js)
export function resultPolygon(event, corners, crop) {
  if(!event || event.event !== 'result' || !event.ok) return null;

  const outline = event.outlines?.[0];
  const size = event.output;

  if(!(size?.width > 0) || !(size?.height > 0)) return null;

  const contours = (Array.isArray(outline?.polygons) ? outline.polygons : []).filter(c => Array.isArray(c?.polygon) && c.polygon.length >= 3);

  if(contours.length && !(contours.length === 1 && !contours[0].hole)) {
    const list = contours.map(c => {
      const poly = stagePolygon(c.polygon, size, corners, crop);

      return area(poly) > 0 === !c.hole ? poly : [...poly].reverse();
    });

    // an outline list needs its first outline to be an object, not a hole
    return contours[0].hole ? null : list;
  }

  const polygon = contours[0]?.polygon ?? outline?.polygon;

  if(!Array.isArray(polygon) || polygon.length < 3) return null;

  return stagePolygon(polygon, size, corners, crop);
}

// Read a streamed NDJSON body line by line; `onLine(object)` for each line that
// parses. Resolves when the stream ends.
export async function readLines(body, onLine) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let rest = '';

  const flush = line => {
    if(!line.trim()) return;

    try {
      onLine(JSON.parse(line));
    } catch {}
  };

  for(;;) {
    const { done, value } = await reader.read();

    if(done) break;

    rest += decoder.decode(value, { stream: true });

    const lines = rest.split('\n');

    rest = lines.pop();
    lines.forEach(flush);
  }

  flush(rest + decoder.decode());
}

// The selection (WAND.md A3): the outlines of one candidate of a select step, in pixels of the
// step's `output` size, as one SVG path in stage units. The path is drawn even-odd, so holes and
// several objects need no winding; null when the candidate found nothing
export function selectionPath(candidate, output, corners, crop) {
  const polys = (candidate?.polygons ?? []).map(c => c?.polygon).filter(p => Array.isArray(p) && p.length >= 3);

  if(!polys.length || !(output?.width > 0) || !(output?.height > 0) || !corners) return null;

  const r = v => Math.round(v * 100) / 100;

  return polys.map(p => 'M' + stagePolygon(p, output, corners, crop).map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + 'Z').join('');
}

// the candidate shown first: the largest unless it is most of the photo (then it is the background),
// never one that found nothing; null when none found anything
export function defaultPick(candidates, maxCover = 0.6) {
  const found = (candidates ?? []).filter(c => c?.polygons?.length);

  if(!found.length) return null;

  const fits = found.filter(c => c.coverage <= maxCover);

  return (fits.length ? fits : found).reduce((a, b) => (b.index > a.index ? b : a)).index;
}
