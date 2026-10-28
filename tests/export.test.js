// bun test: the pure parts of the image export (E125)
import { describe, expect, test } from 'bun:test';
import { documentSvg, fileName, imageUrls, inlineImages, withSize } from '../client/editor/export.js';
import { addPhoto, emptyNode } from '../client/editor/model.js';

const HASH = 'a'.repeat(64);
const info = { href: '/files/uploads/a.jpg?x=1&y=2', width: 400, height: 400 };

const doc = () => {
  const node = emptyNode();

  return addPhoto(node, node.pages[0].id, HASH, info, 'photo001');
};

describe('documentSvg', () => {
  test('is the stage as SVG text with the photo as an image', () => {
    const svg = documentSvg(doc(), { photos: () => info });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 1000 1000"');
    expect(imageUrls(svg)).toEqual(['/files/uploads/a.jpg?x=1&y=2']);
  });
});

describe('inlineImages and withSize', () => {
  const svg = '<svg viewBox="0 0 1000 1000"><g><image href="/a.jpg" x="0"/><image href="/b.jpg"/><image href="/a.jpg"/></g></svg>';

  test('lists each url once', () => {
    expect(imageUrls(svg)).toEqual(['/a.jpg', '/b.jpg']);
  });

  test('replaces known urls and leaves unknown ones', () => {
    const out = inlineImages(svg, new Map([['/a.jpg', 'data:image/jpeg;base64,AAA']]));

    expect(out).toContain('href="data:image/jpeg;base64,AAA" x="0"');
    expect(out).toContain('href="/b.jpg"');
    expect(out.match(/data:image/g)).toHaveLength(2);
  });

  test('a url with an ampersand is matched in its decoded form', () => {
    const out = inlineImages('<svg><image href="/a.jpg?x=1&amp;y=2"/></svg>', new Map([['/a.jpg?x=1&y=2', 'data:image/jpeg;base64,BBB']]));

    expect(out).toContain('data:image/jpeg;base64,BBB');
  });

  test('withSize sets the pixel size and keeps the viewBox', () => {
    expect(withSize(svg, 2000)).toBe(svg.replace('<svg', '<svg width="2000" height="2000"'));
  });
});

describe('fileName', () => {
  test('letters and digits, the rest a dash, the extension from the format', () => {
    expect(fileName('Mein Werk: Nr. 1!')).toBe('Mein-Werk-Nr-1.png');
    expect(fileName('Écran été', 'jpg')).toBe('Ecran-ete.jpg');
  });

  test('without a title it is wild-beauty', () => {
    expect(fileName('')).toBe('wild-beauty.png');
    expect(fileName(undefined, 'jpg')).toBe('wild-beauty.jpg');
    expect(fileName('???')).toBe('wild-beauty.png');
  });
});
