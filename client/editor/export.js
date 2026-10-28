// Export the work as an image (EDITOR.md E125, UX-REQUIREMENTS.md J1.13): the same
// SVG the viewer draws, its photos inlined (an SVG drawn as an image may not load
// anything from the network), painted on a canvas, saved as PNG or JPG. The pure
// parts are here; `exportImage` needs a browser.
import renderToString from '../../vendor/preact-render-to-string.js';
import { renderStage } from './render.js';
import { findStep } from './model.js';
import { outlineOf } from './hit.js';

export const EXPORT_SIZE = 2000; // the picture's side in pixels
const FORMATS = { png: { type: 'image/png', ext: 'png' }, jpg: { type: 'image/jpeg', ext: 'jpg', quality: 0.92 } };

// the document as SVG text (the stage without its wrapper) with the photos as
// they are named in `photos(hash)`
export const documentSvg = (doc, options) => renderToString(renderStage(doc, options));

// the urls of the images an SVG text refers to
export const imageUrls = svg => [...new Set([...svg.matchAll(/<image\b[^>]*?\bhref="([^"]+)"/g)].map(m => m[1].replaceAll('&amp;', '&')))];

// the SVG text with each image url replaced by its entry in `data` (a Map url -> data url)
export function inlineImages(svg, data) {
  return svg.replace(/(<image\b[^>]*?\bhref=")([^"]+)(")/g, (all, head, url, tail) => {
    const found = data.get(url.replaceAll('&amp;', '&'));

    return found ? head + found + tail : all;
  });
}

// the SVG text sized to `px` x `px` (the viewBox stays 0..1000)
export const withSize = (svg, px) => svg.replace(/^<svg\b/, `<svg width="${px}" height="${px}"`);

// a file name from the title: letters and digits, the rest becomes a dash
export function fileName(title, format = 'png') {
  const base = String(title ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${base || 'wild-beauty'}.${(FORMATS[format] ?? FORMATS.png).ext}`;
}

const toDataUrlOf = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// the images of a document are named by hash or are object urls, so what a url holds
// never changes: each is read once (the clipboard, the tile and the palette all draw)
const inlined = new Map();
const inline = url => {
  if(!inlined.has(url)) inlined.set(url, fetch(url).then(res => (res.ok ? res.blob() : Promise.reject(new Error(`photo ${res.status}`)))).then(toDataUrlOf).catch(e => (inlined.delete(url), Promise.reject(e))));

  return inlined.get(url);
};
const toDataUrl = blob => toDataUrlOf(blob);

// the page drawn on a `size` x `size` canvas; the ground colour of the document
// under it when it has one, else transparent (`ground` gives a colour to use instead)
export async function sceneCanvas(doc, options, size, ground) {
  const svg = documentSvg(doc, options);
  const data = new Map();

  await Promise.all(imageUrls(svg).map(async url => data.set(url, await inline(url))));

  const picture = new Image();

  picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(withSize(inlineImages(svg, data), size));
  await picture.decode();

  const canvas = document.createElement('canvas');

  canvas.width = canvas.height = size;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  const fill = ground ?? (/^#[0-9a-f]{6}$/i.test(doc.bg ?? '') ? doc.bg : null);

  if(fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, size, size);
  }

  context.drawImage(picture, 0, 0, size, size);

  return canvas;
}

// The whole page as a small JPEG data url (the node's tile in the saved list);
// null when it cannot be drawn.
export async function documentThumb(doc, options, { size = 512, background = '#ffffff' } = {}) {
  try {
    return (await sceneCanvas(doc, options, size, /^#[0-9a-f]{6}$/i.test(doc.bg ?? '') ? doc.bg : background)).toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

// Draw the document and give the user the file. `options` are the renderNode
// options of the page on show (without `upTo`: the whole page), `background` the
// colour behind a JPG (it has no transparency). Rejects when anything fails.
export async function exportImage(doc, options, { format = 'png', background = '#ffffff', title } = {}) {
  const { type, quality } = FORMATS[format] ?? FORMATS.png;
  const svg = documentSvg(doc, options);
  const data = new Map();

  await Promise.all(
    imageUrls(svg).map(async url => {
      const res = await fetch(url);

      if(!res.ok) throw new Error(`photo ${res.status}`);

      data.set(url, await toDataUrl(await res.blob()));
    }),
  );

  const picture = new Image();

  picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(withSize(inlineImages(svg, data), EXPORT_SIZE));
  await picture.decode();

  const canvas = document.createElement('canvas');

  canvas.width = canvas.height = EXPORT_SIZE;

  const context = canvas.getContext('2d');

  if(format === 'jpg') {
    context.fillStyle = background;
    context.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
  }

  context.drawImage(picture, 0, 0, EXPORT_SIZE, EXPORT_SIZE);

  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('no image'))), type, quality));
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = fileName(title, format);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);

  return blob;
}

// One step alone (the clipboard's image): its visible part on a transparent ground,
// with its clip and moves, `px` pixels along the longer side. Rejects when it
// cannot be drawn.
export async function stepCanvas(doc, id, { photos, page = 0, px = 1600 } = {}) {
  const at = findStep(doc, id);

  if(!at) throw new Error('no step');

  const source = doc.pages[at.page].steps;
  const wanted = new Set([id, at.step.clip].filter(Boolean));
  const steps = source.filter(step => wanted.has(step.id) || (step.op === 'transform' && wanted.has(step.target)));
  const solo = { ...doc, mode: 'free', bg: undefined, pages: [{ ...doc.pages[at.page], steps }] };
  const corners = outlineOf(solo, id, { photos, page: 0, clipped: true });

  if(!corners) throw new Error('no outline');

  const xs = corners.map(c => c[0]);
  const ys = corners.map(c => c[1]);
  const pad = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.03;
  const [x, y] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
  const [w, h] = [Math.max(...xs) + pad - x, Math.max(...ys) + pad - y];
  const k = px / Math.max(w, h);
  const svg = documentSvg(solo, { photos, page: 0 }).replace(/^<svg\b([^>]*?)viewBox="[^"]*"/, `<svg$1viewBox="${x} ${y} ${w} ${h}"`);
  const data = new Map();

  await Promise.all(imageUrls(svg).map(async url => data.set(url, await inline(url))));

  const picture = new Image();

  picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(inlineImages(svg, data).replace(/^<svg\b/, `<svg width="${Math.round(w * k)}" height="${Math.round(h * k)}"`));
  await picture.decode();

  const canvas = document.createElement('canvas');

  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(picture, 0, 0, canvas.width, canvas.height);

  return canvas;
}

export async function stepImage(doc, id, options) {
  const canvas = await stepCanvas(doc, id, options);

  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('no image'))), 'image/png'));
}
