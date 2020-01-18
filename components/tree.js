import React from "react";
import Util from "../utils/util.js";
import { HSLA, RGBA, Point, PointList, Rect, Line } from "../utils/dom.js";

function* Table2DIterator(table) {
  for(var y = 0; y < table.length; y++) for (var x = 0; x < table[y].length; x++) yield table[y][x];
}
function* FieldIterator(itemIterator, field) {
  for(var it of itemIterator) yield it[field];
}

function splitLines(str, max_linelen = Number.MAX_SAFE_INTEGER) {
  const tokens = str.split(/\s/g);
  let lines = [];
  let line = tokens.shift();
  for(; tokens.length; ) {
    if((line.length ? line.length + 1 : 0) + tokens[0].length > max_linelen) {
      lines.push(line);
      line = "";
    }
    if(line != "") line += " ";
    line += tokens.shift();
  }
  if(line != "") lines.push(line);
  return lines;
}

function direction(from, to, f = 1) {
  var pt = Point.diff(to, from);

  if(Math.abs(pt.x) > Math.abs(pt.y)) return { x: pt.x >= 0 ? f : -f, y: 0 };
  return { x: 0, y: pt.y >= 0 ? f : -f };
}

function directionVertical(from, to, f = 1) {
  var pt = Point.diff(to, from);

  return { x: 0, y: pt.y >= 0 ? f : -f };
}

function reorder(arg, by = item => (item.children ? item.children.length : 0)) {
  var arr = [...arg];
  var ret = [];
  arr.sort((a, b) => by(b) - by(a));

  for(var i = 0; i < arr.length; i++) {
    if(i % 2 == 1) ret.push(arr[i]);
    else ret.unshift(arr[i]);
  }

  //console.log(arr);
  return ret;
}

function numChildren(item) {
  return item.children ? item.children.reduce((acc, child) => acc + 1 + numChildren(child), 0) : 0;
}

function DistributeX(arr, dist, set = (item, pos) => (item.pos = new Point(pos, 0))) {
  var range = (arr.length - 1) * dist;

  var start = -range / 2;

  for(let i = 0; i < arr.length; i++) set(arr[i], start + i * dist);
  return arr;
}

function DistributeCircular(arr, dist, set = (i, x, y) => (item.pos = new Point(x, y)), centerAngle) {
  var range = (arr.length - 1) * Math.PI;

  var start = -range / 2 + centerAngle;

  for(let i = 0; i < arr.length; i++) {
    var angle = start + (i * Math.PI) / (arr.length - 1);
    set(i, Math.sin(angle) * dist, Math.cos(angle) * dist);
  }
  return arr;
}

export const SVGText = ({ x, y, yinc = 12, lines }) => {
  const ystart = (-(lines.length - 1) / 2) * yinc;
  return lines.map((line, i) => (
    <text
      textAnchor="middle"
      alignmentBaseline="middle"
      fontFamily={"Fixed"}
      fontSize={13}
      y={y + ystart + i * yinc}
      x={x}
    >
      {line}
    </text>
  ));
};

if (global.window) {
  Object.assign(window, { direction, directionVertical, splitLines, Table2DIterator, FieldIterator });
}

