import React from "react";
import Util from "../utils/util.js";

export const Tree = ({ tree }) => {
  var width = 200;
  var height = 200;

  var elements = [];
  var elementsByDepth = [];

  Util.traverseTree(tree, (item, depth) => {
    if(elementsByDepth[depth] === undefined) elementsByDepth.push([]);

    elementsByDepth[depth].push(item);
  });

  console.log("Tree elementsByDepth ", elementsByDepth);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs />
      {elements}
    </svg>
  );
};

export default Tree;
