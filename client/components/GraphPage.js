import { useEffect, useMemo, useRef, useState } from '../../vendor/hooks.js';
import { html } from '../html.js';
import { useI18n } from '../i18n.js';
import { useBoot } from '../boot.js';
import { REST, bounds, seed, settled, step } from '../graph/layout.js';
import { Layout } from './Layout.js';
import { PlaceSuggestions } from './PlaceSuggestions.js';

const SIZE = 84;
const MAX_FIT = 1.8; // the fitted view never enlarges the nodes beyond this (150 px)
const GAP = 1 / 3; // the gap between two nodes is at least this share of a node
const SPREAD = [0.25, 2.5]; // links of 50 to 500 units against nodes of 84: enlarged up to four times against the links, shrunk to dots on long strings no further
const DASH = { child: null, ref: '10 6', sells: '2 6', at: '1 5' };
const COMPACT = 0.3; // a carried group is gathered to this share of its spread

// the node size the visitor chose is kept in this browser
const KEY = 'wb-graph-spread';

function storedSpread() {
  try {
    const v = Number(localStorage.getItem(KEY));

    return v >= SPREAD[0] && v <= SPREAD[1] ? v : 1;
  } catch {
    return 1;
  }
}

// a place on screen -> the stored place, in layout units (the page's `spread` undone), 1 decimal
const unitOf = (v, spread) => Math.round((v / spread) * 10) / 10;

// POST the edits, take the graph the server answers with
async function send(ops) {
  const r = await fetch('/api/graph/ops', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops }) });

  return r.ok ? r.json() : null;
}

