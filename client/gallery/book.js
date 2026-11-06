// The photo book (docs/ALBUM.md S4c): which pictures go on which A4 page. Pure functions on
// plain data, no DOM, so the server page and the tests share them.
//
// A picture is { hash, href, w, h, desc? } where `desc` is its note. A page is a list of
// pictures that share it.

// a note up to this many characters lets its picture share the page with another one
export const SHORT_NOTE = 300;

// pictures without a note on one page, 2 by 2
export const PLAIN_PER_PAGE = 4;

const short = picture => !picture.desc || picture.desc.length <= SHORT_NOTE;

// the pictures of a chapter, or only those with a note
export const chosen = (pictures, onlyNoted) => (onlyNoted ? pictures.filter(p => p.desc?.trim()) : pictures);

// -> [[picture, ...], ...] pages in the order of the pictures, never reordered:
// a picture with a long note is alone on its page; a run of pictures without a note is cut into
// pages of four; otherwise two pictures with short notes share a page
export function bookPages(pictures) {
  const pages = [];
  let i = 0;

  while(i < pictures.length) {
    const p = pictures[i];

    if(!p.desc?.trim()) {
      let n = 1;

      while(n < PLAIN_PER_PAGE && pictures[i + n] && !pictures[i + n].desc?.trim()) n++;
      pages.push(pictures.slice(i, i + n));
      i += n;
    } else if(short(p) && pictures[i + 1] && short(pictures[i + 1]) && pictures[i + 1].desc?.trim()) {
      pages.push(pictures.slice(i, i + 2));
      i += 2;
    } else {
      pages.push([p]);
      i++;
    }
  }

  return pages;
}

// Should the book default to "only pictures with a note": when any picture of any chapter has one
export const defaultOnlyNoted = chapters => chapters.some(c => c.pictures.some(p => p.desc?.trim()));

// The book of the chapters: the front page's list, the chapters with their pages.
// -> { chapters: [{ id, title, count, pages }], pictures, pages }
// `pages` counts the front page, a title page per chapter and the picture pages
export function bookOf(chapters, { onlyNoted = false } = {}) {
  const made = chapters
    .map(c => {
      const pictures = chosen(c.pictures, onlyNoted);

      return { id: c.id, title: c.title, count: pictures.length, pages: bookPages(pictures) };
    })
    .filter(c => c.count > 0);

  return { chapters: made, pictures: made.reduce((n, c) => n + c.count, 0), pages: 1 + made.reduce((n, c) => n + 1 + c.pages.length, 0) };
}
