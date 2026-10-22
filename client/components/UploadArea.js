import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { ACCEPT, isImageFile } from '../files.js';
import { createQueue } from '../upload.js';
import { SAVED_EVENT } from '../editor/pending.js';
import { UploadCard } from './UploadCard.js';

// a file already on the server: the card needs only its name and size
const existingItem = (record, index) => ({ id: index + 1, file: { name: record.name, size: record.size }, url: null, fit: 'contain', rotation: 0, selected: false, state: 'done', progress: 1, error: null, record });

// drop zone plus the grid of chosen files. The server renders the files already on disk
// (boot.uploads) and the browser adopts them. Each file is uploaded as soon as
// it is chosen. `extra` is a last grid cell (the "New node" tile).
export const UploadArea = ({ extra = null }) => {
  const { t } = useI18n();
  const { limits, uploads = [] } = useBoot();
  const [items, setItems] = useState(() => uploads.map(existingItem));
  const [ignored, setIgnored] = useState(0);
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const nextId = useRef(uploads.length + 1);
  const latest = useRef(items);

  latest.current = items;

  // upload progress and results arrive as patches for one item
  const queue = useRef(null);

  queue.current ??= createQueue({ onChange: (id, patch) => setItems(old => old.map(item => (item.id === id ? { ...item, ...patch } : item))) });

  // object URLs are released when the area goes away
  useEffect(
    () => () => {
      latest.current.forEach(item => URL.revokeObjectURL(item.url));
    },
    [],
  );

  // a finished upload shows the server's file; the local one can go
  useEffect(() => {
    for(const item of items) if(item.record && item.url) URL.revokeObjectURL(item.url);
  }, [items.map(item => item.record?.hash).join()]);

  const add = files => {
    const images = [...files].filter(isImageFile);

    const added = images.map(file => ({ id: nextId.current++, file, url: URL.createObjectURL(file), fit: 'contain', rotation: 0, selected: false, state: 'queued', progress: 0, error: null, record: null }));

    setIgnored(files.length - images.length);
    setItems(old => [...old, ...added]);

    for(const item of added) start(item);
  };

  // too large for the server: fail at once instead of sending 40 MB for a 413
  const start = item => {
    if(item.file.size > limits.maxBytes) setItems(old => old.map(i => (i.id === item.id ? { ...i, state: 'failed', error: 'too-large' } : i)));
    else queue.current.add(item.id, item.file);
  };

  const update = (id, change) => setItems(old => old.map(item => (item.id === id ? { ...item, ...change(item) } : item)));

  // a saved node took these uploads over: the cards go, the files are already gone
  useEffect(() => {
    const on = e => {
      const hashes = new Set(e.detail?.hashes ?? []);

      setItems(old => {
        for(const item of old) if(item.record && hashes.has(item.record.hash)) {
          queue.current.cancel(item.id);
          if(item.url) URL.revokeObjectURL(item.url);
        }

        return old.filter(item => !(item.record && hashes.has(item.record.hash)));
      });
    };

    window.addEventListener(SAVED_EVENT, on);

    return () => window.removeEventListener(SAVED_EVENT, on);
  }, []);

  const remove = id => {
    const gone = items.find(item => item.id === id);

    queue.current.cancel(id);

    if(gone) URL.revokeObjectURL(gone.url);
    if(gone?.record) fetch(`/api/uploads/${gone.record.hash}`, { method: 'DELETE' }).catch(() => {});

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
            onRetry=${() => start(item)}
          />`,
        )}
        ${extra}
      </ul>
    </section>
  `;
};
