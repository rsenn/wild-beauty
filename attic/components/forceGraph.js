import React from "react";
import d3 from "d3";
import s from "react-hyperscript";
const { setupSimulationForces: defaultSetupSimulationForces, destroySimulation } = require("./simulation");
const renderGraph = require("./normal");

function mergeGraph(oldGraph, newGraph) {
  const { width, height } = newGraph.container;
  const graph = {};
  // create index for faster lookups during merge
  const graphIndex = createGraphIndex(oldGraph);
  // merge old graph for existing nodes + links
  graph.nodes = newGraph.nodes.map(node => {
    // add 10% random jitter around center
    const middlePoint = {
      x: width / 2 + width * (0.2 * Math.random() - 0.1),
      y: height / 2 + height * (0.2 * Math.random() - 0.1)
    };
    const oldNode = graphIndex.nodes[node.id];
    return Object.assign({}, middlePoint, oldNode, node);
  });
  graph.links = newGraph.links.map(link => {
    return Object.assign({}, graphIndex.links[link.id], link);
  });
  graph.container = newGraph.container;
  return graph;
}

function buildGraph(networkState, networkFilter, latencyMode) {
  const graph = { nodes: [], links: [] };

  // first add kitsunet nodes
  Object.keys(networkState).forEach(clientId => {
    // const peerData = networkState[clientId].peers
    // const badResponse = (typeof peerData !== 'object')
    const newNode = { id: clientId, type: "good" };
    graph.nodes.push(newNode);
  });

  // then links
  Object.entries(networkState).forEach(([clientId, clientData]) => {
    const clientStats = clientData.stats || {};
    const peers = clientStats.peers;
    if(!peers) return;

    Object.entries(peers).forEach(([peerId, peerStats]) => {
      // if connected to a missing node, create missing node
      const alreadyExists = !!graph.nodes.find(item => item.id === peerId);
      if(!alreadyExists) {
        const newNode = { id: peerId, type: "missing" };
        graph.nodes.push(newNode);
      }
      const protocolNames = Object.keys(peerStats.protocols);
      // abort if network filter miss
      if(networkFilter && !protocolNames.some(name => name.includes(networkFilter))) return;
      const peerData = clientData.peers[peerId];
      const ping = peerData ? peerData.ping : null;
      const pingDistance = 60 * Math.log(ping || 1000);
      const distance = latencyMode ? pingDistance : 30;
      const linkValue = 2;
      const linkId = `${clientId}-${peerId}`;
      const newLink = {
        id: linkId,
        source: clientId,
        target: peerId,
        value: linkValue,
        distance
      };
      graph.links.push(newLink);
    });
  });

  return graph;
}

function createGraphIndex(graph) {
  const graphIndex = { nodes: {}, links: {} };
  graph.nodes.forEach(node => {
    graphIndex.nodes[node.id] = node;
  });
  graph.links.forEach(link => {
    graphIndex.links[link.id] = link;
  });
  return graphIndex;
}

function renderBaseGraph(state, actions, { renderNode, renderLink }) {
  const { graph } = state;
  const { nodes, links } = graph;

  return s(
    "g",
    {
      className: "graph"
    },
    [
      s(
        "g",
        { className: "links" },
        links.map(link => renderLink(link, state, actions))
      ),
      s(
        "g",
        { className: "nodes" },
        nodes.map(node => renderNode(node, state, actions))
      )
    ]
  );
}

function renderGraph(state, actions) {
  return renderBaseGraph(state, actions, { renderNode, renderLink });

  function renderNode(node, state, actions) {
    const { selectedNode, networkState } = state;
    const isSelected = selectedNode === node.id;

    const color = node.color;
    const normalRadius = node.radius;
    const radius = isSelected ? normalRadius * 2 : normalRadius;
    const label = node.label || node.id;

    return s(
      "circle",
      {
        r: radius,
        fill: color,
        cx: node.x,
        cy: node.y,
        onClick: () => actions.selectNode(node.id)
      },
      [s("title", `${label}`)]
    );
  }

  function renderLink(link, state, actions) {
    const { source, target } = link;
    return s("line", {
      strokeWidth: link.value,
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y
    });
  }
}

class ForceGraph extends React.Component {
  constructor() {
    super();
    // bind for event listener
    this.updateGraph = this.updateGraph.bind(this);
    this.triggerForceUpdate = this.triggerForceUpdate.bind(this);
  }

  componentDidMount() {
    // setup force simulation
    this.simulation = d3.forceSimulation();

    // setup update graph on change
    this.graph = { nodes: [], links: [], container: {}, container: { height: 0, width: 0 } };
    const { graphStore } = this.props;
    graphStore.subscribe(this.updateGraph);
    this.updateGraph(graphStore.getState());

    // setup re-render on simulation update
    this.simulation.on("tick", this.triggerForceUpdate);
  }

  componentWillUnmount() {
    const { graphStore } = this.props;
    graphStore.unsubscribe(this.updateGraph);

    // cleanup simulation and graph
    destroySimulation(this.simulation);
    delete this.simulation;
    delete this.graph;
  }

  triggerForceUpdate() {
    this.forceUpdate();
  }

  updateGraph(newGraph) {
    // merge with existing graph
    const currentGraph = this.graph;
    const mergedGraph = mergeGraph(currentGraph, newGraph);
    this.graph = mergedGraph;

    // reset simulation
    const setupSimulationForces = this.props.setupSimulationForces || defaultSetupSimulationForces;
    setupSimulationForces(this.simulation, mergedGraph);
  }

  render() {
    const graph = this.graph;
    if(!graph) return null;

    return renderGraph({ graph }, this.props.actions);
  }
}

module.exports = ForceGraph;

ForceGraph.createStyle = () => {
  return style(`
  
    .links line {
      stroke: #999;
      stroke-opacity: 0.6;
    }
  `);
};

function style(styleContent) {
  return <style dangerouslySetInnerHTML={{ __html: styleContent }} />;
}
