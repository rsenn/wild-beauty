// Seed the starting landscape (GRAPH.md S1.4): overall-root with the category
// nodes `art exhibition`, `fleamarket` and `places`, and a few samples below.
// Idempotent: a node is found by title among the children of its parent, so a
// second run adds nothing. Run: bun tools/seed.js [database file]
import { open } from '../server/db/db.js';
import { addLink, insertNode, linksFrom } from '../server/db/nodes.js';
import { emptyNode } from '../client/editor/model.js';

// the landscape: [title, kind, children?, { sells? }]; an item with `sells` links to an exhibit by path
const LANDSCAPE = [
  ['art exhibition', 'list', [
    ['Kunsthalle Sample', 'list', [
      ['Spring show', 'gallery'],
      ['Retrospective', 'list'],
    ]],
  ]],
  ['fleamarket', 'list', [
    ['Seller One', 'list', [
      ['Brass lamp', 'shop'],
      ['Oil painting, harbour', 'shop', [], { sells: ['art exhibition', 'Kunsthalle Sample', 'Retrospective'] }],
    ]],
    ['Seller Two', 'list', [
      ['Vinyl records, box of 40', 'shop'],
    ]],
  ]],
  ['places', 'list', [
    ['Zürich', 'node'],
    ['Bern', 'node'],
  ]],
];

// the child of `parent` titled `title`, or a new one linked below it -> id
function ensure(h, parent, title, kind, sort) {
  const found = parent === null
    ? h.get("SELECT id FROM nodes WHERE title = ? AND kind = 'list' AND id NOT IN (SELECT to_id FROM node_links)", title)
    : linksFrom(h, parent, 'child').map(l => h.get('SELECT id, title FROM nodes WHERE id = ?', l.id)).find(n => n.title === title);

  if(found) return found.id;

  const { id } = insertNode(h, { title, kind, doc: { ...emptyNode(), title } });

  if(parent !== null) addLink(h, parent, id, 'child', sort);

  return id;
}

// walk a title path from the root -> id or null
function find(h, root, path) {
  let at = root;

  for(const title of path) {
    at = linksFrom(h, at, 'child').map(l => h.get('SELECT id, title FROM nodes WHERE id = ?', l.id)).find(n => n.title === title)?.id;

    if(at === undefined) return null;
  }

  return at;
}

// -> { root, created } where created is the number of nodes added
export function seed(h) {
  return h.tx(() => {
    const before = h.get('SELECT COUNT(*) AS n FROM nodes').n;
    const root = ensure(h, null, 'overall-root', 'list', 0);
    const sells = [];

    const walk = (parent, items) =>
      items.forEach(([title, kind, children = [], opt = {}], i) => {
        const id = ensure(h, parent, title, kind, i);

        if(opt.sells) sells.push([id, opt.sells]);

        walk(id, children);
      });

    walk(root, LANDSCAPE);

    // cross-links come last, when every target exists
    for(const [from, path] of sells) {
      const to = find(h, root, path);

      if(to !== null) addLink(h, from, to, 'sells');
    }

    return { root, created: h.get('SELECT COUNT(*) AS n FROM nodes').n - before };
  });
}

if(import.meta.main) {
  const h = await open(process.argv[2]);
  const { root, created } = seed(h);

  console.log(`overall-root is node ${root}, ${created} node${created === 1 ? '' : 's'} added`);
  h.close();
}
