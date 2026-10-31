// Align and distribute a multiple selection (EDITOR.md E147). Boxes are the axis-aligned
// extent [x0, y0, x1, y1] of each step's outline; the result is the shift [dx, dy] of
// each step. Pure.

const AXIS = { left: [0, 'min'], centre: [0, 'mid'], right: [0, 'max'], top: [1, 'min'], middle: [1, 'mid'], bottom: [1, 'max'] };

// the box of a list of outlines (four corners each)
export const extentOf = outlines => {
  const pts = outlines.flat();

  return [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
};

// items: [{ id, box }]; kind: left | centre | right | top | middle | bottom (to the extent of all),
// or distribute-h | distribute-v (equal gaps between the boxes, the outer two stay)
// -> [{ id, dx, dy }]
export function alignShifts(items, kind) {
  if(items.length < 2) return [];

  if(kind === 'distribute-h' || kind === 'distribute-v') {
    const axis = kind === 'distribute-h' ? 0 : 1;
    const sorted = items.slice().sort((a, b) => a.box[axis] + a.box[axis + 2] - (b.box[axis] + b.box[axis + 2]));

    if(sorted.length < 3) return [];

    const total = sorted.reduce((s, i) => s + (i.box[axis + 2] - i.box[axis]), 0);
    const span = sorted.at(-1).box[axis + 2] - sorted[0].box[axis];
    const gap = (span - total) / (sorted.length - 1);
    let at = sorted[0].box[axis];

    return sorted.map(i => {
      const shift = at - i.box[axis];

      at += i.box[axis + 2] - i.box[axis] + gap;

      return { id: i.id, dx: axis === 0 ? shift : 0, dy: axis === 1 ? shift : 0 };
    });
  }

  const [axis, how] = AXIS[kind] ?? [];

  if(axis === undefined) return [];

  const lo = Math.min(...items.map(i => i.box[axis]));
  const hi = Math.max(...items.map(i => i.box[axis + 2]));
  const target = how === 'min' ? lo : how === 'max' ? hi : (lo + hi) / 2;

  return items.map(i => {
    const from = how === 'min' ? i.box[axis] : how === 'max' ? i.box[axis + 2] : (i.box[axis] + i.box[axis + 2]) / 2;

    return { id: i.id, dx: axis === 0 ? target - from : 0, dy: axis === 1 ? target - from : 0 };
  });
}
