import React, { Component } from "react";
import { Align, HSLA, Point, Size, Rect, Line } from "../../lib/dom.js";
import { withSize } from "react-sizeme";
import { SVGText } from "../simple/svgText.js";
import Util from "../../lib/util.js";

export class TreeGraph extends Component {
  svgRef = React.createRef();

  constructor(props) {
    super(props);
  }

  render() {
    let { nodes, edges, bbox } = this.props.graph;
    let size = new Size(30, 30);
    let t = new Point(-bbox.x + size.width / 2 + 1, -bbox.y + size.height / 2 + 1);
    //console.log("this.props.graph:", this.props.graph);
    console.log("bbox:", bbox);
    //
    return (
      <div>
        <svg viewBox={`0 0 ${Math.ceil(bbox.width + size.width + 2)} ${Math.ceil(bbox.height + size.height + 2)}`} style={{ width: "100%", height: "auto" }}>
          <g transform={`translate(${t})`}>
          <g stroke={"#000"} strokeWidth={1} fill={"hsla(50,100%,50%,1)"}>
            {edges.map((e,key) => {
              let edge = [nodes[e[0]], nodes[e[1]]];
              let line = new Line(edge[0], edge[1]);

              line.round();

              return <line key={'edge'+key} {...line.toObject()} stroke={"#000"} strokeWidth={1} data-id={`${edge[0].id} <-> ${edge[1].id}`} />;
            })}
            {nodes.map((node,key) => {
              let p = new Point(node); /*.move(-bbox.x, -bbox.y)*/
              let r = new Rect(0, 0, 30, 30);
              r.align(p, Align.CENTER | Align.MIDDLE);
              r.round();
              return <rect key={'node'+key} {...r.toObject()} rx={5} ry={5} data-id={node.id} data-label={node.label} />;
            })}

            </g>
            <g fill={"#000"}>

            {nodes.map((node,key) => (
              <SVGText key={'text'+key} x={node.x} y={node.y} fontSize={8}>
                {Util.splitLines(node.label, 7)}
              </SVGText>
            ))}
          </g>
          </g>
        </svg>
      </div>
    );
  }
}

export default withSize()(TreeGraph);
