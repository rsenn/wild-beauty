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
// the auto plan (autoplan.js). `overview` starts above the gallery (overview.js);
// command('walk') flies down to the first picture and command('overview') back up.
// `doc` is the node's own document: its drawn walls
// make the plan (fromdoc.js).

import { autoPlan } from './autoplan.js';
import { OVERVIEW, overviewPose, planBounds } from './overview.js';
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

// how fast the lens closes and opens, per second
const LENS = { close: 5, open: 2 };

export async function startGallery(canvas, { items, scene, doc, overview = false, onOpen, onLock, onLost, onState, onLens } = {}) {
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

  // the bird's-eye view: `blend` is 0 above the plan and 1 at the visitor's eye,
  // moving to `target` over FLY seconds
  const FLY = 1.8;
  let blend = overview ? 0 : 1;
  let target = blend;
  const bounds = planBounds(built.collision);

  if(overview) mode = 'overview';

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
    if(mode === 'overview' && name !== 'walk') return;

    if(name === 'walk') {
      if(mode !== 'overview') return;

      target = 1;
      mode = list.length ? 'guide' : 'free';
      input = attach();
      emit();

      return;
    }

    if(name === 'overview') {
      target = 0;
      mode = 'overview';
      tour.release();
      input?.dispose();
      input = null;
      if(document.pointerLockElement) document.exitPointerLock?.();
      emit();

      return;
    }

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

  const attach = () => controls(canvas, {
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
  let input = overview ? null : attach();

  // the lens (vignette and a soft edge blur, drawn by the page over the canvas) closes while the camera
  // glides from picture to picture or flies down into the plan, and opens on arrival; it is
  // left out for a visitor who asks for less motion
  const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let lens = 0;
  let sent = -1;
  let focus = null;
  let blended = null; // reused by the flight: { a, b, ea, eb }
  const g = await enterScene(canvas, built, hung, {
    tileUrl: item => item?.url ?? null,
    style: plan.style,
    focus: () => focus, // the pictures near the visitor load, though the camera is far above
    onFrame(time, dt, camera, THREE) {
      const inp = input?.read() ?? { moving: false };

      if(mode === 'guide' && inp.moving) free();

      tour.step(dt); // the zoom, and the walk to a station
      if(mode === 'free') walker.step(dt, inp);

      focus ??= new THREE.Vector3();
      focus.set(walker.x, walker.eye, -walker.y);
      blend = target > blend ? Math.min(target, blend + dt / FLY) : Math.max(target, blend - dt / FLY);

      camera.position.copy(focus);
      camera.rotation.set(walker.pitch, -walker.yaw, 0, 'YXZ');

      let fov = tour.fov();

      if(blend < 1) {
        // between the bird's-eye view and the visitor's eye: position, turn and field of view eased
        const k = blend * blend * (3 - 2 * blend);
        const view = overviewPose(bounds, camera.aspect);

        blended ??= { a: new THREE.Quaternion(), b: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), p: new THREE.Vector3() };
        blended.a.copy(camera.quaternion);
        blended.b.setFromEuler(blended.e.set(view.pitch, view.yaw, 0));
        camera.quaternion.slerpQuaternions(blended.b, blended.a, k);
        camera.position.lerpVectors(blended.p.set(view.x, view.y, view.z), focus, k);
        fov = OVERVIEW.fov + (fov - OVERVIEW.fov) * k;
      }

      if(Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      if(onLens && !calm) {
        const closing = tour.moving || (blend > 0 && blend < 1);

        lens = closing ? Math.min(1, lens + dt * LENS.close) : Math.max(0, lens - dt * LENS.open);

        if(Math.abs(lens - sent) > 0.004) onLens((sent = lens));
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
      input?.dispose();
      g.dispose();
    },
  };
}
