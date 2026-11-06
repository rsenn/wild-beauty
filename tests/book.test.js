import { describe, expect, test } from 'bun:test';
import { SHORT_NOTE, bookOf, bookPages, chosen, defaultOnlyNoted } from '../client/gallery/book.js';

const pic = (hash, desc) => ({ hash, href: `/f/${hash}.jpg`, w: 3, h: 2, ...(desc && { desc }) });
const hashes = pages => pages.map(page => page.map(p => p.hash));

describe('bookPages', () => {
  test('pictures without a note go four to a page', () => {
    const list = ['a', 'b', 'c', 'd', 'e', 'f'].map(h => pic(h));

    expect(hashes(bookPages(list))).toEqual([['a', 'b', 'c', 'd'], ['e', 'f']]);
  });

  test('two pictures with short notes share a page', () => {
    expect(hashes(bookPages([pic('a', 'x'), pic('b', 'y'), pic('c', 'z')]))).toEqual([['a', 'b'], ['c']]);
  });

  test('a long note keeps its picture alone, and the neighbour starts the next page', () => {
    const long = 'x'.repeat(SHORT_NOTE + 1);

    expect(hashes(bookPages([pic('a', 'x'), pic('b', long), pic('c', 'y')]))).toEqual([['a'], ['b'], ['c']]);
    expect(hashes(bookPages([pic('a', long), pic('b', 'x')]))).toEqual([['a'], ['b']]);
  });

  test('a picture without a note is not paired with a noted one, and the order never changes', () => {
    expect(hashes(bookPages([pic('a', 'x'), pic('b'), pic('c', 'y')]))).toEqual([['a'], ['b'], ['c']]);
    expect(bookPages([]).length).toBe(0);
  });
});

describe('chosen and bookOf', () => {
  const chapters = [
    { id: 1, title: 'One', pictures: [pic('a', 'x'), pic('b'), pic('c', 'y')] },
    { id: 2, title: 'Two', pictures: [pic('d'), pic('e')] },
  ];

  test('only pictures with a note', () => {
    expect(chosen(chapters[0].pictures, true).map(p => p.hash)).toEqual(['a', 'c']);
    expect(chosen([pic('a', '  ')], true)).toEqual([]);
  });

  test('a chapter without notes is left out when only noted pictures are wanted', () => {
    const book = bookOf(chapters, { onlyNoted: true });

    expect(book.chapters.map(c => c.id)).toEqual([1]);
    expect(book.pictures).toBe(2);
    expect(book.pages).toBe(1 + 1 + 1); // front page, one title page, a page for the two short notes
  });

  test('the whole book counts every picture and page', () => {
    const book = bookOf(chapters);

    expect(book.pictures).toBe(5);
    expect(book.pages).toBe(1 + (1 + 3) + (1 + 1));
  });

  test('the default: on when any picture has a note', () => {
    expect(defaultOnlyNoted(chapters)).toBe(true);
    expect(defaultOnlyNoted([{ id: 2, pictures: [pic('d')] }])).toBe(false);
  });
});
