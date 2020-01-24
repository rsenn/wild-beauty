import React, { Component } from "react";
import * as d3 from "d3";
import { HSLA, Element } from "../utils/dom.js";
import withSizes from "react-sizes";

export const collapsibleForceLayout = data => {
  const width = 1000,
    height = 1000;
  let i = 0;

  //console.log("collapsibleForceLayout ", data );
  const root = d3.hierarchy({
    name: "[1]",
    children: [
      { name: "[41]", size: 10 },
      { name: "org", size: 10 },
      { name: "[57]", size: 10 },
      { name: "[58]", size: 10 },
      { name: "[59]", size: 10 },
      { name: "[60]", size: 10 },
      { name: "[61]", size: 10 },
      { name: "[62]", size: 10 },
      {
        name: "objects",
        children: [
          {
            name: "electronics",
            children: [
              { name: "[119]", size: 10 },
              { name: "[120]", size: 10 },
              { name: "[121]", size: 10 },
              { name: "[122]", size: 10 },
              { name: "[123]", size: 10 },
              { name: "[124]", size: 10 },
              {
                name: "pic",
                children: [
                  { name: "lc-meter", size: 10 },
                  { name: "rgb-led", size: 10 },
                  { name: "picstick-25k50", size: 10 }
                ]
              },
              { name: "Audio", size: 10 },
              { name: "RS232", children: [{ name: "jdm2-programmer", size: 10 }] }
            ]
          },
          {
            name: "boxes",
            children: [
              { name: "[99]", size: 10 },
              { name: "[103]", size: 10 },
              { name: "[98]", size: 10 },
              { name: "[86]", size: 10 },
              { name: "Test", size: 10 }
            ]
          },
          { name: "bags", children: [{ name: "[64]", size: 10 }] }
        ]
      },
      {
        name: "subjects",
        children: [
          {
            name: "[89]",
            children: [
              { name: "[105]", size: 10 },
              { name: "Roman", size: 10 }
            ]
          },
          { name: "groups", size: 10 }
        ]
      }
    ]
  });
  const transform = d3.zoomIdentity;
  let node, link;

  //console.log("collapsibleForceLayout data=",data);

  const svgElem = d3.select("#d3-graph-svg");

  let svg = svgElem
    .append("g")
    .call(
      d3
        .zoom()
        .scaleExtent([1 / 2, 8])
        .on("zoom", zoomed)
    )
    .append("g")
    .attr("transform", "translate(-140,-30) scale(0.5,0.5)");

  var animFrame = 0;
  const ANIMATE_EVERY_NTH_FRAME = 6;
    const TICKS_PER_RENDER = 3;

  const startFn = () => {
    function render() {
      if(animFrame % ANIMATE_EVERY_NTH_FRAME == 0) {
        for(var i = 0; i < TICKS_PER_RENDER; i++) {
          force.tick();
        }
        // prettier-ignore
        link
        .attr("x1", function(d) {return d.source.x; })
        .attr("y1", function(d) {return d.source.y; })
        .attr("x2", function(d) {return d.target.x; })
        .attr("y2", function(d) {return d.target.y; });

        node.attr("transform", function(d) {
          return `translate(${d.x}, ${d.y})`;
        });
      }
      animFrame++;
    }

   // requestAnimationFrame(render);
    //Timer.interval(500, render);
  };

  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3.forceLink().id(function(d) {
        return d.id;
      })
    )
    .force(
      "charge",
      d3
        .forceManyBody()
        .strength(-15)
        .distanceMax(300)
    )
    .force("center", d3.forceCenter(width / 2, height / 4))

    .on("tick", ticked);

  function update() {
    const nodes = flatten(root);
    const links = root.links();

    //console.log("collapsibleForceLayout update ", { nodes,links});

    link = svg.selectAll(".link").data(links, function(d) {
      return d.target.id;
    });

    link.exit().remove();

    const linkEnter = link
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "#000")
      .style("opacity", "1")
      .style("stroke-width", 0.8);

    link = linkEnter.merge(link);
    node = svg.selectAll(".node").data(nodes, function(d) {
      return d.id;
    });
    node.exit().remove();

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.3)
      .style("fill", color)
      .style("opacity", 1)

      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // prettier-ignore
    nodeEnter
      .append("rect")
      .attr("x", function(d) {return -(d.data.size > 0 ? d.data.size * 0.5 : 8); })
      .attr("y", function(d) {return -(d.data.size > 0 ? d.data.size * 0.5 : 8); })
      .attr("width", function(d) {return 2 * (d.data.size > 0 ? d.data.size * 0.5 : 8); })
      .attr("height", function(d) {return 2 * (d.data.size > 0 ? d.data.size * 0.5 : 8); })
      .attr("rx", 1)
      .attr("ry", 1);

    nodeEnter
      .append("text")
      .style("stroke", "none")
      .style("fill", "black")
      .style("font-size", "4")
      .style("alignment-baseline", "middle")
      .style("text-anchor", "middle")

      .text(function(d) {
        return d.data.name;
      });

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
    return !!d._children ? "#40df20" : !!d.children ? "#ffc000" : "#b366ff";
  }
  function radius(d) {
    return d._children ? 8 : d.children ? 8 : 4;
  }
  function ticked() {
    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });
    node.attr("transform", function(d) {
      return `translate(${d.x}, ${d.y})`;
    });
  }
  function clicked(d) {}
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
  //console.log("svg:", svg);
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3.forceLink().id(function(d) {
        return d.id;
      })
    )
    .force(
      "charge",
      d3
        .forceManyBody()
        .strength(-15)
        .distanceMax(300)
    )
    .force("center", d3.forceCenter(0, 0))
    .on("tick", ticked);

  const grp = svg.append("g").attr("transform", `translate(100,100) scale(0.5,0.5)`);

  const link = grp
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter()
    .append("line")
    .attr("class", "link")
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
    .attr("class", "node")
    .attr("r", d => Math.log(d.group * 4) * 2)
    .attr("fill", getNodeColor(1));

  node.append("title").text(d => {
    return d.id;
  });

  const ticked = () => {
    // prettier-ignore
    link
      .attr("x1", d => {return d.source.x; })
      .attr("y1", d => {return d.source.y; })
      .attr("x2", d => {return d.target.x; })
      .attr("y2", d => {return d.target.y; });
    // prettier-ignore
    node
      .attr("cx", d => {return d.x; })
      .attr("cy", d => {return d.y; });
  };

  simulation.nodes(data.nodes).on("tick", ticked);

  simulation.force("link").links(data.links);
}

export class Graph extends Component {
  svgRef = React.createRef();

  componentDidMount() {
    let elem = this.svgRef.current;
    //console.log("Graph.componentDidMount svgRef", this.svgRef);
    elem = Element.find("#d3-graph-svg");
    if(!elem) return;
    let { data } = this.props;

    if(data !== null) {
      //console.log("Graph.componentDidIUpdate data=", data);
      collapsibleForceLayout(data);
    }
  }

  componentDidUpdate() {
    const { data } = this.props;
    if(data !== null) {
      //console.log("Graph.componentDidIUpdate data=", data);
      collapsibleForceLayout(data);
    }
  }

  shouldComponentUpdate() {
    return false;
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
