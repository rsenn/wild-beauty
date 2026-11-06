// Make the PDF of a photo book on the server with LuaLaTeX (docs/ALBUM.md S4d). One job at a
// time; the result is kept in data/books/<key>.pdf, the key made of what the book holds, so the same
// book is not made twice and an edited node makes a new one.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../config.js';
import { log } from '../log.js';
import { run } from '../media/run.js';
import { imagemagick } from '../media/tools.js';
import { bookOf } from '../../client/gallery/book.js';
import { bookTex } from './tex.js';

export const booksDir = () => resolve(config.dataDir, 'books');
export const BOOK_KEY = /^[0-9a-f]{32}$/;
const MAX_AGE = 14 * 24 * 3600 * 1000;
// bump when the layout changes, so the PDFs kept from an older layout are not handed out again
const LAYOUT = 2;
const RUN_TIMEOUT = 20 * 60 * 1000;

// what the book is made of: the pictures with their notes in order, the chapters' titles, the option and the language
export function bookKey(chapters, { title, onlyNoted, lang }) {
  const book = bookOf(chapters, { onlyNoted });

  return createHash('sha256').update(JSON.stringify([LAYOUT, title, lang, onlyNoted, book.chapters.map(c => [c.title, c.pages.flat().map(p => [p.hash, p.desc ?? ''])])])).digest('hex').slice(0, 32);
}

export const bookFile = key => resolve(booksDir(), `${key}.pdf`);

const jobs = new Map(); // key -> { status: 'running' | 'error', error? }
let chain = Promise.resolve();

// 'done' | 'queued' | 'running' | 'error' | 'none', and the reason for an error
export function bookStatus(key) {
  if(existsSync(bookFile(key))) return { status: 'done' };

  return jobs.get(key) ?? { status: 'none' };
}

// the old files go
export function sweepBooks(now = Date.now()) {
  if(!existsSync(booksDir())) return;

  for(const name of readdirSync(booksDir())) {
    const path = resolve(booksDir(), name);

    try {
      if(now - statSync(path).mtimeMs > MAX_AGE) rmSync(path, { recursive: true, force: true });
    } catch {}
  }
}

// start (or join) the job for a book; -> the status. `chapters` as bookChapters gives them, `strings` for the TeX source.
export function startBook(chapters, options, strings) {
  const key = bookKey(chapters, options);
  const known = bookStatus(key);

  if(known.status !== 'none' && known.status !== 'error') return { key, ...known };

  jobs.set(key, { status: 'queued' });
  chain = chain.then(() => build(key, chapters, options, strings)).catch(() => {});

  return { key, status: 'queued' };
}

async function build(key, chapters, { title, onlyNoted, lang }, strings) {
  jobs.set(key, { status: 'running' });
  sweepBooks();

  const work = resolve(booksDir(), `work-${key}`);
  const fail = reason => (log('error', 'book', `${key}: ${reason}`), jobs.set(key, { status: 'error', error: reason }));

  try {
    rmSync(work, { recursive: true, force: true });
    mkdirSync(resolve(work, 'tex'), { recursive: true });

    // the pictures by name in the work directory: a link to the baked file, a JPEG made from a format TeX cannot embed
    const names = new Map();

    for(const c of chapters)
      for(const p of c.pictures) {
        const ext = /\.(\w+)$/.exec(p.href)?.[1] ?? 'jpg';
        const source = resolve(config.photosDir, `${p.hash}.${ext}`);

        if(!existsSync(source)) continue;

        if(ext === 'jpg' || ext === 'png') {
          symlinkSync(source, resolve(work, `${p.hash}.${ext}`));
          names.set(p.hash, `${p.hash}.${ext}`);
        } else {
          const r = await run([...imagemagick.convert, source, '-quality', '92', resolve(work, `${p.hash}.jpg`)], { timeout: 60000 });

          if(r.code === 0) names.set(p.hash, `${p.hash}.jpg`);
        }
      }

    // a picture whose file is missing is left out of the book
    const present = chapters.map(c => ({ ...c, pictures: c.pictures.filter(p => names.has(p.hash)) }));
    const tex = bookTex(present, { title, onlyNoted, file: p => names.get(p.hash), strings });

    await Bun.write(resolve(work, 'book.tex'), tex);

    const env = { HOME: resolve(config.dataDir, 'books-tex'), TEXMFVAR: resolve(config.dataDir, 'books-tex/var'), TEXMFCACHE: resolve(config.dataDir, 'books-tex/var') };

    mkdirSync(env.HOME, { recursive: true });

    const runs = bookOf(present, { onlyNoted }).chapters.length > 1 ? 2 : 1;

    for(let i = 0; i < runs; i++) {
      const r = await run(['lualatex', '-interaction=nonstopmode', '-halt-on-error', '-no-shell-escape', 'book.tex'], { cwd: work, timeout: RUN_TIMEOUT, env });

      if(r.code !== 0 || !existsSync(resolve(work, 'book.pdf'))) return fail(`lualatex failed (${r.code}): ${(r.stdout.match(/^!.*$/m)?.[0] ?? r.stderr).slice(0, 200)}`);
    }

    renameSync(resolve(work, 'book.pdf'), bookFile(key));
    jobs.delete(key);
  } catch(e) {
    fail(String(e.message ?? e));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