export const Tree = ({ tree, minWidth, minHeight, treeVerify = node => true, active = -1, ...props }) => {
  var width = 200;
  var height = 200;

  var radius = 30;
  var xdist = radius * 3;
  var xdist_mul = 0.6;
  var ydist = radius * 3 + 20;
  var n_items = 0;
  var max_length = 0;

  var elements = [];
  var table = [];
  const W = 1.33;

  let dir = direction;

  var max_chars = Math.round(radius / 3.03);
  Util.traverseTree(tree, (item, depth, parent) => {
    if(table[depth] === undefined) table.push([]);
    if(depth > 0) item.parentIndex = [depth - 1, table[depth - 1].length - 1];

    if(item !== null) {
      item.index = [depth, table[depth].length];
      //  item.parent = parent;
      n_items++;
      //  if(item.children) item.children = reorder(item.children, item => numChildren(item));
      if(treeVerify(item)) table[depth].push({ ...item, depth, parent });
      if(max_length < item.title.length) max_length = item.title.length;
    }
  });

  for(var y = 0; y < table.length; y++) for (var x = 0; x < table[y].length; x++) table[y][x].index = [y, x];

  let ystart = 0;
  let i = 0;
  //xdist = Math.PI;

  function getParent(item) {
    if(item.parentIndex || (item.parent && item.parent.index)) {
      const [y, x] = item.parentIndex || item.parent.index;
      return table[y][x];
    }
    return { pos: new Point(0, 0) };
  }
  function getParentPos(item) {
    var p = getParent(item);
    return p && p.pos ? p.pos : new Point(0, 0);
  }

  function getVector(item) {
    var p = getParent(item);
    return p && p.pos && item.pos ? Point.diff(p.pos, item.pos) : new Point(0, 0);
  }
  function getItem(index) {
    const [y, x] = index;
    return table[y][x];
  }

  for(var y = 0; y < table.length; y++) {
    const row = table[y];
    let xstart = (-xdist * (row.length - 1)) / 2;

    //if(y < 3)
    DistributeX(row, y == 1 ? xdist * 2 : xdist, (item, pos) => (item.pos = new Point(pos, ystart + y)));

    for(var x = 0; x < row.length; x++) {
      /*      let pt = new Point({
        x: xstart + x * xdist,
        y: ystart + y
      });
      table[y][x].pos = pt; //new Point(Math.sin(pt.x)*xdist, - Math.cos(pt.y));*/
      table[y][x].color = new HSLA(
        (i++ * 360) / n_items,
        table[y][x].id == active ? 100 : 85,
        table[y][x].id == active ? 60 : 70,
        1
      );
      table[y][x].title = splitLines(table[y][x].title, max_chars);
    }
    // xdist *= xdist_mul;
    if(y >= 1) ystart += ydist;
  }
  for(let y = 2; y <= 2; y++) {
    if(table[y] == undefined) continue;
    for(let x = 0; x < table[y].length; x++) {
      const item = table[y][x];
      const { pos } = item;
      if(item.children) {
        var vec = getVector(item);
        var ang = vec.toAngle();
        //console.log("item.children: ", item.children);
        //console.log("pos: ", pos);

        DistributeCircular(
          item.children,
          xdist,
          (i, px, py) => {
            //console.log("circ", {px,py});
            //console.log("item", item);
            getItem(item.children[i].index).pos = new Point(px + pos.x - vec.x, py + pos.y - vec.y);
          },
          ang
        );
      }
    }
  }

  var min_x = 0,
    max_x = 0,
    min_y = 0,
    max_y = 0;

  for(var it of Table2DIterator(table)) it.pos.y = -it.pos.y;

  for(var it of Table2DIterator(table)) {
    const { pos } = it;
    if(min_x > pos.x) min_x = pos.x;
    if(min_y > pos.y) min_y = pos.y;

    if(max_x < pos.x) max_x = pos.x;
    if(max_y < pos.y) max_y = pos.y;
  }
  height = -min_y + max_y + radius * 4 + 2;
  width = -min_x + max_x + radius * 4 + 2;
  var scale_x = 1,
    scale_y = 1;

  // if(width < minWidth) scale_x = minWidth / width;
  /*
if(height  < minHeight)
  scale_y = minHeight / height;
*/
  var scale = scale_x;

  width *= scale_x;
  height *= scale_y;

  var offs_x = -min_x + (radius * 2 + 1);
  var offs_y = -min_y + (radius * 2 + 1);

  if(width < minWidth) {
  }

  for(var it of Table2DIterator(table)) {
    const { pos } = it;
    /*  it.pos.x -= min_x - (radius + 1);
    it.pos.y -= min_y - (radius + 1);
*/
    it.pos.x *= scale_x;
    it.pos.y *= scale_y;
  }

  for(var item of Table2DIterator(table)) {
    if(item.children && item.children.length) {
      let dir = direction;

      const len = item.children.length;
      const p = new Point(item.pos).add(dir(item.pos, getItem(item.children[len - 1].index).pos, radius));
      let acc = new Point(0, 0);

      for(let i = 0; i < len; i++) {
        acc = Point.sum(acc, getItem(item.children[i].index).pos);
      }

      //console.log("acc:",acc);
      getItem(item.index).vector = new Line(p.x, p.y, acc.x / len, acc.y / len);
    }
  }

  //console.log("Tree table ", table);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} {...props}>
      <defs>
        <filter id="shadow">
          <feDropShadow dx="1" dy="1" stdDeviation="2" />
        </filter>
      </defs>
      <g id={"tree"} transform={`translate(${offs_x * scale_x}, ${offs_y * scale_y})`}>
        {[...Table2DIterator(table)].map(item => {
          if(!item.parentIndex) return undefined;
          const [py, px] = item.parentIndex;
          const [iy, ix] = item.index;
          const parent = table[py][px];
          dir = item.depth == 2 ? directionVertical : direction;

          const d = dir(parent.pos, item.pos, radius);

          const a =
            iy > 1 ? new Point(parent.vector.x1, parent.vector.y1) : new Point(parent.pos.x, parent.pos.y).add(d);
          const b = new Point(item.pos.x, item.pos.y).add(dir(item.pos, parent.pos, radius));
          const ca = iy > 2 ? parent.vector.pointAt(0.2) : new Point(a.x + d.x * 2, a.y + d.y); //(a.x - b.x) * 0.0, a.y + (b.y - a.y) * 0.5);
          const cb = iy > 1 ? parent.vector.pointAt(0.8) : new Point(b.x - d.x * 2, b.y - d.y);

          //if(item.depth == 2)

          return (
            <React.Fragment>
              <path d={`M${a} C ${ca}, ${cb}, ${b}`} stroke={"black"} strokeWidth={W} fill={"none"} />
              {item.branch && (
                <circle cx={item.branch.a.x} cy={item.branch.a.y} r={10} fill={"none"} stroke={item.color.toHSL()} />
              )}
              {0 && item.vector && (
                <line
                  x1={item.vector.x1}
                  y1={item.vector.y1}
                  x2={item.vector.x2}
                  y2={item.vector.y2}
                  stroke={item.color.toHSL()}
                />
              )}
              {/*        <circle cx={ca.x} cy={ca.y} r={4} fill={item.color.toHSL()} />
            <circle cx={cb.x} cy={cb.y} r={4} fill={item.color.toHSL()} />*/}
            </React.Fragment>
          );
        })}
        {[...Table2DIterator(table)].map(item => (
          <g transform={`translate(${item.pos.x},${item.pos.y})`}>
            <g id={"item." + item.id}>
              <rect
                x={-radius}
                y={-radius}
                width={radius * 2}
                height={radius * 2}
                rx={8}
                ry={8}
                vectorEffect={"non-scaling-stroke"}
                stroke={item.id == active ? "white" : "none"}
                strokeDasharray={item.id == active ? "4" : ""}
                fill={item.color}
                strokeWidth={item.id == active ? W * 3 : W}
                style={{ filter: "url(#shadow)" }}
              />
              <SVGText lines={item.title} x={0} y={0} />
            </g>
          </g>
        ))}

        {/* <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke={"#f00"} strokeWidth={W} strokeDasharray="4" />
      <line x1={width / 2} x2={width / 2} y1={0} y2={height} stroke={"#f00"} strokeWidth={W} strokeDasharray="4" />*/}
      </g>
    </svg>
  );
};

export default Tree;
