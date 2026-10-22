// What the read-only node page needs besides the document: where each photo
// is and how big, for renderNode's `photos` resolver (client/editor/render.js).
import { getPhoto } from '../db/nodes.js';
import { choosePadding } from '../media/color.js';
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
