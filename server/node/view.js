// What the read-only node page needs besides the document: where each photo
// is and how big, for renderNode's `photos` resolver (client/editor/render.js).
import { getPhoto } from '../db/nodes.js';
import { choosePadding } from '../media/color.js';
import { photoSteps } from '../../client/editor/render.js';
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
  const photos = photoSteps(child.doc).flatMap(({ photo }) => (infos[photo] && !seen.has(photo) ? (seen.add(photo), [{ hash: photo, href: infos[photo].href }]) : []));

  return photos.length > 1 ? { ...out, photos } : out;
}
