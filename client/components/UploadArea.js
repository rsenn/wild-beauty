import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { ACCEPT, isImageFile } from '../files.js';
import { UploadCard } from './UploadCard.js';

// drop zone plus the grid of chosen files. The server renders it empty and
// the browser adopts it. Files are only held in memory here; M5 uploads them.
export const UploadArea = () => {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [ignored, setIgnored] = useState(0);
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const nextId = useRef(1);
  const latest = useRef(items);

  latest.current = items;

  // object URLs are released when the area goes away
  useEffect(() => () => latest.current.forEach(item => URL.revokeObjectURL(item.url)), []);

  const add = files => {
    const images = [...files].filter(isImageFile);

    setIgnored(files.length - images.length);
    setItems(old => [...old, ...images.map(file => ({ id: nextId.current++, file, url: URL.createObjectURL(file), fit: 'contain', rotation: 0, selected: false, state: 'queued' }))]);
  };

  const update = (id, change) => setItems(old => old.map(item => (item.id === id ? { ...item, ...change(item) } : item)));

  const remove = id => {
    const gone = items.find(item => item.id === id);

    if(gone) URL.revokeObjectURL(gone.url);

    setItems(old => old.filter(item => item.id !== id));
  };

  // dragenter/leave also fire for children, so count them
  const dragEnter = e => {
    e.preventDefault();
    depth.current++;
    setOver(true);
  };
  const dragLeave = () => {
    if(--depth.current <= 0) {
      depth.current = 0;
      setOver(false);
    }
  };
  const drop = e => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    add(e.dataTransfer.files);
  };
  const pick = e => {
    add(e.target.files);
    e.target.value = '';
  };

  return html`
    <section class="wb-upload">
      <div class=${'wb-drop' + (over ? ' wb-drop-over' : '')} onDragEnter=${dragEnter} onDragOver=${e => e.preventDefault()} onDragLeave=${dragLeave} onDrop=${drop}>
        <div class="wb-drop-icon" aria-hidden="true"></div>
        <p class="wb-drop-text">${t('upload.drop')}</p>
        <p class="wb-drop-or">${t('upload.or')}</p>
        <input id="wb-file-input" class="wb-sr-only" type="file" multiple accept=${ACCEPT} onChange=${pick} />
        <label class="wb-button" for="wb-file-input">${t('upload.select')}</label>
      </div>
      ${ignored > 0 && html`<p class="wb-upload-note" role="status">${t('upload.ignored', { count: ignored })}</p>`}
      ${items.length > 0 && html`<p class="wb-upload-count" role="status">${t('upload.files', { count: items.length })}</p>`}
      <ul class="wb-cards">
        ${items.map(
          item => html`<${UploadCard}
            key=${item.id}
            item=${item}
            onToggle=${() => update(item.id, i => ({ selected: !i.selected }))}
            onRemove=${() => remove(item.id)}
            onRotate=${() => update(item.id, i => ({ rotation: (i.rotation + 90) % 360 }))}
            onFit=${() => update(item.id, i => ({ fit: i.fit === 'contain' ? 'cover' : 'contain' }))}
          />`,
        )}
      </ul>
    </section>
  `;
};
