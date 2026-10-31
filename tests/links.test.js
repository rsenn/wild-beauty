// bun test: client/editor/links.js
import { describe, expect, test } from 'bun:test';
import { cleanUrl, detect, htmlWords, normalizeShared, platformOf, vcardLines } from '../client/editor/links.js';

const types = text => detect(text).map(l => [l.type, l.text, l.href]);

describe('detect', () => {
  test('mail and phone numbers', () => {
    expect(types('Mail janos@example.ch.')).toEqual([['email', 'janos@example.ch', 'mailto:janos@example.ch']]);
    expect(types('+41 79 123 45 67')).toEqual([['tel', '+41 79 123 45 67', 'tel:+41791234567']]);
    expect(types('0041 79 123 45 67')).toEqual([['tel', '0041 79 123 45 67', 'tel:+41791234567']]);
    expect(types('079 123 45 67')).toEqual([['tel', '079 123 45 67', 'tel:0791234567']]);
    expect(types('(044) 123 45 67')).toEqual([['tel', '(044) 123 45 67', 'tel:0441234567']]);
  });

  test('a date, a price or a short number is not a phone number', () => {
    expect(types('am 12.03.2025 um 14:30, 1500.50 CHF, Zimmer 042')).toEqual([]);
  });

  test('platforms, with and without the scheme', () => {
    expect(types('https://www.facebook.com/janos.art')[0].slice(0, 2)).toEqual(['facebook', 'https://www.facebook.com/janos.art']);
    expect(types('fb.com/janos.art')[0][0]).toBe('facebook');
    expect(types('instagram.com/janos')[0]).toEqual(['instagram', 'instagram.com/janos', 'https://instagram.com/janos']);
    expect(types('https://www.youtube.com/@janos')[0][0]).toBe('youtube');
    expect(types('https://youtu.be/dQw4w9WgXcQ')[0][0]).toBe('youtube');
    expect(types('https://www.tiktok.com/@janos')[0][0]).toBe('tiktok');
    expect(types('https://x.com/janos')[0][0]).toBe('x');
    expect(types('https://twitter.com/janos')[0][0]).toBe('x');
    expect(types('https://www.linkedin.com/in/janos')[0][0]).toBe('linkedin');
    expect(types('https://t.me/janos')[0][0]).toBe('telegram');
    expect(types('https://open.spotify.com/artist/abc')[0][0]).toBe('spotify');
    expect(types('https://janos.bandcamp.com')[0][0]).toBe('bandcamp');
    expect(types('https://bsky.app/profile/janos.bsky.social')[0][0]).toBe('bluesky');
    expect(types('https://maps.app.goo.gl/abc')[0][0]).toBe('map');
    expect(types('www.janos.ch/art')[0]).toEqual(['website', 'www.janos.ch/art', 'https://www.janos.ch/art']);
  });

  test('WhatsApp in every form a phone gives', () => {
    expect(types('wa.me/41791234567')[0]).toEqual(['whatsapp', 'wa.me/41791234567', 'https://wa.me/41791234567']);
    expect(types('whatsapp://send?phone=+41791234567')[0]).toEqual(['whatsapp', 'whatsapp://send?phone=+41791234567', 'https://wa.me/41791234567']);
    expect(types('https://chat.whatsapp.com/ABCdef')[0][0]).toBe('whatsapp');
  });

  test('mailto, tel, sms, geo and a fediverse handle', () => {
    expect(types('mailto:a@b.ch?subject=Hi')[0]).toEqual(['email', 'mailto:a@b.ch?subject=Hi', 'mailto:a@b.ch']);
    expect(types('tel:+41791234567')[0][2]).toBe('tel:+41791234567');
    expect(types('sms:+41791234567')[0][2]).toBe('sms:+41791234567');
    expect(types('geo:47.37,8.54')[0]).toEqual(['map', 'geo:47.37,8.54', 'geo:47.37,8.54']);
    expect(types('@janos@mastodon.social')[0][2]).toBe('https://mastodon.social/@janos');
  });

  test('a link inside a sentence loses its punctuation and brackets', () => {
    expect(types('(siehe https://instagram.com/janos).')[0][1]).toBe('https://instagram.com/janos');
    expect(types('Seite: www.janos.ch,')[0][1]).toBe('www.janos.ch');
    expect(types('https://de.wikipedia.org/wiki/Foo_(Bar)')[0][1]).toBe('https://de.wikipedia.org/wiki/Foo_(Bar)');
  });

  test('only safe schemes become links', () => {
    expect(types('javascript:alert(1) data:text/html,x file:///etc/passwd ftp://x.ch')).toEqual([]);
    expect(types('http://localhost/x')).toEqual([]); // not a public name
  });

  test('positions point into the text, in order, without overlap', () => {
    const text = 'a janos@x.ch b https://x.ch/?m=janos@x.ch c';
    const found = detect(text);

    expect(found.map(f => text.slice(f.start, f.end))).toEqual(found.map(f => f.text));
    expect(found.map(f => f.type)).toEqual(['email', 'website']);
  });
});

