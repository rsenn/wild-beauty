// bun test: the manifest and the service worker responses
import { expect, test } from 'bun:test';
import { manifestResponse, workerResponse } from '../server/pwa.js';

test('the manifest is installable', async () => {
  const res = manifestResponse();
  const m = await res.json();

  expect(res.headers.get('content-type')).toBe('application/manifest+json');
  expect(m.display).toBe('standalone');
  expect(m.start_url).toBe('/');
  expect(m.icons.some(i => i.sizes === '192x192')).toBe(true);
  expect(m.icons.some(i => i.sizes === '512x512' && !i.purpose)).toBe(true);
});

test('the worker has a fetch handler and the whole-site scope', async () => {
  const res = workerResponse();

  expect(await res.text()).toContain("addEventListener('fetch'");
  expect(res.headers.get('service-worker-allowed')).toBe('/');
});
