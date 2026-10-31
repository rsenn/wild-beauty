// What the editor tells the owner of a gallery node (EDITOR.md E154, GALLERY.md):
// which rooms and corridors it has found in the drawing, what is wrong with them,
// how many pictures they have room for, where the pictures come from and which
// textures are set. Pure: the gallery context pane (components/GalleryPane.js) draws it.
import { planFromDoc } from '../gallery/fromdoc.js';
import { slots } from '../gallery/hang.js';
import { LIMITS } from './model.js';
import { DEFAULT_LOOK, textureSlots } from './scene.js';
import { photoSteps } from './render.js';
import { wallProblem } from './walls.js';

// -> {
//   rooms, corridors      walls found: closed shapes flagged `wall`, open ones
//   loose                 shapes without the wall flag and strokes: drawn, but not part of the plan
//   problems              [{ id, code, ... }] walls with a corner sharper than 45 degrees
//   plan                  the scene3d the gallery is built from (fromdoc.js), null without a room
//   capacity              pictures that fit on the walls
//   hang                  { from: 'children' | 'photos' | 'none', count } what the gallery hangs
//   children              the linked children { id, title, tile }; `shown` of them have a picture
//   photos                { total, pictures, textures, limit } of the node itself
//   textures              { look, slots: { wall, floor, corridor }, candidates: [hash] }
// }
export function galleryReport(doc, { children = [] } = {}) {
  const steps = doc.pages.flatMap(page => page.steps);
  const shapes = steps.filter(step => step.op === 'shape');
  const walls = shapes.filter(step => step.wall);
  const problems = walls.flatMap(step => {
    const problem = wallProblem(step);

    return problem && problem.code !== 'not_a_path' ? [{ id: step.id, ...problem }] : [];
  });

  const roles = new Map();

  for(const step of steps) {
    if(step.op !== 'photo') continue;

    const texture = step.role === 'texture';

    roles.set(step.photo, roles.has(step.photo) ? roles.get(step.photo) && texture : texture);
  }

  const textures = [...roles].filter(([, texture]) => texture).map(([hash]) => hash);
  const plan = planFromDoc(doc);
  const shown = children.filter(child => child.tile);
  const own = photoSteps(doc).length;
  const from = shown.length ? 'children' : own ? 'photos' : 'none';

  return {
    rooms: walls.filter(step => step.closed).length,
    corridors: walls.filter(step => !step.closed).length,
    loose: shapes.length - walls.length + steps.filter(step => step.op === 'stroke').length,
    problems,
    plan,
    capacity: plan ? slots(plan).length : 0,
    hang: { from, count: from === 'children' ? shown.length : own },
    children: { list: children, shown: shown.length },
    photos: { total: roles.size, pictures: roles.size - textures.length, textures: textures.length, limit: LIMITS.photos },
    textures: { look: doc.scene?.look ?? DEFAULT_LOOK, slots: textureSlots(doc.scene), candidates: textures },
  };
}

// the plan as shapes for a small top-down picture, y up in the plan and down on the screen:
// { box: [x, y, w, h], floors: [points], corridors: [{ points, width }], walls: [points], start: [x, y] | null }
export function planPicture(plan) {
  if(!plan) return null;

  const flip = ([x, y]) => [x, -y];
  const floors = plan.plan.floors.map(floor => floor.points.map(flip));
  const corridors = plan.plan.corridors.map(c => ({ points: c.points.map(flip), width: c.width }));
  const walls = plan.plan.walls.map(wall => wall.points.map(flip));
  const all = [...floors.flat(), ...corridors.flatMap(c => c.points), ...walls.flat()];

  if(!all.length) return null;

  const [x0, x1] = [Math.min(...all.map(p => p[0])), Math.max(...all.map(p => p[0]))];
  const [y0, y1] = [Math.min(...all.map(p => p[1])), Math.max(...all.map(p => p[1]))];
  const pad = Math.max(x1 - x0, y1 - y0, 4) * 0.06 + 1;

  return { box: [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad], floors, corridors, walls, start: plan.start?.at ? flip(plan.start.at) : null };
}
