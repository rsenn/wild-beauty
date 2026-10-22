import { html } from '../html.js';

// The step scrubber (EDITOR.md S2.7, E56): play / pause and a slider over the
// steps of the current page. `k` is how many steps are shown (0..count).
export const Scrubber = ({ t, count, k, playing, onScrub, onPlay }) => html`
  <div class="wb-editor-scrubber" role="group" aria-label=${t('editor.scrub')}>
    <button type="button" class="wb-editor-chip" disabled=${count === 0} aria-pressed=${playing ? 'true' : 'false'} title=${t(playing ? 'editor.scrub.pause' : 'editor.scrub.play')} aria-label=${t(playing ? 'editor.scrub.pause' : 'editor.scrub.play')} onClick=${onPlay}>${playing ? '⏸' : '▶'}</button>
    <input type="range" min="0" max=${count} step="1" value=${k} disabled=${count === 0} aria-label=${t('editor.scrub')} onInput=${e => onScrub(Number(e.target.value))} />
    <span class="wb-editor-scrub-count" aria-live="off">${k} / ${count}</span>
  </div>
`;
