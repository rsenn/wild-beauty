// bun test: GET /api/edges/<hash> runs `opencv-imgproc edgemap` and hands the PNG on (the lasso, docs/WAND.md 0)
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('the edge map route', () => {
  test('edgeArgs asks for the photo, the PNG, a clamped size and the cache', async () => {
    const { edgeArgs } = await import('../server/api/edges.js');
    const args = edgeArgs({ file: '/p/a.jpg', out: '/o/e.png', size: 640, cache: '/c' });

    expect(args.slice(0, 5)).toEqual(['edgemap', '--in', '/p/a.jpg', '--out', '/o/e.png']);
    expect(args[args.indexOf('--size') + 1]).toBe('640');
    expect(args[args.indexOf('--cache-dir') + 1]).toBe('/c');
    expect(args).not.toContain('--models-dir');
    expect(edgeArgs({ file: 'f', out: 'o', size: 99999, cache: 'c' })[6]).toBe('1024');
    expect(edgeArgs({ file: 'f', out: 'o', size: 3, cache: 'c' })[6]).toBe('128');
    expect(edgeArgs({ file: 'f', out: 'o', size: NaN, cache: 'c' })[6]).toBe('640');
    expect(edgeArgs({ file: 'f', out: 'o', cache: 'c', models: '/m' }).slice(-2)).toEqual(['--models-dir', '/m']);
  });

  // a fake tool: writes a PNG at --out and prints the result line, as edgemap does
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'edges-'));
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin', 'fake-imgproc'), `#!/bin/sh
out=""
while [ $# -gt 0 ]; do [ "$1" = "--out" ] && out="$2"; shift; done
printf '\\211PNG fake' > "$out"
echo '{"event":"result","ok":true,"command":"edgemap","output":{"path":"'"$out"'","width":8,"height":6},"detector":"none","cached":false}'
`);
    chmodSync(join(dir, 'bin', 'fake-imgproc'), 0o755);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  test('refuses a bad hash and answers 404 for a photo that is not there', async () => {
    const { edgesRoute } = await import('../server/api/edges.js');

    expect((await edgesRoute(new Request('http://x/api/edges/zz'), 'zz')).status).toBe(400);
    expect((await edgesRoute(new Request('http://x/api/edges/' + '0'.repeat(64)), '0'.repeat(64))).status).toBe(404);
  });

  test('answers 503 when the tool is not installed', async () => {
    const { config } = await import('../server/config.js');
    const { edgesRoute } = await import('../server/api/edges.js');
    const hash = 'a'.repeat(64);

    mkdirSync(config.uploadsDir, { recursive: true });
    writeFileSync(join(config.uploadsDir, `${hash}.jpg`), 'x');

    const before = process.env.WB_IMGPROC;

    process.env.WB_IMGPROC = join(dir, 'bin', 'no-such-tool');

    try {
      expect((await edgesRoute(new Request('http://x/api/edges/' + hash), hash)).status).toBe(503);

      // and with a tool that answers: the PNG and which detector ran
      process.env.WB_IMGPROC = join(dir, 'bin', 'fake-imgproc');

      const res = await edgesRoute(new Request('http://x/api/edges/' + hash), hash);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('image/png');
      expect(res.headers.get('x-edge-detector')).toBe('none');
      expect(new TextDecoder().decode(await res.arrayBuffer())).toContain('PNG fake');
    } finally {
      if(before === undefined) delete process.env.WB_IMGPROC;
      else process.env.WB_IMGPROC = before;

      rmSync(join(config.uploadsDir, `${hash}.jpg`), { force: true });
    }
  });
});
