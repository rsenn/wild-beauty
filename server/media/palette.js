// Dominant colours of an image (PLAN.md S6.2 step 5): ImageMagick reduces a
// 128 px copy to 8 colours and prints a histogram, which gives hex and weight.
import { imagemagick } from './tools.js';
import { LIMITS } from './probe.js';
import { firstLine, run } from './run.js';

// "  1234: (255,0,0) #FF0000 red" or with alpha "( 0, 0, 0,  0) #00000000 none"
const LINE = /^\s*(\d+):\s*\([^)]*\)\s*#([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?/;

// -> { value: [{ hex, weight }] heaviest first, weights sum to 1 } or { error }
export async function palette(file, count = 8) {
  if(!imagemagick.convert) return { error: 'palette: ImageMagick not installed' };

  const argv = [...imagemagick.convert, ...LIMITS, `${file}[0]`, '-auto-orient', '-resize', '128x128', '-colors', String(count), '-depth', '8', '-format', '%c', 'histogram:info:-'];
  const { code, stdout, stderr } = await run(argv, { timeout: 15000 });

  if(code !== 0) return { error: `palette: ${firstLine(stderr)}` };

  const colors = new Map();

  for(const line of stdout.split('\n')) {
    const m = LINE.exec(line);

    // transparent pixels do not count as a colour of the photo
    if(!m || (m[3] && parseInt(m[3], 16) < 128)) continue;

    const hex = '#' + m[2].toLowerCase();

    colors.set(hex, (colors.get(hex) ?? 0) + Number(m[1]));
  }

  const total = [...colors.values()].reduce((a, b) => a + b, 0);

  if(!total) return { error: 'palette: no opaque pixels' };

  return { value: [...colors].map(([hex, n]) => ({ hex, weight: +(n / total).toFixed(4) })).sort((a, b) => b.weight - a.weight) };
}
