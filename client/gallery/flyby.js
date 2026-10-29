// The flyby of a gallery node before anyone walks in (GALLERY.md): the camera starts at the
// bird's-eye view, dives into a room, glides along a wall past its pictures, pulls up like a
// stunt flyer, flies a figure eight over the room, and dives into the next wall; then the next,
// and back to the bird's-eye view. Pure maths, no three.js and no DOM: `makeFlyby` -> `pose(time)`.
//
// It flies like a bird rather than like a camera on rails:
//   - the path is one smooth curve through the waypoints (a centripetal spline, so it does not
//     overshoot), and the speed is its own thing: slow along a wall, faster high up, eased in
//     and out, so the time it takes follows from the distance and the speed
//   - the gaze follows the heading and leans toward what is worth seeing (the next picture, the
//     room below), the whole of it smoothed in time, so the head turns without a snap
//   - it banks into a turn as a bird does, by the sideways acceleration, and sways a little
//   - the loop is periodic: the smoothing wraps round, so the end meets the start without a seam
//
// Coordinates are the scene's: x east, y up, z south (z = -y of the plan). A pose is
// { x, y, z, yaw, pitch, roll, fov }: yaw 0 looks north (-z), turning right is
// positive; pitch up is positive; roll positive banks to the left.

import { clearance } from './route.js';

export const FLYBY = {
  walls: 4, // walls flown past in one loop, from the first picture on
  glide: 3.1, // metres a second along a wall
  height: 1.55, // metres over the floor while flying past pictures
  altitude: 24, // metres over the floor: the figure eight and the way between rooms
  reach: [15, 8.5], // half sizes of the figure eight, along the wall and away from it
  cruise: 10, // metres a second high up
  bank: 0.42, // radians of roll in a turn, at most
  fov: 64, // field of view near the pictures, degrees
  safe: 0.7, // metres clear of the walls where the camera is lower than a wall
  wall: 3.4, // metres: the height up to which the walls count
  rate: 60, // poses a second in the table
  gaze: 0.7, // seconds: how far the gaze is smoothed (the standard deviation, over two passes)
  tilt: 1.7, // the steepest the gaze goes, as rise over run (about 60 degrees)
  roll: 0.5, // seconds: and the roll
  window: 9, // metres over which the speed is eased
  sway: 1, // the bird's sway, 0 for none
  settle: 3.5, // seconds at each end of the loop that ease into the still bird's-eye view
};

const TAU = Math.PI * 2;
const G = 9.81;

// the stations of `list` (stations.js) cut into runs along one wall: the same wall,
// the same way it faces, one after the other, in the order along the wall
export function runs(list) {
  const out = [];

  for(const s of list) {
    const key = `${s.wall}:${s.picture.nx.toFixed(2)}:${s.picture.ny.toFixed(2)}`;
    const last = out[out.length - 1];

    if(last && last.key === key) last.stations.push(s);
    else out.push({ key, stations: [s] });
  }

  return out
    .map(r => {
      const { nx, ny } = r.stations[0].picture;
      const t = [ny, -nx]; // along the wall, the wall on the right hand
      const along = s => s.picture.x * t[0] + s.picture.y * t[1];

      return { stations: [...r.stations].sort((a, b) => along(a) - along(b)), normal: [nx, ny], tangent: t };
    })
    .filter(r => r.stations.length >= 2);
}

// the point `d` metres on from `at` (plan) along `dir`, the largest of the tries that is clear of the walls
const clearAlong = (built, at, dir, tries, safe) => {
  for(const d of tries) {
    const [x, y] = [at[0] + dir[0] * d, at[1] + dir[1] * d];

    if(built.floorHeightAt(x, y) !== null && clearance(built, x, y) >= safe) return d;
  }

  return 0;
};

// a waypoint: where the camera is, what it looks at, the speed it passes at (metres a second),
// how much the gaze leans toward the look target rather than the heading, and the field of view
const way = (p, look, speed, focus = 1, fov = FLYBY.fov) => ({ p, look, speed, focus, fov });

