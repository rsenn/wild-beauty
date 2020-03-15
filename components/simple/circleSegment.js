import React from "react";
import { Point } from "../../lib/dom/point.js";

export const CircleSegment = ({ x, y, r, start, end, relative = false, close = false, fill = "none", ...props }) => {
  let c = new Point(x, y); //relative ? 0 : x,relative ? 0 : y);
  let a = Point.fromAngle(start, r).add(c);
  let b = Point.fromAngle(end, r).add(c);
  let d = Point.diff(b, a);
  const init = fill != "none" ? `M ${c.x} ${c.y} L` : "M";

  return <path d={init + ` ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}${close ? "Z" : ""}`} fill={fill} {...props} />;
};

export default CircleSegment;
