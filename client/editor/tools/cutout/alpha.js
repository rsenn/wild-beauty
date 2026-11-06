// The visible part of a cutout (docs/EDITOR.md E115): its box in a photo's local
// space, so the selection box and the hit test skip the transparent margin.
import { cropWindow } from '../../core/model.js';

const SIZE = 256; // the scan is made at this many pixels along the window
const SOLID = 24; // alpha above this counts as visible
const FULL = 0.98; // a box this close to the whole square is no box

// [x0, y0, x1, y1] in 0..1000 around the pixels of RGBA `data` (w x h) that are
// visible; null when nothing is visible or nearly everything is
export function boxFromAlpha(data, w, h, solid = SOLID) {
  let [x0, y0, x1, y1] = [w, h, -1, -1];

  for(let y = 0; y < h; y++)
    for(let x = 0; x < w; x++)
      if(data[(y * w + x) * 4 + 3] > solid) {
        if(x < x0) x0 = x;
        if(x > x1) x1 = x;
        if(y < y0) y0 = y;
        if(y > y1) y1 = y;
      }

  if(x1 < 0) return null;

  const box = [(x0 / w) * 1000, (y0 / h) * 1000, ((x1 + 1) / w) * 1000, ((y1 + 1) / h) * 1000].map(v => Math.round(v * 10) / 10);

  return (box[2] - box[0]) * (box[3] - box[1]) >= 1e6 * FULL ? null : box;
}

// the box of the picture `info` ({ href, width, height }) as a photo step with
// `crop` shows it; a promise of the box or null
export function visibleBox(info, crop) {
  return new Promise(done => {
    const image = new Image();

    image.onload = () => {
      try {
        const { side, x, y } = cropWindow(info, crop);
        const canvas = document.createElement('canvas');

        canvas.width = canvas.height = SIZE;

        const g = canvas.getContext('2d', { willReadFrequently: true });
        const k = image.naturalWidth / info.width;

        g.drawImage(image, x * k, y * k, side * k, side * k, 0, 0, SIZE, SIZE);
        done(boxFromAlpha(g.getImageData(0, 0, SIZE, SIZE).data, SIZE, SIZE));
      } catch {
        done(null);
      }
    };
    image.onerror = () => done(null);
    image.src = info.href;
  });
}

// --- the outline of the visible pixels (docs/EDITOR.md S2.3, cut along the opaque outline) ---
const MIN_AREA = 0.002; // an object smaller than this share of the window is a speck
const MAX_OBJECTS = 8;
const MAX_VERTICES = 160;
const EPS = 0.9; // simplification in pixels of the scan
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]; // clockwise on a screen

// Ramer-Douglas-Peucker on a closed loop: split at the two points farthest apart, simplify both halves
function simplifyLoop(points, eps) {
  if(points.length < 4) return points;

  const half = (list, i0, i1) => {
    const keep = new Uint8Array(list.length);
    const walk = (a, b) => {
      let far = -1;
      let at = 0;
      const [ax, ay] = list[a];
      const [bx, by] = list[b];
      const len = Math.hypot(bx - ax, by - ay) || 1;

      for(let i = a + 1; i < b; i++) {
        const d = Math.abs((bx - ax) * (ay - list[i][1]) - (ax - list[i][0]) * (by - ay)) / len;

        if(d > far) (far = d), (at = i);
      }

      if(far > eps) {
        keep[at] = 1;
        walk(a, at);
        walk(at, b);
      }
    };

    keep[i0] = keep[i1] = 1;
    walk(i0, i1);

    return list.filter((_, i) => keep[i]);
  };

  // the point farthest from the first, then the one farthest from that
  let a = 0;
  let b = 0;

  for(let i = 1; i < points.length; i++) if(Math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1]) > Math.hypot(points[b][0] - points[0][0], points[b][1] - points[0][1])) b = i;

  const rotated = [...points.slice(b), ...points.slice(0, b)];
  let c = 0;

  for(let i = 1; i < rotated.length; i++) if(Math.hypot(rotated[i][0] - rotated[0][0], rotated[i][1] - rotated[0][1]) > Math.hypot(rotated[c][0] - rotated[0][0], rotated[c][1] - rotated[0][1])) c = i;

  const first = half(rotated.slice(0, c + 1), 0, c);
  const second = half([...rotated.slice(c), rotated[0]], 0, rotated.length - c);

  return [...first.slice(0, -1), ...second.slice(0, -1)];
}

