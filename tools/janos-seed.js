// Create (or update) the user and the sitemap nodes of www.jános.ch
// (SITES.md): the root "jános.ch" with the pages Start, Über and Kontakt, all
// owned by the user. The password comes from the environment, never from a file:
//
//   JANOS_PASSWORD='...' bun tools/janos-seed.js [email]
//
// Safe to run again: it changes the password and leaves existing pages alone;
// JANOS_RESET=1 writes the placeholder text of the pages again.
import { open } from '../server/db/db.js';
import { addLink, getNode, insertNode, updateNode } from '../server/db/nodes.js';
import { saveUser } from '../server/auth.js';
import { addText } from '../client/editor/model.js';
import { siteById } from '../server/sites.js';

const email = process.argv[2] ?? 'janos.morzsinay@gmail.com';
const password = process.env.JANOS_PASSWORD;
const site = siteById('janos');

if(!password) {
  console.error('JANOS_PASSWORD is not set');
  process.exit(1);
}

const h = await open();
const { id: owner } = await saveUser(h, { email, name: 'János', password });

const emptyDoc = title => ({ v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {}, title });

// a page with a few centred lines of text on the 1000 unit stage
function pageDoc(title, lines) {
  let doc = emptyDoc(title);

  // the lines are spread down the stage (0..1000), more lines closer together
  const gap = lines.length > 4 ? 100 : 120;
  const top = lines.length > 4 ? 140 : 300;

  lines.forEach(({ text, size }, i) => {
    doc = addText(doc, 'page0001', { text, lines: [text], size, align: 'center', w: 800, h: size * 1.4, m: [1, 0, 0, 1, 100, top + i * gap] });
  });

  return doc;
}

const PAGES = [
  { slug: 'home', title: 'Start', lines: [{ text: 'jános', size: 96 }] },
  { slug: 'about', title: 'Über', lines: [{ text: 'Über', size: 64 }, { text: 'Hier entsteht eine kurze Vorstellung.', size: 36 }] },
  // the contact lines are plain text: mail, phone and the profiles become links when shown (client/editor/links.js)
  { slug: 'contact', title: 'Kontakt', lines: [{ text: 'Kontakt', size: 64 }, ...['janos@example.invalid', '+41 00 000 00 00', 'wa.me/410000000000', 'facebook.com/placeholder', 'instagram.com/placeholder', 'youtube.com/@placeholder'].map(text => ({ text, size: 34 }))] },
];

// a node of the site by kind or slug, created when missing
function ensure(where, params, make) {
  const found = h.get(`SELECT id FROM nodes WHERE space = ? AND ${where}`, site.id, ...params);

  if(found) return found.id;

  const { id } = make();

  h.run('UPDATE nodes SET space = ?, owner_id = ?, visibility = ? WHERE id = ?', site.id, owner, 'public', id);

  return id;
}

h.tx(() => {
  const root = ensure("kind = 'site'", [], () => insertNode(h, { title: site.rootTitle, doc: emptyDoc(site.rootTitle), kind: 'site' }));

  PAGES.forEach(({ slug, title, lines }, sort) => {
    const id = ensure('slug = ?', [slug], () => {
      const made = insertNode(h, { title, doc: pageDoc(title, lines), kind: 'page' });

      h.run('UPDATE nodes SET slug = ? WHERE id = ?', slug, made.id);

      return made;
    });

    if(process.env.JANOS_RESET) {
      const node = getNode(h, id);

      updateNode(h, id, { rev: node.rev, title, doc: pageDoc(title, lines), palette: node.palette });
    }

    if(!h.get("SELECT 1 AS ok FROM node_links WHERE from_id = ? AND to_id = ? AND label = 'child'", root, id)) addLink(h, root, id, 'child', sort);
  });

  console.log(`user ${email} (id ${owner}), root node ${root}: ${PAGES.map(p => `${p.title}=${getNode(h, h.get('SELECT id FROM nodes WHERE slug = ? AND space = ?', p.slug, site.id).id).id}`).join(', ')}`);
});

h.close();
