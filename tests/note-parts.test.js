import { describe, expect, test } from 'bun:test';
import { insertAt } from '../client/components/NoteParts.js';

describe('insertAt', () => {
  test('into an empty note, no comma', () => {
    expect(insertAt('', 0, 0, 'Knysna')).toEqual({ text: 'Knysna', at: 6 });
  });

  test('after text a comma joins it, after a comma or a line break none', () => {
    expect(insertAt('Knysna', 6, 6, '14:32')).toEqual({ text: 'Knysna, 14:32', at: 13 });
    expect(insertAt('Knysna, ', 8, 8, '14:32').text).toBe('Knysna, 14:32');
    expect(insertAt('Knysna\n', 7, 7, '14:32').text).toBe('Knysna\n14:32');
  });

  test('a selection is replaced and the text behind it stays', () => {
    expect(insertAt('abc def', 0, 3, 'X')).toEqual({ text: 'X def', at: 1 });
  });
});
