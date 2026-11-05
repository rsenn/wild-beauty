// Bring photo files into wild-beauty the way the app does.
//
//   bun tools/ingest.js --user LOGIN --gallery TITLE [options] FILE...
//   bun tools/ingest.js --user LOGIN --node TITLE [options] FILE...
//
// Every file goes through the server's own upload (storeFile: sniff, hash,
// probe, EXIF, rounded position, palette, sidecar), and the nodes are saved
// through the server's own save (saveNew: validate, bake into data/photos,
// tile, rows). Nothing here writes a row or a file by hand.
//
//   --user LOGIN      the owner: a mail address or a username
//   --gallery TITLE   a gallery node with child nodes of up to --per photos,
//                     oldest first, each titled with its date range
//   --node TITLE      one node instead (any number of photos)
//   --per N           photos per child node, 40 by default (no upper limit)
//   --list FILE       file names, one per line (- is stdin); FILE... as well
//   --dry-run         read nothing into the app, print the plan
//   --force           make the node even when the owner has one with that title
//   --groups FILE     explicit nodes: a json array of { title, files }, the order of
//                     files is kept, photos the app already has are not read again
//   --into ID         with --groups: link the new nodes under this gallery of the owner
//   --positions-only  make no nodes: record the exact position of the photos the app
//                     already has, read from the original files (no --user needed)
//
// The exact position of every photo with GPS in its original is recorded in the
// photo's meta.where (6 decimals, private, never sent to visitors); the clients
// see only the rounded one.
//
// The new nodes are hidden, as every new node: publish them in the editor.
// A node may hold any number of photos here, the editor's limit (150) does not bind this tool.
// Photos are ordered by the time they were taken (EXIF DateTimeOriginal,
// else the file name), the ones without a time come last by name.
// WB_DATA and WB_UPLOADS point it at another data and upload directory.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { open } from '../server/db/db.js';
import { userByLogin } from '../server/auth.js';
import { sessionFor } from '../server/session.js';
import { storeFile } from '../server/api/uploads.js';
import { saveNew } from '../server/api/nodes.js';
import { addLink, getPhoto, setPhotoTaken, setPhotoWhere } from '../server/db/nodes.js';
import { exif } from '../server/media/probe.js';
import { detectTools } from '../server/media/tools.js';
import { emptyNode, newId } from '../client/editor/core/model.js';

const USAGE = 'usage: bun tools/ingest.js --user LOGIN (--gallery TITLE | --node TITLE) [--per N] [--list FILE] [--dry-run] [--force] FILE...';

const die = message => {
  console.error(message);
  process.exit(1);
};

function parseArgs(argv) {
  const opts = { files: [], per: 40, dryRun: false, force: false };
  const valued = new Set(['user', 'gallery', 'node', 'per', 'list', 'groups', 'into']);

  for(let i = 0; i < argv.length; i++) {
    const name = argv[i].startsWith('--') ? argv[i].slice(2) : '';

    if(name === 'dry-run') opts.dryRun = true;
    else if(name === 'positions-only') opts.positionsOnly = true;
    else if(name === 'force') opts.force = true;
    else if(valued.has(name)) opts[name] = argv[++i] ?? die(`--${name} needs a value\n${USAGE}`);
    else if(name) die(`unknown option ${argv[i]}\n${USAGE}`);
    else opts.files.push(argv[i]);
  }

  return opts;
}

const opts = parseArgs(process.argv.slice(2));

if(!opts.positionsOnly) {
  if(!opts.user || (opts.gallery && opts.node)) die(USAGE);
  if(opts.groups ? !(opts.into || opts.gallery) : !(opts.gallery || opts.node)) die(USAGE);
}

// this tool is not bound by the photo limit of a node (the editor's is LIMITS.photos)
const NO_LIMIT = Infinity;
const per = Math.max(1, Math.floor(Number(opts.per)) || 40);

const groupsGiven = opts.groups ? JSON.parse(readFileSync(opts.groups, 'utf8')) : null;

if(groupsGiven) opts.files.push(...groupsGiven.flatMap(g => g.files));

if(opts.list) opts.files.push(...readFileSync(opts.list === '-' ? '/dev/stdin' : opts.list, 'utf8').split('\n').filter(Boolean));

if(!opts.files.length) die(`no files\n${USAGE}`);

// when a photo was taken -> milliseconds, or null: EXIF first, then a name such as
// 20260501_154019.jpg or 2026-05-01_15-40-19_x.jpg
const EXIF_TIMES = ['ExifIFD:DateTimeOriginal', 'ExifIFD:CreateDate', 'IFD0:ModifyDate'];
const FROM_NAME = [/(\d{4})(\d\d)(\d\d)_(\d\d)(\d\d)(\d\d)/, /(\d{4})-(\d\d)-(\d\d)_(\d\d)-(\d\d)-(\d\d)/];

function takenAt(record, name) {
  const texts = [...EXIF_TIMES.map(key => /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/.exec(record?.exif?.[key] ?? '')), ...FROM_NAME.map(re => re.exec(name))];
  const m = texts.find(Boolean);

  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}

const day = ms => new Date(ms).toISOString().slice(0, 10);

// the title of a child node: the day of its first and of its last photo
const rangeTitle = group => {
  const times = group.map(p => p.time).filter(t => t !== null);

  return times.length ? (day(times[0]) === day(times.at(-1)) ? day(times[0]) : `${day(times[0])} - ${day(times.at(-1))}`) : 'undated';
};

