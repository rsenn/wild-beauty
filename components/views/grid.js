import classNames from "classnames";
import React from "react";
import Util from "../../utils/util.js";

export const Grid = ({ rows, cols, style, children, className, ...props }) => (
  <React.Fragment>
    <div
      className={classNames(className, "grid-view")}
      style={{
        ...style,
        display: "grid",
        gridAutoRows: "20vh",
        gridTemplateCols:
          typeof rows == "number"
            ? Util.repeat(cols, "" + 100 / cols + "%").join(" ")
            : cols instanceof Array
            ? cols.join(" ")
            : cols
      }}
    >
      {children}
    </div>
    <style jsx global>{`
      .grid-view {
        display: grid;
        position: relative;
      }
    `}</style>
  </React.Fragment>
);

export const GridItem = ({ col, row, style, children, className, ...props }) => (
  <div style={{ ...style, gridRow: "" + row, gridCol: "" + col }} className={className || "grid-item"}>
    {children}
  </div>
);

export default Grid;
