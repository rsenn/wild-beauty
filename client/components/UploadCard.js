import { useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { UPLOAD_MIME, cropPosition, formatSize, panAxis, saveCrop, uploadPayload } from '../files.js';
import { watchHold } from '../ghostdrag.js';
import { requestAdd } from '../editor/pending.js';

// file name and size under the thumbnail are switched off for now
const SHOW_FILE_INFO = false;

// one file of the upload grid: thumbnail (whole photo "extend" or "crop"),
// remove, rotate, select, upload state; the thumbnail is the local file until
// the server has it, then the server's display file
export const UploadCard = ({ item, order, inNode, onToggle, onRemove, onRotate, onCrop, onRetry }) => {
  const { t, lang } = useI18n();
  const { limits } = useBoot();
  const [brokenSrc, setBrokenSrc] = useState(null);
  const src = item.record ? `/files/uploads/${item.record.display}` : item.url;
  const busy = item.state === 'uploading' || item.state === 'processing';
  const cls = 'wb-card' + (item.selected ? ' wb-card-selected' : '') + ' wb-card-' + item.state + (inNode ? ' wb-card-used' : '');
  const percent = Math.round(item.progress * 100);

  const status = {
    queued: () => t('upload.state.queued'),
    uploading: () => t('upload.state.uploading', { percent }),
    processing: () => t('upload.state.processing'),
    failed: () => t('upload.error.' + item.error, { max: formatSize(limits.maxBytes, lang) }),
  }[item.state]?.();

  // dragging the selected photo slides the square crop along its long edge (EDITOR.md S2.5)
  // only a selected card pans: otherwise a swipe over it scrolls the page
  const pan = item.selected ? panAxis(item.record, item.rotation) : { axis: null, sign: 1 };
  const drag = useRef(null);
  const down = e => {
    if(!pan.axis || e.button > 0) return;

    drag.current = { x: e.clientX, y: e.clientY, crop: item.crop, moved: false, size: e.currentTarget.getBoundingClientRect().width };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = e => {
    const d = drag.current;

    if(!d) return;

    const delta = pan.axis === 'x' ? e.clientX - d.x : e.clientY - d.y;

    if(!d.moved && Math.abs(delta) < 4) return;

    // the long edge shows `ratio` squares, so one box width of drag moves the window by 1 / (ratio - 1)
    const ratio = Math.max(item.record.width, item.record.height) / Math.min(item.record.width, item.record.height);

    d.moved = true;
    onCrop(Math.min(1, Math.max(0, d.crop + (pan.sign * delta) / (d.size * (ratio - 1)))));
  };
  const up = e => {
    const d = drag.current;

    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if(d?.moved) {
      saveCrop(item.record.hash, latestCrop.current);
      suppress.current = true;
      setTimeout(() => (suppress.current = false), 0);
    }
  };
  const latestCrop = useRef(item.crop);
  const suppress = useRef(false);

  latestCrop.current = item.crop;

  // arrow keys on the focused photo do the same
  const key = e => {
    if(!pan.axis || e.altKey || e.ctrlKey || e.metaKey) return;

    const step = { ArrowLeft: pan.axis === 'x' ? -1 : 0, ArrowUp: pan.axis === 'y' ? -1 : 0, ArrowRight: pan.axis === 'x' ? 1 : 0, ArrowDown: pan.axis === 'y' ? 1 : 0 }[e.key];

    if(!step) return;

    e.preventDefault();

    // an arrow towards the start of the long edge, whatever the turn of the card
    const crop = Math.min(1, Math.max(0, item.crop + step * -pan.sign * (e.shiftKey ? 0.2 : 0.05)));

    onCrop(crop);
    saveCrop(item.record.hash, crop);
  };

  // a finished upload can be dragged onto the editor stage
  const dragStart = e => {
    e.dataTransfer.setData(UPLOAD_MIME, JSON.stringify(uploadPayload(item.record, 'picture', item.crop)));
    e.dataTransfer.effectAllowed = 'copy';
  };
  // the "add to node" button: opens an editor if none is open
  const add = () => requestAdd(uploadPayload(item.record, 'picture', item.crop));
  // a finger cannot HTML5-drag: holding the card picks it up instead
  const hold = e => item.record && !inNode && watchHold(e, { image: src, onDrop: () => add() });

  return html`
    <li class=${cls + (pan.axis ? ' wb-card-pan-' + pan.axis : '')} onPointerDown=${hold}>
      <div class="wb-card-box">
        <button type="button" class="wb-card-face" aria-pressed=${item.selected ? 'true' : 'false'} disabled=${inNode} onClick=${() => !suppress.current && onToggle()} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onKeyDown=${key} title=${inNode ? t('upload.used') : pan.axis ? t('upload.crop.hint.' + pan.axis) : item.file.name}>
          ${brokenSrc === src
            ? html`<span class="wb-card-nopreview">${t('upload.no-preview')}</span>`
            : html`<img class="wb-card-image" style=${`transform: rotate(${item.rotation}deg); object-position: ${cropPosition(item.record, item.crop)}`} src=${src} alt=${item.file.name} draggable="false" onError=${() => setBrokenSrc(src)} />`}
        </button>
        <button type="button" class="wb-round wb-card-remove" onClick=${onRemove} title=${t('upload.remove')} aria-label=${t('upload.remove')}></button>
        <button type="button" class="wb-round wb-card-rotate" onClick=${onRotate} title=${t('upload.rotate')} aria-label=${t('upload.rotate')}></button>
        ${pan.axis && !inNode && html`<span class=${'wb-card-pan wb-card-pan-icon-' + pan.axis} aria-hidden="true"></span>`}
        ${item.record && html`<button type="button" class="wb-card-add" disabled=${inNode} onClick=${add} draggable=${inNode ? undefined : 'true'} onDragStart=${dragStart} title=${t('upload.add')} aria-label=${t('upload.add')}>${t('upload.add.short')}</button>`}
        ${order && html`<span class="wb-card-order" aria-hidden="true">${order}</span>`}
        ${busy && html`<div class="wb-card-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${percent}><div class="wb-card-progress-bar" style=${`width: ${percent}%`}></div></div>`}
      </div>
      ${SHOW_FILE_INFO && html`<span class="wb-card-name">${item.file.name}</span>`}
      ${SHOW_FILE_INFO && html`<span class="wb-card-size">${formatSize(item.file.size, lang)}</span>`}
      ${status && html`<span class="wb-card-status" role=${item.state === 'failed' ? 'alert' : null}>${status}</span>`}
      ${item.state === 'failed' && item.error !== 'too-large' && html`<button type="button" class="wb-card-retry" onClick=${onRetry}>${t('upload.retry')}</button>`}
    </li>
  `;
};