// the waypoints of the flight round one run: the dive from above it, the glide past its
// pictures, the pull-up, the figure eight
function legOf(built, run, o) {
  const { stations, normal: n, tangent: t } = run;
  const first = stations[0];
  const last = stations[stations.length - 1];
  const at = s => [s.x, s.eye - 1.6 + o.height, -s.y]; // scene coordinates, the camera's height
  const pic = s => [s.picture.x, s.picture.h, -s.picture.y];
  const scene = (x, y, h) => [x, h, -y];
  const ways = [];
  const back = clearAlong(built, [first.x, first.y], [-t[0], -t[1]], [3, 2, 1.2], o.safe);
  const ahead = clearAlong(built, [last.x, last.y], t, [3, 2, 1.2], o.safe);
  const mid = [(pic(first)[0] + pic(last)[0]) / 2, pic(first)[1], (pic(first)[2] + pic(last)[2]) / 2];

  // the dive: over the room, down into it, in line with the wall
  // (a slanting swoop from out over the room, not a drop: a bird's head is not turned straight down)
  ways.push(way(scene(first.x + n[0] * 9 - t[0] * 7, first.y + n[1] * 9 - t[1] * 7, 19), mid, 9, 0.6, 52));
  ways.push(way(scene(first.x + n[0] * 5.2 - t[0] * 4, first.y + n[1] * 5.2 - t[1] * 4, 9), mid, 7, 0.75, 56));
  ways.push(way(scene(first.x - t[0] * back * 0.6 + n[0] * 1.4, first.y - t[1] * back * 0.6 + n[1] * 1.4, o.height + 2.2), pic(first), 5, 0.9, 60));
  ways.push(way(scene(first.x - t[0] * back * 0.15, first.y - t[1] * back * 0.15, o.height + 0.2), pic(first), o.glide + 0.4, 1, o.fov));

  // the glide: past each picture, looking at the next one ahead
  stations.forEach((s, i) => ways.push(way(at(s), pic(stations[i + 1] ?? s), o.glide, 1, o.fov)));

  // the pull-up: on along the wall, then up and over the room
  const out = [last.x + t[0] * ahead, last.y + t[1] * ahead];

  ways.push(way(scene(out[0], out[1], o.height + 1.4), [last.picture.x + t[0] * 4, last.picture.h + 2, -(last.picture.y + t[1] * 4)], o.glide + 1, 0.55, 62));
  ways.push(way(scene(out[0] + n[0] * 2.4, out[1] + n[1] * 2.4, 6.5), [last.picture.x + n[0] * 8, 1, -(last.picture.y + n[1] * 8)], 6, 0.5, 58));
  ways.push(way(scene(out[0] + n[0] * 5 + t[0] * 2, out[1] + n[1] * 5 + t[1] * 2, 15), scene(last.x + n[0] * 8, last.y + n[1] * 8, 0), 8.5, 0.55, 52));

  // the figure eight over the room, a lemniscate: a pass through the middle between two loops
  const centre = [last.x + n[0] * 7, last.y + n[1] * 7];
  const [a, b] = o.reach;
  const samples = 12;
  const point = u => [centre[0] + t[0] * a * Math.sin(u) + n[0] * b * Math.sin(u) * Math.cos(u), centre[1] + t[1] * a * Math.sin(u) + n[1] * b * Math.sin(u) * Math.cos(u)];

  for(let k = 1; k <= samples; k++) {
    const u = (k / samples) * TAU;
    const [x, y] = point(u);

    const [ax, ay] = point(u + (TAU / samples) * 1.6); // the ground a little ahead, so the head does not whip round as it passes over the middle

    ways.push(way(scene(x, y, o.altitude + 2.5 * Math.sin(u * 2)), scene(ax, ay, 0), o.cruise, 0.4, 46));
  }

  return ways;
}

