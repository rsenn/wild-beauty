import { html } from '../html.js';
import { renderNode } from '../editor/render.js';

// The page strip of `slides` mode (E57): one thumbnail per photo, in the
// node's photo order; a click shows that slide. No add, remove or reorder: the
// slides follow the photos.
export const SlideStrip = ({ t, doc, photos, count, current, onSelect }) => html`
  <div class="wb-editor-pages" role="group" aria-label=${t('editor.pages')}>
    <ol class="wb-editor-page-list">
      ${Array.from({ length: count }, (_, i) => html`
        <li class=${'wb-editor-page' + (i === current ? ' wb-editor-page-current' : '')}>
          <button type="button" class="wb-editor-page-pick" aria-pressed=${i === current ? 'true' : 'false'} aria-label=${t('editor.slide.n', { n: i + 1 })} onClick=${() => onSelect(i)}>
            <span class="wb-editor-page-thumb" aria-hidden="true">${renderNode(doc, { photos: hash => photos[hash] ?? null, mode: 'slides', page: i })}</span>
            <span class="wb-editor-page-number">${i + 1}</span>
          </button>
        </li>`)}
    </ol>
  </div>
`;
