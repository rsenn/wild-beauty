// Photos waiting for an editor (EDITOR.md S2.5, E47). The "add to node" button
// of an upload card works whether an editor is open or not: it queues the
// photo here and announces it; an open editor takes it at once, and one that
// is just being opened takes it when it mounts.
export const ADD_EVENT = 'wb:add-photo';

const queue = [];

export function requestAdd(payload, target = globalThis.window) {
  queue.push(payload);
  target?.dispatchEvent(new CustomEvent(ADD_EVENT));
}

// everything queued, oldest first; the queue is empty afterwards
export const takePending = () => queue.splice(0);