// the centripetal Catmull-Rom curve between p1 and p2 (p0 and p3 the neighbours) at t in 0..1: it
// follows the waypoints without loops or overshoot where they are unevenly spaced
const spline = (p0, p1, p2, p3, t) => {
  const d = (a, b) => Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) ** 0.5);
  const u1 = d(p0, p1);
  const u2 = u1 + d(p1, p2);
  const u3 = u2 + d(p2, p3);
  const s = u1 + (u2 - u1) * t;
  const mix = (a, b, ta, tb) => a.map((v, k) => (v * (tb - s) + b[k] * (s - ta)) / (tb - ta));
  const [a1, a2, a3] = [mix(p0, p1, 0, u1), mix(p1, p2, u1, u2), mix(p2, p3, u2, u3)];

  return mix(mix(a1, a2, 0, u2), mix(a2, a3, u1, u3), u1, u2);
};

// the table smoothed with a Gaussian of `sigma` samples, the end wrapping round to the start
const wrapAngle = a => ((a + 3 * Math.PI) % TAU) - Math.PI;

function smooth(values, sigma) {
  const n = values.length;
  const half = Math.min(Math.ceil(sigma * 3), n >> 1);
  const kernel = Array.from({ length: half * 2 + 1 }, (_, i) => Math.exp(-0.5 * ((i - half) / sigma) ** 2));
  const total = kernel.reduce((a, b) => a + b, 0);
  const out = new Float64Array(n);

  for(let i = 0; i < n; i++) {
    let sum = 0;

    for(let k = -half; k <= half; k++) sum += values[(i + k + n * 4) % n] * kernel[k + half];

    out[i] = sum / total;
  }

  return out;
}

const column = (a, c) => Float64Array.from({ length: a.length / 3 }, (_, i) => a[i * 3 + c]);

