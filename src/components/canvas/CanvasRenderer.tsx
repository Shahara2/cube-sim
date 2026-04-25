import React, { useCallback } from 'react';
import type { AppState, CellCoord } from '../../types';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';
import { isoProject } from '../../engine';

interface CanvasRendererProps {
  state: AppState;
  onCellClick?: (cell: CellCoord) => void;
}

export function CanvasRenderer({ state, onCellClick }: CanvasRendererProps) {
  const canvasRef = useCanvasRenderer(state);

  // ── Hit testing on click ──────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onCellClick) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1);
      const my = (e.clientY - rect.top) * scaleY / (window.devicePixelRatio || 1);

      const { rows, cols, viewMode, grid } = state; const N = Math.max(rows, cols);

      if (viewMode === 'iso') {
        // Find closest stack top to click point
        const maxH = Math.max(1, ...grid.flat());
        const scale = Math.min(34, Math.floor((canvas.width / (window.devicePixelRatio || 1)) / (N * 2.6)));
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const ox = w / 2;
        const oy = h * 0.52 + maxH * scale * 0.25;

        let best = Infinity, br = -1, bc = -1;
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const z = grid[r][c];
            const pt = isoProject(c + 0.5, r + 0.5, z, scale, ox, oy);
            const d = Math.hypot(mx - pt.x, my - pt.y);
            if (d < best) { best = d; br = r; bc = c; }
          }
        }
        if (best < scale * 2.5 && br >= 0) onCellClick({ row: br, col: bc });
      } else if (viewMode === 'top') {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const cellSize = Math.min(52, Math.floor((w - 60) / N));
        const totalW = N * cellSize;
        const totalH = N * cellSize;
        const ox = (w - totalW) / 2 + 20;
        const oy = (h - totalH) / 2;
        const c = Math.floor((mx - ox) / cellSize);
        const r = Math.floor((my - oy) / cellSize);
        if (r >= 0 && r < N && c >= 0 && c < N) onCellClick({ row: r, col: c });
      }
      // Ortho views: click doesn't select specific cell (ambiguous projection)
    },
    [state, onCellClick]
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
    />
  );
}
