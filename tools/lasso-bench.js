#!/usr/bin/env bun
// The magnetic lasso benchmark (WAND.md Part D, TODO "Magnetic lasso"): how well does the lasso follow
// the outline of an object, for different edge maps and different numbers of clicks?
//
//   bun tools/lasso-bench.js --images DIR --masks DIR [options]
//
//   --images DIR      photos (jpg, png, webp); AIM-500: the `original` folder
//                     Without --masks (and with --sheet) only the contact sheets are made: no numbers, no ground truth needed (flower photos)
//   --masks DIR       the mattes, same base name (png, jpg, webp); AIM-500: the `mask` folder. A pixel above 127 is object
//   --spacing 20,40,80  pixels between the user's clicks, on the working copy (default 20,40,80)
//   --sigma 3         the user's aiming error, px (default 3)
//   --size 640        long side of the working copy (default 640, the lasso's own)
//   --limit N         at most N photos (default all); --offset K skips the first K
//   --split all|tune|test   tune: the even photos, test: the odd ones (decide on tune, confirm on test; WAND.md Part D)
//   --variant NAME[=ARGS]   an edge map; repeatable. `local` (default when none given) is the browser's own Sobel;
//                     anything else runs `opencv-imgproc edgemap ARGS`, e.g.
//                       --variant clahe3='--clahe-clip 3' --variant noclahe='--clahe-clip 0 --smooth none'
//   --tool PATH       the opencv-imgproc to run (default `opencv-imgproc`)
//   --cache DIR       edgemap cache (default a temp folder)
//   --sheet DIR       also write one contact sheet per photo: the photo and every variant's edge map
//   --json FILE       the numbers of every run, for later comparison
//   --radius 220      how far from a click the lasso searches, px (the editor's 220; a smaller one, e.g. 100, is much faster
//                     for the benchmark and gives the same outline while the clicks are closer together than that)
//   --tol 2           boundary F tolerance, px
//   --seed 1          same seed, same clicks, so variants are compared on the same aim
//
// Needs ImageMagick (`convert` or `magick`) to read the photos. Only node:fs and node:child_process
// (Sync calls), so it runs under Bun, Node and qjs-modules. The same clicks are used for every variant: a
// difference between two variants is the edge map's, not the luck of the aim.

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { edgeCost } from '../client/editor/lasso.js';
import { largestComponent, score, simulate, summarise, traceContour } from './lasso-bench-lib.js';

const argv = globalThis.process?.argv?.slice(2) ?? globalThis.scriptArgs?.slice(1) ?? [];
const opts = { variant: [] };

for(let i = 0; i < argv.length; i++) {
  const a = argv[i];

  if(!a.startsWith('--')) continue;

  const [k, inline] = a.slice(2).split(/=(.*)/s);
  const v = inline ?? argv[++i];

  if(k === 'variant') opts.variant.push(v);
  else opts[k] = v;
}

const fail = message => {
  console.log(`lasso-bench: ${message}`);
  (globalThis.process ?? globalThis.std)?.exit?.(2);
  throw new Error(message);
};

if(!opts.images || (!opts.masks && !opts.sheet)) fail('needs --images DIR and --masks DIR (or --images DIR --sheet DIR alone, for the contact sheets; see the top of tools/lasso-bench.js)');

const SIZE = Number(opts.size ?? 640);
const SPACINGS = String(opts.spacing ?? '20,40,80').split(',').map(Number).filter(n => n > 0);
const SIGMA = Number(opts.sigma ?? 3);
const TOL = Number(opts.tol ?? 2);
const RADIUS = Number(opts.radius ?? 220);
const SEED = Number(opts.seed ?? 1);
const TOOL = opts.tool ?? 'opencv-imgproc';
const VARIANTS = (opts.variant.length ? opts.variant : ['local']).map(v => {
  const [name, ...rest] = v.split('=');

  return { name, args: rest.join('=').trim().split(/\s+/).filter(Boolean), local: name === 'local' && !rest.length };
});
const WORK = mkdtempSync(join(tmpdir(), 'lasso-bench-'));
const CACHE = opts.cache ?? join(WORK, 'cache');

