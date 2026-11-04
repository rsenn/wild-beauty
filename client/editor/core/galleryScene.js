// The `scene` of a gallery node (EDITOR.md S3.1, GALLERY.md S3.1): the 3D
// settings that live next to the wall shapes. The plan itself is not stored
// here: the walls are the shape steps flagged `wall` (walls.js).
//   scene: { look?, thickness?, start?: { at: [x, y], look }, style?: {
//     texture?: { images: [hash|null, hash|null, hash|null], walls: 'split' | 'single' },
//     wall?:  { color?, tile? },  floor?: { color?, gradient?: [c, c], tile? },
//     sky?:   { stars?, seed?, tint? },  light?: { ambient?, picture? } } }
// Style is data: only these keys, colours and numbers in range pass, so the
// validator is also the sanitiser (a photo hash must belong to the node and be
// a texture, checked in model.js validate).
import { isColour } from './model.js'; // used lazily: model.js imports this file too

const colour = v => isColour(v);

export const TEXTURE_WALLS = ['split', 'single'];
// the named default surfaces of a gallery (client/gallery/autoplan.js LOOKS): a drawn
// gallery wears one until the owner assigns textures of their own
export const LOOK_NAMES = ['warm', 'walnut', 'stone'];
export const DEFAULT_LOOK = 'warm';
// the three slots of the texture set, in the order of `texture.images`
export const TEXTURE_SLOTS = ['wall', 'floor', 'corridor'];
export const PICTURE_LIGHTS = ['warm', 'neutral', 'cool'];
export const MAX_TEXTURES = 3; // walls, room floor, corridor floor

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (lo, hi) => v => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const int = (lo, hi) => v => Number.isInteger(v) && v >= lo && v <= hi;
const isHash = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

// field checks per group; a key that is not listed is rejected
const GROUPS = {
  // a slot without an image is null (the look's surface stays there)
  texture: { images: v => Array.isArray(v) && v.length >= 1 && v.length <= MAX_TEXTURES && v.every(h => h === null || isHash(h)) && v.some(isHash), walls: v => TEXTURE_WALLS.includes(v) },
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

  for(const key of Object.keys(scene)) if(!['look', 'thickness', 'start', 'style'].includes(key)) errors.push(...bad(`scene.${key}`));

  if(scene.look !== undefined && !LOOK_NAMES.includes(scene.look)) errors.push(...bad('scene.look'));

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

// the photo hashes a scene uses as textures, in slot order (empty slots left out)
export const textureHashes = scene => (scene?.style?.texture?.images ?? []).filter(Boolean);

// the texture photo of each slot: { wall, floor, corridor }, each a hash or null
export const textureSlots = scene => {
  const images = scene?.style?.texture?.images ?? [];

  return Object.fromEntries(TEXTURE_SLOTS.map((slot, i) => [slot, images[i] ?? null]));
};

// `scene` with the slots set from { wall?, floor?, corridor? } (a hash, or null to clear);
// a scene left without any texture loses its `texture` group
export function withTextures(scene = {}, slots) {
  const now = { ...textureSlots(scene), ...slots };
  const images = TEXTURE_SLOTS.map(slot => now[slot] ?? null);

  while(images.length && images.at(-1) === null) images.pop();

  const { texture: _, ...style } = scene.style ?? {};
  const next = { ...scene, style: images.length ? { ...style, texture: { images, walls: scene.style?.texture?.walls ?? 'single' } } : style };

  if(!Object.keys(next.style).length) delete next.style;

  return next;
}
