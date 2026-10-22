// Which external tools exist on this machine, detected once at start
// (PLAN.md S6.2 step 4, S6.1 /api/capabilities).
import { run } from './run.js';

const NAMES = ['mediainfo', 'exiftool', 'exiv2', 'magick', 'convert', 'identify', 'heif-convert', 'heif-info', 'jpegtran', 'qjsm'];

// name -> absolute path or null
export const tools = Object.fromEntries(NAMES.map(name => [name, null]));

// ImageMagick 7 has `magick`; 6 has `convert` and `identify` (what is installed
// here); argv prefixes for both, plus the version line
export const imagemagick = { convert: null, identify: null, version: null };

export async function detectTools() {
  for(const name of NAMES) tools[name] = Bun.which(name);

  if(tools.magick) {
    imagemagick.convert = ['magick'];
    imagemagick.identify = ['magick', 'identify'];
  } else if(tools.convert && tools.identify) {
    imagemagick.convert = ['convert'];
    imagemagick.identify = ['identify'];
  }

  if(imagemagick.identify) {
    const { stdout } = await run([...imagemagick.identify, '-version'], { timeout: 5000 });

    imagemagick.version = /Version: (ImageMagick [\d.-]+)/.exec(stdout)?.[1] ?? null;
  }
}

// the metadata dumper used for the `exif` field
export const exifTool = () => (tools.exiftool ? 'exiftool' : tools.exiv2 ? 'exiv2' : null);

export const capabilities = ({ languages, limits }) => ({
  tools: Object.fromEntries(Object.entries(tools).map(([name, path]) => [name, !!path])),
  imagemagick: imagemagick.convert ? { command: imagemagick.convert[0], version: imagemagick.version } : null,
  exif: exifTool(),
  languages,
  limits,
  // the qjs-opencv helper (cutout, clip, palette) is detected in M11
  imgproc: null,
});
