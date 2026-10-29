// What the 3D gallery hangs for a node (GALLERY.md S5): its child nodes with
// their tiles, in edge order; a node without child nodes (a list or slide show
// of photos) hangs its own photos in page order. -> [{ id, title?, url, href? }]
// where `url` is the picture's image and `href` the page a tap opens.

import { photoSteps } from '../editor/render.js';

// the photo thumbnail is the node's tile, a baked photo its own thumbnail
const thumb = hash => `/files/photos/${hash}.thumb.jpg`;

// does a node offer the gallery at all: a kind that is a collection, or a
// slide show or grid, and at least two pictures to hang
export function galleryable(node, items = galleryItems(node)) {
  const collection = ['list', 'album', 'gallery'].includes(node.kind) || node.children?.length > 0 || ['slides', 'grid'].includes(node.doc?.mode);

  return collection && items.length >= 2;
}

export function galleryItems(node, lang = 'en') {
  const children = (node.children ?? []).filter(c => c.tile);

  if(children.length) return children.map(c => ({ id: 'n' + c.id, title: c.title, url: thumb(c.tile), href: `/${lang}/node/${c.id}` }));

  const seen = new Set();

  return photoSteps(node.doc ?? { pages: [] }).flatMap(step => (seen.has(step.photo) ? [] : (seen.add(step.photo), [{ id: step.photo, url: thumb(step.photo) }])));
}

// every saved node with a tile, as the gallery of all nodes hangs them (the
// "Show" page): the nodes from the list API, newest first as given
export const nodeItems = (nodes, lang = 'en') =>
  nodes.filter(n => n.tile).map(n => ({ id: 'n' + n.id, title: n.title, url: thumb(n.tile), href: `/${lang}/node/${n.id}` }));
