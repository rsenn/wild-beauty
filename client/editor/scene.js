// The `scene` of a gallery node (EDITOR.md S3.1, GALLERY.md S3.1): the 3D
// settings that live next to the wall shapes. The plan itself is not stored
// here: the walls are the shape steps flagged `wall` (walls.js).
//   scene: { thickness?, start?: { at: [x, y], look }, style?: {
//     texture?: { images: [hash, hash?, hash?], walls: 'split' | 'single' },
//     wall?:  { color?, tile? },  floor?: { color?, gradient?: [c, c], tile? },
//     sky?:   { stars?, seed?, tint? },  light?: { ambient?, picture? } } }
// Style is data: only these keys, colours and numbers in range pass, so the
// validator is also the sanitiser (a photo hash must belong to the node and be
// a texture, checked in model.js validate).
import { isColour } from './model.js'; // used lazily: model.js imports this file too

const colour = v => isColour(v);

export const TEXTURE_WALLS = ['split', 'single'];
export const PICTURE_LIGHTS = ['warm', 'neutral', 'cool'];
export const MAX_TEXTURES = 3; // walls, room floor, corridor floor

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (lo, hi) => v => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const int = (lo, hi) => v => Number.isInteger(v) && v >= lo && v <= hi;
const isHash = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

// field checks per group; a key that is not listed is rejected
const GROUPS = {
  texture: { images: v => Array.isArray(v) && v.length >= 1 && v.length <= MAX_TEXTURES && v.every(isHash), walls: v => TEXTURE_WALLS.includes(v) },
  wall: { color: colour, tile: num(0.1, 20) },
  floor: { color: colour, gradient: v => Array.isArray(v) && v.length === 2 && v.every(colour), tile: num(0.1, 20) },
  sky: { stars: int(0, 10000), seed: int(0, 2 ** 31), tint: colour },
  light: { ambient: num(0, 1), picture: v => PICTURE_LIGHTS.includes(v) },
};
const REQUIRED = { texture: ['images', 'walls'] };

// -> [{ code: 'bad_scene', path }]; empty when the scene is fine
export function validateScene(scene) {
  const bad = path => [{ code: 'bad_scene', path }];

  if(!isObject(scene)) return bad('scene');

  const errors = [];

  for(const key of Object.keys(scene)) if(!['thickness', 'start', 'style'].includes(key)) errors.push(...bad(`scene.${key}`));

  if(scene.thickness !== undefined && !num(0.05, 1)(scene.thickness)) errors.push(...bad('scene.thickness'));

  if(scene.start !== undefined) {
    const { at, look, ...rest } = scene.start ?? {};
    const ok = isObject(scene.start) && Array.isArray(at) && at.length === 2 && at.every(num(-1e5, 1e5)) && num(-1e3, 1e3)(look) && !Object.keys(rest).length;

    if(!ok) errors.push(...bad('scene.start'));
  }

  if(scene.style !== undefined) {
    if(!isObject(scene.style)) errors.push(...bad('scene.style'));
    else
      for(const [group, value] of Object.entries(scene.style)) {
        const fields = GROUPS[group];
        const at = `scene.style.${group}`;

        if(!fields || !isObject(value)) {
          errors.push(...bad(at));
          continue;
        }

        for(const [key, check] of Object.entries(fields)) if(value[key] !== undefined && !check(value[key])) errors.push(...bad(`${at}.${key}`));
        for(const key of REQUIRED[group] ?? []) if(value[key] === undefined) errors.push(...bad(`${at}.${key}`));
        for(const key of Object.keys(value)) if(!(key in fields)) errors.push(...bad(`${at}.${key}`));
      }
  }

  return errors;
}

// the photo hashes a scene uses as textures, in slot order
export const textureHashes = scene => scene?.style?.texture?.images ?? [];
