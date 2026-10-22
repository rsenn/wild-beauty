// What the upload area accepts and how it describes a file.
// Main types first (PLAN.md S6.2); browsers report no MIME type for heic.
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'heif', 'heic', 'webp', 'gif', 'avif', 'tif', 'tiff'];

export const ACCEPT = 'image/*,' + EXTENSIONS.map(e => '.' + e).join(',');

export const isImageFile = file => EXTENSIONS.includes(file.name.split('.').pop().toLowerCase());

// The square crop of a card (EDITOR.md S2.5): the photo fills the square and the
// crop window slides along the photo's long edge. -> { axis: 'x' | 'y' | null,
// sign: 1 | -1 } where `axis` is the screen direction the photo can be dragged
// in (null: a square photo, or not known yet) and `sign` turns a drag along it
// into a change of `crop` (dragging the picture right shows more of its left:
// the crop goes down). The card can be rotated in quarter turns, which turns
// the axis and may flip the sign.
export function panAxis(record, rotation = 0) {
  if(!record || !(record.width > 0) || !(record.height > 0) || record.width === record.height) return { axis: null, sign: 1 };

  const turn = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const wide = record.width > record.height;
  const sideways = turn % 2 === 1;
  const flip = wide ? turn === 2 || turn === 3 : turn === 1 || turn === 2;

  return { axis: wide !== sideways ? 'x' : 'y', sign: flip ? 1 : -1 };
}

// `object-position` of a card image for a crop: the long edge slides, the other stays
export const cropPosition = (record, crop = 0.5) => (record?.width > record?.height ? `${crop * 100}% 50%` : `50% ${crop * 100}%`);

// The chosen crops outlive a reload: { [hash]: crop } in localStorage (a card is
// an upload record on the server, which does not know about crops).
const CROPS_KEY = 'wb-crops';

export function loadCrops(storage = globalThis.localStorage) {
  try {
    const crops = JSON.parse(storage?.getItem(CROPS_KEY) ?? '{}');

    return crops && typeof crops === 'object' ? crops : {};
  } catch {
    return {};
  }
}

export function saveCrop(hash, crop, storage = globalThis.localStorage) {
  try {
    storage?.setItem(CROPS_KEY, JSON.stringify({ ...loadCrops(storage), [hash]: crop }));
  } catch {}
}

// "812 kB", "4.2 MB" in the page language (SI units)
export function formatSize(bytes, lang) {
  const units = [['byte', 1], ['kilobyte', 1e3], ['megabyte', 1e6], ['gigabyte', 1e9]];
  const [unit, size] = units.reduce((best, u) => (bytes >= u[1] ? u : best), units[0]);

  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: unit === 'byte' ? 0 : 1 }).format(bytes / size);
}

// what a dragged or "added" upload card tells the editor (EDITOR.md S2.5)
export const UPLOAD_MIME = 'application/x-wb-upload';

export const uploadPayload = (record, role, crop) => ({ ...(role === 'texture' && { role }), hash: record.hash, display: record.display, width: record.width, height: record.height, padding: record.padding, palette: record.palette, ...(crop !== undefined && crop !== 0.5 && { crop }) });
