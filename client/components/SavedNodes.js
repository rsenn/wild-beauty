import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// The saved nodes on /new (EDITOR.md E68): read-only tiles, newest first, with
// the node's thumbnail, its title, "Edit" (opens it in the editor) and a link
// to its page. The server renders the list (boot.nodes); the browser refreshes
// it after a save.
export const SavedNodes = ({ nodes, onEdit, editing }) => {
  const { t, lang } = useI18n();

  if(!nodes?.length) return null;

  return html`
    <section class="wb-saved" aria-labelledby="wb-saved-title">
      <h2 id="wb-saved-title" class="wb-saved-title">${t('nodes.saved')}</h2>
      <ul class="wb-cards wb-saved-list">
        ${nodes.map(node => {
          const title = node.title || t('node.untitled');

          return html`<li class="wb-card wb-saved-tile" key=${node.id}>
            <div class="wb-card-box wb-saved-box">
              ${node.tile
                ? html`<a class="wb-saved-thumb" href=${`/${lang}/node/${node.id}`} aria-label=${title}><img src=${`/files/photos/${node.tile}.thumb.jpg`} alt="" loading="lazy" /></a>`
                : html`<a class="wb-saved-thumb wb-saved-empty" href=${`/${lang}/node/${node.id}`} aria-label=${title}>${t('nodes.empty')}</a>`}
            </div>
            <span class="wb-saved-name">${title}</span>
            <button type="button" class="wb-editor-chip wb-saved-edit" aria-pressed=${editing === node.id ? 'true' : 'false'} onClick=${() => onEdit(node.id)}>${t('editor.edit')}</button>
          </li>`;
        })}
      </ul>
    </section>
  `;
};