mkdirSync(CACHE, { recursive: true });

const MAGICK = ['convert', 'magick'].find(c => spawnSync(c, ['-version'], { stdio: 'ignore' }).status === 0);

if(!MAGICK) fail('ImageMagick (convert or magick) is needed to read the photos');

const run = (cmd, args, { raw = false } = {}) => {
  const r = spawnSync(cmd, args, { maxBuffer: 1 << 30, encoding: raw ? 'buffer' : 'utf8' });

  if(r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(' ')} ...: ${String(r.stderr).slice(0, 200)}`);

  return r.stdout;
};

// the photo as RGBA at the working size
function readPhoto(file) {
  const resize = ['-auto-orient', '-resize', `${SIZE}x${SIZE}>`];
  const [w, h] = run(MAGICK, [file, ...resize, '-format', '%w %h', 'info:']).trim().split(' ').map(Number);
  const rgba = new Uint8ClampedArray(run(MAGICK, [file, ...resize, '-depth', '8', 'rgba:-'], { raw: true }));

  return { w, h, rgba };
}

// a gray image resized to exactly w x h, 8-bit
const readGray = (file, w, h) => Uint8Array.from(run(MAGICK, [file, '-auto-orient', '-resize', `${w}x${h}!`, '-colorspace', 'Gray', '-depth', '8', 'gray:-'], { raw: true }));

const matteOf = (file, w, h) => {
  const gray = readGray(file, w, h);

  return Uint8Array.from(gray, v => (v > 127 ? 1 : 0));
};

// the edge cost of one photo for one variant: the local Sobel, or the map of `opencv-imgproc edgemap`
function costOf(variant, file, photo) {
  if(variant.local) return { cost: edgeCost(photo.rgba, photo.w, photo.h), ms: 0, map: null };

  const out = join(WORK, `edges-${variant.name}.png`);
  const t0 = performance.now();
  const r = spawnSync(TOOL, ['edgemap', '--in', file, '--out', out, '--size', String(SIZE), '--cache-dir', CACHE, ...variant.args], { encoding: 'utf8', maxBuffer: 1 << 26 });

  if(r.status !== 0) throw new Error(`edgemap ${variant.name}: exit ${r.status} ${String(r.stdout).split('\n').filter(Boolean).at(-1) ?? ''} ${String(r.stderr).slice(0, 160)}`);

  const ms = performance.now() - t0;
  const map = readGray(out, photo.w, photo.h);

  return { cost: Float32Array.from(map, v => 1.04 - v / 255), ms, map };
}

// a small deterministic generator: the same (seed, photo, spacing) gives the same clicks in every variant
const rngFor = (...parts) => {
  let s = parts.reduce((a, b) => (Math.imul(a, 31) + b) >>> 0, 2166136261) || 1;

  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
};

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const names = readdirSync(opts.images).filter(f => EXT.has(extname(f).toLowerCase())).sort();
let picked = names.map((f, i) => ({ f, i })).filter(({ i }) => (opts.split === 'tune' ? i % 2 === 0 : opts.split === 'test' ? i % 2 === 1 : true));

picked = picked.slice(Number(opts.offset ?? 0), opts.limit ? Number(opts.offset ?? 0) + Number(opts.limit) : undefined);

const maskFor = f => opts.masks && ['.png', '.jpg', '.jpeg', '.webp'].map(e => join(opts.masks, basename(f, extname(f)) + e)).find(existsSync);
const rows = []; // { photo, variant, spacing, iou, f, plainIou, plainF, clicks, ms, edgeMs }
let skipped = 0;

console.log(`lasso-bench: ${picked.length} photos, variants ${VARIANTS.map(v => v.name).join(', ')}, spacings ${SPACINGS.join(', ')} px, aim error ${SIGMA} px, size ${SIZE}`);

if(opts.sheet) mkdirSync(opts.sheet, { recursive: true });

for(const { f, i } of picked) {
  const file = join(opts.images, f);
  const maskFile = maskFor(f);

  // without a matte there are no numbers; with --sheet the edge maps are still drawn
  if(!maskFile && !opts.sheet) {
    skipped++;
    continue;
  }

  try {
    const photo = readPhoto(file);
    const { w, h } = photo;
    const gt = maskFile ? largestComponent(matteOf(maskFile, w, h), w, h) : null;
    const contour = gt ? traceContour(gt, w, h) : [];

    if(maskFile && contour.length < 30) {
      skipped++;
      continue;
    }

    const sheet = [file];

    for(const variant of VARIANTS) {
      const { cost, ms: edgeMs, map } = costOf(variant, file, photo);

      for(const spacing of gt ? SPACINGS : []) {
        const sim = simulate({ cost, gt, w, h, spacing, sigma: SIGMA, rnd: rngFor(SEED, i, spacing), contour, radius: RADIUS });
        const s = score(sim, w, h, TOL);

        rows.push({ photo: f, variant: variant.name, spacing, edgeMs, ...s });
      }

      if(opts.sheet) {
        const png = join(WORK, `sheet-${variant.name}.png`);

        if(map) writeFileSync(join(WORK, 'raw.gray'), map);
        else writeFileSync(join(WORK, 'raw.gray'), Uint8Array.from(cost, c => Math.max(0, Math.min(255, Math.round((1.04 - c) * 255)))));

        run(MAGICK, ['-size', `${w}x${h}`, '-depth', '8', `gray:${join(WORK, 'raw.gray')}`, png]);
        sheet.push(png);
      }
    }

    if(opts.sheet) run(MAGICK, sheet.flatMap((p, k) => (k ? ['(', p, '-resize', 'x320', ')'] : ['(', p, '-auto-orient', '-resize', 'x320', ')'])).concat(['+append', join(opts.sheet, basename(f, extname(f)) + '.png')]));
  } catch(e) {
    skipped++;
    console.log(`  skipped ${f}: ${e.message}`);
  }
}

// ---- report ----
const pct = x => (Number.isFinite(x) ? (x * 100).toFixed(1).padStart(5) : '    -');
const fixed = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');

console.log(`\n${new Set(rows.map(r => r.photo)).size} photos measured, ${skipped} skipped\n`);
console.log('variant            spacing  clicks  IoU%   >=90%   F%    plain IoU%  plain F%   ms/click  edge ms');

for(const variant of VARIANTS) {
  for(const spacing of SPACINGS) {
    const r = rows.filter(x => x.variant === variant.name && x.spacing === spacing);

    if(!r.length) continue;

    const iou = summarise(r.map(x => x.iou));

    console.log(
      `${variant.name.padEnd(18)} ${String(spacing).padStart(5)}  ${fixed(summarise(r.map(x => x.clicks)).mean).padStart(6)}  ${pct(iou.mean)}  ${pct(iou.share)}  ${pct(summarise(r.map(x => x.f)).mean)}  ${pct(summarise(r.map(x => x.plainIou)).mean).padStart(10)}  ${pct(summarise(r.map(x => x.plainF)).mean).padStart(8)}  ${fixed(summarise(r.map(x => x.ms / x.clicks)).mean).padStart(8)}  ${fixed(summarise(r.map(x => x.edgeMs)).mean, 0).padStart(7)}`,
    );
  }
}

// the photos the first variant did worst on, at the middle spacing
const mid = SPACINGS[Math.floor(SPACINGS.length / 2)];
const worst = rows.filter(r => r.variant === VARIANTS[0].name && r.spacing === mid).sort((a, b) => a.iou - b.iou).slice(0, 8);

if(worst.length) {
  console.log(`\nworst photos for ${VARIANTS[0].name} at ${mid} px:`);

  for(const r of worst) console.log(`  ${pct(r.iou)}% IoU  ${pct(r.f)}% F  ${r.clicks} clicks  ${r.photo}`);
}

if(opts.json) {
  writeFileSync(resolve(opts.json), JSON.stringify({ options: { SIZE, SPACINGS, SIGMA, TOL, SEED, RADIUS, split: opts.split ?? 'all', variants: VARIANTS.map(v => ({ name: v.name, args: v.args })) }, rows }, null, 1));
  console.log(`\nnumbers written to ${opts.json}`);
}

rmSync(WORK, { recursive: true, force: true });
