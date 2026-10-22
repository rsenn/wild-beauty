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
