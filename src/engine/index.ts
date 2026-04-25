import type { ViewMode } from '../types';

export interface Point2D { x: number; y: number }

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

export function isoProject(wx: number, wy: number, wz: number, scale: number, ox: number, oy: number): Point2D {
  return {
    x: ox + (wx - wy) * scale * COS30,
    y: oy - wz * scale + (wx + wy) * scale * SIN30,
  };
}

export interface SilhouetteColumn {
  index: number; height: number; worldRow?: number; worldCol?: number;
}

export function computeSilhouette(grid: number[][], viewMode: Exclude<ViewMode, 'iso' | 'top'>): SilhouetteColumn[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const cols2: SilhouetteColumn[] = [];

  switch (viewMode) {
    case 'front':
      for (let c = 0; c < cols; c++)
        cols2.push({ index: c, height: Math.max(0, ...grid.map(r => r[c])), worldCol: c });
      break;
    case 'back':
      for (let c = cols - 1; c >= 0; c--)
        cols2.push({ index: cols - 1 - c, height: Math.max(0, ...grid.map(r => r[c])), worldCol: c });
      break;
    case 'left':
      for (let r = 0; r < rows; r++)
        cols2.push({ index: r, height: Math.max(0, ...grid[r]), worldRow: r });
      break;
    case 'right':
      for (let r = rows - 1; r >= 0; r--)
        cols2.push({ index: rows - 1 - r, height: Math.max(0, ...grid[r]), worldRow: r });
      break;
  }
  return cols2;
}

export interface GridStats {
  total: number; maxHeight: number; filledCells: number; totalCells: number;
  frontSilhouette: number[]; leftSilhouette: number[];
}

export function computeStats(grid: number[][]): GridStats {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let total = 0, maxHeight = 0, filledCells = 0;
  const frontSilhouette: number[] = Array(cols).fill(0);
  const leftSilhouette:  number[] = Array(rows).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h = grid[r][c];
      total += h;
      if (h > maxHeight) maxHeight = h;
      if (h > 0) filledCells++;
      if (h > frontSilhouette[c]) frontSilhouette[c] = h;
      if (h > leftSilhouette[r])  leftSilhouette[r]  = h;
    }
  }
  return { total, maxHeight, filledCells, totalCells: rows * cols, frontSilhouette, leftSilhouette };
}

export function drawIsoCube(
  ctx: CanvasRenderingContext2D,
  col: number, row: number, z: number,
  scale: number, ox: number, oy: number,
  colors: { top: string; left: string; right: string },
  strokeColor: string
): void {
  const p = (x: number, y: number, h: number) => isoProject(x, y, h, scale, ox, oy);
  const ftl=p(col,row,z+1), ftr=p(col+1,row,z+1), fbl=p(col,row,z), fbr=p(col+1,row,z);
  const btl=p(col,row+1,z+1), btr=p(col+1,row+1,z+1), bbl=p(col,row+1,z), bbr=p(col+1,row+1,z);
  function face(pts: Point2D[], fill: string) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
    ctx.strokeStyle=strokeColor; ctx.lineWidth=0.7; ctx.stroke();
  }
  face([ftr,fbr,bbr,btr], colors.right);
  face([ftl,fbl,bbl,btl], colors.left);
  face([ftl,ftr,btr,btl], colors.top);
}

export function drawGhostTile(
  ctx: CanvasRenderingContext2D,
  col: number, row: number,
  scale: number, ox: number, oy: number,
  isSelected: boolean, isDark: boolean
): void {
  const p = (x: number, y: number) => isoProject(x, y, 0, scale, ox, oy);
  const pts = [p(col,row),p(col+1,row),p(col+1,row+1),p(col,row+1)];
  ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
  ctx.closePath();
  ctx.fillStyle = isSelected
    ? (isDark ? 'rgba(60,120,60,.25)' : 'rgba(60,180,60,.15)')
    : (isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)');
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)';
  ctx.lineWidth = 0.5; ctx.fill(); ctx.stroke();
}

export const rowLabel = (r: number) => String.fromCharCode(0x41 + r);
export const colLabel = (c: number) => String(c + 1);

// cubeColors helper (used by canvas renderer)
export function cubeColors(isSelected: boolean, isDark: boolean) {
  if (isSelected) return isDark
    ? { top:'#3d6b44', left:'#1d4024', right:'#122818' }
    : { top:'#97C459', left:'#639922', right:'#3B6D11' };
  return isDark
    ? { top:'#3a5f8a', left:'#1a3a5c', right:'#0f2a45' }
    : { top:'#85B7EB', left:'#378ADD', right:'#185FA5' };
}
