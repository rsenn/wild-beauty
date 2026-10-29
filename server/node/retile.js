// Re-make the tiles of saved nodes (GRAPH.md S3.7, E82): a node saved before the
// server rendered tiles, or as a plain photo collage, still shows one photo's
// thumbnail in the graph and the 3D gallery. `retile` renders such a node as
// the viewer draws it and points the node at the new tile; the node itself
// (document, rev, update time) is not touched.
import { getNode, getPhoto } from '../db/nodes.js';
import { dropTile } from '../api/nodes.js';
import { needsRender, serverTile } from '../media/raster.js';

// Which nodes: `ids` (all when empty). A node is stale when it needs the render
// and its tile is a photo's own thumbnail (or missing); `force` renders every node
// that needs it, `dry` only reports. -> [{ id, title, status, tile? }] with status
// `done`, `kept` (nothing to do), `plain` (a single photo), `failed` (error) or `would` (dry)
export async function retile(h, { ids = [], force = false, dry = false, render = serverTile } = {}) {
  const rows = ids.length ? ids.map(id => getNode(h, id)).filter(Boolean) : h.all('SELECT id FROM nodes ORDER BY id').map(({ id }) => getNode(h, id));
  const report = [];

  for(const node of rows) {
    const out = { id: node.id, title: node.title };

    report.push(out);

    if(!needsRender(node.doc)) {
      out.status = 'plain';
      continue;
    }

    const stale = !node.tile || !!getPhoto(h, node.tile);

    if(!stale && !force) {
      out.status = 'kept';
      continue;
    }

    if(dry) {
      out.status = 'would';
      continue;
    }

    const r = await render(node.doc, hash => getPhoto(h, hash));

    if(!r.ok) {
      Object.assign(out, { status: 'failed', error: r.error });
      continue;
    }

    h.run('UPDATE nodes SET tile = ? WHERE id = ?', r.hash, node.id);
    if(node.tile && node.tile !== r.hash) dropTile(h, node.tile);

    Object.assign(out, { status: 'done', tile: r.hash });
  }

  return report;
}
