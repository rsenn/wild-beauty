import React from "react";
import classNames from "classnames";

export const WrapInAspectBox = (enable, { width = "100%", aspect = 1, className }, children) =>
  enable ? (
    <SizedAspectRatioBox className={className} width={width} aspect={aspect} style={{ overflow: "visible" }}>
      {children}
    </SizedAspectRatioBox>
  ) : (
    <div className={className} style={{ width }}>
      {children}
    </div>
  );

export const AspectRatioBox = ({ aspect = 1.0, children, insideClassName, outsideClassName, outsideProps = {}, style, ...props }) => {
  /* console.log('AspectRatioBox ', { props, aspect, children, insideClassName, outsideClassName, style });*/
  return (
    <React.Fragment>
      <div className={classNames("aspect-ratio-box", outsideClassName)} style={{ height: 0, paddingBottom: (1.0 / aspect) * 100 + "%", ...style }} {...outsideProps}>
        <div className={classNames("aspect-ratio-box-inside", insideClassName)} {...props}>
          {children}
        </div>
      </div>
      <style jsx global>{`
        .aspect-ratio-box {
          position: relative;
        }
        .aspect-ratio-box-inside {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </React.Fragment>
  );
};

export const SizedAspectRatioBox = ({ width = undefined, height = undefined, style, className, children, outsideClassName, insideClassName, insideProps, outsideProps = {}, sizeClassName, sizeProps = {}, onClick, ...props }) => (
  <div className={classNames("aspect-ratio-box-size", className + "-size", sizeClassName)} style={{ position: "relative", width, height, ...style }} {...sizeProps} onClick={onClick}>
    <AspectRatioBox outsideClassName={classNames("aspect-ratio-box-outside", className + "-outside", outsideClassName)} outsideProps={outsideProps} insideClassName={insideClassName || className} onClick={onClick} {...(insideProps || props)}>
      {children}
    </AspectRatioBox>
    <style jsx global>{`
      .aspect-ratio-box-size {
        position: relative;
        overflow: hidden;
      }
    `}</style>
  </div>
);
