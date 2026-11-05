// The nodes the visitor view of /tree shows (docs/GRAPH.md S2.8): the roots, and the members
// of the nodes that were expanded. Pure.

// graph { nodes, edges }, expanded: a Set of node ids ->
//   { nodes: [{ ...node, more }], edges }   `more` = members still hidden below the node
export function collapse(graph, expanded) {
  const members = new Map(); // node id -> member ids, in edge order
  const hasParent = new Set();

  for(const e of graph.edges) {
    if(e.label !== 'child') continue;

    if(!members.has(e.from)) members.set(e.from, []);

    members.get(e.from).push(e.to);
    hasParent.add(e.to);
  }

  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const shown = new Set();
  const walk = id => {
    if(shown.has(id) || !byId.has(id)) return;

    shown.add(id);

    if(expanded.has(id)) for(const kid of members.get(id) ?? []) walk(kid);
  };

  for(const n of graph.nodes) if(!hasParent.has(n.id)) walk(n.id);

  // a cycle of members would have no root: show something rather than nothing
  if(!shown.size) for(const n of graph.nodes) shown.add(n.id);

  return {
    nodes: graph.nodes.filter(n => shown.has(n.id)).map(n => ({ ...n, more: expanded.has(n.id) ? 0 : (members.get(n.id) ?? []).filter(id => byId.has(id) && !shown.has(id)).length })),
    edges: graph.edges.filter(e => shown.has(e.from) && shown.has(e.to)),
  };
}

// every node with members open, for a small graph (the first look)
export const everything = graph => new Set(graph.edges.filter(e => e.label === 'child').map(e => e.from));

export const SMALL = 12;
