// Auto-hang (GALLERY.md S5.1): the pictures of a gallery's child nodes on the
// wall runs, one side of the wall only. Pure functions over the scene3d
// document; plan coordinates are metres, x east and y north.
//
// Which side: a closed wall polyline hangs on its inside; an open one on the
// side given by `side` ('left' by default, 'right', or 'none') seen in the
// direction of travel. A room made of several open polylines (doors are gaps)
// is therefore drawn counter-clockwise.

import { clean, distances, leftNormal, signedArea } from './line.js';

export const PICTURE = {
  size: 1.3, // side of the square picture
  gap: 1.6, // between two pictures
  centre: 1.5, // height of the picture centre above the wall base
  margin: 0.3, // free wall beyond half a picture at both ends of a run
  corner: 30, // a bend of more than this many degrees ends a run
  lift: 0.01, // distance of the picture from the wall face
};

const DEFAULT_THICKNESS = 0.2;

// a run is a stretch of one wall without a corner: { wall, side, pts }
export function wallRuns(walls = [], corner = PICTURE.corner) {
  const runs = [];

  walls.forEach((w, wall) => {
    const closed = !!w.closed;
    const pts = clean(w.points ?? [], closed);

    if(pts.length < (closed ? 3 : 2)) return;

    const side = closed ? (signedArea(pts) > 0 ? 1 : -1) : w.side === 'right' ? -1 : w.side === 'none' ? 0 : 1;

    if(!side) return;

    const path = closed ? [...pts, pts[0]] : pts;
    let cur = [path[0]];

    for(let i = 1; i < path.length; i++) {
      cur.push(path[i]);

      const next = path[i + 1];

      if(!next) break;

      const a = Math.atan2(path[i][1] - path[i - 1][1], path[i][0] - path[i - 1][0]);
      const b = Math.atan2(next[1] - path[i][1], next[0] - path[i][0]);
      const turn = Math.abs(((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);

      if((turn * 180) / Math.PI > corner) {
        runs.push({ wall, side, pts: cur });
        cur = [path[i]];
      }
    }

    runs.push({ wall, side, pts: cur });
  });

  return runs;
}

// how many pictures fit on a run of length L
export function fit(L, o = PICTURE) {
  const margin = o.size / 2 + o.margin;

  return Math.max(0, Math.floor((L - 2 * margin + o.gap) / (o.size + o.gap)));
}

// every place a picture can hang, in hanging order:
// { wall, x, y, nx, ny, h, size } with (nx, ny) the direction the picture faces
export function slots(scene, o = PICTURE) {
  const walls = scene.plan?.walls ?? [];
  const t = scene.thickness ?? DEFAULT_THICKNESS;
  const out = [];

  for(const run of wallRuns(walls, o.corner)) {
    const d = distances(run.pts);
    const L = d[d.length - 1];
    const n = fit(L, o);
    const start = (L - (n * o.size + (n - 1) * o.gap)) / 2;
    let seg = 0;

    for(let k = 0; k < n; k++) {
      const s = start + o.size / 2 + k * (o.size + o.gap);

      while(seg < run.pts.length - 2 && d[seg + 1] < s) seg++;

      const a = run.pts[seg];
      const b = run.pts[seg + 1];
      const u = (s - d[seg]) / (d[seg + 1] - d[seg]);
      const [nx, ny] = leftNormal(a, b).map(v => v * run.side);
      const off = t / 2 + o.lift;

      out.push({
        wall: run.wall,
        x: a[0] + (b[0] - a[0]) * u + nx * off,
        y: a[1] + (b[1] - a[1]) * u + ny * off,
        nx,
        ny,
        h: (walls[run.wall].base ?? 0) + o.centre,
        size: o.size,
      });
    }
  }

  return out;
}

// the children (ids, in edge order) on the slots: { hung: [{ child, ...slot }],
// total } where total counts the slots and what does not fit stays unhung
export function hang(scene, children, o = PICTURE) {
  const all = slots(scene, o);
  const hung = children.slice(0, all.length).map((child, i) => ({ child, ...all[i] }));

  return { hung, total: all.length };
}
