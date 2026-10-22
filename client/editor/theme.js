// Token sanitiser for a node's `style` (PLAN.md S16.6): a stub with the same
// contract as the future server/theme.js, `sanitize(style) -> { theme, vars }`
// and `toAttr(style) -> string`, so rendering never trusts a stored style.
// Only whitelisted `--wb-*` tokens pass, each with a pattern for its kind.
const number = '-?\\d+(?:\\.\\d+)?';

const KINDS = {
  colour: v => /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) || /^(?:rgb|hsl)a?\([0-9a-z.,%\s/-]{1,60}\)$/i.test(v) || ['transparent', 'black', 'white', 'currentcolor'].includes(v.toLowerCase()),
  length: v => new RegExp(`^${number}(?:px|em|rem|vmin|%)$`).test(v) && Math.abs(parseFloat(v)) <= 500,
  count: v => /^\d{1,2}$/.test(v) && v >= 1 && v <= 12,
  time: v => new RegExp(`^${number}(?:ms|s)$`).test(v) && parseFloat(v) >= 0 && parseFloat(v) * (v.endsWith('ms') ? 1 : 1000) <= 5000,
  image: v => /^url\(\/static\/[\w./-]{1,100}\)$/.test(v) && !v.includes('..'),
  font: v => ['Fixed, ui-monospace, monospace', 'serif', 'sans-serif', 'monospace'].includes(v),
};

const TOKENS = {
  colour: 'wallpaper-color ink ink-soft accent accent-hover accent-ink button-round-bg button-round-border button-round-hover add-ink fit-ink fit-hover button-border card-ground danger drop-fill error-frame select select-fill tip-ink editor-outline editor-handle-fill editor-handle-stroke editor-context-bg editor-popover-bg editor-banner-bg',
  length: 'border-width frame-width select-width radius-tab radius-frame radius-button radius-round radius-node tab-size tab-size-open tab-gap card-gap logo-height font-size font-size-small font-size-button font-size-label font-size-lead font-size-tab editor-tool-size editor-gap editor-outline-width',
  count: 'card-columns card-columns-wide',
  time: 'tab-time',
  image: 'wallpaper-image logo-image icon-upload icon-new icon-delete icon-rotate icon-next icon-tool-select icon-tool-pen icon-tool-shape icon-tool-clip icon-tool-unclip icon-tool-text',
  font: 'font-ui',
};

const KIND = new Map(Object.entries(TOKENS).flatMap(([kind, names]) => names.split(' ').map(name => [`--wb-${name}`, kind])));

const THEME_ID = /^[a-z0-9][a-z0-9-]{0,31}$/;

// the theme id and the vars that pass; anything else is dropped. Whether the
// id names an existing theme is for the caller (the server lists them).
export function sanitize(style) {
  const out = { vars: {} };

  if(!style || typeof style !== 'object') return out;

  if(typeof style.theme === 'string' && THEME_ID.test(style.theme)) out.theme = style.theme;

  if(style.vars && typeof style.vars === 'object')
    for(const [key, value] of Object.entries(style.vars)) {
      const kind = KIND.get(key);

      if(kind && typeof value === 'string' && value.length <= 120 && KINDS[kind](value.trim())) out.vars[key] = value.trim();
    }

  return out;
}

// the inline `style` attribute value, '' when nothing passes
export const toAttr = style =>
  Object.entries(sanitize(style).vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
