// bun test: client/editor/core/pattern.js
import { describe, expect, test } from 'bun:test';
import { dateText, fillPattern } from '../../client/editor/core/pattern.js';

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
