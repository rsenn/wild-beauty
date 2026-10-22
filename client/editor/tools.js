// The tools of the left column (EDITOR.md S2.3, E37): id, key and the cursor
// the stage shows while the tool is active. Which tools do something is the
// business of the editor; this is only the table and the key handling.
export const TOOLS = [
  { id: 'select', key: 'V', cursor: 'default' },
  { id: 'pen', key: 'P', cursor: 'crosshair' },
  { id: 'shape', key: 'S', cursor: 'crosshair' },
  { id: 'clip', key: 'C', cursor: 'pointer' },
  { id: 'unclip', key: 'U', cursor: 'pointer' },
  { id: 'text', key: 'T', cursor: 'text' },
];

export const DEFAULT_TOOL = 'select';

const BY_KEY = new Map(TOOLS.map(tool => [tool.key, tool.id]));

// is the event aimed at something the user types into?
export const inField = target => !!target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || !!target.isContentEditable);

// the tool a keydown selects, or null. Ignored: a key with ctrl, meta or alt
// (browser and editor shortcuts), a repeat, and anything typed into a field.
// Escape goes back to select. `event` needs key, the modifier flags, repeat
// and target (tagName, isContentEditable).
export function toolForKey(event) {
  if(event.ctrlKey || event.metaKey || event.altKey || event.repeat) return null;

  if(inField(event.target)) return null;

  if(event.key === 'Escape') return DEFAULT_TOOL;

  return event.key.length === 1 ? (BY_KEY.get(event.key.toUpperCase()) ?? null) : null;
}

export const cursorOf = id => TOOLS.find(tool => tool.id === id)?.cursor ?? 'default';
