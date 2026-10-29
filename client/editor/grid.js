// Auto layout of the `grid` mode (EDITOR.md S4, E9): n photos in equal square
// cells on the 1000 x 1000 stage, no manual transforms. Pure functions, shared
// by the editor and the viewer.
const STAGE = 1000;

// space between cells and, for a loose grid, around the grid, in stage units
export const GAP = 10;

// A tight grid (EDITOR.md S2.7) covers as much of the stage as possible: a small
// gap between the cells and none around the grid.
export const TIGHT_GAP = 4;

// the grid options of a document: { gap, margin, cols } (`cols` missing: the
// column count that gives the biggest cells)
export function gridOptions(layout = {}) {
  const tight = layout.fill === 'tight';
  const gap = Number.isFinite(layout.gap) ? layout.gap : tight ? TIGHT_GAP : GAP;

  return { gap, margin: tight ? 0 : gap, ...(Number.isInteger(layout.cols) && layout.cols >= 1 && { cols: layout.cols }) };
}

// the cells of an n-photo grid: [{ x, y, size }] in reading order. With `cols`
// the grid has that many columns (at most n); otherwise the column count that
// gives the biggest cells wins (the wider layout on a tie). An
// incomplete last row is centred, and the whole grid is centred on the stage.
export function gridCells(n, { gap = GAP, margin = gap, cols: fixed } = {}) {
  if(!(n >= 1)) return [];

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

// the matrix of each photo, [a,b,c,d,e,f]: a photo's local space is its
// 1000 unit square, so photo i only scales by size / 1000 into its cell
export function gridLayout(n, layout) {
  return gridCells(n, gridOptions(layout)).map(({ x, y, size }) => [size / STAGE, 0, 0, size / STAGE, x, y]);
}
