// Auto layout of the `grid` mode (docs/EDITOR.md S4, E9): n photos in equal square
// cells on the 1000 x 1000 stage, no manual transforms. Pure functions, shared
// by the editor and the viewer.
const STAGE = 1000;

// space between cells and, for a loose grid, around the grid, in stage units
export const GAP = 10;

// A tight grid (docs/EDITOR.md S2.7) covers as much of the stage as possible: a small
// gap between the cells and none around the grid.
export const TIGHT_GAP = 4;

// the grid options of a document: { gap, margin, cols } (`cols` missing: the
// column count that gives the biggest cells)
export function gridOptions(layout = {}) {
  const tight = layout.fill === 'tight';
  const gap = Number.isFinite(layout.gap) ? layout.gap : tight ? TIGHT_GAP : GAP;

  const cover = layout.fill === 'stage';

  return { gap: cover && !Number.isFinite(layout.gap) ? TIGHT_GAP : gap, margin: tight || cover ? 0 : gap, ...(cover && { cover }), ...(Number.isInteger(layout.cols) && layout.cols >= 1 && { cols: layout.cols }) };
}

// the cells of an n-photo grid: [{ x, y, size }] in reading order. With `cols`
// the grid has that many columns (at most n); otherwise the column count that
// gives the biggest cells wins (the wider layout on a tie). An
// incomplete last row is centred, and the whole grid is centred on the stage.
export function gridCells(n, { gap = GAP, margin = gap, cols: fixed, cover = false } = {}) {
  if(!(n >= 1)) return [];
  if(cover) return coverCells(n, gap) ?? gridCells(n, { gap, margin: 0 });

  let cols = 1;
  let size = 0;

  for(let c = fixed ? Math.min(fixed, n) : 1; c <= (fixed ? Math.min(fixed, n) : n); c++) {
    const rows = Math.ceil(n / c);
    const s = Math.min((STAGE - 2 * margin - gap * (c - 1)) / c, (STAGE - 2 * margin - gap * (rows - 1)) / rows);

    if(s >= size) {
      size = s;
      cols = c;
    }
  }

  const rows = Math.ceil(n / cols);
  const top = (STAGE - (rows * size + (rows - 1) * gap)) / 2;
  const cells = [];

  for(let r = 0; r < rows; r++) {
    const count = Math.min(cols, n - r * cols);
    const left = (STAGE - (count * size + (count - 1) * gap)) / 2;

    for(let c = 0; c < count; c++) cells.push({ x: left + c * (size + gap), y: top + r * (size + gap), size });
  }

  return cells;
}

// The least part of a photo that has to stay on the stage in the `stage` fill (docs/EDITOR.md S4 point 9b)
const SEEN = 0.3;

// the part of [a, a + size] that lies inside [0, STAGE], as a fraction of size
const seen = (a, size) => Math.max(0, Math.min(a + size, STAGE) - Math.max(a, 0)) / size;

// Cover the whole stage with n equal squares, however many; the grid may stick out of the stage. r rows of q or q + 1 tiles
// (spread evenly), each row and the block centred; the size is the least that covers the stage both ways. The layout that
// crops the least photo area wins, a layout that hides (nearly) a whole photo is not used. -> cells, or null
export function coverCells(n, gap = TIGHT_GAP) {
  let best = null;

  for(let r = 1; r <= n; r++) {
    const q = Math.floor(n / r);
    const extra = n % r;

    if(q < 1) break;

    const size = Math.max((STAGE - (r - 1) * gap) / r, (STAGE - (q - 1) * gap) / q);
    const top = (STAGE - (r * size + (r - 1) * gap)) / 2;
    const cells = [];
    let lost = 0;
    let ok = true;

    for(let i = 0; i < r && ok; i++) {
      const count = q + (Math.floor(((i + 1) * extra) / r) - Math.floor((i * extra) / r));
      const left = (STAGE - (count * size + (count - 1) * gap)) / 2;
      const y = top + i * (size + gap);

      for(let j = 0; j < count; j++) {
        const x = left + j * (size + gap);
        const [fx, fy] = [seen(x, size), seen(y, size)];

        if(fx < SEEN || fy < SEEN) ok = false;

        lost += 1 - fx * fy;
        cells.push({ x, y, size });
      }
    }

    if(ok && (!best || lost < best.lost - 1e-9)) best = { lost, cells };
  }

  return best?.cells ?? null;
}

// the matrix of each photo, [a,b,c,d,e,f]: a photo's local space is its
// 1000 unit square, so photo i only scales by size / 1000 into its cell
export function gridLayout(n, layout) {
  return gridCells(n, gridOptions(layout)).map(({ x, y, size }) => [size / STAGE, 0, 0, size / STAGE, x, y]);
}

// --- how the viewer shows a grid (docs/EDITOR.md E135) ---------------------------

export const FLOWS = ['fit', 'page', 'scroll'];
export const AXES = ['h', 'v'];

// The pages of a grid as the viewer shows them: [{ from, count, w, h, cells }]
// in stage units, `cells` the squares of photos `from` .. `from + count`.
//  fit     every photo on one square stage (what the editor shows)
//  page    pages of cols x cols photos (3 x 3 when the columns are automatic)
//  scroll  one long stage, `cols` photos across and as many rows as needed;
//          axis `h` turns it: `cols` photos high, the columns follow
export function gridPlan(n, layout = {}) {
  const { gap, margin, cols, cover } = gridOptions(layout);
  const flow = FLOWS.includes(layout.flow) ? layout.flow : 'fit';
  const axis = AXES.includes(layout.axis) ? layout.axis : flow === 'scroll' ? 'v' : 'h';

  if(flow === 'fit' || !(n >= 1)) return { flow: 'fit', axis, pages: [{ from: 0, count: Math.max(0, n), w: STAGE, h: STAGE, cells: gridCells(n, { gap, margin, cols, cover }) }] };

  const lines = cols ?? 3;

  if(flow === 'page') {
    const per = lines * lines;
    const all = gridCells(per, { gap, margin, cols: lines });
    const pages = [];

    for(let from = 0; from < n; from += per) {
      const count = Math.min(per, n - from);

      pages.push({ from, count, w: STAGE, h: STAGE, cells: all.slice(0, count) });
    }

    return { flow, axis, pages };
  }

  const size = (STAGE - 2 * margin - gap * (lines - 1)) / lines;
  const along = Math.ceil(n / lines);
  const length = 2 * margin + along * size + (along - 1) * gap;
  const cells = Array.from({ length: n }, (_, i) => {
    const a = margin + Math.floor(i / lines) * (size + gap);
    const b = margin + (i % lines) * (size + gap);

    return axis === 'v' ? { x: b, y: a, size } : { x: a, y: b, size };
  });

  return { flow, axis, pages: [{ from: 0, count: n, w: axis === 'v' ? STAGE : length, h: axis === 'v' ? length : STAGE, cells }] };
}

// the matrices of a page's cells, [a,b,c,d,e,f] like gridLayout
export const cellMatrices = cells => cells.map(({ x, y, size }) => [size / STAGE, 0, 0, size / STAGE, x, y]);
