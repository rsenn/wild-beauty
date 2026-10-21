import React from "react";
/*
export const Center = ({ horizontal, vertical, children, ...props }) => (
  <div {...props}>
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: vertical ? 'column nowrap'  : 'row nowrap',
        ...(!(horizontal||vertical) || horizontal ? { justifyContent: 'center' } : {}),
        ...(vertical ? { alignItems: 'center' } : {})
      }}>
      <div style={{ margin: 'auto' }}>
      {children}
      </div>
    </div>
  </div>
);

*/

export const Center = ({ horizontal, vertical, children, style, ...props }) => (
  <div
    {...props}
    style={{
      ...style,
      ...(!(horizontal || vertical) || vertical ? { verticalAlign: "middle" } : {}),
      ...(!(horizontal || vertical) || horizontal ? { textAlign: "center" } : {})
    }}
  >
    <div style={{ margin: "auto" }}>{children}</div>
  </div>
);
