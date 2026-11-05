// bun test: the graph ops `order` and the child cycle check (docs/GRAPH.md S1.2)
import { describe, expect, test } from 'bun:test';
import { open } from '../server/db/db.js';
import { addLink, insertNode, linksFrom } from '../server/db/nodes.js';
import { applyOp, reaches } from '../server/api/graph.js';

const emptyDoc = { v: 1, mode: 'free', pages: [{ id: 'page0001', steps: [] }], style: {} };

async function setup(n) {
  const h = await open(':memory:');
  const ids = Array.from({ length: n }, (_, i) => insertNode(h, { title: `n${i}`, doc: emptyDoc, kind: 'list' }).id);

  return { h, ids };
}

describe('op order', () => {
  test('the members take the new order, the rest keep their places', async () => {
    const { h, ids } = await setup(5);
    const [p, a, b, c, d] = ids;

    [a, b, c, d].forEach((id, i) => addLink(h, p, id, 'child', i * 10));

    expect(applyOp(h, { op: 'order', parent: p, ids: [c, a] })).toBe(true); // a and c swap, b and d stay
    expect(linksFrom(h, p, 'child').map(l => l.id)).toEqual([c, b, a, d]);
    expect(applyOp(h, { op: 'order', parent: p, ids: [d, c, b, a] })).toBe(true);
    expect(linksFrom(h, p, 'child').map(l => l.id)).toEqual([d, c, b, a]);
    expect(applyOp(h, { op: 'order', parent: p, ids: [d, c] })).toBe(false); // already so
    h.close();
  });

  test('equal sort values are made distinct', async () => {
    const { h, ids } = await setup(4);
    const [p, a, b, c] = ids;

    [a, b, c].forEach(id => addLink(h, p, id, 'child', 0));
    applyOp(h, { op: 'order', parent: p, ids: [c, b, a] });

    expect(linksFrom(h, p, 'child').map(l => l.id)).toEqual([c, b, a]);
    h.close();
  });

  test('bad input', async () => {
    const { h, ids } = await setup(3);
    const [p, a, b] = ids;

    addLink(h, p, a, 'child', 0);

    expect(() => applyOp(h, { op: 'order', parent: p, ids: [a] })).toThrow('bad_op');
    expect(() => applyOp(h, { op: 'order', parent: p, ids: [a, a] })).toThrow('bad_op');
    expect(() => applyOp(h, { op: 'order', parent: p, ids: [a, b] })).toThrow('not_found');
    h.close();
  });
});

describe('child cycles', () => {
  test('a child link back up is refused, other labels are free', async () => {
    const { h, ids } = await setup(3);
    const [a, b, c] = ids;

    expect(applyOp(h, { op: 'link', from: a, to: b })).toBe(true);
    expect(applyOp(h, { op: 'link', from: b, to: c })).toBe(true);
    expect(reaches(h, a, c)).toBe(true);
    expect(reaches(h, c, a)).toBe(false);
    expect(() => applyOp(h, { op: 'link', from: c, to: a })).toThrow('cycle');
    expect(() => applyOp(h, { op: 'link', from: b, to: a })).toThrow('cycle');
    expect(() => applyOp(h, { op: 'link', from: a, to: a })).toThrow('bad_op');
    expect(applyOp(h, { op: 'link', from: c, to: a, label: 'ref' })).toBe(true); // a cross-link may point back
    expect(applyOp(h, { op: 'link', from: a, to: c })).toBe(true); // a second parent without a loop is fine
    h.close();
  });
});
