// bun test: the texture role (EDITOR.md E71)
import { describe, expect, test } from 'bun:test';
import { apply } from '../../client/editor/commands.js';
import { addPhoto, emptyNode, isTexture, setRole, validate } from '../../client/editor/model.js';
import { renderStage, photoSteps } from '../../client/editor/render.js';
import { hitTest } from '../../client/editor/hit.js';
import { firstPhotoStep } from '../../server/media/thumb.js';
import { validateNode } from '../../server/node/validate.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const info = { href: '/x.jpg', width: 100, height: 100 };
const step = (id, hash, extra = {}) => ({ op: 'photo', id, photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal', ...extra });
const doc = steps => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
const svg = d => JSON.stringify(renderStage(d, { photos: () => info }));

describe('texture role', () => {
  test('a texture photo is not drawn, not hit, not a slide and not the tile', () => {
    const d = doc([step('photo001', A), step('photo002', B, { role: 'texture' })]);

    expect(svg(d)).toContain('photo001');
    expect(svg(d)).not.toContain('photo002');
    expect(hitTest(d, [50, 50], { photos: () => info })).toBe('photo001');
    expect(hitTest(doc([step('photo002', B, { role: 'texture' })]), [50, 50], { photos: () => info })).toBe(null);
    expect(photoSteps(d).map(s => s.id)).toEqual(['photo001']);
    expect(firstPhotoStep(doc([step('photo002', B, { role: 'texture' }), step('photo001', A)])).id).toBe('photo001');
    expect(firstPhotoStep(doc([step('photo002', B, { role: 'texture' })]))).toBe(null);
  });

  test('setRole marks every step of the photo, and back again', () => {
    const d = doc([step('photo001', A), step('photo002', A), step('photo003', B)]);
    const t = setRole(d, 'photo001', 'texture');

    expect(t.pages[0].steps.map(isTexture)).toEqual([true, true, false]);
    expect(validate(t)).toEqual([]);

    const back = setRole(t, 'photo002', 'picture');

    expect(back.pages[0].steps.some(s => 'role' in s)).toBe(false);
    expect(setRole(d, 'photo001', 'picture')).toBe(d);
    expect(setRole(t, 'photo001', 'texture')).toBe(t);
    expect(setRole(d, 'nothing1', 'texture')).toBe(d);
    expect(setRole(d, 'photo001', 'bogus')).toBe(d);
  });

  test('addPhoto with a role, and undoable through commands', () => {
    const blank = emptyNode();
    const d = addPhoto(blank, blank.pages[0].id, A, info, 'photo001', 'texture');

    expect(isTexture(d.pages[0].steps[0])).toBe(true);
    expect(isTexture(addPhoto(blank, blank.pages[0].id, A, info, 'photo001').pages[0].steps[0])).toBe(false);

    const snap = { doc: doc([step('photo001', A)]), kind: 'node' };

    expect(isTexture(apply(snap, { type: 'setRole', id: 'photo001', role: 'texture' }).snap.doc.pages[0].steps[0])).toBe(true);
  });

  test('the server keeps the role: node_photos gets it, a hash used both ways is a picture', () => {
    const has = () => true;
    const r = validateNode({ doc: doc([step('photo001', A), step('photo002', B, { role: 'texture' })]), kind: 'node' }, { hasPhoto: has });

    expect(r.photos).toEqual([{ hash: A, role: 'picture' }, { hash: B, role: 'texture' }]);

    const mixed = validateNode({ doc: doc([step('photo001', A), step('photo002', A, { role: 'texture' })]), kind: 'node' }, { hasPhoto: has });

    expect(mixed.photos).toEqual([{ hash: A, role: 'picture' }]);
  });
});
