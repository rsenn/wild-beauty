import { Fragment } from '../../vendor/preact.js';
import { useEffect, useMemo, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { photoRefs, placePhotos, rotatePhotos, setDesc, setOff } from '../editor/core/batch.js';
import { LIMITS, setTitle } from '../editor/core/model.js';
import { titleOf } from '../editor/core/caption.js';
import { dateText, fillPattern, isPlaceholder, partsOf } from '../editor/core/pattern.js';
import { PartButtons, insertAt } from './NoteParts.js';
import { useBoot } from '../boot.js';

// The batch editor of the graph view (docs/BATCH.md): a table of the selected nodes and a
// light list of the square thumbnails of all their photos, in node order and photo order,
// where photos are dragged to a new place, also across a node boundary, or switched off.
// `ids` are the selected nodes, `nodes` the graph's node list; changes stay here until Save.

const keyOf = (node, id) => `${node}:${id}`;
const thumb = hash => `/files/photos/${hash}.small.jpg`;
const COLUMNS = ['id', 'title', 'kind', 'mode', 'photos', 'pages', 'visibility', 'mine'];

const EditIcon = () => html`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="4" width="14" height="14" rx="1.5" /><path d="M21 4.5l-9.5 9.5-.8 3 3-.8L23 6.7z" fill="currentColor" stroke="none" transform="translate(-2 1)" /></svg>`;
const EyeIcon = () => html`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>`;

export const BatchEditor = ({ ids, nodes, edges = [], onClose, onSaved }) => {
  const { t, lang } = useI18n();
  const { user } = useBoot();
  const prefs = user?.prefs ?? {};
  const pseudonym = user?.pseudonym ?? '';
  const [loaded, setLoaded] = useState(null); // { [id]: { rev, kind, title, doc, mine } }
  const [state, setState] = useState({ work: {}, past: [], future: [] }); // work: { [id]: document }
  const [view, setViewNow] = useState(() => (new URLSearchParams(globalThis.location?.search).get('bview') === 'photos' ? 'photos' : 'table'));
  const setView = v => {
    const url = new URL(globalThis.location.href);

    url.searchParams.set('bview', v);
    globalThis.history.replaceState(null, '', url);
    setViewNow(v);
  };
  const [sort, setSort] = useState({ key: 'id', down: false });
  const [sel, setSel] = useState([]); // keys of the chosen tiles
  const [note, setNote] = useState('');
  const [drop, setDrop] = useState(null); // { node, before } where a drag would land
  const [ghost, setGhost] = useState(null); // { x, y, hash, n } the dragged photos under the pointer
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(null); // the order the user made with the up and down buttons: node ids
  const [infos, setInfos] = useState({}); // { [hash]: { place, taken } } as POST /api/photos/describe answered (docs/BATCH.md S6a)
  const asked = useRef(new Set());
  const area = useRef(null);
  const [pop, setPop] = useState(null); // the annotation popover: { node, id, text, x, y }
  const [draft, setDraft] = useState(''); // the description being typed
  const drag = useRef(null);
  const last = useRef(null); // the tile a Shift-click ranges from
  const latest = useRef({});
  const { work } = state;

  useEffect(() => {
    let live = true;

    Promise.all(
      ids.map(async id => {
        const r = await fetch(`/api/nodes/${id}`);

        if(!r.ok) throw new Error(String(id));

        const { node, rev, mine } = await r.json();

        return [id, { rev, kind: node.kind, title: node.title, doc: node.doc, mine: !!mine }];
      }),
    ).then(
      list => {
        if(!live) return;

        const all = Object.fromEntries(list);

        setLoaded(all);
        setState({ work: Object.fromEntries(list.map(([id, n]) => [id, n.doc])), past: [], future: [] });
      },
      e => live && setNote(t('batch.loadFailed', { id: e.message })),
    );

    return () => {
      live = false;
    };
  }, []);

  // place and time of photos, asked once per photo: -> the whole table so far
  const ask = async hashes => {
    const fresh = [...new Set(hashes)].filter(h => !asked.current.has(h)).slice(0, 2000);

    if(!fresh.length) return infos;

    const r = await fetch('/api/photos/describe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hashes: fresh }) });

    if(!r.ok) throw new Error(String(r.status));

    const got = await r.json();

    for(const h of fresh) asked.current.add(h);

    const all = { ...infos, ...got };

    setInfos(all);

    return all;
  };

  const meta = id => nodes.find(n => n.id === id) ?? {};
  // the one parent (gallery, list, album) all the nodes are children of, if there is exactly one: its order can be saved
  const parent = useMemo(() => {
    const common = ids.map(id => new Set(edges.filter(e => e.label === 'child' && e.to === id).map(e => e.from))).reduce((a, s) => new Set([...a].filter(x => s.has(x))));

    return ids.length > 1 && common.size === 1 ? [...common][0] : null;
  }, [ids, edges]);
  const parentOrder = parent === null ? [] : edges.filter(e => e.label === 'child' && e.from === parent && ids.includes(e.to)).map(e => e.to);
  const orderChanged = parent !== null && sort.key === 'manual' && !!manual && manual.length > 1 && manual.join() !== parentOrder.join();
  const changed = loaded ? ids.filter(id => loaded[id] && work[id] !== loaded[id].doc) : [];
  const editable = id => !!loaded?.[id]?.mine;


  // the table: the rows, sorted
  const rows = useMemo(() => {
    if(!loaded) return [];

    const value = (id, key) => {
      const n = loaded[id];
      const m = meta(id);
      const doc = work[id] ?? n.doc;

      return key === 'id' ? id : key === 'title' ? (doc.title ?? n.title ?? '').toLowerCase() : key === 'kind' ? n.kind : key === 'mode' ? doc.mode : key === 'photos' ? photoRefs(doc).length : key === 'pages' ? doc.pages.length : key === 'visibility' ? (m.visibility ?? '') : n.mine ? 1 : 0;
    };
    if(sort.key === 'manual' && manual) return manual.filter(id => loaded[id]);

    const list = ids.filter(id => loaded[id]).sort((a, b) => (value(a, sort.key) < value(b, sort.key) ? -1 : value(a, sort.key) > value(b, sort.key) ? 1 : a - b));

    return sort.down ? list.reverse() : list;
  }, [loaded, work, sort, manual]);

  // the tiles: per node in row order, its photos in node order
  const lists = useMemo(() => rows.map(id => ({ id, refs: photoRefs(work[id]) })), [rows, work]);
  const flat = lists.flatMap(({ id, refs }) => refs.map(r => ({ node: id, ...r })));

  // the photos with a note are asked for their place and time once, to tell placeholder notes from written ones
  const noted = flat.filter(p => p.desc).map(p => p.hash);

  useEffect(() => {
    if(view === 'photos' && noted.some(h => !asked.current.has(h))) ask(noted).catch(() => {});
  }, [view, noted.join(',')]);

  const placeholder = p => !!p.desc && isPlaceholder(p.desc, partsOf(infos[p.hash], lang));

  latest.current = { lists, flat, sel, editable, work, state, loaded };

  // a row up or down: from now on the order is the user's own
  const shift = (id, by) => {
    const at = rows.indexOf(id);
    const to = at + by;

    if(at < 0 || to < 0 || to >= rows.length) return;

    const next = rows.slice();

    [next[at], next[to]] = [next[to], next[at]];
    setManual(next);
    setSort({ key: 'manual', down: false });
  };

  // a change: one step of history
  const commit = docs => setState(s => ({ work: { ...s.work, ...docs }, past: [...s.past, s.work], future: [] }));
  const undo = () => setState(s => (s.past.length ? { work: s.past.at(-1), past: s.past.slice(0, -1), future: [s.work, ...s.future] } : s));
  const redo = () => setState(s => (s.future.length ? { work: s.future[0], past: [...s.past, s.work], future: s.future.slice(1) } : s));

  // a description for the selected photos, all alike
  const describe = (list, text) => {
    const docs = {};

    for(const p of list.filter(q => editable(q.node))) docs[p.node] = setDesc(docs[p.node] ?? work[p.node], [p.id], text);

    commit(docs);
  };

  // from where and when: the server names the place and gives the capture time of the photos
  const generate = async () => {
    const list = flat.filter(p => sel.includes(keyOf(p.node, p.id)) && editable(p.node));
    const blank = list.filter(p => !p.desc); // a photo that has a note keeps it (docs/BATCH.md S6a2)
    let all;

    setNote('');

    try {
      all = await ask(blank.map(p => p.hash));
    } catch {
      return setNote(t('batch.desc.failed'));
    }

    const docs = {};
    let done = 0;

    for(const p of blank) {
      const parts = partsOf(all[p.hash], lang);
      const text = fillPattern(prefs.descPattern ?? '{location}, {date}', { ...parts, pseudonym });

      if(!text) continue;

      docs[p.node] = setDesc(docs[p.node] ?? work[p.node], [p.id], text);
      done++;
    }

    if(done) commit(docs);

    setNote([t('batch.desc.done', { n: done }), blank.length > done && t('batch.desc.none', { n: blank.length - done }), list.length > blank.length && t('batch.desc.kept', { n: list.length - blank.length })].filter(Boolean).join('. '));
  };

  // select every tile whose note is only what Generate or the Place, Date and Time buttons wrote
  const findPlaceholders = async () => {
    setNote('');

    let all;

    try {
      all = await ask(noted);
    } catch {
      return setNote(t('batch.desc.failed'));
    }

    const found = flat.filter(p => p.desc && isPlaceholder(p.desc, partsOf(all[p.hash], lang)));

    setSel(found.map(p => keyOf(p.node, p.id)));
    setNote(t('batch.find.done', { n: found.length }));
  };

  // turn a photo a quarter, or the whole selection when the photo is part of it
  const rotate = (node, id) => {
    const here = keyOf(node, id);
    const list = sel.includes(here) ? flat.filter(p => sel.includes(keyOf(p.node, p.id)) && editable(p.node)) : [{ node, id }];
    const docs = {};

    for(const p of list) docs[p.node] = rotatePhotos(docs[p.node] ?? work[p.node], [p.id], 1);

    commit(docs);
  };

  // the photo of the open popover, its place and time, and the buttons that put them into the text
  const popHash = pop && flat.find(p => p.node === pop.node && p.id === pop.id)?.hash;

  useEffect(() => {
    if(popHash && !asked.current.has(popHash)) ask([popHash]).catch(() => {});
  }, [popHash]);

  const pickPart = value => {
    const el = area.current;
    const r = insertAt(pop.text, el?.selectionStart ?? pop.text.length, el?.selectionEnd ?? pop.text.length, value);

    setPop({ ...pop, text: r.text });
    requestAnimationFrame(() => el?.setSelectionRange(r.at, r.at));
  };

  // the annotation popover under a tile
  const annotate = (node, id, text) => {
    const r = document.querySelector(`.wb-batch-tile[data-node="${node}"][data-step="${id}"]`)?.getBoundingClientRect();
    const width = 320;

    if(!r) return;

    const below = r.bottom + 190 < window.innerHeight;

    setPop({ node, id, text, x: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), y: below ? r.bottom + 6 : Math.max(8, r.top - 186) });
  };

  // the title of each node from the profile's title pattern: the range of its photos' dates, their commonest place
  const titles = async () => {
    const mine = rows.filter(editable);
    const hashes = [...new Set(mine.flatMap(id => photoRefs(work[id]).map(p => p.hash)))].slice(0, 2000);
    let info = {};

    setNote('');

    try {
      if(hashes.length) {
        const r = await fetch('/api/photos/describe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hashes }) });

        if(!r.ok) throw new Error(String(r.status));

        info = await r.json();
      }
    } catch {
      return setNote(t('batch.desc.failed'));
    }

    const docs = {};

    for(const id of mine) {
      const own = photoRefs(work[id]).map(p => info[p.hash]).filter(Boolean);
      const days = own.map(x => x.taken).filter(Boolean).sort();
      const count = new Map();

      for(const x of own) if(x.place) count.set(x.place, (count.get(x.place) ?? 0) + 1);

      const location = [...count].sort((a, b) => b[1] - a[1])[0]?.[0];
      const title = fillPattern(prefs.titlePattern ?? '{date} [{location}] {pseudonym}', { date: dateText(days[0], days.at(-1), lang), location, pseudonym });

      if(title) docs[id] = setTitle(work[id], title);
    }

    commit(docs);
    setNote(t('batch.titles.done', { n: Object.keys(docs).filter(id => docs[id] !== work[id]).length }));
  };

  const refuse = refused => {
    const by = {};

    for(const { reason } of refused) by[reason] = (by[reason] ?? 0) + 1;

    setNote(Object.entries(by).map(([reason, n]) => t(`batch.refused.${reason}`, { n })).join('. '));
  };

  // the dragged photos land in front of `to.before` of node `to.node`
  const land = (picks, to) => {
    const { work: now, editable: may } = latest.current;
    const r = placePhotos(now, picks, to, { editable: may });

    if(Object.keys(r.docs).length) commit(r.docs);

    setNote('');

    if(r.refused.length) refuse(r.refused);
  };

  const toggleOff = () => {
    const picked = flat.filter(p => sel.includes(keyOf(p.node, p.id)) && editable(p.node));
    const off = !picked.every(p => p.off);
    const docs = {};

    for(const p of picked) docs[p.node] = setOff(docs[p.node] ?? work[p.node], [p.id], off);

    if(picked.length) commit(docs);
  };

  // --- drag and select: pointer events, so a finger works too (a touch drag starts after a short hold)
  const dropAt = (x, y) => {
    const { lists: ls } = latest.current;
    let el = document.elementFromPoint(x, y);
    let tile = el?.closest?.('[data-step]');

    if(!tile && el?.closest?.('.wb-batch-tiles') && !el.closest('[data-head]')) {
      let best = Infinity;

      for(const cand of document.querySelectorAll('.wb-batch-tiles [data-step]')) {
        const r = cand.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);

        if(d < best) [best, tile] = [d, cand];
      }
    }

    if(tile) {
      const node = Number(tile.dataset.node);
      const refs = ls.find(l => l.id === node).refs;
      const at = refs.findIndex(r => r.id === tile.dataset.step);
      const r = tile.getBoundingClientRect();

      return { node, before: x < r.left + r.width / 2 ? refs[at].id : (refs[at + 1]?.id ?? null) };
    }

    const head = el?.closest?.('[data-head]');

    if(head) return { node: Number(head.dataset.head), before: ls.find(l => l.id === Number(head.dataset.head)).refs[0]?.id ?? null };

    return null;
  };

  const finish = () => {
    clearTimeout(drag.current?.timer);
    clearInterval(drag.current?.scroll);
    drag.current = null;
    setGhost(null);
    setDrop(null);
  };

  const begin = () => {
    const d = drag.current;

    if(!d || d.active) return;

    const { flat: all, sel: chosen } = latest.current;
    const mine = keyOf(d.node, d.id);
    const picks = chosen.includes(mine) ? all.filter(p => chosen.includes(keyOf(p.node, p.id))) : all.filter(p => p.node === d.node && p.id === d.id);

    d.active = true;
    d.picks = picks.map(p => ({ node: p.node, id: p.id }));
    d.hash = picks[0]?.hash;
    d.scroll = setInterval(() => d.speed && window.scrollBy(0, d.speed), 30);
    setGhost({ x: d.x, y: d.y, hash: d.hash, n: d.picks.length });
  };

  const tileDown = (e, node, id) => {
    if(e.button > 0) return;

    drag.current = { node, id, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, active: false, touch: e.pointerType === 'touch', shift: e.shiftKey, speed: 0 };

    if(drag.current.touch) drag.current.timer = setTimeout(begin, 350);
  };

  useEffect(() => {
    const move = e => {
      const d = drag.current;

      if(!d) return;

      d.x = e.clientX;
      d.y = e.clientY;

      const far = Math.hypot(d.x - d.x0, d.y - d.y0) > (d.touch ? 10 : 6);

      if(!d.active) {
        if(!far) return;
        if(d.touch) return finish(); // the finger scrolls

        begin();
      }

      d.speed = d.y < 60 ? -14 : d.y > window.innerHeight - 60 ? 14 : 0;
      setGhost(g => g && { ...g, x: d.x, y: d.y });
      setDrop(dropAt(d.x, d.y));
    };
    const up = e => {
      const d = drag.current;

      if(!d) return;

      const to = d.active ? dropAt(e.clientX, e.clientY) : null;
      const { flat: all, sel: chosen } = latest.current;

      if(d.active) {
        if(to) land(d.picks, to);
      } else if(Math.hypot(e.clientX - d.x0, e.clientY - d.y0) <= 10) {
        const key = keyOf(d.node, d.id);

        if(d.shift && last.current) {
          const [a, b] = [all.findIndex(p => keyOf(p.node, p.id) === last.current), all.findIndex(p => keyOf(p.node, p.id) === key)];

          if(a >= 0 && b >= 0) setSel([...new Set([...chosen, ...all.slice(Math.min(a, b), Math.max(a, b) + 1).map(p => keyOf(p.node, p.id))])]);
        } else setSel(chosen.includes(key) ? chosen.filter(k => k !== key) : [...chosen, key]);

        last.current = key;
      }

      finish();
    };
    const key = e => {
      if(e.key !== 'Escape') return;

      if(drag.current?.active) finish();
      else setSel([]);
    };
    const touch = e => drag.current?.active && e.preventDefault();
    const outside = e => !e.target.closest?.('.wb-batch-pop, .wb-batch-tool') && setPop(null);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('keydown', key);
    window.addEventListener('pointerdown', outside);
    window.addEventListener('touchmove', touch, { passive: false });

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('keydown', key);
      window.removeEventListener('pointerdown', outside);
      window.removeEventListener('touchmove', touch);
      finish();
    };
  }, []);

  // --- save: the nodes that gained photos first, so a failure in between never loses a photo
  const save = async () => {
    setBusy(true);
    setNote('');

    const order = [...changed].sort((a, b) => photoRefs(work[b]).length - photoRefs(loaded[b].doc).length - (photoRefs(work[a]).length - photoRefs(loaded[a].doc).length));
    const next = { ...loaded };
    let done = 0;
    let trouble = '';

    for(const id of order) {
      let r;

      try {
        r = await fetch(`/api/nodes/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ doc: work[id], kind: loaded[id].kind, rev: loaded[id].rev }) });
      } catch {
        r = null;
      }

      if(r?.ok) {
        next[id] = { ...loaded[id], doc: work[id], rev: (await r.json()).rev };
        done++;
      } else {
        trouble = r?.status === 409 ? t('batch.conflict', { id }) : t('batch.saveFailed', { id });
        break;
      }
    }

    // the order of the members of the common parent
    if(!trouble && orderChanged) {
      try {
        const r = await fetch('/api/graph/ops', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops: [{ op: 'order', parent, ids: rows }] }) });

        if(!r.ok) throw new Error(String(r.status));

        done++;
      } catch {
        trouble = t('batch.order.failed');
      }
    }

    setLoaded(next);
    setNote(trouble || t('batch.saved', { n: done }));
    setBusy(false);

    if(done) onSaved?.();
    if(!trouble) setManual(null);
  };

  // the pencil: the node editor in this tab, and its Close comes back here (docs/BATCH.md S2b)
  const edit = (e, id) => {
    e.preventDefault();

    if((changed.length || orderChanged) && !window.confirm(t('batch.discard'))) return;

    globalThis.location.assign(`/${lang}/node/${id}?edit=1&back=${encodeURIComponent(globalThis.location.pathname + globalThis.location.search)}`);
  };
  const revert = () => loaded && (setManual(null), setSort({ key: 'id', down: false }), setState({ work: Object.fromEntries(ids.filter(id => loaded[id]).map(id => [id, loaded[id].doc])), past: [], future: [] }));
  const close = () => ((changed.length || orderChanged) && !window.confirm(t('batch.discard')) ? null : onClose());
  const sortBy = key => setSort(s => (s.key === key && key !== 'manual' ? { key, down: !s.down } : { key, down: false }));
  const picked = flat.filter(p => sel.includes(keyOf(p.node, p.id)));
  const allOff = picked.length > 0 && picked.every(p => p.off);
  const common = picked.length && picked.every(p => p.desc === picked[0].desc) ? picked[0].desc : null; // null: they differ
  const mayEdit = picked.some(p => editable(p.node));

  useEffect(() => setDraft(common ?? ''), [sel.join(','), common]);

  return html`
    <section class="wb-batch" aria-label=${t('batch.title', { n: ids.length })}>
      <div class="wb-batch-bar" role="toolbar">
        <strong class="wb-batch-title">${t('batch.title', { n: ids.length })}</strong>
        <span role="group" aria-label=${t('batch.view.label')}>
          ${['table', 'photos'].map(v => html`<button type="button" class="wb-editor-chip" aria-pressed=${view === v ? 'true' : 'false'} onClick=${() => setView(v)}>${t(`batch.view.${v}`)}</button>`)}
        </span>
        ${view === 'table' && html`<button type="button" class="wb-editor-chip" disabled=${!loaded || !rows.some(editable)} onClick=${titles} title=${t('batch.titles.hint')}>${t('batch.titles')}</button>`}
        ${view === 'photos' && html`<${Fragment}>
          <button type="button" class="wb-editor-chip" disabled=${!picked.some(p => editable(p.node))} onClick=${toggleOff}>${t(allOff ? 'batch.enable' : 'batch.disable')}</button>
          <button type="button" class="wb-editor-chip" disabled=${!sel.length} onClick=${() => setSel([])}>${t('batch.clear')}</button>
        <//>`}
        ${loaded && view === 'photos' && html`<button type="button" class="wb-editor-chip" onClick=${findPlaceholders}>${t('batch.find')}</button>`}
        <button type="button" class="wb-editor-chip" disabled=${!state.past.length} onClick=${undo}>${t('batch.undo')}</button>
        <button type="button" class="wb-editor-chip" disabled=${!state.future.length} onClick=${redo}>${t('batch.redo')}</button>
        <button type="button" class="wb-editor-chip" disabled=${(!changed.length && !orderChanged) || busy} onClick=${save}>${t('batch.save')}${changed.length + (orderChanged ? 1 : 0) ? ` (${changed.length + (orderChanged ? 1 : 0)})` : ''}</button>
        <button type="button" class="wb-editor-chip" disabled=${(!changed.length && !manual) || busy} onClick=${revert}>${t('batch.revert')}</button>
        <button type="button" class="wb-editor-chip" onClick=${close}>${t('batch.close')}</button>
        <span class="wb-batch-note" role="status">${note || (sort.key === 'manual' && !parent ? t('batch.order.local') : view === 'photos' ? (sel.length ? t('batch.selected', { n: sel.length }) : t('batch.hint')) : '')}</span>
      </div>
      ${loaded && view === 'photos' && sel.length > 0 && html`<div class="wb-batch-desc" role="group" aria-label=${t('batch.desc.label')}>
        <input type="text" maxlength=${LIMITS.desc} value=${draft} placeholder=${common === null ? t('batch.desc.differs') : t('batch.desc.label')} aria-label=${t('batch.desc.label')} disabled=${!mayEdit} onInput=${e => setDraft(e.target.value)} />
        <button type="button" class="wb-editor-chip" disabled=${!mayEdit} onClick=${() => describe(picked, draft)}>${t('batch.desc.apply')}</button>
        <button type="button" class="wb-editor-chip" disabled=${!mayEdit} onClick=${generate}>${t('batch.desc.generate')}</button>
        <button type="button" class="wb-editor-chip" disabled=${!mayEdit} onClick=${() => describe(picked, '')}>${t('batch.desc.remove')}</button>
      </div>`}
      ${!loaded && html`<p class="wb-batch-note">${note || t('batch.loading')}</p>`}
      ${loaded && view === 'table' && html`<div class="wb-batch-scroll"><table class="wb-batch-table">
        <thead><tr>${COLUMNS.map(c => html`<th scope="col" aria-sort=${sort.key === c ? (sort.down ? 'descending' : 'ascending') : 'none'}><button type="button" onClick=${() => sortBy(c)}>${t(`batch.col.${c}`)}${sort.key === c ? (sort.down ? ' ▾' : ' ▴') : ''}</button></th>`)}<th></th></tr></thead>
        <tbody>${rows.map(id => {
          const n = loaded[id];
          const doc = work[id];

          return html`<tr key=${id} class=${work[id] !== n.doc ? 'wb-batch-changed' : ''}>
            <td>${id}</td><td>${doc.title || n.title || t('node.untitled')}</td><td>${n.kind}</td><td>${doc.mode}</td><td>${photoRefs(doc).length}</td><td>${doc.pages.length}</td><td>${meta(id).visibility ?? ''}</td><td>${n.mine ? '✓' : ''}</td>
            <td class="wb-batch-open">
              <button type="button" class="wb-editor-chip" disabled=${rows.indexOf(id) === 0} aria-label=${t('batch.up')} title=${t('batch.up')} onClick=${() => shift(id, -1)}>▲</button>
              <button type="button" class="wb-editor-chip" disabled=${rows.indexOf(id) === rows.length - 1} aria-label=${t('batch.down')} title=${t('batch.down')} onClick=${() => shift(id, 1)}>▼</button>
              <a class=${`wb-editor-chip${n.mine ? '' : ' wb-disabled'}`} href=${n.mine ? `/${lang}/node/${id}?edit=1` : null} aria-disabled=${n.mine ? null : 'true'} onClick=${e => edit(e, id)} title=${t('batch.edit')} aria-label=${t('batch.edit')}><${EditIcon} /></a>
              <a class="wb-editor-chip" href=${`/${lang}/node/${id}`} target="_blank" rel="noopener" title=${t('batch.show')} aria-label=${t('batch.show')}><${EyeIcon} /></a>
            </td>
          </tr>`;
        })}</tbody>
      </table></div>`}
      ${loaded && view === 'photos' && html`<div class="wb-batch-tiles">
        ${lists.map(({ id, refs }) => html`<${Fragment} key=${id}>
          <div class=${`wb-batch-head${drop?.node === id && drop.before === null && !refs.length ? ' wb-batch-drop' : ''}${loaded[id].mine ? '' : ' wb-batch-locked'}`} data-head=${id}>${t('batch.head', { title: work[id].title || loaded[id].title || t('node.untitled'), id, n: refs.length })}${!refs.length ? ` – ${t('batch.empty')}` : ''}</div>
          ${refs.map((p, i) => {
            const key = keyOf(id, p.id);
            const cls = ['wb-batch-tile', sel.includes(key) && 'wb-selected', p.off && 'wb-batch-off', p.desc && 'wb-batch-has-desc', placeholder(p) && 'wb-batch-placeholder', !loaded[id].mine && 'wb-batch-locked', drag.current?.active && drag.current.picks.some(q => q.node === id && q.id === p.id) && 'wb-batch-lifted', drop?.node === id && drop.before === p.id && 'wb-batch-before', drop?.node === id && drop.before === null && i === refs.length - 1 && 'wb-batch-after'].filter(Boolean).join(' ');

            return html`<div key=${p.id} class=${cls} data-node=${id} data-step=${p.id}>
              <button type="button" class="wb-batch-hit" aria-pressed=${sel.includes(key) ? 'true' : 'false'} title=${titleOf(p.desc) || null} aria-label=${t('batch.photo', { n: i + 1, id }) + (p.off ? `, ${t('batch.off')}` : '') + (p.desc ? `, ${t('batch.desc.mark')}: ${titleOf(p.desc)}` : '')} onPointerDown=${e => tileDown(e, id, p.id)}>
                <img src=${thumb(p.hash)} alt="" loading="lazy" decoding="async" draggable="false" style=${p.rot ? `transform:rotate(${p.rot}deg)` : null} />
              </button>
              ${loaded[id].mine && html`<span class="wb-batch-tools">
                <button type="button" class="wb-batch-tool" title=${t('batch.rotate')} aria-label=${t('batch.rotate')} onClick=${() => rotate(id, p.id)}>↻</button>
                <button type="button" class="wb-batch-tool" title=${t('batch.annotate')} aria-label=${t('batch.annotate')} onClick=${() => annotate(id, p.id, p.desc)}>✎</button>
              </span>`}
            </div>`;
          })}
        <//>`)}
      </div>`}
      ${pop && html`<div class="wb-batch-pop" role="dialog" aria-label=${t('batch.annotate.hint')} style=${`left:${pop.x}px;top:${pop.y}px`} onKeyDown=${e => e.key === 'Escape' && (e.stopPropagation(), setPop(null))}>
        <textarea rows="5" maxlength=${LIMITS.desc} value=${pop.text} aria-label=${t('batch.annotate.hint')} autofocus ref=${el => ((area.current = el), el && !el.dataset.on && ((el.dataset.on = '1'), el.focus()))} onInput=${e => setPop({ ...pop, text: e.target.value })}></textarea>
        <${PartButtons} parts=${partsOf(infos[popHash], lang)} onPick=${pickPart} />
        <span class="wb-batch-pop-bar">
          <button type="button" class="wb-editor-chip" onClick=${() => (describe([{ node: pop.node, id: pop.id }], pop.text), setPop(null))}>${t('batch.annotate.ok')}</button>
          <button type="button" class="wb-editor-chip" onClick=${() => (describe([{ node: pop.node, id: pop.id }], ''), setPop(null))}>${t('batch.desc.remove')}</button>
          <button type="button" class="wb-editor-chip" onClick=${() => setPop(null)}>${t('batch.annotate.cancel')}</button>
          <span class="wb-batch-pop-count">${pop.text.length}/${LIMITS.desc}</span>
        </span>
      </div>`}
      ${ghost && html`<div class="wb-batch-ghost" style=${`left:${ghost.x}px;top:${ghost.y}px`} aria-hidden="true"><img src=${thumb(ghost.hash)} alt="" />${ghost.n > 1 && html`<span>${ghost.n}</span>`}</div>`}
    </section>
  `;
};
