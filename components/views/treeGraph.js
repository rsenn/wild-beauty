import React, { Component } from "react";
import { Align, HSLA, Point, Rect, Line } from "../../lib/dom.js";
import { withSize } from "react-sizeme";

export class TreeGraph extends Component {
  svgRef = React.createRef();

  constructor(props) {
    super(props);
  }

  render() {
    let { nodes, edges, bbox } = this.props.graph;
    console.log("this.props.graph:", this.props.graph);
    console.log("bbox:", bbox);
    //
    return (
      <div>
        <svg viewBox={`0 0 ${Math.ceil(bbox.width + 22)} ${Math.ceil(bbox.height + 22)}`} style={{ width: "100%", height: "auto" }}>
          <g transform={`translate(${(-bbox.x + 11).toFixed(3)}, ${(-bbox.y + 11).toFixed(3)})`}
          stroke={"#000"} strokeWidth={1} fill={"hsla(50,100%,50%,1)"}>
            {edges.map(e => {
              let edge = [nodes[e[0]], nodes[e[1]]];
              let line = new Line(edge[0], edge[1]);

              line.round();

              return <line {...line.toObject()} stroke={"#000"} strokeWidth={1} data-id={`${edge[0].id} <-> ${edge[1].id}`} />;
            })}
            {nodes.map(node => {
              let p = new Point(node); /*.move(-bbox.x, -bbox.y)*/
              let r = new Rect(0, 0, 20, 20);

              r.align(p, Align.CENTER | Align.MIDDLE);
              r.round();

              return <rect {...r.toObject()} rx={5} ry={5} data-id={node.id} data-label={node.label} />;
            })}
          </g>
        </svg>
      </div>
    );
  }
}

export default withSize()(TreeGraph);