const stepOf = hash => ({ op: 'photo', id: newId(), photo: hash, m: [1, 0, 0, 1, 0, 0], crop: 0.5, opacity: 1, blend: 'normal' });

function gridDoc(title, photos) {
  const doc = emptyNode();
  const used = new Set([doc.pages[0].id]);

  const steps = photos.map(p => {
    let step;

    do step = stepOf(p.hash);
    while(used.has(step.id));

    used.add(step.id);

    return step;
  });

  return { ...doc, mode: 'grid', layout: { fill: 'tight' }, title, pages: [{ ...doc.pages[0], steps }] };
}

// the app finds its external tools once at start, as server.js does
await detectTools();

const h = await open();

// the hash the app gives a file is the sha256 of its bytes
const sha256 = async file => new Bun.CryptoHasher('sha256').update(await Bun.file(file).bytes()).digest('hex');

// record the exact position of a photo the app has, from its original -> true when set
async function recordWhere(file, hash) {
  const { where, taken } = await exif(file);
  const a = !!where && setPhotoWhere(h, hash, where);
  const b = !!taken && setPhotoTaken(h, hash, taken);

  return a || b;
}

if(opts.positionsOnly) {
  const counts = { set: 0, noGps: 0, notInApp: 0 };

  for(const file of opts.files) {
    const hash = await sha256(file).catch(() => null);

    if(!hash || !getPhoto(h, hash)) counts.notInApp++;
    else if(opts.dryRun ? !!(await exif(file)).where || !!(await exif(file)).taken : await recordWhere(file, hash)) counts.set++;
    else counts.noGps++;
  }

  console.log(JSON.stringify({ ok: true, positionsOnly: true, dryRun: opts.dryRun, files: opts.files.length, ...counts }));
  h.close();
  process.exit(0);
}

const user = userByLogin(h, opts.user) ?? die(`no user ${opts.user}`);
const viewer = { id: user.id, email: user.email, name: user.name, username: user.username };
const wanted = opts.gallery ?? opts.node;

if(!groupsGiven && !opts.force && h.get('SELECT id FROM nodes WHERE owner_id = ? AND title = ?', user.id, wanted)) die(`${user.email} already has a node titled ${JSON.stringify(wanted)}, --force makes another`);

const session = sessionFor(new Request('http://ingest.invalid/'));
const photos = [];
const skipped = [];

for(const [i, file] of opts.files.entries()) {
  // a dry run looks at names only, nothing enters the app, and a photo the app already
  // has needs no second upload
  const known = !opts.dryRun && groupsGiven ? await sha256(file).catch(() => null) : null;
  const record = known && getPhoto(h, known) ? { hash: known, exif: null } : opts.dryRun ? { hash: file, exif: null } : await storeFile(session, file, basename(file)).catch(() => null);

  if(record) photos.push({ file, hash: record.hash, time: takenAt(record, basename(file)) });
  else skipped.push(file);

  if((i + 1) % 25 === 0) console.error(`${i + 1}/${opts.files.length}`);
}

photos.sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity) || a.file.localeCompare(b.file));

const groups = [];

if(groupsGiven) {
  const byFile = new Map(photos.map(p => [p.file, p]));

  for(const g of groupsGiven) groups.push(g.files.map(f => byFile.get(f)).filter(Boolean));
} else for(let i = 0; i < photos.length; i += per) groups.push(photos.slice(i, i + per));

const plan = groups.map((g, i) => ({ title: groupsGiven ? groupsGiven[i].title : (opts.node ?? rangeTitle(g)), photos: g.length }));

if(opts.dryRun) {
  console.log(JSON.stringify({ dryRun: true, user: user.email, photos: photos.length, skipped, gallery: opts.gallery ?? null, nodes: plan }));
  h.close();
  process.exit(0);
}

const made = [];

for(const [i, group] of groups.entries()) {
  const title = plan[i].title;
  const { status, body } = await saveNew(h, { doc: gridDoc(title, group), kind: 'node' }, { viewer, maxPhotos: NO_LIMIT });

  if(status !== 201) die(`saving ${JSON.stringify(title)} failed: ${status} ${JSON.stringify(body).slice(0, 300)}`);

  made.push({ id: body.id, title, photos: group.length });
}

// the exact position of every photo of this run, now that the photos are in the app
let located = 0;

for(const p of photos) if(await recordWhere(p.file, p.hash)) located++;

let gallery = null;

if(opts.into) {
  const target = h.get("SELECT id, kind FROM nodes WHERE id = ? AND owner_id = ? AND kind = 'gallery'", Number(opts.into), user.id) ?? die(`${opts.into} is not a gallery of ${user.email}`);
  const next = (h.get('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM node_links WHERE from_id = ? AND label = ?', target.id, 'child')?.n ?? 0);

  made.forEach((node, i) => addLink(h, target.id, node.id, 'child', next + i));
  gallery = { id: target.id };
} else if(opts.gallery) {
  const { status, body } = await saveNew(h, { doc: { ...emptyNode(), title: opts.gallery }, kind: 'gallery' }, { viewer });

  if(status !== 201) die(`saving the gallery failed: ${status} ${JSON.stringify(body).slice(0, 300)}`);

  made.forEach((node, i) => addLink(h, body.id, node.id, 'child', i));
  gallery = { id: body.id, title: opts.gallery };
}

console.log(JSON.stringify({ ok: true, user: user.email, photos: photos.length, located, skipped, gallery, nodes: made }));
h.close();
