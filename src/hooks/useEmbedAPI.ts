/**
 * useEmbedAPI — מאזין ל-postMessage מהדף המארח ומגיב אליו.
 * פועל אוטומטית כשהאפליקציה רצה בתוך iframe.
 */
import { useEffect, useCallback } from 'react';
import type { AppState } from '../types';
import type { Action } from '../types';
import { computeStats } from '../engine';

interface UseEmbedAPIProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function useEmbedAPI({ state, dispatch }: UseEmbedAPIProps) {
  const isEmbedded = window.self !== window.top;

  // Notify host of every state change
  useEffect(() => {
    if (!isEmbedded) return;
    const stats = computeStats(state.grid);
    window.parent.postMessage({
      type: 'STATE_CHANGED',
      grid: state.grid,
      rows: state.rows,
      cols: state.cols,
      stats: { total: stats.total, maxHeight: stats.maxHeight },
    }, '*');
  }, [state.grid, state.rows, state.cols, isEmbedded]);

  // Tell host we are ready
  useEffect(() => {
    if (!isEmbedded) return;
    window.parent.postMessage({ type: 'READY' }, '*');
  }, [isEmbedded]);

  // Listen for commands from host
  const handleMessage = useCallback((e: MessageEvent) => {
    const msg = e.data;
    if (!msg?.type) return;

    switch (msg.type) {
      case 'GET_STATE':
        window.parent.postMessage({
          type: 'STATE_RESPONSE',
          grid: state.grid,
          rows: state.rows,
          cols: state.cols,
        }, '*');
        break;

      case 'SET_STATE': {
        if (msg.rows)      dispatch({ type: 'SET_GRID_ROWS', rows: msg.rows });
        if (msg.cols)      dispatch({ type: 'SET_GRID_COLS', cols: msg.cols });
        if (msg.maxHeight) dispatch({ type: 'SET_MAX_HEIGHT', value: msg.maxHeight });
        // Set each cell
        if (Array.isArray(msg.grid)) {
          msg.grid.forEach((row: number[], r: number) => {
            row.forEach((val: number, c: number) => {
              dispatch({ type: 'SET_HEIGHT', row: r, col: c, value: val });
            });
          });
        }
        break;
      }

      case 'RESET':
        dispatch({ type: 'RESET' });
        break;

      case 'SET_VIEW':
        if (msg.viewMode) dispatch({ type: 'SET_VIEW', viewMode: msg.viewMode });
        break;

      case 'SET_MODE':
        if (msg.mode) dispatch({ type: 'SET_MODE', mode: msg.mode });
        break;
    }
  }, [state, dispatch]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return { isEmbedded };
}
