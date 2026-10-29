import { describe, expect, test } from 'bun:test';


describe('the subjects of a result (outlines as fractions)', () => {
  test('outlines are divided by the output size; bad ones and results without any give {}', async () => {
    const { subjects } = await import('../server/api/cutout.js');
    const event = { output: { width: 200, height: 100 }, outlines: [{ polygon: [[0, 0], [100, 0], [100, 50]] }, { polygon: [[1, 1]] }, { polygon: 'x' }] };

    expect(subjects(event)).toEqual({ outlines: [[[0, 0], [0.5, 0], [0.5, 0.5]]] });
    expect(subjects({ output: { width: 200, height: 100 } })).toEqual({});
    expect(subjects({})).toEqual({});
  });
});
