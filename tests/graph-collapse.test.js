// bun test: client/graph/collapse.js (docs/GRAPH.md S2.8)
import { describe, expect, test } from 'bun:test';
import { SMALL, collapse, everything } from '../client/graph/collapse.js';

const n = id => ({ id, title: `n${id}` });
const graph = {
  nodes: [1, 2, 3, 4, 5, 6, 7].map(n),
  edges: [{ from: 1, to: 2, label: 'child' }, { from: 1, to: 3, label: 'child' }, { from: 3, to: 4, label: 'child' }, { from: 2, to: 7, label: 'ref' }, { from: 5, to: 6, label: 'child' }],
};

describe('collapse', () => {
  test('only the roots at first, with the number of hidden members', () => {
    const r = collapse(graph, new Set());

    expect(r.nodes.map(x => [x.id, x.more])).toEqual([[1, 2], [5, 1], [7, 0]]);
    expect(r.edges).toEqual([]);
  });

  test('expanding a node shows its members, and theirs only when they are expanded too', () => {
    const r = collapse(graph, new Set([1]));

    expect(r.nodes.map(x => [x.id, x.more])).toEqual([[1, 0], [2, 0], [3, 1], [5, 1], [7, 0]]);
    expect(r.edges).toEqual([{ from: 1, to: 2, label: 'child' }, { from: 1, to: 3, label: 'child' }, { from: 2, to: 7, label: 'ref' }]);
    expect(collapse(graph, new Set([3])).nodes.map(x => x.id)).toEqual([1, 5, 7]); // 3 is hidden: expanding it shows nothing yet
    expect(collapse(graph, new Set([1, 3])).nodes.map(x => x.id)).toEqual([1, 2, 3, 4, 5, 7]);
  });

  test('everything open shows all; a small graph is meant to start so', () => {
    expect(collapse(graph, everything(graph)).nodes.length).toBe(7);
    expect(SMALL).toBe(12);
  });

  test('a ring of members still shows something', () => {
    const ring = { nodes: [n(1), n(2)], edges: [{ from: 1, to: 2, label: 'child' }, { from: 2, to: 1, label: 'child' }] };

    expect(collapse(ring, new Set()).nodes.length).toBe(2);
  });
});
