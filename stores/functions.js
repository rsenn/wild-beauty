import { toJS } from "mobx";
import { Graph, Node, Edge } from "../lib/fd-graph.js";
import Util from "../lib/util.js";

export const RandomColor = () => {
  const c = HSLA.random();
  return c.toString();
};

export const maxZIndex = () => {
  let arr = [...document.querySelectorAll("*")].map(e => (e.style.zIndex !== undefined ? parseInt(e.style.zIndex) : undefined)).filter(e => !isNaN(e));
  arr.sort((a, b) => a < b);
  return arr[0];
};

export const makeItemToOption = selected => item => {
  let data = (item && item.data) || {};
  let label = data.title || data.name || data.text || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = { label, title: label, value, expanded: true, checked: selected === value };

  if(children && children.length) obj.children = children;
  if(label.startsWith("null(")) return null;
  if(!data.name) if (!(label.charCodeAt(0) >= 65 && label.charCodeAt(0) <= 90)) return null;

  return obj;
};

export const findInTree = (tree, value) => {
  if(tree.value === value || tree.label === value) return tree;
  if(tree.children) {
    for(let child of tree.children) {
      let ret = findInTree(child, value);
      if(ret !== null) return ret;
    }
  }
  return null;
};

export const walkTree = (tree, fn = (node, parent) => {}, parent = null, pret) => {
  let children = tree.children ? tree.children : null;

  let ret = fn(tree, parent, pret);

  if(children) {
    for(let child of children) {
      walkTree(child, fn, tree, ret);
    }
  }
  return ret;
};

export const reduceTree = (tree, fn = (acc, node) => {}, acc) => {
  let children = tree.children ? tree.children : null;

  acc = fn(acc, tree);

  if(children) {
    for(let child of children) {
      acc = reduceTree(child, fn, acc);
    }
  }
  return acc;
};

export const treeToGraph = (graph, tree) => {
  for(let [node, depth, parent_node] of Util.walkTree(tree, 1000, null, item => true)) {
    /* let { children, parent, ...restOfNode } = node;*/
    console.log("treeToGraph", { depth });
    let n = new Node(node.title || node.label || node.name || node.id, 60, 100);

    if(parent_node) {
      let e = new Edge(parent_node, n);
      graph.addEdge(e);
    }

    graph.addNode(n);
  }

  /* walkTree(tree, (node, parent, parent_node) => {
    let nchildren = reduceTree(
      node,
      (acc, n, p) => {
        acc += 1;
        return acc;
      },
      0
    );

    let n = new Node(node.title || node.label || node.name || node.id, 60 + 5 * nchildren, 100);
    //   console.log("node: ", { parent_node, nchildren });

    if(parent_node) {
      let e = new Edge(parent_node, n);
      //  console.log("edge: ", e);
      graph.addEdge(e);
    }

    graph.addNode(n);
    return n;
  });
  const { nodes, edges } = graph;
  console.log("graph: ", { nodes, edges });*/
};
