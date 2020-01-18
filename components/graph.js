import React, { Component, PureComponent } from "react";
import * as d3 from "d3";
import { HSLA, RGBA, Element } from "../utils/dom.js";
import { trkl } from "../utils/trkl.js";
import { SizeMe, withSize } from "react-sizeme";
import windowSize from "react-window-size";
import withSizes from "react-sizes";

export class Graph extends Component {
  svgRef = React.createRef();
  //svgRef = trkl();

  constructor(props) {
    super(props);
    /* this.svgRef.subscribe(function(value) {
   console.log("value:", value);
 });*/
  }

  componentDidUpdate() {
    console.log("Graph.componentDidUpdate");
  }

  componentDidMount() {
    let elem = this.svgRef.current;
    console.log("Graph.componentDidMount svgRef", this.svgRef);
    elem = Element.find("#d3-graph-svg");
    if(!elem) return;

    const svg = d3.select("#d3-graph-svg");
    console.log("svg:", svg);

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const { data } = this.props;

    console.log("data: ", data);

    let simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id(d => {
          return d.id;
        })
      )
      .force(
        "charge",
        d3.forceManyBody().strength(d => {
          return -Math.pow(d.group, 3);
        })
      )
      .force("center", d3.forceCenter(0, 0))
      .alphaTarget(0.1);

    const grp = svg.append("g").attr("transform", `translate(100,100) scale(0.2,0.2)`);

    const link = grp
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke-width", "1")
      .attr("stroke", "#000")
      .attr("opacity", 0.5);

    const getNodeColor = function(a = 1.0) {
      return d => {
        let hv = Util.randInt(-22, 22),
          sv = Util.randInt(-22, 22),
          lv = Util.randInt(-22, 22);
        const hsla = new HSLA(((d.group * 360) / 9 + hv) % 360, 100, 50, a);
        const rgba = hsla.toRGBA();
        return rgba.hex();
      };
    };

    const node = grp
      .append("g")
      .attr("class", "nodes")
      .attr("stroke", "#000")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", d => d.group * 2)
      .attr("fill", getNodeColor(1));
    node.append("title").text(d => {
      return d.id;
    });

    const ticked = () => {
      link
        .attr("x1", d => {
          return d.source.x;
        })
        .attr("y1", d => {
          return d.source.y;
        })
        .attr("x2", d => {
          return d.target.x;
        })
        .attr("y2", d => {
          return d.target.y;
        });

      node
        .attr("cx", d => {
          return d.x;
        })
        .attr("cy", d => {
          return d.y;
        });
    };
    simulation.nodes(data.nodes).on("tick", ticked);
    simulation.force("link").links(data.links);
  }

  render() {
    return (
      <div style={{ position: "absolute", top: 0 }}>
        <svg
          id="d3-graph-svg"
          viewBox={`0 0 200 200`}
          width={200}
          height={200}
          style={{ width: "100vw", height: "auto" }}
        />
      </div>
    );
  }
}

const mapSizesToProps = ({ width, height }) => ({
  width,
  height
});

export default withSizes(mapSizesToProps)(Graph);
