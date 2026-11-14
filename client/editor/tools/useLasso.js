import { useEffect, useRef, useState } from '../../vendor/hooks.js';
import { hitTest, outlineOf } from '../hit.js';
import { LASSO_SIZE, costFromEdgeMap, createWire, edgeMapUsable, edgeCost, lassoPath, outlineOfSegments, snap, workSize } from '../lasso.js';
import { clampedImagePoint } from '../wand.js';
import { findStep } from '../model.js';

const WIRE_SNAP = 6;
const WIRE_CLOSE_PX = 12;
const WIRE_SLICE_MS = 6;
const WIRE_MAX_ANCHORS = 250;
const WIRE_LOAD_MS = 15000;
const TAP_PX = 12;

export function useLasso({ latest, setSelected, setAnnounce, tr, wand, wandReset }) {
  const [wireSel, setWireSel] = useState(null);
  const wireCache = useRef({ segments: null, key: '', d: null });
  const wire = useRef(null);

  const wireWork = async href => {
    const img = new Image();

    img.src = href;
    await img.decode();

    const { w, h } = workSize(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');

    canvas.width = w;
    canvas.height = h;

    const g = canvas.getContext('2d', { willReadFrequently: true });

    g.drawImage(img, 0, 0, w, h);

    return { cost: edgeCost(g.getImageData(0, 0, w, h).data, w, h), w, h, source: 'local' };
  };

  const wireEdges = run => {
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 25000);

    fetch(`/api/edges/${run.photo}?size=${LASSO_SIZE}`, { signal: stop.signal })
      .then(res => (res.ok ? res.blob() : Promise.reject(new Error('edges ' + res.status))))
      .then(async blob => {
        const url = URL.createObjectURL(blob);

        try {
          const img = new Image();

          img.src = url;
          await img.decode();

          const { w, h } = run.work;
          const canvas = document.createElement('canvas');

          canvas.width = w;
          canvas.height = h;

          const g = canvas.getContext('2d', { willReadFrequently: true });

          g.drawImage(img, 0, 0, w, h);

          if (wire.current !== run) return;

          const { data } = g.getImageData(0, 0, w, h);

          if (!edgeMapUsable(data, w, h)) return;

          run.work = { ...run.work, cost: costFromEdgeMap(data, w, h), source: 'opencv' };
          setWireSel(s => (s && s.id === run.id ? { ...s, source: 'opencv' } : s));

          if (run.anchors.length && !wand?.current) wireSeed(run);
        } finally {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  };

  const wireShow = (run, live = null, closed = false) => setWireSel({ id: run.id, segments: run.segments, live, anchors: run.stage, size: run.work && { w: run.work.w, h: run.work.h }, source: run.work?.source ?? 'local', closed });

  const wirePixel = (run, units) => {
    const { doc, photos, page: at } = latest.current;
    const corners = outlineOf(doc, run.id, { photos: hash => photos[hash], page: at });
    const uv = corners && clampedImagePoint(corners, units, run.frame);

    return uv && run.work && uv.every(Number.isFinite) ? snap(run.work.cost, run.work.w, run.work.h, [uv[0] * run.work.w - 0.5, uv[1] * run.work.h - 0.5], WIRE_SNAP) : null;
  };

  const wireGuard = fn => {
    try {
      return fn();
    } catch {
      if (wandReset) wandReset();
      else {
        wire.current = null;
        setWireSel(null);
      }
      setAnnounce?.(tr('editor.announce.wandFailed'));
    }
  };

  const wireSeed = run => {
    cancelAnimationFrame(run.grow);
    run.tree = createWire(run.work.cost, run.work.w, run.work.h, run.anchors.at(-1));

    const tick = () => {
      run.grow = 0;

      if (wire.current !== run || run.tree.finished) return;

      try {
        run.tree.step(WIRE_SLICE_MS);
      } catch {
        if (wandReset) wandReset();
        else {
          wire.current = null;
          setWireSel(null);
        }
        return;
      }

      run.grow = requestAnimationFrame(tick);
    };

    run.grow = requestAnimationFrame(tick);
  };

  const wireDown = (e, units) => {
    const { doc, photos, scale, editStep: step, page: at } = latest.current;

    if (wand?.current) return;

    const id = wire.current?.id ?? (step?.op === 'photo' ? step.id : hitTest(doc, units, { photos: hash => photos[hash], tolerance: TAP_PX / scale, page: at, ops: ['photo'] }));
    const photo = id && findStep(doc, id).step;
    const info = photo && photos[photo.photo];

    if (!photo || !info?.href) return;

    setSelected?.(id);

    const run = wire.current ?? { id, photo: photo.photo, frame: { width: info.width, height: info.height, crop: photo.crop }, work: null, anchors: [], stage: [], segments: [], aim: null };

    if (!wire.current) {
      wire.current = run;
      run.loading = Promise.race([wireWork(info.href), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), WIRE_LOAD_MS))]).then(work => ((run.work = work), wireEdges(run), work)).catch(() => {
        if (wire.current === run) {
          if (wandReset) wandReset();
          else {
            wire.current = null;
            setWireSel(null);
          }
        }
        setAnnounce?.(tr('editor.announce.wandFailed'));
      });
    }

    run.loading.then(() => {
      if (wire.current !== run || !run.work) return;

      try {
        const first = run.stage[0];

        if (run.anchors.length >= 3 && Math.hypot(units[0] - first[0], units[1] - first[1]) < WIRE_CLOSE_PX / latest.current.scale) return wireClose();

        if (run.anchors.length >= WIRE_MAX_ANCHORS) return setAnnounce?.(tr('editor.announce.lassoMax'));

        const p = wirePixel(run, units);

        if (!p) return;

        const last = run.anchors.at(-1);

        if (last && last[0] === p[0] && last[1] === p[1]) return;

        if (last) {
          run.tree.finishTo(p, 150);
          run.segments = [...run.segments, run.tree.pathTo(p)];
        }

        run.anchors = [...run.anchors, p];
        run.stage = [...run.stage, units];
        run.aim = null;
        wireSeed(run);
        wireShow(run);
      } catch {
        if (wandReset) wandReset();
        else {
          wire.current = null;
          setWireSel(null);
        }
        setAnnounce?.(tr('editor.announce.wandFailed'));
      }
    });
  };

  const wireMove = units => {
    const run = wire.current;

    if (!run?.work || !run.anchors.length || wand?.current) return;

    run.pointer = units;

    if (run.raf) return;

    run.raf = requestAnimationFrame(() => {
      run.raf = 0;

      if (wire.current !== run || wand?.current) return;

      try {
        const p = wirePixel(run, run.pointer);

        if (!p || (run.aim && run.aim[0] === p[0] && run.aim[1] === p[1])) return;

        run.aim = p;
        wireShow(run, run.tree.pathTo(p));
      } catch {
        if (wandReset) wandReset();
        else {
          wire.current = null;
          setWireSel(null);
        }
      }
    });
  };

  const wireClose = () => {
    const run = wire.current;

    if (!run?.work || run.anchors.length < 3 || wand?.current) return;

    run.tree.finishTo(run.anchors[0], 150);

    const segments = [...run.segments, run.tree.pathTo(run.anchors[0])];
    const polygon = outlineOfSegments(segments, run.work.w, run.work.h);

    if (polygon.length < 3) return setAnnounce?.(tr('editor.announce.wandNothing'));

    run.segments = segments;
    if (wand) {
      wand.current = { id: run.id, photo: run.photo, points: [], taps: [], region: null, polygon: [polygon], pick: 0, candidates: [], applying: null };
    }
    wireShow(run, null, true);
    setAnnounce?.(tr('editor.announce.lasso'));
  };

  const wireUndo = () => {
    const run = wire.current;

    if (!run || wand?.current) return;
    if (run.anchors.length <= 1) return wandReset ? wandReset() : (wire.current = null, setWireSel(null));

    run.anchors = run.anchors.slice(0, -1);
    run.stage = run.stage.slice(0, -1);
    run.segments = run.segments.slice(0, -1);
    run.aim = null;
    wireSeed(run);
    wireShow(run);
  };

  const tool = latest.current?.tool;
  const doc = latest.current?.doc;
  const photos = latest.current?.photos;
  const page = latest.current?.page;

  const wireStep = wireSel && doc && findStep(doc, wireSel.id);
  const wireCorners = tool === 'lasso' && wireStep && doc && photos ? outlineOf(doc, wireSel.id, { photos: hash => photos[hash], page }) : null;
  const wireKey = wireCorners && wireSel?.size ? `${wireCorners.join()}|${wireStep.step.crop}|${wireSel.closed}|${wireSel.size.w}` : '';

  if (wireKey && (wireCache.current.segments !== wireSel.segments || wireCache.current.key !== wireKey)) {
    wireCache.current = { segments: wireSel.segments, key: wireKey, d: lassoPath(wireSel.segments, null, wireSel.size, wireCorners, wireStep.step.crop, wireSel.closed) };
  }

  const wirePath = wireKey ? wireCache.current.d : null;
  const wireLive = wireKey && wireSel?.live ? lassoPath([], wireSel.live, wireSel.size, wireCorners, wireStep.step.crop) : null;
  const wireAnchors = wireSel && !wireSel.closed ? wireSel.anchors.map((at, i) => ({ at, label: i === 0 && wireSel.anchors.length >= 3 ? 3 : 2 })) : [];

  useEffect(() => {
    const currentTool = latest.current?.tool;

    if (currentTool === 'wand' || currentTool === 'lasso') return;

    wire.current = null;
    setWireSel(null);
  }, [latest.current?.tool]);

  return {
    wireSel,
    setWireSel,
    wireCache,
    wire,
    wireDown,
    wireMove,
    wireClose,
    wireUndo,
    wireGuard,
    wirePath,
    wireLive,
    wireCorners,
    wireAnchors
  };
}
