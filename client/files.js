// What the upload area accepts and how it describes a file.
// Main types first (PLAN.md S6.2); browsers report no MIME type for heic.
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'heif', 'heic', 'webp', 'gif', 'avif', 'tif', 'tiff'];

export const ACCEPT = 'image/*,' + EXTENSIONS.map(e => '.' + e).join(',');

export const isImageFile = file => EXTENSIONS.includes(file.name.split('.').pop().toLowerCase());

// background of a card from the two `padding` colours of its upload record: the
// photo shown whole ("extend") sits on a gradient across the free sides (left
// and right for a portrait photo, top and bottom otherwise); '' until the
// server has analysed the photo
export function paddingStyle(record) {
  const colors = record?.padding;

  if(!colors || !colors.every(c => /^#[0-9a-f]{6}$/.test(c))) return '';

  return `background: linear-gradient(${record.width < record.height ? 'to right' : 'to bottom'}, ${colors[0]}, ${colors[1]})`;
}

// "812 kB", "4.2 MB" in the page language (SI units)
export function formatSize(bytes, lang) {
  const units = [['byte', 1], ['kilobyte', 1e3], ['megabyte', 1e6], ['gigabyte', 1e9]];
  const [unit, size] = units.reduce((best, u) => (bytes >= u[1] ? u : best), units[0]);

  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: unit === 'byte' ? 0 : 1 }).format(bytes / size);
}

// what a dragged or "added" upload card tells the editor (EDITOR.md S2.5)
export const UPLOAD_MIME = 'application/x-wb-upload';

export const uploadPayload = record => ({ hash: record.hash, display: record.display, width: record.width, height: record.height, padding: record.padding, palette: record.palette });
