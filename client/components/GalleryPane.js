import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { galleryReport, planPicture } from '../editor/galleryinfo.js';
import { LOOKS } from '../gallery/autoplan.js';
import { LOOK_NAMES, TEXTURE_SLOTS } from '../editor/scene.js';

// The gallery context pane (EDITOR.md E154): beside the stage of a node of kind
// `gallery`, it explains how a gallery is set up, shows what the editor found in the
// drawing (rooms, corridors, a top-down plan), how many pictures fit and where the
// pictures come from, and lets the owner pick the default look and assign texture
// photos to the walls and floors. `children` are the nodes linked under this one
// (what the gallery hangs); `onScene(patch)` is the `setScene` command.
export const GalleryPane = ({ doc, children = [], photos = {}, readOnly = false, onScene }) => {
  const { t, lang } = useI18n();
  const report = galleryReport(doc, { children });
  const picture = planPicture(report.plan);
  const { capacity, hang } = report;
  const overflow = capacity ? hang.count - capacity : 0;
  const found = report.rooms > 0;

  const step = (done, text) => html`<li class=${'wb-gal-step' + (done ? ' wb-gal-done' : '')}><span class="wb-gal-mark" aria-hidden="true">${done ? '✓' : '○'}</span><span>${text}</span></li>`;

  return html`
    <section class="wb-gal-pane" aria-label=${t('gallery.pane.title')}>
      <h3 class="wb-gal-title">${t('gallery.pane.title')}</h3>

      <ol class="wb-gal-steps">
        ${step(found, found ? t('gallery.pane.step.rooms', { count: report.rooms }) : t('gallery.pane.step.rooms.todo'))}
        ${step(report.corridors > 0, report.corridors ? t('gallery.pane.step.corridors', { count: report.corridors }) : t('gallery.pane.step.corridors.todo'))}
        ${step(hang.count > 0, hang.from === 'children' ? t('gallery.pane.step.children', { count: hang.count }) : hang.from === 'photos' ? t('gallery.pane.step.photos', { count: hang.count }) : t('gallery.pane.step.pictures.todo'))}
        ${step(!!(report.textures.candidates.length || doc.scene?.look), t('gallery.pane.step.surfaces', { look: t(`gallery.look.${report.textures.look}`) }))}
      </ol>

      <details class="wb-gal-help" open=${!found}>
        <summary>${t('gallery.pane.intro.title')}</summary>
        <p>${t('gallery.pane.intro')}</p>
        <ul>
          <li>${t('gallery.pane.intro.rooms')}</li>
          <li>${t('gallery.pane.intro.corridors')}</li>
          <li>${t('gallery.pane.intro.pictures')}</li>
          <li>${t('gallery.pane.intro.surfaces')}</li>
        </ul>
      </details>

      ${report.loose > 0 && html`<p class="wb-gal-warn" role="status">${t('gallery.pane.loose', { count: report.loose })}</p>`}
      ${report.problems.length > 0 && html`<p class="wb-gal-warn" role="alert">${t('gallery.pane.problem', { count: report.problems.length })}</p>`}

      <h4 class="wb-gal-sub">${t('gallery.pane.preview')}</h4>
      ${picture
        ? html`<svg class="wb-gal-plan" viewBox=${picture.box.join(' ')} role="img" aria-label=${t('gallery.pane.preview')}>
            ${picture.floors.map(points => html`<polygon class="wb-gal-room" points=${points.map(p => p.join(',')).join(' ')} />`)}
            ${picture.corridors.map(c => html`<polyline class="wb-gal-corridor" points=${c.points.map(p => p.join(',')).join(' ')} stroke-width=${c.width} />`)}
            ${picture.walls.map(points => html`<polyline class="wb-gal-wall" points=${points.map(p => p.join(',')).join(' ')} />`)}
            ${picture.start && html`<circle class="wb-gal-start" cx=${picture.start[0]} cy=${picture.start[1]} r=${Math.max(picture.box[2], picture.box[3]) / 60} />`}
          </svg>`
        : html`<p class="wb-gal-empty">${t('gallery.pane.preview.none')}</p>`}

      <h4 class="wb-gal-sub">${t('gallery.pane.pictures')}</h4>
      ${capacity > 0 && html`<p>${t('gallery.pane.capacity', { count: capacity })}</p>`}
      ${overflow > 0 && html`<p class="wb-gal-warn" role="status">${t('gallery.pane.overflow', { count: overflow })}</p>`}
      <p class=${report.photos.total >= report.photos.limit / 2 ? 'wb-gal-warn' : 'wb-gal-note'}>${t('gallery.pane.budget', { total: report.photos.total, limit: report.photos.limit })}</p>
      ${hang.from === 'children' && report.children.list.length > report.children.shown && html`<p class="wb-gal-note">${t('gallery.pane.children.nopic')}</p>`}
      ${hang.from === 'children' && report.photos.pictures > 0 && html`<p class="wb-gal-note">${t('gallery.pane.own.ignored')}</p>`}
      <p class="wb-gal-note">${t('gallery.pane.children', { count: report.children.list.length })}</p>
      ${report.children.list.length
        ? html`<ul class="wb-gal-children">
            ${report.children.list.slice(0, 8).map(child => html`<li><a href=${`/${lang}/node/${child.id}`}>${child.tile ? html`<img src=${`/files/photos/${child.tile}.thumb.jpg`} alt="" loading="lazy" />` : html`<span class="wb-gal-blank" aria-hidden="true"></span>`}<span>${child.title || t('node.untitled')}</span></a></li>`)}
            ${report.children.list.length > 8 && html`<li class="wb-gal-note">${t('gallery.pane.children.more', { count: report.children.list.length - 8 })}</li>`}
          </ul>`
        : html`<p class="wb-gal-empty">${t('gallery.pane.children.none')}</p>`}
      <p><a class="wb-editor-chip" href=${`/${lang}/tree`}>${t('gallery.pane.tree')}</a></p>

      <h4 class="wb-gal-sub">${t('gallery.pane.look')}</h4>
      <div class="wb-gal-looks" role="group" aria-label=${t('gallery.pane.look')}>
        ${LOOK_NAMES.map(
          name => html`<button type="button" class="wb-gal-look" disabled=${readOnly} aria-pressed=${report.textures.look === name ? 'true' : 'false'} onClick=${() => onScene({ look: name })}>
            <span class="wb-gal-swatch" aria-hidden="true"><span class="wb-gal-swatch-wall" style=${{ backgroundImage: `url(${LOOKS[name].wall.texture.color})` }}></span><span class="wb-gal-swatch-floor" style=${{ backgroundImage: `url(${LOOKS[name].floor.texture.color})` }}></span></span>${t(`gallery.look.${name}`)}
          </button>`,
        )}
      </div>
      <p class="wb-gal-note">${t('gallery.pane.look.hint')}</p>

      <h4 class="wb-gal-sub">${t('gallery.pane.textures')}</h4>
      ${report.textures.candidates.length === 0 && html`<p class="wb-gal-empty">${t('gallery.pane.textures.none')}</p>`}
      ${TEXTURE_SLOTS.map(slot => {
        const now = report.textures.slots[slot];

        return html`<div class="wb-gal-slot" role="group" aria-label=${t(`gallery.pane.slot.${slot}`)}>
          <span class="wb-gal-slot-name">${t(`gallery.pane.slot.${slot}`)}</span>
          <span class="wb-gal-slot-hint">${t(`gallery.pane.slot.${slot}.hint`)}</span>
          <span class="wb-gal-slot-picks">
            <button type="button" class="wb-editor-chip" disabled=${readOnly} aria-pressed=${now ? 'false' : 'true'} onClick=${() => onScene({ textures: { [slot]: null } })}>${t('gallery.pane.slot.default')}</button>
            ${report.textures.candidates.map(
              (hash, i) => html`<button type="button" class="wb-gal-pick" disabled=${readOnly} aria-pressed=${now === hash ? 'true' : 'false'} aria-label=${t('gallery.pane.slot.use', { n: i + 1 })} onClick=${() => onScene({ textures: { [slot]: hash } })}><img src=${photos[hash]?.href ?? ''} alt="" draggable="false" /></button>`,
            )}
          </span>
        </div>`;
      })}
    </section>
  `;
};
