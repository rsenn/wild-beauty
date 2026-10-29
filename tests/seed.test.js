// bun test: tools/seed.js
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { graphEdges } from '../server/db/nodes.js';
import { seed } from '../tools/seed.js';

let h;

beforeEach(async () => {
  h = await open(':memory:');
});

describe('seed', () => {
  test('creates the root, the three categories and their samples', () => {
    const { root, created } = seed(h);
    const titles = h.all('SELECT title FROM nodes ORDER BY id').map(r => r.title);

    expect(created).toBe(titles.length);
    expect(titles).toContain('overall-root');
    expect(h.all('SELECT n.title FROM node_links l JOIN nodes n ON n.id = l.to_id WHERE l.from_id = ? ORDER BY l.sort', root).map(r => r.title)).toEqual(['art exhibition', 'fleamarket', 'places']);
  });

  test('a second run changes nothing', () => {
    seed(h);

    const nodes = h.get('SELECT COUNT(*) AS n FROM nodes').n;
    const edges = graphEdges(h).length;

    expect(seed(h).created).toBe(0);
    expect(h.get('SELECT COUNT(*) AS n FROM nodes').n).toBe(nodes);
    expect(graphEdges(h).length).toBe(edges);
  });

  test('a fleamarket item sells an exhibit', () => {
    seed(h);

    const sells = h.all("SELECT a.title AS item, b.title AS exhibit FROM node_links l JOIN nodes a ON a.id = l.from_id JOIN nodes b ON b.id = l.to_id WHERE l.label = 'sells'");

    expect(sells).toEqual([{ item: 'Oil painting, harbour', exhibit: 'Retrospective' }]);
  });

  test('every seeded node has a valid document and kind', () => {
    seed(h);

    for(const n of h.all('SELECT kind, doc FROM nodes')) {
      expect(['node', 'list', 'album', 'gallery', 'shop']).toContain(n.kind);
      expect(JSON.parse(n.doc).v).toBe(1);
    }
  });
});
