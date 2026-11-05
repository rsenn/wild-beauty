// What the read-only node page needs besides the document: where each photo
// is and how big, for renderNode's `photos` resolver (client/editor/view/render.js).
import { getNode, getPhoto, linksFrom } from '../db/nodes.js';
import { galleryItems } from '../../client/gallery/items.js';
import { apply } from '../../client/editor/geometry/matrix.js';
import { choosePadding } from '../media/color.js';
import { photoSteps } from '../../client/editor/view/render.js';
import { visibleDoc } from '../../client/editor/core/model.js';
import { photosOf } from './validate.js';

// -> { [hash]: { href, width, height, padding } } for the photos of `doc`
// that exist; a missing one is left out and renders as nothing
export function photoInfos(h, doc) {
  const infos = {};

  for(const { hash } of photosOf(doc)) {
    const photo = getPhoto(h, hash);

    if(photo) infos[hash] = { href: `/files/photos/${hash}.${photo.ext}`, width: photo.width, height: photo.height, padding: choosePadding(photo.palette ?? []) };
  }

  return infos;
}

// A child of a gallery as the page hands it to the 3D gallery. A child that is a
// sequence of images (a slide show or a grid) also lists its photos, in the order
// of the node and without repeats, so the gallery hangs each of them (items.js).
// -> { id, title, tile, photos?: [{ hash, href }] }
export function galleryChild(h, child) {
  const out = { id: child.id, title: child.title, tile: child.tile };

  if(!['slides', 'grid'].includes(child.doc?.mode)) return out;

  const infos = photoInfos(h, child.doc);
  const seen = new Set();
  const photos = photoSteps(visibleDoc(child.doc)).flatMap(({ photo }) => (infos[photo] && !seen.has(photo) ? (seen.add(photo), [{ hash: photo, href: infos[photo].href }]) : []));

  return photos.length > 1 ? { ...out, photos } : out;
}

// the first text box of a document with something in it, as { step, box: [x, y, w, h] } (the box on the stage), or null
export function titleBox(doc) {
  for(const page of doc?.pages ?? [])
    for(const step of page.steps)
      if(step.op === 'text' && String(step.text ?? '').trim()) {
        const corners = [[0, 0], [step.w, 0], [0, step.h], [step.w, step.h]].map(p => apply(step.m, p));
        const [xs, ys] = [corners.map(c => c[0]), corners.map(c => c[1])];
        const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];

        return box[2] > 0 && box[3] > 0 ? { step, box: box.map(v => Math.round(v * 10) / 10) } : null;
      }

  return null;
}

// n pictures spread evenly over the list, the first and the last included
export const spread = (list, n) => (list.length <= n ? list : Array.from({ length: n }, (_, i) => list[Math.round((i * (list.length - 1)) / (n - 1))]));

// The cards of the Show page (docs/GALLERY.md S5b): the galleries `canView` lets through, newest first
// -> [{ id, title, href, count, photos: [{ id, url }], heading: { step, box } | null }]
export function viewCards(h, { canView, lang = 'en', limit = 6 }) {
  const cards = [];

  for(const { id } of h.all("SELECT id FROM nodes WHERE kind = 'gallery' ORDER BY id DESC")) {
    const node = getNode(h, id);

    if(!node || !canView(node)) continue;

    const children = linksFrom(h, id, 'child').flatMap(({ id: to }) => {
      const child = getNode(h, to);

      return child && canView(child) ? [galleryChild(h, child)] : [];
    });
    const items = galleryItems({ doc: node.doc, children }, lang, () => null);

    cards.push({ id, title: node.title, href: `/${lang}/node/${id}`, count: items.length, photos: spread(items, limit).map(({ id: key, url }) => ({ id: key, url })), heading: titleBox(node.doc) });
  }

  return cards;
}
