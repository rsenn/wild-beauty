import React from "react";

export const WrapIf = ({ cond, container, inline, children, ...props }) => {
  if(!cond) return <React.Fragment>{children}</React.Fragment>;
  var Element = container || (inline ? "span" : "div");

  return <Element {...props}>{children}</Element>;
};

export const WrapIfElse = ({ cond, ifTrue, ifFalse, children, ...props }) => {
  var Element = cond ? ifTrue : ifFalse;
  return <Element {...props}>{children}</Element>;
};

export default WrapIf;
