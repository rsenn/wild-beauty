// Auto layout of the `grid` mode (EDITOR.md S4, E9): n photos in equal square
// cells on the 1000 x 1000 stage, no manual transforms. Pure functions, shared
// by the editor and the viewer.
const STAGE = 1000;

// space between cells and around the grid, in stage units
export const GAP = 10;

// the cells of an n-photo grid: [{ x, y, size }] in reading order. The column
// count that gives the biggest cells wins (the wider layout on a tie); an
// incomplete last row is centred, and the whole grid is centred on the stage.
export function gridCells(n, gap = GAP) {
  if(!(n >= 1)) return [];

  let cols = 1;
  let size = 0;

  for(let c = 1; c <= n; c++) {
    const s = Math.min((STAGE - gap * (c + 1)) / c, (STAGE - gap * (Math.ceil(n / c) + 1)) / Math.ceil(n / c));

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

// the matrix of each photo, [a,b,c,d,e,f]: photo i is shown whole (extend)
// and centred in its cell. A photo's local space has its long edge scaled to
// 1000, so every photo scales by size / 1000 and `aspect` (width / height of
// the photo; one number for all, or one per photo; default square) only
// decides the centring.
export function gridLayout(n, aspect = 1, gap = GAP) {
  return gridCells(n, gap).map(({ x, y, size }, i) => {
    const a = (Array.isArray(aspect) ? aspect[i] : aspect) || 1;
    const k = size / STAGE;
    const w = a >= 1 ? STAGE : STAGE * a;
    const h = a >= 1 ? STAGE / a : STAGE;

    return [k, 0, 0, k, x + (size - w * k) / 2, y + (size - h * k) / 2];
  });
}