describe('share and clipboard', () => {
  test('tracking parameters go, the target stays', () => {
    expect(cleanUrl('https://www.instagram.com/p/Cabc/?igsh=MXg3&utm_source=ig_web')).toBe('https://www.instagram.com/p/Cabc/');
    expect(cleanUrl('https://youtu.be/dQw4w9WgXcQ?si=abc&t=42')).toBe('https://youtu.be/dQw4w9WgXcQ?t=42');
    expect(cleanUrl('https://www.facebook.com/profile.php?id=123&mibextid=abc')).toBe('https://www.facebook.com/profile.php?id=123');
    expect(cleanUrl('https://x.com/janos?s=20')).toBe('https://x.com/janos');
    expect(cleanUrl('https://example.ch/?s=search')).toBe('https://example.ch/?s=search');
  });

  test('normalizeShared: contact URIs read as themselves, deep links as web links', () => {
    expect(normalizeShared('mailto:foo@bar.ch')).toBe('foo@bar.ch');
    expect(normalizeShared('tel:+41791234567')).toBe('+41791234567');
    expect(normalizeShared('whatsapp://send?phone=+41791234567')).toBe('https://wa.me/41791234567');
    expect(normalizeShared('Schau mal\r\nhttps://youtu.be/abc?si=zzz')).toBe('Schau mal\nhttps://youtu.be/abc');
    expect(normalizeShared('instagram.com/janos?igsh=x')).toBe('instagram.com/janos');
    expect(normalizeShared('@janos@mastodon.social')).toBe('@janos@mastodon.social');
  });

  test('a vCard becomes lines', () => {
    const card = 'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Morzsinay;János;;;\r\nFN:János Morzsinay\r\nORG:Atelier\r\nTEL;TYPE=CELL:+41 79 111 22 33\r\nEMAIL;TYPE=INTERNET:j@x.ch\r\nURL:https://janos.ch\r\nEND:VCARD';

    expect(vcardLines(card)).toEqual(['János Morzsinay', 'Atelier', '+41 79 111 22 33', 'j@x.ch', 'https://janos.ch']);
    expect(normalizeShared(card)).toBe('János Morzsinay\nAtelier\n+41 79 111 22 33\nj@x.ch\nhttps://janos.ch');
  });

  test('html: the target of a link is kept when the label does not say it', () => {
    expect(htmlWords('<p>Siehe <a href="https://instagram.com/janos">Instagram</a></p>')).toContain('Instagram https://instagram.com/janos');
    expect(htmlWords('<a href="https://instagram.com/janos">instagram.com/janos</a>').trim()).toBe('instagram.com/janos');
    expect(htmlWords('<a href="javascript:x()">hi</a>').trim()).toBe('hi');
  });

  test('platformOf', () => {
    expect(platformOf('m.facebook.com')).toBe('facebook');
    expect(platformOf('www.google.com')).toBe('website');
    expect(platformOf('maps.google.com')).toBe('map');
  });
});

describe('render and paste', () => {
  const step = text => ({ op: 'text', id: 'abcd1234', text, lines: [text], m: [1, 0, 0, 1, 0, 0], w: 600, h: 60, font: 'sans', size: 40, color: '#111111', align: 'start', padding: 0, radius: 0 });

  test('links only when asked, and only the safe ones', async () => {
    const { renderToString } = await import('../vendor/preact-render-to-string.js');
    const { renderText } = await import('../client/editor/render.js');
    const show = (text, links) => renderToString(renderText(step(text), undefined, { links }));

    expect(show('janos@example.ch', false)).not.toContain('<a');
    expect(show('janos@example.ch', true)).toContain('<a href="mailto:janos@example.ch"');
    expect(show('javascript:alert(1) x', true)).not.toContain('<a');
  });

  test('classify tidies a phone share', async () => {
    const { classify } = await import('../client/editor/clipboard.js');

    expect(classify({ text: 'Schau\nhttps://www.instagram.com/janos/?igsh=abc' })).toEqual({ kind: 'text', text: 'Schau\nhttps://www.instagram.com/janos/' });
    expect(classify({ vcard: 'BEGIN:VCARD\nFN:J\nTEL:+41 79 1 22 33 44\nEND:VCARD' }).text).toBe('J\n+41 79 1 22 33 44');
    expect(classify({ uriList: '# c\nhttps://youtu.be/abc?si=x' }).text).toBe('https://youtu.be/abc');
    expect(classify({ html: '<a href="https://instagram.com/janos">Instagram</a>' }).text).toBe('Instagram https://instagram.com/janos');
  });
});
