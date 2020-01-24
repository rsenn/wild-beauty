import React from "react";
import sizeMe from "react-sizeme";

export class GraphContainer extends React.Component {
  render() {
    const children = this.props.children;
    return (
      // sizeMe doesnt work properly on svg element, so wrap in div
      <div className="graph-container" style={{ width: "100%", height: "100%" }}>
        <svg width="100%" height="100%">
          {children}
        </svg>
      </div>
    );
  }
}

// using sizeMe calls props.onSize when size updates
export default sizeMe({ monitorHeight: true })(GraphContainer);
