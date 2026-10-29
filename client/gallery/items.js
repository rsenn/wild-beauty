// What the 3D gallery hangs for a node (GALLERY.md S5): its child nodes with
// their tiles, in edge order; a node without child nodes (a list or slide show
// of photos) hangs its own photos in page order. -> [{ id, title?, url, full?, href? }]
// where `url` is the picture's image, `full` the sharper one that replaces it when
// zoomed in and `href` the page the Open button leads to.

import { photoSteps } from '../editor/render.js';

// the photo thumbnail is the node's tile, a baked photo its own thumbnail
const thumb = hash => `/files/photos/${hash}.thumb.jpg`;

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

  if(c.photos?.length > 1) return c.photos.map(({ hash, href: full }, i) => ({ id: `n${c.id}:${hash}`, title: `${c.title ?? ''} ${i + 1}/${c.photos.length}`.trim(), url: `/files/photos/${hash}.small.jpg`, full, href }));

  return [{ id: 'n' + c.id, title: c.title, url: thumb(c.tile), full: large(c.id), href }];
}

export function galleryItems(node, lang = 'en', photos = () => null) {
  const children = (node.children ?? []).filter(c => c.tile || c.photos?.length);

  if(children.length) return children.flatMap(c => childItems(c, lang));

  const seen = new Set();

  return photoSteps(node.doc ?? { pages: [] }).flatMap(step => (seen.has(step.photo) ? [] : (seen.add(step.photo), [{ id: step.photo, url: thumb(step.photo), ...(photos(step.photo)?.href && { full: photos(step.photo).href }) }])));
}

// every saved node with a tile, as the gallery of all nodes hangs them (the
// "Show" page): the nodes from the list API, newest first as given
export const nodeItems = (nodes, lang = 'en') =>
  nodes.filter(n => n.tile).map(n => ({ id: 'n' + n.id, title: n.title, url: thumb(n.tile), full: large(n.id), href: `/${lang}/node/${n.id}` }));
