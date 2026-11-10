import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';

// The confirmation before nodes are deleted for good (docs/GRAPH.md S2.10), shared by the graph
// editor and the page list of a site. A modal alert dialog: Escape, the dimmed part and Cancel
// leave, Cancel has the focus so Enter never deletes, and the red button says what it does.
// `nodes` are { id, title, visibility, members } (members: how many nodes it holds);
// `onDone(ids)` is told which nodes are gone (also after a partial failure), `onClose()` closes.
const LISTED = 5;

// what one DELETE answered -> 'ok' | an error name of the delete.error.* keys
export const outcome = status => (status === 204 || status === 200 || status === 404 ? 'ok' : status === 423 ? 'locked' : status === 403 ? 'forbidden' : status === 409 ? 'site_root' : 'generic');

export async function deleteNodes(ids, send = id => fetch(`/api/nodes/${id}`, { method: 'DELETE' }).then(r => r.status).catch(() => 0)) {
  const done = [];
  const failed = [];

  for(const id of ids) {
    const result = outcome(await send(id));

    if(result === 'ok') done.push(id);
    else failed.push({ id, error: result });
  }

  return { done, failed };
}

export const ConfirmDelete = ({ nodes, onClose, onDone }) => {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null); // [{ id, error }] after a try that did not fully work
  const cancel = useRef(null);
  const confirm = useRef(null);
  const count = nodes.length;
  const online = nodes.filter(n => n.visibility === 'public').length;
  const members = nodes.filter(n => n.members > 0).length;
  const label = n => n.title || t('node.untitled');

  useEffect(() => {
    const before = document.activeElement;

    cancel.current?.focus();

    return () => before?.focus?.();
  }, []);

  const key = e => {
    if(e.key === 'Escape' && !busy) {
      e.stopPropagation();
      onClose();
    }

    // Tab stays inside the dialog: between its two buttons
    if(e.key === 'Tab') {
      const buttons = [cancel.current, confirm.current].filter(Boolean);
      const at = buttons.indexOf(document.activeElement);

      e.preventDefault();
      buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    }
  };

  const run = async () => {
    setBusy(true);

    const result = await deleteNodes(nodes.map(n => n.id));

    setBusy(false);

    if(result.done.length) onDone(result.done);

    if(!result.failed.length) return onClose();

    setFailed(result.failed);
  };

  const gone = failed ? count - failed.length : 0;

  return html`
    <div class="wb-confirm-overlay" onPointerDown=${e => e.target === e.currentTarget && !busy && onClose()} onKeyDown=${key}>
      <div class="wb-confirm" role="alertdialog" aria-modal="true" aria-labelledby="wb-confirm-title" aria-describedby="wb-confirm-text">
        <h2 id="wb-confirm-title" class="wb-confirm-title">${t('delete.title', { count })}</h2>
        <div id="wb-confirm-text" class="wb-confirm-body">
          <ul class="wb-confirm-list">
            ${nodes.slice(0, LISTED).map(n => html`<li key=${n.id}>${label(n)}</li>`)}
            ${count > LISTED && html`<li class="wb-confirm-more">${t('delete.more', { count: count - LISTED })}</li>`}
          </ul>
          <p>${t('delete.lead')}</p>
          ${online > 0 && html`<p class="wb-confirm-warn">${t('delete.online', { count: online })}</p>`}
          ${members > 0 && html`<p class="wb-confirm-warn">${t('delete.members')}</p>`}
          ${failed && html`<p class="wb-confirm-error" role="alert">${gone > 0 ? t('delete.done', { count: gone }) + ' ' : ''}${t('delete.error.' + failed[0].error)}</p>`}
        </div>
        <div class="wb-confirm-actions">
          <button type="button" class="wb-confirm-cancel" ref=${cancel} disabled=${busy} onClick=${onClose}>${failed ? t('delete.close') : t('delete.cancel')}</button>
          ${!failed && html`<button type="button" class="wb-confirm-delete" ref=${confirm} disabled=${busy} onClick=${run}>${busy ? t('delete.busy') : t('delete.confirm', { count })}</button>`}
        </div>
      </div>
    </div>
  `;
};