// -> { pose(time), duration, ways, runs } for a built gallery (build.js), its stations
// (stations.js) and the bird's-eye pose (overview.js `overviewPose`, with `fov`), or
// null when no wall has two pictures to fly past
export function makeFlyby(built, list, bird, options = {}) {
  const o = { ...FLYBY, ...options };
  const all = runs(list);

  if(!all.length) return null;

  const chosen = all.slice(0, o.walls);
  const home = way([bird.x, bird.y, bird.z], [bird.x, bird.y + Math.sin(bird.pitch) * bird.distance, bird.z - Math.cos(bird.pitch) * bird.distance], 6, 1, bird.fov ?? 42); // where the bird's-eye view looks: the centre of the plan
  const ways = [home]; // the loop closes from the last waypoint to the first

  // each wall is flown from the end that is nearer to where the flight comes from, so it never doubles back
  for(const run of chosen) {
    const prev = ways[ways.length - 1].p;
    const dist = st => Math.hypot(st.x - prev[0], st.y + prev[2]);
    const reverse = dist(run.stations[run.stations.length - 1]) < dist(run.stations[0]);
    const lead = reverse ? { ...run, stations: [...run.stations].reverse(), tangent: [-run.tangent[0], -run.tangent[1]] } : run;

    ways.push(...legOf(built, lead, o));
  }

  const n = ways.length;

  // 1. the path as a table along its length: position, look target, field of view, speed, focus
  const table = [];

  for(let i = 0; i < n; i++) {
    const [w0, w1, w2, w3] = [ways[(i + n - 1) % n], ways[i], ways[(i + 1) % n], ways[(i + 2) % n]];
    const gap = Math.hypot(w2.p[0] - w1.p[0], w2.p[1] - w1.p[1], w2.p[2] - w1.p[2]);
    const steps = Math.max(2, Math.ceil(gap / 0.25));

    for(let k = 0; k < steps; k++) {
      const t = k / steps;
      const e = t * t * (3 - 2 * t); // eased between the waypoints, for what is not a position

      table.push({
        p: spline(w0.p, w1.p, w2.p, w3.p, t),
        look: spline(w0.look, w1.look, w2.look, w3.look, t),
        fov: w1.fov + (w2.fov - w1.fov) * e,
        speed: w1.speed + (w2.speed - w1.speed) * e,
        focus: w1.focus + (w2.focus - w1.focus) * e,
      });
    }
  }

  // 2. the speed eased over a stretch of the path, then the time each bit of it takes
  const m = table.length;
  const speeds = smooth(Float64Array.from(table, r => r.speed), o.window / 0.25 / 2);
  const times = new Float64Array(m + 1);

  for(let i = 0; i < m; i++) {
    const [a, b] = [table[i].p, table[(i + 1) % m].p];

    times[i + 1] = times[i] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / Math.max(1, speeds[i]);
  }

  const duration = times[m];

  // 3. the table by time, at a steady rate
  const count = Math.max(2, Math.round(duration * o.rate));
  const P = new Float64Array(count * 3);
  const L = new Float64Array(count * 3);
  const F = new Float64Array(count);
  const V = new Float64Array(count);
  const K = new Float64Array(count);
  let at = 0;

  for(let j = 0; j < count; j++) {
    const time = (j / count) * duration;

    while(at < m - 1 && times[at + 1] <= time) at++;

    const u = Math.min(1, Math.max(0, (time - times[at]) / (times[at + 1] - times[at] || 1)));
    const [a, b] = [table[at], table[(at + 1) % m]];

    for(let c = 0; c < 3; c++) {
      P[j * 3 + c] = a.p[c] + (b.p[c] - a.p[c]) * u;
      L[j * 3 + c] = a.look[c] + (b.look[c] - a.look[c]) * u;
    }

    F[j] = a.fov + (b.fov - a.fov) * u;
    K[j] = a.focus + (b.focus - a.focus) * u;
    V[j] = speeds[at] + (speeds[(at + 1) % m] - speeds[at]) * u;
  }

  // 4. the heading from the path, the gaze leaning from it toward the look target, then smoothed
  const [px, py, pz] = [0, 1, 2].map(c => smooth(column(P, c), o.rate * 0.12));
  const hop = Math.max(1, Math.round(o.rate * 0.2));
  const [gx, gy, gz] = [new Float64Array(count), new Float64Array(count), new Float64Array(count)];
  const heading = new Float64Array(count); // the yaw of the path, for the bank

  for(let j = 0; j < count; j++) {
    const [a, b] = [(j - hop + count) % count, (j + hop) % count];
    const h = [px[b] - px[a], py[b] - py[a], pz[b] - pz[a]];
    const hl = Math.hypot(...h) || 1;
    const look = [L[j * 3] - P[j * 3], L[j * 3 + 1] - P[j * 3 + 1], L[j * 3 + 2] - P[j * 3 + 2]];
    const ll = Math.hypot(...look) || 1;

    const flat = Math.hypot(h[0], h[2]) || 1;
    let [x, y, z] = [0, 1, 2].map(c => (h[c] / hl) * (1 - K[j]) + (look[c] / ll) * K[j]);

    // a head is not turned straight down: the way the bird heads keeps the yaw, the pitch is capped
    const size = Math.hypot(x, z) + 0.25;
    const over = Math.hypot(look[0], look[2]);
    const bearing = (Math.min(K[j], 0.6) * Math.min(1, over / 8)) / (over || 1); // right above the target its bearing swings: it counts for nothing there

    x = h[0] / flat + look[0] * bearing;
    z = h[2] / flat + look[2] * bearing;

    const turned = Math.hypot(x, z) || 1;
    const level = size;

    x = (x / turned) * size;
    z = (z / turned) * size;

    if(Math.abs(y) > o.tilt * level) y = Math.sign(y) * o.tilt * level;

    heading[j] = Math.atan2(h[0], -h[2]);
    [gx[j], gy[j], gz[j]] = [x, y, z];
  }

  // smoothed twice, so a glance from the wall to the way ahead is a turn of the head, not a snap
  // (as angles: averaging directions that point opposite ways passes through nothing and snaps the yaw)
  const sigma = (o.gaze * o.rate) / 1.4;
  const yaws = new Float64Array(count);
  const pitches = Float64Array.from(gx, (x, j) => Math.atan2(gy[j], Math.hypot(x, gz[j])));

  for(let j = 0; j < count; j++) {
    const raw = Math.atan2(gx[j], -gz[j]);

    yaws[j] = j ? yaws[j - 1] + wrapAngle(raw - yaws[j - 1]) : raw;
  }

  const drift = wrapAngle(Math.atan2(gx[0], -gz[0]) - yaws[count - 1]) + yaws[count - 1] - yaws[0]; // the turns made over the loop, whole ones
  const straight = Float64Array.from(yaws, (y, j) => y - (drift * j) / count); // periodic now

  const [yawS, pitchS] = [straight, pitches].map(a => smooth(smooth(a, sigma), sigma));
  const sx = Float64Array.from(yawS, (y, j) => Math.cos(pitchS[j]) * Math.sin(y + (drift * j) / count));
  const sy = Float64Array.from(pitchS, Math.sin);
  const sz = Float64Array.from(yawS, (y, j) => -Math.cos(pitchS[j]) * Math.cos(y + (drift * j) / count));

  // 5. the roll from the sideways acceleration (a coordinated turn), smoothed: into the turn
  const lean = new Float64Array(count);

  for(let j = 0; j < count; j++) {
    const [a, b] = [(j - hop + count) % count, (j + hop) % count];
    const turn = ((heading[b] - heading[a] + 3 * Math.PI) % TAU) - Math.PI; // the change of heading, wrapped
    const rate = turn / ((2 * hop) / o.rate); // radians a second, a turn to the right positive

    lean[j] = -Math.atan((V[j] * rate) / G) * 0.8; // roll is positive to the left
  }

  const bank = smooth(lean, o.roll * o.rate);
  const height = py;

  // 6. the poses, read from the table
  const turned = Float64Array.from(yawS, (y, j) => y + (drift * j) / count); // the yaw without wrapping: it can be turned about a whole round by the last seconds
  const still = turned[0] + wrapAngle(bird.yaw - turned[0]); // the bird's-eye yaw as that yaw reaches it, at the start (the end is a drift later)
  function pose(time) {
    const t = ((time % duration) + duration) % duration;
    const f = (t / duration) * count;
    const j = Math.floor(f) % count;
    const [k, u] = [(j + 1) % count, f - Math.floor(f)];
    const lerp = (v, a = j, b = k) => v[a] + (v[b] - v[a]) * u;
    const [vx, vy, vz] = [lerp(sx), lerp(sy), lerp(sz)];
    const swing = o.sway * (0.4 + 0.6 * Math.min(1, Math.max(0, (lerp(height) - 3) / 15))); // a bird sways more up high
    const [slow, quick] = [Math.max(1, Math.round(duration / 5.3)), Math.max(1, Math.round(duration / 3.7))]; // whole turns in a loop, so the sway repeats
    const roll = Math.max(-o.bank, Math.min(o.bank, lerp(bank))) + swing * 0.03 * Math.sin((TAU * slow * t) / duration + 1);

    // the ends of the loop settle into the still bird's-eye view the visitor came from (and the next lap leaves)
    const w = Math.min(1, Math.min(t, duration - t) / o.settle);
    const home = 1 - w * w * (3 - 2 * w);
    const blend = (flown, still) => flown + (still - flown) * home;
    const pitch = Math.atan2(vy, Math.hypot(vx, vz)) + swing * 0.016 * Math.sin((TAU * quick * t) / duration);

    return {
      x: lerp(P, j * 3, k * 3),
      y: lerp(P, j * 3 + 1, k * 3 + 1),
      z: lerp(P, j * 3 + 2, k * 3 + 2),
      yaw: blend(lerp(turned), t < duration / 2 ? still : still + drift),
      pitch: blend(pitch, bird.pitch),
      roll: blend(roll, bird.roll ?? 0),
      fov: blend(Math.min(80, Math.max(30, lerp(F))), bird.fov ?? 42),
    };
  }

  return { pose, duration, ways, runs: chosen.length };
}
