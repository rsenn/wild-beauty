// bun test: server/db/nodes.js
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { addLink, deleteNode, deletePhoto, getNode, getPhoto, insertNode, linksFrom, linksTo, nodePhotos, orphanPhotos, removeLink, setNodePhotos, updateNode, upsertPhoto } from '../server/db/nodes.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
let h;

beforeEach(async () => {
  h = await open(':memory:');
  upsertPhoto(h, { hash: A, ext: 'jpg', width: 400, height: 300, bytes: 10 });
  upsertPhoto(h, { hash: B, ext: 'png', width: 10, height: 10, bytes: 5, palette: [{ hex: '#fff', weight: 1 }] });
});

describe('nodes', () => {
  test('round trip: doc and palette come back as values', () => {
    const doc = { v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {} };
    const { id, rev } = insertNode(h, { title: 'Hello', doc, palette: [{ hex: '#123456', weight: 1 }], now: 5 });
    const n = getNode(h, id);

    expect(rev).toBe(1);
    expect(n).toMatchObject({ id, title: 'Hello', doc, palette: [{ hex: '#123456', weight: 1 }], kind: 'node', rev: 1, pinned: false, created_at: 5, updated_at: 5 });
    expect(getNode(h, 999)).toBeNull();
  });

  test('update needs the current rev', () => {
    const { id } = insertNode(h, { title: 'a', doc: { n: 1 } });

    expect(updateNode(h, id, { rev: 1, title: 'b', doc: { n: 2 }, now: 9 })).toBe(2);
    expect(updateNode(h, id, { rev: 1, title: 'c', doc: { n: 3 } })).toBeNull();
    expect(getNode(h, id)).toMatchObject({ title: 'b', doc: { n: 2 }, rev: 2, updated_at: 9 });
    expect(updateNode(h, 999, { rev: 1, title: '', doc: {} })).toBeNull();
  });

  test('delete takes photo rows and edges, not photos', () => {
    const a = insertNode(h, { doc: {} }).id;
    const b = insertNode(h, { doc: {} }).id;

    setNodePhotos(h, a, [{ hash: A }]);
    addLink(h, a, b, 'child');
    expect(deleteNode(h, a)).toBe(true);
    expect(deleteNode(h, a)).toBe(false);
    expect(nodePhotos(h, a)).toEqual([]);
    expect(linksTo(h, b)).toEqual([]);
    expect(getPhoto(h, A)).not.toBeNull();
  });
});

describe('photos', () => {
  test('upsert refreshes a known hash and parses json', () => {
    upsertPhoto(h, { hash: A, ext: 'jpg', width: 800, height: 600, bytes: 20, meta: { q: 90 } });
    expect(getPhoto(h, A)).toMatchObject({ width: 800, bytes: 20, meta: { q: 90 }, palette: null });
    expect(getPhoto(h, B).palette).toEqual([{ hex: '#fff', weight: 1 }]);
    expect(h.get('SELECT count(*) AS n FROM photos').n).toBe(2);
  });

  test('setNodePhotos replaces, orders, dedupes and keeps roles', () => {
    const { id } = insertNode(h, { doc: {} });

    setNodePhotos(h, id, [{ hash: B }, { hash: A, role: 'texture' }, { hash: B }]);
    expect(nodePhotos(h, id)).toEqual([{ hash: B, sort: 0, role: 'picture' }, { hash: A, sort: 1, role: 'texture' }]);
    setNodePhotos(h, id, [{ hash: A }]);
    expect(nodePhotos(h, id)).toEqual([{ hash: A, sort: 0, role: 'picture' }]);
  });

  test('an unknown photo rolls the whole replacement back', () => {
    const { id } = insertNode(h, { doc: {} });

    setNodePhotos(h, id, [{ hash: A }]);
    expect(() => setNodePhotos(h, id, [{ hash: B }, { hash: 'c'.repeat(64) }])).toThrow();
    expect(nodePhotos(h, id).map(p => p.hash)).toEqual([A]);
  });

  test('orphans are the photos no node uses', () => {
    const { id } = insertNode(h, { doc: {} });

    setNodePhotos(h, id, [{ hash: A }]);
    expect(orphanPhotos(h)).toEqual([{ hash: B, ext: 'png' }]);
    expect(deletePhoto(h, B)).toBe(true);
    expect(orphanPhotos(h)).toEqual([]);
  });
});

describe('links', () => {
  test('children in order, filters by label and direction', () => {
    const [p, x, y, z] = [1, 2, 3, 4].map(() => insertNode(h, { doc: {} }).id);

    addLink(h, p, y, 'child', 2);
    addLink(h, p, x, 'child', 1);
    addLink(h, p, z, 'ref');
    expect(linksFrom(h, p, 'child').map(l => l.id)).toEqual([x, y]);
    expect(linksFrom(h, p).map(l => l.label).sort()).toEqual(['child', 'child', 'ref']);
    expect(linksTo(h, z)).toEqual([{ id: p, label: 'ref', sort: 0 }]);
  });

  test('adding again reorders, remove deletes, unknown label throws', () => {
    const [p, x] = [1, 2].map(() => insertNode(h, { doc: {} }).id);

    addLink(h, p, x, 'child', 5);
    addLink(h, p, x, 'child', 1);
    expect(linksFrom(h, p)).toEqual([{ id: x, label: 'child', sort: 1 }]);
    expect(removeLink(h, p, x, 'child')).toBe(true);
    expect(removeLink(h, p, x, 'child')).toBe(false);
    expect(() => addLink(h, p, x, 'friend')).toThrow('label');
  });
});
