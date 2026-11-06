// The photo book's server PDF (docs/ALBUM.md S4d). Only a logged-in user may ask for it.
//   POST /api/nodes/:id/book { notes?: boolean, lang?: string } -> { key, status }
//   GET  /api/nodes/:id/book?key=KEY                            -> { status, error? }
//   GET  /api/nodes/:id/book?key=KEY&download=1                 -> the PDF
import { existsSync } from 'node:fs';
import { database } from '../db/db.js';
import { viewerOf } from '../auth.js';
import { getNode, linksFrom } from '../db/nodes.js';
import { bookChapters } from '../node/view.js';
import { defaultOnlyNoted } from '../../client/gallery/book.js';
import { BOOK_KEY, bookFile, bookKey, bookStatus, startBook } from '../book/make.js';
import { canView } from './nodes.js';

const fail = (status, error) => Response.json({ error }, { status });

// the chapters of a node's book as `viewer` sees them (the page and the PDF share this)
export function chaptersFor(h, node, viewer) {
  const kids = linksFrom(h, node.id, 'child').flatMap(({ id: to }) => {
    const child = getNode(h, to);

    return child && canView(child, viewer) ? [child] : [];
  });

  return bookChapters(h, node, kids);
}

export async function bookRoute(req, idText, { locales }, h) {
  h ??= await database();

  const viewer = viewerOf(h, req);

  if(!viewer) return fail(401, 'login_required');

  const node = /^\d{1,15}$/.test(idText) ? getNode(h, Number(idText)) : null;

  if(!node || !canView(node, viewer)) return fail(404, 'not_found');

  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if(req.method === 'GET') {
    if(!key || !BOOK_KEY.test(key)) return fail(400, 'bad_key');

    if(url.searchParams.has('download')) {
      const file = bookFile(key);

      if(!existsSync(file)) return fail(404, 'not_found');

      const name = (node.title || `book-${node.id}`).replace(/[^\p{L}\p{N}._ -]+/gu, '').trim().slice(0, 80) || 'book';

      return new Response(Bun.file(file), { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}.pdf`, 'cache-control': 'private, no-store' } });
    }

    return Response.json(bookStatus(key), { headers: { 'cache-control': 'no-store' } });
  }

  if(req.method !== 'POST') return fail(405, 'method_not_allowed');

  let body = {};

  try {
    body = await req.json();
  } catch {}

  const lang = typeof body.lang === 'string' && locales.has(body.lang) ? body.lang : 'en';
  const messages = locales.get(lang);
  const chapters = chaptersFor(h, node, viewer);

  if(!chapters.length) return fail(422, 'empty');

  const onlyNoted = typeof body.notes === 'boolean' ? body.notes : defaultOnlyNoted(chapters);
  const options = { title: node.title ?? '', onlyNoted, lang };
  const strings = { pictures: n => String(messages['book.pictures'] ?? '{n}').replace('{n}', n), contents: messages['book.toc'] ?? 'Contents' };
  const started = startBook(chapters, options, strings);

  return Response.json({ key: started.key, status: started.status, ...(started.error && { error: started.error }) }, { status: 202 });
}

export { bookKey };
