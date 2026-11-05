// The bird's-eye view of a gallery (the node page shows it before anyone walks
// in): a camera above the plan looking down at an angle, with a real perspective
// (not orthographic), far enough back to show every wall. Pure maths, no three.js.
// Coordinates are the builder's: x east, z south, y up (build.js `collision`).

export const OVERVIEW = {
  fov: 42, // degrees, vertical
  elevation: 58, // degrees above the horizon the camera looks down from
  margin: 1.18, // free space round the plan
  reach: 30, // half the longest stretch of plan shown at once, metres: about three rooms
};

// the box round the walls: { cx, cz, rx, rz } (centre and half sizes in metres), or
// null for a plan without walls. `collision` is build.js's [x1, z1, x2, z2, half].
export function planBounds(collision = []) {
  if(!collision.length) return null;

  const xs = collision.flatMap(([x1, , x2]) => [x1, x2]);
  const zs = collision.flatMap(([, z1, , z2]) => [z1, z2]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];

  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, rx: (x1 - x0) / 2, rz: (z1 - z0) / 2 };
}

// The camera that shows the box in a view `aspect` (width / height) wide: at
// `elevation` above the ground, south of the centre, looking at it. Tilted down by
// `elevation`, the ground is foreshortened in depth by sin(elevation), so the depth
// asks for rz / sin() and the width for rx; the camera is as far as the larger
// asks, in the narrower of the two fields of view.
// -> { x, y, z, pitch (radians, negative looks down), yaw: 0, distance }
export function overviewPose(bounds, aspect, { fov = OVERVIEW.fov, elevation = OVERVIEW.elevation, margin = OVERVIEW.margin, reach = OVERVIEW.reach } = {}) {
  const whole = bounds ?? { cx: 0, cz: 0, rx: 5, rz: 5 };

  // a plan longer than `reach` is not shown whole (a row of thirteen rooms would be a speck seen
  // from a long way off): the window sits on its west end, where the first picture hangs
  const rx = Math.min(whole.rx, reach);
  const rz = Math.min(whole.rz, reach);
  const b = { cx: whole.cx - whole.rx + rx, cz: whole.cz - whole.rz + rz, rx, rz };
  const up = Math.tan((fov * Math.PI) / 360); // half the field of view, vertical
  const side = up * Math.max(0.2, aspect); // and horizontal
  const el = (elevation * Math.PI) / 180;
  const distance = Math.max((b.rx * margin) / side, (b.rz * margin) / Math.sin(el) / up, 8);

  return { x: b.cx, y: Math.sin(el) * distance, z: b.cz + Math.cos(el) * distance, pitch: -el, yaw: 0, distance };
}
