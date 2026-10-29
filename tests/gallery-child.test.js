// bun test: the children a gallery page hands to the 3D gallery (server/node/view.js galleryChild)
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { insertNode, upsertPhoto } from '../server/db/nodes.js';
import { galleryChild } from '../server/node/view.js';

const H = n => String(n).repeat(64);
const photo = (id, hash) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'extend', opacity: 1, blend: 'normal' });
let h;

beforeEach(async () => {
  h = await open(':memory:');

  for(const n of [1, 2, 3]) upsertPhoto(h, { hash: H(n), ext: 'jpg', width: 400, height: 300, bytes: 10 });
});

const child = (mode, steps, tile = null) => insertNode(h, { title: 't', doc: { v: 1, style: {}, mode, pages: [{ id: 'p0', steps }] }, palette: [] }) && { id: 1, title: 't', tile, doc: { mode, pages: [{ id: 'p0', steps }] } };

describe('galleryChild', () => {
  test('a slide show lists its photos in order, without repeats, without missing ones', () => {
    const c = child('slides', [photo('a', H(2)), photo('b', H(1)), photo('c', H(2)), photo('d', H(9)), photo('e', H(3))], H(2));

    expect(galleryChild(h, c)).toEqual({ id: 1, title: 't', tile: H(2), photos: [{ hash: H(2), href: `/files/photos/${H(2)}.jpg` }, { hash: H(1), href: `/files/photos/${H(1)}.jpg` }, { hash: H(3), href: `/files/photos/${H(3)}.jpg` }] });
  });

  test('a collage or a slide show of one photo stays one picture', () => {
    expect(galleryChild(h, child('free', [photo('a', H(1)), photo('b', H(2))], H(1))).photos).toBeUndefined();
    expect(galleryChild(h, child('slides', [photo('a', H(1))], H(1))).photos).toBeUndefined();
  });
});
