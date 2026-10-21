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
    const { style, strokeWidth = 0.5, size = new Size(32, 32), radius = 3, padding = 30, ...props } = this.props;
    let { nodes, edges, bbox } = this.props.graph;
    let t = new Point(0, 0); //-bbox.x + size.width / 2 + 1, -bbox.y + size.height / 2 + 1);
    //console.log("this.props.graph:", this.props.graph);
    let vbox = new Rect(bbox).outset(padding);
    console.log("bbox:", bbox);
    //
    return (
      <div>
        <svg viewBox={vbox} style={style}>
          <g transform={`translate(${t})`}>
            <g stroke={"#000"} strokeWidth={strokeWidth} fill={"hsla(50,100%,50%,1)"}>
              {edges.map((e, key) => {
                let edge = [nodes[e[0]], nodes[e[1]]];
                let line = new Line(edge[0], edge[1]);

                line.round();

                return <line key={"edge" + key} {...line.toObject()} stroke={"#000"} strokeWidth={strokeWidth} data-id={`${edge[0].id} <-> ${edge[1].id}`} />;
              })}
              {nodes.map((node, key) => {
                let p = new Point(node); /*.move(-bbox.x, -bbox.y)*/
                let r = new Rect({ ...size, x: 0, y: 0 });
                r.align(p, Align.CENTER | Align.MIDDLE);
                r.round();
                return <rect key={"node" + key} {...r.toObject()} rx={radius} ry={radius} data-id={node.id} data-label={node.label} />;
              })}
            </g>
            <g fill={"#000"}>
              {nodes.map((node, key) => (
                <SVGText key={"text" + key} x={node.x} y={node.y} lineHeight={"7"} style={{ fontSize: "0.3rem" }}>
                  {Util.splitLines(node.label, 10)}
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
