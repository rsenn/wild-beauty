// Auto plan (GALLERY.md S3.6, TODO 13.8): a plan for a node that has none,
// e.g. a plain list. A row of rooms from west to east, each joined to the next
// by a short corridor; just enough rooms for every child to get a picture. A
// drawn plan replaces it. Returns a scene3d document (metres, x east, y north).

import { slots } from './hang.js';

// the surfaces (ambientCG, CC0; static/textures/): `tile` is metres per repeat
const tex = (name, tile, tint) => ({ color: `/static/textures/${name}/color.jpg`, roughness: `/static/textures/${name}/roughness.jpg`, tile, ...(tint && { tint }) });

// named looks: warm = honey pine floors, plaster walls with a warm tint,
// marble on the bridges, whose walls are gravel in every look; walnut = dark herringbone;
// stone = marble and concrete
export const LOOKS = {
  warm: { floor: { texture: tex('woodfloor034', 1.5) }, wall: { texture: tex('plaster001', 2.5, '#fff0dc') }, corridor: { texture: tex('marble017', 2) }, corridorWall: { texture: tex('gravel028', 0.8) } },
  walnut: { floor: { texture: tex('woodfloor014', 1.5) }, wall: { texture: tex('plaster001', 2.5, '#fff0dc') }, corridor: { texture: tex('marble017', 2) }, corridorWall: { texture: tex('gravel028', 0.8) } },
  stone: { floor: { texture: tex('marble017', 2) }, wall: { texture: tex('concrete046', 3) }, corridorWall: { texture: tex('gravel028', 0.8) } },
};

export const AUTO = {
  width: 16, // room, west-east
  depth: 10, // room, south-north
  door: 2, // opening in the wall = corridor width
  corridor: 6, // corridor length
  parapet: 1, // height of the corridor walls: a low bridge under the stars (null: full height)
  maxRooms: 200,
  look: 'warm',
};

// the walls of one room at x0: counter-clockwise, a gap where a door is
function room(x0, doors, o) {
  const [x1, y0, y1] = [x0 + o.width, 0, o.depth];
  const mid = o.depth / 2;
  const g = o.door / 2;
  const pts = [[x1, y0], [x1, mid - g], [x1, mid + g], [x1, y1], [x0, y1], [x0, mid + g], [x0, mid - g], [x0, y0]];
  const gaps = new Set();

  if(doors.east) gaps.add(1);
  if(doors.west) gaps.add(5);

  if(!gaps.size) return [{ points: pts.filter((_, i) => i !== 1 && i !== 2 && i !== 5 && i !== 6), closed: true }];

  const start = ([...gaps][0] + 1) % pts.length;
  const walls = [];
  let cur = [];

  for(let k = 0; k < pts.length; k++) {
    const i = (start + k) % pts.length;

    cur.push(pts[i]);

    if(gaps.has(i)) {
      walls.push({ points: cur, closed: false });
      cur = [];
    }
  }

  return walls;
}

// the walls of a room as the guided tour should walk them: clockwise seen from
// above with the pictures on the right of each open run (the inside), so that
// "next" takes the visitor to the right, the way one reads (hang.js `side`)
export const clockwise = pieces => [...pieces].reverse().map(w => ({ ...w, points: [...w.points].reverse(), ...(!w.closed && { side: 'right' }) }));

// the plan of n rooms in a row
function row(n, o) {
  const walls = [];
  const floors = [];
  const corridors = [];

  for(let i = 0; i < n; i++) {
    const x0 = i * (o.width + o.corridor);

    walls.push(...clockwise(room(x0, { west: i > 0, east: i < n - 1 }, o)));
    floors.push({ type: 'room', points: [[x0, 0], [x0 + o.width, 0], [x0 + o.width, o.depth], [x0, o.depth]] });

    if(i < n - 1) {
      const y = o.depth / 2;

      corridors.push({ points: [[x0 + o.width, y], [x0 + o.width + o.corridor, y]], width: o.door, h0: 0, h1: 0, walls: true, ...(o.parapet ? { wallHeight: o.parapet } : {}) });
    }
  }

  return {
    type: 'scene3d',
    kind: 'gallery',
    plan: { walls, corridors, floors },
    thickness: 0.2,
    style: o.style ?? LOOKS[o.look] ?? LOOKS.warm,
    start: { at: [o.width / 2, o.depth / 2], look: 90 },
  };
}

// the smallest row of rooms with a slot for each of `count` children
export function autoPlan(count, o = AUTO) {
  o = { ...AUTO, ...o };

  let scene = row(1, o);

  for(let n = 1; n <= o.maxRooms; n++) {
    scene = row(n, o);

    if(slots(scene).length >= count) break;
  }

  return scene;
}
