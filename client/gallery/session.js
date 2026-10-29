// One visit to a gallery (GALLERY.md S6, TODO 13.6): the plan, the build, the
// hung pictures, the live canvas, walking and tapping. Loaded when the visitor
// enters, so nothing of it reaches a page that never does.
//
//   const g = await startGallery(canvas, { items, onOpen, onLock, onLost, onState })
//   g.command('next'); g.dispose()
//
// It starts guided: the visitor stands in front of the first picture and steps
// from picture to picture (tour.js); walking keys hand over to free walking
// (walk.js), the Guide button or a tap on a picture takes them back. `onState`
// hears { mode, index, total, moving, zoomed, title, canOpen } when it changes.
//
// `items` is items.js: [{ id, url, href? }]. A node without a drawn plan gets
// the auto plan (autoplan.js). `doc` is the node's own document: its drawn walls
// make the plan (fromdoc.js).

import { autoPlan } from './autoplan.js';
import { buildGallery } from './build.js';
import { planFromDoc } from './fromdoc.js';
import { controls } from './controls.js';
import { hang } from './hang.js';
import { nearest, stations } from './stations.js';
import { createTour } from './tour.js';
import { enterScene } from './scene.js';
import { createWalker } from './walk.js';

// can this browser make a WebGL context at all
export function webgl() {
  try {
    const c = document.createElement('canvas');

    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// how many pictures keep their sharp image once zoomed in on
const SHARP = 4;

export async function startGallery(canvas, { items, scene, doc, onOpen, onLock, onLost, onState } = {}) {
  if(!webgl()) throw new Error('webgl');

  // `?look=warm|walnut|stone` picks the surfaces of the auto plan (autoplan.js LOOKS)
  const plan = scene ?? planFromDoc(doc) ?? autoPlan(items.length, { look: new URLSearchParams(globalThis.location?.search).get('look') });
  const built = buildGallery(plan);
  const { hung } = hang(plan, items);
  const walker = createWalker(built);
  const list = stations(built, hung);
  const bySlot = new Map(list.map(s => [s.slot, s]));
  const tour = createTour(built, list, walker);
  let mode = list.length ? 'guide' : 'free';
  let shown = '';

  if(mode === 'guide') tour.snap(0);

  const state = () => {
    const here = list[tour.index];

    return { mode, index: tour.index, total: list.length, moving: tour.moving, zoomed: tour.zoomTarget > 1.05, title: here?.child?.title ?? '', canOpen: !!here?.child?.href };
  };
  const emit = () => {
    const now = state();
    const key = JSON.stringify(now);

    if(key !== shown) {
      shown = key;
      onState?.(now);
    }
  };
  const aspect = () => (canvas.clientWidth || 1) / (canvas.clientHeight || 1);

  // zoomed in on a picture: swap its tile for the sharper image; a few stay, the
  // oldest give their memory back
  const sharp = [];
  const sharpen = () => {
    if(tour.zoomTarget <= 1.05) return;

    const slot = mode === 'guide' ? list[tour.index]?.slot : g.pick(0, 0)?.picture.userData.index;

    if(slot === undefined || sharp.includes(slot)) return;

    sharp.push(slot);
    g.world.upgrade(slot);

    while(sharp.length > SHARP) g.world.downgrade(sharp.shift());
  };

  const guide = i => {
    if(!list.length) return;

    mode = 'guide';
    if(document.pointerLockElement) document.exitPointerLock?.();

    tour.goto(i ?? nearest(list, walker.x, walker.y));
    emit();
  };
  const free = () => {
    mode = 'free';
    tour.release();
    emit();
  };
  const command = name => {
    const steps = { next: tour.next, prev: tour.prev, first: tour.first, last: tour.last };

    if(steps[name]) return mode === 'guide' && steps[name]();
    if(name === 'guide') return mode === 'guide' ? free() : guide();
    if(name === 'zoomIn') return tour.zoomBy(1.3);
    if(name === 'zoomOut') return tour.zoomBy(1 / 1.3);
    if(name === 'zoomReset') return tour.zoomReset();
    if(name === 'zoomFit') return tour.toggleFit(aspect());
    if(name === 'open') {
      const child = list[tour.index]?.child;

      if(child?.href) onOpen?.(child);
    }
  };

  const input = controls(canvas, {
    mode: () => mode,
    onLock,
    onCommand: command,
    onZoom: f => tour.zoomBy(f),
    // a tap on a picture goes to it; on the one in front of you it zooms to fill the stage
    onTap: (x, y) => {
      const hit = g.pick(x, y);
      const at = hit && hit.distance < 14 ? bySlot.get(hit.picture.userData.index) : null;

      if(!at) return tour.zoomTarget > 1.05 && tour.zoomReset();

      if(mode === 'guide' && at.index === tour.index) tour.toggleFit(aspect());
      else guide(at.index);
    },
  });
  const g = await enterScene(canvas, built, hung, {
    tileUrl: item => item?.url ?? null,
    style: plan.style,
    onFrame(time, dt, camera) {
      const inp = input.read();

      if(mode === 'guide' && inp.moving) free();

      tour.step(dt); // the zoom, and the walk to a station
      if(mode === 'free') walker.step(dt, inp);

      camera.position.set(walker.x, walker.eye, -walker.y);
      camera.rotation.set(walker.pitch, -walker.yaw, 0, 'YXZ');

      const fov = tour.fov();

      if(Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      sharpen();
      emit();
    },
  });
  const lost = () => onLost?.();

  canvas.addEventListener('webglcontextlost', lost);
  emit();

  return {
    hung: hung.length,
    total: items.length,
    command,
    state,
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      input.dispose();
      g.dispose();
    },
  };
}
