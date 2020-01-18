import React, { Component, PureComponent } from "react";
import * as d3 from "d3";
import { HSLA, RGBA, Element } from "../utils/dom.js";
import { trkl } from "../utils/trkl.js";
import { SizeMe, withSize } from "react-sizeme";
import windowSize from "react-window-size";
import withSizes from "react-sizes";

// prettier-ignore
export const collapsibleForceLayout = data => {
  const width = 1000,
  height = 1000;
  let i = 0;
  const root = d3.hierarchy(data);
  const transform = d3.zoomIdentity;
  let node, link;
  
  const svg = d3
  .select("#d3-graph-svg")
  .append("svg")
  .call(
    d3
    .zoom()
    .scaleExtent([1 / 2, 8])
    .on("zoom", zoomed)
    )
  .append("g")
  .attr("transform", "translate(40,0)");
  
  const simulation = d3
  .forceSimulation()
  .force("link", d3.forceLink().id(function(d) {return d.id; }) )
  .force("charge", d3 .forceManyBody() .strength(-15) .distanceMax(300) )
  .force("center", d3.forceCenter(width / 2, height / 4))
  .on("tick", ticked);

  function update() {
    const nodes = flatten(root);
    const links = root.links();
    link = svg.selectAll(".link").data(links, function(d) {
      return d.target.id;
    });
    link.exit().remove();
    const linkEnter = link
    .enter()
    .append("line")
    .attr("class", "link")
    .style("stroke", "#000")
    .style("opacity", "0.2")
    .style("stroke-width", 2);
    link = linkEnter.merge(link);
    node = svg.selectAll(".node").data(nodes, function(d) {
      return d.id;
    });
    node.exit().remove();
    const nodeEnter = node
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("stroke", "#666")
    .attr("stroke-width", 2)
    .style("fill", color)
    .style("opacity", 1)
    .on("click", clicked)
    .call(
      d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
      );

    nodeEnter
    .append("circle")
    .attr("r", function(d) {return Math.sqrt(d.data.size) / 10 || 4.5; })
    .style("text-anchor", function(d) {return d.children ? "end" : "start"; })
    .text(function(d) {return d.data.name; });

    node = nodeEnter.merge(node);
    simulation.nodes(nodes);
    simulation.force("link").links(links);
  }
  function sizeContain(num) {
    num = num > 1000 ? num / 1000 : num / 100;
    if(num < 4) num = 4;
    return num;
  }
  function color(d) {
    return d._children ? "#51A1DC" // collapsed package : d.children ? "#51A1DC" // expanded package : "#F94B4C"; // leaf node
  }
  function radius(d) {
    return d._children ? 8 : d.children ? 8 : 4;
  }
  function ticked() {
    link
    .attr("x1", function(d) {return d.source.x; })
    .attr("y1", function(d) {return d.source.y; })
    .attr("x2", function(d) {return d.target.x; })
    .attr("y2", function(d) {return d.target.y; });
    node.attr("transform", function(d) {return `translate(${d.x}, ${d.y})`; });
  }
  function clicked(d) {
    if(!d3.event.defaultPrevented) {
      if(d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update();
    }
  }
  function dragstarted(d) {
    if(!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  function dragended(d) {
    if(!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  function flatten(root) {
    const nodes = [];
    function recurse(node) {
      if(node.children) node.children.forEach(recurse);
      if(!node.id) node.id = ++i;
      else ++i;
      nodes.push(node);
    }
    recurse(root);
    return nodes;
  }
  function zoomed() {
    svg.attr("transform", d3.event.transform);
  }

  update();
};

function forceSimulation(data) {
  const svg = d3.select("#d3-graph-svg");
  console.log("svg:", svg);
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // prettier-ignore
  const simulation = d3.forceSimulation()
  .force('link', d3.forceLink().id(function(d) { return d.id; }))
  .force('charge', d3.forceManyBody().strength(-15).distanceMax(300))
  .force('center', d3.forceCenter( 0,0   ))
  .on('tick', ticked)
  /*
  let simulation = d3
    .forceSimulation()
    .force("link", d3.forceLink().id(d => {return d.id; }) )
      .force("charge", d3.forceManyBody().strength(d => {return -Math.pow(d.group, 2.5); }))
    .force("center", d3.forceCenter(0, 0))
//   .force('charge', d3.forceManyBody().strength(2))
.alphaTarget(0.2)*/ const grp = svg
.append("g")
.attr("transform", `translate(100,100) scale(0.5,0.5)`);

const link = grp
.append("g")
.attr("class", "links")
.selectAll("line")
.data(data.links)
.enter()
.append("line")
.attr("stroke-width", "0.5")
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
.attr("stroke-width", "0.3")
.selectAll("circle")
.data(data.nodes)
.enter()
.append("circle")
.attr("r", d => Math.log(d.group * 4) * 2)
.attr("fill", getNodeColor(1));

  // prettier-ignore
  node.append("title").text(d => {return d.id; });

  // prettier-ignore
  const ticked = () => {
    link 
    .attr("x1", d => {return d.source.x; })
    .attr("y1", d => {return d.source.y; })
    .attr("x2", d => {return d.target.x; })
    .attr("y2", d => {return d.target.y; });
    node
    .attr("cx", d => {return d.x; })
    .attr("cy", d => {return d.y; });
  };

  simulation.nodes(data.nodes).on("tick", ticked);

  simulation.force("link").links(data.links);
}

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

  const { data } = this.props;

  console.log("data: ", data);

  forceSimulation(data);
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
