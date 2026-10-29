// The height a gallery stage may take on a phone held upright: from where it starts
// down to the end of what follows it (the edit button), so the page does not scroll.
// Reads the layout, so it needs a browser. -> pixels, at least `min`

export function fitHeight(el, { min = 240, gap = 6 } = {}) {
  const view = globalThis.visualViewport?.height ?? globalThis.innerHeight;
  const box = el.getBoundingClientRect();
  const last = el.parentElement?.lastElementChild;
  const below = last && last !== el ? last.getBoundingClientRect().bottom - box.bottom + (parseFloat(getComputedStyle(last).marginBottom) || 0) : 0;

  return Math.max(min, Math.round(view - (box.top + (globalThis.scrollY || 0)) - below - gap));
}
