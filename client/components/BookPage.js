import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { SHORT_NOTE, bookOf, defaultOnlyNoted } from '../gallery/book.js';
import { NoteText } from './NoteText.js';

// /:lang/node/:id/book: the photo book of a node or gallery, laid out for the printer (docs/ALBUM.md S4c).
// A screen-only bar on top, then the sheets: a front page, per chapter a title page and the picture
// pages. Rendered on the server; only the Print button needs JavaScript.

const Picture = ({ p }) => html`
  <figure class=${'wb-book-fig' + (p.desc?.length > SHORT_NOTE ? ' wb-book-fig-long' : '')}>
    <img src=${p.href} width=${p.w || undefined} height=${p.h || undefined} alt=${p.desc ? p.desc.split(/\r?\n/)[0] : ''} />
    ${p.desc && html`<figcaption><${NoteText} text=${p.desc} /></figcaption>`}
  </figure>
`;

export const BookPage = () => {
  const { t, lang } = useI18n();
  const { book } = useBoot();
  const onlyNoted = book.notes ?? defaultOnlyNoted(book.chapters);
  const shown = bookOf(book.chapters, { onlyNoted });
  const all = bookOf(book.chapters, { onlyNoted: false });
  const base = `/${lang}/node/${book.id}/book`;
  const title = book.title || t('node.untitled');

  return html`
    <div class="wb-book">
      <div class="wb-book-bar">
        <a href=${`/${lang}/node/${book.id}`}>${t('book.back')}</a>
        <span class="wb-book-count">${t('book.counts', { pictures: shown.pictures, pages: shown.pages, all: all.pictures, allPages: all.pages })}</span>
        <a class=${'wb-book-opt' + (onlyNoted ? ' wb-book-opt-on' : '')} href=${`${base}?notes=${onlyNoted ? 0 : 1}`}>${onlyNoted ? t('book.all') : t('book.noted')}</a>
        <button type="button" onClick=${() => globalThis.print?.()}>${t('book.print')}</button>
      </div>
      <section class="wb-book-page wb-book-front">
        <h1>${title}</h1>
        <p class="wb-book-sub">${t('book.pictures', { n: shown.pictures })}</p>
        ${shown.chapters.length > 1 && html`<ol class="wb-book-toc">${shown.chapters.map(c => html`<li><span>${c.title || t('node.untitled')}</span><span>${c.count}</span></li>`)}</ol>`}
      </section>
      ${shown.chapters.map(
        c => html`
          ${shown.chapters.length > 1 && html`<section class="wb-book-page wb-book-title"><h2>${c.title || t('node.untitled')}</h2><p class="wb-book-sub">${t('book.pictures', { n: c.count })}</p></section>`}
          ${c.pages.map(page => html`<section class="wb-book-page wb-book-page-pics"><div class=${'wb-book-grid wb-book-n' + page.length}>${page.map(p => html`<${Picture} key=${p.hash} p=${p} />`)}</div></section>`)}
        `,
      )}
    </div>
  `;
};
