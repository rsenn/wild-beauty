// Force layout of the graph view (docs/GRAPH.md S2.7): nodes repel each other,
// links pull their ends to a rest length, a weak pull keeps everything near the
// middle. Pure: no DOM, no timers; the page calls `step` once per frame until
// `settled`. A node with a stored place starts there, a new one next to a
// neighbour (or on a ring), a pinned one never moves.
export const REST = 200;

// a deterministic pseudo random number in 0..1 for a node id
const noise = (id, k) => {
  const x = Math.sin(id * 12.9898 + k * 78.233) * 43758.5453;

  return x - Math.floor(x);
};

// nodes: [{ id, x, y, pinned }], edges: [{ from, to }] -> Map id -> { id, x, y, vx, vy, pinned, fixed }
export function seed(nodes, edges, rest = REST) {
  const bodies = new Map();

  for(const n of nodes) {
    const placed = Number.isFinite(n.x) && Number.isFinite(n.y);

    bodies.set(n.id, { id: n.id, x: placed ? n.x : NaN, y: placed ? n.y : NaN, vx: 0, vy: 0, pinned: !!n.pinned, fixed: false });
  }

  let ring = 0;

  for(const b of bodies.values()) {
    if(Number.isFinite(b.x)) continue;

    const friend = edges.map(e => (e.from === b.id ? e.to : e.to === b.id ? e.from : null)).map(id => bodies.get(id)).find(f => f && Number.isFinite(f.x));

    if(friend) {
      b.x = friend.x + (noise(b.id, 1) - 0.5) * rest;
      b.y = friend.y + (noise(b.id, 2) - 0.5) * rest;
    } else {
      const angle = ring++ * 2.399963 + noise(b.id, 3);
      const radius = rest * 0.6 * Math.sqrt(ring);

      b.x = Math.cos(angle) * radius;
      b.y = Math.sin(angle) * radius;
    }
  }

  return bodies;
}

// one tick; `alpha` (1 -> 0) scales the forces, `rest` is the length a link
// likes (the page shrinks it when the nodes are enlarged) -> the largest speed,
// to test settled
export function step(bodies, edges, alpha = 1, rest = REST) {
  const unit = rest / REST;
  const list = [...bodies.values()];

  for(let i = 0; i < list.length; i++) {
    const a = list[i];

    for(let j = i + 1; j < list.length; j++) {
      const b = list[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;

      if(d2 < 1) {
        dx = noise(a.id, b.id) - 0.5;
        dy = noise(b.id, a.id) - 0.5;
        d2 = 1;
      }

      if(d2 > 640000 * unit * unit) continue;

      const d = Math.sqrt(d2);
      const push = (rest * rest * 0.9) / d2;

      a.vx += (dx / d) * push * alpha;
      a.vy += (dy / d) * push * alpha;
      b.vx -= (dx / d) * push * alpha;
      b.vy -= (dy / d) * push * alpha;
    }
  }

  for(const e of edges) {
    const a = bodies.get(e.from);
    const b = bodies.get(e.to);

    if(!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const pull = ((d - rest) / d) * 0.08 * alpha;

    a.vx += dx * pull;
    a.vy += dy * pull;
    b.vx -= dx * pull;
    b.vy -= dy * pull;
  }

  let fastest = 0;

  for(const b of list) {
    b.vx = (b.vx - b.x * 0.004 * alpha) * 0.6;
    b.vy = (b.vy - b.y * 0.004 * alpha) * 0.6;

    if(b.pinned || b.fixed) {
      b.vx = b.vy = 0;
      continue;
    }

    const speed = Math.hypot(b.vx, b.vy);
    const cap = speed > 40 * unit ? (40 * unit) / speed : 1;

    b.x += b.vx * cap;
    b.y += b.vy * cap;
    fastest = Math.max(fastest, speed);
  }

  return fastest;
}

export const settled = fastest => fastest < 0.05;

// the box around the nodes, with `pad` around: { x, y, w, h }
export function bounds(bodies, pad = 80) {
  const list = [...bodies.values()];

  if(!list.length) return { x: -300, y: -300, w: 600, h: 600 };

  const xs = list.map(b => b.x);
  const ys = list.map(b => b.y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;

  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}

// The nodes far from the rest (docs/GRAPH.md S2.9): with at least 5 nodes, those whose distance from
// the per-axis median centre is above 1.8 times the 80th percentile distance and above 1.5 rest
// lengths. -> Set of ids
export function outliers(bodies, rest = REST) {
  const list = [...bodies.values()];

  if(list.length < 5) return new Set();

  const median = values => [...values].sort((a, b) => a - b)[list.length >> 1];
  const cx = median(list.map(b => b.x));
  const cy = median(list.map(b => b.y));
  const dist = b => Math.hypot(b.x - cx, b.y - cy);
  const sorted = list.map(dist).sort((a, b) => a - b);
  const limit = Math.max(1.8 * sorted[Math.min(list.length - 1, Math.floor(list.length * 0.8))], 1.5 * rest);

  return new Set(list.filter(b => dist(b) > limit).map(b => b.id));
}

// the box around the nodes that are not outliers, with `pad` around
export function coreBounds(bodies, pad = 80, rest = REST) {
  const far = outliers(bodies, rest);

  return bounds(far.size ? new Map([...bodies].filter(([id]) => !far.has(id))) : bodies, pad);
}

// where a node outside the view is parked: the point on the view's edge (inset by `margin`) on the line
// from the view's centre to the node, and the angle of that line. `sx, sy` is the node on screen.
// -> { x, y, angle }
export function parkAt(sx, sy, width, height, margin = 24) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = sx - cx;
  const dy = sy - cy;
  const angle = Math.atan2(dy, dx);
  const k = Math.min(dx ? (cx - margin) / Math.abs(dx) : Infinity, dy ? (cy - margin) / Math.abs(dy) : Infinity, 1);

  return { x: cx + dx * k, y: cy + dy * k, angle };
}
