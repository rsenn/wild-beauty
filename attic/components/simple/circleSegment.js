import React from "react";
import { useSpring, animated } from "react-spring";
import { Point } from "../../lib/geom/point.js";
import Util from "../../lib/util.js";

export const CircleSegmentPath = (x, y, r, start, end, close = false) => {
  let c = new Point(x, y);

  let a = Point.fromAngle(start, r).add(c);
  let b = Point.fromAngle(end, r).add(c);
  let delta = Point.diff(b, a);
  let angle = Math.min(end - start, Math.PI * 2);
  let circle = angle == Math.PI * 2;
  let d = !circle ? `M ${c} L ${a}` : `M ${a}`;
  let large = angle >= Math.PI ? 1 : 0;

  if(circle) {
    d += ` a ${r},${r} 0 ${large} 1 0,${r * 2}`;
    d += ` a ${r},${r} 0 ${large} 1 0,${-r * 2}`;
  } else {
    d += ` a ${r},${r} 0 ${large} 1 ${delta}`;
  }
  if(close && !circle) d += "z";

  return d;
};

export const CircleSegment = ({ x, y, r, start, end, relative = false, close = false, fill, ...props }) => {
  let d = CircleSegmentPath(x, y, r, start, end, close);

  return <path d={d} fill={fill} {...props} />;
};

export default CircleSegment;
