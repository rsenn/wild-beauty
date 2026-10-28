// bun test: server/api/graph.js and client/graph/layout.js
import { beforeEach, describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { insertNode } from '../server/db/nodes.js';
import { applyOp, graphOf, graphRoute } from '../server/api/graph.js';
import { bounds, seed, settled, step } from '../client/graph/layout.js';

const doc = { v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {} };
let h;
let a;
let b;

const post = ops => graphRoute(new Request('http://x/api/graph/ops', { method: 'POST', body: JSON.stringify({ ops }) }), h);

beforeEach(async () => {
  h = await open(':memory:');
  a = insertNode(h, { title: 'A', doc, palette: [{ hex: '#112233', weight: 1 }] }).id;
  b = insertNode(h, { title: 'B', doc }).id;
});

describe('graph ops', () => {
  test('link, twice is a no-op, unlink', () => {
    expect(applyOp(h, { op: 'link', from: a, to: b })).toBe(true);
    expect(applyOp(h, { op: 'link', from: a, to: b })).toBe(false);
    expect(graphOf(h).edges).toEqual([{ from: a, to: b, label: 'child' }]);
    expect(applyOp(h, { op: 'unlink', from: a, to: b })).toBe(true);
    expect(graphOf(h).edges).toEqual([]);
  });

  test('resort puts an existing link behind the others, in the order of the operations', () => {
    const c = insertNode(h, { title: 'C', doc }).id;

    applyOp(h, { op: 'link', from: a, to: b });
    applyOp(h, { op: 'link', from: a, to: c });
    expect(applyOp(h, { op: 'link', from: a, to: b })).toBe(false);
    expect(applyOp(h, { op: 'link', from: a, to: b, resort: true })).toBe(true);
    expect(h.all('SELECT to_id FROM node_links WHERE from_id = ? ORDER BY sort', a).map(r => r.to_id)).toEqual([c, b]);
  });

  test('group makes a list node with the members as ordered children; ungroup takes only it away', () => {
    const c = insertNode(h, { title: 'C', doc }).id;

    expect(applyOp(h, { op: 'group', title: 'Trio', ids: [c, a, b], x: 5, y: 6 })).toBe(true);

    const { nodes, edges } = graphOf(h);
    const g = nodes.find(n => n.kind === 'list');

    expect(g).toMatchObject({ title: 'Trio', x: 5, y: 6, pinned: true });
    expect(edges.filter(e => e.from === g.id).map(e => e.to)).toEqual([c, a, b]);
    expect(applyOp(h, { op: 'ungroup', id: a })).toBe(false);
    expect(applyOp(h, { op: 'ungroup', id: g.id })).toBe(true);
    expect(graphOf(h).nodes.length).toBe(3);
    expect(graphOf(h).edges).toEqual([]);
    expect(() => applyOp(h, { op: 'group', ids: [a, a], x: 0, y: 0 })).toThrow('bad_op');
    expect(() => applyOp(h, { op: 'group', ids: [a, 999], x: 0, y: 0 })).toThrow('not_found');
  });

  test('malformed operations are refused', () => {
    for(const op of [null, {}, { op: 'link', from: a, to: a }, { op: 'link', from: a, to: b, label: 'x' }, { op: 'move', id: a, x: 'no', y: 1 }, { op: 'move', id: a, x: 1e9, y: 1 }, { op: 'pin', id: a }]) expect(() => applyOp(h, op)).toThrow('bad_op');

    expect(() => applyOp(h, { op: 'link', from: a, to: 999 })).toThrow('not_found');
  });

  test('move keeps the place and pins; unknown id changes nothing', () => {
    expect(applyOp(h, { op: 'move', id: a, x: 10, y: -20, pinned: true })).toBe(true);
    expect(applyOp(h, { op: 'move', id: 999, x: 1, y: 1 })).toBe(false);

    const n = graphOf(h).nodes.find(x => x.id === a);

    expect(n).toMatchObject({ x: 10, y: -20, pinned: true, color: '#112233' });
    applyOp(h, { op: 'pin', id: a, pinned: false });
    expect(graphOf(h).nodes.find(x => x.id === a).pinned).toBe(false);
  });

  test('the route applies all or nothing', async () => {
    const r = await post([{ op: 'link', from: a, to: b }, { op: 'link', from: a, to: 999 }]);

    expect(r.status).toBe(404);
    expect(graphOf(h).edges).toEqual([]);
    expect((await post([{ op: 'link', from: a, to: b }])).status).toBe(200);
    expect(graphOf(h).edges.length).toBe(1);
  });
});

describe('layout', () => {
  test('stored places are kept, pinned nodes stay, the rest settles apart', () => {
    const nodes = [{ id: 1, x: 0, y: 0, pinned: true }, { id: 2 }, { id: 3 }];
    const edges = [{ from: 1, to: 2 }, { from: 2, to: 3 }];
    const bodies = seed(nodes, edges);
    let fastest = 1;

    for(let i = 0; i < 600 && !settled(fastest); i++) fastest = step(bodies, edges, 1);

    expect(bodies.get(1)).toMatchObject({ x: 0, y: 0 });
    expect(Math.hypot(bodies.get(2).x, bodies.get(2).y)).toBeGreaterThan(50);
    expect(Math.hypot(bodies.get(2).x - bodies.get(3).x, bodies.get(2).y - bodies.get(3).y)).toBeGreaterThan(50);
    expect(bounds(bodies).w).toBeGreaterThan(100);
  });
});
