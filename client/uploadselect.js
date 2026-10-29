// Choosing a run of uploads by dragging over them (EDITOR.md E140). Pure functions
// over the cards as they are shown, in order. Only a finished upload (one with a
// `record`) can be chosen: a card still uploading or failed is skipped.

const same = (a, b) => String(a) === String(b);

// the ids of the finished cards from card `a` to card `b`, both included, whichever
// comes first; [] when either is not shown
export function rangeBetween(items, a, b) {
  const i = items.findIndex(item => same(item.id, a));
  const j = items.findIndex(item => same(item.id, b));

  if(i < 0 || j < 0) return [];

  return items.slice(Math.min(i, j), Math.max(i, j) + 1).filter(item => item.record).map(item => item.id);
}

// the cards with `ids` chosen on top of the ones already chosen, numbered from
// `counter` in the order given (display order: the order they land in the node)
export function choose(items, ids, counter) {
  const order = new Map(ids.map((id, k) => [String(id), counter + k + 1]));

  return items.map(item => (order.has(String(item.id)) && !item.selected ? { ...item, selected: true, selectedAt: order.get(String(item.id)) } : item));
}
