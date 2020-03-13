const SvgPath = require("./lib/svg-path.js");

const { parseSVG, makeAbsolute } = require("svg-path-parser");

let pathData = parseSVG("M9.434 5.852 l 4.516 2.14 -0.405 -4.981 -4.11 2.84 z"); //M11.993 10.754 a 5.059 5.059 0 01-3.176 2.27 5.056 5.056 0 01-3.84-.708 A 5.051 5.051 0 012.872 9.31 a 5.051 5.051 0 01.517-3.634 h 0 A 4.969 4.969 0 016.328 3.09 a 4.97 4.97 0 013.895.39 4.94 4.94 0 012.005 2.11");

makeAbsolute(pathData);

let newPath = new SvgPath();

newPath.rel();

for (let c of pathData) {
  const { code, command, relative } = c;
  console.log("c:", c);
  let { x0, y0 } = c;
  let { x, y } = c;
  let { rx, ry } = c;
  const prec = 5;
  if(x !== undefined) x = +(x - x0).toFixed(prec);
  if(y !== undefined) y = +(y - y0).toFixed(prec);
  /*  if(rx !== undefined) rx = +(rx - x0).toFixed(prec);
  if(ry !== undefined) ry = +(ry - y0).toFixed(prec);*/
  switch (code) {
    case "M": {
      newPath.to(x, y);
      break;
    }
    case "A": {
      const { xAxisRotation, largeArc, sweep } = c;
      newPath.arc(rx, ry, xAxisRotation, largeArc, sweep, x, y);
      break;
    }
    case "H": {
      newPath.hline(x);
      break;
    }
    case "L": {
      newPath.line(x, y);
      break;
    }
    case "Z": {
      newPath.close();
      break;
    }
  }
}

console.log("newPath:", newPath.str());
