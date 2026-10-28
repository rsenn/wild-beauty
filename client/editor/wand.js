// The magic wand (EDITOR.md E119): maps between the stage and a photo's own
// 0..1 square, and reads the NDJSON the server streams from `opencv-imgproc
// segment`. A photo's outline is four stage corners [tl, tr, br, bl] (hit.js).

// the tap `at` (stage units) as [u, v] in 0..1 of the photo, or null when it lies
// outside the photo or the outline is degenerate
export function photoPoint(corners, at) {
  const [[x0, y0], [x1, y1], , [x3, y3]] = corners;
  const ax = x1 - x0;
  const ay = y1 - y0;
  const bx = x3 - x0;
  const by = y3 - y0;
  const det = ax * by - ay * bx;

  if(Math.abs(det) < 1e-9) return null;

  const dx = at[0] - x0;
  const dy = at[1] - y0;
  const u = (dx * by - dy * bx) / det;
  const v = (ax * dy - ay * dx) / det;

  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [u, v] : null;
}

// a polygon in pixels of an image `width` x `height` as stage units
export function stagePolygon(polygon, { width, height }, corners) {
  const [[x0, y0], [x1, y1], , [x3, y3]] = corners;

  return polygon.map(([px, py]) => {
    const u = px / width;
    const v = py / height;

    return [x0 + u * (x1 - x0) + v * (x3 - x0), y0 + u * (y1 - y0) + v * (y3 - y0)];
  });
}

// the clip polygon of a `result` event of the tool, in stage units: the first
// outline (the picked cut), or null when the tool failed or found nothing
export function resultPolygon(event, corners) {
  if(!event || event.event !== 'result' || !event.ok) return null;

  const polygon = event.outlines?.[0]?.polygon;
  const size = event.output;

  if(!Array.isArray(polygon) || polygon.length < 3 || !(size?.width > 0) || !(size?.height > 0)) return null;

  return stagePolygon(polygon, size, corners);
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
