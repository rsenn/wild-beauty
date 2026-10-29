import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { ACCEPT, isImageFile, uploadPayload } from '../files.js';
import { createQueue } from '../upload.js';
import { fitFiles, readyToAdd } from '../editor/quickadd.js';
import { LIMITS } from '../editor/model.js';

// "Add photos" of the node editor (EDITOR.md E141). One tap opens the file picker
// (several photos at once); they upload three at a time, with the retry and read-first
// of upload.js, and each lands in the node as soon as it and the ones before it are up,
// in the order chosen. The whole batch is one undo step. `have` is how many photos the
// node holds, `onAdd(payloads, { batch })` puts them in.
export const QuickAdd = ({ t, have, disabled, onAdd }) => {
  const [items, setItems] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const nextId = useRef(1);
  const next = useRef(0); // the first item not yet looked at
  const taken = useRef(new Set()); // ids already in the node
  const batch = useRef('');
  const queue = useRef(null);

  queue.current ??= createQueue({ onChange: (id, patch) => setItems(old => old.map(item => (item.id === id ? { ...item, ...patch } : item))) });

  useEffect(() => {
    const ready = readyToAdd(items, next.current, taken.current);

    next.current = ready.next;

    if(!ready.records.length) return;

    ready.ids.forEach(id => taken.current.add(id));
    onAdd(ready.records.map(record => uploadPayload(record)), { batch: batch.current });
  }, [items]);

  const pick = e => {
    const files = [...e.target.files].filter(isImageFile);

    e.target.value = '';

    // a new batch starts when the last one is finished; otherwise the photos join it
    const finished = items.every(item => item.state === 'done' || item.state === 'failed');

    if(finished && items.length) {
      next.current = 0;
      taken.current = new Set();
    }

    if(finished) batch.current = Math.random().toString(36).slice(2, 10);

    const waiting = finished ? 0 : items.filter(item => !taken.current.has(item.id) && item.state !== 'failed').length;
    const { take, skipped: over } = fitFiles(files.length, { limit: LIMITS.photos, have, waiting });
    const added = files.slice(0, take).map(file => ({ id: nextId.current++, file, state: 'queued', progress: 0, error: null, record: null }));

    setSkipped(over);
    setItems(old => [...(finished ? [] : old), ...added]);

    for(const item of added) queue.current.add(item.id, item.file);
  };
  const retry = () => {
    for(const item of items) if(item.state === 'failed') queue.current.add(item.id, item.file);
  };

  const total = items.length;
  const done = items.filter(item => item.state === 'done').length;
  const failed = items.filter(item => item.state === 'failed').length;
  const running = total - done - failed > 0;

  return html`
    <div class="wb-quickadd">
      <label class=${'wb-editor-chip wb-quickadd-button' + (disabled ? ' wb-quickadd-disabled' : '')}>
        ${t('editor.quickadd')}
        <input type="file" multiple accept=${ACCEPT} hidden disabled=${disabled} onChange=${pick} />
      </label>
      ${total > 0 && html`<span class="wb-upload-note" role="status">${t('editor.quickadd.progress', { done, total })}${failed ? ` · ${t('editor.quickadd.failed', { count: failed })}` : ''}</span>`}
      ${failed > 0 && !running && html`<button type="button" class="wb-editor-chip" onClick=${retry}>${t('editor.quickadd.retry')}</button>`}
      ${skipped > 0 && html`<span class="wb-upload-note" role="status">${t('editor.quickadd.limit', { max: LIMITS.photos, count: skipped })}</span>`}
    </div>
  `;
};
