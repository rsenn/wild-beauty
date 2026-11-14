import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { hitTest, outlineOf } from '../hit.js';
import { defaultPick, imagePoint, readLines, regionOf, selectionPath } from '../wand.js';
import { LIMITS, allIds, findStep, unique } from '../model.js';
import { visibleBox } from '../alpha.js';
import { fetchImage } from '../preload.js';
import { track } from '../events.js';
import * as history from '../history.js';
import { clipPolygonsOf } from '../multiclip.js';

const WAND_MAX_COVER = 0.6;
const SERVER_SHARE = 0.8;
const TAP_PX = 12;

const photoInfo = p => ({
  href: `/files/uploads/${p.display}`,
  width: p.width,
  height: p.height,
  padding: p.padding,
  pos: p.pos ?? undefined,
  palette: Array.isArray(p.palette) ? p.palette.filter(c => /^#[0-9a-f]{6}$/i.test(c?.hex)).slice(0, 8) : [],
});

export function useWand({ latest, setSelected, setTool, setPhotos, dispatch, setHist, setCutting, setBusyAt, setAnnounce, tr, wire, setWireSel }) {
  const [wandMode, setWandMode] = useState('add');
  const [wandSel, setWandSel] = useState(null);
  const [wandFill, setWandFill] = useState(true);
  const wand = useRef(null);
  const wandKeys = useRef(null);

  const wandReset = () => {
    wand.current?.controller?.abort();
    wand.current = null;
    if (wire?.current) wire.current = null;
    setWandSel(null);
    if (setWireSel) setWireSel(null);
    setWandMode('add');
    setBusyAt?.(null);
  };

  const wandDown = (e, units) => {
    const { doc, photos, scale, editStep: step, page: at } = latest.current;

    if (wand.current?.applying) return;

    const id = step?.op === 'photo' ? step.id : hitTest(doc, units, { photos: hash => photos[hash], tolerance: TAP_PX / scale, page: at, ops: ['photo'] });
    const photo = id && findStep(doc, id).step;

    if (!photo) return;

    setSelected(id);

    const corners = outlineOf(doc, id, { photos: hash => photos[hash], page: at });
    const info = photos[photo.photo];
    const frame = info && { width: info.width, height: info.height, crop: photo.crop };
    const uv = corners && imagePoint(corners, units, frame);

    if (!uv) return;

    const manual = () => {
      const geo = clipPolygonsOf(latest.current.doc, id);

      return geo && regionOf(corners, geo.polys, frame);
    };

    const run = wand.current?.id === id ? wand.current : { id, photo: photo.photo, clip: photo.clip, points: [], taps: [], region: manual() };
    const label = (e?.altKey || wandMode === 'sub') && run.points.some(p => p[2] === 1) ? 0 : 1;

    run.points = [...run.points, [uv[0], uv[1], label]];
    run.taps = [...run.taps, { at: units, label }];
    wand.current = run;
    setWandSel(s => ({ ...(s?.id === id ? s : { id, candidates: [], output: null, pick: null }), taps: run.taps }));
    wandSelect(run);
  };

  const wandSelect = run => {
    run.controller?.abort();
    run.controller = new AbortController();

    const { signal } = run.controller;
    const at = run.taps.at(-1).at;

    setBusyAt?.({ x: at[0], y: at[1] });

    fetch('/api/segment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photo: run.photo, points: run.points, region: run.region ?? undefined }), signal })
      .then(res =>
        res.ok
          ? readLines(res.body, event => {
              if (event.event === 'progress') return setBusyAt?.(b => b && { ...b, percent: event.percent });
              if (event.event !== 'result') return;
              if (!event.ok) {
                run.candidates = [];
                run.pick = null;
                setWandSel(s => s?.id === run.id && { ...s, candidates: [], pick: null });

                return setAnnounce?.(tr('editor.announce.wandFailed'));
              }

              run.candidates = event.candidates ?? [];
              run.output = event.output;
              run.pick = defaultPick(run.candidates, WAND_MAX_COVER);
              setWandSel({ id: run.id, taps: run.taps, candidates: run.candidates, output: run.output, pick: run.pick });
              setAnnounce?.(tr(run.pick === null ? 'editor.announce.wandNothing' : 'editor.announce.wand'));
            })
          : setAnnounce?.(tr('editor.announce.wandFailed')),
      )
      .catch(() => {})
      .finally(() => run.controller?.signal === signal && setBusyAt?.(null));
  };

  const fitBox = (id, record, info, flags) => {
    const crop = findStep(latest.current.doc, id)?.step.crop;

    return visibleBox(info, crop).then(box => {
      if (box && findStep(latest.current.doc, id)?.step.photo === record.hash) dispatch?.({ type: 'setBox', id, box, ...flags });
    });
  };

  const fadeIn = id =>
    requestAnimationFrame(() => {
      const el = document.querySelector(`.wb-editor-stage [data-step="${id}"]`);

      if (el) (el.classList.remove('wb-fresh'), void el.getBoundingClientRect(), el.classList.add('wb-fresh'), el.addEventListener('animationend', () => el.classList.remove('wb-fresh'), { once: true }));
    });

  const arrived = async (record, final) => {
    const info = photoInfo(record);

    if (!final) return info;

    try {
      return { ...info, href: await fetchImage(info.href, f => setBusyAt?.(b => b && { ...b, percent: 100 * (SERVER_SHARE + (1 - SERVER_SHARE) * f) })) };
    } catch {
      return info;
    }
  };

  const wandApply = action => {
    const run = wand.current;

    if (!run || run.applying || !(run.polygon || Number.isInteger(run.pick)) || findStep(latest.current.doc, run.id)?.step.photo !== run.photo) return;

    const { id } = run;

    run.controller?.abort();
    run.controller = new AbortController();
    run.applying = action;

    const { signal } = run.controller;
    const at = run.taps.at(-1)?.at ?? [500, 500];
    const got = {};
    const need = { cut: ['cut'], take: ['cut', 'rest'], erase: ['rest'] }[action];
    let failed = false;

    setCutting?.(id);
    setBusyAt?.({ x: at[0], y: at[1], label: tr('editor.busy.' + action) });

    fetch('/api/segment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(run.polygon ? { photo: run.photo, polygon: run.polygon, action, fill: wandFill } : { photo: run.photo, points: run.points, region: run.region ?? undefined, pick: run.pick, action, fill: wandFill }), signal })
      .then(res =>
        res.ok
          ? readLines(res.body, event => {
              if (event.event === 'progress') setBusyAt?.(b => b && { ...b, percent: event.percent * SERVER_SHARE });
              else if (event.event === 'derived') got[event.role] = event.record;
              else if (event.event === 'failed' || (event.event === 'result' && !event.ok)) failed = true;
            })
          : (failed = true),
      )
      .then(() => {
        if (signal.aborted) return;
        if (failed || need.some(role => !got[role])) return setAnnounce?.(tr(action === 'cut' ? 'editor.announce.wandFailed' : 'editor.announce.takeOutFailed'));

        return Promise.all(need.map(role => arrived(got[role], true))).then(infos => {
          const { doc: now } = latest.current;
          const info = Object.fromEntries(need.map((role, i) => [role, infos[i]]));

          if (signal.aborted || !findStep(now, id)) return;
          if (action === 'take' && now.pages[findStep(now, id).page].steps.length > LIMITS.steps - 2) return setAnnounce?.(tr('editor.announce.takeOutFailed'));

          setPhotos?.(old => ({ ...old, ...Object.fromEntries(need.map(role => [got[role].hash, info[role]])) }));

          let fitted = null;

          if (action === 'take') {
            const taken = new Set(allIds(now));
            const copy = unique(taken);

            taken.add(copy);
            dispatch?.({ type: 'duplicatePhoto', id, ids: [copy, unique(taken)], offset: 0, wand: true, group: id });
            dispatch?.({ type: 'replacePhoto', id: copy, hash: got.cut.hash, wand: true, group: id });
            dispatch?.({ type: 'replacePhoto', id, hash: got.rest.hash, wand: true, group: id });
            fitted = fitBox(copy, got.cut, info.cut, { wand: true, group: id });
            setSelected?.(copy);
            setTool?.('select');
            fadeIn(copy);
          } else {
            dispatch?.({ type: 'replacePhoto', id, hash: got[need[0]].hash, wand: true, group: id });

            if (action === 'cut') fitted = fitBox(id, got.cut, info.cut, { wand: true, group: id });

            fadeIn(id);

            if (action === 'cut') (setSelected?.(id), setTool?.('select'));
          }

          track('wand-apply', { action, tool: latest.current.tool, taps: run.points.length, fill: wandFill });

          Promise.resolve(fitted)
            .catch(() => {})
            .then(() => setHist?.(history.seal));
          setAnnounce?.(tr({ cut: 'editor.announce.cutOut', take: wandFill ? 'editor.announce.takenOut' : 'editor.announce.takenOutHole', erase: wandFill ? 'editor.announce.erased' : 'editor.announce.erasedHole' }[action]));
          wandReset();
        });
      })
      .catch(() => {})
      .finally(() => {
        if (wand.current === run) run.applying = null;

        setCutting?.(c => (c === id ? null : c));

        if (run.controller?.signal === signal) setBusyAt?.(null);
      });
  };

  const wandUndoTap = () => {
    const run = wand.current;

    if (!run?.points.length || run.applying) return;

    run.points = run.points.slice(0, -1);
    run.taps = run.taps.slice(0, -1);

    if (!run.points.length) return wandReset();

    setWandSel(s => s && { ...s, taps: run.taps });
    wandSelect(run);
  };

  const wandOrder = run => (run?.candidates ?? []).filter(c => c.polygons?.length).sort((a, b) => a.coverage - b.coverage).map(c => c.index);

  const wandStep = delta => {
    const run = wand.current;
    const order = wandOrder(run);
    const next = order[order.indexOf(run?.pick) + delta];

    if (!run || run.applying || next === undefined) return;

    run.pick = next;
    setWandSel(s => s && { ...s, pick: next });
  };

  useEffect(() => {
    const tool = latest.current?.tool;

    if (tool === 'wand' || tool === 'lasso') return;

    wand.current?.controller?.abort();
    wand.current = null;
    setWandSel(null);
  }, [latest.current?.tool]);

  useEffect(() => () => wand.current?.controller?.abort(), []);

  return {
    wandMode,
    setWandMode,
    wandSel,
    setWandSel,
    wandFill,
    setWandFill,
    wand,
    wandKeys,
    wandDown,
    wandSelect,
    wandApply,
    wandUndoTap,
    wandReset,
    wandOrder,
    wandStep
  };
}
