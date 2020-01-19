import React from "react";
/*

export  Checkbox = props => (
  <input type="checkbox" {...props} />
)*/

export const HiddenCheckbox = props => (
  <input
    type="checkbox"
    {...props}
    style={{
      border: "0",
      clip: "rect(0 0 0 0)",
      clippath: "inset(50%)",
      height: "1px",
      margin: "-1px",
      overflow: "hidden",
      padding: "0",
      position: "absolute",
      whiteSpace: "nowrap",
      width: "1px"
    }}
  />
);

export const StyledCheckbox = props => (
  <div
    style={{
      display: "inline-block",
      width: "24px",
      height: "24px",
      backgroundSize: "100% 100%",
      backgroundImage: `url(/static/img/checkbox-` + (props.checked ? "enabled" : "disabled") + `.svg)`,
      borderRadius: "3px",
      transition: "all 150ms"
      /*   ${HiddenCheckbox}:focus + & {
    boxShadow: "0 0 0 3px pink",
  }*/
    }}
    {...props}
  />
);

export const Checkbox = ({ className, checked, onChange, ...props }) => (
  <div style={{ display: "inline-block", verticalAlign: "middle" }}>
    <HiddenCheckbox checked={checked} onChange={onChange} {...props} />
    <StyledCheckbox checked={checked} onClick={onChange} className={className} />
  </div>
);

/*
Checkbox.defaultProps = {
  align: 'flex-start',
  background: 'transparent',
  height: 'auto',
  justify: 'flex-start',
  margin: '0px',
  padding: '0px'
};

export default Checkbox;*/

