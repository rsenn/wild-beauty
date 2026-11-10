// bun test: the shared delete confirmation's logic (client/components/ConfirmDelete.js, docs/GRAPH.md S2.10)
import { describe, expect, test } from 'bun:test';
import { deleteNodes, outcome } from '../client/components/ConfirmDelete.js';

describe('outcome', () => {
  test('maps the answers of DELETE /api/nodes/:id', () => {
    expect([204, 404, 423, 403, 409, 500, 0].map(outcome)).toEqual(['ok', 'ok', 'locked', 'forbidden', 'site_root', 'generic', 'generic']);
  });
});

describe('deleteNodes', () => {
  test('goes one at a time and sorts what is gone from what is not', async () => {
    const asked = [];
    const answers = { 1: 204, 2: 423, 3: 404, 4: 403 };
    const r = await deleteNodes([1, 2, 3, 4], async id => (asked.push(id), answers[id]));

    expect(asked).toEqual([1, 2, 3, 4]);
    expect(r.done).toEqual([1, 3]);
    expect(r.failed).toEqual([{ id: 2, error: 'locked' }, { id: 4, error: 'forbidden' }]);
  });
});
