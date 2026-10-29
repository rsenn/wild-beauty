// Routes for the guided walk (TODO 13.11): a path between two points on the
// floor that stays clear of the walls and on the floor, found on a grid with A*
// and pulled straight. No DOM and no three.js. Plan coordinates, metres, x east
// and y north; `built` is the builder's output (`collision`, `floorHeightAt`).

export const ROUTE = {
  radius: 0.45, // clearance from a wall face, a little more than the body
  cell: 0.4, // grid size, metres
  margin: 4, // search area around the two points, metres
  maxCells: 90000, // coarsen the grid beyond this
  step: 0.25, // sampling of a straight line
};

// distance from (px, py) to the nearest wall face; segments are [x0, z0, x1, z1, half]
// with z = -y as the builder writes them. Infinity without walls.
export function clearance(built, px, py) {
  let best = Infinity;

  for(const [x0, z0, x1, z1, half] of built.collision) {
    const y0 = -z0;
    const dx = x1 - x0;
    const dy = -z1 - y0;
    const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(px - x0 - t * dx, py - y0 - t * dy) - half;

    if(d < best) best = d;
  }

  return best;
}

// may a visitor stand here: on a floor, clear of the walls by r
export const walkable = (built, x, y, r = ROUTE.radius) => built.floorHeightAt(x, y) !== null && clearance(built, x, y) >= r;

// is the straight line a -> b walkable all along
export function visible(built, a, b, r = ROUTE.radius, step = ROUTE.step) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));

  for(let i = 0; i <= n; i++) {
    if(!walkable(built, a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, r)) return false;
  }

  return true;
}

const SQRT2 = Math.SQRT2;

// A binary min-heap of [priority, value] pairs
class Heap {
  items = [];

  push(p, v) {
    const a = this.items;
    let i = a.push([p, v]) - 1;

    while(i > 0) {
      const up = (i - 1) >> 1;

      if(a[up][0] <= a[i][0]) break;

      [a[up], a[i]] = [a[i], a[up]];
      i = up;
    }
  }

  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();

    if(a.length) {
      a[0] = last;

      for(let i = 0; ; ) {
        let m = i;
        const [l, r] = [2 * i + 1, 2 * i + 2];

        if(l < a.length && a[l][0] < a[m][0]) m = l;
        if(r < a.length && a[r][0] < a[m][0]) m = r;
        if(m === i) break;

        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }

    return top[1];
  }

  get size() {
    return this.items.length;
  }
}

// the path from `from` to `to` ([x, y] each): { points: [[x, y], ...], length, ok }.
// A straight line when it is clear; else the A* path over a grid, pulled straight.
// `ok` is false when no way was found (the straight line is returned then).
export function route(built, from, to, o = ROUTE) {
  const straight = ok => ({ points: [from, to], length: Math.hypot(to[0] - from[0], to[1] - from[1]), ok });

  if(visible(built, from, to, o.radius, o.step)) return straight(true);

  const [minX, maxX] = [Math.min(from[0], to[0]) - o.margin, Math.max(from[0], to[0]) + o.margin];
  const [minY, maxY] = [Math.min(from[1], to[1]) - o.margin, Math.max(from[1], to[1]) + o.margin];
  const cell = Math.max(o.cell, Math.sqrt(((maxX - minX) * (maxY - minY)) / o.maxCells));
  const [w, h] = [Math.ceil((maxX - minX) / cell) + 1, Math.ceil((maxY - minY) / cell) + 1];
  const state = new Uint8Array(w * h); // 0 unknown, 1 walkable, 2 blocked
  const at = i => [minX + (i % w) * cell, minY + Math.floor(i / w) * cell];
  const ok = i => {
    if(!state[i]) state[i] = walkable(built, ...at(i), o.radius) ? 1 : 2;

    return state[i] === 1;
  };
  const cellOf = ([x, y]) => Math.min(h - 1, Math.max(0, Math.round((y - minY) / cell))) * w + Math.min(w - 1, Math.max(0, Math.round((x - minX) / cell)));

  // a point that is not on a walkable cell (against a wall) starts from the nearest one
  const near = p => {
    const c = cellOf(p);

    if(ok(c)) return c;

    for(let r = 1; r < 8; r++) {
      for(let dy = -r; dy <= r; dy++) {
        for(let dx = -r; dx <= r; dx++) {
          const [x, y] = [(c % w) + dx, Math.floor(c / w) + dy];

          if(Math.max(Math.abs(dx), Math.abs(dy)) === r && x >= 0 && y >= 0 && x < w && y < h && ok(y * w + x)) return y * w + x;
        }
      }
    }

    return -1;
  };

  const [start, goal] = [near(from), near(to)];

  if(start < 0 || goal < 0) return straight(false);

  const cost = new Float32Array(w * h).fill(Infinity);
  const came = new Int32Array(w * h).fill(-1);
  const heap = new Heap();
  const heuristic = i => {
    const [dx, dy] = [Math.abs((i % w) - (goal % w)), Math.abs(Math.floor(i / w) - Math.floor(goal / w))];

    return (Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy)) * cell;
  };

  cost[start] = 0;
  heap.push(heuristic(start), start);

  while(heap.size) {
    const i = heap.pop();

    if(i === goal) break;

    const [x, y] = [i % w, Math.floor(i / w)];

    for(let dy = -1; dy <= 1; dy++) {
      for(let dx = -1; dx <= 1; dx++) {
        const [nx, ny] = [x + dx, y + dy];

        if((!dx && !dy) || nx < 0 || ny < 0 || nx >= w || ny >= h) continue;

        const n = ny * w + nx;

        if(!ok(n)) continue;
        if(dx && dy && (!ok(y * w + nx) || !ok(ny * w + x))) continue; // no cutting a corner

        const c = cost[i] + (dx && dy ? SQRT2 : 1) * cell;

        if(c < cost[n]) {
          cost[n] = c;
          came[n] = i;
          heap.push(c + heuristic(n), n);
        }
      }
    }
  }

  if(came[goal] < 0 && goal !== start) return straight(false);

  const cells = [];

  for(let i = goal; i >= 0; i = came[i]) cells.push(at(i));

  cells.reverse();

  // the exact ends, then pull the path straight where the way is clear
  const pts = [from, ...cells, to];
  const out = [from];

  for(let i = 0; i < pts.length - 1; ) {
    let j = pts.length - 1;

    while(j > i + 1 && !visible(built, pts[i], pts[j], o.radius - 0.05, o.step)) j--;

    out.push(pts[j]);
    i = j;
  }

  let length = 0;

  for(let i = 1; i < out.length; i++) length += Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]);

  return { points: out, length, ok: true };
}
