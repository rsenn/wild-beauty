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

export const findInTree = (tree, value) => {
  //console.log("findInTree", { tree, value });
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

export const treeToGraph = (graph, tree, pred = item => true) => {
  // if(!(typeof tree == "object" && tree && tree.length !== undefined))

  tree = new Map([...Util.walkTree(tree, pred, item => item, 1000, null)].map(it => [it.id, it]));
  //tree = Object.fromEntries([...tree].map(it => ([ it.id, it ] )));

  for(let key of tree.keys()) {
    let node = tree.get(key);
    node.parent = node.parent_id > 0 ? tree.get(node.parent_id) : null;
    tree.set(key, node);
  }

  //console.log("tree: ", tree);
  for(let [key, node] of tree.entries()) {
    // let node = tree.get(key);
    let depth = 0;
    let p = node;
    while(p && p.parent) {
      p = p.parent;
      depth++;
    }
    /* let { children, parent, ...restOfNode } = node;*/
    //  console.log("treeToGraph", { depth, pred });
    let n = graph.addNode((node.data && node.data.title) || node.name || node.id, 60, 100);
    let parent_id = node.parent && node.parent !== null && node.parent.id;
    if(parent_id !== undefined && parent_id !== null) node.parent_id = parent_id;

    node = Util.filterOutKeys(node, ["children", "photos", "users", "parent", "children_aggregate"]);

    //console.log("node: ", node);

    n.node = node;

    if(node.parent_id > 0) {
      let parent = Util.find(graph.nodes, n => n.node.id == node.parent_id);
      if(parent !== null && n !== null && parent !== n) {
        let e = new Edge(parent, n);
        console.log("treeToGraph", {Edge, e})
        graph.addEdge(e);
      }
    }

    //   graph.addNode(n).parent_id = node.parent_id;
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

export const idOf = obj => (typeof obj == "object" && obj !== null && obj.id !== undefined ? obj.id : null);

export const transformItemData = it => {
  if(typeof it.data == "string") {
    let dataObj = {};
    try {
      dataObj = JSON.parse(it.data);
    } catch(err) {
      dataObj = null;
    }
    if(dataObj !== null) Object.assign(it, dataObj);
  }
  /*  if(it.title === undefined)
    it.title = it.name;*/
  return it;
};

export const transformItemIds = it => {
  if(it.children !== undefined) it.children = it.children.map(idOf);
  if(it.photos !== undefined) it.photos = it.photos.map(m => idOf(m.photo));
  if(it.parent !== undefined) it.parent = idOf(it.parent);

  return it;
};

export const transformItem = it => /*transformItemIds*/ transformItemData(it);

export const makeItemToOption = selected => item => {
  item = transformItemData(item);
  // let data = (item && item.data) || {};
  let label = item.title || item.name || `${item.type}(${item.id})`;
  let value = item.id;
  let children = toJS(item.children);
  let obj = { label /*, title: label*/, value, expanded: true, checked: selected === value };

  if(children && children.length) obj.children = children;
  if(label.startsWith("null(")) return null;
  // if(!data.name) if (!(label.charCodeAt(0) >= 65 && label.charCodeAt(0) <= 90)) return null;

  return obj;
};
