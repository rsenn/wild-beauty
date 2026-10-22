// bun test: client/editor/render.js
import { describe, expect, test } from 'bun:test';
import { renderToString } from '../../vendor/preact-render-to-string.js';
import { addPhoto, emptyNode, setFit } from '../../client/editor/model.js';
import { renderNode, renderStage } from '../../client/editor/render.js';

const hash = 'a'.repeat(64);
const info = { href: '/files/uploads/a.jpg', width: 2000, height: 1000, padding: ['#112233', '#445566'] };
const photos = h => (h === hash ? info : null);

function oneStep(fit) {
  let doc = emptyNode();

  doc = { ...doc, pages: [{ id: 'page0001', steps: [] }] };
  doc = addPhoto(doc, 'page0001', hash, info, 'photo001');

  return fit === 'cover' ? setFit(doc, 'photo001', 'cover', info) : doc;
}

const render = doc => renderToString(renderStage(doc, { photos }));

describe('photo step', () => {
  test('extend: ground gradient of the padding colours, then the image', () => {
    const out = render(oneStep('extend'));

    expect(out).toBe(
      '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><g data-step="photo001" data-op="photo">' +
        '<defs><linearGradient id="ground-photo001" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#112233"></stop><stop offset="1" stop-color="#445566"></stop></linearGradient></defs>' +
        '<rect x="0" y="0" width="1000" height="1000" fill="url(#ground-photo001)"></rect>' +
        '<g transform="matrix(1 0 0 1 0 250)"><image href="/files/uploads/a.jpg" x="0" y="0" width="1000" height="500" preserveAspectRatio="none"></image></g></g></svg>',
    );
  });

  test('cover: no ground, the scaled matrix', () => {
    const out = render(oneStep('cover'));

    expect(out).not.toContain('linearGradient');
    expect(out).toContain('matrix(2 0 0 2 -500 0)');
  });

  test('opacity and blend go to the style', () => {
    const doc = oneStep('cover');

    doc.pages[0].steps[0] = { ...doc.pages[0].steps[0], opacity: 0.5, blend: 'multiply' };
    expect(render(doc)).toContain('style="opacity:0.5;mix-blend-mode:multiply"');
  });

  test('a tall photo gets a horizontal gradient', () => {
    const doc = oneStep('extend');

    expect(renderToString(renderStage(doc, { photos: () => ({ ...info, width: 1000, height: 2000 }) }))).toContain('x2="1" y2="0"');
  });

  test('hostile padding colours are dropped, unknown photos skipped', () => {
    const doc = oneStep('extend');

    expect(renderToString(renderStage(doc, { photos: () => ({ ...info, padding: ['red"/><script>', '#000'] }) }))).not.toContain('script');
    expect(render({ ...doc, pages: [{ id: 'page0001', steps: [{ ...doc.pages[0].steps[0], photo: 'b'.repeat(64) }] }] })).not.toContain('<image');
  });
});

const pageOf = (...steps) => ({ ...emptyNode(), pages: [{ id: 'page0001', steps }] });
const photo = { op: 'photo', id: 'photo001', photo: hash, m: [1, 0, 0, 1, 0, 0], fit: 'free', opacity: 1, blend: 'normal' };
const shape = { op: 'shape', id: 'shape001', path: 'M0 0L500 0L500 500Z', closed: true, fill: '#ff0000', strokeWidth: 4 };

describe('other ops', () => {
  test('stroke: a filled outline path', () => {
    const out = render(pageOf({ op: 'stroke', id: 'strok001', pts: [[100, 100, 10], [200, 100, 10], [300, 100, 10]], color: '#00ff00' }));

    expect(out).toMatch(/^<svg [^>]*><path data-step="strok001" data-op="stroke" d="M[^"]+Z" fill="#00ff00" transform="matrix\(1 0 0 1 0 0\)"><\/path><\/svg>$/);
  });

  test('shape: path, solid fill, stroke width only with a stroke', () => {
    const out = render(pageOf(shape));

    expect(out).toContain('<path d="M0 0L500 0L500 500Z" fill="#ff0000" stroke="none"></path>');
    expect(render(pageOf({ ...shape, stroke: '#000000' }))).toContain('stroke="#000000" stroke-width="4"');
  });

  test('shape: gradient fill', () => {
    const out = render(pageOf({ ...shape, fill: { type: 'linear', angle: 90, stops: [{ c: '#000000', at: 0 }, { c: '#ffffff', at: 1 }] } }));

    expect(out).toContain('<linearGradient id="fill-shape001"');
    expect(out).toContain('fill="url(#fill-shape001)"');
  });

  test('a clipped photo yields a clipPath and the shape is not drawn', () => {
    const out = render(pageOf(shape, { ...photo, clip: 'shape001' }));

    expect(out).toContain('<clipPath id="clip-shape001"><path d="M0 0L500 0L500 500Z"');
    expect(out).toContain('<g clip-path="url(#clip-shape001)"><g data-step="photo001"');
    expect(out).not.toContain('data-op="shape"');
  });

  test('clip and unclip ops, in list order', () => {
    const clipped = render(pageOf(photo, shape, { op: 'clip', target: 'photo001', shape: 'shape001' }));
    const freed = render(pageOf(photo, shape, { op: 'clip', target: 'photo001', shape: 'shape001' }, { op: 'unclip', target: 'photo001' }));

    expect(clipped).toContain('clip-path');
    expect(freed).not.toContain('clip-path');
    expect(freed).toContain('data-op="shape"');
  });

  test('blend and transform ops change the target', () => {
    const out = render(pageOf(photo, { op: 'blend', target: 'photo001', mode: 'screen' }, { op: 'transform', target: 'photo001', m: [2, 0, 0, 2, 5, 6] }));

    expect(out).toContain('mix-blend-mode:screen');
    expect(out).toContain('matrix(2 0 0 2 5 6)');
  });

  test('a transform moves a shape; hostile paths and colours are dropped', () => {
    expect(render(pageOf(shape, { op: 'transform', target: 'shape001', m: [1, 0, 0, 1, 7, 8] }))).toContain('transform="matrix(1 0 0 1 7 8)"');
    expect(render(pageOf({ ...shape, path: 'M0 0"/><script>' }))).not.toContain('script');
    expect(render(pageOf({ ...shape, fill: 'red"onload="x' }))).toContain('fill="none"');
  });

  test('unknown ops and dangling targets are ignored', () => {
    expect(() => render(pageOf({ op: 'future', id: 'futur001' }, { op: 'blend', target: 'nothing1', mode: 'screen' }))).not.toThrow();
  });
});