// the face of a group node: its first four members as tiles, and a strip with its title and size
const GroupFace = ({ node, kids, title }) => html`<g clip-path=${`url(#wb-g-${node.id})`}>
  ${[0, 1, 2, 3].map(i => {
    const k = kids[i];
    const x = 3 + (i % 2) * 40;
    const y = 3 + Math.floor(i / 2) * 29;

    return k
      ? k.tile
        ? html`<image key=${i} href=${`/files/photos/${k.tile}.thumb.jpg`} x=${x} y=${y} width="38" height="27" preserveAspectRatio="xMidYMid slice" />`
        : html`<rect key=${i} x=${x} y=${y} width="38" height="27" fill=${k.color ?? '#cfc8b8'} />`
      : html`<rect key=${i} class="wb-graph-slot" x=${x} y=${y} width="38" height="27" />`;
  })}
  <rect class="wb-graph-strip" x="0" y="62" width=${SIZE} height="22" />
  <text class="wb-graph-strip-text" x="6" y="73" dominant-baseline="central">${title.slice(0, 9)} · ${kids.length}</text>
</g>`;

// /:lang/tree: the graph of the nodes (GRAPH.md S2.7, preliminary demo). A node
// is a rounded square with its tile; drag moves and pins it. Several nodes can
// be selected (Shift, or the Select button, then tap or draw a box); dragging
// one carries the group, gathered under the pointer: dropped on a node it links
// them all to it in a fan, dropped on empty space it lines them up in a row.
// The line under the tools says what a drop would do, and Undo takes it back.
export const GraphPage = () => {
  const { t, lang } = useI18n();
  const boot = useBoot();
  const [graph, setGraph] = useState(boot.graph);
  const [, redraw] = useState(0);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [spread, setSpread] = useState(storedSpread); // layout units -> screen: the links' length, shrunk when the nodes are enlarged
  const [selected, setSelected] = useState(null);
  const [multi, setMulti] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [marquee, setMarquee] = useState(null);
  const [carry, setCarry] = useState(null);
  const [note, setNote] = useState(null);
  const [linking, setLinking] = useState(null);
  const [error, setError] = useState(false);
  const [places, setPlaces] = useState(false); // the place suggestions panel (EDITOR.md E140)
  const bodies = useRef(new Map());
  const alpha = useRef(1);
  const svg = useRef(null);
  const touched = useRef(false);
  const frame = useRef(0);
  const ticks = useRef(0);
  const carrying = useRef(false);
  const fanned = useRef(null); // { target, ids }: members to glide out around a new group
  const edges = useMemo(() => graph.edges, [graph]);
  const latest = useRef({});

  latest.current = { edges, view, spread, multi, selecting, graph, linking };

  // a new graph from the server: keep the places of the nodes already on screen
  useEffect(() => {
    const old = bodies.current;

    bodies.current = seed(
      graph.nodes.map(n => (old.has(n.id) ? { ...n, x: old.get(n.id).x, y: old.get(n.id).y } : { ...n, x: n.x * latest.current.spread, y: n.y * latest.current.spread })),
      graph.edges,
      REST * latest.current.spread,
    );

    // a node easing to its place keeps doing so across the new graph
    for(const [id, b] of old) {
      const now = bodies.current.get(id);

      if(now && b.to) Object.assign(now, { to: b.to, hold: b.hold, fixed: b.fixed });
    }

    if(fanned.current) {
      const { target, ids } = fanned.current;
      const mid = bodies.current.get(target);

      fanned.current = null;
      ids.forEach((id, i) => {
        const b = bodies.current.get(id);
        const a = Math.PI / 2 + (ids.length === 1 ? 0 : (i / (ids.length - 1) - 0.5) * Math.min(Math.PI * 1.4, Math.max(0.8, ids.length * 0.6)));

        if(b && mid) b.to = { x: mid.x + Math.cos(a) * REST * latest.current.spread, y: mid.y + Math.sin(a) * REST * latest.current.spread };
      });
    }

    // the first look: settle the layout before the first frame and fit it, so the
    // page opens on the finished picture, not on a graph still unfolding
    if(!old.size && bodies.current.size > 1) {
      const rest = REST * latest.current.spread;
      const rounds = bodies.current.size > 400 ? 60 : 400;

      for(let i = 0, a = 1; i < rounds; i++, a = Math.max(0.05, a * 0.985)) step(bodies.current, edges, a, rest);

      fit(true);
      redraw(n => n + 1);
    }

    alpha.current = old.size ? 1 : 0.05;
    ticks.current = 0;
    wake();

    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [graph]);

  // the simulation runs a frame at a time while something moves: the layout
  // settling, a node easing to a place, a group being carried
  const wake = () => {
    if(frame.current) return;

    const tick = () => {
      frame.current = 0;

      let tweening = false;

      for(const b of bodies.current.values()) {
        if(!b.to) continue;

        b.fixed = true;
        b.x += (b.to.x - b.x) * 0.22;
        b.y += (b.to.y - b.y) * 0.22;

        if(!b.hold && Math.hypot(b.to.x - b.x, b.to.y - b.y) < 0.5) {
          b.x = b.to.x;
          b.y = b.to.y;
          b.to = null;
          b.fixed = false;
        } else tweening = true;
      }

      const fastest = step(bodies.current, latest.current.edges, alpha.current, REST * latest.current.spread);

      alpha.current = Math.max(0.05, alpha.current * 0.985);
      ticks.current++;
      redraw(n => n + 1);

      const busy = !(settled(fastest) && ticks.current > 60) || tweening || carrying.current;

      // until the visitor pans or zooms, the view follows the layout
      if(!touched.current && (ticks.current % 20 === 0 || !busy)) fit(!busy);
      if(busy) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
  };

  // The view may not get too sparse: the nodes cover at least a twenty-fifth of
  // it, at least 32 px wide however many there are, at most 110 px for a few
  const minK = () => {
    const el = svg.current;
    const area = el ? el.clientWidth * el.clientHeight : 0;
    const px = Math.min(110, Math.max(32, Math.sqrt((0.04 * area) / Math.max(1, bodies.current.size))));

    return px / SIZE;
  };

  // Fit the box around the nodes to the view. `final` (the layout has rested)
  // first keeps the nodes apart: the gap between the closest two is at least a
  // third of a node, so the nodes are as big as the layout allows, not smaller
  const fit = (final = false) => {
    const el = svg.current;

    if(!el) return;

    const list = [...bodies.current.values()];

    if(final && list.length > 1) {
      let close = Infinity;

      for(let i = 0; i < list.length; i++) for(let j = i + 1; j < list.length; j++) close = Math.min(close, Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y));

      const sp = latest.current.spread;
      const next = Math.min(SPREAD[1], Math.max(sp, (sp * SIZE * (1 + GAP)) / Math.max(close, 1)));

      if(next !== sp) {
        for(const b of list) {
          b.x *= next / sp;
          b.y *= next / sp;

          if(b.to) b.to = { x: (b.to.x * next) / sp, y: (b.to.y * next) / sp };
        }

        latest.current.spread = next;
        setSpread(next);
      }
    }

    const box = bounds(bodies.current);
    const k = Math.min(el.clientWidth / box.w, el.clientHeight / box.h, MAX_FIT);

    setView({ k, x: (el.clientWidth - box.w * k) / 2 - box.x * k, y: (el.clientHeight - box.h * k) / 2 - box.y * k });
  };

  const world = e => {
    const r = svg.current.getBoundingClientRect();
    const { view: v } = latest.current;

    return { x: (e.clientX - r.left - v.x) / v.k, y: (e.clientY - r.top - v.y) / v.k };
  };

  const local = e => {
    const r = svg.current.getBoundingClientRect();

    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const unit = v => unitOf(v, latest.current.spread);

  const keep = next => {
    if(!next) return setError(true);

    setError(false);
    setGraph(next);
  };

  // --- gestures: one pointer pans, two pinch; on a node it drags; with the
  // group selected it carries; with Shift (or Select) the background draws a box
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  const down = (e, id) => {
    touched.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setNote(null);

    if(pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];

      gesture.current = { pinch: true, d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };

      return;
    }

    const group = latest.current.multi;
    const toggle = e.shiftKey || e.ctrlKey || e.metaKey || selecting;

    if(id && !toggle && group.length > 1 && group.includes(id)) {
      const mine = group.map(i => bodies.current.get(i)).filter(Boolean);
      const mid = { x: mine.reduce((n, b) => n + b.x, 0) / mine.length, y: mine.reduce((n, b) => n + b.y, 0) / mine.length };

      gesture.current = { carry: true, id, ids: group, at: world(e), mid, before: mine.map(b => ({ id: b.id, x: b.x, y: b.y, pinned: b.pinned })), moved: false };
    } else if(id) gesture.current = { node: id, toggle, moved: false, at: world(e) };
    else if(toggle) gesture.current = { box: true, from: local(e), add: e.shiftKey || e.ctrlKey || e.metaKey, moved: false };
    else gesture.current = { pan: true, x: e.clientX - view.x, y: e.clientY - view.y, moved: false, start: { x: e.clientX, y: e.clientY } };
  };

  // the node under the carried group's pointer that is not in the group
  const targetAt = (p, ids) => {
    const reach = SIZE / 2 + 6;
    let best = null;
    let far = reach;

    for(const b of bodies.current.values()) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);

      if(!ids.includes(b.id) && d < far) {
        far = d;
        best = b.id;
      }
    }

    return best;
  };

  const move = e => {
    const g = gesture.current;

    if(!g || !pointers.current.has(e.pointerId)) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if(g.pinch) {
      const [a, b] = [...pointers.current.values()];
      const k = Math.min(4, Math.max(minK(), (g.k * Math.hypot(a.x - b.x, a.y - b.y)) / g.d));

      setView(v => ({ ...v, k }));
    } else if(g.carry) {
      const p = world(e);

      if(!g.moved && Math.hypot(p.x - g.at.x, p.y - g.at.y) * view.k < 5) return;

      // the group gathers under the pointer, the others make room
      g.moved = true;
      carrying.current = true;

      for(const o of g.before) {
        const b = bodies.current.get(o.id);

        b.hold = true;
        b.to = { x: p.x + (o.x - g.mid.x) * COMPACT, y: p.y + (o.y - g.mid.y) * COMPACT };
      }

      alpha.current = 0.5;
      setCarry({ ids: g.ids, over: targetAt(p, g.ids), x: p.x, y: p.y });
      wake();
    } else if(g.node) {
      const p = world(e);
      const body = bodies.current.get(g.node);

      if(!g.moved && Math.hypot(p.x - g.at.x, p.y - g.at.y) * view.k < 5) return;

      g.moved = true;
      body.x = p.x;
      body.y = p.y;
      body.fixed = true;
      alpha.current = 0.4;
      wake();
    } else if(g.box) {
      const p = local(e);

      if(Math.hypot(p.x - g.from.x, p.y - g.from.y) > 4) g.moved = true;

      setMarquee({ x0: g.from.x, y0: g.from.y, x1: p.x, y1: p.y });
    } else if(g.pan) {
      if(Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y) > 4) g.moved = true;

      setView(v => ({ ...v, x: e.clientX - g.x, y: e.clientY - g.y }));
    }
  };

  // the carried nodes, left to right as they lay
  const inOrder = ids => ids.map(i => bodies.current.get(i)).filter(Boolean).sort((a, b) => a.x - b.x || a.y - b.y);

  // dropped on a node: link them all to it, in order, and fan them out around it
  const dropOnNode = async (g, targetId) => {
    const mine = inOrder(g.ids);
    const target = bodies.current.get(targetId);
    const targetNode = nodeOf(targetId);
    const span = Math.min(Math.PI * 1.2, Math.max(0.6, mine.length * 0.5));

    mine.forEach((b, i) => {
      const a = Math.PI / 2 + (mine.length === 1 ? 0 : (i / (mine.length - 1) - 0.5) * span);

      b.hold = false;
      b.to = { x: target.x + Math.cos(a) * REST * latest.current.spread, y: target.y + Math.sin(a) * REST * latest.current.spread };
    });
    alpha.current = 0.6;
    wake();

    const existing = new Set(latest.current.graph.edges.filter(e => e.from === targetId && e.label === 'child').map(e => e.to));
    const ops = mine.map(b => ({ op: 'link', from: targetId, to: b.id, resort: true }));
    const next = await send(ops);

    keep(next);

    if(next) setNote({ text: t('graph.done.link', { n: mine.length, title: targetNode?.title || t('node.untitled') }), undo: mine.filter(b => !existing.has(b.id)).map(b => ({ op: 'unlink', from: targetId, to: b.id })) });
  };

  // dropped on empty space: line them up in a row there, pinned
  const lineUp = async (g, p) => {
    const mine = inOrder(g.ids);
    const gap = SIZE * 1.25;

    mine.forEach((b, i) => {
      b.hold = false;
      b.pinned = true;
      b.to = { x: p.x + (i - (mine.length - 1) / 2) * gap, y: p.y };
    });
    wake();

    const next = await send(mine.map((b, i) => ({ op: 'move', id: b.id, x: unit(p.x + (i - (mine.length - 1) / 2) * gap), y: unit(p.y), pinned: true })));

    keep(next);

    if(next) setNote({ text: t('graph.done.line', { n: mine.length }), undo: g.before.map(o => ({ op: 'move', id: o.id, x: unit(o.x), y: unit(o.y), pinned: o.pinned })), tween: g.before });
  };

  const up = async e => {
    const g = gesture.current;

    pointers.current.delete(e.pointerId);

    if(!g || g.pinch) {
      if(!pointers.current.size) gesture.current = null;

      return;
    }

    gesture.current = null;

    if(g.carry) {
      carrying.current = false;
      setCarry(null);

      if(!g.moved) {
        // a tap on a member of the group: back to that one node
        setMulti([]);
        setSelected({ node: g.id });

        return;
      }

      const over = targetAt(world(e), g.ids);

      if(over) await dropOnNode(g, over);
      else await lineUp(g, world(e));
    } else if(g.node) {
      const body = bodies.current.get(g.node);

      body.fixed = false;

      if(g.moved) {
        body.pinned = true;
        keep(await send([{ op: 'move', id: g.node, x: unit(body.x), y: unit(body.y), pinned: true }]));
      } else tapNode(g.node, g.toggle);
    } else if(g.box) {
      setMarquee(null);

      if(g.moved) {
        const p = local(e);
        const [x0, x1] = [Math.min(g.from.x, p.x), Math.max(g.from.x, p.x)];
        const [y0, y1] = [Math.min(g.from.y, p.y), Math.max(g.from.y, p.y)];
        const inside = [...bodies.current.values()].filter(b => {
          const sx = b.x * view.k + view.x;
          const sy = b.y * view.k + view.y;

          return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1;
        }).map(b => b.id);

        setMulti(old => (g.add ? [...new Set([...old, ...inside])] : inside));
        setSelected(null);
      } else if(!g.add) setMulti([]);
    } else if(!g.moved) {
      setSelected(null);
      setLinking(null);
      setMulti([]);
    }
  };

  const tapNode = async (id, toggle) => {
    if(toggle) {
      setMulti(old => (old.includes(id) ? old.filter(i => i !== id) : [...new Set([...old, ...(selected?.node ? [selected.node] : []), id])]));
      setSelected(null);

      return;
    }

    setMulti([]);

    if(linking && linking !== id) {
      const from = linking;

      setLinking(null);
      setSelected({ node: id });
      keep(await send([{ op: 'link', from, to: id }]));
    } else if(linking === id) setLinking(null);
    else setSelected({ node: id });
  };

  // the selected nodes become the children of a new group node (a list) between them
  const makeGroup = async () => {
    const mine = inOrder(multi);

    if(mine.length < 2) return;

    const x = unit(mine.reduce((n, b) => n + b.x, 0) / mine.length);
    const y = unit(mine.reduce((n, b) => n + b.y, 0) / mine.length);
    const known = new Set(graph.nodes.map(n => n.id));
    const next = await send([{ op: 'group', title: t('graph.group.title'), ids: mine.map(b => b.id), x, y }]);
    const made = next?.nodes.find(n => !known.has(n.id));

    if(made) {
      touched.current = false;
      fanned.current = { target: made.id, ids: mine.map(b => b.id) };
      setMulti([]);
      setSelected({ node: made.id });
      setNote({ text: t('graph.done.group', { n: mine.length }), undo: [{ op: 'ungroup', id: made.id }] });
    }

    keep(next);
  };

  const ungroup = async () => {
    const id = picked.id;

    setSelected(null);
    keep(await send([{ op: 'ungroup', id }]));
  };

  const undo = async () => {
    const n = note;

    setNote(null);

    // the nodes glide back where they were
    for(const o of n.tween ?? []) {
      const b = bodies.current.get(o.id);

      if(b) {
        b.pinned = o.pinned;
        b.to = { x: o.x, y: o.y };
      }
    }

    wake();
    keep(await send(n.undo));
  };

  const wheel = e => {
    e.preventDefault();

    // over a node the wheel enlarges the nodes: the view zooms in and the layout
    // shrinks by the same factor, so the links keep their length on screen
    if(e.target.closest?.('.wb-graph-node')) {
      const { view: v, spread: sp } = latest.current;
      const k = Math.min(4, Math.max(minK(), v.k * Math.exp(-e.deltaY * 0.0015)));
      let f = k / v.k;
      const next = Math.min(SPREAD[1], Math.max(SPREAD[0], sp / f));

      f = sp / next; // what the clamp left of the step

      if(f === 1) return;

      for(const b of bodies.current.values()) {
        b.x /= f;
        b.y /= f;

        if(b.to) b.to = { x: b.to.x / f, y: b.to.y / f };
      }

      latest.current.spread = next; // the next wheel event may come before the next render
      latest.current.view = { ...v, k: v.k * f };
      setSpread(next);

      try {
        localStorage.setItem(KEY, String(next));
      } catch {}
      setView({ ...v, k: v.k * f });

      return;
    }

    touched.current = true;

    const r = svg.current.getBoundingClientRect();
    const f = Math.exp(-e.deltaY * 0.0015);

    setView(v => {
      const k = Math.min(4, Math.max(minK(), v.k * f));
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;

      return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
    });
  };

  useEffect(() => {
    const el = svg.current;

    el?.addEventListener('wheel', wheel, { passive: false });

    return () => el?.removeEventListener('wheel', wheel);
  });

  const nodeOf = id => graph.nodes.find(n => n.id === id);
  const picked = selected?.node && nodeOf(selected.node);
  const label = n => n.title || t('node.untitled');
  const hint = error
    ? t('graph.error')
    : carry
    ? carry.over
      ? t('graph.carry.link', { n: carry.ids.length, title: label(nodeOf(carry.over) ?? {}) })
      : t('graph.carry.line', { n: carry.ids.length })
    : note
    ? note.text
    : linking
    ? t('graph.linkTo')
    : multi.length > 1
    ? t('graph.multi', { n: multi.length })
    : picked
    ? label(picked)
    : graph.nodes.length
    ? t('graph.hint')
    : t('graph.empty');
  const target = carry?.over && bodies.current.get(carry.over);

  return html`
    <${Layout} bleed active="tree" hrefFor=${code => `/${code}/tree`}>
      <div class="wb-graph-bar" role="toolbar" aria-label=${t('graph.tools')}>
        <button type="button" class="wb-editor-chip" aria-pressed=${selecting ? 'true' : 'false'} onClick=${() => setSelecting(!selecting)}>${t('graph.select')}</button>
        <button type="button" class="wb-editor-chip" disabled=${multi.length < 2} onClick=${makeGroup}>${t('graph.group')}</button>
        <button type="button" class="wb-editor-chip" disabled=${picked?.kind !== 'list'} onClick=${ungroup}>${t('graph.ungroup')}</button>
        <button type="button" class="wb-editor-chip" aria-pressed=${linking ? 'true' : 'false'} disabled=${!picked && !linking} onClick=${() => setLinking(linking ? null : selected.node)}>${t('graph.link')}</button>
        <button type="button" class="wb-editor-chip" disabled=${!selected?.edge} onClick=${async () => keep(await send([{ op: 'unlink', ...selected.edge }]))}>${t('graph.unlink')}</button>
        <button type="button" class="wb-editor-chip" disabled=${!picked || !picked.pinned} onClick=${async () => keep(await send([{ op: 'pin', id: picked.id, pinned: false }]))}>${t('graph.unpin')}</button>
        <a class=${`wb-editor-chip wb-graph-open${picked ? '' : ' wb-disabled'}`} href=${picked ? `/${lang}/node/${picked.id}` : null} aria-disabled=${picked ? null : 'true'}>${t('graph.open')}</a>
        <button type="button" class="wb-editor-chip" disabled=${!note?.undo} onClick=${undo}>${t('graph.undo')}</button>
        <button type="button" class="wb-editor-chip" aria-pressed=${places ? 'true' : 'false'} onClick=${() => setPlaces(!places)}>${t('graph.places')}</button>
        <button type="button" class="wb-editor-chip" onClick=${() => ((touched.current = false), fit(true))}>${t('graph.fit')}</button>
        <span class=${`wb-graph-hint${carry ? ' wb-graph-hint-live' : ''}`} role="status">${hint}</span>
      </div>
      ${places && html`<${PlaceSuggestions} t=${t} onGraph=${keep} onClose=${() => setPlaces(false)} />`}
      <svg ref=${svg} class="wb-graph" role="group" aria-label=${t('graph.label')} onPointerDown=${e => down(e, null)} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>
        <defs><filter id="wb-g-shadow" x="-10%" y="-10%" width="125%" height="125%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-opacity="0.55" /></filter></defs>
        <g transform=${`translate(${view.x} ${view.y}) scale(${view.k})`}>
          ${edges.map(e => {
            const a = bodies.current.get(e.from);
            const b = bodies.current.get(e.to);

            if(!a || !b) return null;

            const on = selected?.edge && selected.edge.from === e.from && selected.edge.to === e.to && selected.edge.label === e.label;

            return html`<g key=${`${e.from}-${e.to}-${e.label}`} class=${on ? 'wb-graph-edge wb-selected' : 'wb-graph-edge'} onPointerDown=${ev => ev.stopPropagation()} onClick=${() => setSelected({ edge: { from: e.from, to: e.to, label: e.label } })}>
              <line x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y} stroke-dasharray=${DASH[e.label]} />
              <line class="wb-graph-hit" x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y} />
            </g>`;
          })}
          ${target &&
          carry.ids.map(id => {
            const b = bodies.current.get(id);

            return b && html`<line key=${'p' + id} class="wb-graph-preview" x1=${target.x} y1=${target.y} x2=${b.x} y2=${b.y} />`;
          })}
          ${graph.nodes.map(n => {
            const b = bodies.current.get(n.id);

            if(!b) return null;

            const cls = `wb-graph-node${selected?.node === n.id ? ' wb-selected' : ''}${multi.includes(n.id) ? ' wb-selected wb-multi' : ''}${linking === n.id ? ' wb-linking' : ''}${carry?.over === n.id ? ' wb-target' : ''}${n.pinned ? ' wb-pinned' : ''}`;

            return html`<g key=${n.id} data-id=${n.id} class=${cls} transform=${`translate(${b.x} ${b.y}) translate(${-SIZE / 2} ${-SIZE / 2})`} onPointerDown=${e => (e.stopPropagation(), down(e, n.id))} role="button" tabindex="0" aria-label=${label(n)} aria-pressed=${multi.includes(n.id) ? 'true' : null}>
              <clipPath id=${`wb-g-${n.id}`}><rect width=${SIZE} height=${SIZE} rx="14" /></clipPath>
              <rect class="wb-graph-ground" width=${SIZE} height=${SIZE} rx="14" fill=${n.color ?? '#e8e2d4'} filter="url(#wb-g-shadow)" />
              ${n.kind === 'list'
                ? html`<${GroupFace} node=${n} kids=${edges.filter(e => e.from === n.id && e.label === 'child').map(e => nodeOf(e.to)).filter(Boolean)} title=${label(n)} />`
                : n.tile
                ? html`<image href=${`/files/photos/${n.tile}.thumb.jpg`} width=${SIZE} height=${SIZE} preserveAspectRatio="xMidYMid slice" clip-path=${`url(#wb-g-${n.id})`} />`
                : html`<text class="wb-graph-title" x=${SIZE / 2} y=${SIZE / 2} text-anchor="middle" dominant-baseline="central">${label(n).slice(0, 12)}</text>`}
              <rect class="wb-graph-frame" width=${SIZE} height=${SIZE} rx="14" />
            </g>`;
          })}
          ${carry &&
          html`<g class="wb-graph-bubble" transform=${`translate(${carry.x + 24 / view.k} ${carry.y - 24 / view.k}) scale(${1 / view.k})`} pointer-events="none">
            <rect x="-4" y="-18" width=${Math.max(40, hint.length * 7 + 12)} height="26" rx="13" />
            <text x="6" y="0">${hint}</text>
            <circle class="wb-graph-count" cx="-6" cy="-24" r="12" /><text class="wb-graph-count-text" x="-6" y="-24" text-anchor="middle" dominant-baseline="central">${carry.ids.length}</text>
          </g>`}
        </g>
        ${marquee && html`<rect class="wb-graph-marquee" x=${Math.min(marquee.x0, marquee.x1)} y=${Math.min(marquee.y0, marquee.y1)} width=${Math.abs(marquee.x1 - marquee.x0)} height=${Math.abs(marquee.y1 - marquee.y0)} />`}
      </svg>
    <//>
  `;
};
