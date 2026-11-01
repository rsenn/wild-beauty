// bun test: an interrupted upload leaves nothing behind and never poisons a retry
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { run } from '../server/media/run.js';
import { detectTools, imagemagick } from '../server/media/tools.js';

setDefaultTimeout(30000);

const PORT = 4000 + Math.floor(Math.random() * 300);
const base = `http://localhost:${PORT}`;
let root;
let uploads;
let server;
let ready = false;
let bytes;

beforeAll(async () => {
  await detectTools();
  ready = !!imagemagick.convert;

  if(!ready) return;

  root = mkdtempSync(resolve(tmpdir(), 'wb-interrupt-'));
  uploads = resolve(root, 'uploads');
  await run([...imagemagick.convert, '-size', '320x240', 'plasma:fractal', resolve(root, 'in.jpg')]);
  bytes = new Uint8Array(await Bun.file(resolve(root, 'in.jpg')).arrayBuffer());

  server = Bun.spawn(['bun', 'server.js'], { cwd: resolve(import.meta.dir, '..'), env: { ...process.env, PORT: String(PORT), WB_UPLOAD_TTL_MS: '60000', WB_DATA: resolve(root, 'data'), WB_UPLOADS: uploads }, stdout: 'ignore', stderr: 'ignore' });

  for(let i = 0; i < 100; i++) {
    try {
      if((await fetch(base + '/api/capabilities')).ok) return;
    } catch {}

    await Bun.sleep(100);
  }

  throw new Error('server did not start');
});

afterAll(() => {
  server?.kill();
  if(root) rmSync(root, { recursive: true, force: true });
});

// what is stored: files under uploads/ (not the temporary folder) and the temporary ones
const stored = () => readdirSync(uploads).filter(n => n !== '.tmp');
const temporary = () => (existsSync(resolve(uploads, '.tmp')) ? readdirSync(resolve(uploads, '.tmp')).filter(n => n !== 'segment-cache') : []);

// a request by hand: the headers say `declared` bytes, only `sent` arrive, then the socket closes
async function interrupted(sent, declared = bytes.length) {
  const head = `POST /api/uploads HTTP/1.1\r\nHost: localhost:${PORT}\r\nX-Filename: cut.jpg\r\nContent-Type: application/octet-stream\r\nContent-Length: ${declared}\r\nConnection: close\r\n\r\n`;
  let reply = '';

  await new Promise(resolveDone => {
    Bun.connect({
      hostname: 'localhost',
      port: PORT,
      socket: {
        open(socket) {
          socket.write(head);
          socket.write(bytes.subarray(0, sent));
          setTimeout(() => socket.end(), 50);
        },
        data(socket, data) {
          reply += new TextDecoder().decode(data);
        },
        close: resolveDone,
        error: resolveDone,
      },
    });
  });
  await Bun.sleep(300);

  return reply;
}

describe('an interrupted upload', () => {
  test('a body that stops half way stores nothing and leaves no temporary file', async () => {
    if(!ready) return;

    await interrupted(Math.floor(bytes.length / 2));

    expect(stored()).toEqual([]);
    expect(temporary()).toEqual([]);
    expect(await (await fetch(base + '/api/uploads')).json()).toEqual([]);
  });

  test('a body that ends short of its Content-Length is refused, never stored as a smaller file', async () => {
    if(!ready) return;

    // the socket closes cleanly after fewer bytes than announced: the server must not take it as the file
    await interrupted(bytes.length - 500);

    expect(stored()).toEqual([]);
    expect(temporary()).toEqual([]);
  });

  test('the same file sent again after an interruption goes through, once', async () => {
    if(!ready) return;

    await interrupted(Math.floor(bytes.length / 3));

    const first = await fetch(base + '/api/uploads', { method: 'POST', headers: { 'x-filename': 'whole.jpg' }, body: bytes });

    expect(first.status).toBe(201);

    const again = await fetch(base + '/api/uploads', { method: 'POST', headers: { 'x-filename': 'whole.jpg', cookie: first.headers.get('set-cookie').split(';')[0] }, body: bytes });

    expect(again.status).toBe(200);
    expect(stored().filter(n => n.endsWith('.json'))).toHaveLength(1);
    expect(temporary()).toEqual([]);
  });
});
