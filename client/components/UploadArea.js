import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { ACCEPT, isImageFile, loadCrops, uploadPayload } from '../files.js';
import { createQueue } from '../upload.js';
import { SAVED_EVENT, requestAdd } from '../editor/pending.js';
import { browserStorage, draftHashes } from '../editor/draft.js';
import { useEditor } from '../editor/useEditor.js';
import { SweepTile } from './SweepTile.js';
import { UploadCard } from './UploadCard.js';

// a file already on the server: the card needs only its name and size
const existingItem = (record, index) => ({ id: index + 1, file: { name: record.name, size: record.size }, url: null, crop: loadCrops()[record.hash] ?? 0.5, rotation: 0, selected: false, state: 'done', progress: 1, error: null, record });

// drop zone plus the grid of chosen files. The server renders the files already on disk
// (boot.uploads) and the browser adopts them. Each file is uploaded as soon as
// it is chosen. `extra` is a last grid cell (the "New node" tile).
export const UploadArea = ({ extra = null }) => {
  const { used } = useEditor();
  const picked = useRef(0); // selection counter: the order photos were selected in
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

    const added = images.map(file => ({ id: nextId.current++, file, url: URL.createObjectURL(file), crop: 0.5, rotation: 0, selected: false, state: 'queued', progress: 0, error: null, record: null }));

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

  // selected photos in selection order; only finished uploads can be added
  const chosen = items.filter(item => item.selected && !(item.record && used.includes(item.record.hash))).sort((a, b) => a.selectedAt - b.selectedAt);
  const order = new Map(chosen.map((item, i) => [item.id, i + 1]));
  const ready = chosen.filter(item => item.record);

  // all selected photos go to the editor in order and are deselected
  const addSelected = () => {
    for(const item of ready) requestAdd(uploadPayload(item.record, 'picture', item.crop));

    const done = new Set(ready.map(item => item.id));

    setItems(old => old.map(item => (done.has(item.id) ? { ...item, selected: false, selectedAt: 0 } : item)));
  };

  // what a sweep leaves: the photos of the open editor and of stored drafts
  const keep = new Set([...used, ...(browserStorage() ? draftHashes(browserStorage()) : [])]);
  const sweepable = items.filter(item => item.record && !keep.has(item.record.hash)).length;
  const held = items.filter(item => item.record && used.includes(item.record.hash)).length;
  const [swept, setSwept] = useState(null);

  const sweep = async () => {
    try {
      const res = await fetch('/api/uploads', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keep: [...keep] }) });

      if(!res.ok) throw new Error('sweep');

      const { removed } = await res.json();
      const gone = new Set(removed);

      for(const item of latest.current) if(item.record && gone.has(item.record.hash)) URL.revokeObjectURL(item.url);

      setItems(old => old.filter(item => !(item.record && gone.has(item.record.hash))));
      setSwept(removed.length);
    } catch {
      setSwept(-1);
    }
  };

  // a photo the open node uses is not offered again; it comes back when the node drops it
  const shown = items.filter(item => !(item.record && used.includes(item.record.hash)));

  return html`
    <section class="wb-upload">
      <div class=${'wb-drop' + (over ? ' wb-drop-over' : '')} onDragEnter=${dragEnter} onDragOver=${e => e.preventDefault()} onDragLeave=${dragLeave} onDrop=${drop}>
        <div class="wb-drop-icon" aria-hidden="true"></div>
        <p class="wb-drop-text">${t('upload.drop')}</p>
        <p class="wb-drop-or">${t('upload.or')}</p>
        <input id="wb-file-input" class="wb-sr-only" type="file" multiple accept=${ACCEPT} onChange=${pick} />
        <label class="wb-button" for="wb-file-input">${t('upload.select')}</label>
      </div>
      <p class="wb-upload-note wb-upload-retention">${t('upload.retention', { days: limits.uploadDays ?? 7 })}</p>
      <details class="wb-upload-details">
        <summary>${t('upload.retention.more')}</summary>
        <ul>${['original', 'cookie', 'delete'].map(k => html`<li>${t('upload.retention.' + k)}</li>`)}</ul>
      </details>
      ${swept !== null && html`<p class="wb-upload-note" role="status">${swept < 0 ? t('upload.sweep.failed') : t('upload.sweep.done', { count: swept })}</p>`}
      ${ignored > 0 && html`<p class="wb-upload-note" role="status">${t('upload.ignored', { count: ignored })}</p>`}
      ${shown.length > 0 && html`<p class="wb-upload-count" role="status">${t('upload.files', { count: shown.length })}</p>`}
      <ul class="wb-cards">
        ${shown.map(
          item => html`<${UploadCard}
            key=${item.id}
            item=${item}
            order=${order.get(item.id)}
            inNode=${!!item.record && used.includes(item.record.hash)}
            onToggle=${() => update(item.id, i => ({ selected: !i.selected, selectedAt: i.selected ? 0 : ++picked.current }))}
            onRemove=${() => remove(item.id)}
            onRotate=${() => update(item.id, i => ({ rotation: (i.rotation + 90) % 360 }))}
            onCrop=${crop => update(item.id, () => ({ crop }))}
            onRetry=${() => start(item)}
          />`,
        )}
        ${typeof extra === 'function' ? extra({ count: ready.length, addSelected }) : extra}
        ${sweepable > 0 && html`<${SweepTile} count=${sweepable} held=${held} onSweep=${sweep} />`}
      </ul>
    </section>
  `;
};
