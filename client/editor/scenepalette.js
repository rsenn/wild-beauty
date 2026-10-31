// The colours of what is on the stage (EDITOR.md E132): the page drawn small, its
// visible pixels counted. A stored photo palette describes the whole original,
// including what a cut-out removed and what is covered; this one does not.
import { distance } from '../color.js';
import { sceneCanvas, stepCanvas } from './export.js';

const SIZE = 96;
const MERGE = 0.05; // OKLab: colours closer than this are one

const hex2 = n => Math.round(n).toString(16).padStart(2, '0');

// [{ hex, weight }] (weights add up to 1, heaviest first) of the visible pixels of
// RGBA `data`: counted in coarse bins, then bins that are the same colour to the eye merged
export function paletteFromPixels(data, count = 24) {
  const bins = new Map();
  let total = 0;

  for(let i = 0; i < data.length; i += 4) {
    if(data[i + 3] < 128) continue;

    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const bin = bins.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };

    bin.r += data[i];
    bin.g += data[i + 1];
    bin.b += data[i + 2];
    bin.n++;
    bins.set(key, bin);
    total++;
  }

  if(!total) return [];

  const out = [];

  for(const bin of [...bins.values()].sort((a, b) => b.n - a.n)) {
    const hex = `#${hex2(bin.r / bin.n)}${hex2(bin.g / bin.n)}${hex2(bin.b / bin.n)}`;
    const near = out.find(o => distance(o.hex, hex) < MERGE);

    if(near) near.weight += bin.n;
    else out.push({ hex, weight: bin.n });
  }

  return out
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .map(c => ({ hex: c.hex, weight: c.weight / total }));
}

// the palette of the page on show, or of the photo `id` alone (its visible part);
// [] when nothing can be drawn yet
export async function scenePalette(doc, options, id) {
  try {
    const canvas = id ? await stepCanvas(doc, id, { ...options, px: SIZE }) : await sceneCanvas(doc, options, SIZE);

    return paletteFromPixels(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data);
  } catch {
    return [];
  }
}
