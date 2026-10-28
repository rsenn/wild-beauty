// bun test: geometry helpers of the usage recorder
import { expect, test } from 'bun:test';
import { distance, nearest } from '../client/events.js';

test('distance is 0 inside a box and euclidean outside', () => {
  expect(distance(15, 15, [10, 10, 20, 20])).toBe(0);
  expect(distance(0, 10, [10, 10, 20, 20])).toBe(10);
  expect(distance(0, 0, [3, 4, 5, 5])).toBe(5);
});

test('nearest names the closest control within reach, else null', () => {
  const items = [{ key: 'a', box: [0, 0, 10, 10] }, { key: 'b', box: [100, 0, 10, 10] }];

  expect(nearest(20, 5, items)).toEqual({ key: 'a', box: [0, 0, 10, 10], d: 10 });
  expect(nearest(95, 5, items)?.key).toBe('b');
  expect(nearest(300, 300, items)).toBeNull();
});
