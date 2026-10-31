// bun test: client/editor/galleryinfo.js, scene textures and look (setScene, surfaces)
import { describe, expect, test } from 'bun:test';
import { galleryReport, planPicture } from '../../client/editor/galleryinfo.js';
import { apply } from '../../client/editor/commands.js';
import { validate } from '../../client/editor/model.js';
import { surfaces } from '../../client/gallery/fromdoc.js';
import { LOOKS } from '../../client/gallery/autoplan.js';

const HASH = n => String(n).repeat(64).slice(0, 64);
const step = (id, extra) => ({ id, ...extra });

// a room of 10 x 8 m (the stage has 100 units a metre) and a corridor out of it
const room = { op: 'shape', id: 'room0001', path: 'M 100 100 L 1100 100 L 1100 900 L 100 900 Z', closed: true, fill: '#cccccc', strokeWidth: 0, wall: { height: 3.2 } };
const line = { op: 'shape', id: 'line0001', path: 'M 1100 500 L 1700 500', closed: false, strokeWidth: 4, wall: { height: 1, width: 2 } };
const docWith = (steps, extra) => ({ v: 1, mode: 'free', style: {}, pages: [{ id: 'page0001', steps }], ...extra });
const photo = (id, hash, role) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], crop: 0.5, opacity: 1, blend: 'normal', ...(role && { role }) });

describe('galleryReport', () => {
  test('an empty gallery has nothing yet', () => {
    const r = galleryReport(docWith([]));

    expect(r).toMatchObject({ rooms: 0, corridors: 0, loose: 0, capacity: 0, plan: null, hang: { from: 'none', count: 0 } });
    expect(planPicture(r.plan)).toBeNull();
  });

  test('finds rooms and corridors, counts loose shapes and strokes', () => {
    const doc = docWith([room, line, { ...room, id: 'loose001', wall: undefined }, { op: 'stroke', id: 'stroke01', pts: [[0, 0], [10, 10]], color: '#000000' }]);
    const r = galleryReport(doc);

    expect(r).toMatchObject({ rooms: 1, corridors: 1, loose: 2 });
    expect(r.capacity).toBeGreaterThan(0);

    const pic = planPicture(r.plan);

    expect(pic.floors).toHaveLength(1);
    expect(pic.corridors[0].width).toBe(2);
    expect(pic.box[2]).toBeGreaterThan(10);
  });

  test('a corner sharper than 45 degrees is reported', () => {
    const sharp = { ...room, id: 'sharp001', path: 'M 0 0 L 1000 0 L 0 100 Z' };

    expect(galleryReport(docWith([sharp])).problems).toMatchObject([{ id: 'sharp001', code: 'acute_corner' }]);
  });

  test('what the gallery hangs: the children, else the own pictures', () => {
    const doc = docWith([room, photo('ph000001', HASH(1)), photo('ph000002', HASH(2), 'texture')]);

    expect(galleryReport(doc).hang).toEqual({ from: 'photos', count: 1 });
    expect(galleryReport(doc).photos).toEqual({ total: 2, pictures: 1, textures: 1, limit: 40 });
    expect(galleryReport(doc).textures.candidates).toEqual([HASH(2)]);
    expect(galleryReport(doc, { children: [{ id: 5, title: 'a', tile: HASH(3) }, { id: 6, title: 'b', tile: null }] }).hang).toEqual({ from: 'children', count: 1 });
  });
});

describe('look and texture slots', () => {
  const base = { doc: docWith([room, photo('wall0001', HASH(1), 'texture'), photo('flor0001', HASH(2), 'texture'), photo('pict0001', HASH(3))]), kind: 'gallery' };
  const set = (snap, patch) => apply(snap, { type: 'setScene', patch }).snap;

  test('a look and the texture photos are stored, and the document stays valid', () => {
    let snap = set(base, { look: 'stone' });

    snap = set(snap, { textures: { wall: HASH(1) } });
    snap = set(snap, { textures: { corridor: HASH(2) } }); // a gap in the middle is allowed

    expect(snap.doc.scene).toEqual({ look: 'stone', style: { texture: { images: [HASH(1), null, HASH(2)], walls: 'single' } } });
    expect(validate(snap.doc)).toEqual([]);
  });

  test('only a texture photo and a known look are taken', () => {
    expect(set(base, { textures: { wall: HASH(3) } })).toBe(base); // a picture
    expect(set(base, { textures: { wall: HASH(9) } })).toBe(base); // not in the node
    expect(set(base, { look: 'neon' })).toBe(base);
    expect(set(base, { textures: { roof: HASH(1) } })).toBe(base);
  });

  test('clearing the last slot and the look removes the scene', () => {
    let snap = set(set(base, { look: 'walnut' }), { textures: { wall: HASH(1) } });

    snap = set(set(snap, { textures: { wall: null } }), { look: null });
    expect(snap.doc.scene).toBeUndefined();
  });

  test('a photo that stops being a texture or goes leaves the scene', () => {
    const snap = set(base, { textures: { wall: HASH(1), floor: HASH(2) } });
    const picture = apply(snap, { type: 'setRole', id: 'wall0001', role: 'picture' }).snap;

    expect(picture.doc.scene.style.texture.images).toEqual([null, HASH(2)]);
    expect(validate(picture.doc)).toEqual([]);
    expect(apply(snap, { type: 'removeStep', id: 'flor0001' }).snap.doc.scene.style.texture.images).toEqual([HASH(1)]);
  });

  test('surfaces: the look, with the owners photos laid over it', () => {
    const photos = hash => ({ [HASH(1)]: { href: '/files/photos/w.jpg' }, [HASH(2)]: { href: '/files/photos/f.jpg' } })[hash] ?? null;
    const doc = set(set(base, { look: 'stone' }), { textures: { wall: HASH(1), floor: HASH(2) } }).doc;
    const s = surfaces(doc.scene, photos);

    expect(s.wall.texture).toEqual({ color: '/files/photos/w.jpg', tile: 2.5 });
    expect(s.floor.texture).toEqual({ color: '/files/photos/f.jpg', tile: 2 });
    expect(s.corridor).toBeUndefined(); // the corridors are floored like the rooms
    expect(s.corridorWall).toEqual(LOOKS.stone.corridorWall);
    expect(surfaces({ look: 'walnut' }).floor).toEqual(LOOKS.walnut.floor);
    expect(surfaces(undefined)).toBe(LOOKS.warm);
    expect(surfaces({ style: { wall: { color: '#ffffff' } } })).toEqual({ wall: { color: '#ffffff' } }); // as before looks
  });
});
