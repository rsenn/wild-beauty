// Image type from magic bytes. The client-supplied name and MIME type are
// never trusted; the returned `ext` is what the file is stored as.
const startsWith = (b, sig, at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b, at, len) => String.fromCharCode(...b.subarray(at, at + len));

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'];

// brands of an ISO base media `ftyp` box: major plus compatible
function brands(b) {
  const size = Math.min(((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0, b.length);
  const out = [ascii(b, 8, 4)];

  for(let i = 16; i + 4 <= size; i += 4) out.push(ascii(b, i, 4));

  return out;
}

// -> { ext, mime } or null; needs the first 32 bytes (or the whole file if shorter)
export function sniff(b) {
  if(b.length < 12) return null;

  if(startsWith(b, [0xff, 0xd8, 0xff])) return { ext: 'jpg', mime: 'image/jpeg' };
  if(startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: 'png', mime: 'image/png' };

  const head = ascii(b, 0, 6);

  if(head === 'GIF87a' || head === 'GIF89a') return { ext: 'gif', mime: 'image/gif' };
  if(ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if(startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a])) return { ext: 'tiff', mime: 'image/tiff' };

  if(ascii(b, 4, 4) === 'ftyp') {
    const list = brands(b);

    if(list.includes('avif') || list.includes('avis')) return { ext: 'avif', mime: 'image/avif' };
    if(list.some(x => HEIC_BRANDS.includes(x))) return { ext: 'heic', mime: 'image/heic' };
    if(list.includes('mif1') || list.includes('msf1')) return { ext: 'heif', mime: 'image/heif' };
  }

  return null;
}
