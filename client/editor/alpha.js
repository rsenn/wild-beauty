// The visible part of a cutout (EDITOR.md E115): its box in a photo's local
// space, so the selection box and the hit test skip the transparent margin.
import { cropWindow } from './model.js';

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
