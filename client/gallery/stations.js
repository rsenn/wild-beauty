// Stations for the guided walk (TODO 13.11): one place in front of each hung
// picture, from which it is seen whole, and the zoom that makes it fill the
// stage. Pure functions over hang.js's `hung` list and the build. Plan
// coordinates; yaw 0 faces north, turning right is positive (walk.js).

import { clearance } from './route.js';
import { EYE } from './scene.js';

export const STATION = {
  distance: 2.5, // from the picture, metres
  fill: 0.92, // how much of the stage's short side the picture fills when zoomed to fit
  fov: 70, // the camera's vertical field of view, degrees
  radius: 0.45, // clear of the walls by this much
  zoomMax: 7,
};

// the station of a hung picture, or null when there is no room in front of it:
// the usual distance, else nearer until the spot is on a floor and clear of walls
function stationOf(built, p, o) {
  for(const f of [1, 0.8, 0.6]) {
    const d = o.distance * f;
    const [x, y] = [p.x + p.nx * d, p.y + p.ny * d];
    const floor = built.floorHeightAt(x, y);

    if(floor !== null && clearance(built, x, y) >= o.radius) return { x, y, distance: d, floor };
  }

  return null;
}

// hang()'s `hung` -> stations in the same order:
// { index, slot, child, wall, picture: { x, y, h, size, nx, ny }, x, y, yaw, eye, distance }
// where `slot` is the picture's index in `hung`. A picture with no place to stand
// in front of it gets none (the list is shorter, so index and slot can differ).
export function stations(built, hung, o = STATION) {
  o = { ...STATION, ...o };

  return hung.flatMap((p, slot) => {
    const s = stationOf(built, p, o);

    return s
      ? [{ slot, child: p.child, wall: p.wall, picture: { x: p.x, y: p.y, h: p.h, size: p.size, nx: p.nx, ny: p.ny }, x: s.x, y: s.y, yaw: Math.atan2(-p.nx, -p.ny), eye: s.floor + EYE, distance: s.distance }]
      : [];
  }).map((s, index) => ({ index, ...s }));
}

// the station nearest to a position (plan), or -1
export function nearest(list, x, y) {
  let best = -1;
  let d = Infinity;

  for(const s of list) {
    const e = Math.hypot(s.x - x, s.y - y);

    if(e < d) [best, d] = [s.index, e];
  }

  return best;
}

const rad = deg => (deg * Math.PI) / 180;

// the zoom factor (1 = the normal view) at which the picture fills the stage,
// for a stage of the given width / height
export function fitZoom(s, aspect = 1, o = STATION) {
  const half = s.picture.size / 2 / (s.distance * o.fill); // tan of the half angle the picture needs on its short side
  const needed = half / Math.min(1, aspect); // in the vertical field of view

  return Math.max(1, Math.min(o.zoomMax, Math.tan(rad(o.fov) / 2) / needed));
}
