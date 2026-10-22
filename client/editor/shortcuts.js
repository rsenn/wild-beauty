// Editor key shortcuts besides the tool keys (EDITOR.md S2.6, E40): undo,
// redo and delete. Typing in a field keeps its own keys (a text input has its
// own undo), so nothing here fires there.
import { inField } from './tools.js';

// -> 'undo' | 'redo' | 'delete' | null for a keydown
export function shortcutFor(event) {
  if(event.repeat && event.key !== 'Delete' && event.key !== 'Backspace') return null;
  if(inField(event.target)) return null;

  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if(mod && !event.altKey) {
    if(key === 'z') return event.shiftKey ? 'redo' : 'undo';
    if(key === 'y' && !event.shiftKey) return 'redo';

    return null;
  }

  if(!event.altKey && !event.shiftKey && (key === 'Delete' || key === 'Backspace')) return 'delete';

  return null;
}

const NUDGE = 1;
const NUDGE_BIG = 10;
const SCALE_STEP = 1.05;
const TURN_STEP = 0.05;

// The keyboard way to move, scale and turn the selection (EDITOR.md S2.4,
// "a keyboard alternative for every command"): arrows nudge by 1 unit (Shift:
// 10), + and - scale by 5 %, , and . turn by 3 degrees. Held keys repeat.
// -> { dx, dy, scale, rotate } with the identity values left out, or null
export function transformFor(event) {
  if(event.ctrlKey || event.metaKey || event.altKey || inField(event.target)) return null;

  const step = event.shiftKey ? NUDGE_BIG : NUDGE;

  switch(event.key) {
    case 'ArrowLeft':
      return { dx: -step };
    case 'ArrowRight':
      return { dx: step };
    case 'ArrowUp':
      return { dy: -step };
    case 'ArrowDown':
      return { dy: step };
    case '+':
    case '=':
      return { scale: SCALE_STEP };
    case '-':
    case '_':
      return { scale: 1 / SCALE_STEP };
    case ',':
    case '<':
      return { rotate: -TURN_STEP };
    case '.':
    case '>':
      return { rotate: TURN_STEP };
    default:
      return null;
  }
}

// `[` and `]` change the draw order of the selection (E51): one step back or
// forward, with Shift to the very back or front.
// -> 'down' | 'up' | 'back' | 'front' | null
export function orderFor(event) {
  if(event.ctrlKey || event.metaKey || event.altKey || inField(event.target)) return null;

  switch(event.key) {
    case '[':
      return 'down';
    case ']':
      return 'up';
    case '{':
      return 'back';
    case '}':
      return 'front';
    default:
      return null;
  }
}
