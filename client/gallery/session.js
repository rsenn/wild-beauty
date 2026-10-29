// One visit to a gallery (GALLERY.md S6, TODO 13.6): the plan, the build, the
// hung pictures, the live canvas, walking and tapping. Loaded when the visitor
// enters, so nothing of it reaches a page that never does.
//
//   const g = await startGallery(canvas, { items, onOpen, onLock, onLost })
//   g.dispose()
//
// `items` is items.js: [{ id, url, href? }]. A node without a drawn plan gets
// the auto plan (autoplan.js).

import { autoPlan } from './autoplan.js';
import { buildGallery } from './build.js';
import { controls } from './controls.js';
import { hang } from './hang.js';
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

export async function startGallery(canvas, { items, scene, onOpen, onLock, onLost } = {}) {
  if(!webgl()) throw new Error('webgl');

  // `?look=warm|walnut|stone` picks the surfaces of the auto plan (autoplan.js LOOKS)
  const plan = scene ?? autoPlan(items.length, { look: new URLSearchParams(globalThis.location?.search).get('look') });
  const built = buildGallery(plan);
  const { hung } = hang(plan, items);
  const walker = createWalker(built);
  const input = controls(canvas, {
    onLock,
    onTap: (x, y) => {
      const hit = g.pick(x, y);

      if(hit && hit.distance < 12) onOpen?.(hit.child);
    },
  });
  const g = await enterScene(canvas, built, hung, {
    tileUrl: item => item?.url ?? null,
    style: plan.style,
    onFrame(time, dt, camera) {
      walker.step(dt, input.read());
      camera.position.set(walker.x, walker.eye, -walker.y);
      camera.rotation.set(walker.pitch, -walker.yaw, 0, 'YXZ');
    },
  });
  const lost = () => onLost?.();

  canvas.addEventListener('webglcontextlost', lost);

  return {
    hung: hung.length,
    total: items.length,
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      input.dispose();
      g.dispose();
    },
  };
}
