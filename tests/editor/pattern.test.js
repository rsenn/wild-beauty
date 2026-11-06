// bun test: client/editor/core/pattern.js
import { describe, expect, test } from 'bun:test';
import { dateText, fillPattern, isPlaceholder, partsOf, timeText } from '../../client/editor/core/pattern.js';

const all = { date: '15 April 2026', location: 'Plettenberg Bay', pseudonym: 'Jane Doe' };

describe('fillPattern', () => {
  test('the default title pattern', () => {
    const p = '{date} [{location}] {pseudonym}';

    expect(fillPattern(p, all)).toBe('15 April 2026 Plettenberg Bay Jane Doe');
    expect(fillPattern(p, { ...all, location: '' })).toBe('15 April 2026 Jane Doe');
    expect(fillPattern(p, { pseudonym: 'Jane Doe' })).toBe('Jane Doe');
    expect(fillPattern(p, {})).toBe('');
  });

  test('the default description pattern and its dangling comma', () => {
    expect(fillPattern('{location}, {date}', all)).toBe('Plettenberg Bay, 15 April 2026');
    expect(fillPattern('{location}, {date}', { date: '15 April 2026' })).toBe('15 April 2026');
    expect(fillPattern('{location}, {date}', { location: 'Knysna' })).toBe('Knysna');
  });

  test('a bracket with two placeholders needs both, unknown ones are empty, no placeholders is plain text', () => {
    expect(fillPattern('{date}[ by {pseudonym} in {location}]', { date: 'D', pseudonym: 'P' })).toBe('D');
    expect(fillPattern('{date}[ by {pseudonym} in {location}]', { date: 'D', pseudonym: 'P', location: 'L' })).toBe('D by P in L');
    expect(fillPattern('{nothing} x', all)).toBe('x');
    expect(fillPattern('fixed text', all)).toBe('fixed text');
  });
});

describe('dateText', () => {
  test('one day, a range, nothing', () => {
    expect(dateText('2026-04-15T14:03:22', '2026-04-15T18:00:00', 'en')).toBe('April 15, 2026');
    expect(dateText('2026-04-15', '2026-04-18', 'en')).toMatch(/April 15\s*[–-]\s*18, 2026/);
    expect(dateText(null)).toBe('');
  });
});

describe('time and placeholder notes (docs/BATCH.md S6a2)', () => {
  const parts = partsOf({ place: 'Plettenberg Bay', taken: '2026-04-15T14:32:10' }, 'en');

  test('timeText and the {time} placeholder', () => {
    expect(timeText('2026-04-15T14:32:10')).toBe('14:32');
    expect(timeText('2026-04-15')).toBe('');
    expect(timeText(null)).toBe('');
    expect(fillPattern('{location}, {date}, {time}', parts)).toBe('Plettenberg Bay, April 15, 2026, 14:32');
    expect(fillPattern('{location}[, {time}]', { location: 'Knysna' })).toBe('Knysna');
  });

  test('a note made only of the photo\'s own place, date and time is a placeholder', () => {
    expect(isPlaceholder('Plettenberg Bay, April 15, 2026', parts)).toBe(true);
    expect(isPlaceholder('Plettenberg Bay', parts)).toBe(true);
    expect(isPlaceholder('April 15, 2026, 14:32', parts)).toBe(true);
    expect(isPlaceholder('Plettenberg Bay, April 15, 2026, 14:32', parts)).toBe(true);
  });

  test('one written word, another place, a second line or no note is not', () => {
    expect(isPlaceholder('Plettenberg Bay, April 15, 2026 - the beach', parts)).toBe(false);
    expect(isPlaceholder('Knysna, April 15, 2026', parts)).toBe(false);
    expect(isPlaceholder('Plettenberg Bay\n\nWe arrived.', parts)).toBe(false);
    expect(isPlaceholder('', parts)).toBe(false);
    expect(isPlaceholder('Plettenberg Bay', {})).toBe(false);
  });
});
