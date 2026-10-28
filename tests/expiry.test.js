// bun test: what an upload card says about its expiry (E111)
import { describe, expect, test } from 'bun:test';

describe('expiry note', () => {
  test('only when the end is near', async () => {
    const { expiryNote } = await import('../client/files.js');
    const now = 1e12;
    const day = 24 * 3600 * 1000;

    expect(expiryNote(now + 6 * day, now)).toBeNull();
    expect(expiryNote(now + 2.5 * day, now)).toEqual({ key: 'upload.expires.days', count: 3 });
    expect(expiryNote(now + 1.5 * day, now)).toEqual({ key: 'upload.expires.tomorrow' });
    expect(expiryNote(now + 0.5 * day, now)).toEqual({ key: 'upload.expires.today' });
    expect(expiryNote(now - 1, now)).toBeNull();
    expect(expiryNote(undefined, now)).toBeNull();
  });
});
