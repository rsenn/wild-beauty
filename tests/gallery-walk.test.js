// bun test: what the gallery hangs and how the visitor walks (GALLERY.md S4, S5; TODO 13.4 13.6)
import { describe, expect, test } from 'bun:test';
import { autoPlan } from '../client/gallery/autoplan.js';
import { buildGallery } from '../client/gallery/build.js';
import { galleryItems, galleryable, nodeItems } from '../client/gallery/items.js';
import { collide, createWalker } from '../client/gallery/walk.js';

const photo = (id, extra = {}) => ({ op: 'photo', id: 's' + id, photo: id.repeat(8), m: [1, 0, 0, 1, 0, 0], ...extra });
const doc = (steps, mode = 'slides') => ({ mode, pages: [{ id: 'p', steps }] });

describe('galleryItems', () => {
  test('child nodes with a tile win, in order, with the page they open', () => {
    const node = { children: [{ id: 4, title: 'a', tile: 'aa' }, { id: 5, title: 'b', tile: null }, { id: 6, title: 'c', tile: 'cc' }], doc: doc([photo('x')]) };

    expect(galleryItems(node, 'de')).toEqual([
      { id: 'n4', title: 'a', url: '/files/photos/aa.thumb.jpg', full: '/api/nodes/4/large', href: '/de/node/4' },
      { id: 'n6', title: 'c', url: '/files/photos/cc.thumb.jpg', full: '/api/nodes/6/large', href: '/de/node/6' },
    ]);
  });

  test('a child that is a sequence of images hangs every photo in its own order, between its siblings', () => {
    const seq = [{ hash: 'p1', href: '/files/photos/p1.jpg' }, { hash: 'p2', href: '/files/photos/p2.png' }, { hash: 'p3', href: '/files/photos/p3.jpg' }];
    const node = { children: [{ id: 4, title: 'a', tile: 'aa' }, { id: 5, title: 'Roses', tile: 'rr', photos: seq }, { id: 6, title: 'c', tile: null }], doc: doc([]) };
    const items = galleryItems(node, 'fr');

    expect(items.map(i => i.id)).toEqual(['n4', 'n5:p1', 'n5:p2', 'n5:p3']);
    expect(items[2]).toEqual({ id: 'n5:p2', title: 'Roses 2/3', url: '/files/photos/p2.small.jpg', full: '/files/photos/p2.png', href: '/fr/node/5' });
    expect(galleryItems(node, 'fr')).toEqual(items); // same order every time
  });

  test('a node without children hangs its own photos, once each, no textures', () => {
    const node = { doc: doc([photo('a'), photo('b'), photo('a'), photo('c', { role: 'texture' })]) };

    expect(galleryItems(node).map(i => i.url)).toEqual(['/files/photos/' + 'a'.repeat(8) + '.thumb.jpg', '/files/photos/' + 'b'.repeat(8) + '.thumb.jpg']);
  });

  test('a node\'s own photos carry the baked photo as the sharper picture', () => {
    const node = { doc: doc([photo('a'), photo('b')]) };
    const photos = hash => (hash === 'a'.repeat(8) ? { href: `/files/photos/${hash}.jpg` } : null);
    const [a, b] = galleryItems(node, 'en', photos);

    expect(a.full).toBe(`/files/photos/${'a'.repeat(8)}.jpg`);
    expect(b.full).toBeUndefined();
  });

  test('offered for lists and slide shows with two pictures, not for a single collage', () => {
    const two = [photo('a'), photo('b')];

    expect(galleryable({ kind: 'list', doc: doc(two, 'free') })).toBe(true);
    expect(galleryable({ kind: 'node', doc: doc(two, 'slides') })).toBe(true);
    expect(galleryable({ kind: 'node', doc: doc(two, 'free') })).toBe(false);
    expect(galleryable({ kind: 'list', doc: doc([photo('a')], 'slides') })).toBe(false);
  });
});

describe('nodeItems', () => {
  test('every node with a tile becomes a picture that opens the node, in the order given', () => {
    const nodes = [{ id: 9, title: 'Nine', tile: 'aa' }, { id: 8, title: 'Group', tile: null }, { id: 7, title: '', tile: 'bb' }];

    expect(nodeItems(nodes, 'fr')).toEqual([
      { id: 'n9', title: 'Nine', url: '/files/photos/aa.thumb.jpg', full: '/api/nodes/9/large', href: '/fr/node/9' },
      { id: 'n7', title: '', url: '/files/photos/bb.thumb.jpg', full: '/api/nodes/7/large', href: '/fr/node/7' },
    ]);
  });
});

describe('collide', () => {
  test('a circle is pushed out of a wall segment (z = -y)', () => {
    const wall = [[0, 0, 10, 0, 0.1]];
    const [x, y] = collide(5, 0.2, 0.3, wall);

    expect(x).toBe(5);
    expect(y).toBeCloseTo(0.4);
  });
});

describe('walker', () => {
  const built = buildGallery(autoPlan(5)); // one closed room 16 x 10, start in the middle looking east

  test('starts at the start, eye over the floor', () => {
    const w = createWalker(built);

    expect([w.x, w.y, w.yaw]).toEqual([8, 5, Math.PI / 2]);
    expect(w.eye).toBeCloseTo(1.6);
  });

  test('forward walks the way the visitor looks', () => {
    const w = createWalker(built);

    w.step(0.1, { forward: 1 });
    expect(w.x).toBeCloseTo(8 + 0.22);
    expect(w.y).toBeCloseTo(5);
  });

  test('strafe right while facing east goes south', () => {
    const w = createWalker(built);

    w.step(0.1, { strafe: 1 });
    expect(w.y).toBeCloseTo(5 - 0.22);
  });

  test('a diagonal is not faster than straight', () => {
    const a = createWalker(built);
    const b = createWalker(built);

    a.step(0.1, { forward: 1 });
    b.step(0.1, { forward: 1, strafe: 1 });
    expect(Math.hypot(b.x - 8, b.y - 5)).toBeCloseTo(Math.hypot(a.x - 8, a.y - 5));
  });

  test('cannot walk through a wall or off the floor', () => {
    const w = createWalker(built);

    for(let i = 0; i < 300; i++) w.step(0.05, { forward: 1 }); // east, into the east wall at x = 16

    expect(w.x).toBeLessThan(16 - 0.1 - 0.3 + 1e-6);
    expect(w.x).toBeGreaterThan(15);
    expect(built.floorHeightAt(w.x, w.y)).toBe(0);
  });

  test('look turns and the pitch is limited', () => {
    const w = createWalker(built);

    w.step(0.01, { look: [0.5, 5] });
    expect(w.yaw).toBeCloseTo(Math.PI / 2 + 0.5);
    expect(w.pitch).toBeCloseTo(1.2);
  });

  test('can walk through a door into the next room', () => {
    const b = buildGallery(autoPlan(40));
    const w = createWalker(b);

    for(let i = 0; i < 600 && w.x < 24; i++) w.step(0.05, { forward: 1 }); // along y = 5: door, corridor, next room

    expect(w.x).toBeGreaterThan(24);
    expect(b.floorHeightAt(w.x, w.y)).toBe(0);
  });
});
