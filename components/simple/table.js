import React from "react";
import classNames from "classnames";

export const Table = ({ border = "0", spacing = "0", padding = "0", children, className, ...props }) => (
  <table
    border={border}
    cellSpacing={spacing}
    cellPadding={padding}
    className={classNames("table", className)}
    {...props}
  >
    {/*    {children}*/}
    <tbody>{children}</tbody>
  </table>
);

export const Row = ({ children, className, ...props }) => (
  <tr className={classNames("table-row", className)} {...props}>
    {children}
  </tr>
);

export const Cell = ({ children, className, ...props }) => (
  <td className={classNames("table-cell", className)} {...props}>
    {children}
  </td>
);
