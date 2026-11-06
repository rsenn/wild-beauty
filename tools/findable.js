#!/usr/bin/env bun
// Which nodes may search engines be offered (docs/SEO.md S1)?
//   bun tools/findable.js --list                list the public nodes and whether they are findable
//   bun tools/findable.js ID... --on            make these nodes findable
//   bun tools/findable.js ID... --off           never findable
//   bun tools/findable.js ID... --default       back to the default rule (a public collage is findable)
import { open } from '../server/db/db.js';
import { getNode } from '../server/db/nodes.js';
import { isFindable } from '../server/seo.js';

const args = process.argv.slice(2);
const ids = args.filter(a => /^\d+$/.test(a)).map(Number);
const mode = args.includes('--on') ? 1 : args.includes('--off') ? 0 : args.includes('--default') ? null : undefined;
const h = await open();

if(mode !== undefined && ids.length) {
  for(const id of ids) {
    if(!getNode(h, id)) {
      console.error(`no node ${id}`);
      continue;
    }

    h.run('UPDATE nodes SET search = ? WHERE id = ?', mode, id);
  }
}

if(args.includes('--list') || mode !== undefined) {
  const rows = h.all("SELECT id FROM nodes WHERE visibility = 'public' AND space IS NULL ORDER BY id").map(({ id }) => getNode(h, id));

  for(const n of rows) console.log(`${String(n.id).padStart(4)}  ${isFindable(n) ? 'findable ' : 'not found'}  ${n.search === 1 ? 'on     ' : n.search === 0 ? 'off    ' : 'default'}  ${n.kind}/${n.doc?.mode ?? 'free'}  ${(n.title || '').slice(0, 40)}`);
} else console.error('usage: bun tools/findable.js --list | ID... --on | --off | --default');
