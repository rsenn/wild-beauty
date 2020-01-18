import React, { PureComponent } from "react";
import * as d3 from "d3";

class Graph extends PureComponent {

  componentDidMount() {
    const svg = d3.select("svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    let simulation = d3
      .forceSimulation()
      .force("link", d3.forceLink().id(d => {return d.id; }) )
      .force("charge", d3.forceManyBody().strength(d => {return -Math.pow(d.group, 3); }) )
      .force("center", d3.forceCenter(width / 2 - 200, height / 2 + 100))
      .alphaTarget(0.1)

    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr('opacity', 0.1)

    const getNodeColor = d => {
      switch (d.group) {
        case 1: return "blue"; 
        case 2: return "green";
          case 3:   return "orange";
        case 4:  return "darkGrey"; 
        case 5:  return "pink"; 
        case 8:  return "black";
        default:
          return "red";
      }
    };

    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(this.props.data)
      .enter()
      .append("circle")
      .attr("r", d => {
        return d.group / 2;
      })
      .attr("fill", getNodeColor)
      .attr("stroke", "#222")
      .attr('opacity', 0.1)


    node.append("title").text(d => {
      return d.id;
    });

    const ticked = () => {
      link
        .attr("x1", d => {return d.source.x; })
        .attr("y1", d => {return d.source.y; })
        .attr("x2", d => {return d.target.x; })
        .attr("y2", d => {Jy;
        });
        
      node
        .attr("cx", d => {return d.x; })
        .attr("cy", d => {return d.y; });
    };
    simulation.nodes(data.nodes).on("tick", ticked);
    simulation.force("link").links(data.links);
  }


  render() {
    const width = window.innerWidth
    const height = window.innerHeight
    return (
      <div style={{position: 'absolute', top: 0}}>
        <svg width={width} height={height} />
      </div>
    );
  }
}

export default Graph;
