import { describe, expect, test } from 'bun:test';
import { deviceOf, isPage, kindOf, knownAddresses, looksHuman, parseLine, visits } from '../tools/visitors.js';

const line = (ip, time, path, ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:159.0) Gecko/20100101 Firefox/159.0', status = 200, ref = '-') => `${ip} - - [${time}] "GET ${path} HTTP/2.0" ${status} 100 "${ref}" "${ua}"`;

describe('parseLine', () => {
  test('time with its zone, address, path, status, referrer and agent', () => {
    const r = parseLine(line('1.2.3.4', '05/Nov/2026:15:01:23 +0100', '/de/node/41', 'UA', 200, 'https://x.example/'));

    expect(r).toMatchObject({ ip: '1.2.3.4', path: '/de/node/41', status: 200, referrer: 'https://x.example/', ua: 'UA' });
    expect(new Date(r.at).toISOString()).toBe('2026-11-05T14:01:23.000Z');
    expect(parseLine('garbage')).toBe(null);
  });
});

describe('kindOf, isPage, deviceOf', () => {
  test('previews, bots and browsers', () => {
    expect(kindOf('TelegramBot (like TwitterBot)')).toBe('preview');
    expect(kindOf('WhatsApp/2.23.20.0 A')).toBe('preview');
    expect(kindOf('Mozilla/5.0 (compatible; CensysInspect/1.1)')).toBe('bot');
    expect(kindOf('curl/8.5.0')).toBe('bot');
    expect(kindOf('Mozilla/5.0 (X11; Linux x86_64; rv:159.0) Gecko/20100101 Firefox/159.0')).toBe('visitor');
  });

  test('pages of the site, not files, the API or probes', () => {
    for(const p of ['/', '/en/node/63', '/de/view', '/en/gallery?x=1', '/de/node/63?view=carousel&at=n55']) expect(isPage(p)).toBe(true);
    for(const p of ['/files/photos/a.jpg', '/api/nodes/63', '/?phpinfo=-1', '/?url=.env', '/static/css/layout.css']) expect(isPage(p)).toBe(false);
  });

  test('a short device name', () => {
    expect(deviceOf('Mozilla/5.0 (X11; Linux x86_64; rv:159.0) Gecko/20100101 Firefox/159.0')).toBe('Firefox 159, Linux');
    expect(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1')).toBe('Safari 604, iOS');
  });
});

describe('visits', () => {
  const at = (min, path, status = 200, ref = '-', ip = '1.1.1.1', ua = 'U') => ({ ip, ua, at: Date.UTC(2026, 10, 5, 12, min), path, status, referrer: ref });

  test('a quiet gap of more than 30 minutes starts a new visit; pages, photos and files are counted apart', () => {
    const v = visits([at(0, '/en/node/63'), at(1, '/static/css/layout.css'), at(2, '/files/photos/a.jpg'), at(3, '/en/node/64'), at(60, '/en/node/63')]);

    expect(v.length).toBe(2);
    expect(v[0]).toMatchObject({ pages: ['/en/node/63', '/en/node/64'], files: 1, assets: 1 });
    expect(v[1].pages).toEqual(['/en/node/63']);
  });

  test('another browser on the same address is another visit; a failed request is no page', () => {
    expect(visits([at(0, '/', 200, '-', '1.1.1.1', 'A'), at(1, '/', 200, '-', '1.1.1.1', 'B')]).length).toBe(2);
    expect(visits([at(0, '/en/node/9', 404)]).length).toBe(0);
  });

  test('looksHuman wants the files of the page and more than the front page', () => {
    expect(looksHuman({ assets: 3, files: 0, referrer: '', pages: ['/', '/en/gallery'] })).toBe(true);
    expect(looksHuman({ assets: 0, files: 0, referrer: '', pages: ['/en/gallery'] })).toBe(false);
    expect(looksHuman({ assets: 2, files: 0, referrer: '', pages: ['/'] })).toBe(false);
    expect(looksHuman({ assets: 2, files: 0, referrer: 'https://www.google.com/', pages: ['/'] })).toBe(true);
  });
});

describe('knownAddresses', () => {
  test('addresses with a logged-in user', () => {
    const known = knownAddresses(['{"ip":"1.1.1.1","user":"a@b.c"}', '{"ip":"2.2.2.2"}', 'not json']);

    expect([...known.keys()]).toEqual(['1.1.1.1']);
  });
});
