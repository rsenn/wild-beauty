// Shared colour maths (EDITOR.md S2.3a, E84): hex <-> sRGB <-> OKLab / OKLCH,
// distance, gamut clamping. Used by the server (palette, tile padding) and the
// editor (palette strip), so no DOM and no Bun APIs.
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// '#rgb' | '#rgba' | '#rrggbb' | '#rrggbbaa' -> [r, g, b, a] (0..255, a 0..1), or null
export function parseHex(text) {
  if(typeof text !== 'string' || !HEX.test(text)) return null;

  let h = text.slice(1);

  if(h.length <= 4) h = [...h].map(c => c + c).join('');

  const n = i => parseInt(h.slice(i, i + 2), 16);

  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
}

const byte = v => Math.min(255, Math.max(0, Math.round(v)));
const two = v => byte(v).toString(16).padStart(2, '0');

// [r, g, b, a?] -> '#rrggbb', or '#rrggbbaa' when a < 1
export const formatHex = ([r, g, b, a = 1]) => `#${two(r)}${two(g)}${two(b)}${a < 1 ? two(a * 255) : ''}`;

// linear sRGB (0..1) <-> OKLab (Ottosson)
function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

// "#rrggbb" -> [L, a, b]
export const oklab = hex => linearToOklab(parseHex(hex).slice(0, 3).map(v => lin(v / 255)));

export const distance = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));

// [L, C, h] with h in degrees 0..360
export function toOklch(hex) {
  const [L, a, b] = oklab(hex);

  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

const inGamut = rgb => rgb.every(v => v >= -1e-6 && v <= 1 + 1e-6);

// [L, C, h] -> '#rrggbb'; a colour outside sRGB loses chroma until it fits
export function fromOklch([L, C, h]) {
  const rad = (h * Math.PI) / 180;
  const at = c => oklabToLinear([L, c * Math.cos(rad), c * Math.sin(rad)]);
  let rgb = at(C);

  if(!inGamut(rgb)) {
    let lo = 0;
    let hi = C;

    for(let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;

      if(inGamut(at(mid))) lo = mid;
      else hi = mid;
    }

    rgb = at(lo);
  }

  return formatHex(rgb.map(v => gam(Math.min(1, Math.max(0, v))) * 255));
}
