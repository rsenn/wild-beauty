import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { answerKey, linkPlace, nearPlace, positionsOf, readAnswered, remember } from '../editor/places.js';

// The place suggestion under the context bar (EDITOR.md E137): when a photo of
// the node has a position, "taken near <place>" with a button to link the node
// to it. Never a dialog, never an automatic edge. A node that is not saved yet
// keeps the answer until it has an id.
export const PlaceChip = ({ t, doc, photos, nodeId }) => {
  const [near, setNear] = useState({}); // "lat,lon" -> { id, title } | null
  const [queued, setQueued] = useState([]); // [{ pos, title }] waiting for a saved node
  const [failed, setFailed] = useState(false);
  const [, bump] = useState(0);
  const positions = positionsOf(doc, photos);
  const wanted = positions.map(p => `${p.lat},${p.lon}`).join(' ');
  const flushing = useRef(false);

  useEffect(() => {
    let live = true;

    for(const pos of positions) {
      const key = `${pos.lat},${pos.lon}`;

      if(!(key in near))
        nearPlace(pos).then(place => {
          if(live) setNear(old => ({ ...old, [key]: place }));
        });
    }

    return () => {
      live = false;
    };
  }, [wanted]);

  const link = async (pos, title) => {
    if(await linkPlace(nodeId, pos)) {
      remember(answerKey(nodeId, title));
      setFailed(false);
      bump(n => n + 1);

      return true;
    }

    setFailed(true);

    return false;
  };

  // the node got its id: send the links that were accepted before
  useEffect(() => {
    if(!nodeId || !queued.length || flushing.current) return;

    flushing.current = true;
    Promise.all(queued.map(q => link(q.pos, q.title))).then(() => {
      flushing.current = false;
      setQueued([]);
    });
  }, [nodeId, queued]);

  const answered = readAnswered();
  const asked = queued.map(q => q.title);
  const list = positions.flatMap(pos => {
    const place = near[`${pos.lat},${pos.lon}`];

    return place && !answered.has(answerKey(nodeId, place.title)) && !answered.has(answerKey(null, place.title)) ? [{ pos, title: place.title }] : [];
  }).filter((x, i, all) => all.findIndex(y => y.title === x.title) === i);

  if(!list.length) return null;

  return html`${list.map(({ pos, title }) => {
    const waiting = asked.includes(title);

    return html`<p class="wb-editor-context wb-editor-context-bar wb-editor-place" role="status">
      <span>${t(waiting ? 'editor.place.queued' : 'editor.place.suggest', { place: title })}</span>
      ${!waiting && html`<button type="button" class="wb-editor-chip" onClick=${() => (nodeId ? link(pos, title) : setQueued(q => [...q, { pos, title }]))}>${t('editor.place.link')}</button>
      <button type="button" class="wb-editor-chip" onClick=${() => (remember(answerKey(nodeId, title)), bump(n => n + 1))}>${t('editor.place.dismiss')}</button>`}
      ${failed && html`<span class="wb-editor-hint">${t('editor.place.failed')}</span>`}
    </p>`;
  })}`;
};
