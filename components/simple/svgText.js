import React from "react";

export const SVGText = ({ x, y, yinc = 12, children, textAnchor = "middle", alignmentBaseline = "middle", fontFamily = "Fixed", fontSize = 13, ...props }) => {
  if(typeof children == "function") children = children(props);

  if(typeof children == "string") children = children.split(/\n/g);

  const ystart = (-(children.length - 1) / 2) * yinc;
  return children.map((line, i) => (
    <text textAnchor={textAnchor} alignmentBaseline={alignmentBaseline} fontFamily={fontFamily} fontSize={fontSize} y={y + ystart + i * yinc} x={x} {...props}>
      {line}
    </text>
  ));
};

export default SVGText;
