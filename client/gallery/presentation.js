// The three ways to show the items of a gallery and the picture that stays
// current when the visitor switches between them (docs/GALLERY.md S5a).
// Pure functions, no DOM: the node page, the server and the tests share them.

export const VIEWS = ['3d', 'carousel', 'masonry'];

// tiles on a page of the masonry view
export const PAGE_SIZE = 48;

// an item id is `n<node>` or `n<node>:<hash>` (items.js) or a bare photo hash
const AT = /^[A-Za-z0-9:._-]{1,100}$/;

export const viewOf = value => (VIEWS.includes(value) ? value : '3d');

// the picture named in a link, or null
export const atOf = value => (typeof value === 'string' && AT.test(value) ? value : null);

// the position of an item id in the list, or -1
export const indexOf = (items, id) => (id ? items.findIndex(item => item.id === id) : -1);

// the item a view starts on: the one named, else the first
export const startIndex = (items, id) => Math.max(0, indexOf(items, id));

export const pageCount = (count, size = PAGE_SIZE) => Math.max(1, Math.ceil(count / size));

// the page of the masonry view that holds the item at `index`
export const pageOf = (index, size = PAGE_SIZE) => Math.floor(Math.max(0, index) / size);

// the items on one page
export const pageItems = (items, page, size = PAGE_SIZE) => items.slice(page * size, (page + 1) * size);

// the station of the 3D gallery (stations.js) that holds an item, or 0 when the item is not hung
export const stationOf = (stations, id) => Math.max(0, stations.findIndex(s => s.child?.id === id));

// the query that makes a link show a view on a picture: '' for the default view on nothing
export function presentationQuery({ view = '3d', at = null } = {}) {
  const query = new URLSearchParams();

  if(viewOf(view) !== '3d') query.set('view', view);
  if(atOf(at)) query.set('at', at);

  const text = query.toString();

  return text ? `?${text}` : '';
}
