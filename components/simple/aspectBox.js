import React from "react";
import classNames from "classnames";

export const WrapInAspectBox = (enable, { width = "84%", aspect = "0.718", className }, children) =>
  enable ? (
    <SizedAspectRatioBox
      className={className}
      width={width}
      aspect={aspect}
      style={{ overflow: "visible" }}
    >
      {children}
    </SizedAspectRatioBox>
  ) : (
    <div className={className} style={{ width }}>
      {children}
    </div>
  );

export const AspectRatioBox = ({
  aspect = 1.0,
  children,
  insideClassName,
  outsideClassName,
  style,
  ...props
}) => {
  /* console.log('AspectRatioBox ', { props, aspect, children, insideClassName, outsideClassName, style });*/
  return (
    <div
      className={classNames("aspect-ratio-box", outsideClassName)}
      style={{ height: 0, paddingTop: (1.0 / aspect) * 100 + "%", ...style }}
    >
      <div className={classNames("aspect-ratio-box-inside", insideClassName)} {...props}>
        {" "}
        {children}
      </div>
    </div>
  );
};

export const SizedAspectRatioBox = ({
  width = undefined,
  height = undefined,
  style,
  className,
  children,
  onClick,
  ...props
}) => (
  <div
    className={className + "-size"}
    style={{ position: "relative", width, height, ...style }}
    onClick={onClick}
  >
    <AspectRatioBox
      outsideClassName={className + "-outside"}
      insideClassName={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </AspectRatioBox>
  </div>
);
