// Server-side validation of a node before it is saved (EDITOR.md S4 step 1):
// the shared document check (client/editor/model.js validate), the metadata,
// the theme sanitiser and the existence of every photo. The same rules run in
// the browser, so a document that passed there passes here; the server just
// does not trust that it did.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HASH, config } from '../config.js';
import { sanitize } from '../../client/editor/theme.js';
import { KINDS, validate } from '../../client/editor/model.js';
import { getPhoto } from '../db/nodes.js';

// API error code and HTTP status per failure (EDITOR.md S2.11, S4.1)
const STATUS = { too_large: 413, invalid: 400, missing_photo: 422 };

// a photo exists when it is baked (a row in `photos`) or still an upload
export const photoLookup = h => hash => HASH.test(hash) && (!!getPhoto(h, hash) || existsSync(resolve(config.uploadsDir, `${hash}.json`)));

// All photo steps of the document -> [{ hash, role }] in first-use order. A
// photo is a texture only when every use of it says so.
export function photosOf(doc) {
  const by = new Map();

  for(const page of doc.pages)
    for(const step of page.steps)
      if(step.op === 'photo') {
        const role = step.role ?? 'picture';
        const known = by.get(step.photo);

        by.set(step.photo, known && known !== role ? 'picture' : role);

        // the original behind a cutout stays with the node, so it can be restored
        if(typeof step.orig === 'string' && !by.has(step.orig)) by.set(step.orig, 'picture');
      }

  return [...by].map(([hash, role]) => ({ hash, role }));
}

// body: { doc, kind? }; `hasPhoto(hash)` answers whether a photo exists (see
// photoLookup); `themes` (optional) is the set of known theme ids.
// -> { ok: true, doc, title, kind, photos }
//  | { ok: false, code, status, errors: [{ code, path }] }
// `doc` is the document with its style sanitised, `title` the one the node
// row gets (doc.title, EDITOR.md S3.1).
export function validateNode(body, { hasPhoto, themes } = {}) {
  const fail = (code, errors) => ({ ok: false, code, status: STATUS[code], errors });

  if(!body || typeof body !== 'object' || Array.isArray(body)) return fail('invalid', [{ code: 'not_object', path: '' }]);

  const errors = validate(body.doc);

  if(errors.length) return fail(errors.some(e => e.code === 'too_large') ? 'too_large' : 'invalid', errors);

  const kind = body.kind ?? 'node';

  if(!KINDS.includes(kind)) return fail('invalid', [{ code: 'bad_kind', path: 'kind' }]);

  // the 3D settings and the wall layer belong to a gallery
  if(kind !== 'gallery') {
    if(body.doc.scene !== undefined) return fail('invalid', [{ code: 'scene_not_gallery', path: 'scene' }]);

    const wall = body.doc.pages.flatMap((page, i) => page.steps.flatMap((step, j) => (step.wall ? [{ code: 'wall_not_gallery', path: `pages[${i}].steps[${j}].wall` }] : [])));

    if(wall.length) return fail('invalid', wall);
  }

  // the stored style is what the sanitiser lets through; an unknown theme id falls back to the page's
  const { theme, vars } = sanitize(body.doc.style);
  const style = { ...(theme && (!themes || themes.has(theme)) ? { theme } : {}), vars };
  const doc = { ...body.doc, style };
  const photos = photosOf(doc);
  const missing = hasPhoto ? photos.filter(p => !hasPhoto(p.hash)) : [];

  if(missing.length) return fail('missing_photo', missing.map(p => ({ code: 'missing_photo', path: p.hash })));

  return { ok: true, doc, title: doc.title ?? '', kind, photos };
}
