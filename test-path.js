const SvgPath = require("./lib/svg-path.js");

const { parseSVG, makeAbsolute } = require("svg-path-parser");

let pathData = parseSVG(
  "M.1 494.1c-1.1 9.5 6.3 17.8 15.9 17.8l32.3.1c8.1 0 14.9-5.9 16-13.9.7-4.9 1.8-11.1 3.4-18.1H380c1.6 6.9 2.9 13.2 3.5 18.1 1.1 8 7.9 14 16 13.9l32.3-.1c9.6 0 17.1-8.3 15.9-17.8-4.6-37.9-25.6-129-118.9-207.7-17.6 12.4-37.1 24.2-58.5 35.4 6.2 4.6 11.4 9.4 17 14.2H159.7c21.3-18.1 47-35.6 78.7-51.4C410.5 199.1 442.1 65.8 447.9 17.9 449 8.4 441.6.1 432 .1L399.6 0c-8.1 0-14.9 5.9-16 13.9-.7 4.9-1.8 11.1-3.4 18.1H67.8c-1.6-7-2.7-13.1-3.4-18.1-1.1-8-7.9-14-16-13.9L16.1.1C6.5.1-1 8.4.1 17.9 5.3 60.8 31.4 171.8 160 256 31.5 340.2 5.3 451.2.1 494.1z"
);

makeAbsolute(pathData);

let newPath = new SvgPath();

newPath.rel();

for (let c of pathData) {
  const { code, command, relative } = c;

  let { x, y, x0, y0, x1, y1, x2, y2, rx, ry } = c;
  const prec = 5;

  if(x !== undefined) x = +(x - x0).toFixed(prec);
  if(y !== undefined) y = +(y - y0).toFixed(prec);
  if(x1 !== undefined) x1 = +(x1 - x0).toFixed(prec);
  if(x2 !== undefined) x2 = +(x2 - x0).toFixed(prec);
  if(y1 !== undefined) y1 = +(y1 - y0).toFixed(prec);
  if(y2 !== undefined) y2 = +(y2 - y0).toFixed(prec);

  switch (code) {
    case "M": {
      newPath.to(x, y);
      break;
    }
    case "A": {
      const { xAxisRotation, largeArc, sweep } = c;
      newPath.arc(rx, ry, xAxisRotation, largeArc ? 1 : 0, sweep ? 1 : 0, x, y);
      break;
    }
    case "H": {
      newPath.hline(x);
      break;
    }
    case "V": {
      newPath.hline(y);
      break;
    }
    case "L": {
      newPath.line(x, y);
      break;
    }
    case "C": {
      newPath.bezier3(x1, y1, x2, y2, x, y);
      break;
    }
    case "Q": {
      newPath.bezier2(x1, y1, x, y);
      break;
    }
    case "Z": {
      newPath.close();
      break;
    }
  }
}
const data = newPath.str().trim();

console.log(`<path d="${data}" />`);
process.stdout.write("\n" + data + "\n");