// the outer boundary of the 8-connected object whose top-left pixel is (sx, sy), as pixel positions (Moore tracing)
function trace(mask, w, h, sx, sy) {
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const out = [[sx, sy]];
  let [x, y] = [sx, sy];
  let back = 4; // the start pixel was entered from the west
  let first = -1;

  for(let guard = 0; guard < 4 * w * h; guard++) {
    let d = -1;

    for(let i = 1; i <= 8; i++) {
      const k = (back + i) % 8;

      if(at(x + DIRS[k][0], y + DIRS[k][1])) {
        d = k;
        break;
      }
    }

    if(d < 0) break; // a single pixel

    if(first < 0) first = d;
    else if(x === sx && y === sy && d === first) break; // back at the start, about to repeat the first step

    const prev = [x + DIRS[(d + 7) % 8][0], y + DIRS[(d + 7) % 8][1]];

    [x, y] = [x + DIRS[d][0], y + DIRS[d][1]];
    back = DIRS.findIndex(([dx, dy]) => x + dx === prev[0] && y + dy === prev[1]);
    out.push([x, y]);
  }

  return out.length > 1 && out[out.length - 1][0] === sx && out[out.length - 1][1] === sy ? out.slice(0, -1) : out;
}

const loopArea = poly => poly.reduce((sum, [x, y], i) => sum + (x * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * y), 0) / 2;

// The outlines of the visible pixels of RGBA `data` (w x h): one polygon per separate object (8-connected), largest first, in the
// photo's local units 0..1000 like `boxFromAlpha`. Holes are ignored, specks dropped. null when nothing is visible, or when one object
// fills nearly the whole window (then the window is the outline).
export function outlinesFromAlpha(data, w, h, { solid = SOLID, minArea = MIN_AREA, eps = EPS } = {}) {
  const mask = new Uint8Array(w * h);

  for(let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > solid ? 1 : 0;

  const seen = new Uint8Array(w * h);
  const found = [];

  for(let y = 0; y < h; y++)
    for(let x = 0; x < w; x++) {
      if(!mask[y * w + x] || seen[y * w + x]) continue;

      // the object this pixel belongs to; (x, y) is its top-left pixel since rows are scanned from the top
      let count = 0;
      const stack = [[x, y]];

      seen[y * w + x] = 1;

      while(stack.length) {
        const [cx, cy] = stack.pop();

        count++;

        for(const [dx, dy] of DIRS) {
          const nx = cx + dx;
          const ny = cy + dy;

          if(nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx] && !seen[ny * w + nx]) (seen[ny * w + nx] = 1), stack.push([nx, ny]);
        }
      }

      if(count / (w * h) < minArea) continue;

      let loop = trace(mask, w, h, x, y);

      if(loop.length < 3) continue;

      loop = simplifyLoop(loop, eps);

      let e = eps;

      while(loop.length > MAX_VERTICES && e < 20) loop = simplifyLoop(loop, (e *= 1.5));

      if(loop.length >= 3) found.push({ count, area: Math.abs(loopArea(loop)), loop });
    }

  if(!found.length) return null;

  found.sort((a, b) => b.area - a.area);

  const polys = found.slice(0, MAX_OBJECTS).map(({ loop }) => loop.map(([px, py]) => [Math.round(((px + 0.5) / w) * 10000) / 10, Math.round(((py + 0.5) / h) * 10000) / 10]));

  return found[0].area / (w * h) >= FULL ? null : polys;
}

// the outlines of the picture `info` ({ href, width, height }) as a photo step with `crop` shows it; a promise of the polygons or null
export function visibleOutlines(info, crop) {
  return new Promise(done => {
    const image = new Image();

    image.onload = () => {
      try {
        const { side, x, y } = cropWindow(info, crop);
        const canvas = document.createElement('canvas');

        canvas.width = canvas.height = SIZE;

        const g = canvas.getContext('2d', { willReadFrequently: true });
        const k = image.naturalWidth / info.width;

        g.drawImage(image, x * k, y * k, side * k, side * k, 0, 0, SIZE, SIZE);
        done(outlinesFromAlpha(g.getImageData(0, 0, SIZE, SIZE).data, SIZE, SIZE));
      } catch {
        done(null);
      }
    };
    image.onerror = () => done(null);
    image.src = info.href;
  });
}
