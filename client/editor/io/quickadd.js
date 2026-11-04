// "Add photos" in the node editor (EDITOR.md E141): the phone's file picker, one
// choice of up to the node's room, and the photos upload and land in the node in the
// order chosen, without going through the upload cards. Pure helpers; the button
// is components/QuickAdd.js.

// Which finished uploads can be added now. `items` are in the order chosen; the
// photos go in that order, so one still on its way holds back the ones after it,
// until it is done or has failed for good (`state` 'done' / 'failed'). `taken` is the
// set of ids already added; a failed one retried later is added when it is done,
// at the end. -> { records: [record, ...], ids: [id, ...], next }
export function readyToAdd(items, next, taken) {
  let at = next;

  while(at < items.length && (items[at].state === 'done' || items[at].state === 'failed')) at++;

  const ids = [];
  const records = [];

  items.forEach((item, i) => {
    if(i < at && item.state === 'done' && item.record && !taken.has(item.id)) {
      ids.push(item.id);
      records.push(item.record);
    }
  });

  return { records, ids, next: at };
}

// how many of `n` chosen files fit: the node takes `limit` photos in all, `have` are
// in it already and `waiting` are on their way. -> { take, skipped }
export function fitFiles(n, { limit, have = 0, waiting = 0 }) {
  const room = Math.max(0, limit - have - waiting);

  return { take: Math.min(n, room), skipped: Math.max(0, n - room) };
}
