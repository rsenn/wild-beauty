// What the upload area accepts and how it describes a file.
// Main types first (PLAN.md S6.2); browsers report no MIME type for heic.
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'heif', 'heic', 'webp', 'gif', 'avif', 'tif', 'tiff'];

export const ACCEPT = 'image/*,' + EXTENSIONS.map(e => '.' + e).join(',');

export const isImageFile = file => EXTENSIONS.includes(file.name.split('.').pop().toLowerCase());

// "812 kB", "4.2 MB" in the page language (SI units)
export function formatSize(bytes, lang) {
  const units = [['byte', 1], ['kilobyte', 1e3], ['megabyte', 1e6], ['gigabyte', 1e9]];
  const [unit, size] = units.reduce((best, u) => (bytes >= u[1] ? u : best), units[0]);

  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: unit === 'byte' ? 0 : 1 }).format(bytes / size);
}
