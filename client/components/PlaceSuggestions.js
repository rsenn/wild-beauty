import { useEffect, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';

// The bulk form of the place chip (EDITOR.md E140): every saved node whose
// photos were taken at a place it is not linked to, with the place it would
// link to. Each row is answered one by one, or all at once. `onGraph` takes the
// graph the server answers with.
export const PlaceSuggestions = ({ t, onGraph, onClose }) => {
  const [list, setList] = useState(null); // null: still loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;

    fetch('/api/places/suggestions')
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(body => live && setList(body.suggestions))
      .catch(() => live && (setList([]), setFailed(true)));

    return () => {
      live = false;
    };
  }, []);

  const answer = async (op, rows) => {
    try {
      const res = await fetch('/api/places/suggestions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops: rows.map(({ node, lat, lon }) => ({ op, node, lat, lon })) }) });

      if(!res.ok) throw new Error(String(res.status));

      const body = await res.json();

      setFailed(false);
      setList(body.suggestions);
      onGraph(body.graph);
    } catch {
      setFailed(true);
    }
  };

  const rows = list ?? [];
  const label = s => s.title || t('node.untitled');

  return html`<div class="wb-graph-places" role="region" aria-label=${t('graph.places')}>
    <p class="wb-editor-context wb-editor-context-bar">
      <strong>${t('graph.places')}</strong>
      <button type="button" class="wb-editor-chip" disabled=${!rows.length} onClick=${() => answer('accept', rows)}>${t('graph.places.all')}</button>
      <button type="button" class="wb-editor-chip" disabled=${!rows.length} onClick=${() => answer('dismiss', rows)}>${t('graph.places.none')}</button>
      <button type="button" class="wb-editor-chip" onClick=${onClose}>${t('graph.places.close')}</button>
      ${failed && html`<span class="wb-editor-hint" role="alert">${t('graph.places.failed')}</span>`}
    </p>
    ${list !== null && !rows.length && html`<p class="wb-editor-context" role="status">${t('graph.places.empty')}</p>`}
    ${rows.map(s => html`<p key=${`${s.node}:${s.lat}:${s.lon}`} class="wb-editor-context wb-editor-context-bar">
      <span>${t('graph.places.row', { node: label(s), place: s.place.title })}</span>
      <button type="button" class="wb-editor-chip" onClick=${() => answer('accept', [s])}>${t('editor.place.link')}</button>
      <button type="button" class="wb-editor-chip" onClick=${() => answer('dismiss', [s])}>${t('editor.place.dismiss')}</button>
    </p>`)}
  </div>`;
};
