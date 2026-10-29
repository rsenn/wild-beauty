// The guided walk (TODO 13.11): from picture to picture. A tour moves the walker
// (walk.js) along a route to a station (stations.js), turning it to face the
// picture, and holds the zoom. On one wall it glides sideways, facing the wall;
// across a corner, a door or a corridor it walks the route, then turns to the
// picture. No DOM and no three.js: `step(dt)` advances it, the session renders.

import { fitZoom, STATION } from './stations.js';
import { route } from './route.js';
import { EYE } from './scene.js';

export const TOUR = {
  glide: 1.4, // metres per second along a wall
  walk: 2.8, // across rooms
  minTime: 0.8, // seconds a move takes at the least ...
  maxTime: 6, // ... and at the most
  turn: 7, // how fast the heading follows the path, 1/s
  settle: 0.15, // the last part of a walk spent turning to the picture
  zoomRate: 10, // how fast the zoom follows its target, 1/s
};

const TAU = Math.PI * 2;

// the signed angle from a to b in (-PI, PI]
const delta = (a, b) => ((((b - a) % TAU) + 3 * Math.PI) % TAU) - Math.PI;
const ease = t => t * t * (3 - 2 * t);

export function createTour(built, list, walker, o = TOUR) {
  const tour = {
    list,
    index: 0,
    moving: false,
    zoom: 1,
    zoomTarget: 1,
  };
  let move = null; // { points, lengths, length, duration, p, glide, yaw0, to }

  // the walker's heading for a stretch of the path at arc length s
  const tangent = s => {
    const { points, lengths } = move;
    let i = 0;

    while(i < points.length - 2 && lengths[i + 1] < s) i++;

    return Math.atan2(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  };
  const place = s => {
    const { points, lengths } = move;
    let i = 0;

    while(i < points.length - 2 && lengths[i + 1] < s) i++;

    const u = lengths[i + 1] > lengths[i] ? (s - lengths[i]) / (lengths[i + 1] - lengths[i]) : 1;

    return [points[i][0] + (points[i + 1][0] - points[i][0]) * u, points[i][1] + (points[i + 1][1] - points[i][1]) * u];
  };

  // the walker stands at a station, the zoom is left as it is
  const arrive = i => {
    const s = list[i];

    Object.assign(walker, { x: s.x, y: s.y, yaw: s.yaw, pitch: 0, eye: s.eye });
    Object.assign(tour, { index: i, moving: false });
    move = null;
  };

  // put the walker at a station at once, zoomed out
  tour.snap = i => {
    if(!list[i]) return;

    arrive(i);
    tour.zoom = tour.zoomTarget = 1;
  };

  // walk to station i from wherever the walker is
  tour.goto = i => {
    const to = list[i];

    if(!to) return;

    const r = route(built, [walker.x, walker.y], [to.x, to.y]);
    const lengths = [0];

    for(let k = 1; k < r.points.length; k++) lengths.push(lengths[k - 1] + Math.hypot(r.points[k][0] - r.points[k - 1][0], r.points[k][1] - r.points[k - 1][1]));

    // one straight stretch to a station that faces the same way: a sideways glide
    const glide = r.points.length === 2 && Math.abs(delta(walker.yaw, to.yaw)) < 0.35;
    const length = lengths[lengths.length - 1];

    move = { points: r.points, lengths, length, duration: Math.min(o.maxTime, Math.max(o.minTime, length / (glide ? o.glide : o.walk))), p: 0, glide, yaw0: walker.yaw, to };
    Object.assign(tour, { index: i, moving: true, zoomTarget: 1 });
  };

  tour.next = () => tour.goto(Math.min(list.length - 1, tour.index + 1));
  tour.prev = () => tour.goto(Math.max(0, tour.index - 1));
  tour.first = () => tour.goto(0);
  tour.last = () => tour.goto(list.length - 1);

  // jump to the end of the move under way
  tour.finish = () => {
    if(move) arrive(tour.index);
  };

  // stop where the walker is (free walking takes over)
  tour.release = () => {
    move = null;
    tour.moving = false;
  };

  tour.zoomBy = f => (tour.zoomTarget = Math.min(STATION.zoomMax, Math.max(1, tour.zoomTarget * f)));
  tour.zoomReset = () => (tour.zoomTarget = 1);

  // zoom to fit the current picture, or back out; `aspect` is the stage's width / height
  tour.toggleFit = aspect => {
    const fit = fitZoom(list[tour.index], aspect);

    tour.zoomTarget = tour.zoomTarget > 1.05 ? 1 : fit;
  };

  // the camera's vertical field of view, degrees
  tour.fov = () => (2 * Math.atan(Math.tan((STATION.fov * Math.PI) / 360) / tour.zoom) * 180) / Math.PI;

  // advance by dt seconds; moves the walker while a move is under way
  tour.step = dt => {
    tour.zoom += (tour.zoomTarget - tour.zoom) * Math.min(1, o.zoomRate * dt);

    if(Math.abs(tour.zoom - tour.zoomTarget) < 0.002) tour.zoom = tour.zoomTarget;
    if(!move) return;

    move.p = Math.min(1, move.p + dt / move.duration);

    const e = ease(move.p);
    const [x, y] = place(e * move.length);
    const k = Math.min(1, 12 * dt);

    walker.x = x;
    walker.y = y;
    walker.pitch += (0 - walker.pitch) * k;

    const floor = built.floorHeightAt(x, y);

    if(floor !== null) walker.eye += (floor + EYE - walker.eye) * k;

    if(move.glide) {
      walker.yaw = move.yaw0 + delta(move.yaw0, move.to.yaw) * e;
    } else {
      // face the way of the path, then turn to the picture in the last part
      const heading = tangent(e * move.length);
      const u = Math.max(0, (move.p - (1 - o.settle)) / o.settle);
      const target = heading + delta(heading, move.to.yaw) * ease(u);

      walker.yaw += delta(walker.yaw, target) * Math.min(1, o.turn * dt);
    }

    if(move.p >= 1) arrive(tour.index);
  };

  return tour;
}
