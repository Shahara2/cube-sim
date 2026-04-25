import { useEffect, useRef, useCallback } from 'react';
import type { AppState } from '../types';
import {
  isoProject,
  computeSilhouette,
  drawIsoCube,
  drawGhostTile,
  cubeColors,
  rowLabel,
  colLabel,
} from '../engine';

// ── Shared drawing constants ──────────────────────────────────────
const PAD = { l: 44, r: 16, t: 22, b: 28 };

export function useCanvasRenderer(state: AppState) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;

  const isDark = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  // ── Resize helper ────────────────────────────────────────────
  function resize(canvas: HTMLCanvasElement): { w: number; h: number } {
    const w = canvas.parentElement?.clientWidth ?? 400;
    const h = canvas.parentElement?.clientHeight ?? 380;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    return { w, h };
  }

  // ── ISO VIEW ─────────────────────────────────────────────────
  const drawIso = useCallback(
    (canvas: HTMLCanvasElement, state: AppState) => {
      const { w, h } = resize(canvas);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);
      const dk = isDark();
      const { grid, rows, cols, selectedCell, maxStackHeight } = state; const N = Math.max(rows, cols);

      const maxH = Math.max(1, ...grid.flat());
      const scale = Math.min(34, Math.floor(w / (N * 2.6)));
      const ox = w / 2;
      const oy = h * 0.52 + maxH * scale * 0.25;

      // Draw back-to-front for correct occlusion
      for (let r = N - 1; r >= 0; r--) {
        for (let c = N - 1; c >= 0; c--) {
          const h_val = grid[r][c];
          const isSel = selectedCell?.row === r && selectedCell?.col === c;

          if (h_val === 0) {
            drawGhostTile(ctx, c, r, scale, ox, oy, isSel, dk);
          } else {
            for (let z = 0; z < h_val; z++) {
              const cols = cubeColors(isSel && z === h_val - 1, dk);
              const stroke = isSel
                ? (dk ? 'rgba(0,0,0,.5)' : '#27500A')
                : (dk ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,.18)');
              drawIsoCube(ctx, c, r, z, scale, ox, oy, cols, stroke);
            }
          }

          // Height label on top stack
          if (h_val > 0) {
            const top = isoProject(c + 0.5, r + 0.5, h_val, scale, ox, oy);
            ctx.fillStyle = dk ? 'rgba(255,255,255,.7)' : 'rgba(0,0,40,.5)';
            ctx.font = `500 ${Math.min(12, scale * 0.45)}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(h_val), top.x, top.y - scale * 0.12);
          }
        }
      }

      // Row/col labels around the base
      ctx.font = `10px system-ui, sans-serif`;
      ctx.fillStyle = dk ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)';
      for (let c = 0; c < N; c++) {
        const pt = isoProject(c + 0.5, N, 0, scale, ox, oy);
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(colLabel(c), pt.x, pt.y + 4);
      }
      for (let r = 0; r < N; r++) {
        const pt = isoProject(0, r + 0.5, 0, scale, ox, oy);
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(rowLabel(r), pt.x - 6, pt.y);
      }
    },
    []
  );

  // ── ORTHOGRAPHIC VIEWS ────────────────────────────────────────
  const drawOrtho = useCallback(
    (canvas: HTMLCanvasElement, state: AppState) => {
      const { w, h } = resize(canvas);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);
      const dk = isDark();
      const { grid, rows, cols, viewMode, selectedCell } = state; const N = Math.max(rows, cols);

      if (viewMode === 'top') {
        // ── TOP VIEW — filled grid ──────────────────────────────
        const cellSize = Math.min(52, Math.floor((w - 60) / N));
        const totalW = N * cellSize;
        const totalH = N * cellSize;
        const ox = (w - totalW) / 2 + 20;
        const oy = (h - totalH) / 2;

        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const val = grid[r][c];
            const isSel = selectedCell?.row === r && selectedCell?.col === c;
            const x = ox + c * cellSize;
            const y = oy + r * cellSize;

            // intensity shading by height
            const intensity = val / (state.maxStackHeight || 9);
            ctx.fillStyle = isSel
              ? (dk ? '#1d4024' : '#EAF3DE')
              : val === 0
                ? (dk ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)')
                : dk
                  ? `rgba(26,90,${90 + Math.round(intensity * 100)},.${Math.round(40 + intensity * 50)})`
                  : `rgba(${Math.round(230 - intensity * 100)},${Math.round(196 - intensity * 40)},${Math.round(251 - intensity * 80)},1)`;

            ctx.strokeStyle = isSel
              ? (dk ? '#3d6b44' : '#3B6D11')
              : (dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)');
            ctx.lineWidth = isSel ? 1.5 : 0.5;
            ctx.beginPath();
            ctx.rect(x, y, cellSize, cellSize);
            ctx.fill(); ctx.stroke();

            if (val > 0) {
              ctx.fillStyle = isSel ? (dk ? '#97C459' : '#27500A') : (dk ? '#85B7EB' : '#0C447C');
              ctx.font = `500 ${Math.min(16, cellSize * 0.42)}px system-ui, sans-serif`;
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(String(val), x + cellSize / 2, y + cellSize / 2);
            }
          }
        }
        // Labels
        ctx.fillStyle = dk ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)';
        ctx.font = `10px system-ui, sans-serif`;
        for (let c = 0; c < N; c++) { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(colLabel(c), ox + c * cellSize + cellSize / 2, oy - 3); }
        for (let r = 0; r < N; r++) { ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(rowLabel(r), ox - 5, oy + r * cellSize + cellSize / 2); }
        return;
      }

      // ── ELEVATION VIEWS ─────────────────────────────────────
      const silhouette = computeSilhouette(grid, viewMode as any);
      const maxH = Math.max(1, ...grid.flat());
      const cellW = Math.min(52, Math.floor((w - PAD.l - PAD.r) / N));
      const cellH = Math.min(44, Math.floor((h - PAD.t - PAD.b) / maxH));
      const totalW = N * cellW;
      const ox = (w - totalW) / 2 + 12;
      const groundY = h - PAD.b;

      // Horizontal guide lines
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = 0.5;
      for (let z = 1; z <= maxH; z++) {
        const y = groundY - z * cellH;
        ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + totalW, y); ctx.stroke();
      }

      // Ground line
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ox - 8, groundY); ctx.lineTo(ox + totalW + 8, groundY); ctx.stroke();

      // Cube stacks
      silhouette.forEach(({ index, height, worldRow, worldCol }) => {
        const isSel = selectedCell != null && (
          (worldCol !== undefined && selectedCell.col === worldCol) ||
          (worldRow !== undefined && selectedCell.row === worldRow)
        );
        const x = ox + index * cellW;

        for (let z = 0; z < height; z++) {
          const y = groundY - (z + 1) * cellH;
          ctx.fillStyle = isSel
            ? (dk ? '#1d4024' : '#EAF3DE')
            : dk ? '#1a3a5c' : '#E6F1FB';
          ctx.strokeStyle = isSel
            ? (dk ? '#3d6b44' : '#3B6D11')
            : dk ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.18)';
          ctx.lineWidth = isSel ? 1.5 : 0.7;
          ctx.beginPath(); ctx.rect(x + 1, y + 1, cellW - 2, cellH - 2); ctx.fill(); ctx.stroke();
        }
      });

      // Height axis labels
      ctx.fillStyle = dk ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)';
      ctx.font = `9px system-ui, sans-serif`;
      for (let z = 0; z <= maxH; z++) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(String(z), ox - 5, groundY - z * cellH);
      }

      // Column labels
      silhouette.forEach(({ index, worldRow, worldCol }) => {
        const lbl = worldCol !== undefined ? colLabel(worldCol) : rowLabel(worldRow!);
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(lbl, ox + index * cellW + cellW / 2, groundY + 4);
      });
    },
    []
  );

  // ── Main draw dispatcher ─────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (state.viewMode === 'iso') {
      drawIso(canvas, state);
    } else {
      drawOrtho(canvas, state);
    }
  }, [state, drawIso, drawOrtho]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const obs = new ResizeObserver(draw);
    if (canvasRef.current?.parentElement) obs.observe(canvasRef.current.parentElement);
    return () => obs.disconnect();
  }, [draw]);

  return canvasRef;
}
