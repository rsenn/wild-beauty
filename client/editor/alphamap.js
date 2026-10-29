// The transparent parts of a photo (a background removal leaves a lot): a small
// alpha map per image url, filled in the browser, used so that transparent
// padding is not hit by a click and the selection box hugs the visible part.
// Without a map (not loaded yet, tests, server) everything counts as opaque.
import { cropWindow } from './model.js';
import { windingAt } from './multiclip.js';

const SIDE = 128; // the longer edge of the map in pixels
const SEEN = 20; // alpha (0..255) from which a pixel counts as content
const maps = new Map(); // url -> map | null (none or not transparent) | Promise

// a map { w, h, data, box } from RGBA pixels: `box` is the fraction box of the content, or null
// when the picture has no transparency
export function alphaMap(rgba, w, h) {
  const data = new Uint8Array(w * h);
  let [x0, y0, x1, y1] = [w, h, -1, -1];
  let clear = false;

  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) {
    const a = rgba[(y * w + x) * 4 + 3];

    data[y * w + x] = a;

    if(a < 250) clear = true;

    if(a >= SEEN) {
      if(x < x0) x0 = x;
      if(x > x1) x1 = x;
      if(y < y0) y0 = y;
      if(y > y1) y1 = y;
    }
  }

  return clear && x1 >= 0 ? { w, h, data, box: [x0 / w, y0 / h, (x1 + 1) / w, (y1 + 1) / h] } : null;
}

// is there content at fraction (u, v) of the picture, or next to it (`reach` in map pixels)?
export function opaqueAt(map, u, v, reach = 1) {
  if(!map) return true;

  const cx = Math.floor(u * map.w);
  const cy = Math.floor(v * map.h);

  for(let y = cy - reach; y <= cy + reach; y++) for(let x = cx - reach; x <= cx + reach; x++) if(x >= 0 && y >= 0 && x < map.w && y < map.h && map.data[y * map.w + x] >= SEEN) return true;

  return false;
}

// the map of an image if it is loaded (and transparent), else undefined
export const peekAlpha = url => {
  const found = maps.get(url);

  return found && !(found instanceof Promise) ? found : undefined;
};

// load the map of image `url`; resolves to it (or null)
export function loadAlpha(url) {
  if(!maps.has(url)) {
    maps.set(url, new Promise(resolve => {
      if(typeof document === 'undefined') return resolve(null);

      const image = new Image();

      image.onload = () => {
        try {
          const k = SIDE / Math.max(image.naturalWidth, image.naturalHeight);
          const [w, h] = [Math.max(1, Math.round(image.naturalWidth * k)), Math.max(1, Math.round(image.naturalHeight * k))];
          const canvas = document.createElement('canvas');

          canvas.width = w;
          canvas.height = h;

          const context = canvas.getContext('2d', { willReadFrequently: true });

          context.drawImage(image, 0, 0, w, h);
          resolve(alphaMap(context.getImageData(0, 0, w, h).data, w, h));
        } catch {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = url;
    }).then(map => (maps.set(url, map), map)));
  }

  const found = maps.get(url);

  return found instanceof Promise ? found : Promise.resolve(found);
}

// The box of the content of a photo that lies inside outlines `polys` (a list
// of polygons in the photo's local 0..1000 space), as [x0, y0, x1, y1] in local
// units; null when there is no map, no content inside, or the box would be the
// whole square. Computed once, when a photo is cut (the box is stored in `box`).
export function contentBox(map, info, crop, polys) {
  if(!map || !polys?.length) return null;

  const { side, x: ox, y: oy } = cropWindow(info, crop);
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];

  for(let y = 0; y < map.h; y++) for(let x = 0; x < map.w; x++) {
    if(map.data[y * map.w + x] < SEEN) continue;

    // the centre of the map pixel in local units
    const p = [(((x + 0.5) / map.w) * info.width - ox) / side * 1000, (((y + 0.5) / map.h) * info.height - oy) / side * 1000];

    if(p[0] < 0 || p[1] < 0 || p[0] > 1000 || p[1] > 1000 || !windingAt(polys, p)) continue;

    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  }

  if(x1 < 0 || !Number.isFinite(x0)) return null;

  // one map pixel of margin, in local units
  const [mx, my] = [(info.width / map.w / side) * 1000, (info.height / map.h / side) * 1000];
  const box = [Math.max(0, x0 - mx), Math.max(0, y0 - my), Math.min(1000, x1 + mx), Math.min(1000, y1 + my)].map(v => Math.round(v * 10) / 10);

  return (box[2] - box[0]) * (box[3] - box[1]) >= 1e6 * 0.98 ? null : box;
}