describe('pages, upTo and modes', () => {
  const stroke = (id, x) => ({ op: 'stroke', id, pts: [[x, 100, 10], [x + 50, 100, 10]], color: '#000000' });
  const two = { ...emptyNode(), pages: [{ id: 'page0001', steps: [stroke('strok001', 0), shape, stroke('strok002', 200), stroke('strok003', 400)] }, { id: 'page0002', steps: [stroke('strok004', 0)] }] };
  const ids = out => [...out.matchAll(/data-step="(\w+)"/g)].map(m => m[1]);

  test('upTo=k shows exactly the first k steps', () => {
    for(let k = 0; k <= 4; k++) expect(ids(renderToString(renderStage(two, { upTo: k })))).toEqual(['strok001', 'shape001', 'strok002', 'strok003'].slice(0, k));

    expect(ids(renderToString(renderStage(two)))).toHaveLength(4);
  });

  test('upTo hides the ops after it', () => {
    const doc = pageOf(photo, { op: 'blend', target: 'photo001', mode: 'screen' });

    expect(renderToString(renderStage(doc, { photos, upTo: 1 }))).not.toContain('mix-blend-mode');
    expect(renderToString(renderStage(doc, { photos, upTo: 2 }))).toContain('mix-blend-mode:screen');
  });

  test('page picks the page; a missing page is empty', () => {
    expect(ids(renderToString(renderStage(two, { page: 1 })))).toEqual(['strok004']);
    expect(ids(renderToString(renderStage(two, { page: 5 })))).toEqual([]);
  });

  const photos3 = { ...emptyNode(), pages: [{ id: 'page0001', steps: [{ ...photo, id: 'photo001', fit: 'cover' }, stroke('strok001', 0), shape] }, { id: 'page0002', steps: [{ ...photo, id: 'photo002' }, { ...photo, id: 'photo003', clip: 'shape001' }] }] };

  test('slides: one photo per page, whole, nothing else', () => {
    const out = renderToString(renderStage(photos3, { photos, mode: 'slides', page: 1 }));

    expect(ids(out)).toEqual(['photo002']);
    expect(out).toContain('matrix(1 0 0 1 0 250)');
    expect(out).toContain('linearGradient');
    expect(renderToString(renderStage(photos3, { photos, mode: 'slides', page: 9 }))).not.toContain('<image');
  });

  test('grid: every photo in its own cell, no clips, no strokes', () => {
    const out = renderToString(renderStage(photos3, { photos, mode: 'grid' }));

    expect(ids(out)).toEqual(['photo001', 'photo002', 'photo003']);
    expect(out).not.toContain('clip-path');
    expect(out).not.toContain('data-op="stroke"');
    expect(out).not.toContain('linearGradient');
  });

  test('the document mode is the default', () => {
    expect(ids(renderToString(renderStage({ ...photos3, mode: 'grid' }, { photos })))).toHaveLength(3);
  });
});

describe('theme wrapper', () => {
  const styled = style => renderToString(renderNode({ ...oneStep('extend'), style }, { photos }));

  test('wraps the stage, data-theme and vars', () => {
    const out = styled({ theme: 'blueprint', vars: { '--wb-accent': '#2a6', '--wb-radius-node': '8px' } });

    expect(out).toMatch(/^<div class="wb-node" data-theme="blueprint" style="--wb-accent:#2a6;--wb-radius-node:8px"><svg /);
  });

  test('no style: a bare wrapper that inherits, the page theme as fallback', () => {
    expect(styled({})).toMatch(/^<div class="wb-node"><svg /);
    expect(renderToString(renderNode(oneStep('extend'), { photos, theme: 'kraft' }))).toContain('data-theme="kraft"');
  });

  test('hostile vars are dropped', () => {
    const vars = {
      '--wb-accent': 'red;background:url(javascript:alert(1))',
      '--wb-ink': 'expression(alert(1))',
      '--wb-select': '#fff}body{display:none',
      '--wb-card-gap': '9999px',
      '--wb-icon-new': 'url(https://evil.example/x.png)',
      '--wb-icon-next': 'url(/static/../../etc/passwd)',
      '--wb-icon-delete': 'url(data:image/svg+xml,x)',
      '--wb-card-columns': '99',
      '--wb-tab-time': '60s',
      '--wb-font-ui': 'evil, monospace',
      '--wb-not-a-token': '1px',
      color: 'red',
      '--wb-danger': '#f30208',
      '--wb-icon-rotate': 'url(/static/img/icon-rotate.svg)',
    };
    const out = styled({ vars });

    expect(out).toContain('style="--wb-danger:#f30208;--wb-icon-rotate:url(/static/img/icon-rotate.svg)"');
  });

  test('a hostile theme id is dropped', () => {
    expect(styled({ theme: '"><script>' })).not.toContain('script');
    expect(styled({ theme: '"><script>' })).not.toContain('data-theme');
  });
});
