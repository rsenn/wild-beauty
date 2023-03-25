import React from "react";
import { ReactComponent } from "../../lib/dom/reactComponent.js";

export const SVGText = ({
  x,
  y,
  lineHeight = 12,
  children,
  textAnchor = "middle",
  alignmentBaseline = "middle",
  fontFamily = "Fixed",
  fontSize = 13,
  ...props
}) => {
  if(typeof children == "function") children = children(props);

  if(typeof children == "string") children = children.split(/\n/g);

  children = ReactComponent.toChildArray(children);

  const ystart = (-(children.length - 1) / 2) * lineHeight;
  return children.map((line, i) => (
    <text
      textAnchor={textAnchor}
      alignmentBaseline={alignmentBaseline}
      fontFamily={fontFamily}
      fontSize={fontSize}
      y={y + ystart + i * lineHeight}
      x={x}
      {...props}
    >
      {line}
    </text>
  ));
};

export default SVGText;
