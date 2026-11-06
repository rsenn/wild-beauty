import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { config } from '../server/config.js';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';
import { bookStatus, startBook } from '../server/book/make.js';
import { bookTex, noteTex, texEscape } from '../server/book/tex.js';

const pic = (hash, desc, ext = 'jpg') => ({ hash, href: `/files/photos/${hash}.${ext}`, w: 300, h: 200, ...(desc && { desc }) });
const strings = { pictures: n => `${n} pictures`, contents: 'Contents' };
const file = p => `${p.hash}.jpg`;
const figures = tex => (tex.match(/\\fig(?:fill|flow)\{[^}]*\.jpg\}/g) ?? []).length; // the calls, not the macro definitions

describe('texEscape and noteTex', () => {
  test('TeX specials are escaped, control characters dropped, umlauts kept', () => {
    expect(texEscape('50% of a_b & {c} #1 $ ~ ^ \\')).toBe('50\\% of a\\_b \\& \\{c\\} \\#1 \\$ \\textasciitilde{} \\textasciicircum{} \\textbackslash{}');
    expect(texEscape('Zürich\u0007')).toBe('Zürich');
  });

  test('a note with a body has its first line as a bold heading; short notes are centred, long ones are not', () => {
    const tex = noteTex('Title\nsecond line\n\nNext paragraph', true);

    expect(tex).toContain('\\begin{center}');
    expect(tex).toContain('\\bfseries\\fontsize{14}{17}\\selectfont Title');
    expect(tex).toContain('second line');
    expect(noteTex('x'.repeat(400), false)).toContain('\\raggedright');
    expect(noteTex('One line only', true)).not.toContain('fontsize{14}');
  });
});

describe('bookTex', () => {
  const chapters = [
    { id: 1, title: 'One & two', pictures: [pic('a', 'x'), pic('b', 'y'), pic('c')] },
    { id: 2, title: 'Two', pictures: [pic('d', 'z')] },
  ];

  test('every picture of the plan is in the source, once; chapters get a title page and a contents entry', () => {
    const tex = bookTex(chapters, { title: 'My_book', file, strings });

    expect(figures(tex)).toBe(4);
    expect(tex).toContain('My\\_book');
    expect(tex).toContain('One \\& two (3)');
    expect(tex.match(/\\label\{ch\d\}/g).length).toBe(2);
    expect(tex).toContain('\\pageref{ch1}');
  });

  test('only noted pictures leaves out the picture without a note and a chapter without notes', () => {
    const tex = bookTex(chapters, { title: 'B', onlyNoted: true, file, strings });

    expect(figures(tex)).toBe(3);
    expect(tex).not.toContain('{c.jpg}');
  });

  test('a single chapter has no contents and no title page', () => {
    const tex = bookTex([chapters[1]], { title: 'B', file, strings });

    expect(tex).not.toContain('\\pageref');
    expect(tex).not.toContain('\\label');
  });
});

// a real run, when LuaLaTeX is installed
describe('startBook', () => {
  const saved = { ...config };
  const have = !!Bun.which('lualatex');
  let root;

  beforeAll(async () => {
    await detectTools();
    root = mkdtempSync(resolve(tmpdir(), 'wb-book-'));
    Object.assign(config, { dataDir: root, photosDir: resolve(root, 'photos') });
    await run(['mkdir', '-p', config.photosDir]);

    if(imagemagick.convert) {
      await run([...imagemagick.convert, '-size', '300x200', 'gradient:red-blue', resolve(config.photosDir, 'a.jpg')]);
      await run([...imagemagick.convert, '-size', '200x300', 'gradient:green-yellow', resolve(config.photosDir, 'b.webp')]);
    }
  });

  afterAll(() => {
    Object.assign(config, saved);
    rmSync(root, { recursive: true, force: true });
  });

  test('makes a PDF with one page per plan page, from a JPEG and a WebP', async () => {
    if(!have || !imagemagick.convert) return;

    const chapters = [{ id: 1, title: 'Zürich', pictures: [pic('a', 'Ankunft\n\nDer Text.'), pic('b', 'Kurz', 'webp')] }];
    const { key } = startBook(chapters, { title: 'Test', onlyNoted: false, lang: 'en' }, strings);

    for(let i = 0; i < 120 && !['done', 'error'].includes(bookStatus(key).status); i++) await Bun.sleep(500);

    expect(bookStatus(key)).toEqual({ status: 'done' });

    const info = await run(['pdfinfo', resolve(root, 'books', `${key}.pdf`)]);

    // the front page, then the two pictures with short and long note: a page each
    if(info.code === 0) expect(info.stdout).toMatch(/Pages:\s+2/);
  }, 120000);
});
