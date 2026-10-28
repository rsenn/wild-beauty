// Export the work as an image (EDITOR.md E125, UX-REQUIREMENTS.md J1.13): the same
// SVG the viewer draws, its photos inlined (an SVG drawn as an image may not load
// anything from the network), painted on a canvas, saved as PNG or JPG. The pure
// parts are here; `exportImage` needs a browser.
import renderToString from '../../vendor/preact-render-to-string.js';
import { renderStage } from './render.js';

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

const toDataUrl = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

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
