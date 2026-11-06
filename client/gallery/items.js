// What the 3D gallery hangs for a node (docs/GALLERY.md S5): its child nodes with
// their tiles, in edge order; a node without child nodes (a list or slide show
// of photos) hangs its own photos in page order. -> [{ id, title?, url, full?, href?, step?, desc? }]
// where `node` and `step` name the photo step the picture is (an own photo or one of a child's
// sequence), `desc` is its note in full, `title` the note's first line (docs/GALLERY.md S5c) and
// `rev` is there only when the owner may write the note (the node's rev at page load)
// where `url` is the picture's image, `full` the sharper one that replaces it when
// zoomed in and `href` the page the Open button leads to.

import { photoSteps } from '../editor/view/render.js';
import { visibleDoc } from '../editor/core/model.js';
import { titleOf } from '../editor/core/caption.js';

// the tile of a node: the thumbnail of its first photo
const thumb = hash => `/files/photos/${hash}.thumb.jpg`;

// a baked photo's picture for a gallery: made on the server when first asked for (a photo has no
// `.thumb` of its own, that is a node's tile)
const small = hash => `/files/photos/${hash}.small.jpg`;

// the node's large render, made on the server when first asked for
const large = id => `/api/nodes/${id}/large`;

// does a node offer the gallery at all: a kind that is a collection, or a
// slide show or grid, and at least two pictures to hang
export function galleryable(node, items = galleryItems(node)) {
  const collection = ['list', 'album', 'gallery'].includes(node.kind) || node.children?.length > 0 || ['slides', 'grid'].includes(node.doc?.mode);

  return collection && items.length >= 2;
}

// The pictures of one child, in the order of the gallery's edges. A child that is a
// sequence of images (`photos`, see server/node/view.js galleryChild) hangs every
// one of its photos, in the node's own order, each leading to the child's page;
// any other child hangs its tile.
export function childItems(c, lang = 'en') {
  const href = `/${lang}/node/${c.id}`;

  // a photo with a note is titled by its first line; `node`, `step` and `rev` (only for the owner of the child) let the carousel write the note back
  if(c.photos?.length > 1)
    return c.photos.map(({ hash, href: full, step, desc }, i) => ({
      id: `n${c.id}:${hash}`,
      node: c.id,
      step,
      ...(desc && { desc }),
      title: desc ? titleOf(desc) : `${c.title ?? ''} ${i + 1}/${c.photos.length}`.trim(),
      url: `/files/photos/${hash}.small.jpg`,
      full,
      href,
      ...(c.rev !== undefined && { rev: c.rev }),
    }));

  return [{ id: 'n' + c.id, title: c.title, url: thumb(c.tile), full: large(c.id), href }];
}

export function galleryItems(node, lang = 'en', photos = () => null) {
  const children = (node.children ?? []).filter(c => c.tile || c.photos?.length);

  if(children.length) return children.flatMap(c => childItems(c, lang));

  const seen = new Set();

  return photoSteps(visibleDoc(node.doc ?? { pages: [] })).flatMap(step => (seen.has(step.photo) ? [] : (seen.add(step.photo), [{ id: step.photo, node: node.id, step: step.id, ...(node.mine && { rev: node.rev }), url: small(step.photo), ...(step.desc && { title: titleOf(step.desc), desc: step.desc }), ...(photos(step.photo)?.href && { full: photos(step.photo).href }) }])));
}

// every saved node with a tile, as the gallery of all nodes hangs them (the
// "Show" page): the nodes from the list API, newest first as given
export const nodeItems = (nodes, lang = 'en') =>
  nodes.filter(n => n.tile).map(n => ({ id: 'n' + n.id, title: n.title, url: thumb(n.tile), full: large(n.id), href: `/${lang}/node/${n.id}` }));
